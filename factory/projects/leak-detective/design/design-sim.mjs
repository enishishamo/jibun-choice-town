#!/usr/bin/env node
// Design-stage exploit simulation for leak-detective / t1c-night-listening-isolation (v5).
// v5 (implementation review r2): a CLOSED segment carries no water, so its listening points
// are silent (level 1 steady) even directly above the leak; reopening is an explicit free
// action; the legitimate strategy reopens after isolating; a strategy that forgets to reopen
// hears nothing and must not succeed reliably.
// v3 (design review r2): the second report is unlocked ONLY by a new listen; the
// record view never unlocks (the old "compare" free unlock is removed); the gate
// test now also verifies that opening the records and reporting again is refused.
// v4 (design review r3): no automatic segment highlight exists — a strategy that taps
// valves WITHOUT reading the meter gets no segment information from the UI and must
// guess the segment (valves_ignored_guess_segment_gradient).
// Reads state_table.json and evaluates strategies mechanically over every
// generated case. Evidence for NO_MANUAL_EXPLOIT_CHECK: content-blind
// strategies must not reliably win, the legitimate C->D strategy must win
// every case within the budgets, and every case must be solvable.
// v2 (design review r1): 3 segments x 6 points, readings = level + continuity
// only (tone/"low = far" removed as unverified), no traffic distractor,
// budgets valve 2 / listens 5 / reports 2, second report gated behind a
// think-again step (v3: a NEW LISTEN only), content-light
// strategies never repeat a point (r1 MEDIUM: dedupe), plus an optimized
// no-listening baseline (flow -> 2 distinct reports).
// At implementation time the same rules move into src/q1/leakLogic.ts and
// factory/harness/gameplay-qa-leak.mjs.
//
// Usage: node factory/projects/leak-detective/design/design-sim.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(readFileSync(join(HERE, "state_table.json"), "utf8"));
const SEGS = T.block.segments.map((s) => s.id);
const P = T.block.points_per_segment;
const B = T.budgets;
const F = T.flow_meter;

// scramble + warm-up so consecutive seeds (1000+i) give decorrelated cases — a plain LCG seeded with
// consecutive integers made 600 "random" cases share almost the same leak segment (found in v5).
function rng(seed) { let s = ((seed ^ 0x9e3779b9) * 2654435761) >>> 0; const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); next(); next(); next(); return next; }

// ---- world ----
function newCase(rand) {
  const leak = { seg: SEGS[Math.floor(rand() * SEGS.length)], point: 1 + Math.floor(rand() * P) };
  let house;
  do { house = { seg: SEGS[Math.floor(rand() * SEGS.length)], point: 1 + Math.floor(rand() * P) }; }
  while (house.seg === leak.seg && house.point === leak.point);
  return { leak, house };
}
function flowReading(c, closed) {
  const leakOpen = !closed.has(c.leak.seg);
  const v = F.base_night_usage + (leakOpen ? F.leak_flow : 0) - F.per_segment_house_share * closed.size;
  return Number(v.toFixed(F.display_decimals));
}
function soundReading(c, seg, point, closed) {
  let level, continuity = "steady";
  if (seg === c.leak.seg && closed !== seg) level = Math.max(1, 5 - Math.abs(point - c.leak.point)); else level = 1; // isolated segment: no water, no leak sound
  if (seg === c.house.seg && point === c.house.point) { level = 4; continuity = "intermittent"; }
  return { level, continuity };
}

