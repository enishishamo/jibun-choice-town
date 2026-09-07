#!/usr/bin/env node
// Automated gameplay QA for the redesigned PowerGame (Continuous Product
// Loop, 2026-09-07 -- factory/state/audits/audit-summary.md flagged
// forecast_and_balance GQ48/CA57: turning on every supply source
// immediately at 13:00 and never touching anything again used to
// guarantee success for the whole day, making the forecast and demand
// graph cards decorative).
// Drives the pure rules in src/q1/powerLogic.ts directly, simulating the
// same advance()/hydro-budget sequencing the component performs.

import { BASE_SUPPLY, HOURS, HYDRO_BUDGET_HOURS, SOURCES, canCover, checkDemandFor, computeSupply, marginLevel } from "../../src/q1/powerLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// simulates a full day: `plan(hourIndex, hydroLeft)` returns the desired
// `on` array (SourceIds) BEFORE the advance from that hour. Returns
// {result: "success"|"blackout", blackoutAt}.
function simulate(plan) {
  let on = [];
  let hydroLeft = HYDRO_BUDGET_HOURS;
  for (let step = 0; step < HOURS.length; step++) {
    on = plan(step, hydroLeft, on);
    if (hydroLeft <= 0) on = on.filter((x) => x !== "hydro"); // exhausted -- can't be reactivated
    if (step + 1 >= HOURS.length) {
      // 2026-09-08 legacy LOCAL_REPAIR: the final hour is judged against its
      // own demand (mirrors PowerGame.advance), so the badge and the outcome
      // agree at 17:00 too.
      if (!canCover(computeSupply(on), HOURS[step].demand)) return { result: "blackout", blackoutAt: HOURS[step].h };
      return { result: "success" };
    }
    const supply = computeSupply(on);
    const next = HOURS[step + 1];
    if (!canCover(supply, next.demand)) return { result: "blackout", blackoutAt: next.h };
    if (on.includes("hydro")) {
      hydroLeft -= 1;
      if (hydroLeft <= 0) on = on.filter((x) => x !== "hydro");
    }
  }
  return { result: "success" };
}

// ---- the core defect this task fixes: turning everything on immediately
// and never touching it again must NOT guarantee success ----
{
  const r = simulate(() => ["thermal", "hydro", "buy"]);
  check(
    "turning ALL sources on at 13:00 and never changing them FAILS (hydro's one hour is spent before the real 15:00 peak)",
    r.result === "blackout" && r.blackoutAt === 15,
    JSON.stringify(r),
  );
}

// ---- a forecast-aware plan (hold hydro back until right before the peak) must succeed ----
{
  const r = simulate((step, hydroLeft, on) => {
    if (step === 0) return ["thermal", "buy"]; // needed early, doesn't touch hydro
    if (step === 1) return ["thermal", "buy", "hydro"]; // add hydro right before the 14->15 advance (the peak)
    return on.filter((x) => x !== "hydro"); // hydro auto-exhausts after this hour anyway
  });
  check("holding hydro in reserve until just before the 15:00 peak SUCCEEDS for the whole day", r.result === "success", JSON.stringify(r));
}

// ---- doing nothing at all must fail early, not coast on base supply ----
{
  const r = simulate(() => []);
  check("never turning on any source fails at the very first hour (base supply alone is insufficient)", r.result === "blackout" && r.blackoutAt === 14, JSON.stringify(r));
}

// ---- thermal+buy alone (no hydro, ever) must NOT be enough to survive the peak ----
{
  const r = simulate(() => ["thermal", "buy"]);
  check("thermal+buy alone, without ever using hydro, fails exactly at the 15:00 peak (hydro is genuinely necessary, not optional)", r.result === "blackout" && r.blackoutAt === 15, JSON.stringify(r));
}

// ---- any single source alone must not carry the whole day ----
for (const id of ["thermal", "hydro", "buy"]) {
  const r = simulate(() => [id]);
  check(`using ONLY "${id}" the whole day is not sufficient (some real combination is required)`, r.result === "blackout", JSON.stringify(r));
}

// ---- hydro's budget is a hard, one-time-per-day total, not a per-activation cooldown ----
{
  const r = simulate((step, hydroLeft, on) => {
    // try to use hydro at 13:00 AND keep trying to re-add it every hour after
    // (the exhausted-resource clamp in simulate() must refuse the re-add)
    if (step === 0) return ["thermal", "buy", "hydro"];
    return [...on.filter((x) => x !== "hydro"), "hydro"];
  });
  check("hydro cannot be reused later in the day once its 1-hour budget is spent (still fails at the peak if spent early)", r.result === "blackout" && r.blackoutAt === 15, JSON.stringify(r));
}

