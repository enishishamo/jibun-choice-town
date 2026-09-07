#!/usr/bin/env node
// Automated gameplay QA for the redesigned RxCheckGame (Continuous Product
// Loop, 2026-09-07 — factory/state/audits/audit-summary.md flagged
// rx_check GQ42/CA72: the key lab-results card wasn't required to be
// opened, and both the concern/action choices allowed unlimited free
// wrong guesses). Round 2 (this version) adds checks for defects an
// independent review found in round 1's fix: a semantic (not just
// exact-label) answer leak, and blind-guess success still too high.
// Drives the pure rules in src/q1/rxCheckLogic.ts directly.
//
// Usage: node factory/harness/gameplay-qa-rx-check.mjs

import { ACTIONS, CARDS, CONCERNS, MAX_ACTION_WRONG_ATTEMPTS, MAX_CONCERN_WRONG_ATTEMPTS, hasSeenEnough } from "../../src/q1/rxCheckLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- the core defect this task fixes: the card that actually matters (lab results) must be required ----
check("there are exactly 4 cards", CARDS.length === 4);
check("the lab-results card exists", CARDS.some((c) => c.id === "lab"));
check("opening only 3 of 4 cards (skipping lab) is NOT enough", !hasSeenEnough(CARDS.filter((c) => c.id !== "lab").map((c) => c.id)));
check("opening 3 of 4 cards that DOES include lab is still not enough (all 4 required, not just lab)", !hasSeenEnough(["rx", "patient", "lab"]));
check("opening all 4 cards is enough", hasSeenEnough(CARDS.map((c) => c.id)));
check("order does not matter", hasSeenEnough([...CARDS.map((c) => c.id)].reverse()));

// ---- exactly one concern and one action must be correct (a real choice, not a coin flip or a freebie) ----
check("exactly one concern is correct", CONCERNS.filter((c) => c.ok).length === 1);
check("exactly one action is correct", ACTIONS.filter((a) => a.ok).length === 1);
check("there are at least 2 wrong concerns (a real choice, not a single obvious button)", CONCERNS.filter((c) => !c.ok).length >= 2);
check("there are at least 2 wrong actions", ACTIONS.filter((a) => !a.ok).length >= 2);

// ---- round 2 fix: wrong guesses must not be free and unlimited, and the
// action step (whose correct answer has generic professional
// face-validity independent of any data -- "ask/escalate when unsure" is
// a content-blind meta-strategy) must be tighter than the concern step ----
check("concern step has a wrong-guess budget below the number of wrong concerns", MAX_CONCERN_WRONG_ATTEMPTS >= 0 && MAX_CONCERN_WRONG_ATTEMPTS < CONCERNS.filter((c) => !c.ok).length);
check("action step's budget is 0 (a wrong pick ends it immediately, not a free extra try)", MAX_ACTION_WRONG_ATTEMPTS === 0);
{
  const concernBlind = (MAX_CONCERN_WRONG_ATTEMPTS + 1) / CONCERNS.length;
  const actionBlind = (MAX_ACTION_WRONG_ATTEMPTS + 1) / ACTIONS.length;
  check(
    "combined blind-guess success across both steps is meaningfully below 50%",
    concernBlind * actionBlind < 0.4,
    `concern=${(concernBlind * 100).toFixed(0)}%, action=${(actionBlind * 100).toFixed(0)}%, combined=${(concernBlind * actionBlind * 100).toFixed(0)}%`,
  );
}

// ---- wrong replies must not leak the correct answer, either by exact
// label match OR by a semantically-equivalent word (round 2 fix: the old
// check only caught an exact label substring, missing "まずは相談" as a
// synonym for "医師に問い合わせる") ----
{
  const correctConcern = CONCERNS.find((c) => c.ok);
  const leakyReplies = CONCERNS.filter((c) => !c.ok && c.reply.includes(correctConcern.label));
  check("no wrong concern's reply mentions the correct concern's own label", leakyReplies.length === 0);

  const correctAction = ACTIONS.find((a) => a.ok);
  const semanticLeakWords = ["相談", "問い合わせ", "確認して", "きく", "聞いて"];
  const leakyActionReplies = ACTIONS.filter(
    (a) => !a.ok && (a.result.includes(correctAction.label) || semanticLeakWords.some((w) => a.result.includes(w))),
  );
  check(
    "no wrong action's result mentions the correct action's own label OR a synonymous pointer to it (e.g. 'consult first')",
    leakyActionReplies.length === 0,
    leakyActionReplies.map((a) => a.id).join(","),
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
