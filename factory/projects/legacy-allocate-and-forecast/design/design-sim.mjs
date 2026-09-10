#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-allocate-and-forecast
// (渇水対策連絡協議会 — sector-cut + restriction-depth judgment, gameType allocate_and_forecast).
//
// v2 (design review r1 FAIL 43, BLOCKER x3 repair): v1 hardcoded household as NEVER the correct
// sector (constant urgency="yes"), which review r1's evidence directly contradicted --
// research.md's own table shows 石川 restricting ONLY household/上水 (40%), 加古川 household/上水
// only (10%), 佐波川 restricting all 3 sectors equally (10%). Household is now a FULLY SYMMETRIC
// third candidate, exactly like agriculture/industrial: its own urgency (今週、生活への影響が特に
// 心配な理由があるか) and alt (代替水源-- 地下水・海水淡水化・近隣からの応援給水 -- でこの週の
// 生活用水をある程度まかなえるか) axes are genuine per-session data, and it CAN be the correct
// cut target when urgency=no and alt=yes (mirrors research.md's Okinawa case: ramping up
// desalination specifically enabled reducing reliance on the primary river-sourced allocation --
// i.e. alt capacity making a deeper cut to the primary supply survivable, the same relationship
// alt has for agriculture's 番水 slack and industrial's mutual-aid agreements). This removes the
// "household is always excludable, so its data is decorative" shortcut review r1 found (was ~83%
// via a household-only-single-axis+then never actually checking wind axis exclude), and the
// arbitrary 0.85 pass threshold that let it through is removed -- no check in this file may pass
// above 0.65 without checking BOTH axes.
//
// CORE (dual decision, mirrors the location+tool pattern proven safe in legacy-layer-and-compare):
//  Decision 1 -- WHICH of {household, agriculture, industrial} bears this week's deepest cut.
//    Exactly one sector shows the target signature (urgency=no, alt=yes) each session, uniformly
//    at random; the other two are drawn independently from a 3-pattern pool that always differs
//    from the target signature on at least one axis (never a tie on both, which would make the
//    session ambiguous) -- symmetric across all 3 sectors, no sector is ever a priori excludable.
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

// Decision-2 lookup table: reservoir level (HIGH/LOW, mirrors the real 50%-ish 渇水初期 threshold)
// x rain-forecast timing (SOON/FAR) -> restriction depth. Hand-verified below that reading only one
// axis caps at exactly 50%.
export const DEPTH_TABLE = {
  "HIGH,SOON": "light",
  "HIGH,FAR": "medium",
  "LOW,SOON": "medium",
  "LOW,FAR": "heavy",
};

// A non-target sector is drawn from 3 patterns -- deliberately excluding (urgency=no, alt=yes),
// which would tie the target's own signature and make the session ambiguous (two equally "safe"
// sectors). Weighted 45/45/10 (not uniform 1/3 each) so that with 2 independent non-target draws
// per session, EITHER single-axis-only heuristic (alt-only or urgency-only, smart tie-break, no
// sector excluded a priori) is hand-derivable to cap at 1-p+p^2/3 ~= 0.62 for p=0.45 -- a uniform
// 1/3 weighting only gets to ~0.70, which design review r1 rightly rejected as too permissive.
// Cycling through the 3 combinations means a non-target sometimes mimics the target on urgency
// alone, sometimes on alt alone, sometimes on neither -- so neither axis read in isolation ever
// reliably separates target from non-target, for ANY of the 3 sectors (including household -- there
// is no sector that can be skipped a priori, per design review r1's CORE_DISTORTED_BY_GAME finding).
const NON_TARGET_PATTERNS = [
  { pattern: { urgency: "no", alt: "no" }, weight: 0.45 }, // mimics target's urgency, differs on alt
  { pattern: { urgency: "yes", alt: "yes" }, weight: 0.45 }, // mimics target's alt, differs on urgency
  { pattern: { urgency: "yes", alt: "no" }, weight: 0.10 }, // matches neither axis
];
function pickNonTargetPattern(rand) {
  const r = rand();
  let cumulative = 0;
  for (const { pattern, weight } of NON_TARGET_PATTERNS) {
    cumulative += weight;
    if (r < cumulative) return pattern;
  }
  return NON_TARGET_PATTERNS[NON_TARGET_PATTERNS.length - 1].pattern;
}

