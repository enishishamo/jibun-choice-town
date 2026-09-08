#!/usr/bin/env node
// Automated gameplay QA for Q1 leak_trace (leak-detective). Simulates player
// strategies against src/q1/leakLogic.ts directly — the same rules and the same
// strategies as the design-stage design-sim.mjs, now against the shipped module:
// thoughtless play must mostly fail, informed play must win every case within
// the budgets, the think-again gate must be real, and the public view must never
// expose the hidden truth.
//
// Usage: node factory/harness/gameplay-qa-leak.mjs

import {
  SEGMENTS, POINTS, BUDGETS, rng, newCase, newState, flowReading, soundReading,
  closeValve, listen, report, reportBlocked, openRecords, publicView, revealLeak, setFocus,
} from "../../src/q1/leakLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }
const N = 600;
const allPoints = SEGMENTS.flatMap((s) => Array.from({ length: POINTS }, (_, i) => ({ seg: s, point: i + 1 })));
const key = (p) => `${p.seg}:${p.point}`;
const pickNew = (rand, arr, used) => { const c = arr.filter((p) => !used.has(key(p))); return c.length ? c[Math.floor(rand() * c.length)] : null; };
const stateFor = (c) => ({ ...newState(rng(1)), c });

// ---- strategy runner: plan(view, state) -> action ----
function play(c, plan) {
  let s = stateFor(c);
  for (let guard = 0; guard < 80 && !s.outcome; guard++) {
    const a = plan(publicView(s));
    if (!a || a.type === "end") break;
    let r;
    if (a.type === "valve") r = closeValve(s, a.seg);
    else if (a.type === "listen") r = listen(s, a.seg, a.point);
    else if (a.type === "records") { s = openRecords(s); continue; }
    else if (a.type === "report") r = report(s, a.seg, a.point);
    else break;
    if (!r.ok && a.type === "report" && r.reason === "locked_after_miss") { /* strategy must find new evidence */ }
    if (!r.ok && a.type !== "report") { /* budget/duplicate: let the strategy pick again */ }
    s = r.state;
    if (!r.ok && a.type === "report" && (r.reason === "report_budget" || r.reason === "night_over")) break;
    if (!r.ok && a.type === "listen" && r.reason === "listen_budget" && !s.unlocked) break;
  }
  return s;
}
function leakSegFromFlow(v) {
  for (const f of v.flowLog) if (f.reading < 1) return f.closed;
  const tried = new Set(v.flowLog.map((f) => f.closed));
  if (tried.size >= SEGMENTS.length - 1) return SEGMENTS.find((s) => !tried.has(s));
  return null;
}
function nextValve(v) { const tried = new Set(v.flowLog.map((f) => f.closed)); const s = SEGMENTS.find((x) => !tried.has(x)); return s && v.budgets.valve > 0 ? { type: "valve", seg: s } : { type: "end" }; }
const unlockOr = (v, action, rand, used) => { if (v.unlocked) return action; if (v.budgets.listens > 0) { const p = pickNew(rand, allPoints, used); if (p) { used.add(key(p)); return { type: "listen", ...p }; } } return { type: "end" }; };
function gradientOn(seg, v) {
  const mine = v.readings.filter((r) => r.seg === seg);
  const steady = mine.filter((r) => r.continuity === "steady");
  const best = steady.reduce((a, r) => (!a || r.level > a.level ? r : a), null);
  if (best && best.level === 5 && v.budgets.reports > 0 && v.unlocked) return { type: "report", seg, point: best.point };
  if (v.budgets.listens > 0) {
    const heardPts = new Set(mine.map((r) => r.point));
    if (!heardPts.has(2)) return { type: "listen", seg, point: 2 };
    if (!heardPts.has(5)) return { type: "listen", seg, point: 5 };
    const r2 = steady.find((r) => r.point === 2), r5 = steady.find((r) => r.point === 5);
    let order;
    if (r2 && r5) order = r2.level > r5.level ? [1, 3, 4, 6] : r5.level > r2.level ? [6, 4, 3, 1] : [3, 4, 1, 6];
    else if (r2) order = r2.level >= 4 ? [1, 3, 4, 6] : [4, 6, 3, 1];
    else if (r5) order = r5.level >= 4 ? [6, 4, 3, 1] : [3, 1, 4, 6];
    else order = [3, 4, 1, 6];
    const next = order.find((p) => !heardPts.has(p));
    if (next) return { type: "listen", seg, point: next };
  }
  if (best && v.budgets.reports > 0 && v.unlocked) return { type: "report", seg, point: best.point };
  return { type: "end" };
}
const S = {
  // content-blind: listen at a random point (a report needs a heard point), report it, repeat
  random_report: (rand) => { const used = new Set(); let pending = null; return (v) => {
    if (v.budgets.reports <= 0) return { type: "end" };
    if (pending && v.unlocked) { const p = pending; pending = null; return { type: "report", ...p }; }
    const p = pickNew(rand, allPoints, used); if (!p) return { type: "end" }; used.add(key(p)); pending = p; return { type: "listen", ...p }; }; },
  listen_random_report_loudest: (rand) => { const used = new Set(); return (v) => {
    if (v.budgets.listens > 0 && v.readings.length < BUDGETS.listens) { const p = pickNew(rand, allPoints, used); if (p) { used.add(key(p)); return { type: "listen", ...p }; } }
    const sorted = v.readings.filter((r) => !v.misses.some((m) => m.seg === r.seg && m.point === r.point)).sort((a, b) => b.level - a.level);
    return sorted[0] && v.budgets.reports > 0 ? unlockOr(v, { type: "report", seg: sorted[0].seg, point: sorted[0].point }, rand, used) : { type: "end" }; }; },
  flow_then_guess_points: (rand) => { const used = new Set(); return (v) => {
    const seg = leakSegFromFlow(v); if (!seg) return nextValve(v);
    if (v.budgets.reports <= 0) return { type: "end" };
    // reports need a heard point: listen once at a random point on the segment, then report it (no gradient reading)
    const unheard = allPoints.filter((x) => x.seg === seg && !v.readings.some((r) => r.seg === x.seg && r.point === x.point) && !used.has(key(x)));
    const last = v.readings.filter((r) => r.seg === seg).slice(-1)[0];
    if (last && v.unlocked && !v.misses.some((m) => m.seg === last.seg && m.point === last.point)) return { type: "report", seg, point: last.point };
    const p = pickNew(rand, unheard, used); if (!p) return { type: "end" }; used.add(key(p)); return { type: "listen", ...p }; }; },
  valves_ignored_guess_segment_gradient: (rand) => { const seg = SEGMENTS[Math.floor(rand() * SEGMENTS.length)]; let tapped = 0; return (v) => { if (tapped < BUDGETS.valve) { tapped++; return { type: "valve", seg: SEGMENTS[tapped - 1] }; } return gradientOn(seg, v); }; },
  flow_then_gradient: () => (v) => { const seg = leakSegFromFlow(v); if (!seg) return nextValve(v); return gradientOn(seg, v); },
};

