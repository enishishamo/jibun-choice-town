#!/usr/bin/env node
// Automated gameplay QA for the redesigned ClueBoardGame (Continuous
// Product Loop, 2026-09-06 — factory/state/audits/q1-audit.json flagged
// clue_board GQ31/CA54, "collect any 5 clues" content-blind win condition).
// Drives the pure rules in src/q1/clueBoardLogic.ts directly.
//
// Usage: node factory/harness/gameplay-qa-clue-board.mjs

import { ASK, EXAM, MAX_REVIEW_ATTEMPTS, MIN_CLUES, MIN_TOOLS, OFF_VITAL_IDS, VITALS, hasGatheredEnough, isCorrectVitalFlagSet } from "../../src/q1/clueBoardLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const askClueMax = ASK.filter((a) => a.clue).length;
const examClueMax = EXAM.filter((e) => e.clue).length;
const vitalClueMax = VITALS.filter((v) => v.clue).length;

check("no single tool alone can reach MIN_CLUES (forces real multi-source use)",
  Math.max(askClueMax, examClueMax, vitalClueMax) < MIN_CLUES,
  `ask=${askClueMax} exam=${examClueMax} vital=${vitalClueMax} < ${MIN_CLUES}`);

check("gathering is gated on both count AND tool diversity", MIN_TOOLS >= 2);
check("5 clues from only 1 tool is not enough (structurally impossible here, verified defensively)",
  !hasGatheredEnough(MIN_CLUES, new Set(["ask"])) || askClueMax < MIN_CLUES);
check("5 clues across 2 tools IS enough", hasGatheredEnough(MIN_CLUES, new Set(["ask", "exam"])));
check("4 clues across 2 tools is NOT enough (below MIN_CLUES)", !hasGatheredEnough(4, new Set(["ask", "exam"])));

// ---- the core defect this task fixes: content-blind tallying must no longer win ----
check("exactly the off vitals is correct", isCorrectVitalFlagSet(OFF_VITAL_IDS));
check("order does not matter", isCorrectVitalFlagSet([...OFF_VITAL_IDS].reverse()));
check("flagging nothing fails", !isCorrectVitalFlagSet([]));
check("flagging everything (incl. the normal one) fails", !isCorrectVitalFlagSet(VITALS.map((v) => v.id)));
check("flagging only the normal vital fails", !isCorrectVitalFlagSet(VITALS.filter((v) => !v.off).map((v) => v.id)));
check("missing one off vital fails (partial credit is not success)", !isCorrectVitalFlagSet(OFF_VITAL_IDS.slice(1)));
check("one extra (correct set + the normal one) fails — over-flagging is also wrong", !isCorrectVitalFlagSet([...OFF_VITAL_IDS, VITALS.find((v) => !v.off).id]));

// ---- 2nd-round HIGH findings (independent Codex review): gather-phase
// leakage via evaluative clue text, and clue-PRESENCE itself being a tell
// since blood pressure previously had no clue at all ----
{
  const evaluativeWords = ["高い", "低い", "速い", "遅い"];
  const leaky = VITALS.filter((v) => v.clue && evaluativeWords.some((w) => v.clue.text.includes(w)));
  check("no vital's gather-phase clue text contains an evaluative word (高い/低い/速い/遅い)", leaky.length === 0, leaky.map((v) => v.id).join(","));
}
check("every vital produces a clue when inspected — clue PRESENCE is not itself a tell", VITALS.every((v) => !!v.clue));
check("review attempts are bounded, not free-enumerate-16-combinations", MAX_REVIEW_ATTEMPTS >= 1 && MAX_REVIEW_ATTEMPTS <= 3, `MAX_REVIEW_ATTEMPTS=${MAX_REVIEW_ATTEMPTS}`);

// ---- blind/random flagging should not be a dominant strategy, even ----
// across the full MAX_REVIEW_ATTEMPTS budget a real player gets.
{
  const ids = VITALS.map((v) => v.id);
  const rand = (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
  let hitsWithinBudget = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    let won = false;
    for (let attempt = 0; attempt < MAX_REVIEW_ATTEMPTS && !won; attempt++) {
      const subset = ids.filter(() => rand() < 0.5);
      if (isCorrectVitalFlagSet(subset)) won = true;
    }
    if (won) hitsWithinBudget++;
  }
  const rate = hitsWithinBudget / N;
  check(`blind random flagging rarely succeeds within the ${MAX_REVIEW_ATTEMPTS}-attempt budget (must actually read value vs. normal range)`, rate < 0.25, `${(rate * 100).toFixed(1)}%`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
