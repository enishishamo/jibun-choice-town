#!/usr/bin/env node
// Automated gameplay QA for Q1 clue_join (legacy-clue-join redesign,
// t1d-flexible-commit-and-defend). Simulates player strategies against
// src/q1/clueJoinLogic.ts directly — same rules/strategies as the
// design-stage design-sim.mjs, now against the shipped module: thoughtless
// play must stay at/below chance, every legitimate evidence combination
// must win, shuffle must be per-session/id-based (never position-based),
// and DiagnoseGame.tsx must never leak the answer through its "?" text.
//
// Usage: node factory/harness/gameplay-qa-clue-join.mjs
import { readFileSync } from "node:fs";
import {
  ALLOWED_MAX, CORE_MINIMUM, CORRECT_DIAGNOSIS, DIAGNOSES, EVIDENCE, EVIDENCE_IDS,
  evidenceAcceptable, isWinningAttempt, MAX_ATTEMPTS, OPTIONAL_SUPPORT, shuffledIds,
} from "../../src/q1/clueJoinLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

const DIAGNOSIS_IDS = DIAGNOSES.map((d) => d.id);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BUDGET = MAX_ATTEMPTS;
function attempt(diagnosis, selected) { return { win: isWinningAttempt(diagnosis, selected) }; }
function play(planFn, seed) {
  const rand = mulberry32(seed);
  for (let i = 0; i < BUDGET; i++) {
    const { diagnosis, evidence } = planFn(i, rand);
    if (attempt(diagnosis, evidence).win) return { win: true, attempts: i + 1 };
  }
  return { win: false, attempts: BUDGET };
}
const randDiagnosis = (rand) => DIAGNOSIS_IDS[Math.floor(rand() * DIAGNOSIS_IDS.length)];
const randSubset = (rand) => { let s; do { s = EVIDENCE_IDS.filter(() => rand() < 0.5); } while (s.length === 0); return s; };
const byFlag = (flag) => EVIDENCE.filter((e) => e[flag]).map((e) => e.id);

// ---------------- pure rule-level checks (mirror design-sim.mjs) ----------------
{
  check("core minimum is exactly {lab, xray}", [...CORE_MINIMUM].sort().join(",") === "lab,xray");
  check("optional support is exactly {talk, exam}", [...OPTIONAL_SUPPORT].sort().join(",") === "exam,talk");
  check("allowed max is exactly {lab, xray, talk, exam} — spo2/bp excluded", [...ALLOWED_MAX].sort().join(",") === "exam,lab,talk,xray");
  check("correct diagnosis is pneumonia", CORRECT_DIAGNOSIS === "pneumonia");

  let winning = 0;
  for (const d of DIAGNOSIS_IDS) for (let mask = 1; mask < 64; mask++) {
    const s = EVIDENCE_IDS.filter((_, i) => mask & (1 << i));
    if (isWinningAttempt(d, s)) winning++;
  }
  check("exactly 4 winning joint combos out of 252 (4 diagnoses x 63 non-empty evidence subsets)", winning === 4, `${winning}`);

  check("all 4 legitimate evidence variants win with pneumonia", ["lab,xray", "lab,xray,talk", "lab,xray,exam", "lab,xray,talk,exam"].every((s) => evidenceAcceptable(s.split(","))));
  check("core minimum alone (no talk/exam) is NOT sufficient without pneumonia committed", !isWinningAttempt("heart_failure", ["lab", "xray"]));
  check("missing a core item (xray) fails even with everything else", !evidenceAcceptable(["lab", "talk", "exam"]));
  check("including a forbidden item (spo2) fails an otherwise-correct set", !evidenceAcceptable(["lab", "xray", "spo2"]));
  check("including a forbidden item (bp) fails an otherwise-correct set", !evidenceAcceptable(["lab", "xray", "bp"]));
  check("wrong diagnosis with perfect evidence still fails (diagnosis AND evidence both required)", !isWinningAttempt("asthma", ["lab", "xray", "talk", "exam"]));
}

// ---------------- content-blind strategies stay at/below chance ----------------
const N = 8000;
const strategies = {
  legitimate_core_minimum: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["lab", "xray"] }), 1),
  legitimate_plus_talk: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["lab", "xray", "talk"] }), 1),
  legitimate_plus_exam: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["lab", "xray", "exam"] }), 1),
  legitimate_plus_both: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["lab", "xray", "talk", "exam"] }), 1),
  select_all: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: [...EVIDENCE_IDS] }), seed),
  keep_only_has_number: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: byFlag("hasNumber") }), seed),
  keep_only_no_number: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: EVIDENCE_IDS.filter((id) => !byFlag("hasNumber").includes(id)) }), seed),
  random_evidence_random_diagnosis: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: randSubset(rand) }), seed),
  // fixed-position exploit under per-session shuffle: always first-displayed diagnosis, always
  // display positions 1,2,4,5 of the evidence order (0-indexed 0,1,3,4) — must fall back to chance
  first_displayed_plus_positions_1245: (seed) => {
    const rand = mulberry32(seed);
    const diagnosisOrder = shuffledIds(DIAGNOSIS_IDS, rand);
    const evidenceOrder = shuffledIds(EVIDENCE_IDS, rand);
    const evidence = [evidenceOrder[0], evidenceOrder[1], evidenceOrder[3], evidenceOrder[4]];
    return attempt(diagnosisOrder[0], evidence);
  },
  fixed_positions_1245_diagnosis_cycled_2_tries: (seed) => {
    const rand = mulberry32(seed);
    const diagnosisOrder = shuffledIds(DIAGNOSIS_IDS, rand);
    const evidenceOrder = shuffledIds(EVIDENCE_IDS, rand);
    const evidence = [evidenceOrder[0], evidenceOrder[1], evidenceOrder[3], evidenceOrder[4]];
    for (let i = 0; i < BUDGET; i++) if (attempt(diagnosisOrder[i], evidence).win) return { win: true };
    return { win: false };
  },
};
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) if (fn(i * 7919 + 13).win) w++; return Number((w / N).toFixed(4)); }
const results = Object.fromEntries(Object.entries(strategies).map(([k, f]) => [k, rate(f)]));

