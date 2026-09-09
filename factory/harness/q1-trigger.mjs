#!/usr/bin/env node
// Q1 Autonomous Game Factory — triggers, prioritization, WIP, reaudit,
// real-user evidence. 2026-09-08 (Human master request §25-27).
//
// This is the Factory's ENTRY POINT. Every way work can start is a
// trigger; a trigger becomes (a) a task-state.mjs task (the canonical
// ledger the deploy gate already reads), (b) a q1-pipeline.mjs pipeline
// entering at the right stage, or (c) a REAUDIT_REQUIRED mark on the
// pipelines actually affected by a shared change.
//
// Usage:
//   fire NEW_Q1_REQUEST --game-id <id> --profession "<name>" [--priority N]
//   fire LEGACY_AUDIT_REQUIRED --game-type <gameType> [--game-id <id>]    # -> reverse audit needed (q1-legacy-audit.mjs)
//   fire QA_FAILURE --game-id <id> --code <FAILURE_CODE> --reason "..." --evidence <path>
//   fire STANDARD_UPDATED|SHARED_UI_CHANGED|SHARED_ART_CHANGED|DEPENDENCY_CHANGED --dependency <dep_id> --reason "..." [--all]
//   evidence --file <real-user-evidence.json>                            # REAL_USER_FEEDBACK -> routed failure or backlog
//   next                                                                  # anti-idle: what to work on now (WIP-aware)
//   wip                                                                   # active pipeline count vs limit
//   dependency <game_id> --add <dep_id>                                   # declare a shared dependency for reaudit routing

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  TRIGGERS, REAUDIT_TRIGGERS, FAILURE_CODES, FAILURE_ROUTES, WIP_MAX_ACTIVE_PIPELINES, ACTIVE_STATES,
  validateRealUserEvidence, CLASSIFICATION_ENTRY_STAGE,
} from "./q1-factory-schema.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const INDEX_PATH = join(ROOT, "factory", "state", "q1-pipeline-index.json");
const TRIGGER_LOG = join(ROOT, "factory", "state", "q1-trigger-log.jsonl");
const EVIDENCE_LOG = join(ROOT, "factory", "state", "feedback", "real-user-evidence.jsonl");
const QUEUE_PATH = join(ROOT, "factory", "state", "legacy", "rebuild-queue.json");
const PIPELINE = join(HARNESS, "q1-pipeline.mjs");
const TASK_STATE = join(HARNESS, "task-state.mjs");

const args = process.argv.slice(2);
function flag(name, dflt = undefined) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}
function fail(msg) {
  console.error(msg);
  process.exit(2);
}
function now() {
  return new Date().toISOString();
}
function loadIndex() {
  return existsSync(INDEX_PATH) ? JSON.parse(readFileSync(INDEX_PATH, "utf8")) : { pipelines: {} };
}
function run(script, a) {
  const r = spawnSync("node", [script, ...a], { cwd: ROOT, encoding: "utf8" });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* not json */ }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, json };
}
function logTrigger(rec) {
  mkdirSync(dirname(TRIGGER_LOG), { recursive: true });
  appendFileSync(TRIGGER_LOG, JSON.stringify({ at: now(), ...rec }) + "\n");
}
function activeCount(idx) {
  return Object.values(idx.pipelines).filter((p) => ACTIVE_STATES.has(p.state)).length;
}
function wipReport(idx) {
  const active = Object.values(idx.pipelines).filter((p) => ACTIVE_STATES.has(p.state)).map((p) => ({ game_id: p.game_id, state: p.state }));
  return { active: active.length, limit: WIP_MAX_ACTIVE_PIPELINES, available: Math.max(0, WIP_MAX_ACTIVE_PIPELINES - active.length), active_pipelines: active };
}

const [cmd, ...rest] = args;

