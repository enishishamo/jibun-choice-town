#!/usr/bin/env node
// Automated gameplay QA for the redesigned BusOpsGame (Continuous Product
// Loop, 2026-09-07 — factory/state/audits/audit-summary.md flagged
// bus_ops GQ43/CA55: the mountain route always failed regardless of any
// choice, turning the road-info card into a "copy the one safe answer"
// transcription task instead of a genuine judgment).
// Drives the pure rules in src/q1/busOpsLogic.ts directly.
//
// Usage: node factory/harness/gameplay-qa-bus-ops.mjs

import { DEPARTURE_TIMES, ROUTES, hitsClosure, mountainSafe, isOptimalPlan } from "../../src/q1/busOpsLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- the core defect this task fixes: mountain must NOT always fail ----
check("there are at least 2 departure time options", DEPARTURE_TIMES.length >= 2);
check("at least one departure time is safe for the mountain route", DEPARTURE_TIMES.some((t) => !t.inClosure));
check("at least one departure time is unsafe for the mountain route (a real risk exists)", DEPARTURE_TIMES.some((t) => t.inClosure));

for (const dep of DEPARTURE_TIMES) {
  const allMountain = { bus1: "mountain", bus2: "mountain", bus3: "mountain" };
  const hit = hitsClosure(dep.id, allMountain);
  check(
    `departure "${dep.label}": mountain route is ${dep.inClosure ? "unsafe" : "safe"} as declared`,
    hit === dep.inClosure,
  );
}

// ---- coast must always be safe regardless of departure time ----
{
  const allCoast = { bus1: "coast", bus2: "coast", bus3: "coast" };
  const results = DEPARTURE_TIMES.map((t) => hitsClosure(t.id, allCoast));
  check("coast route is safe at every departure time (a legitimate, always-valid fallback)", results.every((r) => r === false));
}

// ---- no departure time selected must never itself be treated as a failure trigger ----
check("no departure selected (null) never triggers a closure hit", !hitsClosure(null, { bus1: "mountain" }));

// ---- mixed fleets: closure only matters if SOME bus is actually on the mountain route ----
{
  const unsafeDep = DEPARTURE_TIMES.find((t) => t.inClosure).id;
  const noMountain = { bus1: "coast", bus2: "coast", bus3: "coast" };
  check("an unsafe departure time with an all-coast fleet is still safe (route choice matters, not just timing)", !hitsClosure(unsafeDep, noMountain));
  const oneMountain = { bus1: "mountain", bus2: "coast", bus3: "coast" };
  check("an unsafe departure time hits closure if even ONE bus is on the mountain route", hitsClosure(unsafeDep, oneMountain));
}

// ---- mountain must remain meaningfully faster (a real incentive to use it when safe) ----
{
  const mountain = ROUTES.find((r) => r.id === "mountain");
  const coast = ROUTES.find((r) => r.id === "coast");
  check("mountain is faster than coast (a real reason to prefer it when it's safe to do so)", mountain.min < coast.min);
  check("coast needs a rest stop (its own real cost, not a free always-best fallback)", coast.needsRest);
  check("mountain does not need a rest stop", !mountain.needsRest);
}

// ---- round 2: blind guessing must no longer be too permissive ----
{
  const unsafeCount = DEPARTURE_TIMES.filter((t) => t.inClosure).length;
  const safeCount = DEPARTURE_TIMES.length - unsafeCount;
  check(
    "only 1 of 3 departure times is safe for mountain (round 1 review: 2 of 3 was too permissive)",
    safeCount === 1 && DEPARTURE_TIMES.length === 3,
    `${safeCount} safe of ${DEPARTURE_TIMES.length}`,
  );
  check("the first listed departure time is itself unsafe (no free deterministic first-try win)", DEPARTURE_TIMES[0].inClosure);
}

// ---- round 2: mountainSafe must agree with inClosure for every declared time ----
for (const dep of DEPARTURE_TIMES) {
  check(
    `mountainSafe("${dep.label}") matches its declared inClosure flag`,
    mountainSafe(dep.id) === !dep.inClosure,
  );
}
check("mountainSafe(null) is false (no departure chosen yet)", mountainSafe(null) === false);

// ---- round 2: the BLOCKER this repair round exists to close -- coast must
// no longer be mechanically equivalent to correctly using a safe mountain.
{
  const safeDep = DEPARTURE_TIMES.find((t) => !t.inClosure).id;
  const unsafeDep = DEPARTURE_TIMES.find((t) => t.inClosure).id;
  const allMountain = { bus1: "mountain", bus2: "mountain", bus3: "mountain" };
  const allCoast = { bus1: "coast", bus2: "coast", bus3: "coast" };
  const mixed = { bus1: "mountain", bus2: "coast", bus3: "mountain" };

  check(
    "using mountain for every bus on a safe day is an OPTIMAL plan",
    isOptimalPlan(safeDep, allMountain) === true,
  );
  check(
    "using coast for every bus on a day mountain WAS safe is NOT optimal (this is the fixed BLOCKER: coast is no longer a free, equal-outcome default)",
    isOptimalPlan(safeDep, allCoast) === false,
  );
  check(
    "a mixed fleet on a safe day (one bus needlessly on coast) is NOT optimal",
    isOptimalPlan(safeDep, mixed) === false,
  );
  check(
    "using coast for every bus on a day mountain was UNSAFE is optimal (coast was the only valid choice, not a compromise)",
    isOptimalPlan(unsafeDep, allCoast) === true,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
