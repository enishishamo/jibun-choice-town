#!/usr/bin/env node
// Design-stage exploit simulation for leak-detective / t1-night-listening.
// Reads state_table.json and evaluates strategies mechanically over every
// generated case. Evidence for NO_MANUAL_EXPLOIT_CHECK: content-blind
// strategies must not reliably win, the legitimate C->D strategy must win
// every case within the budgets, and every case must be solvable.
// At implementation time the same rules move into src/q1/leakLogic.ts and
// factory/harness/gameplay-qa-leak.mjs.
//
// Usage: node factory/projects/leak-detective/design/design-sim.mjs
// Output: design-sim-result.json next to this file (+ summary on stdout).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(readFileSync(join(HERE, "state_table.json"), "utf8"));
const STREETS = T.block.streets.map((s) => s.id);
const TRAFFIC = new Set(T.block.streets.filter((s) => s.traffic).map((s) => s.id));
const P = T.block.points_per_street;
const B = T.budgets;
const F = T.flow_meter;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---- world ----
function newCase(rand) {
  const leak = { street: STREETS[Math.floor(rand() * STREETS.length)], point: 1 + Math.floor(rand() * P) };
  let house;
  do { house = { street: STREETS[Math.floor(rand() * STREETS.length)], point: 1 + Math.floor(rand() * P) }; }
  while (house.street === leak.street && house.point === leak.point);
  return { leak, house };
}
function flowReading(c, closed) {
  const leakOpen = !closed.has(c.leak.street);
  const v = F.base_night_usage + (leakOpen ? F.leak_flow : 0) - F.per_street_house_share * closed.size;
  return Number(v.toFixed(F.display_decimals));
}
function soundReading(c, street, point) {
  let level, tone, continuity = "steady";
  if (street === c.leak.street) {
    const dist = Math.abs(point - c.leak.point);
    level = Math.max(1, 5 - dist);
    tone = dist <= 1 ? "high" : "low";
  } else { level = 1; tone = "low"; }
  if (street === c.house.street && point === c.house.point) { level = 4; tone = "high"; continuity = "intermittent"; }
  if (TRAFFIC.has(street)) { continuity = "intermittent"; level = Math.max(level, 3); }
  return { level, tone, continuity };
}

// ---- one night: plan(view) -> action; budgets enforced mechanically ----
// actions: {type:"valve", street} | {type:"listen", street, point} | {type:"dig", street, point} | {type:"end"}
function simulate(c, plan) {
  const closed = new Set();
  const readings = []; // {street, point, level, tone, continuity}
  const flowLog = [];  // {closed:[...], reading}
  let valveOps = 0, listens = 0, digs = 0;
  const view = () => ({ closed: new Set(closed), readings: [...readings], flowLog: [...flowLog], flow: flowReading(c, closed), budgets: { valve: B.valve_ops - valveOps, listens: B.listens - listens, digs: B.digs - digs } });
  for (let guard = 0; guard < 60; guard++) {
    const a = plan(view());
    if (!a || a.type === "end") break;
    if (a.type === "valve") {
      if (valveOps >= B.valve_ops) continue;
      valveOps++;
      // close this street only (reopen the previous one): one op = close+reopen
      closed.clear(); closed.add(a.street);
      flowLog.push({ closed: [...closed], reading: flowReading(c, closed) });
      continue;
    }
    if (a.type === "listen") {
      if (listens >= B.listens) continue;
      listens++;
      readings.push({ street: a.street, point: a.point, ...soundReading(c, a.street, a.point) });
      continue;
    }
    if (a.type === "dig") {
      if (digs >= B.digs) break;
      digs++;
      if (a.street === c.leak.street && a.point === c.leak.point) return { grade: digs === 1 ? "perfect" : "success", digs, listens, valveOps };
      if (digs >= B.digs) break;
    }
  }
  return { grade: "partial", digs, listens, valveOps };
}

