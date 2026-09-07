#!/usr/bin/env node
// Automated gameplay QA for the redesigned LabCheckGame (Continuous Product
// Loop, 2026-09-06 — factory/state/audits/q1-audit.json flagged lab_check
// GQ18/CA41, select-all exploit, no real test-selection judgment).
// Drives the pure rules in src/q1/labCheckLogic.ts directly.
//
// Usage: node factory/harness/gameplay-qa-lab-check.mjs

import { MAX_TESTS_RUNNABLE, RELEVANT_IDS, TESTS, canRunAnother, isCompletePicture } from "../../src/q1/labCheckLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const IDS = TESTS.map((t) => t.id);
function combos(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...rest] = arr;
  return [...combos(rest, k - 1).map((c) => [head, ...c]), ...combos(rest, k)];
}

// ---- the core defect this task fixes: select-all must no longer be a winning (or even reachable) strategy ----
check("select-all is impossible: budget is below total test count", MAX_TESTS_RUNNABLE < IDS.length, `${MAX_TESTS_RUNNABLE} < ${IDS.length}`);
check("cannot run a 3rd test once the budget (2) is used", !canRunAnother(IDS.slice(0, MAX_TESTS_RUNNABLE)));
check("can still run up to the budget", canRunAnother(IDS.slice(0, MAX_TESTS_RUNNABLE - 1)));

// ---- exactly one 2-of-3 combination is the complete, doctor-useful picture ----
const allPairs = combos(IDS, MAX_TESTS_RUNNABLE);
const completePairs = allPairs.filter((p) => isCompletePicture(p));
check("exactly one pair is the complete picture (real choice, not a coin flip)", completePairs.length === 1, JSON.stringify(completePairs));
check("the complete pair is exactly the relevant tests", JSON.stringify([...completePairs[0]].sort()) === JSON.stringify([...RELEVANT_IDS].sort()));
check("order does not matter (same set, reversed)", isCompletePicture([...completePairs[0]].reverse()));

// ---- random / uninformed play should NOT reliably reach the complete picture ----
{
  const rand = (() => { let s = 42; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
  let hits = 0;
  const N = 500;
  for (let i = 0; i < N; i++) {
    const shuffled = [...IDS].sort(() => rand() - 0.5).slice(0, MAX_TESTS_RUNNABLE);
    if (isCompletePicture(shuffled)) hits++;
  }
  const rate = hits / N;
  check("uninformed random pair-picking is not a dominant strategy", rate < 0.6, `${(rate * 100).toFixed(0)}% of random pairs happened to be complete (chance floor ~33%)`);
}

// ---- partial / empty picks are always incomplete (no free partial credit) ----
check("empty pick is incomplete", !isCompletePicture([]));
check("single relevant pick alone is incomplete (must gather both)", !isCompletePicture([RELEVANT_IDS[0]]));

// ---- 2026-09-07 repair round 1 (Q1 First-Play Standard, HIGH: "患者文脈を
// 使わない固定攻略が成立する" — the pre-run name/hint text used to spell
// out each test's diagnostic category with words that directly echo the
// case's own symptom vocabulary). Verify the SELECTION-TIME text doesn't
// literally restate the case's own symptom words, and never states an
// off/normal/abnormal STATUS before a test is run (that status is
// legitimately revealed only after running, in label/means). Describing a
// test's real PURPOSE (e.g. "counts cells that fight germs") is NOT itself
// a leak and is required for genuine Gate C reasoning — only restating the
// case's exact words, or pre-announcing off/normal, is. ----
{
  const caseWords = ["熱", "せき", "息苦し"];
  const statusWords = ["ふつう", "正常", "異常", "高い", "低い", "多い", "少ない", "強い", "弱い"];
  const preRunLeaks = TESTS.filter((t) =>
    caseWords.some((w) => t.name.includes(w) || t.hint.includes(w)) ||
    statusWords.some((w) => t.name.includes(w) || t.hint.includes(w)),
  );
  check(
    "no test's pre-run name/hint restates the case's own symptom words or states an off/normal status",
    preRunLeaks.length === 0,
    preRunLeaks.map((t) => t.id).join(","),
  );
}

// ---- 2026-09-07 repair round 2 (independent review HIGH: round 1 made
// the two RELEVANT tests' pre-run text fully circular/generic ("ある物質",
// "ある種類の細胞") while leaving the distractor specifically organ-named
// ("腎臓のはたらき") — the same shortcut in the opposite direction,
// "eliminate the one that names a real organ". All three now use an
// equally specific real test name; verify none regresses to a generic
// placeholder phrase. ----
{
  const genericPhrases = ["ある物質", "ある種類", "別の数値", "別の物質"];
  const vagueTests = TESTS.filter((t) => genericPhrases.some((p) => t.name.includes(p)));
  check(
    "no test's pre-run name uses a generic placeholder phrase instead of a real, equally-specific test name",
    vagueTests.length === 0,
    vagueTests.map((t) => t.id).join(","),
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