// ---- 1. strategies over random cases ----
const rates = {};
for (const [name, mk] of Object.entries(S)) {
  let wins = 0;
  for (let i = 0; i < N; i++) { const s = play(newCase(rng(1000 + i)), mk(rng(31 * i + 7))); if (s.outcome === "perfect" || s.outcome === "success") wins++; }
  rates[name] = wins / N;
}
check("informed play (flow -> gradient) wins every random case", rates.flow_then_gradient === 1, `${rates.flow_then_gradient}`);
check("random reporting mostly fails", rates.random_report < 0.2, `${rates.random_report.toFixed(3)}`);
check("flow-less random listening is not reliable", rates.listen_random_report_loudest < 0.45, `${rates.listen_random_report_loudest.toFixed(3)}`);
check("flow-only (no gradient reading) is not reliable", rates.flow_then_guess_points < 0.5, `${rates.flow_then_guess_points.toFixed(3)}`);
check("ignoring the meter and guessing the segment is not reliable (no UI reveal)", rates.valves_ignored_guess_segment_gradient < 0.45, `${rates.valves_ignored_guess_segment_gradient.toFixed(3)}`);

// ---- 2. every leak x distractor combination solvable on the first report within budgets ----
let total = 0, first = 0, worstL = 0, worstV = 0;
for (const ls of SEGMENTS) for (let lp = 1; lp <= POINTS; lp++) for (const hs of SEGMENTS) for (let hp = 1; hp <= POINTS; hp++) {
  if (hs === ls && hp === lp) continue; total++;
  const s = play({ leak: { seg: ls, point: lp }, house: { seg: hs, point: hp } }, S.flow_then_gradient());
  if (s.outcome === "perfect") first++; worstL = Math.max(worstL, s.listens); worstV = Math.max(worstV, s.valveOps);
}
check("all 306 combinations solved on the first report", first === total, `${first}/${total}`);
check("within budgets (worst listens/valves)", worstL <= BUDGETS.listens && worstV <= BUDGETS.valve, `${worstL}/${BUDGETS.listens}, ${worstV}/${BUDGETS.valve}`);