switch (cmd) {
  case "wip": {
    console.log(JSON.stringify(wipReport(loadIndex()), null, 2));
    break;
  }

  case "dependency": {
    const gameId = rest[0];
    const dep = flag("add");
    if (!gameId || !dep) fail("usage: dependency <game_id> --add <dep_id>");
    const p = JSON.parse(readFileSync(join(ROOT, "factory", "projects", gameId, "q1-pipeline.json"), "utf8"));
    p.depends_on = [...new Set([...(p.depends_on ?? []), dep])];
    p.updated_at = now();
    writeFileSync(join(ROOT, "factory", "projects", gameId, "q1-pipeline.json"), JSON.stringify(p, null, 2) + "\n");
    const idx = loadIndex();
    if (idx.pipelines[gameId]) { idx.pipelines[gameId].depends_on = p.depends_on; writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + "\n"); }
    console.log(JSON.stringify({ accepted: true, game_id: gameId, depends_on: p.depends_on }, null, 2));
    break;
  }

  case "fire": {
    const trigger = rest[0];
    if (!TRIGGERS.includes(trigger)) fail(`usage: fire <${TRIGGERS.join("|")}> ...`);
    const idx = loadIndex();

    if (trigger === "NEW_Q1_REQUEST") {
      const gameId = flag("game-id");
      const profession = flag("profession");
      if (!gameId || !profession) fail('fire NEW_Q1_REQUEST --game-id <id> --profession "<name>" [--priority N]');
      const wip = wipReport(idx);
      if (wip.available <= 0 && !hasFlag("force")) {
        logTrigger({ trigger, game_id: gameId, result: "QUEUED_WIP_FULL", wip });
        console.log(JSON.stringify({ accepted: false, queued: true, reason: `WIP full (${wip.active}/${wip.limit}) — close an active pipeline first (WIP LIMIT, autonomous-execution.md)`, wip }, null, 2));
        process.exit(1);
      }
      const t = run(TASK_STATE, ["create", `q1-new-${gameId}`, "--type", "game-content", "--identity-impact", "NONE", "--review-required"]);
      const p = run(PIPELINE, ["init", gameId, "--profession", profession, "--trigger", trigger]);
      if (p.status !== 0) { console.error(p.stdout || p.stderr); process.exit(1); }
      run(PIPELINE, ["link-task", gameId, `q1-new-${gameId}`]);
      logTrigger({ trigger, game_id: gameId, task_id: `q1-new-${gameId}`, result: "PIPELINE_STARTED", entry_stage: "PROFESSION_RESEARCH" });
      console.log(JSON.stringify({ accepted: true, trigger, game_id: gameId, task_id: `q1-new-${gameId}`, task_created: t.status === 0, entry_stage: "PROFESSION_RESEARCH", next: "q1-pipeline.mjs submit <game_id> fact_sheet --file ..." }, null, 2));
      break;
    }

    if (trigger === "LEGACY_AUDIT_REQUIRED") {
      const gameType = flag("game-type");
      if (!gameType) fail("fire LEGACY_AUDIT_REQUIRED --game-type <gameType>");
      logTrigger({ trigger, game_type: gameType, result: "REVERSE_AUDIT_REQUIRED" });
      console.log(JSON.stringify({ accepted: true, trigger, game_type: gameType, next: `node factory/harness/q1-legacy-audit.mjs record --file <reverse-audit.json>  (then 'queue' and 'start')` }, null, 2));
      break;
    }

    if (trigger === "QA_FAILURE") {
      const gameId = flag("game-id");
      const code = flag("code");
      const reason = flag("reason");
      const evidence = flag("evidence");
      if (!gameId || !code || !reason || !evidence) fail('fire QA_FAILURE --game-id <id> --code <FAILURE_CODE> --reason "..." --evidence <path>');
      const r = run(PIPELINE, ["fail", gameId, "--code", code, "--reason", reason, "--evidence", evidence]);
      logTrigger({ trigger, game_id: gameId, code, result: r.json?.decision?.action ?? "ERROR" });
      console.log(r.stdout || r.stderr);
      process.exit(r.status);
    }

    // reaudit family
    if (REAUDIT_TRIGGERS.has(trigger)) {
      const dep = flag("dependency");
      const reason = flag("reason");
      if (!reason) fail(`fire ${trigger} --dependency <dep_id> --reason "..." [--all]`);
      const all = hasFlag("all");
      if (!dep && !all) fail(`fire ${trigger} needs --dependency <dep_id> (affected-scope routing) or --all (STANDARD_UPDATED only)`);
      if (all && trigger !== "STANDARD_UPDATED") fail("--all is only allowed for STANDARD_UPDATED (a standard change can affect every released game); shared UI/art/dependency changes must name the dependency");
      const affected = Object.values(idx.pipelines).filter((p) => {
        if (!["RELEASED", "RELEASE_CANDIDATE", "GAME_DESIGN_READY", "IMPL_QA_PASSED", "IMPLEMENTED", "ART_APPROVED"].includes(p.state)) return false;
        return all || (p.depends_on ?? []).includes(dep);
      });
      const marked = [];
      for (const p of affected) {
        const r = run(PIPELINE, ["mark-reaudit", p.game_id, "--reason", reason, "--trigger", trigger]);
        if (r.status === 0) marked.push(p.game_id);
      }
      logTrigger({ trigger, dependency: dep ?? "*", reason, affected: marked });
      console.log(JSON.stringify({ accepted: true, trigger, dependency: dep ?? "*", affected_pipelines: marked, not_affected: Object.keys(idx.pipelines).filter((g) => !marked.includes(g)) }, null, 2));
      break;
    }

    if (trigger === "REAL_USER_FEEDBACK") fail("use: evidence --file <real-user-evidence.json> (REAL_USER_FEEDBACK is filed as evidence, then routed)");
    break;
  }

  // ------------------------------------------------------- real user evidence
  // Observation and interpretation are separate fields by schema. Severity
  // HIGH/BLOCKER on a released game routes a structured failure into the
  // pipeline (which returns it to affected_stage via the failure router and
  // interrupts the Continuous Product Loop per autonomous-execution.md);
  // LOW/MEDIUM accumulates in the evidence log for prioritization only.
  case "evidence": {
    const file = flag("file");
    if (!file) fail("usage: evidence --file <real-user-evidence.json>");
    const e = JSON.parse(readFileSync(file, "utf8"));
    const v = validateRealUserEvidence(e);
    if (!v.ok) { console.log(JSON.stringify({ accepted: false, problems: v.problems }, null, 2)); process.exit(1); }
    mkdirSync(dirname(EVIDENCE_LOG), { recursive: true });
    appendFileSync(EVIDENCE_LOG, JSON.stringify({ ...e, filed_at: now() }) + "\n");
    const idx = loadIndex();
    const p = idx.pipelines[e.game_id];
    let routing = { action: "LOGGED_ONLY", reason: "severity LOW/MEDIUM accumulates for prioritization; no pipeline return" };
    if (["HIGH", "BLOCKER"].includes(e.severity)) {
      if (!p) {
        routing = { action: "NO_PIPELINE", reason: `game ${e.game_id} has no q1-pipeline yet — file LEGACY_AUDIT_REQUIRED (reverse audit) with this evidence attached`, next: `node factory/harness/q1-trigger.mjs fire LEGACY_AUDIT_REQUIRED --game-type ${e.game_id}` };
      } else {
        const route = FAILURE_ROUTES[e.suggested_failure_code];
        const returnTo = route.return_to.includes(e.affected_stage) ? e.affected_stage : route.return_to[0];
        const r = run(PIPELINE, ["fail", e.game_id, "--code", e.suggested_failure_code, "--reason", `REAL_USER_EVIDENCE ${e.evidence_id}: ${e.interpretation}`, "--evidence", file, "--return-to", returnTo]);
        routing = { action: "RETURNED_TO_STAGE", return_to: returnTo, decision: r.json?.decision ?? null, state: r.json?.state ?? null, interrupt: "USER LEARNING LOOP takes priority over the Continuous Product Loop (autonomous-execution.md)" };
      }
    }
    logTrigger({ trigger: "REAL_USER_FEEDBACK", evidence_id: e.evidence_id, game_id: e.game_id, severity: e.severity, routing });
    console.log(JSON.stringify({ accepted: true, evidence_id: e.evidence_id, severity: e.severity, routing }, null, 2));
    break;
  }

  // ---------------------------------------------------------------- next
  // Anti-idle: if WIP is available and the legacy queue has an actionable
  // item, say so; never let the queue sit idle while WIP is free.
  case "next": {
    const idx = loadIndex();
    const wip = wipReport(idx);
    const candidates = [];
    // 1. pipelines needing attention (returned / reaudit / repairing)
    for (const p of Object.values(idx.pipelines)) {
      if (["RETURNED", "REPAIRING", "REDESIGNING", "REAUDIT_REQUIRED", "UNDER_REVIEW"].includes(p.state)) candidates.push({ kind: "resume_pipeline", game_id: p.game_id, state: p.state, priority: p.state === "REAUDIT_REQUIRED" ? 0 : 1 });
    }
    // 2. legacy queue
    let queue = { items: [] };
    if (existsSync(QUEUE_PATH)) queue = JSON.parse(readFileSync(QUEUE_PATH, "utf8"));
    for (const q of queue.items.filter((x) => x.status === "queued")) {
      candidates.push({ kind: "start_legacy_rebuild", game_type: q.game_type, classification: q.classification, entry_stage: CLASSIFICATION_ENTRY_STAGE[q.classification], priority: 2 + (q.priority_score ?? 9) / 10 });
    }
    candidates.sort((a, b) => a.priority - b.priority);
    const pick = candidates.find((c) => c.kind === "resume_pipeline") ?? (wip.available > 0 ? candidates[0] : null);
    const idle = !pick;
    const out = { wip, candidates: candidates.slice(0, 10), next: pick, idle, note: idle && candidates.length ? "WIP full: finish an active pipeline before starting a queued legacy rebuild" : idle ? "queue empty and nothing to resume" : null };
    logTrigger({ trigger: "NEXT", next: pick, wip });
    console.log(JSON.stringify(out, null, 2));
    process.exit(idle && candidates.length && wip.available > 0 ? 1 : 0);
  }

  default:
    console.error("commands: fire <TRIGGER> | evidence --file | next | wip | dependency <game_id> --add <dep>");
    process.exit(2);
}
