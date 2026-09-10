#!/usr/bin/env node
// Design-stage exploit simulation for legacy-load-and-route / t1-zone-and-route (v2).
//
// Audit finding (factory/state/legacy/reverse-audits/load_and_route.json): exploit=memorize,
// player_judgment_required=false, brute_force=true -- the OLD implementation had 4 fixed cargo
// items with fixed correct storage zones and 2 fixed schools with a hardcoded route order, zero
// randomization, plus per-item failure messages enabling brute-force retry.
//
// v2 fixes over v1 (superseded, not committed -- see design-review-r1.result.json, FAIL 64,
// 2 HIGH):
// 1. CORE_DISTORTED_BY_GAME (HIGH): v1 collapsed the researched fish-vs-meat distinction
//    (厚生労働省 large-scale-kitchen manual: raw fish 5C, raw meat 10C -- genuinely different
//    thresholds) into a single "cold" zone, so the researched nuance never actually affected
//    scoring. v2 splits this into two real zones, cold5 (raw fish) and cold10 (raw meat/dairy),
//    and drops the unsourced "retort" item (reviewer: no fact_sheet grounding for it) in favor of
//    a second real room-temperature category (dry grain products, per the same source table).
// 2. C_NOT_NEEDED_FOR_D (HIGH): v1's naive Cartesian rejection-sampling over 2-value choice sets
//    retained only 7 of 32 raw tuples as solvable, and BOTH the "nearer first" and "tighter
//    deadline first" heuristics happened to be correct on 6 of those 7 (~85.7%) -- an accident of
//    which few tuples survived rejection, not a designed property. v2 replaces this with the
//    reviewer's prescribed fix: an explicit, hand-verified, BALANCED scenario pool of exactly 3
//    archetypes (both heuristics agree, only nearer-first correct, only tighter-deadline-first
//    correct), each drawn with equal 1/3 probability and independently mirrored (which named slot
//    is "first" is randomized separately from which is objectively correct) so that over many
//    sessions each single-axis heuristic is provably correct in exactly 2 of 3 archetypes = 66.7%,
//    a guaranteed 33.3pp margin below full reasoning's 100% -- not a hoped-for empirical average.
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
// factory/projects/legacy-load-and-route/research.md and fact_sheet_v2.json). Two DISTINCT
// refrigerated zones (5C for fish, 10C for meat/dairy) so the researched distinction is actually
// gameplay-relevant, not decorative (design review r1 CORE_DISTORTED_BY_GAME fix).
export const FOODS = [
  { id: "raw_fish", zone: "cold5" },       // 生鮮魚介類: 5℃以下
  { id: "raw_meat", zone: "cold10" },      // 食肉・鯨肉: 10℃以下
  { id: "milk", zone: "cold10" },          // 乳・濃縮乳等: 10℃以下
  { id: "frozen_croquette", zone: "frozen" },  // 冷凍食品全般: -15℃以下
  { id: "frozen_vegetable", zone: "frozen" },  // 冷凍食品全般: -15℃以下
  { id: "potato", zone: "ambient" },       // 生鮮果実・野菜: 10℃前後（冷やしすぎ注意）
  { id: "bread", zone: "ambient" },        // 穀類加工品: 室温
  { id: "flour", zone: "ambient" },        // 穀類加工品（小麦粉等）: 室温
];
export const ZONES = ["frozen", "cold5", "cold10", "ambient"];
export const DRAW_SIZE = 4;

function drawFoods(rand) { return shuffle(FOODS, rand).slice(0, DRAW_SIZE); }
function zoneWin(drawn, placement) { return drawn.every((f) => placement[f.id] === f.zone); }

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
zoneResults.legitimate_all_correct = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, f.zone])); return zoneWin(drawn, placement); });
for (const z of ZONES) zoneResults[`always_place_all_in_${z}`] = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, z])); return zoneWin(drawn, placement); });
zoneResults.random_zone_per_item = rate1((drawn, rand) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, pick(ZONES, rand)])); return zoneWin(drawn, placement); });
// specifically test the fish-vs-meat distinction the reviewer flagged as decorative in v1: a
// strategy that treats "cold5" and "cold10" as interchangeable (always assigns whichever of the
// two a fixed rule picks) must now fail whenever a session draws BOTH a cold5 and a cold10 item.
zoneResults.conflates_cold5_and_cold10 = rate1((drawn) => {
  const placement = Object.fromEntries(drawn.map((f) => [f.id, (f.zone === "cold5" || f.zone === "cold10") ? "cold5" : f.zone]));
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

const verdict = {
  zone_legitimate_always_wins: zoneResults.legitimate_all_correct === 1,
  zone_fixed_zone_guess_fails: ZONES.every((z) => zoneResults[`always_place_all_in_${z}`] < 0.05),
  zone_random_guess_stays_low: zoneResults.random_zone_per_item < 0.05,
  zone_fish_meat_distinction_is_load_bearing: zoneResults.conflates_cold5_and_cold10 < 0.5,
  route_zero_winner_rate: 0, // every archetype has exactly one valid order by hand-verified construction
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
  notes: "v2 (design review r1 FAIL 64 repair): (1) split the single 'cold' zone into cold5 (raw fish, 5C per 厚生労働省) and cold10 (raw meat/dairy, 10C) so the researched fish-vs-meat distinction is load-bearing -- zone_fish_meat_distinction_is_load_bearing verifies a strategy that conflates the two zones fails on most sessions. Dropped the unsourced 'retort' item, added 'flour' (grain products, room temperature, same source table) as its real-grounded replacement. (2) replaced Cartesian rejection sampling with a hand-verified, balanced 3-archetype scenario pool (both-agree / nearer-only-correct / tighter-only-correct), each drawn with equal probability and independently mirrored (which slot displays as 'A' vs 'B' is randomized separately from correctness) -- this GUARANTEES (not just empirically observes) that each single-axis heuristic is correct in exactly 2 of 3 archetypes, i.e. a provable 66.7% ceiling and 33.3pp margin below full reasoning's 100%, exactly matching the independent reviewer's prescribed fix (see route-tuning-notes.md for the reviewer's exact recommendation and the hand-derivation of each archetype).",
};
try {
  writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  console.error(`(non-fatal: could not write design-sim-result.json in this environment -- ${e.message}. Printing result to stdout only.)`);
}
console.log(JSON.stringify(out, null, 2));
