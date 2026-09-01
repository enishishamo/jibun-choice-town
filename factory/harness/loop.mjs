#!/usr/bin/env node
// Minimal autonomous loop engine (state machine + audit log).
//
// PRODUCE -> INDEPENDENT REVIEW -> PASS | FAIL | HUMAN_REQUIRED
//   FAIL -> REPAIR -> RE-REVIEW -> ... until PASS or max_iterations
//
// Roles: the producer/repairer (Claude Code session) does the actual work and
// drives this engine via CLI commands; the engine owns state transitions,
// iteration limits, review invocation (independent reviewer = Codex), and the
// append-only log. Reaching max_iterations NEVER auto-passes: the run stops
// with stop_reason=max_iterations_reached.
//
// Commands:
//   start   --task "<desc>" --artifact <path> [--producer claude] [--reviewer codex]
//           [--max-iterations 3]                        -> prints run_id
//   produce-done <run_id> [--notes "..."]               -> phase: review-ready
//   review  <run_id> --prompt-file <path> [--timeout-sec 600]
//                                                       -> runs codex, records verdict
//   repair-done <run_id> [--actions "..."]              -> phase: review-ready (iteration++)
//   human   <run_id> --reason "..."                     -> stop with HUMAN_REQUIRED
//   status  <run_id>
//
// State: factory/state/runs/<run_id>.json  Log: factory/state/runs/<run_id>.log.jsonl

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HARNESS_DIR, "..", "state", "runs");
mkdirSync(RUNS_DIR, { recursive: true });

const [cmd, ...rest] = process.argv.slice(2);
function argOf(name, dflt) {
  const i = rest.indexOf(name);
  return i >= 0 && rest[i + 1] !== undefined ? rest[i + 1] : dflt;
}
function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function runPath(id) {
  return join(RUNS_DIR, `${id}.json`);
}
function loadRun(id) {
  if (!existsSync(runPath(id))) fail(`unknown run_id: ${id}`);
  return JSON.parse(readFileSync(runPath(id), "utf8"));
}
function saveRun(run) {
  writeFileSync(runPath(run.run_id), JSON.stringify(run, null, 2));
}
function logEvent(id, event) {
  appendFileSync(join(RUNS_DIR, `${id}.log.jsonl`), JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n");
}
function finish(run, stopReason) {
  run.phase = "finished";
  run.stop_reason = stopReason;
  run.finished_at = new Date().toISOString();
  saveRun(run);
  logEvent(run.run_id, { type: "finish", stop_reason: stopReason, verdict: run.verdict });
}

switch (cmd) {
  case "start": {
    const task = argOf("--task") || fail("--task required");
    const artifact = argOf("--artifact") || fail("--artifact required");
    const run = {
      run_id: `run-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}-${Math.random().toString(36).slice(2, 6)}`,
      task,
      artifact,
      producer: argOf("--producer", "claude"),
      reviewer: argOf("--reviewer", "codex"),
      phase: "produce",
      iteration: 1,
      max_iterations: Number(argOf("--max-iterations", "3")),
      verdict: null,
      issues: [],
      repair_actions: [],
      reviews: [],
      started_at: new Date().toISOString(),
      finished_at: null,
      stop_reason: null,
    };
    saveRun(run);
    logEvent(run.run_id, { type: "start", task, artifact });
    console.log(run.run_id);
    break;
  }

  case "produce-done": {
    const run = loadRun(rest[0] || fail("run_id required"));
    if (run.phase !== "produce") fail(`produce-done invalid in phase ${run.phase}`);
    run.phase = "review-ready";
    saveRun(run);
    logEvent(run.run_id, { type: "produce-done", iteration: run.iteration, notes: argOf("--notes", "") });
    console.log(JSON.stringify({ run_id: run.run_id, phase: run.phase }));
    break;
  }

  case "review": {
    const run = loadRun(rest[0] || fail("run_id required"));
    if (run.phase !== "review-ready") fail(`review invalid in phase ${run.phase} (need review-ready)`);
    const promptFile = argOf("--prompt-file") || fail("--prompt-file required");
    const timeoutSec = argOf("--timeout-sec", "600");
    run.phase = "review";
    saveRun(run);
    logEvent(run.run_id, { type: "review-start", iteration: run.iteration, promptFile });

    const resFile = join(RUNS_DIR, `${run.run_id}.review-${run.iteration}.json`);
    const r = spawnSync(
      "node",
      [join(HARNESS_DIR, "codex-review.mjs"), "--prompt-file", promptFile, "--timeout-sec", timeoutSec, "--out", resFile, "--label", `iter-${run.iteration}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    let result;
    try {
      result = JSON.parse(readFileSync(resFile, "utf8"));
    } catch {
      result = { ok: false, status: "CODEX_ERROR", error: `adapter crashed: ${(r.stderr || "").slice(-500)}` };
    }
    run.reviews.push({ iteration: run.iteration, status: result.status, file: resFile, elapsed_sec: result.elapsed_sec ?? null });

    if (!result.ok) {
      // Reviewer unavailable/broken must NOT hang or auto-pass the run.
      run.verdict = "HUMAN_REQUIRED";
      run.issues.push(`reviewer failure: ${result.status} — ${result.error || ""}`);
      finish(run, `reviewer_failure:${result.status}`);
      console.log(JSON.stringify({ run_id: run.run_id, phase: run.phase, verdict: run.verdict, stop_reason: run.stop_reason }));
      process.exit(1);
    }

    const v = result.verdict;
    run.verdict = v.verdict;
    run.issues = [...v.blockers.map((b) => `BLOCKER: ${b}`), ...v.high.map((h) => `HIGH: ${h}`)];
    logEvent(run.run_id, { type: "review-done", iteration: run.iteration, verdict: v.verdict, score: v.score, blockers: v.blockers.length, high: v.high.length });

    if (v.verdict === "PASS") {
      finish(run, "passed");
    } else if (v.verdict === "HUMAN_REQUIRED") {
      finish(run, "reviewer_requested_human");
    } else if (run.iteration >= run.max_iterations) {
      finish(run, "max_iterations_reached"); // explicit stop, never auto-PASS
    } else {
      run.phase = "repair";
      saveRun(run);
    }
    console.log(JSON.stringify({ run_id: run.run_id, phase: run.phase, verdict: run.verdict, score: v.score, stop_reason: run.stop_reason, review_file: resFile }));
    break;
  }

  case "repair-done": {
    const run = loadRun(rest[0] || fail("run_id required"));
    if (run.phase !== "repair") fail(`repair-done invalid in phase ${run.phase}`);
    const actions = argOf("--actions", "");
    run.repair_actions.push({ iteration: run.iteration, actions });
    run.iteration += 1;
    run.phase = "review-ready";
    saveRun(run);
    logEvent(run.run_id, { type: "repair-done", iteration: run.iteration - 1, actions });
    console.log(JSON.stringify({ run_id: run.run_id, phase: run.phase, iteration: run.iteration }));
    break;
  }

  case "human": {
    const run = loadRun(rest[0] || fail("run_id required"));
    run.verdict = "HUMAN_REQUIRED";
    run.issues.push(argOf("--reason", "unspecified"));
    finish(run, "human_required");
    console.log(JSON.stringify({ run_id: run.run_id, verdict: run.verdict, stop_reason: run.stop_reason }));
    break;
  }

  case "status": {
    const run = loadRun(rest[0] || fail("run_id required"));
    console.log(JSON.stringify(run, null, 2));
    break;
  }

  default:
    fail(`unknown command: ${cmd}. Commands: start, produce-done, review, repair-done, human, status`);
}
