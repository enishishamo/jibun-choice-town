#!/usr/bin/env node
// Automated gameplay QA for the redesigned XrayGame (Stage 4).
// Drives the pure rules in src/q1/xrayLogic.ts directly (Node runs TS natively)
// and simulates player strategies: button spam, C-ignoring random play,
// select-everything, optimal play, edge cases, repeated random conditions.
//
// Usage: node factory/harness/gameplay-qa-xray.mjs

import {
  BUILDS, EXPOSURE_LIMIT, FRAME_COST, FRAME_POSITIONS, FRAME_SIZES, MISJUDGE_LIMIT,
  canAfford, frameCovers, isPerfect, lungsRect, frameRect, minimalCost, newCase,
  noteIsCorrect, shoot,
} from "../../src/q1/xrayLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) {
  // deterministic LCG so QA runs are reproducible
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const allCases = [];
for (const build of BUILDS)
  for (const lungPos of FRAME_POSITIONS)
    for (const haze of ["right", "left", "none"]) allCases.push({ build, lungPos, haze });

// ---- invariants over the full case space -----------------------------------
// 1. Every case is solvable: some frame covers the lungs within budget.
check("every case solvable", allCases.every((c) => Number.isFinite(minimalCost(c)) && minimalCost(c) <= EXPOSURE_LIMIT));

// 2. Framing choice MATTERS: for every case some framing fails (cutoff possible).
check("cutoff is possible in every case", allCases.every((c) =>
  FRAME_POSITIONS.some((p) => FRAME_SIZES.some((s) => !frameCovers(c, p, s)))));

// 3. Build changes the answer: the cheapest covering (pos,size) set differs across builds.
{
  const solutions = (c) => FRAME_POSITIONS.flatMap((p) => FRAME_SIZES.filter((s) => frameCovers(c, p, s) && FRAME_COST[s] === minimalCost(c)).map((s) => p + s)).sort().join(",");
  const perBuild = BUILDS.map((b) => solutions({ build: b, lungPos: "mid", haze: "none" }));
  check("build changes correct framing", new Set(perBuild).size === BUILDS.length, perBuild.join(" | "));
}
// 4. Position changes the answer too.
{
  const solutions = (c) => FRAME_POSITIONS.flatMap((p) => FRAME_SIZES.filter((s) => frameCovers(c, p, s)).map((s) => p + s)).sort().join(",");
  const perPos = FRAME_POSITIONS.map((lp) => solutions({ build: "medium", lungPos: lp, haze: "none" }));
  check("posture changes correct framing", new Set(perPos).size === FRAME_POSITIONS.length, perPos.join(" | "));
}
// 5. S never covers medium/large; M never covers large (size judgment is real).
check("S fits only small builds", ["medium", "large"].every((b) => FRAME_POSITIONS.every((lp) => FRAME_POSITIONS.every((p) => !frameCovers({ build: b, lungPos: lp, haze: "none" }, p, "S")))));
check("M never covers large build", FRAME_POSITIONS.every((lp) => FRAME_POSITIONS.every((p) => !frameCovers({ build: "large", lungPos: lp, haze: "none" }, p, "M"))));
// 6. Wide frame is a size-solver, not a position-solver: L at the WRONG position never covers.
{
  const c = { build: "medium", lungPos: "high", haze: "none" };
  check("L still requires reading the posture", frameCovers(c, "high", "L") && !frameCovers(c, "mid", "L") && FRAME_COST.L === 2);
}
// 7. Timing matters: same framing, hold vs not, changes deliverability.
{
  const c = { build: "medium", lungPos: "mid", haze: "right" };
  const good = shoot(c, "mid", "M", true);
  const bad = shoot(c, "mid", "M", false);
  check("action changes result (timing)", good.deliverable && !bad.deliverable);
}

// ---- strategy simulations ---------------------------------------------------
// Simulate the component's flow for a strategy; returns outcome of ONE case.
// Rejected deliveries are misjudgements: the senior sends the player back, and
// the MISJUDGE_LIMIT-th rejection ends the case (no free delivery oracle).
function playCase(c, strategy, rand) {
  let exposures = 0, retakes = 0, misjudges = 0;
  for (let turn = 0; turn < 50; turn++) {
    const { pos, size, waitForHold } = strategy.plan(c, rand, { exposures, retakes });
    if (!canAfford(exposures, size)) return { result: "failed_budget", exposures, retakes };
    const r = shoot(c, pos, size, waitForHold ? true : rand() < 0.25); // random shutter hits hold 25% of cycle
    exposures += r.cost;
    if (r.deliverable) return { result: "delivered", exposures, retakes };
    if (strategy.deliverAnything) {
      misjudges++;
      if (misjudges >= MISJUDGE_LIMIT) return { result: "failed_misjudge", exposures, retakes };
    }
    retakes++;
  }
  return { result: "loop_exhausted", exposures, retakes };
}

