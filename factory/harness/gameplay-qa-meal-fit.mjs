#!/usr/bin/env node
// Automated gameplay QA for Q1 meal_fit (MealFitGame.tsx / mealFitLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass -- the parent audit found no bug here, but "read it and it looked
// fine" is not a mechanical guarantee, so this proves it with Node instead
// of a human read).
//
// Proves: (a) at least one portion/times/form combo delivers enough kcal
// without over-serving, and (b) the specific trap this game is designed
// around -- "serve a huge amount so even a low eat-rate clears the kcal
// bar" -- genuinely fails via the `wasted` check, i.e. hitting the kcal
// target alone is NOT sufficient to win.
import { NEED, EAT_TARGET_RATIO, WASTE_RATIO, PORTION, FORM, evaluateMeal } from "../../src/q1/mealFitLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("NEED is 1400 kcal", NEED === 1400);

// ---- 1. at least one winning combo exists (exhaustive: 3 portions x 2
// times x 3 forms = 18 combos) --------------------------------------------
const PORTIONS = Object.keys(PORTION);
const TIMES = [3, 5];
const FORMS = Object.keys(FORM);
const all = [];
for (const portion of PORTIONS) for (const times of TIMES) for (const form of FORMS) all.push({ portion, times, form });
const winners = all.filter((c) => evaluateMeal(c.portion, c.times, c.form).ok);
check("at least one winning combo exists", winners.length > 0, `${winners.length} winning combos out of ${all.length}`);

// ---- 2. concrete winning combo, by hand ---------------------------------
{
  const r = evaluateMeal("half", 5, "drink");
  check(
    "a concrete hand-picked combo (half portion, 5x/day, drink-supplemented) wins",
    r.ok === true,
    `served=${r.served}, eaten=${r.eaten} (need >= ${Math.round(NEED * EAT_TARGET_RATIO)}), wasted=${r.wasted}`,
  );
}

// ---- 3. THE TRAP this game is built around: hitting the kcal target
// alone (via massive over-serving) must NOT win -- `wasted` genuinely
// gates success even when the raw eaten-kcal number clears the bar -------
{
  const r = evaluateMeal("full", 5, "drink");
  check(
    "over-serving (full portion x5/day + drink) reaches the kcal target on paper but is rejected as wasteful",
    r.eaten >= NEED * EAT_TARGET_RATIO && r.wasted === true && r.ok === false,
    `served=${r.served} (waste threshold ${NEED * WASTE_RATIO}), eaten=${r.eaten}, wasted=${r.wasted}, ok=${r.ok}`,
  );
}

// ---- 4. the inverse trap: not being wasteful is not sufficient either --
// under-serving (small portions, no help) must still fail on kcal alone --
{
  const r = evaluateMeal("full", 3, "normal");
  check(
    "under-delivering (default full x3/day, no adjustments) is not wasteful but still fails to reach the kcal target",
    r.wasted === false && r.eaten < NEED * EAT_TARGET_RATIO && r.ok === false,
    `served=${r.served}, eaten=${r.eaten} (need >= ${Math.round(NEED * EAT_TARGET_RATIO)})`,
  );
}

// ---- 5. every winning combo genuinely satisfies both displayed
// conditions (kcal target AND not wasteful), nothing hidden --------------
check(
  "every winning combo satisfies exactly the displayed rules (kcal target + not wasteful), nothing hidden",
  winners.every((c) => {
    const r = evaluateMeal(c.portion, c.times, c.form);
    return r.eaten >= NEED * EAT_TARGET_RATIO && !r.wasted;
  }),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