// ---- one night. actions: valve / listen / compare / report / end. Budgets + think-again gate enforced here ----
function simulate(c, plan) {
  const closed = new Set();
  const readings = [], flowLog = [];
  let valveOps = 0, listens = 0, reports = 0, thinkAgainDone = true; // true until the first miss
  const view = () => ({ closed: closed.size ? [...closed][0] : null, readings: [...readings], flowLog: [...flowLog], flow: flowReading(c, closed), budgets: { valve: B.valve_ops - valveOps, listens: B.listens - listens, reports: B.reports - reports }, secondReportUnlocked: thinkAgainDone });
  for (let guard = 0; guard < 60; guard++) {
    const a = plan(view());
    if (!a || a.type === "end") break;
    if (a.type === "valve") {
      if (valveOps >= B.valve_ops) continue;
      valveOps++; closed.clear(); closed.add(a.seg);
      flowLog.push({ closed: a.seg, reading: flowReading(c, closed) });
    } else if (a.type === "reopen") {
      closed.clear(); // free: reopening is not a scored operation
    } else if (a.type === "listen") {
      if (listens >= B.listens) continue;
      listens++; readings.push({ seg: a.seg, point: a.point, ...soundReading(c, a.seg, a.point, closed.size ? [...closed][0] : null) }); thinkAgainDone = true;
    } else if (a.type === "compare") {
      // opening the record panel never unlocks a report (r2 HIGH)
    } else if (a.type === "report") {
      if (reports >= B.reports || !thinkAgainDone) continue;
      reports++;
      if (a.seg === c.leak.seg && a.point === c.leak.point) return { grade: reports === 1 ? "perfect" : "success", reports, listens, valveOps };
      thinkAgainDone = false; // gate the next report behind a NEW listen (new evidence); the record view never unlocks
      if (reports >= B.reports) break;
    }
  }
  return { grade: "partial", reports, listens, valveOps };
}

// ---- helpers ----
const allPoints = SEGS.flatMap((s) => Array.from({ length: P }, (_, i) => ({ seg: s, point: i + 1 })));
const pickNew = (rand, arr, used) => { const c = arr.filter((p) => !used.has(`${p.seg}:${p.point}`)); return c.length ? c[Math.floor(rand() * c.length)] : null; };
const key = (p) => `${p.seg}:${p.point}`;
function leakSegFromFlow(v) {
  for (const f of v.flowLog) if (f.reading < 1) return f.closed;
  const tried = new Set(v.flowLog.map((f) => f.closed));
  if (tried.size >= SEGS.length - 1) return SEGS.find((s) => !tried.has(s));
  return null;
}
function nextValve(v) {
  const tried = new Set(v.flowLog.map((f) => f.closed));
  const s = SEGS.find((x) => !tried.has(x));
  return s && v.budgets.valve > 0 ? { type: "valve", seg: s } : { type: "end" };
}
// when gated, a strategy must LISTEN somewhere new to continue (no free unlock); if it cannot, it ends
const unlockOr = (v, action, rand, used) => { if (v.secondReportUnlocked) return action; if (v.budgets.listens > 0) { const p = pickNew(rand, allPoints, used); if (p) { used.add(key(p)); return { type: "listen", ...p }; } } return { type: "end" }; };

