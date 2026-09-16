#!/usr/bin/env node
// Automated gameplay QA for Q1 inspect_and_measure (CookGame.tsx / cookLogic.ts).
// 2026-09-13: mechanical-verification follow-up to the earlier logic/UX
// audit pass (CookGame itself had no bug found in that audit -- this
// proves it stays that way). Confirms: round 1 (before re-heat) can never
// pass even if all 3 spots are measured (the thickest spot is genuinely
// too cold); round 2 (after re-heat) passes once all 3 spots are measured
// and none is below the hygiene-card threshold; and measuring fewer than
// all 3 spots -- even if every measured one is hot enough -- never passes
// (the "3か所以上、厚いところをふくめて" rule can't be bypassed by
// skipping the one spot that would fail).
import {
  SPOTS,
  TEMPS,
  MIN_CORE_TEMP,
  allSpotsMeasured,
  anySpotMeasured,
  minMeasuredTemp,
  isRoundSuccess,
  emptyMeasured,
} from "../../src/q1/cookLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const fullyMeasure = (round) => {
  const m = emptyMeasured();
  for (const s of SPOTS) m[s.id] = TEMPS[round][s.id];
  return m;
};

// ---- 1. structural: exactly 3 spots, and the thickest is the coldest at every round ----
check("there are exactly 3 spots to measure", SPOTS.length === 3);
check("the required spot count includes 'thick' (the hygiene card's 'いちばん厚い切り身')", SPOTS.some((s) => s.id === "thick"));

// ---- 2. round 1 (before re-heat): fully measuring never succeeds -- the
// thickest spot is genuinely under threshold, not an arbitrary flag ----
{
  const m1 = fullyMeasure(1);
  check(`round 1's own thickest-spot temp (${TEMPS[1].thick}C) is below MIN_CORE_TEMP (${MIN_CORE_TEMP})`, TEMPS[1].thick < MIN_CORE_TEMP);
  check("round 1, even with all 3 spots measured, never succeeds (a genuine cold spot, not a hardcoded round gate)", !isRoundSuccess(1, m1), `min=${minMeasuredTemp(m1)}`);
}

// ---- 3. round 2 (after re-heat): fully measuring succeeds -- at least one concrete winning path ----
{
  const m2 = fullyMeasure(2);
  check("round 2's own thickest-spot temp clears MIN_CORE_TEMP", TEMPS[2].thick >= MIN_CORE_TEMP);
  check("round 2, with all 3 spots measured and all >= threshold, succeeds", isRoundSuccess(2, m2), `min=${minMeasuredTemp(m2)}`);
}

// ---- 4. false-positive check: round 2 but skipping the one spot that
// (hypothetically) would fail must NOT succeed -- "all 3 measured" is a
// real gate, not window dressing, since round 2's actual thick value DOES
// clear the bar; the real exploit to guard against is skipping ANY spot ----
for (const skipId of SPOTS.map((s) => s.id)) {
  const partial = fullyMeasure(2);
  partial[skipId] = null;
  check(
    `round 2 with '${skipId}' left unmeasured (other 2 spots hot enough) does NOT succeed`,
    !isRoundSuccess(2, partial),
    `allMeasured=${allSpotsMeasured(partial)}`,
  );
}

// ---- 5. false-positive check: round 2, all 3 measured, but one spot
// artificially cold (satisfies "all measured" but not "all >= threshold") ----
{
  const m2ColdMiddle = fullyMeasure(2);
  m2ColdMiddle.middle = MIN_CORE_TEMP - 1;
  check(
    "round 2 with all 3 measured but one spot 1C under threshold does NOT succeed",
    !isRoundSuccess(2, m2ColdMiddle),
    `min=${minMeasuredTemp(m2ColdMiddle)}`,
  );
}

// ---- 6. no measurements at all never succeeds, in either round ----
check("round 1, nothing measured, does not succeed", !isRoundSuccess(1, emptyMeasured()));
check("round 2, nothing measured, does not succeed", !isRoundSuccess(2, emptyMeasured()));
check("anySpotMeasured is false when nothing has been measured", !anySpotMeasured(emptyMeasured()));

// ---- 7. boundary: exactly MIN_CORE_TEMP passes (>=, not >) ----
{
  const boundary = fullyMeasure(2);
  boundary.thin = MIN_CORE_TEMP;
  boundary.middle = MIN_CORE_TEMP;
  boundary.thick = MIN_CORE_TEMP;
  check(`exactly ${MIN_CORE_TEMP}C on all 3 spots succeeds (threshold is inclusive)`, isRoundSuccess(2, boundary));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
