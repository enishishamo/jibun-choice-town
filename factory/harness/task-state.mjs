#!/usr/bin/env node
// Factory task state machine — 2026-09-07 (factory-architecture-audit-
// 2026-09-06.md §15/§16: "Auto Repair max 1" and "release gate" existed
// only as text a Claude session had to remember to obey). This is the
// minimal mechanical version: one JSON ledger (factory/state/tasks.json)
// + this CLI to read/mutate it. No framework, no database, no server —
// consistent with the rest of factory/harness/.
//
// States: READY | IN_PROGRESS | REVIEW | REPAIR | QA | READY_FOR_RELEASE
//       | RELEASED | READY_FOR_USER_TESTING | BLOCKED
//       | HUMAN_DECISION_REQUIRED | SUPERSEDED
//
// Usage:
//   node factory/harness/task-state.mjs create <task_id> --type <type> [--identity-impact NONE|POSSIBLE|YES] [--review-required]
//   node factory/harness/task-state.mjs status [<task_id>]
//   node factory/harness/task-state.mjs list [--status <STATUS>]
//   node factory/harness/task-state.mjs set-status <task_id> <STATUS> [--note "..."]
//   node factory/harness/task-state.mjs request-repair <task_id>            # fails if repair_count already >= 1
//   node factory/harness/task-state.mjs reset-iteration <task_id> --reason "<human decision>"
//   node factory/harness/task-state.mjs set-review <task_id> <PASS|FAIL> --evidence <path>   # evidence MUST be codex-review.mjs-shaped
//   node factory/harness/task-state.mjs set-qa <task_id> <PASS|FAIL> [--evidence <path-or-note>]
//   node factory/harness/task-state.mjs set-identity-impact <task_id> <NONE|POSSIBLE|YES>
//   node factory/harness/task-state.mjs approve-identity-impact <task_id> --note "<human approval text>"
//   node factory/harness/task-state.mjs block <task_id> --reason "..." [--human-decision]
//   node factory/harness/task-state.mjs set-release-commit <task_id> <sha>
//   node factory/harness/task-state.mjs can-deploy <task_id>               # exit 0 = allowed, prints reason either way
//
// Exit codes: 0 = success/allowed, 1 = refused/blocked (by design, not error), 2 = usage error.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateReviewEvidenceFile } from "./review-evidence.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const STATE_PATH = join(ROOT, "factory", "state", "tasks.json");

const STATUSES = [
  "READY", "IN_PROGRESS", "REVIEW", "REPAIR", "QA", "READY_FOR_RELEASE",
  "RELEASED", "READY_FOR_USER_TESTING", "BLOCKED", "HUMAN_DECISION_REQUIRED",
  "SUPERSEDED",
];
const IDENTITY_IMPACTS = ["NONE", "POSSIBLE", "YES"];

function loadState() {
  if (!existsSync(STATE_PATH)) return { tasks: {} };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}
function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}
function now() {
  return new Date().toISOString();
}
function fail(msg) {
  console.error(msg);
  process.exit(2);
}
function log(taskRec, event, detail) {
  taskRec.history ??= [];
  taskRec.history.push({ at: now(), event, ...detail });
}

const args = process.argv.slice(2);
function flag(name, dflt = undefined) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const [cmd, ...rest] = args;
const state = loadState();

function getTask(id, { mustExist = true } = {}) {
  const t = state.tasks[id];
  if (!t && mustExist) fail(`no such task: ${id} (run 'create' first, or check factory/state/tasks.json)`);
  return t;
}

