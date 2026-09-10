#!/usr/bin/env node
// Design-stage exploit simulation for legacy-load-and-route / t1-zone-and-route (v4).
//
// Audit finding (factory/state/legacy/reverse-audits/load_and_route.json): exploit=memorize,
// player_judgment_required=false, brute_force=true -- the OLD implementation had 4 fixed cargo
// items with fixed correct storage zones and 2 fixed schools with a hardcoded route order, zero
// randomization, plus per-item failure messages enabling brute-force retry.
//
// v4 fixes over v3 (superseded -- see design-review-r3.result.json, FAIL 68, 1 BLOCKER, 1 HIGH):
// 1. ANSWER_LEAK (BLOCKER): the zone display icons in first_5_seconds/game_translations used
//    food-shaped emoji (🐟 for cold5, 🥛 for cold10) that map 1:1 onto specific drawn foods
//    (さば/牛乳), letting a child solve zone placement by icon-matching without reading the C
//    (storage-limit text) at all. Fixed in design/first_5_seconds_v4.json and
//    design/game_translations_v4.json: zone icons are now neutral (❄️/🌡️ by temperature, not by
//    food shape). This file (design-sim.mjs) has no UI/icon layer, so it required no code change,
//    only the comment/notes update below for chain consistency.
// 2. CORE_DISTORTED_BY_PROSE (HIGH): v3's fact_sheet/comments said "every threshold in the source
//    table is an upper bound, colder is always safe" as a blanket rule -- but that only holds for
//    4 of the 6 real categories (fish/meat/milk/frozen); 生鮮果実・野菜's "10℃前後" is a RANGE
//    (too cold causes quality loss, not a safety issue but still a real constraint per research.md)
//    and 穀類加工品's "室温" is a separate ambient category, not a coldness scale at all. Comments
//    and fact_sheet_v4.json now scope the "colder is safe" claim to only the 4 categories where it
//    is actually true; potato/bread/flour keep exactly one validZone (ambient), matching the
//    (unchanged) FOODS data below.
// 3. LOW: route_zero_winner_rate's assertion only threw on a multi-winner (ambiguous) archetype,
//    not a zero-winner (unsolvable) one. Now asserts both.
//
// v3 fixes over v2 (superseded -- see design-review-r2.result.json, FAIL 62, 1 BLOCKER):
// 1. CORE_DISTORTED_BY_GAME (BLOCKER, still open after v2's r1 repair): 厚生労働省's storage
//    thresholds are all "◯C or below" -- upper bounds, not exclusive bands. v2 modeled cold5/
//    cold10 as mutually exclusive categories and scored raw_meat/milk placed in cold5 as WRONG,
//    even though 5C satisfies their real "10C or below" requirement (colder is always safe). That
//    contradicted the very source table fact_sheet_v3.json cites. v3 fixes this at the root: each
//    food now has a `validZones` list (the zones that satisfy its real threshold), raw_meat/milk
//    accept EITHER cold5 or cold10, raw_fish accepts ONLY cold5 (its 5C limit is strictly tighter
//    than meat/milk's 10C limit, so cold10 does not satisfy it). The exploit-relevance check is
//    redefined to what the reviewer prescribed: a strategy that treats "any cold-appropriate item"
//    as cold10 (i.e. never bothers to notice fish's stricter limit) now genuinely fails whenever a
//    session draws raw_fish, because cold10 is NOT in raw_fish's validZones.
// 2. C_NOT_NEEDED_FOR_D (HIGH, closed in v2, unchanged in v3): the reviewer's prescribed fix --
//    an explicit, hand-verified, BALANCED scenario pool of exactly 3 archetypes (both heuristics
//    agree, only nearer-first correct, only tighter-deadline-first correct), each drawn with equal
//    1/3 probability and independently mirrored -- stays as-is; route_zero_winner_rate is now
//    computed and asserted (not hand-typed) per the r2 LOW finding.
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------- part 1: zones
// Real-grounded per 厚生労働省「大量調理施設衛生管理マニュアル」別添1 (see
// factory/projects/legacy-load-and-route/research.md and fact_sheet_v4.json). ONLY 4 of the 6
// source categories are upper bounds ("◯C以下"): 生鮮魚介類/食肉・鯨肉/乳・濃縮乳等/冷凍食品全般 --
// for these, a food is correctly stored in ANY zone at or below its own limit, so `validZones`
// lists every such zone (design review r2 BLOCKER fix: v2 wrongly treated cold5/cold10 as mutually
// exclusive categories, scoring meat/milk in cold5 -- which is strictly SAFER, not wrong -- as a
// failure). This does NOT generalize to the other 2 categories (design review r3 HIGH fix,
// CORE_DISTORTED_BY_PROSE: an earlier draft of this comment/fact_sheet wrongly implied "every
// threshold is an upper bound, colder is always safe" as a blanket rule) -- 生鮮果実・野菜's
// "10℃前後" is a RANGE (too cold causes low-temperature sweetening / quality loss per 農林水産省,
// see research.md), and 穀類加工品's "室温" is a distinct ambient category, not a point on the same
// cold-to-frozen scale. Both potato/bread/flour therefore have exactly ONE validZone (ambient),
// never frozen or cold.
export const FOODS = [
  { id: "raw_fish", validZones: ["cold5"] },              // 生鮮魚介類: 5℃以下 -- only cold5 satisfies this
  { id: "raw_meat", validZones: ["cold5", "cold10"] },    // 食肉・鯨肉: 10℃以下 -- cold5 (colder) also satisfies this
  { id: "milk", validZones: ["cold5", "cold10"] },        // 乳・濃縮乳等: 10℃以下 -- same as above
  { id: "frozen_croquette", validZones: ["frozen"] },     // 冷凍食品全般: -15℃以下
  { id: "frozen_vegetable", validZones: ["frozen"] },     // 冷凍食品全般: -15℃以下
  { id: "potato", validZones: ["ambient"] },              // 生鮮果実・野菜: 10℃前後（冷やしすぎ注意）
  { id: "bread", validZones: ["ambient"] },               // 穀類加工品: 室温
  { id: "flour", validZones: ["ambient"] },               // 穀類加工品（小麦粉等）: 室温
];
export const ZONES = ["frozen", "cold5", "cold10", "ambient"];
export const DRAW_SIZE = 4;