const S = {
  // content-blind: 2 distinct random reports
  random_report: (rand) => { const used = new Set(); return (v) => { if (v.budgets.reports <= 0) return { type: "end" }; const p = pickNew(rand, allPoints, used); if (!p) return { type: "end" }; used.add(key(p)); return unlockOr(v, { type: "report", ...p }, rand, used); }; },
  // ignores flow AND continuity: 5 distinct random listens, report the loudest, then the next loudest
  listen_random_report_loudest_any: (rand) => { const used = new Set(); return (v) => {
    if (v.budgets.listens > 0) { const p = pickNew(rand, allPoints, used); if (p) { used.add(key(p)); return { type: "listen", ...p }; } }
    const sorted = [...v.readings].sort((a, b) => b.level - a.level); const i = B.reports - v.budgets.reports;
    return sorted[i] && v.budgets.reports > 0 ? unlockOr(v, { type: "report", seg: sorted[i].seg, point: sorted[i].point }, rand, used) : { type: "end" }; }; },
  // ignores flow, uses continuity: 5 distinct random listens, report loudest STEADY then next
  listen_random_report_loudest_steady: (rand) => { const used = new Set(); return (v) => {
    if (v.budgets.listens > 0) { const p = pickNew(rand, allPoints, used); if (p) { used.add(key(p)); return { type: "listen", ...p }; } }
    const sorted = v.readings.filter((r) => r.continuity === "steady").sort((a, b) => b.level - a.level); const i = B.reports - v.budgets.reports;
    return sorted[i] && v.budgets.reports > 0 ? unlockOr(v, { type: "report", seg: sorted[i].seg, point: sorted[i].point }, rand, used) : { type: "end" }; }; },
  // uses flow only, then 2 DISTINCT random reports on that segment (optimized content-light baseline, no listening)
  flow_then_two_distinct_reports: (rand) => { const used = new Set(); return (v) => {
    const seg = leakSegFromFlow(v); if (!seg) return nextValve(v);
    if (v.budgets.reports <= 0) return { type: "end" };
    const p = pickNew(rand, allPoints.filter((x) => x.seg === seg), used); if (!p) return { type: "end" }; used.add(key(p));
    return unlockOr(v, { type: "report", ...p }, rand, used); }; },
  // r3 adversarial: taps valves but never reads the meter; with no automatic highlight it must GUESS a segment, then does honest gradient listening there
  valves_ignored_guess_segment_gradient: (rand) => { const seg = SEGS[Math.floor(rand() * SEGS.length)]; let tapped = 0; return (v) => {
    if (tapped < B.valve_ops) { tapped++; return { type: "valve", seg: SEGS[tapped - 1] }; }
    return gradientOn(seg, v); }; },
  // legitimate D: flow isolation -> gradient listening on that segment, steady readings only -> report the max
  flow_then_gradient: () => (v) => {
    const seg = leakSegFromFlow(v); if (!seg) return nextValve(v);
    if (v.closed) return { type: "reopen" }; // restore supply before listening (a closed segment is silent)
    return gradientOn(seg, v);
  },
  // r2 adversarial/regression: identifies the segment by flow but FORGETS to reopen -> hears silence
  flow_then_gradient_forgets_reopen: () => (v) => {
    const seg = leakSegFromFlow(v); if (!seg) return nextValve(v);
    return gradientOn(seg, v);
  },
};
function gradientOn(seg, v) {
  {
    const mine = v.readings.filter((r) => r.seg === seg);
    const steady = mine.filter((r) => r.continuity === "steady");
    const best = steady.reduce((a, r) => (!a || r.level > a.level ? r : a), null);
    if (best && best.level === 5 && v.budgets.reports > 0) return { type: "report", seg, point: best.point };
    if (v.budgets.listens > 0) {
      const heard = new Set(mine.map((r) => r.point));
      if (!heard.has(2)) return { type: "listen", seg, point: 2 };
      if (!heard.has(5)) return { type: "listen", seg, point: 5 };
      const r2 = steady.find((r) => r.point === 2), r5 = steady.find((r) => r.point === 5);
      // walk toward the louder end; if one end was a distractor (intermittent), trust the other
      let order;
      if (r2 && r5) order = r2.level > r5.level ? [1, 3, 4, 6] : r5.level > r2.level ? [6, 4, 3, 1] : [3, 4, 1, 6];
      else if (r2) order = r2.level >= 4 ? [1, 3, 4, 6] : [4, 6, 3, 1];
      else if (r5) order = r5.level >= 4 ? [6, 4, 3, 1] : [3, 1, 4, 6];
      else order = [3, 4, 1, 6];
      const next = order.find((p) => !heard.has(p));
      if (next) return { type: "listen", seg, point: next };
    }
    if (best && v.budgets.reports > 0 && v.secondReportUnlocked) return { type: "report", seg, point: best.point };
    return { type: "end" };
  }
}