switch (cmd) {
  case "create": {
    const id = rest[0];
    if (!id) fail("usage: create <task_id> --type <type> [--identity-impact NONE|POSSIBLE|YES] [--review-required]");
    if (state.tasks[id]) fail(`task ${id} already exists — use set-status/reset-iteration instead of re-creating`);
    const type = flag("type", "unspecified");
    const identityImpact = flag("identity-impact", "NONE");
    if (!IDENTITY_IMPACTS.includes(identityImpact)) fail(`bad --identity-impact: ${identityImpact}`);
    const rec = {
      task_id: id,
      task_type: type,
      status: "READY",
      repair_count: 0,
      review_status: null,
      review_evidence: null,
      review_required: hasFlag("review-required"),
      qa_status: null,
      qa_evidence: null,
      deploy_status: null,
      release_commit: null,
      blocked_reason: null,
      human_decision_required: false,
      product_identity_impact: identityImpact,
      identity_impact_approved: false,
      identity_impact_approval_note: null,
      created_at: now(),
      updated_at: now(),
      history: [],
    };
    log(rec, "created", { type, identityImpact });
    state.tasks[id] = rec;
    saveState(state);
    console.log(JSON.stringify(rec, null, 2));
    break;
  }

  case "status": {
    const id = rest[0];
    if (id) {
      console.log(JSON.stringify(getTask(id), null, 2));
    } else {
      console.log(JSON.stringify(state.tasks, null, 2));
    }
    break;
  }

  case "list": {
    const wantStatus = flag("status");
    const out = Object.values(state.tasks).filter((t) => !wantStatus || t.status === wantStatus);
    console.log(JSON.stringify(out, null, 2));
    break;
  }

  case "set-status": {
    const [id, status] = rest;
    if (!id || !status) fail("usage: set-status <task_id> <STATUS>");
    if (!STATUSES.includes(status)) fail(`bad status: ${status}. Must be one of ${STATUSES.join(", ")}`);
    const t = getTask(id);
    const from = t.status;
    t.status = status;
    t.updated_at = now();
    log(t, "status_change", { from, to: status, note: flag("note") ?? null });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // The mechanical heart of "Auto Repair max 1" (audit §16#... / autonomous-execution.md).
  case "request-repair": {
    const id = rest[0];
    if (!id) fail("usage: request-repair <task_id>");
    const t = getTask(id);
    if (t.repair_count >= 1) {
      log(t, "repair_refused", { repair_count: t.repair_count });
      saveState(state);
      console.log(JSON.stringify({ allowed: false, reason: `repair_count is already ${t.repair_count} — AUTO REPAIR RULE caps automatic repair at 1 attempt per task. Use 'reset-iteration --reason' if a Human Decision authorizes a new iteration, or move to BLOCKED/HUMAN_DECISION_REQUIRED.`, task: t }, null, 2));
      process.exit(1);
    }
    t.repair_count += 1;
    t.status = "REPAIR";
    t.updated_at = now();
    log(t, "repair_granted", { repair_count: t.repair_count });
    saveState(state);
    console.log(JSON.stringify({ allowed: true, repair_count: t.repair_count, task: t }, null, 2));
    break;
  }

  case "reset-iteration": {
    const id = rest[0];
    const reason = flag("reason");
    if (!id || !reason) fail('usage: reset-iteration <task_id> --reason "<human decision text>"');
    const t = getTask(id);
    const priorCount = t.repair_count;
    t.repair_count = 0;
    t.status = "READY";
    t.updated_at = now();
    log(t, "iteration_reset", { reason, prior_repair_count: priorCount });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // The mechanical heart of "Mandatory Independent Review" (audit §16#6):
  // evidence MUST validate as codex-review.mjs-shaped — a codex-task.mjs
  // (or hand-written) result cannot satisfy this.
  case "set-review": {
    const [id, verdict] = rest;
    if (!id || !["PASS", "FAIL"].includes(verdict)) fail("usage: set-review <task_id> <PASS|FAIL> --evidence <path>");
    const evidencePath = flag("evidence");
    if (!evidencePath) fail("--evidence <path-to-codex-review.mjs-result.json> is required");
    const check = validateReviewEvidenceFile(evidencePath);
    if (!check.ok) {
      console.log(JSON.stringify({ accepted: false, reason: check.reason }, null, 2));
      process.exit(1);
    }
    if (check.verdict !== verdict) {
      console.log(JSON.stringify({ accepted: false, reason: `--evidence file's own verdict.verdict is "${check.verdict}", which does not match the claimed "${verdict}"` }, null, 2));
      process.exit(1);
    }
    const t = getTask(id);
    t.review_status = verdict;
    t.review_evidence = evidencePath;
    t.updated_at = now();
    log(t, "review_recorded", { verdict, evidencePath, score: check.score });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "set-qa": {
    const [id, verdict] = rest;
    if (!id || !["PASS", "FAIL"].includes(verdict)) fail("usage: set-qa <task_id> <PASS|FAIL> [--evidence <path-or-note>]");
    const t = getTask(id);
    t.qa_status = verdict;
    t.qa_evidence = flag("evidence") ?? null;
    t.updated_at = now();
    log(t, "qa_recorded", { verdict, evidence: t.qa_evidence });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "set-identity-impact": {
    const [id, impact] = rest;
    if (!id || !IDENTITY_IMPACTS.includes(impact)) fail(`usage: set-identity-impact <task_id> <${IDENTITY_IMPACTS.join("|")}>`);
    const t = getTask(id);
    t.product_identity_impact = impact;
    // changing the impact classification invalidates any prior approval —
    // never let a stale approval silently cover a newly-escalated impact.
    t.identity_impact_approved = false;
    t.identity_impact_approval_note = null;
    t.updated_at = now();
    log(t, "identity_impact_set", { impact });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "approve-identity-impact": {
    const id = rest[0];
    const note = flag("note");
    if (!id || !note) fail('usage: approve-identity-impact <task_id> --note "<human approval text>"');
    const t = getTask(id);
    if (t.product_identity_impact === "NONE") fail(`task ${id} has product_identity_impact=NONE — nothing to approve`);
    t.identity_impact_approved = true;
    t.identity_impact_approval_note = note;
    t.updated_at = now();
    log(t, "identity_impact_approved", { note });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "block": {
    const id = rest[0];
    const reason = flag("reason");
    if (!id || !reason) fail('usage: block <task_id> --reason "..." [--human-decision]');
    const t = getTask(id);
    t.status = hasFlag("human-decision") ? "HUMAN_DECISION_REQUIRED" : "BLOCKED";
    t.blocked_reason = reason;
    t.human_decision_required = hasFlag("human-decision");
    t.updated_at = now();
    log(t, "blocked", { reason, human_decision: hasFlag("human-decision") });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "set-release-commit": {
    const [id, shaArg] = rest;
    if (!id || !shaArg) fail("usage: set-release-commit <task_id> <sha>");
    // 2026-09-07 self-test finding: a short sha ("59f43a1") stored as-is
    // never string-matches the full 40-char sha release-gate-check.mjs
    // reads from `git rev-parse HEAD` in CI — always normalize to the
    // full sha at write time so the two sides can never silently drift.
    const resolved = spawnSync("git", ["rev-parse", shaArg], { cwd: ROOT, encoding: "utf8" });
    if (resolved.status !== 0) fail(`could not resolve ${shaArg} as a git commit: ${resolved.stderr}`);
    const sha = resolved.stdout.trim();
    const t = getTask(id);
    t.release_commit = sha;
    t.updated_at = now();
    log(t, "release_commit_set", { sha, given: shaArg });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // THE canonical release gate. Both a Claude session and CI
  // (factory/scripts/release-gate-check.mjs) call this same logic so
  // there is exactly one place the rule is encoded.
  case "can-deploy": {
    const id = rest[0];
    if (!id) fail("usage: can-deploy <task_id>");
    const t = getTask(id);
    const reasons = [];
    if (t.status === "BLOCKED" || t.status === "HUMAN_DECISION_REQUIRED") {
      reasons.push(`task status is ${t.status} (blocked_reason: ${t.blocked_reason ?? "none recorded"})`);
    }
    if (t.product_identity_impact !== "NONE" && !t.identity_impact_approved) {
      reasons.push(`product_identity_impact=${t.product_identity_impact} requires an explicit approve-identity-impact record, which is missing — QA passing alone can never clear this`);
    }
    if (t.qa_status !== "PASS") {
      reasons.push(`qa_status is ${JSON.stringify(t.qa_status)}, must be PASS`);
    }
    if (t.review_required && t.review_status !== "PASS") {
      reasons.push(`review_required=true but review_status is ${JSON.stringify(t.review_status)}, must be PASS with valid canonical evidence (see set-review)`);
    }
    const allowed = reasons.length === 0;
    console.log(JSON.stringify({ allowed, task_id: id, reasons: allowed ? [] : reasons, task: t }, null, 2));
    process.exit(allowed ? 0 : 1);
  }

  default:
    console.error("commands: create | status | list | set-status | request-repair | reset-iteration | set-review | set-qa | set-identity-impact | approve-identity-impact | block | set-release-commit | can-deploy");
    process.exit(2);
}
