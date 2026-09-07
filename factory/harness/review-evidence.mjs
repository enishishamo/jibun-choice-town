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

/**
 * @param {unknown} obj - parsed JSON of a candidate evidence file
 * @returns {{ok: boolean, reason?: string, verdict?: string, score?: number}}
 */
export function validateReviewEvidence(obj) {
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
  return { ok: true, verdict: v.verdict, score: v.score, blockers: v.blockers, high: v.high };
}

/** Load a JSON file from disk and validate it. Throws neither — returns the same {ok, reason} shape, with reason covering read/parse failure too. */
export function validateReviewEvidenceFile(path) {
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
  return { ...validateReviewEvidence(obj), path };
}

// CLI usage: node factory/harness/review-evidence.mjs <path-to-result.json>
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node factory/harness/review-evidence.mjs <path-to-codex-review-result.json>");
    process.exit(2);
  }
  const r = validateReviewEvidenceFile(path);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