function drawFoods(rand) { return shuffle(FOODS, rand).slice(0, DRAW_SIZE); }
function zoneWin(drawn, placement) { return drawn.every((f) => f.validZones.includes(placement[f.id])); }

// ---------------------------------------------------------------- part 2: route
// Balanced stratified scenario pool (design review r1 fix -- replaces Cartesian rejection
// sampling). Each archetype is hand-verified below (see route-tuning-notes.md) to have EXACTLY
// one valid visiting order, with the two single-axis heuristics disagreeing on 2 of 3 archetypes.
// slotA/slotB carry (travel, deadline) for two abstract slots; `correctIsSlotA` records the
// ground truth. Mirroring (which slot maps to which displayed school) happens in newRouteSession.
const ARCHETYPES = [
  { id: "both-agree", slotA: { travel: 10, deadline: 30 }, slotB: { travel: 40, deadline: 90 }, between: 30, correctIsSlotA: true },
  { id: "nearer-only-correct", slotA: { travel: 15, deadline: 50 }, slotB: { travel: 35, deadline: 45 }, between: 20, correctIsSlotA: true },
  { id: "tighter-only-correct", slotA: { travel: 15, deadline: 50 }, slotB: { travel: 25, deadline: 30 }, between: 20, correctIsSlotA: false },
];

function validOrder(s, order) {
  if (order === "AB") return s.travelA <= s.dlA && (s.travelA + s.between) <= s.dlB;
  return s.travelB <= s.dlB && (s.travelB + s.between) <= s.dlA;
}
function routeWinners(s) {
  const w = [];
  if (validOrder(s, "AB")) w.push("AB");
  if (validOrder(s, "BA")) w.push("BA");
  return w;
}
function newRouteSession(rand) {
  const arc = pick(ARCHETYPES, rand);
  const mirror = rand() < 0.5; // which slot is displayed as "A" vs "B" -- independent of correctness
  const dispA = mirror ? arc.slotB : arc.slotA;
  const dispB = mirror ? arc.slotA : arc.slotB;
  const correctOrder = (arc.correctIsSlotA !== mirror) ? "AB" : "BA"; // XOR: correct slot, relabeled
  return {
    archetype: arc.id,
    travelA: dispA.travel, dlA: dispA.deadline,
    travelB: dispB.travel, dlB: dispB.deadline,
    between: arc.between,
    correctOrder,
  };
}

const N = 20000;