// ---- 3. think-again gate ----
{
  const c = { leak: { seg: "B", point: 3 }, house: { seg: "A", point: 1 } };
  let s = stateFor(c);
  s = listen(s, "B", 2).state; s = listen(s, "B", 3).state; // hear both, report the wrong one first
  const miss = report(s, "B", 2); s = miss.state;
  check("a wrong report is a miss and locks", miss.ok && miss.hit === false && s.unlocked === false && s.outcome === null);
  check("second report refused with no new evidence", report(s, "B", 3).ok === false && reportBlocked(s, "B", 3) === "locked_after_miss");
  check("opening the record panel does not unlock", report(openRecords(s), "B", 3).ok === false);
  s = listen(s, "B", 4).state;
  const hit = report(s, "B", 3);
  check("a new listen unlocks; correct second report = success", hit.ok && hit.hit === true && hit.state.outcome === "success");
  // budgets exhausted before the first report: a miss ends the night honestly
  let t = stateFor(c); for (const p of [1, 2, 4, 5, 6]) t = listen(t, "B", p).state;
  const m2 = report(t, "B", 5); check("miss with no listens left -> honest partial", m2.ok && m2.hit === false && m2.state.outcome === "partial");
  let u = stateFor(c); u = listen(u, "B", 1).state; u = listen(u, "B", 2).state;
  u = report(u, "B", 1).state; u = listen(u, "B", 6).state; u = report(u, "B", 2).state;
  check("two misses -> partial", u.outcome === "partial" && u.reports === 2);
}

// ---- 4. rules and budgets ----
{
  const c = { leak: { seg: "C", point: 5 }, house: { seg: "C", point: 2 } };
  let s = stateFor(c);
  check("meter shows base + leak while open", flowReading(s) === 2.2);
  s = closeValve(s, "A").state; check("closing a non-leak segment barely moves the meter (1 decimal)", flowReading(s) === 2.2 && s.flowLog[0].reading === 2.2);
  s = closeValve(s, "C").state; check("closing the leak segment drops the meter to base", flowReading(s) === 0.2);
  check("only one valve closed at a time", s.closed === "C");
  check("third valve op refused", closeValve(s, "B").ok === false && closeValve(s, "B").reason === "valve_budget");
  check("sound: loudest directly above, -1 per point", soundReading(c, "C", 5).level === 5 && soundReading(c, "C", 3).level === 3 && soundReading(c, "C", 1).level === 1);
  check("sound: other segments are faint and steady", soundReading(c, "A", 3).level === 1 && soundReading(c, "A", 3).continuity === "steady");
  check("sound: house point is level 4 intermittent", soundReading(c, "C", 2).level === 4 && soundReading(c, "C", 2).continuity === "intermittent");
  let l = stateFor(c); for (let p = 1; p <= 5; p++) l = listen(l, "A", p).state;
  check("sixth listen refused", listen(l, "A", 6).ok === false && listen(l, "A", 6).reason === "listen_budget");
  check("listening twice at a point refused", listen(l, "A", 1).ok === false);
  check("cannot report an unheard point", reportBlocked(stateFor(c), "C", 5) === "not_heard");
  check("focus is the child's toggle only", setFocus(stateFor(c), "B").focus === "B" && setFocus(setFocus(stateFor(c), "B"), "B").focus === null);
}

// ---- 5. the public view never exposes the hidden truth ----
{
  const s = stateFor({ leak: { seg: "A", point: 4 }, house: { seg: "B", point: 6 } });
  const v = JSON.stringify(publicView(s));
  check("publicView has no leak/house/case fields", !("c" in publicView(s)) && !v.includes('"leak"') && !v.includes('"house"'));
  check("revealLeak is null until the outcome is decided", revealLeak(s) === null && revealLeak(report(listen(listen(s, "A", 3).state, "A", 4).state, "A", 4).state) !== null);
  // the meter is the only flow signal, and valve close reactions carry no correctness info
  const a = closeValve(s, "A").state, b = closeValve(s, "B").state;
  check("valve reaction shape is identical for leak and non-leak segments (only the number differs)", Object.keys(publicView(a)).join() === Object.keys(publicView(b)).join());
  check("cases vary", new Set(Array.from({ length: 40 }, (_, i) => key(newCase(rng(i)).leak))).size >= 10);
  check("house distractor never coincides with the leak", Array.from({ length: 500 }, (_, i) => newCase(rng(i))).every((c) => key(c.leak) !== key(c.house)));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
