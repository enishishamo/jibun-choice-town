#!/usr/bin/env node
// Design-stage exploit simulation for leak-detective / t1c-night-listening-isolation (v9).
// v9 (design review r8 → Human Decision hd-2): a report needs a HEARD, currently valid, NON-silent,
// not-yet-missed point (implementation parity); only a NON-silent new listen unlocks the second report.
// v8 (design review r7): a silent reading exists only while its segment is closed — reopening
// (explicit or implicit) drops it; the point can be listened to again (no refund).
// v7 (design review r6): the closed segment is a DEDICATED silent state (level 0 / "silent"),
// never "a faint level 1 steady sound"; checked directly for every closed-segment reading.
// v5 (implementation review r2): a CLOSED segment carries no water, so its listening points
// are silent even directly above the leak; reopening is an explicit free action; the
// legitimate strategy reopens after isolating; a strategy that forgets to reopen hears
// nothing and must not succeed reliably.
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
  if (closed === seg) return { level: 0, continuity: "silent" }; // v7: a dedicated silent state — nothing reaches the pickup (design review r6)
  let level, continuity = "steady";
  if (seg === c.leak.seg) level = Math.max(1, 5 - Math.abs(point - c.leak.point)); else level = 1;
  if (seg === c.house.seg && point === c.house.point) { level = 4; continuity = "intermittent"; }
  return { level, continuity };
}