// ---- part 1 checks ----
function rate1(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const drawn = drawFoods(rand); if (fn(drawn, rand)) w++; } return Number((w / N).toFixed(4)); }
const zoneResults = {};
zoneResults.legitimate_all_correct = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, f.validZones[0]])); return zoneWin(drawn, placement); });
for (const z of ZONES) zoneResults[`always_place_all_in_${z}`] = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, z])); return zoneWin(drawn, placement); });
zoneResults.random_zone_per_item = rate1((drawn, rand) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, pick(ZONES, rand)])); return zoneWin(drawn, placement); });
// design review r2 BLOCKER fix: the exploit-relevance check must actually violate a food's real
// threshold, not an invented exclusivity rule. A strategy that ignores raw_fish's stricter 5C limit
// and treats every cold-appropriate item (fish/meat/milk) as cold10 fails exactly when a session
// draws raw_fish (cold10 is not in raw_fish.validZones) -- this is the genuine, sourced consequence
// of the fish-vs-meat threshold difference, unlike v2's invented "meat in cold5 is wrong" check.
zoneResults.treats_all_cold_items_as_cold10 = rate1((drawn) => {
  const placement = Object.fromEntries(drawn.map((f) => [f.id, (f.id === "raw_fish" || f.id === "raw_meat" || f.id === "milk") ? "cold10" : f.validZones[0]]));
  return zoneWin(drawn, placement);
});
// sanity check: the inverse (always play it safe -- everything cold-appropriate to cold5) must
// still be a LEGITIMATE strategy (cold5 satisfies both fish's 5C and meat/milk's 10C limits), i.e.
// it should win exactly as often as full correct reasoning, not be penalized as an "exploit".
zoneResults.treats_all_cold_items_as_cold5 = rate1((drawn) => {
  const placement = Object.fromEntries(drawn.map((f) => [f.id, (f.id === "raw_fish" || f.id === "raw_meat" || f.id === "milk") ? "cold5" : f.validZones[0]]));
  return zoneWin(drawn, placement);
});

// ---- part 2 checks ----
function rate2(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newRouteSession(rand); if (fn(s)) w++; } return Number((w / N).toFixed(4)); }
const routeResults = {};
routeResults.legitimate_full_reasoning = rate2((s) => routeWinners(s).includes(s.correctOrder));
routeResults.tighter_deadline_first = rate2((s) => (s.dlA <= s.dlB ? "AB" : "BA") === s.correctOrder);
routeResults.nearer_first = rate2((s) => (s.travelA <= s.travelB ? "AB" : "BA") === s.correctOrder);
routeResults.random_order = rate2((s, i) => { const rand = mulberry32(i * 104729 + 7); return (rand() < 0.5 ? "AB" : "BA") === s.correctOrder; });

// archetype distribution sanity check (should be ~1/3 each)
const archCounts = {};
for (let i = 0; i < N; i++) { const s = newRouteSession(mulberry32(i * 7919 + 13)); archCounts[s.archetype] = (archCounts[s.archetype] ?? 0) + 1; }

// design review r2 LOW fix: route_zero_winner_rate must be COMPUTED from the hand-verified
// archetypes, not hand-typed as a literal 0. Enumerate all 3 archetypes x 2 mirror states (the only
// 6 possible sessions, since travel/deadline values are fixed per archetype) and assert each has
// exactly one winner -- if a future edit to ARCHETYPES breaks this, the script throws instead of
// silently keeping a stale "0".
let zeroWinnerCount = 0;
let multiWinnerCount = 0;
for (const arc of ARCHETYPES) {
  for (const mirror of [false, true]) {
    const dispA = mirror ? arc.slotB : arc.slotA;
    const dispB = mirror ? arc.slotA : arc.slotB;
    const s = { travelA: dispA.travel, dlA: dispA.deadline, travelB: dispB.travel, dlB: dispB.deadline, between: arc.between };
    const winners = routeWinners(s);
    if (winners.length === 0) zeroWinnerCount++;
    if (winners.length > 1) multiWinnerCount++;
  }
}
// design review r3 LOW fix: the r2 fix only threw on ambiguous (multi-winner) ground truth; it
// silently allowed a broken archetype with ZERO valid orders (an unsolvable session) to slip
// through. Assert exactly one winner in every one of the 6 combos, not just "not more than one".
if (multiWinnerCount > 0) throw new Error(`route archetype has more than one valid order in ${multiWinnerCount} of 6 archetype/mirror combos -- ambiguous ground truth`);
if (zeroWinnerCount > 0) throw new Error(`route archetype has zero valid orders in ${zeroWinnerCount} of 6 archetype/mirror combos -- unsolvable session`);
const routeZeroWinnerRate = Number((zeroWinnerCount / 6).toFixed(4));

