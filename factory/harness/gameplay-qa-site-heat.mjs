#!/usr/bin/env node
// Automated gameplay QA for Q1 schedule_and_protect (SiteHeatGame.tsx / siteHeatLogic.ts).
// 2026-09-13: mechanical-verification follow-up to the earlier logic/UX
// audit pass (SiteHeatGame itself had no bug found in that audit -- this
// proves it stays that way). Confirms the design's core "no single
// answer" claim in the file header comment: all-rest is safe but never
// finishes the job; heavy work at noon finishes the job but is dangerous;
// and at least one plan exists that is both safe AND finishes the job.
import {
  SLOTS,
  TASKS,
  PROGRESS_TARGET,
  MAX_SAFE_RISK,
  risk,
  isFilled,
  totalProgress,
  risksFor,
  maxRiskFor,
  isSuccess,
} from "../../src/q1/siteHeatLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const fillWith = (taskId) => {
  const p = {};
  for (const s of SLOTS) p[s.h] = taskId;
  return p;
};

// ---- 1. all-rest: safe (risk 0 everywhere) but never finishes the job ----
{
  const allRest = fillWith("rest");
  check("all-rest plan is fully filled", isFilled(allRest));
  check("all-rest plan has zero risk everywhere", maxRiskFor(allRest) === 0);
  check(`all-rest plan's progress (${totalProgress(allRest)}%) is below the target (${PROGRESS_TARGET}%)`, totalProgress(allRest) < PROGRESS_TARGET);
  check("all-rest plan does NOT succeed (safe but doesn't finish the job)", !isSuccess(allRest));
}

// ---- 2. all-heavy: finishes the job but is dangerous at the hot slots ----
{
  const allHeavy = fillWith("heavy1");
  check(`all-heavy1 plan's progress (${totalProgress(allHeavy)}%) clears the target`, totalProgress(allHeavy) >= PROGRESS_TARGET);
  check(`all-heavy1 plan hits max risk (${MAX_SAFE_RISK}) at the hottest slot (noon, WBGT ${SLOTS.find((s) => s.h === "12時").wbgt})`, maxRiskFor(allHeavy) >= MAX_SAFE_RISK);
  check("all-heavy1 plan does NOT succeed (finishes the job but is dangerous)", !isSuccess(allHeavy));
}

// ---- 3. at least one plan is both safe AND finishes the job (a genuine solution exists) ----
{
  // heavy work at the cooler slots (8/16時), lighter work at the hot midday slots.
  const smartPlan = { "8時": "heavy1", "10時": "heavy2", "12時": "indoor", "14時": "light", "16時": "heavy1" };
  check("a hand-built 'smart' plan is fully filled", isFilled(smartPlan));
  check(`smart plan's progress (${totalProgress(smartPlan)}%) clears the target`, totalProgress(smartPlan) >= PROGRESS_TARGET, JSON.stringify(risksFor(smartPlan)));
  check(`smart plan's max risk (${maxRiskFor(smartPlan)}) stays below MAX_SAFE_RISK (${MAX_SAFE_RISK})`, maxRiskFor(smartPlan) < MAX_SAFE_RISK);
  check("smart plan SUCCEEDS (proves the task is genuinely solvable, not a trap)", isSuccess(smartPlan));
}

// ---- 4. false-positive check: a plan that clears progress and looks fine
// except ONE hot slot secretly has heavy load must still fail ----
{
  const almostSmart = { "8時": "heavy1", "10時": "heavy2", "12時": "heavy1", "14時": "light", "16時": "heavy1" };
  check(
    "swapping just the noon slot back to heavy work (everything else unchanged) reintroduces max risk and fails",
    !isSuccess(almostSmart),
    `maxRisk=${maxRiskFor(almostSmart)} progress=${totalProgress(almostSmart)}`,
  );
}

// ---- 5. an unfilled plan (missing a slot) never succeeds, even if the filled slots look fine ----
{
  const partial = { "8時": "heavy1", "10時": "heavy2", "12時": "indoor", "14時": "light" }; // missing 16時
  check("a plan missing one time slot is not 'filled'", !isFilled(partial));
  check("an unfilled plan never succeeds even if progress/risk look fine so far", !isSuccess(partial));
}

// ---- 6. risk() is monotonic in both wbgt and load (sanity on the formula itself) ----
check("risk increases (or stays same) as WBGT rises for a fixed heavy load", risk(33, 2) >= risk(29, 2));
check("risk increases (or stays same) as load rises for a fixed WBGT", risk(33, 2) >= risk(33, 1));
check("risk is always 0 for rest (load=0), regardless of WBGT", SLOTS.every((s) => risk(s.wbgt, 0) === 0));

// ---- 7. at least one slot's WBGT is high enough that a heavy task there is unsafe (a real risk exists) ----
check("at least one (slot, heavy-task) combination reaches MAX_SAFE_RISK (there is a genuine danger to avoid)", SLOTS.some((s) => risk(s.wbgt, 2) >= MAX_SAFE_RISK));

// ---- 8. TASKS sanity: heavy tasks contribute more progress than rest, rest contributes 0 ----
{
  const rest = TASKS.find((t) => t.id === "rest");
  const heavy = TASKS.find((t) => t.id === "heavy1");
  check("rest contributes 0 progress", rest.progress === 0);
  check("heavy work contributes more progress than rest", heavy.progress > rest.progress);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
