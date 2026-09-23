#!/usr/bin/env node
// Shared validator for "canonical independent review evidence" — a JSON
// result file that a Game-Quality/Release gate may accept as proof an
// independent review actually ran and actually enforced the two-axis
// gate + blockers/high downgrade.
//
// 2026-09-07 (factory-architecture-audit-2026-09-06.md §15/§16#6): the
// audit found that codex-review.mjs (which hard-codes the two-axis gate
// and the blockers/high -> FAIL downgrade) exists, but a session can
// still just call codex-task.mjs (a generic Codex delegator with NO gate
// logic) and eyeball the result itself -- nothing stopped that
// substitution. This module gives every gate-checking script (task-
// state.mjs, release-gate-check.mjs) ONE shared definition of what
// "real" review evidence looks like, so the substitution can't quietly
// happen again in a second place with a slightly different check.
//
// This does NOT re-run the review. It only checks that a given result
// JSON has the SHAPE and internal INVARIANTS that only codex-review.mjs's
// own code path produces — a codex-task.mjs output (no `verdict` object,
// no forced downgrade) structurally cannot satisfy this.

import { readFileSync } from "node:fs";

// 2026-09-21 (R3 — role separation must be MECHANICAL): shape alone could
// not prove WHICH script produced a file, so a hand-written JSON with the
// right fields was indistinguishable from a real run. codex-review.mjs now
// stamps `review_mechanism` / `prompt_file` / `prompt_sha256` into every
// result it writes, and this validator REQUIRES that stamp. Evidence files
// written before that change are still readable, but only when the caller
// explicitly passes allowLegacy (set-review --allow-legacy-evidence), which
// is recorded in the task history — never silently.
export const CANONICAL_REVIEW_MECHANISM = "factory/harness/codex-review.mjs";
// The reviewer identity implied by each accepted mechanism. Review
// independence (R3b) is decided by comparing this to the task's producer,
// so it must come from the evidence file, never from a caller flag.
const MECHANISM_REVIEWER = { [CANONICAL_REVIEW_MECHANISM]: "codex" };

/**
 * @param {unknown} obj - parsed JSON of a candidate evidence file
 * @param {{allowLegacy?: boolean}} [opts]
 * @returns {{ok: boolean, reason?: string, verdict?: string, score?: number}}
 */
export function validateReviewEvidence(obj, opts = {}) {
  if (!obj || typeof obj !== "object") return { ok: false, reason: "not an object" };
  if (obj.ok !== true) return { ok: false, reason: `evidence.ok must be true (got ${JSON.stringify(obj.ok)}) — a failed/unavailable/malformed Codex run is never usable as passing evidence` };
  if (obj.status !== "OK") return { ok: false, reason: `evidence.status must be "OK" (got ${JSON.stringify(obj.status)})` };
  const v = obj.verdict;
  if (!v || typeof v !== "object") return { ok: false, reason: "evidence.verdict must be an object — a codex-task.mjs-shaped result (no `verdict` wrapper) is not accepted" };
  if (!["PASS", "FAIL", "HUMAN_REQUIRED"].includes(v.verdict)) return { ok: false, reason: `bad verdict.verdict: ${JSON.stringify(v.verdict)}` };
  if (typeof v.score !== "number" || v.score < 0 || v.score > 100) return { ok: false, reason: `bad verdict.score: ${JSON.stringify(v.score)}` };
  for (const k of ["blockers", "high", "medium", "low", "evidence", "recommended_actions"]) {
    if (!Array.isArray(v[k])) return { ok: false, reason: `verdict.${k} must be an array` };
  }
  // The single most important invariant this whole module exists to check:
  // a producer cannot claim PASS while blockers/high are non-empty. Real
  // codex-review.mjs output can never violate this (it downgrades before
  // writing the file) -- if it's violated here, either the file was hand-
  // edited/tampered, or it came from a script that skipped the downgrade.
  if (v.verdict === "PASS" && (v.blockers.length > 0 || v.high.length > 0)) {
    return { ok: false, reason: "verdict is PASS but blockers/high are non-empty — this could not have come from codex-review.mjs's own downgrade logic" };
  }
  const ca = v.career_authenticity_score;
  const gq = v.game_quality_score;
  if (typeof ca === "number" || typeof gq === "number") {
    if (typeof ca !== "number" || typeof gq !== "number") return { ok: false, reason: "both axis scores must be present together, or neither" };
    if (v.score > Math.min(ca, gq)) return { ok: false, reason: `score (${v.score}) exceeds min(career_authenticity_score, game_quality_score) (${Math.min(ca, gq)}) — codex-review.mjs's two-axis gate always takes the minimum` };
  }
  // Provenance stamp (R3): who/what produced this file.
  const mechanism = typeof obj.review_mechanism === "string" ? obj.review_mechanism : null;
  if (!mechanism && !opts.allowLegacy) {
    return {
      ok: false,
      reason: `evidence is missing review_mechanism — only a file written by ${CANONICAL_REVIEW_MECHANISM} carries that stamp. Re-run the review, or (for a pre-2026-09-21 file) pass --allow-legacy-evidence to set-review, which is recorded in the task history.`,
    };
  }
  if (mechanism && !MECHANISM_REVIEWER[mechanism]) {
    return { ok: false, reason: `unknown review_mechanism ${JSON.stringify(mechanism)} — the only canonical independent-review script is ${CANONICAL_REVIEW_MECHANISM}` };
  }
  return {
    ok: true,
    verdict: v.verdict,
    score: v.score,
    blockers: v.blockers,
    high: v.high,
    review_mechanism: mechanism,
    // A legacy (unstamped) file can never prove independence — the task's
    // review_independent therefore stays false and deployBlockers refuses.
    reviewer: mechanism ? MECHANISM_REVIEWER[mechanism] : null,
    prompt_file: typeof obj.prompt_file === "string" ? obj.prompt_file : null,
    prompt_sha256: typeof obj.prompt_sha256 === "string" ? obj.prompt_sha256 : null,
    legacy: !mechanism,
  };
}

