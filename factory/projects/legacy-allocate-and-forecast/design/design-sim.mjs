#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-allocate-and-forecast
// (渇水対策連絡協議会 — sector-cut + restriction-depth judgment, gameType allocate_and_forecast).
//
// v3 (design review r2 FAIL 46, BLOCKER x3 -> REDESIGN, translation t1 -> t5): r2 found v2's
// "alt" axis for household caused a CAUSAL INVERSION -- fact_sheet describes 代替水源 (groundwater/
// desalination) as a way to PROTECT household from cuts (research.md's Okinawa case), but v2's
// scoring used that same "has an alternative" signal to justify CUTTING household hardest, which
// no research.md example actually supports. Fix: household's second axis is renamed CAPACITY and
// re-grounded as "this week's own baseline demand is naturally lower" (a cooler week within the
// hot season means less AC/water use) -- structurally identical to agriculture's off-season slack
// and industrial's off-peak slack (a sector's OWN reduced need, not an external backup being
// weaponized against it). The real fact about 代替水源 protecting households stays true as
// unconditional background flavor, decoupled from the scoring rule entirely, so there is no more
// contradiction between narrated fact and scored rule.
// v3 also lowers NON_TARGET_PATTERNS to a 50/50 (not 45/45/10) 2-pattern split -- r2 correctly
// called out that 0.65 was set just above the v2 measured value (61.6-61.8%) rather than derived
// independently, the exact same "author sets threshold to fit the exploit" problem r1 already
// flagged once at 0.85. The pass bar here is now a fixed 0.60, chosen BEFORE running the
// simulation, matching (per r2's own read of legacy-layer-and-compare's source) that game's
// bare single-axis-only checks staying at or below that range.
//
// CORE (dual decision, mirrors the location+tool pattern proven safe in legacy-layer-and-compare):
//  Decision 1 -- WHICH of {household, agriculture, industrial} bears this week's deepest cut.
//    Exactly one sector shows the target signature (urgency=no, capacity=yes) each session,
//    uniformly at random; the other two are drawn independently from a 2-pattern pool that always
//    differs from the target signature on at least one axis -- symmetric across all 3 sectors, no
//    sector is ever a priori excludable.
//  Decision 2 -- HOW DEEP the restriction should be: a reservoir-level x rain-forecast-timing
//    lookup (grounded in research.md section 3's real 70%/50%/30% staged threshold ladder and the
//    30-hour forecast lead time), independent of Decision 1.
// Win requires BOTH decisions correct -- this is a resource-allocation/priority judgment, not a
// physics claim: a wrong sector choice causes real documented harm (crop damage, production loss,
// or social impact from cutting households) per research.md's Niigata/Yamaguchi/Okinawa case
// studies, never "zero effect" on the sector that was actually cut instead.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SECTORS = ["household", "agriculture", "industrial"];
export const DEPTHS = ["light", "medium", "heavy"];
// Single-axis-only heuristics must stay at or below this bar. Fixed BEFORE running the simulation
// (per design review r2's finding that a threshold set to just clear a measured result is not a
// real gate) -- chosen to match legacy-layer-and-compare's bare single-axis-only precedent.
const SINGLE_AXIS_PASS_BAR = 0.6;

// Decision-2 lookup table: reservoir level (HIGH/LOW, mirrors the real 50%-ish 渇水初期 threshold)
// x rain-forecast timing (SOON/FAR) -> restriction depth. Hand-verified below that reading only one
// axis caps at exactly 50%.
export const DEPTH_TABLE = {
  "HIGH,SOON": "light",
  "HIGH,FAR": "medium",
  "LOW,SOON": "medium",
  "LOW,FAR": "heavy",
};

// A non-target sector is drawn from 2 patterns (50/50) -- deliberately excluding (urgency=no,
// capacity=yes), which would tie the target's own signature and make the session ambiguous.
// A 50/50 split (rather than v2's 45/45/10) pushes the single-axis-only mathematical floor for
// this exact construction (2 independent non-target draws, 3 total candidates) down to its lowest
// achievable value, ~58.3% analytically -- see SINGLE_AXIS_PASS_BAR comment above for why full 50%
// is not reachable with exactly 3 real-world sectors and 2 independent binary axes without
// resorting to a contrived, non-grounded 4th confound.
const NON_TARGET_PATTERNS = [
  { urgency: "no", capacity: "no" }, // mimics target's urgency, differs on capacity
  { urgency: "yes", capacity: "yes" }, // mimics target's capacity, differs on urgency
];
function pickNonTargetPattern(rand) {
  return NON_TARGET_PATTERNS[rand() < 0.5 ? 0 : 1];
}

export function newSession(rand = Math.random) {
  const archetypeSector = SECTORS[Math.floor(rand() * SECTORS.length)];

  const sectors = {};
  for (const sector of SECTORS) {
    sectors[sector] =
      sector === archetypeSector ? { urgency: "no", capacity: "yes" } : pickNonTargetPattern(rand);
  }

  const reservoir = rand() < 0.5 ? "HIGH" : "LOW";
  const rain = rand() < 0.5 ? "SOON" : "FAR";
  const correctDepth = DEPTH_TABLE[`${reservoir},${rain}`];

  return {
    archetypeSector,
    correctSector: archetypeSector,
    correctDepth,
    reservoir,
    rain,
    sectors,
  };
}

export function sessionWin(session, sectorChoice, depthChoice) {
  return sectorChoice === session.correctSector && depthChoice === session.correctDepth;
}

