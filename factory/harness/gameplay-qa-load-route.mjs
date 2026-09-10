#!/usr/bin/env node
// Automated gameplay QA for Q1 load_and_route (legacy-load-and-route redesign,
// t1-zone-and-route). Simulates player strategies against
// src/q1/logisticsLogic.ts directly — same rules as the design-stage
// design-sim.mjs, now against the shipped module: fixed-zone/content-blind
// zone guessing and single-axis route heuristics must stay well below full
// reasoning, every session must be winnable, and LogisticsGame.tsx must never
// leak the answer via food-shaped zone icons or use position-based scoring.
//
// Usage: node factory/harness/gameplay-qa-load-route.mjs
import { readFileSync } from "node:fs";
import {
  ARCHETYPES,
  DRAW_SIZE,
  FOOD_NAMES,
  FOODS,
  ZONE_LABELS,
  ZONES,
  drawFoods,
  newRouteSession,
  newSession,
  shuffledIds,
  validOrder,
  zoneWin,
} from "../../src/q1/logisticsLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function routeWinners(s) {
  const w = [];
  if (validOrder(s, "AB")) w.push("AB");
  if (validOrder(s, "BA")) w.push("BA");
  return w;
}

// ---------------- pure rule-level checks (mirror design-sim.mjs) ----------------
{
  check("8 foods defined, drawing 4 per session", FOODS.length === 8 && DRAW_SIZE === 4);
  check("4 zones defined (frozen/cold5/cold10/ambient)", ZONES.length === 4 && ["frozen", "cold5", "cold10", "ambient"].every((z) => ZONES.includes(z)));
  check("raw_fish accepts only cold5 (stricter 5C limit)", FOODS.find((f) => f.id === "raw_fish").validZones.join(",") === "cold5");
  check("raw_meat/milk accept both cold5 and cold10 (10C-or-below is satisfied by the colder zone too)", ["raw_meat", "milk"].every((id) => {
    const zs = FOODS.find((f) => f.id === id).validZones;
    return zs.includes("cold5") && zs.includes("cold10") && zs.length === 2;
  }));
  check("frozen items accept only frozen; ambient items (potato/bread/flour) accept only ambient (design review r3: does not generalize past the upper-bound categories)", (() => {
    const frozenOk = ["frozen_croquette", "frozen_vegetable"].every((id) => FOODS.find((f) => f.id === id).validZones.join(",") === "frozen");
    const ambientOk = ["potato", "bread", "flour"].every((id) => FOODS.find((f) => f.id === id).validZones.join(",") === "ambient");
    return frozenOk && ambientOk;
  })());
  check("3 route archetypes defined", ARCHETYPES.length === 3);
}

// ---------------- zone-assignment strategies ----------------
const N = 8000;
function rateZone(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const drawn = drawFoods(rand); if (fn(drawn, rand)) w++; } return Number((w / N).toFixed(4)); }

const zoneResults = {};
zoneResults.legitimate_all_correct = rateZone((drawn) => zoneWin(drawn, Object.fromEntries(drawn.map((f) => [f.id, f.validZones[0]]))));
for (const z of ZONES) zoneResults[`always_place_all_in_${z}`] = rateZone((drawn) => zoneWin(drawn, Object.fromEntries(drawn.map((f) => [f.id, z]))));
zoneResults.random_zone_per_item = rateZone((drawn, rand) => zoneWin(drawn, Object.fromEntries(drawn.map((f) => [f.id, ZONES[Math.floor(rand() * ZONES.length)]]))));
zoneResults.treats_all_cold_items_as_cold10 = rateZone((drawn) => zoneWin(drawn, Object.fromEntries(drawn.map((f) => [f.id, ["raw_fish", "raw_meat", "milk"].includes(f.id) ? "cold10" : f.validZones[0]]))));
zoneResults.treats_all_cold_items_as_cold5 = rateZone((drawn) => zoneWin(drawn, Object.fromEntries(drawn.map((f) => [f.id, ["raw_fish", "raw_meat", "milk"].includes(f.id) ? "cold5" : f.validZones[0]]))));

check("legitimate zone reasoning always wins (every draw is solvable)", zoneResults.legitimate_all_correct === 1, `${zoneResults.legitimate_all_correct}`);
check("every fixed-single-zone guess fails almost always", ZONES.every((z) => zoneResults[`always_place_all_in_${z}`] < 0.05), JSON.stringify(zoneResults));
check("content-blind random zone guessing stays well below full reasoning", zoneResults.random_zone_per_item < zoneResults.legitimate_all_correct - 0.3, `${zoneResults.random_zone_per_item}`);
check("ignoring fish's stricter 5C limit (always cold10 for cold-appropriate items) fails meaningfully often", zoneResults.treats_all_cold_items_as_cold10 < 0.7, `${zoneResults.treats_all_cold_items_as_cold10}`);
check("the safe, correct 'always cold5 for cold-appropriate items' strategy is NOT penalized (design review r2 BLOCKER fix)", zoneResults.treats_all_cold_items_as_cold5 === 1, `${zoneResults.treats_all_cold_items_as_cold5}`);

