#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-hotel-receive
// (ホテル・旅館の団体受入担当 — per-group room-type assignment + allergy meal handling, gameType hotel_receive).
//
// Reverse audit (factory/state/legacy/reverse-audits/hotel_receive.json): brute_force (wrong
// placements could be retried at zero cost), plus a decorative-data finding: the OLD game's 月組
// card said "wants to rest immediately on arrival" but the win condition never used that fact.
//
// research.md's finding (§4, "休みたい／体調が心配という班の申告は、実際どこに効くのか") is the
// single most important constraint on this redesign: NO documented real-world link was found between
// a group's stated rest/fatigue need and the PHYSICAL POSITION of their room (proximity to chaperone,
// etc). What IS real: (a) reserving spare rest-rooms at the PROPERTY level (a booking-stage decision,
// not a per-group placement decision), and (b) reactive care AFTER a student actually falls ill
// (handled by the chaperone, not the hotel). Both are outside what a front-desk group-reception
// worker actually decides per group at check-in. Per the same discipline established across this
// session's legacy rebuilds (never invent a causal link research doesn't document -- see
// legacy-move-try's design-sim.mjs header for the expensive version of this lesson), this redesign
// does NOT carry the "rest need -> room position" datum forward at all, decorative or otherwise --
// not even as a disclosed simplification, since research.md found no real intervention room-position
// alone genuinely addresses either.
//
// What research.md DOES document with a specific, direct causal chain (§2): a group's food-allergy
// declaration (7 real allergen items, matching the real 食物アレルギー事前調査票 used in the
// documented school -> parent -> school -> facility information flow) directly determines whether
// that group's meal is handled as 通常メニュー or 個別対応食 (別膳) -- this is THE cleanest, most
// specifically-grounded C->D link found in the research, and is this design's primary judgment.
//
// research.md also documents (§1) real room-type capacities (using the actual figures from Mikazuki
// Ryugujo's published school-trip guide: トリプルルーム定員3, 基準室定員4, 特別室定員6) and that the
// hotel's real job is fitting a group of a given size into a room type with sufficient capacity (the
// school decides WHO is grouped together; the hotel decides WHICH room type that group goes into).
// Group sizes are drawn to exactly match one of the three real capacities each session (3, 4, or 6),
// so "which room type fits this group" has one unambiguous, capacity-grounded answer per group --
// no invented "always prefer the smallest room" preference is needed, since size and capacity match
// exactly by construction.
//
// Each of 3 groups (per session) requires its OWN size card and allergy card to be read before
// committing BOTH the room-type and meal-type choice for that group in a single commit (mirroring
// this session's established single-commit-per-unit pattern that closes the brute_force finding --
// no retry after a wrong commit).

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GROUP_NAMES = ["hana", "tsuki", "hoshi"]; // 花組・月組・星組
export const ROOM_TYPES = ["triple", "basic", "special"]; // トリプルルーム(定員3) / 基準室(定員4) / 特別室(定員6)
export const ROOM_CAPACITY = { triple: 3, basic: 4, special: 6 };
export const MEAL_TYPES = ["normal", "special"]; // 通常メニュー / 個別対応食（別膳）
export const ALLERGENS = ["egg", "milk", "wheat", "buckwheat", "peanut", "shrimp", "crab"]; // 7大アレルギー品目

function newGroup(rand) {
  const size = ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)]; // reuse index to pick capacity tier
  const correctRoom = size; // by construction, size tier === room type id (capacity matches exactly)
  const hasAllergy = rand() < 0.5;
  const flaggedAllergens = hasAllergy
    ? ALLERGENS.filter(() => rand() < 0.35).length > 0
      ? ALLERGENS.filter(() => rand() < 0.35)
      : [ALLERGENS[Math.floor(rand() * ALLERGENS.length)]] // guarantee at least 1 if hasAllergy
    : [];
  const correctMeal = flaggedAllergens.length > 0 ? "special" : "normal";
  return { correctRoom, flaggedAllergens, correctMeal };
}

export function newSession(rand = Math.random) {
  return { groups: GROUP_NAMES.map(() => newGroup(rand)) };
}

export function sessionWin(session, picks) {
  // picks: [{room, meal}, {room, meal}, {room, meal}] in GROUP_NAMES order
  return session.groups.every((g, i) => picks[i].room === g.correctRoom && picks[i].meal === g.correctMeal);
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

  results.legitimate_full_reasoning = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ room: g.correctRoom, meal: g.correctMeal })))
  );

  // Fully blind random guessing across all 3 groups' room+meal choices.
  results.random_pick = rate((s, rand) =>
    sessionWin(
      s,
      s.groups.map(() => ({
        room: ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)],
        meal: MEAL_TYPES[Math.floor(rand() * MEAL_TYPES.length)],
      }))
    )
  );

  // Fixed-room strategy: always assign the same room type to every group (meal read correctly).
  for (const fixedRoom of ROOM_TYPES) {
    results[`fixed_room_${fixedRoom}`] = rate((s) =>
      sessionWin(s, s.groups.map((g) => ({ room: fixedRoom, meal: g.correctMeal })))
    );
  }
  // Fixed-meal strategy: always assign the same meal type to every group (room read correctly).
  for (const fixedMeal of MEAL_TYPES) {
    results[`fixed_meal_${fixedMeal}`] = rate((s) =>
      sessionWin(s, s.groups.map((g) => ({ room: g.correctRoom, meal: fixedMeal })))
    );
  }

  // Ignores the allergy card entirely (always guesses "normal"), reads room size correctly for all groups.
  results.meal_ignored_always_normal = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ room: g.correctRoom, meal: "normal" })))
  );
  // Ignores the size card entirely (always guesses "basic"), reads allergy correctly for all groups.
  results.room_ignored_always_basic = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ room: "basic", meal: g.correctMeal })))
  );
  // Reads NEITHER card for ANY group -- pure guess on both axes for all 3 groups (same as random_pick,
  // kept as a named alias for clarity in the report).
  results.reads_nothing = results.random_pick;

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning always wins (every session solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.05, `${results.random_pick}`);
  check("every fixed-room guess (meal read correctly) fails well below full reasoning", ROOM_TYPES.every((r) => results[`fixed_room_${r}`] <= 0.1), JSON.stringify(Object.fromEntries(ROOM_TYPES.map((r) => [r, results[`fixed_room_${r}`]]))));
  check("every fixed-meal guess (room read correctly) fails well below full reasoning", MEAL_TYPES.every((m) => results[`fixed_meal_${m}`] <= 0.2), JSON.stringify(Object.fromEntries(MEAL_TYPES.map((m) => [m, results[`fixed_meal_${m}`]]))));
  check("ignoring the allergy card entirely (always 'normal') fails well below full reasoning", results.meal_ignored_always_normal <= 0.2, `${results.meal_ignored_always_normal}`);
  check("ignoring the size card entirely (always 'basic') fails well below full reasoning", results.room_ignored_always_basic <= 0.1, `${results.room_ignored_always_basic}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