/** Load a JSON file from disk and validate it. Throws neither — returns the same {ok, reason} shape, with reason covering read/parse failure too. */
export function validateReviewEvidenceFile(path, opts = {}) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    return { ok: false, reason: `could not read ${path}: ${e.message}` };
  }
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: `could not parse ${path} as JSON: ${e.message}` };
  }
  return { ...validateReviewEvidence(obj, opts), path };
}

// ---------------------------------------------------------------------------
// QA evidence (2026-09-21, R2d). Before this, `set-qa --evidence` accepted any
// free string, so "qa PASS" could be a sentence a session typed about itself.
// A machine-checkable QA evidence file records WHICH scripts ran and what they
// exited with; a PASS requires at least one check and every exit_code === 0.
// A human/free-text QA note is still allowed (set-qa --evidence-note) but is
// recorded as kind="note" and can never satisfy the release gate for a PASS.
//
// Shape: { ran_at, commit, checks: [{ script, exit_code, summary }] }
// ---------------------------------------------------------------------------

/**
 * @param {unknown} obj - parsed JSON of a candidate QA evidence file
 * @param {{requirePass?: boolean}} [opts] - requirePass: every exit_code must be 0
 */
export function validateQaEvidence(obj, opts = {}) {
  if (!obj || typeof obj !== "object") return { ok: false, reason: "not an object" };
  if (typeof obj.ran_at !== "string" || !obj.ran_at) return { ok: false, reason: "qa evidence needs a ran_at timestamp (ISO string)" };
  if (typeof obj.commit !== "string" || !obj.commit) return { ok: false, reason: "qa evidence needs a commit (the sha the checks ran against)" };
  if (!Array.isArray(obj.checks) || obj.checks.length === 0) {
    return { ok: false, reason: "qa evidence needs a non-empty checks[] — 'QA passed' with no recorded script run is not evidence" };
  }
  for (const [i, c] of obj.checks.entries()) {
    if (!c || typeof c !== "object") return { ok: false, reason: `checks[${i}] is not an object` };
    if (typeof c.script !== "string" || !c.script) return { ok: false, reason: `checks[${i}].script must be the command/script that ran` };
    if (!Number.isInteger(c.exit_code)) return { ok: false, reason: `checks[${i}].exit_code must be an integer (got ${JSON.stringify(c.exit_code)})` };
    if (typeof c.summary !== "string") return { ok: false, reason: `checks[${i}].summary must be a string` };
  }
  const failed = obj.checks.filter((c) => c.exit_code !== 0);
  if (opts.requirePass && failed.length > 0) {
    return { ok: false, reason: `qa evidence records ${failed.length} non-zero exit(s) (${failed.map((c) => `${c.script}=${c.exit_code}`).join(", ")}) — that cannot be a PASS` };
  }
  return { ok: true, checks: obj.checks.length, all_zero: failed.length === 0, commit: obj.commit, ran_at: obj.ran_at };
}

/** Load a QA evidence JSON file from disk and validate it. */
export function validateQaEvidenceFile(path, opts = {}) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    return { ok: false, reason: `could not read ${path}: ${e.message}` };
  }
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: `could not parse ${path} as JSON: ${e.message}` };
  }
  return { ...validateQaEvidence(obj, opts), path };
}

// CLI usage:
//   node factory/harness/review-evidence.mjs <path-to-review-result.json> [--allow-legacy]
//   node factory/harness/review-evidence.mjs <path-to-qa-evidence.json> --qa [--require-pass]
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node factory/harness/review-evidence.mjs <path-to-codex-review-result.json> [--allow-legacy] | <path-to-qa-evidence.json> --qa [--require-pass]");
    process.exit(2);
  }
  const argv = process.argv.slice(3);
  const r = argv.includes("--qa")
    ? validateQaEvidenceFile(path, { requirePass: argv.includes("--require-pass") })
    : validateReviewEvidenceFile(path, { allowLegacy: argv.includes("--allow-legacy") });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