// ---- one night. actions: valve / listen / compare / report / end. Budgets + think-again gate enforced here ----
function simulate(c, plan) {
  const closed = new Set();
  const readings = [], flowLog = [], misses = [];
  let valveOps = 0, listens = 0, reports = 0, thinkAgainDone = true; // true until the first miss
  const view = () => ({ closed: closed.size ? [...closed][0] : null, readings: [...readings], flowLog: [...flowLog], flow: flowReading(c, closed), budgets: { valve: B.valve_ops - valveOps, listens: B.listens - listens, reports: B.reports - reports }, secondReportUnlocked: thinkAgainDone });
  for (let guard = 0; guard < 60; guard++) {
    const a = plan(view());
    if (!a || a.type === "end") break;
    // v8 (design review r7): reopening (explicit, or implicit by closing another valve) puts the water back —
    // the silent readings taken on that segment no longer describe the pipe, so they are dropped and the point
    // can be listened to again (a new listen costs a listen; nothing is refunded).
    const dropSilent = (seg) => { for (let i = readings.length - 1; i >= 0; i--) if (readings[i].seg === seg && readings[i].continuity === "silent") readings.splice(i, 1); };
    if (a.type === "valve") {
      if (valveOps >= B.valve_ops) continue;
      if (closed.size) dropSilent([...closed][0]);
      valveOps++; closed.clear(); closed.add(a.seg);
      flowLog.push({ closed: a.seg, reading: flowReading(c, closed) });
    } else if (a.type === "reopen") {
      if (closed.size) dropSilent([...closed][0]);
      closed.clear(); // free: reopening is not a scored operation
    } else if (a.type === "listen") {
      if (listens >= B.listens) continue;
      const rd = soundReading(c, a.seg, a.point, closed.size ? [...closed][0] : null);
      listens++; readings.push({ seg: a.seg, point: a.point, ...rd });
      // v9 (design review r8, PREPARED): only a NON-silent new listen is new evidence — a silent reading on a closed
      // segment discriminates nothing, so it does not unlock the second report
      if (rd.continuity !== "silent") thinkAgainDone = true;
    } else if (a.type === "compare") {
      // opening the record panel never unlocks a report (r2 HIGH)
    } else if (a.type === "report") {
      if (reports >= B.reports || !thinkAgainDone) continue;
      // v9 (design review r8 MEDIUM + hd-2 item 4): implementation parity — a report needs a HEARD, currently valid,
      // NON-silent point (a silent reading is not evidence) that was not already missed
      if (!readings.some((r) => r.seg === a.seg && r.point === a.point && r.continuity !== "silent") || misses.some((m) => m.seg === a.seg && m.point === a.point)) continue;
      reports++;
      if (a.seg === c.leak.seg && a.point === c.leak.point) return { grade: reports === 1 ? "perfect" : "success", reports, listens, valveOps };
      misses.push({ seg: a.seg, point: a.point });
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
  // v9: implementation parity — a point must be HEARD before it can be reported, so the content-blind baseline
  // listens at a random point (without reading the level) and reports it, twice
  random_report: (rand) => { const used = new Set(); let pending = null; return (v) => { if (v.budgets.reports <= 0) return { type: "end" }; if (pending) { const p = pending; pending = null; return { type: "report", ...p }; } if (v.budgets.listens <= 0) return { type: "end" }; const p = pickNew(rand, allPoints, used); if (!p) return { type: "end" }; used.add(key(p)); pending = p; return { type: "listen", ...p }; }; },
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
  // v9 parity: the "flow-only" baseline still has to place the pickup before reporting (it does not READ the level):
  // reopen, listen at a random point of the isolated segment, report it — twice
  flow_then_two_distinct_reports: (rand) => { const used = new Set(); let pending = null; return (v) => {
    const seg = leakSegFromFlow(v); if (!seg) return nextValve(v);
    if (v.budgets.reports <= 0) return { type: "end" };
    if (pending) { const p = pending; pending = null; return { type: "report", ...p }; }
    if (v.closed) return { type: "reopen" };
    if (v.budgets.listens <= 0) return { type: "end" };
    const p = pickNew(rand, allPoints.filter((x) => x.seg === seg), used); if (!p) return { type: "end" }; used.add(key(p));
    pending = p; return { type: "listen", ...p }; }; },
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
// v9: every reported point is listened to first (implementation parity: not_heard is refused)
let gateBlocked = 0, compareBlocked = 0, listenUnlocks = 0, silentNoUnlock = 0;
for (let i = 0; i < 200; i++) {
  const c = newCase(rng(5000 + i));
  const W = { seg: c.leak.seg, point: ((c.leak.point) % P) + 1 }, L = { seg: c.leak.seg, point: c.leak.point };
  const run = (seq) => { let k = 0; return simulate(c, () => seq[k++] ?? { type: "end" }); };
  // no new evidence between the miss and the second report -> refused
  const r = run([{ type: "listen", ...W }, { type: "listen", ...L }, { type: "report", ...W }, { type: "report", ...L }]);
  if (r.grade === "partial" && r.reports === 1) gateBlocked++;
  // opening the records only -> still refused
  const r2 = run([{ type: "listen", ...W }, { type: "listen", ...L }, { type: "report", ...W }, { type: "compare" }, { type: "report", ...L }]);
  if (r2.grade === "partial" && r2.reports === 1) compareBlocked++;
  // a NEW (non-silent) listen -> allowed
  const r3 = run([{ type: "listen", ...W }, { type: "report", ...W }, { type: "listen", ...L }, { type: "report", ...L }]);
  if (r3.grade === "success") listenUnlocks++;
  // v9 (design review r8): a SILENT listen (closed segment, zero discriminating information) does NOT unlock
  const other = { seg: c.leak.seg, point: ((c.leak.point + 1) % P) + 1 };
  const r4 = run([{ type: "listen", ...W }, { type: "listen", ...L }, { type: "report", ...W }, { type: "valve", seg: c.leak.seg }, { type: "listen", ...other }, { type: "report", ...L }]);
  if (r4.grade === "partial" && r4.reports === 1 && r4.listens === 3) silentNoUnlock++;
}
// v7 (design review r6): the silent state must be a distinct perceptual output, not "level 1 steady" —
// every reading on a closed segment (leak point, house point, ordinary point) is level 0 / "silent".
let closedReadingsAllSilent = true;
for (const ls of SEGS) for (let lp = 1; lp <= P; lp++) for (const hs of SEGS) for (let hp = 1; hp <= P; hp++) {
  if (hs === ls && hp === lp) continue;
  const c = { leak: { seg: ls, point: lp }, house: { seg: hs, point: hp } };
  for (const seg of SEGS) for (let p = 1; p <= P; p++) { const r = soundReading(c, seg, p, seg); if (r.level !== 0 || r.continuity !== "silent") closedReadingsAllSilent = false; }
}
// v8 (design review r7): a silent reading exists only while its segment is closed. Direct check:
// close C → listen C5 (silent recorded) → reopen → the silent record is gone and C5 can be listened to again,
// now returning the real level (5 directly above the leak); the two listens both count (nothing refunded).
let silentClearedOnReopen = false;
{
  const c = { leak: { seg: "C", point: 5 }, house: { seg: "A", point: 2 } };
  const seq = [{ type: "valve", seg: "C" }, { type: "listen", seg: "C", point: 5 }, { type: "reopen" }, { type: "listen", seg: "C", point: 5 }, { type: "end" }];
  let i = 0; const views = [];
  simulate(c, (v) => { views.push(v); return seq[i++]; });
  const at = (v) => v.readings.find((r) => r.seg === "C" && r.point === 5);
  silentClearedOnReopen = at(views[2])?.continuity === "silent" && at(views[2])?.level === 0 && at(views[3]) === undefined && at(views[4])?.level === 5 && at(views[4])?.continuity === "steady" && views[4].budgets.listens === B.listens - 2;
  // implicit reopen (closing another valve) clears it too
  const seq2 = [{ type: "valve", seg: "C" }, { type: "listen", seg: "C", point: 5 }, { type: "valve", seg: "A" }, { type: "end" }];
  let j = 0; const views2 = [];
  simulate(c, (v) => { views2.push(v); return seq2[j++]; });
  silentClearedOnReopen = silentClearedOnReopen && at(views2[2])?.continuity === "silent" && at(views2[3]) === undefined && views2[3].closed === "A";
}
const verdict = {
  silent_reading_exists_only_while_closed: silentClearedOnReopen,
  legitimate_strategy_wins_every_case: solvable === total,
  no_content_blind_strategy_wins_reliably: results.random_report.win_rate < 0.15 && results.listen_random_report_loudest_any.win_rate < 0.4 && results.listen_random_report_loudest_steady.win_rate < 0.45,
  flow_without_listening_is_not_reliable: results.flow_then_two_distinct_reports.win_rate < 0.5,
  every_case_solvable_within_budgets: solvable === total && worstListens <= B.listens && worstValves <= B.valve_ops,
  think_again_gate_enforced: gateBlocked === 200 && compareBlocked === 200 && listenUnlocks === 200 && silentNoUnlock === 200,
  no_ui_reveal_of_segment: results.valves_ignored_guess_segment_gradient.win_rate < 0.45,
  isolated_segment_is_silent: results.flow_then_gradient_forgets_reopen.win_rate < 0.5 && closedReadingsAllSilent,
};
const out = { generated_at: new Date().toISOString(), rules: { segments: SEGS, points_per_segment: P, budgets: B, reading_fields: T.sound_reading.fields }, cases_per_strategy: N, strategies: results, solvability: { solvable, total, first_try: firstTry, worst_listens_used: worstListens, worst_valve_ops_used: worstValves }, think_again_gate: { trials: 200, second_report_refused_without_new_evidence: gateBlocked, second_report_refused_after_compare_only: compareBlocked, second_report_allowed_after_new_listen: listenUnlocks, second_report_refused_after_silent_listen_only: silentNoUnlock }, verdict };
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
