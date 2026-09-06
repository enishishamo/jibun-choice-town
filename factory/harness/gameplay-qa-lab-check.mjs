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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
