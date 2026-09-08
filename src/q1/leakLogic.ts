// Pure game logic for Q1 "leak_trace" (水道の漏水調査員 / leak-detective).
// Every rule here reproduces factory/projects/leak-detective/design/state_table.json
// (translation t1b-night-listening-evidence-gate, design review r4 PASS 84).
// No React, no DOM: factory/harness/gameplay-qa-leak.mjs simulates strategies
// against this module directly, and LeakTraceGame.tsx renders ONLY publicView().
//
// Core: isolate the leaking pipe segment by closing valves and watching the
// block flow meter (夜間最小流量法), then walk an electronic leak detector along
// that segment reading level + continuity to find the point directly above the
// leak, then REPORT the point to the repair crew (2 reports per night). After a
// miss the next report is enabled only by a NEW listen (new evidence).

export type Seg = "A" | "B" | "C";
export const SEGMENTS: Seg[] = ["A", "B", "C"];
export const SEGMENT_NAMES: Record<Seg, string> = { A: "区間A（北側）", B: "区間B（東側）", C: "区間C（南側）" };
export const POINTS = 6;
export const BUDGETS = { valve: 2, listens: 5, reports: 2 } as const;
export const FLOW = { base: 0.2, leak: 2.0, share: 0.05 } as const;

export type Continuity = "steady" | "intermittent";
export interface Spot { seg: Seg; point: number }
export interface LeakCase { leak: Spot; house: Spot }
export interface Reading extends Spot { level: number; continuity: Continuity }
export interface FlowLog { closed: Seg; reading: number }
export type Outcome = "perfect" | "success" | "partial";

export interface LeakState {
  c: LeakCase; // hidden truth — never rendered directly (see publicView)
  closed: Seg | null;
  valveOps: number;
  listens: number;
  reports: number;
  readings: Reading[];
  flowLog: FlowLog[];
  misses: Spot[];
  /** after a miss: false until a NEW listen happens (think-again gate) */
  unlocked: boolean;
  focus: Seg | null; // the child's own hypothesis; never set by the system
  outcome: Outcome | null;
}

export type Rand = () => number;
export function rng(seed: number): Rand {
  // scramble + warm up so that consecutive small seeds (QA, replays) diverge immediately
  let s = ((seed ^ 0x9e3779b9) * 2654435761) >>> 0;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  next(); next(); next();
  return next;
}
const same = (a: Spot, b: Spot) => a.seg === b.seg && a.point === b.point;

export function newCase(rand: Rand): LeakCase {
  const leak: Spot = { seg: SEGMENTS[Math.floor(rand() * SEGMENTS.length)], point: 1 + Math.floor(rand() * POINTS) };
  let house: Spot;
  do house = { seg: SEGMENTS[Math.floor(rand() * SEGMENTS.length)], point: 1 + Math.floor(rand() * POINTS) };
  while (same(house, leak));
  return { leak, house };
}

export function newState(rand: Rand = Math.random): LeakState {
  return { c: newCase(rand), closed: null, valveOps: 0, listens: 0, reports: 0, readings: [], flowLog: [], misses: [], unlocked: true, focus: null, outcome: null };
}

/** Block meter reading (m3/h, 1 decimal): base + leak (if the leak segment is open) − share per closed segment. */
export function flowReading(s: LeakState): number {
  const leakOpen = s.closed !== s.c.leak.seg;
  const v = FLOW.base + (leakOpen ? FLOW.leak : 0) - FLOW.share * (s.closed ? 1 : 0);
  return Number(v.toFixed(1));
}

/** Detector reading at a point: loudest directly above the leak (level 5), −1 per point of distance; the house-usage point is level 4 intermittent. */
export function soundReading(c: LeakCase, seg: Seg, point: number): { level: number; continuity: Continuity } {
  let level = seg === c.leak.seg ? Math.max(1, 5 - Math.abs(point - c.leak.point)) : 1;
  let continuity: Continuity = "steady";
  if (seg === c.house.seg && point === c.house.point) { level = 4; continuity = "intermittent"; }
  return { level, continuity };
}

// ---- actions (all pure: return a new state; refusals return the same state + reason) ----
export type ActionResult = { state: LeakState; ok: boolean; reason?: string };