// ---- run ----
const N = 600;
const results = {};
for (const [name, mk] of Object.entries(S)) {
  const tally = { perfect: 0, success: 0, partial: 0 };
  for (let i = 0; i < N; i++) { const rand = rng(31 * i + 7); const r = simulate(newCase(rng(1000 + i)), mk(rand)); tally[r.grade]++; }
  results[name] = { ...tally, win_rate: Number(((tally.perfect + tally.success) / N).toFixed(3)) };
}
// solvability over every leak x distractor combination
let solvable = 0, total = 0, worstListens = 0, worstValves = 0, firstTry = 0;
for (const ls of SEGS) for (let lp = 1; lp <= P; lp++) for (const hs of SEGS) for (let hp = 1; hp <= P; hp++) {
  if (hs === ls && hp === lp) continue; total++;
  const r = simulate({ leak: { seg: ls, point: lp }, house: { seg: hs, point: hp } }, S.flow_then_gradient());
  if (r.grade !== "partial") solvable++; if (r.grade === "perfect") firstTry++;
  worstListens = Math.max(worstListens, r.listens); worstValves = Math.max(worstValves, r.valveOps);
}
// think-again gate: a strategy that tries to report twice with nothing in between must have its 2nd report refused
let gateBlocked = 0, compareBlocked = 0, listenUnlocks = 0;
for (let i = 0; i < 200; i++) {
  const c = newCase(rng(5000 + i)); let attempts = 0;
  const r = simulate(c, () => { attempts++; if (attempts === 1) return { type: "report", seg: c.leak.seg, point: ((c.leak.point) % P) + 1 }; if (attempts === 2) return { type: "report", seg: c.leak.seg, point: c.leak.point }; return { type: "end" }; });
  if (r.grade === "partial" && r.reports === 1) gateBlocked++;
  let a2 = 0;
  const r2 = simulate(c, () => { a2++; if (a2 === 1) return { type: "report", seg: c.leak.seg, point: ((c.leak.point) % P) + 1 }; if (a2 === 2) return { type: "compare" }; if (a2 === 3) return { type: "report", seg: c.leak.seg, point: c.leak.point }; return { type: "end" }; });
  if (r2.grade === "partial" && r2.reports === 1) compareBlocked++;
  let a3 = 0;
  const r3 = simulate(c, () => { a3++; if (a3 === 1) return { type: "report", seg: c.leak.seg, point: ((c.leak.point) % P) + 1 }; if (a3 === 2) return { type: "listen", seg: c.leak.seg, point: c.leak.point }; if (a3 === 3) return { type: "report", seg: c.leak.seg, point: c.leak.point }; return { type: "end" }; });
  if (r3.grade === "success") listenUnlocks++;
}
const verdict = {
  legitimate_strategy_wins_every_case: solvable === total,
  no_content_blind_strategy_wins_reliably: results.random_report.win_rate < 0.15 && results.listen_random_report_loudest_any.win_rate < 0.4 && results.listen_random_report_loudest_steady.win_rate < 0.45,
  flow_without_listening_is_not_reliable: results.flow_then_two_distinct_reports.win_rate < 0.5,
  every_case_solvable_within_budgets: solvable === total && worstListens <= B.listens && worstValves <= B.valve_ops,
  think_again_gate_enforced: gateBlocked === 200 && compareBlocked === 200 && listenUnlocks === 200,
  no_ui_reveal_of_segment: results.valves_ignored_guess_segment_gradient.win_rate < 0.45,
  isolated_segment_is_silent: results.flow_then_gradient_forgets_reopen.win_rate < 0.5,
};
const out = { generated_at: new Date().toISOString(), rules: { segments: SEGS, points_per_segment: P, budgets: B, reading_fields: T.sound_reading.fields }, cases_per_strategy: N, strategies: results, solvability: { solvable, total, first_try: firstTry, worst_listens_used: worstListens, worst_valve_ops_used: worstValves }, think_again_gate: { trials: 200, second_report_refused_without_new_evidence: gateBlocked, second_report_refused_after_compare_only: compareBlocked, second_report_allowed_after_new_listen: listenUnlocks }, verdict };
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
