#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-allocate-and-forecast
// (渇水対策連絡協議会 — sector-cut + restriction-depth judgment, gameType allocate_and_forecast).
//
// CORE (dual decision, mirrors the location+tool pattern proven safe in legacy-layer-and-compare):
//  Decision 1 -- WHICH sector bears this week's deep cut: household / agriculture / industrial.
//    Real grounding (research.md sections 1, 4): household is always protected in practice even
//    when it has backup capacity (社会的影響を避ける傾向) -- it is a genuine confound, never the
//    correct answer, but its ALT reading sometimes lights up just like a real target's ALT reading,
//    so a "just cut whichever sector looks like it has slack" heuristic must be defeated by also
//    checking urgency. Agriculture is correct when it's off its 代かき期 vulnerable window AND has
//    番水 slack; industrial is correct when it's off its production peak AND has a real 応援給水
//    mutual-aid agreement. Exactly one of {agriculture, industrial} is correct per session
//    (archetypeSector), matching the real asymmetric-restriction fact (4節: one sector is cut,
//    others are untouched).
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

// The non-target real sector (whichever of agriculture/industrial is NOT this session's correct
// answer) is drawn from 3 patterns -- deliberately excluding (urgency=no, alt=yes), which would tie
// the target's own signature and make the session ambiguous (two equally "safe" sectors). Cycling
// through the other 3 combinations means the non-target sometimes mimics the target on urgency
// alone, sometimes on alt alone, sometimes on neither -- so neither axis read in isolation ever
// reliably separates target from non-target.
const NON_TARGET_PATTERNS = [
  { urgency: "no", alt: "no" }, // mimics target's urgency, differs on alt
  { urgency: "yes", alt: "yes" }, // mimics target's alt, differs on urgency
  { urgency: "yes", alt: "no" }, // matches neither axis
];