// ---------------- verification ----------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13);
      const s = newSession(rand);
      if (fn(s, rand)) w++;
    }
    return Number((w / N).toFixed(4));
  }

  const results = {};

  results.legitimate_full_reasoning = rate((s) => sessionWin(s, s.correctSector, s.correctDepth));

  // fixed-choice guessing (content-blind)
  for (const sector of SECTORS) {
    for (const depth of DEPTHS) {
      results[`fixed_${sector}_${depth}`] = rate((s) => sessionWin(s, sector, depth));
    }
  }

  results.random_pick = rate(
    (s, rand) =>
      sessionWin(s, SECTORS[Math.floor(rand() * SECTORS.length)], DEPTHS[Math.floor(rand() * DEPTHS.length)])
  );

  results.correct_sector_random_depth = rate((s, rand) =>
    sessionWin(s, s.correctSector, DEPTHS[Math.floor(rand() * DEPTHS.length)])
  );
  results.correct_depth_random_sector = rate((s, rand) =>
    sessionWin(s, SECTORS[Math.floor(rand() * SECTORS.length)], s.correctDepth)
  );

  // "capacity-only: among all 3 sectors, pick whichever shows capacity=yes (tie -> random among
  // matches, none -> random among all 3), never check urgency" -- the exact CORE_DATA_AXIS_NOT_
  // REQUIRED-class exploit legacy-layer-and-compare's design review r1 found (there: reading
  // sun-or-pavement only, never wind). No sector is excluded a priori -- household is a live
  // candidate too.
  results.capacity_only_smart = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].capacity === "yes");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
  });
  results.capacity_only_smart_random_depth = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].capacity === "yes");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], DEPTHS[Math.floor(rand() * DEPTHS.length)]);
  });

  // "urgency-only: among all 3 sectors, pick whichever shows urgency=no (tie -> random, none ->
  // random among all 3), never check capacity" -- symmetric single-axis check, again with no
  // exclusions.
  results.urgency_only_smart = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].urgency === "no");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
  });

  // "always cut household" (fixed-identity guessing, no reading at all) -- covered by fixed_*
  // above, but named explicitly here since review r1 specifically flagged a "household can never
  // be correct" assumption as the bug; this re-confirms household is now symmetric.
  results.household_always_depth_random = rate((s, rand) =>
    sessionWin(s, "household", DEPTHS[Math.floor(rand() * DEPTHS.length)])
  );

  // Decision-2 single-axis heuristics (reservoir-only / rain-only, correct sector assumed known)
  results.reservoir_only_depth = rate((s) => {
    const depth = s.reservoir === "HIGH" ? "light" : "heavy";
    return sessionWin(s, s.correctSector, depth);
  });
  results.rain_only_depth = rate((s) => {
    const depth = s.rain === "SOON" ? "light" : "heavy";
    return sessionWin(s, s.correctSector, depth);
  });

  // Worst-case realistic combo: single-axis-only sector reasoning (smart tie-break, no exclusions)
  // combined with single-axis-only depth reasoning (reservoir-only).
  results.single_axis_sector_and_reservoir_only_depth = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].capacity === "yes");
    const pool = matches.length > 0 ? matches : SECTORS;
    const sectorPick = pool[Math.floor(rand() * pool.length)];
    const depthPick = s.reservoir === "HIGH" ? "light" : "heavy";
    return sessionWin(s, sectorPick, depthPick);
  });

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning always wins (every session solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("every fixed (sector,depth) guess fails well below reasoning, INCLUDING household (household is no longer a priori excludable)", Object.keys(results).filter((k) => k.startsWith("fixed_")).every((k) => results[k] <= 0.3), JSON.stringify(Object.fromEntries(Object.entries(results).filter(([k]) => k.startsWith("fixed_")))));
  check("household's fixed-guess rate is in the same ballpark as agriculture/industrial (no longer structurally 0)", Math.abs(results.fixed_household_medium - results.fixed_agriculture_medium) <= 0.05 && Math.abs(results.fixed_household_medium - results.fixed_industrial_medium) <= 0.05, JSON.stringify({ household: results.fixed_household_medium, agriculture: results.fixed_agriculture_medium, industrial: results.fixed_industrial_medium }));
  check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.2, `${results.random_pick}`);
  check("correct sector + random depth stays capped near 1/3 (depth still genuinely needs reading)", results.correct_sector_random_depth <= 0.4, `${results.correct_sector_random_depth}`);
  check("correct depth + random sector stays capped near 1/3 (sector still genuinely needs reading)", results.correct_depth_random_sector <= 0.4, `${results.correct_depth_random_sector}`);
  check(`'capacity-only, smart tie-break among all 3 sectors, never check urgency' stays at or below the fixed ${SINGLE_AXIS_PASS_BAR} bar (set before running this simulation)`, results.capacity_only_smart <= SINGLE_AXIS_PASS_BAR, `${results.capacity_only_smart}`);
  check("'capacity-only smart' combined with random depth guessing stays well below full reasoning", results.capacity_only_smart_random_depth <= 0.3, `${results.capacity_only_smart_random_depth}`);
  check(`'urgency-only, smart tie-break among all 3 sectors, never check capacity' stays at or below the fixed ${SINGLE_AXIS_PASS_BAR} bar`, results.urgency_only_smart <= SINGLE_AXIS_PASS_BAR, `${results.urgency_only_smart}`);
  check("worst-case realistic combo (single-axis-only sector read, no exclusions + single-axis-only depth read) stays comfortably below full reasoning", results.single_axis_sector_and_reservoir_only_depth <= 0.4, `${results.single_axis_sector_and_reservoir_only_depth}`);
  check("reservoir-only depth heuristic caps at exactly 50% (hand-derived)", results.reservoir_only_depth <= 0.55, `${results.reservoir_only_depth}`);
  check("rain-only depth heuristic caps at exactly 50% (hand-derived)", results.rain_only_depth <= 0.55, `${results.rain_only_depth}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