const SPAM = { // mash shutter with whatever is selected first, random timing
  plan: (c, rand) => ({ pos: "mid", size: "M", waitForHold: false }),
  deliverAnything: true,
};
const IGNORE_C = { // never reads order: random framing, random timing
  plan: (c, rand) => ({
    pos: FRAME_POSITIONS[Math.floor(rand() * 3)],
    size: FRAME_SIZES[Math.floor(rand() * 3)],
    waitForHold: false,
  }),
  deliverAnything: true,
};
const ALWAYS_L_MID = { // "select the biggest and never look": L mid every time, waits for hold
  plan: () => ({ pos: "mid", size: "L", waitForHold: true }),
  deliverAnything: false,
};
const L_READ_POS = { // reads the posture but always maxes the size: correct pos + L
  plan: (c) => ({ pos: c.lungPos, size: "L", waitForHold: true }),
  deliverAnything: false,
};
const DELIVERY_ORACLE = { // sound framing knowledge but never self-checks: delivers everything
  plan: (c) => ({ pos: c.lungPos, size: "M", waitForHold: false }),
  deliverAnything: true,
};
const OPTIMAL = { // reads the patient: cheapest covering frame, waits for hold
  plan: (c) => {
    for (const s of FRAME_SIZES) for (const p of FRAME_POSITIONS) if (frameCovers(c, p, s) && FRAME_COST[s] === minimalCost(c)) return { pos: p, size: s, waitForHold: true };
    return { pos: "mid", size: "L", waitForHold: true };
  },
  deliverAnything: false,
};

function runMany(strategy, n, seed) {
  const rand = rng(seed);
  const out = { delivered: 0, failed: 0, exposures: 0 };
  for (let i = 0; i < n; i++) {
    const c = newCase(rand);
    const r = playCase(c, strategy, rand);
    if (r.result === "delivered") { out.delivered++; out.exposures += r.exposures; }
    else out.failed++;
  }
  return out;
}

const N = 400;
const spam = runMany(SPAM, N, 1);
check("button spam mostly fails", spam.failed / N > 0.5, `${spam.failed}/${N} failed`);
const ignoreC = runMany(IGNORE_C, N, 2);
check("C-ignoring random play mostly fails", ignoreC.failed / N > 0.5, `${ignoreC.failed}/${N} failed`);
const alwaysLMid = runMany(ALWAYS_L_MID, N, 3);
// Physically honest bound: a big field DOES fit small patients (~5/9 of cases),
// but never-looking must stay far from reliable AND keep the double dose cost.
check("blind always-L(mid) is NOT a dominant strategy", alwaysLMid.delivered / N < 0.65 && alwaysLMid.delivered / N < optimalRateFloor(), `${alwaysLMid.delivered}/${N} delivered at cost 2`);
function optimalRateFloor() { return 0.95; }
const lReadPos = runMany(L_READ_POS, N, 7);
check("L with posture-reading works but costs double (risk/reward)", lReadPos.delivered / N > 0.8 && lReadPos.exposures / lReadPos.delivered >= 2, `avg exposures ${(lReadPos.exposures / Math.max(1, lReadPos.delivered)).toFixed(2)}`);
const oracle = runMany(DELIVERY_ORACLE, N, 8);
check("delivery-oracle spam mostly fails (no free answer machine)", oracle.failed / N > 0.5, `${oracle.failed}/${N} failed`);
const optimal = runMany(OPTIMAL, N, 4);
check("informed play succeeds", optimal.delivered / N > 0.95, `${optimal.delivered}/${N}`);
check("mastery gap exists (optimal cheaper than L-everything)", optimal.exposures / optimal.delivered < lReadPos.exposures / lReadPos.delivered, `${(optimal.exposures / optimal.delivered).toFixed(2)} vs ${(lReadPos.exposures / lReadPos.delivered).toFixed(2)}`);

// note phase: select-all is impossible (single choice), correctness varies by case
{
  const rand = rng(5);
  let variance = new Set();
  for (let i = 0; i < 30; i++) variance.add(newCase(rand).haze);
  check("note answer varies across cases (no memorized answer)", variance.size === 3);
  check("note: wrong guess is detected", !noteIsCorrect({ build: "medium", lungPos: "mid", haze: "right" }, "left"));
}

// edge: budget arithmetic — L shot at 4 used must be refused before exposure
check("budget refuses unaffordable shot", !canAfford(3, "L") && canAfford(3, "M") && !canAfford(4, "S"));

// perfect play definition sanity
check("perfect requires minimal exposures", isPerfect({ build: "large", lungPos: "mid", haze: "none" }, 2, 0, true) && !isPerfect({ build: "medium", lungPos: "mid", haze: "none" }, 2, 0, true));

// variation across runs: framing answer distribution is not constant
{
  const rand = rng(6);
  const sols = new Set();
  for (let i = 0; i < 40; i++) {
    const c = newCase(rand);
    for (const p of FRAME_POSITIONS) for (const s of FRAME_SIZES) if (frameCovers(c, p, s) && FRAME_COST[s] === minimalCost(c)) { sols.add(p + s); }
  }
  check("optimal framing varies across cases", sols.size >= 4, [...sols].join(","));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
