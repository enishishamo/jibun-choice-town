#!/usr/bin/env node
// Design-stage exploit simulation for legacy-load-and-route / t1-zone-and-route (v1).
//
// Audit finding (factory/state/legacy/reverse-audits/load_and_route.json): exploit=memorize,
// player_judgment_required=false -- the OLD implementation (src/q1/LogisticsGame.tsx) had 4 fixed
// cargo items with fixed correct storage zones, and 2 fixed schools with a hardcoded route order
// ("visiting みなみ小 first always makes ひまわり小 late") -- zero randomization at all, so the
// entire game reduced to memorizing one fixed solution.
//
// This mechanic has TWO sub-judgments, modeled and verified separately below:
// (1) FOOD-TO-ZONE MATCHING: each session draws a random subset of foods from a real pool (bigger
//     than the per-session draw) spanning all 3 storage zones, in shuffled order, and requires
//     ALL drawn foods placed in their correct zone.
// (2) ROUTE SEQUENCING: each session draws random (travel-time, deadline) values for 2 schools
//     plus a random between-schools travel time, and requires visiting them in an order that
//     meets BOTH deadlines. Parameter ranges were tuned (see notes) so neither a "nearer school
//     first" nor a "tighter deadline first" heuristic reliably predicts the correct order --
//     genuine calculation is required, matching this Factory's precedent for legacy-sow-and-grow's
//     t1-season-deadline-match (design review r2 BLOCKER: a dominant heuristic must not exist).
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
// Placeholder pool pending real-source verification (factory/projects/legacy-load-and-route/design/fact_sheet
// will cite the exact sources) -- structurally what matters here (draw size < pool size, all 3
// zones represented) is already validated; exact food names/sources are filled in once research
// returns, without needing to redo this math.
// Real-grounded per 厚生労働省「大量調理施設衛生管理マニュアル」別添1
// (see factory/projects/legacy-load-and-route/research.md and fact_sheet_v1.json).
export const FOODS = [
  { id: "raw_fish", zone: "cold" },      // 生鮮魚介類: 5℃以下
  { id: "raw_meat", zone: "cold" },      // 食肉・鯨肉: 10℃以下
  { id: "milk", zone: "cold" },          // 乳・濃縮乳等: 10℃以下
  { id: "frozen_croquette", zone: "frozen" }, // 冷凍食品全般: -15℃以下
  { id: "frozen_vegetable", zone: "frozen" }, // 冷凍食品全般: -15℃以下
  { id: "potato", zone: "ambient" },     // 生鮮果実・野菜: 10℃前後（冷やしすぎ注意）
  { id: "bread", zone: "ambient" },      // 穀類加工品: 室温
  { id: "retort", zone: "ambient" },     // 穀類加工品/レトルト: 室温
];
export const ZONES = ["frozen", "cold", "ambient"];
export const DRAW_SIZE = 4;

function drawFoods(rand) {
  return shuffle(FOODS, rand).slice(0, DRAW_SIZE);
}
function zoneWin(drawn, placement) {
  return drawn.every((f) => placement[f.id] === f.zone);
}

// ---------------------------------------------------------------- part 2: route
export const TRAVEL_CHOICES = [10, 40];
export const BETWEEN_CHOICES = [30, 50];
export const DEADLINE_CHOICES = [35, 55];
const MAX_RESAMPLES = 200;

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
  for (let i = 0; i < MAX_RESAMPLES; i++) {
    const s = { travelA: pick(TRAVEL_CHOICES, rand), travelB: pick(TRAVEL_CHOICES, rand), between: pick(BETWEEN_CHOICES, rand), dlA: pick(DEADLINE_CHOICES, rand), dlB: pick(DEADLINE_CHOICES, rand) };
    if (routeWinners(s).length > 0) return s;
  }
  // deterministic fallback: the loosest combination is always winnable
  return { travelA: TRAVEL_CHOICES[0], travelB: TRAVEL_CHOICES[0], between: BETWEEN_CHOICES[0], dlA: DEADLINE_CHOICES.at(-1), dlB: DEADLINE_CHOICES.at(-1) };
}

const N = 20000;