check("legitimate core-minimum wins every case", results.legitimate_core_minimum === 1);
check("legitimate +talk wins every case", results.legitimate_plus_talk === 1);
check("legitimate +exam wins every case", results.legitimate_plus_exam === 1);
check("legitimate +both optional wins every case", results.legitimate_plus_both === 1);
check("select_all never wins", results.select_all === 0);
check("has-number-only heuristic never wins", results.keep_only_has_number === 0);
check("no-number-only heuristic never wins", results.keep_only_no_number === 0);
check("random evidence + random diagnosis stays below 5%", results.random_evidence_random_diagnosis < 0.05, `${results.random_evidence_random_diagnosis}`);
check("position-leak (single try) matches chance baseline 1/60, not higher", Math.abs(results.first_displayed_plus_positions_1245 - (1 / DIAGNOSIS_IDS.length) * (1 / 15)) < 0.01, `${results.first_displayed_plus_positions_1245}`);
check("position-leak (2-try cycled) matches chance baseline 1/30, not higher", Math.abs(results.fixed_positions_1245_diagnosis_cycled_2_tries - (2 / DIAGNOSIS_IDS.length) * (1 / 15)) < 0.01, `${results.fixed_positions_1245_diagnosis_cycled_2_tries}`);

// ---------------- shuffle-lifecycle correctness ----------------
{
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(shuffledIds(DIAGNOSIS_IDS, mulberry32(i)).join(","));
  check("diagnosis order varies across sessions (not a fixed order)", seen.size >= 5, `${seen.size} distinct orders / 40`);
  const seenE = new Set();
  for (let i = 0; i < 40; i++) seenE.add(shuffledIds(EVIDENCE_IDS, mulberry32(i)).join(","));
  check("evidence order varies across sessions (not a fixed order)", seenE.size >= 10, `${seenE.size} distinct orders / 40`);
  check("shuffledIds never drops or duplicates ids", shuffledIds(EVIDENCE_IDS, mulberry32(7)).slice().sort().join(",") === [...EVIDENCE_IDS].sort().join(","));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/DiagnoseGame.tsx", import.meta.url), "utf8");
  check("shuffled order is generated once per mount via useState(newOrders), not recomputed every render", src.includes("useState(newOrders)"));
  check("scoring reads committed/selected ids, never the display order arrays, when checking a win", (() => {
    const line = src.split("\n").find((l) => l.includes("isWinningAttempt("));
    return !!line && line.includes("committed") && line.includes("selected");
  })());
  check("restart regenerates orders (reshuffle on retry/new case)", /restart[\s\S]{0,200}setOrders\(newOrders\(\)\)/.test(src));
  // answer-leak check: the "?" typical-pattern text for each diagnosis candidate must never
  // name or imply which candidate is the actual correct one (fact_sheet tendency wording only,
  // no candidate's pattern text may contain another candidate's name or a verdict word)
  const verdictWords = ["正解", "これが答え", "正しい診断は", "correct"];
  check("no diagnosis candidate pattern text contains an answer-leak verdict phrase", DIAGNOSES.every((d) => verdictWords.every((w) => !d.pattern.includes(w))));
  check("no diagnosis candidate's pattern text names a different candidate", DIAGNOSES.every((d) => DIAGNOSES.filter((o) => o.id !== d.id).every((o) => !d.pattern.includes(o.name.split("（")[0]))));
  // public-view boundary: the component must never render the CORRECT_DIAGNOSIS id/constant
  // directly as a hint before the child has committed and submitted (no pre-reveal) — the
  // import line is exempt (it doesn't render anything), only usage sites matter
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  const beforeSuccessBlock = body.split('outcome === "success"')[0];
  check("CORRECT_DIAGNOSIS is never used before the success screen (no pre-commit hint)", !beforeSuccessBlock.includes("CORRECT_DIAGNOSIS"));
  // the OLD implementation hardcoded its own inline clue array (answer-leaking "?" notes) —
  // the fix must source evidence/diagnosis content from clueJoinLogic.ts, never redeclare it
  check("component imports EVIDENCE/EVIDENCE_IDS/DIAGNOSES from clueJoinLogic instead of redeclaring its own card data", src.includes("from \"./clueJoinLogic\"") && src.includes("EVIDENCE") && src.includes("DIAGNOSES") && !/const\s+(CLUES|EVIDENCE|DIAGNOSES)\s*[:=]/.test(body));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
