#!/usr/bin/env node
// Factory self-test — 2026-09-21.
//
// The Factory's rules are only real if a script refuses when they are broken.
// This file PROVES that, end to end, against a SCRATCH ledger: it never reads
// or writes the real factory/state/tasks.json (it sets JC_TASKS_PATH to a temp
// file, which task-state.mjs and release-gate-check.mjs both honour), never
// writes to src/ or public/, and never creates a commit.
//
// Sub-tests:
//   A  a normal task walks READY -> IN_PROGRESS -> REVIEW -> QA -> RELEASED
//   B  a review FAIL blocks RELEASED and can-deploy
//   C  a QA FAIL blocks RELEASED and can-deploy
//   D  release-gate-check refuses a src-touching commit with no task record
//   E  request-repair refuses the 2nd attempt (Auto Repair max 1)
//   F  an unresolved design_needed neither changes status nor stalls other
//      tasks — but does block can-deploy
//   G  the Ver.1 freeze check detects a violation
//   H  set-review refuses when reviewer === producer
//   I  set-qa refuses a PASS backed only by a free-text note
//
// Usage: node factory/harness/factory-self-test.mjs   (npm run selftest:factory)
// Exit code: 0 = all sub-tests pass, 1 = at least one failed.

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const TASK_STATE = join(HARNESS, "task-state.mjs");
const RELEASE_GATE = join(ROOT, "factory", "scripts", "release-gate-check.mjs");
const EVIDENCE_OUT = join(ROOT, "factory", "state", "self-test", "factory-self-test-2026-09-21.json");

const scratch = mkdtempSync(join(tmpdir(), "jc-factory-selftest-"));
const LEDGER = join(scratch, "tasks.json");