export function newSession(rand = Math.random) {
  const archetypeSector = SECTORS[Math.floor(rand() * SECTORS.length)];

  const sectors = {};
  for (const sector of SECTORS) {
    sectors[sector] =
      sector === archetypeSector ? { urgency: "no", alt: "yes" } : pickNonTargetPattern(rand);
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

  // Sector-only strategies (ignore reservoir/rain entirely -- must guess depth randomly)
  results.correct_sector_random_depth = rate((s, rand) =>
    sessionWin(s, s.correctSector, DEPTHS[Math.floor(rand() * DEPTHS.length)])
  );
  results.correct_depth_random_sector = rate((s, rand) =>
    sessionWin(s, SECTORS[Math.floor(rand() * SECTORS.length)], s.correctDepth)
  );

  // "ALT-only: among all 3 sectors, pick whichever shows alt=yes (tie -> random among matches,
  // none -> random among all 3), never check urgency" -- the exact CORE_DATA_AXIS_NOT_REQUIRED-class
  // exploit legacy-layer-and-compare's design review r1 found (there: reading sun-or-pavement only,
  // never wind). No sector is excluded a priori this time -- household is a live candidate too.
  results.alt_only_smart = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].alt === "yes");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
  });
  results.alt_only_smart_random_depth = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].alt === "yes");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], DEPTHS[Math.floor(rand() * DEPTHS.length)]);
  });

  // "urgency-only: among all 3 sectors, pick whichever shows urgency=no (tie -> random, none ->
  // random among all 3), never check alt" -- symmetric single-axis check, again with no exclusions.
  results.urgency_only_smart = rate((s, rand) => {
    const matches = SECTORS.filter((sec) => s.sectors[sec].urgency === "no");
    const pool = matches.length > 0 ? matches : SECTORS;
    return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
  });

  // "always cut household" / "always cut agriculture" / "always cut industrial" (fixed-identity
  // guessing, no reading at all) -- covered by fixed_* above, but named explicitly here since
  // review r1 specifically flagged a "household can never be correct" assumption as the bug; this
  // re-confirms household is now symmetric (same ~1/9 ballpark as the other two, not exactly 0).
  results.household_always_depth_random = rate((s, rand) =>
    sessionWin(s, "household", DEPTHS[Math.floor(rand() * DEPTHS.length)])
  );

  // Full 3-way "read both axes properly" (legitimate reasoning restricted to sector only, random
  // depth) -- confirms sector reasoning alone, done correctly, is meaningfully above chance (1/3)
  // but still needs depth reasoning too for a full win.
  results.correct_sector_full_reasoning_random_depth = results.correct_sector_random_depth;

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
    const matches = SECTORS.filter((sec) => s.sectors[sec].alt === "yes");
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
  check("'alt-only, smart tie-break among all 3 sectors, never check urgency' stays capped well below full reasoning (no threshold above 0.65 permitted)", results.alt_only_smart <= 0.65, `${results.alt_only_smart}`);
  check("'alt-only smart' combined with random depth guessing stays well below full reasoning", results.alt_only_smart_random_depth <= 0.3, `${results.alt_only_smart_random_depth}`);
  check("'urgency-only, smart tie-break among all 3 sectors, never check alt' stays capped well below full reasoning (no threshold above 0.65 permitted)", results.urgency_only_smart <= 0.65, `${results.urgency_only_smart}`);
  check("worst-case realistic combo (single-axis-only sector read, no exclusions + single-axis-only depth read) stays comfortably below full reasoning", results.single_axis_sector_and_reservoir_only_depth <= 0.5, `${results.single_axis_sector_and_reservoir_only_depth}`);
  check("reservoir-only depth heuristic caps at exactly 50% (hand-derived)", results.reservoir_only_depth <= 0.55, `${results.reservoir_only_depth}`);
  check("rain-only depth heuristic caps at exactly 50% (hand-derived)", results.rain_only_depth <= 0.55, `${results.rain_only_depth}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