export function newSession(rand = Math.random) {
  const archetypeSector = rand() < 0.5 ? "agriculture" : "industrial";
  const otherSector = archetypeSector === "agriculture" ? "industrial" : "agriculture";

  const nonTargetPattern = NON_TARGET_PATTERNS[Math.floor(rand() * NON_TARGET_PATTERNS.length)];

  // Household: drawn from the SAME 3-pattern pool as the non-target real sector (never the target's
  // own (urgency=no, alt=yes) signature -- research.md §1/§4: households are protected by policy
  // even when one factor looks favorable, so it never shows BOTH slack signals at once). Household's
  // readings genuinely vary session to session, so a scan that checks only ONE axis (urgency-only or
  // alt-only) sometimes finds a false match at household too, not just at the real non-target sector
  // -- this is what keeps a single-axis-only strategy from reliably narrowing straight down to the 2
  // real candidates and coin-flipping between them (the mathematical floor a 2-candidate-only version
  // of this decision could not avoid).
  const householdPattern = NON_TARGET_PATTERNS[Math.floor(rand() * NON_TARGET_PATTERNS.length)];

  const sectors = {
    household: householdPattern,
    [archetypeSector]: { urgency: "no", alt: "yes" },
    [otherSector]: nonTargetPattern,
  };

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

  // "ALT-only, scan household -> agriculture -> industrial, cut first sector showing alt=yes,
  // ignore urgency entirely" -- the exact CORE_DATA_AXIS_NOT_REQUIRED-class exploit legacy-
  // layer-and-compare's design review r1 found (there: reading sun-or-pavement only, never wind).
  results.alt_only_scan_never_urgency = rate((s) => {
    const order = ["household", "agriculture", "industrial"];
    const pick = order.find((sec) => s.sectors[sec].alt === "yes") ?? "household";
    return sessionWin(s, pick, s.correctDepth);
  });
  // Same but combined with random depth guessing too (fully content-blind on decision 2)
  results.alt_only_scan_random_depth = rate((s, rand) => {
    const order = ["household", "agriculture", "industrial"];
    const pick = order.find((sec) => s.sectors[sec].alt === "yes") ?? "household";
    return sessionWin(s, pick, DEPTHS[Math.floor(rand() * DEPTHS.length)]);
  });

  // "urgency-only, scan for first sector with urgency=no, ignore alt" -- symmetric single-axis check
  results.urgency_only_scan_never_alt = rate((s) => {
    const order = ["household", "agriculture", "industrial"];
    const pick = order.find((sec) => s.sectors[sec].urgency === "no") ?? "agriculture";
    return sessionWin(s, pick, s.correctDepth);
  });

  // "always cut household" (biggest raw usage-share magnitude decoy per research.md's framing)
  results.household_always = rate((s) => sessionWin(s, "household", s.correctDepth));

  // "Household is always protected, so skip it entirely and reason properly (BOTH axes) about
  // agriculture vs industrial." This is NOT content-blind -- it still requires genuinely reading
  // both urgency and alt for whichever of agriculture/industrial is live each session (a real,
  // teachable constant about household plus full 2-axis reasoning on the two sectors that actually
  // vary is exactly correct play, not a shortcut around the data). Expected to reach ~100%; recorded
  // to make that explicit rather than assumed. The two checks below it are the ones that actually
  // matter: excluding household must NOT also let a single-axis-only read of the remaining two
  // sectors succeed, or household's presence in the full 3-way pool would be doing all the exploit
  // -resistance work by itself with nothing backing up the 2-candidate sub-case.
  results.exclude_household_then_full_reasoning = rate((s, rand) => {
    const candidates = ["agriculture", "industrial"];
    const altYes = candidates.filter((c) => s.sectors[c].alt === "yes");
    if (altYes.length === 1) return sessionWin(s, altYes[0], s.correctDepth);
    const urgNo = candidates.filter((c) => s.sectors[c].urgency === "no");
    if (urgNo.length === 1) return sessionWin(s, urgNo[0], s.correctDepth);
    return sessionWin(s, candidates[Math.floor(rand() * 2)], s.correctDepth);
  });
  results.exclude_household_then_alt_only = rate((s, rand) => {
    const candidates = ["agriculture", "industrial"];
    const altYes = candidates.filter((c) => s.sectors[c].alt === "yes");
    const pick = altYes.length === 1 ? altYes[0] : candidates[Math.floor(rand() * 2)];
    return sessionWin(s, pick, s.correctDepth);
  });
  results.exclude_household_then_urgency_only = rate((s, rand) => {
    const candidates = ["agriculture", "industrial"];
    const urgNo = candidates.filter((c) => s.sectors[c].urgency === "no");
    const pick = urgNo.length === 1 ? urgNo[0] : candidates[Math.floor(rand() * 2)];
    return sessionWin(s, pick, s.correctDepth);
  });

  // Worst-case realistic combo: a child who has learned to skip household but still only reads ONE
  // axis on the sector decision (~83%, above), combined with ONLY reading reservoir for depth (50%,
  // below) -- the two weakest-but-still-above-chance partial strategies multiplied together.
  results.exclude_household_single_axis_and_reservoir_only_depth = rate((s, rand) => {
    const candidates = ["agriculture", "industrial"];
    const altYes = candidates.filter((c) => s.sectors[c].alt === "yes");
    const sectorPick = altYes.length === 1 ? altYes[0] : candidates[Math.floor(rand() * 2)];
    const depthPick = s.reservoir === "HIGH" ? "light" : "heavy";
    return sessionWin(s, sectorPick, depthPick);
  });

  // Decision-2 single-axis heuristics (reservoir-only / rain-only, correct sector assumed known)
  results.reservoir_only_depth = rate((s) => {
    const depth = s.reservoir === "HIGH" ? "light" : "heavy";
    return sessionWin(s, s.correctSector, depth);
  });
  results.rain_only_depth = rate((s) => {
    const depth = s.rain === "SOON" ? "light" : "heavy";
    return sessionWin(s, s.correctSector, depth);
  });

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning always wins (every session solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("every fixed (sector,depth) guess fails well below reasoning (chance level is 1/3 sector x 1/4-ish depth distribution)", Object.keys(results).filter((k) => k.startsWith("fixed_")).every((k) => results[k] <= 0.3), JSON.stringify(Object.fromEntries(Object.entries(results).filter(([k]) => k.startsWith("fixed_")))));
  check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.2, `${results.random_pick}`);
  check("correct sector + random depth stays capped near 1/3 (depth still genuinely needs reading)", results.correct_sector_random_depth <= 0.4, `${results.correct_sector_random_depth}`);
  check("correct depth + random sector stays capped near 1/3 (sector still genuinely needs reading)", results.correct_depth_random_sector <= 0.4, `${results.correct_depth_random_sector}`);
  check("'alt-only scan, never check urgency' (household-confound exploit) stays capped near 50%", results.alt_only_scan_never_urgency <= 0.6, `${results.alt_only_scan_never_urgency}`);
  check("'alt-only scan' combined with random depth guessing stays well below full reasoning", results.alt_only_scan_random_depth <= 0.3, `${results.alt_only_scan_random_depth}`);
  check("'urgency-only scan, never check alt' stays capped near 50%", results.urgency_only_scan_never_alt <= 0.6, `${results.urgency_only_scan_never_alt}`);
  check("'always cut household' (magnitude decoy) always fails -- household is never correct", results.household_always === 0, `${results.household_always}`);
  check("'exclude household, then genuinely read BOTH axes on agri/industrial' reaches full reasoning -- this is correct play using a real constant fact, not an exploit", results.exclude_household_then_full_reasoning === 1, `${results.exclude_household_then_full_reasoning}`);
  check("'exclude household, then alt-axis ONLY' still stays capped well below full reasoning (household's presence isn't secretly the only thing defeating this)", results.exclude_household_then_alt_only <= 0.85, `${results.exclude_household_then_alt_only}`);
  check("'exclude household, then urgency-axis ONLY' still stays capped well below full reasoning", results.exclude_household_then_urgency_only <= 0.85, `${results.exclude_household_then_urgency_only}`);
  check("worst-case realistic combo (skip household + single-axis sector read + single-axis depth read) stays comfortably below full reasoning", results.exclude_household_single_axis_and_reservoir_only_depth <= 0.5, `${results.exclude_household_single_axis_and_reservoir_only_depth}`);
  check("reservoir-only depth heuristic caps at exactly 50% (hand-derived)", Math.abs(results.reservoir_only_depth - results.legitimate_full_reasoning * 0.5) < 0.05 || results.reservoir_only_depth <= 0.55, `${results.reservoir_only_depth}`);
  check("rain-only depth heuristic caps at exactly 50% (hand-derived)", results.rain_only_depth <= 0.55, `${results.rain_only_depth}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