// ---------------- route strategies ----------------
function rateRoute(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newRouteSession(rand); if (fn(s)) w++; } return Number((w / N).toFixed(4)); }
const routeResults = {};
routeResults.legitimate_full_reasoning = rateRoute((s) => routeWinners(s).includes(s.correctOrder));
routeResults.tighter_deadline_first = rateRoute((s) => (s.dlA <= s.dlB ? "AB" : "BA") === s.correctOrder);
routeResults.nearer_first = rateRoute((s) => (s.travelA <= s.travelB ? "AB" : "BA") === s.correctOrder);

check("legitimate route reasoning always wins (every route session is solvable)", routeResults.legitimate_full_reasoning === 1, `${routeResults.legitimate_full_reasoning}`);
check("single-axis route heuristics stay capped well below full reasoning (guaranteed ~66.7% ceiling)", ["tighter_deadline_first", "nearer_first"].every((k) => routeResults[k] <= 0.7), JSON.stringify(routeResults));

// every archetype x mirror combo has exactly one winner (unsolvable/ambiguous check)
{
  let zero = 0, multi = 0;
  for (const arc of ARCHETYPES) {
    for (const mirror of [false, true]) {
      const dispA = mirror ? arc.slotB : arc.slotA;
      const dispB = mirror ? arc.slotA : arc.slotB;
      const s = { travelA: dispA.travel, dlA: dispA.deadline, travelB: dispB.travel, dlB: dispB.deadline, between: arc.between };
      const w = routeWinners(s);
      if (w.length === 0) zero++;
      if (w.length > 1) multi++;
    }
  }
  check("every route archetype x mirror combo has exactly one valid order (no unsolvable or ambiguous session)", zero === 0 && multi === 0, `zero=${zero} multi=${multi}`);
}

// ---------------- session generation ----------------
{
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(JSON.stringify(newSession(mulberry32(i)).foods.map((f) => f.id)));
  check("newSession draws varied food combinations, not a fixed one", seen.size > 5, `${seen.size} distinct draws / 200`);
  let allSolvable = true;
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 13 + 1));
    const zoneOk = zoneWin(s.foods, Object.fromEntries(s.foods.map((f) => [f.id, f.validZones[0]])));
    const routeOk = routeWinners(s.route).includes(s.route.correctOrder);
    if (!zoneOk || !routeOk) { allSolvable = false; break; }
  }
  check("newSession never returns an unwinnable session (500 samples)", allSolvable);
}

// ---------------- shuffle-lifecycle correctness ----------------
{
  const ids = FOODS.map((f) => f.id);
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(shuffledIds(ids, mulberry32(i)).join(","));
  check("food card order varies across sessions (not a fixed order)", seen.size >= 3, `${seen.size} distinct orders / 40`);
  check("shuffledIds never drops or duplicates ids", shuffledIds(ids, mulberry32(7)).slice().sort().join(",") === [...ids].sort().join(","));
}

// ---------------- answer-leak checks on display data ----------------
{
  check("food display names are neutral (no 冷凍/冷蔵/常温 substring, design review r1 ANSWER_LEAK fix)", Object.values(FOOD_NAMES).every((n) => !/冷凍|冷蔵|常温/.test(n)));
  const foodShapeEmoji = ["🐟", "🥩", "🥛", "🍗", "🥔", "🍞"];
  check("zone icons use only neutral temperature symbols, no food-shaped emoji (design review r3 BLOCKER ANSWER_LEAK fix)", Object.values(ZONE_LABELS).every((label) => foodShapeEmoji.every((e) => !label.includes(e))));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/LogisticsGame.tsx", import.meta.url), "utf8");
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  check("session and display orders are generated once per mount via useState initializers, not recomputed every render", src.includes("useState(() => newSession())") && src.includes("useState(() => shuffledIds(session.foods.map"));
  check("component imports FOODS/ZONES data from logisticsLogic instead of redeclaring its own cargo/zone data", src.includes('from "./logisticsLogic"') && !/const\s+(CARGO|FOODS|ZONES)\s*[:=]/.test(body));
  const codeOnly = body.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  check("no fixed old-implementation literals reintroduced (old exploit: hardcoded ひまわり/みなみ school ids or fixed cargo zones)", !codeOnly.includes('"himawari"') && !codeOnly.includes('"minami"') && !codeOnly.includes("secondLate"));
  check("no per-item failure feedback reintroduced (old exploit: failText shown per cargo item)", !codeOnly.includes("failText"));
  check("departing resolves the session immediately (single-shot commit, no in-session retry per design review)", !body.includes("積み直") && !body.includes("センターへ戻って"));
  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly — Gate H HONEST OUTCOME", (() => {
    const partialBlock = body.split('outcome === "partial"')[1]?.split('outcome === "playing"')[0] ?? "";
    return partialBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(partialBlock);
  })());
  check("depart button is disabled until both zone placement and visit order are complete", /disabled=\{!canDepart\}/.test(src) && /canDepart\s*=\s*allPlaced\s*&&\s*orderReady/.test(src));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