// ---- structural sanity checks on the data itself ----
check("hydro's total budget is exactly 1 hour", HYDRO_BUDGET_HOURS === 1);
check("all three sources combined cover the 15:00 peak", computeSupply(["thermal", "hydro", "buy"]) >= HOURS.find((h) => h.h === 15).demand);
check("any two of the three sources combined do NOT cover the 15:00 peak (all three are genuinely required)",
  [["thermal", "hydro"], ["thermal", "buy"], ["hydro", "buy"]].every((pair) => computeSupply(pair) < HOURS.find((h) => h.h === 15).demand));
check("base supply alone does not cover any hour past 13:00", HOURS.slice(1).every((h) => BASE_SUPPLY < h.demand));
check("marginLevel classifies a big surplus as green, a small one as yellow, and a shortfall as red",
  marginLevel(5000, 4000) === "green" && marginLevel(5000, 4700) === "yellow" && marginLevel(5000, 5200) === "red");
check("SOURCES still has exactly 3 entries (thermal/hydro/buy)", SOURCES.length === 3);

// ---- round 2: the display-consistency BLOCKER-adjacent HIGH this round
// fixes -- after correctly surviving 15:00 (hydro spent on exactly the
// right hour), the badge/margin must NOT falsely show "足りない" by
// comparing post-consumption supply against the CURRENT (already-secured)
// hour's demand. It must judge the NEXT advance instead.
{
  // step index 2 == 15:00 (arrived here safely; hydro just auto-exhausted,
  // leaving on=[thermal,buy], supply=5250). The stale bug compared 5250
  // against HOURS[2].demand (5300, this hour's OWN demand) -> red. The fix
  // must compare against HOURS[3].demand (16:00, 5100) -> not red.
  const supplyAfterHydroSpent = computeSupply(["thermal", "buy"]);
  const staleLevel = marginLevel(supplyAfterHydroSpent, HOURS[2].demand);
  const fixedDemand = checkDemandFor(2);
  const fixedLevel = marginLevel(supplyAfterHydroSpent, fixedDemand);
  check(
    "checkDemandFor(step=15:00) looks at the NEXT hour (16:00), not this already-secured hour's own demand",
    fixedDemand === HOURS[3].demand,
    `got ${fixedDemand}, expected ${HOURS[3].demand}`,
  );
  check(
    "after arriving at 15:00 with hydro correctly spent, the badge is no longer falsely red (the stale bug WOULD have been red)",
    staleLevel === "red" && fixedLevel !== "red",
    `stale=${staleLevel} fixed=${fixedLevel}`,
  );
}

// ---- checkDemandFor must look one hour ahead at every step, and fall
// back to the hour's own demand only at the very last step (no next hour
// to preview) ----
for (let step = 0; step < HOURS.length - 1; step++) {
  check(`checkDemandFor(${HOURS[step].h}:00) previews the next hour (${HOURS[step + 1].h}:00)'s demand`, checkDemandFor(step) === HOURS[step + 1].demand);
}
check(`checkDemandFor(${HOURS[HOURS.length - 1].h}:00, the last hour) falls back to its own demand (nothing left to preview)`, checkDemandFor(HOURS.length - 1) === HOURS[HOURS.length - 1].demand);

// ---- legacy LOCAL_REPAIR 2026-09-08: at the last hour, display and outcome must agree ----
{
  // correct play through 16:00, then switch everything OFF at 17:00: the badge
  // shows red (supply 4700 < 4800) and the day must NOT end in success.
  const r = simulate((step, hydroLeft, on) => {
    if (step === 0) return ["thermal", "buy"];
    if (step === 1) return ["thermal", "buy", "hydro"];
    if (step === HOURS.length - 1) return [];
    return on.filter((x) => x !== "hydro");
  });
  check("switching every source off at the last hour (badge red) is a blackout at 17:00, not an unconditional success", r.result === "blackout" && r.blackoutAt === 17, JSON.stringify(r));
  const badgeAtLast = marginLevel(computeSupply([]), checkDemandFor(HOURS.length - 1));
  check("the last-hour badge for that state is red — i.e. the display and the advance() outcome agree", badgeAtLast === "red", badgeAtLast);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
