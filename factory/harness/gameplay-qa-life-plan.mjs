#!/usr/bin/env node
// Automated gameplay QA for Q1 life_plan (LifePlanGame.tsx / lifePlanLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): the manual audit read this component and concluded the win
// condition (every trouble covered, without doing everything for the
// person, without leaning only on the daughter) was sound -- this harness
// turns that hand-reasoned claim into an executable assertion by driving
// src/q1/lifePlanLogic.ts directly.

import { TROUBLES, HELPS, WISHES, covered, allCovered, isTooMuch, isFamilyOnly, isSuccess } from "../../src/q1/lifePlanLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- structural sanity: every trouble's `helps` ids resolve to a real HELPS entry ----
{
  const helpIds = new Set(HELPS.map((h) => h.id));
  const dangling = TROUBLES.flatMap((t) => t.helps).filter((h) => !helpIds.has(h));
  check("every Trouble.helps id resolves to a real HELPS entry", dangling.length === 0, JSON.stringify(dangling));
}

// ---- 1. a concrete winning combination exists: one help per trouble, ----
// avoiding the "tooMuch" (food+hand+5) and "familyOnly" traps.
// shop -> hand, meal -> food is avoided by covering meal via "hand" too;
// bath -> rail, med -> health, hosp -> ride, alone -> call.
{
  const winning = ["hand", "rail", "health", "ride", "call"];
  check("a concrete hand-built winning combination exists", isSuccess(winning), JSON.stringify(winning));
  check("that combination covers every trouble", allCovered(winning));
  check("that combination is not flagged tooMuch", !isTooMuch(winning));
  check("that combination is not flagged familyOnly", !isFamilyOnly(winning));
}

// ---- 2. exhaustive search over the small HELPS powerset also finds wins ----
{
  const n = HELPS.length;
  let winners = 0;
  for (let mask = 0; mask < 2 ** n; mask++) {
    const picked = HELPS.filter((_, i) => mask & (1 << i)).map((h) => h.id);
    if (isSuccess(picked)) winners++;
  }
  check("at least one winning combination exists in the full search space", winners > 0, `${winners} winning combos out of ${2 ** n}`);
}

// ---- 3. no false-positive: drop ONE required help from the winning combo ----
// and every trouble that solely depended on it becomes uncovered -> fails.
{
  const winning = ["hand", "rail", "health", "ride", "call"];
  for (const dropped of winning) {
    const partial = winning.filter((h) => h !== dropped);
    // only assert failure when dropping actually uncovers something
    const stillAllCovered = allCovered(partial);
    if (!stillAllCovered) {
      check(`dropping "${dropped}" from the winning combo (now leaves a trouble uncovered) fails`, !isSuccess(partial));
    }
  }
  // "alone" is covered ONLY by call/health among the winning set (health also
  // covers "med"); dropping "call" alone must uncover "alone" specifically
  // since "health" does not cover it via med's overlap... verify directly:
  const aloneTrouble = TROUBLES.find((t) => t.id === "alone");
  check("alone's helps are exactly call/health (sanity for the drop-one test above)", JSON.stringify(aloneTrouble.helps) === JSON.stringify(["call", "health"]));
}

// ---- 4. the tooMuch trap: covering everything via food+hand+3 more still fails ----
{
  const tooMuchCombo = ["food", "hand", "health", "ride", "call"]; // covers all troubles, but food+hand+len>=5
  check("tooMuchCombo covers every trouble", allCovered(tooMuchCombo));
  check("tooMuchCombo is flagged as tooMuch", isTooMuch(tooMuchCombo));
  check("tooMuchCombo does NOT succeed despite covering everything (the 'do everything for them' trap)", !isSuccess(tooMuchCombo));
}

// ---- 5. the familyOnly trap: relying solely on the daughter never succeeds ----
{
  check("['family'] alone is flagged familyOnly", isFamilyOnly(["family"]));
  check("['family'] alone does not succeed (it doesn't even cover everything)", !isSuccess(["family"]));
}

// ---- 6. empty selection never succeeds ----
check("empty picks never succeed", !isSuccess([]));
check("empty picks is not flagged familyOnly (picked.length must be > 0)", !isFamilyOnly([]));

// ---- 7. partial coverage (missing one trouble entirely) fails ----
{
  // omit "med" (only covered by "health") from an otherwise-full combo
  const missingMed = ["food", "rail", "ride", "call"]; // no health -> med uncovered; also bath needs hand/rail (rail present)
  check("a combo missing coverage for 'med' is not allCovered", !allCovered(missingMed));
  check("a combo missing coverage for 'med' does not succeed", !isSuccess(missingMed));
}

check("TROUBLES has 6 entries", TROUBLES.length === 6);
check("HELPS has 8 entries", HELPS.length === 8);
check("WISHES has 3 entries", WISHES.length === 3);
check("covered() reflects TROUBLES.helps membership directly", covered(TROUBLES[0], TROUBLES[0].helps) === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
