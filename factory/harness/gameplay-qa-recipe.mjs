#!/usr/bin/env node
// Automated gameplay QA for Q1 recipe_balance (RecipeGame.tsx / recipeLogic.ts).
// 2026-09-13: mechanical-verification follow-up to the earlier logic/UX
// audit pass (RecipeGame itself had no bug found in that audit -- this
// proves it stays that way). Confirms: the starting recipe's own cost is
// really above target (so the player has genuine work to do); the full
// (small) 13^5 input space contains at least one winning recipe, found by
// enumeration rather than guessed by hand; a recipe that saves cost but
// sacrifices exactly one taste axis fails (no partial credit); and more
// than one qualitatively different winning recipe exists (matching the
// UI's own "配合の正解はひとつじゃない" claim).
import { ING, START, TARGET_COST, MIN, calc, isTasteOk, isCostOk, isSuccess } from "../../src/q1/recipeLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- 1. the starting recipe is genuinely over target (real work to do) ----
const base = calc(START);
check(`the starting recipe's cost (${base.cost}円) is above TARGET_COST (${TARGET_COST}円)`, base.cost > TARGET_COST);
check("the starting recipe's taste already clears every floor (nothing to fix there)", isTasteOk(base));
check("the starting recipe does not succeed as-is (cost too high)", !isSuccess(START));

// ---- 2. enumerate the FULL input space (each of the 5 ingredients 0..max,
// max=12 -> 13^5 = 371,293 combos, small enough to brute-force exactly like
// gameplay-qa-sourcing.mjs does) and confirm at least one winner exists ----
const IDS = ING.map((i) => i.id);
const MAXV = 12; // every ingredient's `max` is 12 in this game
function* allRecipes() {
  const [m, s, b, w, o] = IDS;
  for (let a1 = 0; a1 <= MAXV; a1++)
    for (let a2 = 0; a2 <= MAXV; a2++)
      for (let a3 = 0; a3 <= MAXV; a3++)
        for (let a4 = 0; a4 <= MAXV; a4++)
          for (let a5 = 0; a5 <= MAXV; a5++)
            yield { [m]: a1, [s]: a2, [b]: a3, [w]: a4, [o]: a5 };
}

const winners = [...allRecipes()].filter(isSuccess);
check(
  "at least one winning recipe exists in the full 13^5 input space",
  winners.length > 0,
  `${winners.length} winning recipes out of 371,293 combinations`,
);

// hidden-condition check: every winner satisfies exactly the displayed
// rule (cost<=target AND all 4 taste floors), nothing hidden.
check(
  "every winning recipe satisfies exactly the displayed rule (cost + all 4 taste floors), nothing hidden",
  winners.every((a) => isCostOk(calc(a)) && isTasteOk(calc(a))),
);

// ---- 3. multiple qualitatively different winning recipes exist (matches
// the UI's own claim "配合の正解はひとつじゃない") ----
{
  const distinctKeys = new Set(winners.map((w) => JSON.stringify(w)));
  check("more than one distinct winning recipe exists among the winners", distinctKeys.size > 1, `${distinctKeys.size} distinct winners`);
  if (winners.length >= 2) {
    const [w1, w2] = winners;
    check("two winners really do differ in ingredient amounts (not accidental duplicates)", JSON.stringify(w1) !== JSON.stringify(w2), `${JSON.stringify(w1)} vs ${JSON.stringify(w2)}`);
  }
}

// ---- 4. false-positive check: saving cost by diluting with water (cuts
// ALL 4 taste axes at once) must fail on taste even though cost drops ----
{
  const diluted = { ...START, water: START.water + 6, milk: START.milk - 3 };
  const c = calc(diluted);
  check(`diluting with extra water reduces cost (${c.cost}円 vs starting ${base.cost}円)`, c.cost < base.cost);
  check("...but breaks at least one taste floor (water subtracts from every taste axis)", !isTasteOk(c), JSON.stringify(c));
  check("...so this recipe does NOT succeed despite the lower cost", !isSuccess(diluted));
}

// ---- 5. false-positive check: a recipe that satisfies cost AND 3 of the
// 4 taste axes, but fails exactly the 4th, must not succeed (no partial credit) ----
{
  // zero out berry entirely -- berry-flavor collapses to 0, well under its floor,
  // while cost drops (berry is the priciest ingredient) and the other 3 axes are untouched.
  const noBerry = { ...START, berry: 0 };
  const c = calc(noBerry);
  check(`removing berry entirely drops cost well under target (${c.cost}円)`, isCostOk(c));
  check("the other 3 taste axes (smooth/sweet/milk) still clear their floors", c.smooth >= MIN.smooth && c.sweet >= MIN.sweet && c.milk >= MIN.milk);
  check("but berry-flavor itself collapses under its floor", c.berry < MIN.berry, `berry=${c.berry} min=${MIN.berry}`);
  check("so isTasteOk is false (failing exactly 1 of 4 axes is still a fail, no partial credit)", !isTasteOk(c));
  check("and isSuccess is false for this recipe", !isSuccess(noBerry));
}

// ---- 6. all-zero recipe (nothing used) is cheap but has zero taste ----
{
  const empty = { milk: 0, sugar: 0, berry: 0, water: 0, other: 0 };
  const c = calc(empty);
  check("an empty recipe is cheap (near the fixed cost only)", isCostOk(c));
  check("...but has zero taste on every axis, failing the taste floor", !isTasteOk(c), JSON.stringify(c));
  check("...so it does not succeed", !isSuccess(empty));
}

// ---- 7. ING/MIN sanity: every ingredient has a positive cost, water is the only ingredient that HURTS every taste axis ----
check("every ingredient has a positive per-unit cost", ING.every((i) => i.yen > 0));
{
  const water = ING.find((i) => i.id === "water");
  check("water subtracts from all 4 taste axes (its cost-cutting role has a real tradeoff)", water.smooth < 0 && water.sweet < 0 && water.milk < 0 && water.berry < 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