// ---- strategies ----
const allPoints = STREETS.flatMap((s) => Array.from({ length: P }, (_, i) => ({ street: s, point: i + 1 })));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const S = {
  // content-blind: dig at random, twice
  random_dig: (rand) => (v) => (v.budgets.digs > 0 ? { type: "dig", ...pick(rand, allPoints) } : { type: "end" }),
  // ignores flow AND continuity: listen at 6 random points, dig at the loudest, then the next loudest
  listen_random_dig_loudest_any: (rand) => (v) => {
    if (v.budgets.listens > 0) return { type: "listen", ...pick(rand, allPoints) };
    const sorted = [...v.readings].sort((a, b) => b.level - a.level);
    const i = B.digs - v.budgets.digs;
    return sorted[i] && v.budgets.digs > 0 ? { type: "dig", street: sorted[i].street, point: sorted[i].point } : { type: "end" };
  },
  // ignores flow, uses continuity: 6 random listens, dig at loudest STEADY
  listen_random_dig_loudest_steady: (rand) => (v) => {
    if (v.budgets.listens > 0) return { type: "listen", ...pick(rand, allPoints) };
    const sorted = v.readings.filter((r) => r.continuity === "steady").sort((a, b) => b.level - a.level);
    const i = B.digs - v.budgets.digs;
    return sorted[i] && v.budgets.digs > 0 ? { type: "dig", street: sorted[i].street, point: sorted[i].point } : { type: "end" };
  },
  // uses flow only, then digs at random points of that street (no listening)
  flow_then_random_dig: (rand) => (v) => {
    const street = leakStreetFromFlow(v);
    if (!street) return nextValve(v);
    return v.budgets.digs > 0 ? { type: "dig", street, point: 1 + Math.floor(rand() * P) } : { type: "end" };
  },
  // legitimate D: flow isolation -> gradient listening on that street, steady readings only -> dig at the max
  flow_then_gradient: () => (v) => {
    const street = leakStreetFromFlow(v);
    if (!street) return nextValve(v);
    const mine = v.readings.filter((r) => r.street === street);
    const steady = mine.filter((r) => r.continuity === "steady");
    const usable = TRAFFIC.has(street) ? mine : steady; // on the traffic street everything is intermittent: rely on level+tone
    const best = usable.reduce((a, r) => (!a || r.level > a.level ? r : a), null);
    if (best && best.level === 5 && v.budgets.digs > 0) return { type: "dig", street, point: best.point };
    if (v.budgets.listens > 0) {
      const heard = new Set(mine.map((r) => r.point));
      if (!heard.has(2)) return { type: "listen", street, point: 2 };
      if (!heard.has(5)) return { type: "listen", street, point: 5 };
      // move toward the louder side of the best reading
      const cand = [best.point - 1, best.point + 1].filter((p) => p >= 1 && p <= P && !heard.has(p));
      const r2 = mine.find((r) => r.point === 2), r5 = mine.find((r) => r.point === 5);
      const dir = r2 && r5 ? (r2.level > r5.level ? -1 : 1) : 1;
      const ordered = cand.sort((a, b) => (dir < 0 ? a - b : b - a));
      if (ordered.length) return { type: "listen", street, point: ordered[0] };
      const any = Array.from({ length: P }, (_, i) => i + 1).filter((p) => !heard.has(p));
      if (any.length) return { type: "listen", street, point: any[0] };
    }
    return best && v.budgets.digs > 0 ? { type: "dig", street, point: best.point } : { type: "end" };
  },
};
function leakStreetFromFlow(v) {
  // a valve op that dropped the meter to ~base identifies the street; after 3 non-drops the 4th is implied
  for (const f of v.flowLog) if (f.reading < 1) return f.closed[0];
  const tried = new Set(v.flowLog.map((f) => f.closed[0]));
  if (tried.size >= STREETS.length - 1) return STREETS.find((s) => !tried.has(s));
  return null;
}
function nextValve(v) {
  const tried = new Set(v.flowLog.map((f) => f.closed[0]));
  const s = STREETS.find((x) => !tried.has(x));
  return s && v.budgets.valve > 0 ? { type: "valve", street: s } : { type: "end" };
}

// ---- run over all 24 leak positions x several distractor placements ----
const N = 600;
const results = {};
for (const [name, mk] of Object.entries(S)) {
  const rand = rng(7);
  const tally = { perfect: 0, success: 0, partial: 0 };
  for (let i = 0; i < N; i++) {
    const c = newCase(rng(1000 + i));
    const r = simulate(c, mk(rand));
    tally[r.grade]++;
  }
  results[name] = { ...tally, win_rate: Number(((tally.perfect + tally.success) / N).toFixed(3)) };
}
// solvability: the legitimate strategy on every one of the 24 leak positions with every distractor position
let solvable = 0, total = 0, worstListens = 0, worstValves = 0;
for (const ls of STREETS) for (let lp = 1; lp <= P; lp++) for (const hs of STREETS) for (let hp = 1; hp <= P; hp++) {
  if (hs === ls && hp === lp) continue;
  total++;
  const r = simulate({ leak: { street: ls, point: lp }, house: { street: hs, point: hp } }, S.flow_then_gradient());
  if (r.grade !== "partial") solvable++;
  worstListens = Math.max(worstListens, r.listens); worstValves = Math.max(worstValves, r.valveOps);
}
const verdict = {
  legitimate_strategy_wins_every_case: solvable === total,
  no_content_blind_strategy_wins_reliably: results.random_dig.win_rate < 0.15 && results.listen_random_dig_loudest_any.win_rate < 0.35 && results.listen_random_dig_loudest_steady.win_rate < 0.4,
  flow_without_listening_is_not_enough: results.flow_then_random_dig.win_rate < 0.5,
  every_case_solvable_within_budgets: solvable === total && worstListens <= B.listens && worstValves <= B.valve_ops,
};
const out = { generated_at: new Date().toISOString(), rules: { streets: STREETS, points_per_street: P, budgets: B }, cases_per_strategy: N, strategies: results, solvability: { solvable, total, worst_listens_used: worstListens, worst_valve_ops_used: worstValves }, verdict };
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