const verdict = {
  zone_legitimate_always_wins: zoneResults.legitimate_all_correct === 1,
  zone_fixed_zone_guess_fails: ZONES.every((z) => zoneResults[`always_place_all_in_${z}`] < 0.05),
  zone_random_guess_stays_low: zoneResults.random_zone_per_item < 0.05,
  zone_fish_threshold_is_load_bearing: zoneResults.treats_all_cold_items_as_cold10 < 0.7,
  zone_conservative_cold5_strategy_is_legitimate: zoneResults.treats_all_cold_items_as_cold5 === 1,
  route_zero_winner_rate: routeZeroWinnerRate, // computed from the hand-verified archetypes, asserted above
  route_legitimate_always_wins: routeResults.legitimate_full_reasoning === 1,
  route_tighter_deadline_heuristic_rate: routeResults.tighter_deadline_first,
  route_nearer_heuristic_rate: routeResults.nearer_first,
  route_heuristics_guaranteed_below_full_reasoning: routeResults.tighter_deadline_first <= 0.7 && routeResults.nearer_first <= 0.7,
  route_margin_over_tighter_heuristic: Number((routeResults.legitimate_full_reasoning - routeResults.tighter_deadline_first).toFixed(4)),
  route_margin_over_nearer_heuristic: Number((routeResults.legitimate_full_reasoning - routeResults.nearer_first).toFixed(4)),
  route_archetype_distribution_balanced: Object.values(archCounts).every((c) => Math.abs(c / N - 1 / 3) < 0.02),
};

const out = {
  n: N,
  zone: { foods: FOODS, zones: ZONES, drawSize: DRAW_SIZE, results: zoneResults },
  route: { archetypes: ARCHETYPES, archetypeDistribution: archCounts, results: routeResults },
  verdict,
  notes: "v4 (design review r3 FAIL 68 repair, BLOCKER ANSWER_LEAK + HIGH CORE_DISTORTED_BY_PROSE): the zone-model logic and FOODS data are UNCHANGED from v3 (round-2's blocker fix was confirmed closed by the r3 reviewer) -- this round's fixes were (1) removing food-shaped zone icons (🐟/🥛) from the UI-facing design docs (first_5_seconds/game_translations), which had let a child match icon-to-food without reading the storage-limit text at all, and (2) correcting fact_sheet/comment prose that had over-generalized 'every threshold is an upper bound, colder is always safe' to ALL 6 real categories -- it only holds for fish/meat/milk/frozen; 生鮮果実・野菜's 10℃前後 is a range (quality, not safety) and 穀類加工品's 室温 is a separate ambient category, both correctly kept at exactly one validZone (ambient) in the FOODS data, which never claimed otherwise. Also asserts route_zero_winner_rate has zero UNsolvable archetypes, not just zero ambiguous ones (r3 LOW fix). v3 (design review r2 FAIL 62 repair, BLOCKER CORE_DISTORTED_BY_GAME): the 厚生労働省 storage thresholds for fish/meat/milk/frozen are upper bounds ('◯C以下'), so v2's model -- treating cold5/cold10 as mutually exclusive categories and scoring meat/milk placed in cold5 (colder, still within their 10C limit) as WRONG -- contradicted the source table it claimed to implement. v3 gives each food a `validZones` list (every zone that satisfies its real limit): raw_fish -> [cold5] only (5C is strictly tighter than meat/milk's 10C), raw_meat/milk -> [cold5, cold10] (either satisfies 10C or below). The exploit-relevance check is redefined to what actually violates a real threshold: 'treats_all_cold_items_as_cold10' (ignoring fish's stricter limit) now fails whenever a session draws raw_fish; the mirror-image 'treats_all_cold_items_as_cold5' (always picking the colder, safer option) is verified to be a LEGITIMATE strategy (100% win rate), not a penalized guess. route_zero_winner_rate is computed by enumerating all 3 archetypes x 2 mirror states and asserting exactly one winner each (design review r2 LOW fix -- was previously a hand-typed literal 0).",
};
try {
  writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  console.error(`(non-fatal: could not write design-sim-result.json in this environment -- ${e.message}. Printing result to stdout only.)`);
}
console.log(JSON.stringify(out, null, 2));
