#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-hotel-receive
// (ホテル・旅館の団体受入担当 — per-group room-fit verification + per-student allergy meal
// handling, gameType hotel_receive).
//
// v2 (design review r1 FAIL 58, BLOCKER x2 repair):
//
// BLOCKER 1 fix (room assignment had no real grounding for "exact capacity match only"): v1 scored
// ONLY the room type whose capacity exactly equaled the group's size as correct, and constructed
// group sizes to always exactly equal one of the three room capacities (3/4/6) to avoid an obviously
// invented "always prefer the smallest sufficient room" tie-break rule. The reviewer correctly
// pointed out this didn't remove the invented rule, it just hid it: research.md documents hotels
// fitting a group into ANY room with SUFFICIENT capacity (実際に空いている客室へ当てはめる), never a
// rule that a larger, still-workable room is wrong. v2 replaces "pick the one correct room type"
// with a VERIFICATION task that only needs a sufficiency check, which research.md directly supports
// without any invented preference: each group is shown a PROPOSED room type (as if already tentatively
// assigned by the booking system) and the child's job is to confirm whether that room's real capacity
// is enough for the group's actual size, or flag it as too small and requiring a different room. This
// mirrors the real front-desk task of matching a school's stated room-type request against actual
// room capacity, without asserting any single "correct" room among several that would all physically
// fit.
//
// BLOCKER 2 fix (allergy data compressed from per-student to per-group, losing who actually needs
// the separate meal): v1 modeled one allergy flag per GROUP and one meal choice per GROUP ("special"
// vs "normal" for the whole group), but research.md's actual 食物アレルギー事前調査票 is a per-STUDENT
// form (named individual, 7-item allergen checklist per person), and the real D is "that specific
// student's meal is set aside" -- not switching every student in the group to a special meal because
// one of them has an allergy. v2 models each group as a small roster of named members; the child's
// job per group is to correctly identify the SET of members who need 個別対応食 (their allergy card
// shows a real 7-item checklist per member), leaving everyone else on the normal menu. sessionWin
// requires the selected special-meal set to exactly match the members who actually have >=1 flagged
// allergen -- both including someone who needs it and excluding someone who doesn't are failures.
//
// Also fixes the MEDIUM finding SIMULATOR_GENERATOR_BUG (v1's allergen generator called
// ALLERGENS.filter() twice independently, so a "has allergy" draw could still return an empty
// flagged-allergen list on the second, differently-random call) -- v2 filters once and reuses the
// result.

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
export const ALLERGENS = ["egg", "milk", "wheat", "buckwheat", "peanut", "shrimp", "crab"]; // 7大アレルギー品目
export const MEMBER_LABELS = ["A", "B", "C", "D", "E", "F"]; // Aさん・Bさん... (up to 6, matches max group size)

function newGroup(rand) {
  // Real group size: not constrained to exactly match a room capacity -- any of 3-6 is plausible,
  // so a proposed room can genuinely be sufficient, insufficient, or generously oversized.
  const size = 3 + Math.floor(rand() * 4); // 3,4,5,6
  const proposedRoom = ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)];
  const roomOk = ROOM_CAPACITY[proposedRoom] >= size;

  // Each named member independently may have a real allergen flagged (single filter pass, reused).
  const flaggedMembers = [];
  for (let i = 0; i < size; i++) {
    const memberAllergens = ALLERGENS.filter(() => rand() < 0.12); // ~12% per allergen per member
    if (memberAllergens.length > 0) flaggedMembers.push(i);
  }
  return { size, proposedRoom, roomOk, flaggedMembers };
}

export function newSession(rand = Math.random) {
  return { groups: GROUP_NAMES.map(() => newGroup(rand)) };
}

// picks: [{ acceptRoom: bool, specialMealMembers: number[] }, ...] in GROUP_NAMES order
export function sessionWin(session, picks) {
  return session.groups.every((g, i) => {
    const p = picks[i];
    if (p.acceptRoom !== g.roomOk) return false;
    const selected = [...p.specialMealMembers].sort((a, b) => a - b);
    const correct = [...g.flaggedMembers].sort((a, b) => a - b);
    return selected.length === correct.length && selected.every((v, idx) => v === correct[idx]);
  });
}

function legitimatePicks(session) {
  return session.groups.map((g) => ({ acceptRoom: g.roomOk, specialMealMembers: g.flaggedMembers }));
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

  results.legitimate_full_reasoning = rate((s) => sessionWin(s, legitimatePicks(s)));

  // Content-blind random: room verdict is a coin flip, meal selection guesses a random subset
  // (each member independently included with 50% probability).
  results.random_pick = rate((s, rand) =>
    sessionWin(
      s,
      s.groups.map((g) => ({
        acceptRoom: rand() < 0.5,
        specialMealMembers: Array.from({ length: g.size }, (_, i) => i).filter(() => rand() < 0.5),
      }))
    )
  );

  // Always accept the proposed room (never checks capacity), meal read correctly.
  results.room_always_accept = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ acceptRoom: true, specialMealMembers: g.flaggedMembers })))
  );
  // Always reject the proposed room, meal read correctly.
  results.room_always_reject = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ acceptRoom: false, specialMealMembers: g.flaggedMembers })))
  );
  // Ignores the allergy roster entirely (always selects nobody for special meal), room read correctly.
  results.meal_ignored_selects_nobody = rate((s) =>
    sessionWin(s, s.groups.map((g) => ({ acceptRoom: g.roomOk, specialMealMembers: [] })))
  );
  // Ignores the allergy roster entirely but over-cautiously selects EVERYONE for special meal
  // (the exact distortion BLOCKER 2 warned about -- "switch the whole group" instead of reading who
  // actually needs it), room read correctly.
  results.meal_ignored_selects_everyone = rate((s) =>
    sessionWin(
      s,
      s.groups.map((g) => ({ acceptRoom: g.roomOk, specialMealMembers: Array.from({ length: g.size }, (_, i) => i) }))
    )
  );

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning always wins (every session solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.05, `${results.random_pick}`);
  check("always-accept room verdict (ignoring capacity check) fails well below full reasoning", results.room_always_accept <= 0.5, `${results.room_always_accept}`);
  check("always-reject room verdict (ignoring capacity check) fails well below full reasoning", results.room_always_reject <= 0.5, `${results.room_always_reject}`);
  check("ignoring the allergy roster (selecting nobody) fails well below full reasoning", results.meal_ignored_selects_nobody <= 0.5, `${results.meal_ignored_selects_nobody}`);
  check("ignoring the allergy roster (over-cautiously selecting everyone) fails well below full reasoning -- this is the exact distortion BLOCKER 2 warned against, and must not accidentally be a winning strategy", results.meal_ignored_selects_everyone <= 0.3, `${results.meal_ignored_selects_everyone}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