export function closeValve(s: LeakState, seg: Seg): ActionResult {
  if (s.outcome) return { state: s, ok: false, reason: "night_over" };
  if (s.closed === seg) return { state: s, ok: false, reason: "already_closed" };
  if (s.valveOps >= BUDGETS.valve) return { state: s, ok: false, reason: "valve_budget" };
  const next: LeakState = { ...s, closed: seg, valveOps: s.valveOps + 1 };
  next.flowLog = [...s.flowLog, { closed: seg, reading: flowReading(next) }];
  return { state: next, ok: true };
}
export function openValve(s: LeakState): ActionResult {
  if (!s.closed) return { state: s, ok: false, reason: "nothing_closed" };
  return { state: { ...s, closed: null }, ok: true };
}
export function setFocus(s: LeakState, seg: Seg | null): LeakState {
  return { ...s, focus: s.focus === seg ? null : seg };
}
export function heard(s: LeakState, seg: Seg, point: number): Reading | undefined {
  return s.readings.find((r) => r.seg === seg && r.point === point);
}
export function listen(s: LeakState, seg: Seg, point: number): ActionResult {
  if (s.outcome) return { state: s, ok: false, reason: "night_over" };
  if (heard(s, seg, point)) return { state: s, ok: false, reason: "already_heard" };
  if (s.listens >= BUDGETS.listens) return { state: s, ok: false, reason: "listen_budget" };
  const r = soundReading(s.c, seg, point);
  // a new listen is new evidence: it re-enables reporting after a miss
  return { state: { ...s, listens: s.listens + 1, readings: [...s.readings, { seg, point, ...r }], unlocked: true }, ok: true };
}
/** Why a report is currently impossible (null = allowed). The UI uses this for the button state. */
export function reportBlocked(s: LeakState, seg?: Seg, point?: number): string | null {
  if (s.outcome) return "night_over";
  if (s.reports >= BUDGETS.reports) return "report_budget";
  if (!s.unlocked) return "locked_after_miss";
  if (seg !== undefined && point !== undefined) {
    if (!heard(s, seg, point)) return "not_heard";
    if (s.misses.some((m) => m.seg === seg && m.point === point)) return "already_missed";
  }
  return null;
}
export function report(s: LeakState, seg: Seg, point: number): ActionResult & { hit?: boolean } {
  const blocked = reportBlocked(s, seg, point);
  if (blocked) return { state: s, ok: false, reason: blocked };
  const reports = s.reports + 1;
  if (same({ seg, point }, s.c.leak)) {
    return { state: { ...s, reports, outcome: reports === 1 ? "perfect" : "success" }, ok: true, hit: true };
  }
  const misses = [...s.misses, { seg, point }];
  const noMoreReports = reports >= BUDGETS.reports;
  const noMoreListens = s.listens >= BUDGETS.listens; // cannot produce new evidence -> the night ends honestly
  const outcome: Outcome | null = noMoreReports || noMoreListens ? "partial" : null;
  return { state: { ...s, reports, misses, unlocked: false, outcome }, ok: true, hit: false };
}
/** Opening the record panel is read-only: it never changes state (no free unlock). */
export function openRecords(s: LeakState): LeakState { return s; }

// ---- what the UI is allowed to know (no leak / house position) ----
export interface PublicView {
  closed: Seg | null;
  flow: number;
  budgets: { valve: number; listens: number; reports: number };
  readings: Reading[];
  flowLog: FlowLog[];
  misses: Spot[];
  unlocked: boolean;
  focus: Seg | null;
  outcome: Outcome | null;
}
export function publicView(s: LeakState): PublicView {
  return { closed: s.closed, flow: flowReading(s), budgets: { valve: BUDGETS.valve - s.valveOps, listens: BUDGETS.listens - s.listens, reports: BUDGETS.reports - s.reports }, readings: s.readings, flowLog: s.flowLog, misses: s.misses, unlocked: s.unlocked, focus: s.focus, outcome: s.outcome };
}
/** Only for the dawn screen AFTER the outcome is decided (hit animation / where the crew dug). */
export function revealLeak(s: LeakState): Spot | null { return s.outcome ? s.c.leak : null; }