function git(gitArgs) {
  return spawnSync("git", gitArgs, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}
function run(cmd, cmdArgs, extraEnv = {}) {
  const env = { ...process.env, JC_TASKS_PATH: LEDGER, ...extraEnv };
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", env, maxBuffer: 32 * 1024 * 1024 });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}
const ts = (argv, extraEnv) => run("node", [TASK_STATE, ...argv], extraEnv);

const results = [];
function check(id, name, ok, detail) {
  results.push({ id, name, ok: Boolean(ok), detail: String(detail).slice(0, 600) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}. ${name}`);
  if (!ok) console.log(`      ${String(detail).slice(0, 600)}`);
}

// --- fixtures --------------------------------------------------------------
// Evidence files with exactly the provenance stamp codex-review.mjs writes.
// (This is a fixture on purpose: the point of the test is the LEDGER's
// refusal logic, and running a real Codex review here would need network,
// a subscription session, and minutes per case.)
function reviewEvidence(path, verdict, { reviewer = "codex", mechanism = "factory/harness/codex-review.mjs" } = {}) {
  const v = {
    verdict,
    score: verdict === "PASS" ? 82 : 55,
    blockers: [],
    high: verdict === "PASS" ? [] : ["self-test synthetic HIGH finding"],
    medium: [], low: [], evidence: [], recommended_actions: [],
  };
  const obj = { ok: true, status: "OK", label: "self-test", verdict: v, elapsed_sec: 1 };
  if (mechanism) { obj.review_mechanism = mechanism; obj.reviewer = reviewer; obj.prompt_file = "factory/harness/self-test-prompt.md"; obj.prompt_sha256 = "0".repeat(64); }
  writeFileSync(path, JSON.stringify(obj, null, 2));
  return path;
}
function qaEvidence(path, exitCode) {
  writeFileSync(path, JSON.stringify({
    ran_at: new Date().toISOString(),
    commit: "0000000000000000000000000000000000000000",
    checks: [{ script: "factory/harness/factory-self-test.mjs (synthetic)", exit_code: exitCode, summary: "self-test fixture" }],
  }, null, 2));
  return path;
}
const REVIEW_PASS = reviewEvidence(join(scratch, "review-pass.json"), "PASS");
const REVIEW_FAIL = reviewEvidence(join(scratch, "review-fail.json"), "FAIL");
const QA_PASS = qaEvidence(join(scratch, "qa-pass.json"), 0);
const QA_FAIL = qaEvidence(join(scratch, "qa-fail.json"), 1);

// A commit that changes NEITHER src/ nor public/: used as release_commit so
// the placeholder-marker scan and the Product Identity heuristic have a real
// (and legitimately empty) app diff to look at, instead of being skipped.
const recent = git(["log", "-n", "120", "--format=%H"]).stdout.split("\n").filter(Boolean);
function filesOf(sha) {
  return [...new Set(git(["show", "--name-only", "--format=", "-m", "--first-parent", sha]).stdout.split("\n").filter(Boolean))];
}
let cleanCommit = null;
let srcCommit = null;
for (const c of recent) {
  const f = filesOf(c);
  if (!f.length) continue;
  if (!cleanCommit && !f.some((x) => x.startsWith("src/") || x.startsWith("public/"))) cleanCommit = c;
  if (!srcCommit && f.some((x) => x.startsWith("src/") || x.startsWith("public/")) && git(["rev-parse", `${c}^`]).status === 0) srcCommit = c;
  if (cleanCommit && srcCommit) break;
}
if (!cleanCommit || !srcCommit) {
  console.error(`FAIL: could not find fixture commits in the last 120 (clean=${cleanCommit}, src=${srcCommit})`);
  process.exit(1);
}

/** Walk a task to the edge of release. Returns the task id. */
function seedTask(id, { review = "PASS", qa = "PASS", producer = "claude-code", releaseCommit = cleanCommit } = {}) {
  ts(["create", id, "--type", "self-test", "--producer", producer]);
  ts(["set-status", id, "IN_PROGRESS"]);
  ts(["set-status", id, "REVIEW"]);
  if (review) ts(["set-review", id, review, "--evidence", review === "PASS" ? REVIEW_PASS : REVIEW_FAIL]);
  ts(["set-status", id, "QA"]);
  if (qa) ts(["set-qa", id, qa, "--evidence", qa === "PASS" ? QA_PASS : QA_FAIL]);
  if (releaseCommit) ts(["set-release-commit", id, releaseCommit]);
  return id;
}
const statusOf = (id) => JSON.parse(ts(["status", id]).out).status;

// --- A: the happy path actually completes ----------------------------------
{
  const id = seedTask("selftest-a-normal");
  const rel = ts(["set-status", id, "RELEASED"]);
  const gate = ts(["can-deploy", id]);
  check("A", "normal task reaches RELEASED and passes can-deploy",
    rel.status === 0 && statusOf(id) === "RELEASED" && gate.status === 0,
    `set-status exit=${rel.status}, status=${statusOf(id)}, can-deploy exit=${gate.status} ${gate.out.slice(0, 300)}`);
}

// --- B: review FAIL is fatal ------------------------------------------------
{
  const id = seedTask("selftest-b-review-fail", { review: "FAIL" });
  const rel = ts(["set-status", id, "RELEASED"]);
  const gate = ts(["can-deploy", id]);
  const mentions = (rel.out + gate.out).includes("review_status");
  check("B", "review FAIL blocks RELEASED and can-deploy",
    rel.status === 1 && statusOf(id) !== "RELEASED" && gate.status === 1 && mentions,
    `set-status exit=${rel.status}, status=${statusOf(id)}, can-deploy exit=${gate.status}, names review_status=${mentions}`);
}

// --- C: QA FAIL is fatal ----------------------------------------------------
{
  const id = seedTask("selftest-c-qa-fail", { qa: "FAIL" });
  const rel = ts(["set-status", id, "RELEASED"]);
  const gate = ts(["can-deploy", id]);
  const mentions = (rel.out + gate.out).includes("qa_status");
  check("C", "QA FAIL blocks RELEASED and can-deploy",
    rel.status === 1 && statusOf(id) !== "RELEASED" && gate.status === 1 && mentions,
    `set-status exit=${rel.status}, status=${statusOf(id)}, can-deploy exit=${gate.status}, names qa_status=${mentions}`);
}

// --- D: CI gate refuses an unrecorded src-touching commit -------------------
{
  const r = run("node", [RELEASE_GATE, "--base", `${srcCommit}^`, "--head", srcCommit]);
  const namesCommit = (r.out + r.err).includes(srcCommit);
  check("D", "release-gate-check refuses a src-touching commit with no task record",
    r.status === 1 && namesCommit,
    `exit=${r.status}, names the commit=${namesCommit}: ${(r.err || r.out).split("\n").filter(Boolean).slice(-3).join(" | ").slice(0, 300)}`);
}

// --- E: Auto Repair max 1 ---------------------------------------------------
{
  const id = "selftest-e-repair";
  ts(["create", id, "--type", "self-test"]);
  const first = ts(["request-repair", id]);
  const second = ts(["request-repair", id]);
  check("E", "request-repair refuses the 2nd attempt",
    first.status === 0 && second.status === 1 && second.out.includes("repair_count"),
    `first exit=${first.status}, second exit=${second.status}`);
}

// --- F: DESIGN_NEEDED does not stall work ----------------------------------
{
  const id = seedTask("selftest-f-design-needed");
  const before = statusOf(id);
  const add = ts(["design-needed", id, "--add", "DN-SELFTEST", "--where", "src/v2/lunch/play/LunchMenuPlay.tsx:1", "--note", "self-test"]);
  const afterAdd = statusOf(id);
  // an unrelated task must be completely unaffected by the above
  const other = seedTask("selftest-f-unrelated");
  const otherRel = ts(["set-status", other, "RELEASED"]);
  const gate = ts(["can-deploy", id]);
  const namesDn = gate.out.includes("design_needed") && gate.out.includes("DN-SELFTEST");
  // the task itself keeps moving too
  const moved = ts(["set-status", id, "IN_PROGRESS"]);
  check("F", "unresolved design_needed keeps the task movable and other tasks free, but blocks can-deploy",
    add.status === 0 && afterAdd === before && otherRel.status === 0 && statusOf(other) === "RELEASED" &&
    moved.status === 0 && statusOf(id) === "IN_PROGRESS" && gate.status === 1 && namesDn,
    `status ${before}->${afterAdd} (unchanged=${afterAdd === before}), unrelated RELEASED=${statusOf(other)}, later move exit=${moved.status}, can-deploy exit=${gate.status}, names DN=${namesDn}`);
}

// --- G: the Ver.1 freeze guard really detects drift -------------------------
// Point VER1_TAG at a commit whose Ver.1 src/public differs from the working
// tree. Nothing in the real src/ is touched — the "violation" is the
// comparison baseline, not the code.
{
  let driftCommit = null;
  for (const c of recent) {
    const d = git(["diff", "--name-only", c, "--", "src", "public", ":(exclude)src/v2", ":(exclude)public/assets/v2"]).stdout.trim();
    if (d) { driftCommit = c; break; }
  }
  if (!driftCommit) {
    check("G", "ver1-freeze-check detects a violation", false, "could not find a commit whose Ver.1 src/public differs from the working tree — cannot simulate drift");
  } else {
    const r = run("npm", ["run", "--silent", "check:ver1-freeze"], { VER1_TAG: driftCommit });
    const saysFail = (r.out + r.err).includes("FAIL: Ver.1 files differ");
    check("G", "ver1-freeze-check detects a violation",
      r.status !== 0 && saysFail,
      `VER1_TAG=${driftCommit.slice(0, 8)} exit=${r.status}, reported drift=${saysFail}`);
  }
}

// --- H: a producer cannot review itself ------------------------------------
{
  const id = "selftest-h-self-review";
  ts(["create", id, "--type", "self-test", "--producer", "codex"]); // producer == the evidence's reviewer
  const r = ts(["set-review", id, "PASS", "--evidence", REVIEW_PASS]);
  const rec = JSON.parse(ts(["status", id]).out);
  check("H", "set-review refuses when reviewer === producer",
    r.status === 1 && r.out.includes("producer") && rec.review_status === null,
    `exit=${r.status}, review_status=${JSON.stringify(rec.review_status)}`);
}

// --- I: a QA PASS needs machine-checkable evidence --------------------------
{
  const id = "selftest-i-qa-note";
  ts(["create", id, "--type", "self-test"]);
  const note = ts(["set-qa", id, "PASS", "--evidence-note", "I played it and it felt fine"]);
  const bare = ts(["set-qa", id, "PASS"]);
  const rec = JSON.parse(ts(["status", id]).out);
  check("I", "set-qa refuses a PASS backed only by a free-text note (and refuses no evidence at all)",
    note.status === 1 && bare.status !== 0 && rec.qa_status === null,
    `note exit=${note.status}, no-evidence exit=${bare.status}, qa_status=${JSON.stringify(rec.qa_status)}`);
}

// --- evidence + summary -----------------------------------------------------
const overall = results.every((r) => r.ok) ? "PASS" : "FAIL";
mkdirSync(dirname(EVIDENCE_OUT), { recursive: true });
writeFileSync(EVIDENCE_OUT, JSON.stringify({
  ran_at: new Date().toISOString(),
  script: "factory/harness/factory-self-test.mjs",
  ledger: "scratch (JC_TASKS_PATH) — the real factory/state/tasks.json is never read or written",
  fixture_commits: { clean: cleanCommit, src_touching: srcCommit },
  results,
  overall,
}, null, 2) + "\n");
rmSync(scratch, { recursive: true, force: true });

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} sub-tests passed — overall ${overall}`);
console.log(`evidence: ${EVIDENCE_OUT.slice(ROOT.length + 1)}`);
process.exit(overall === "PASS" ? 0 : 1);