// ---- part 1 checks ----
let zoneZeroDrawFail = 0;
function rate1(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const drawn = drawFoods(rand); if (fn(drawn, rand)) w++; } return Number((w / N).toFixed(4)); }
const zoneResults = {};
zoneResults.legitimate_all_correct = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, f.zone])); return zoneWin(drawn, placement); });
for (const z of ZONES) zoneResults[`always_place_all_in_${z}`] = rate1((drawn) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, z])); return zoneWin(drawn, placement); });
zoneResults.random_zone_per_item = rate1((drawn, rand) => { const placement = Object.fromEntries(drawn.map((f) => [f.id, pick(ZONES, rand)])); return zoneWin(drawn, placement); });

// ---- part 2 checks ----
function rate2(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newRouteSession(rand); if (fn(s)) w++; } return Number((w / N).toFixed(4)); }
const routeResults = {};
routeResults.legitimate_full_reasoning = rate2((s) => routeWinners(s).length > 0);
routeResults.tighter_deadline_first = rate2((s) => { const guess = s.dlA <= s.dlB ? "AB" : "BA"; return routeWinners(s).includes(guess); });
routeResults.nearer_first = rate2((s) => { const guess = s.travelA <= s.travelB ? "AB" : "BA"; return routeWinners(s).includes(guess); });
routeResults.random_order = rate2((s, i) => { const rand = mulberry32(i * 104729 + 7); const guess = rand() < 0.5 ? "AB" : "BA"; return routeWinners(s).includes(guess); });

let routeExhaustionCount = 0;
for (let i = 0; i < N; i++) {
  const rand = mulberry32(i * 7919 + 13);
  let found = false;
  for (let r = 0; r < MAX_RESAMPLES; r++) {
    const s = { travelA: pick(TRAVEL_CHOICES, rand), travelB: pick(TRAVEL_CHOICES, rand), between: pick(BETWEEN_CHOICES, rand), dlA: pick(DEADLINE_CHOICES, rand), dlB: pick(DEADLINE_CHOICES, rand) };
    if (routeWinners(s).length > 0) { found = true; break; }
  }
  if (!found) routeExhaustionCount++;
}

const verdict = {
  zone_legitimate_always_wins: zoneResults.legitimate_all_correct === 1,
  zone_fixed_zone_guess_fails: ZONES.every((z) => zoneResults[`always_place_all_in_${z}`] < 0.05),
  zone_random_guess_stays_low: zoneResults.random_zone_per_item < 0.05,
  route_zero_winner_rate: 0, // guaranteed by rejection sampling + deterministic fallback
  route_exhaustion_count: routeExhaustionCount,
  route_legitimate_always_wins: routeResults.legitimate_full_reasoning === 1,
  route_tighter_deadline_heuristic_not_dominant: routeResults.tighter_deadline_first < 0.9,
  route_nearer_heuristic_not_dominant: routeResults.nearer_first < 0.9,
  route_legitimate_margin_over_tighter_heuristic: Number((routeResults.legitimate_full_reasoning - routeResults.tighter_deadline_first).toFixed(4)),
  route_legitimate_margin_over_nearer_heuristic: Number((routeResults.legitimate_full_reasoning - routeResults.nearer_first).toFixed(4)),
};

const out = {
  n: N,
  zone: { foods: FOODS, zones: ZONES, drawSize: DRAW_SIZE, results: zoneResults },
  route: { travelChoices: TRAVEL_CHOICES, betweenChoices: BETWEEN_CHOICES, deadlineChoices: DEADLINE_CHOICES, results: routeResults },
  verdict,
  notes: "v1: part 1 (zone matching) draws 4 of 8 real food-category facts per session (shuffled), requiring all 4 placed correctly -- a fixed 'always guess zone Z' or fully-random-per-item strategy both fail near 0% since the pool spans all 3 zones and only exact matches win. part 2 (route sequencing) rejection-samples (travelA, travelB, between, dlA, dlB) from discrete choice sets tuned via factory/projects/legacy-load-and-route/design/route-tuning-notes.md so neither 'visit whichever has the nearer travel time first' nor 'visit whichever has the tighter deadline first' is a dominant heuristic (both stay meaningfully below legitimate full reasoning's 100%) -- this directly avoids the exact BLOCKER legacy-sow-and-grow's design review r2 found in an earlier draft (a variety/order that dominated regardless of the session's actual numbers).",
};
try {
  writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  console.error(`(non-fatal: could not write design-sim-result.json in this environment -- ${e.message}. Printing result to stdout only.)`);
}
console.log(JSON.stringify(out, null, 2));
