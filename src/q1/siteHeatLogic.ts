// Pure rules for the construction-site heat-safety scheduler Q1
// (gameType: schedule_and_protect, SiteHeatGame.tsx).
// No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the earlier logic/UX
// audit pass): this file did not exist before -- SiteHeatGame.tsx
// redeclared SLOTS/TASKS/risk() and the success check inline. No behavior
// bug was found in the audit; this is a refactor-only extraction so the
// "no single answer" design intent (all-rest is safe but doesn't finish
// the job; heavy work at noon finishes the job but is dangerous) can be
// asserted by factory/harness/gameplay-qa-site-heat.mjs.
export interface Slot {
  h: string;
  wbgt: number;
}

// WBGT（暑さ指数）は昼〜午後に高くなる
export const SLOTS: Slot[] = [
  { h: "8時", wbgt: 25 },
  { h: "10時", wbgt: 29 },
  { h: "12時", wbgt: 33 },
  { h: "14時", wbgt: 32 },
  { h: "16時", wbgt: 28 },
];

export type TaskId = "heavy1" | "heavy2" | "light" | "indoor" | "rest";
export interface Task {
  id: TaskId;
  name: string;
  emoji: string;
  load: number; // 2=重い 1=軽い 0=休憩
  progress: number;
}
export const TASKS: Task[] = [
  { id: "heavy1", name: "重い屋外作業", emoji: "🏗", load: 2, progress: 30 },
  { id: "heavy2", name: "重い屋外作業", emoji: "🧱", load: 2, progress: 30 },
  { id: "light", name: "軽い作業", emoji: "🔧", load: 1, progress: 15 },
  { id: "indoor", name: "屋内作業", emoji: "🏠", load: 0.5, progress: 15 },
  { id: "rest", name: "休憩", emoji: "🧊", load: 0, progress: 0 },
];

export const PROGRESS_TARGET = 75;
export const MAX_SAFE_RISK = 2; // a slot at risk level 2 ("🔴危険") is unsafe

/** 危険度：WBGTが高い時間に重い作業を置くほど上がる (0=🟢, 1=🟡, 2=🔴) */
export function risk(wbgt: number, load: number): number {
  if (load === 0) return 0;
  const score = (wbgt - 25) * load;
  return score >= 12 ? 2 : score >= 6 ? 1 : 0;
}

export const RISK_MARK = ["🟢", "🟡", "🔴"];

export type Plan = Partial<Record<string, TaskId>>;

export function taskOf(plan: Plan, h: string): Task | undefined {
  return TASKS.find((t) => t.id === plan[h]);
}

export function isFilled(plan: Plan): boolean {
  return SLOTS.every((s) => plan[s.h]);
}

export function totalProgress(plan: Plan): number {
  return SLOTS.reduce((a, s) => a + (taskOf(plan, s.h)?.progress ?? 0), 0);
}

export function risksFor(plan: Plan): number[] {
  return SLOTS.map((s) => {
    const t = taskOf(plan, s.h);
    return t ? risk(s.wbgt, t.load) : 0;
  });
}

export function maxRiskFor(plan: Plan): number {
  return Math.max(...risksFor(plan), 0);
}

/** Success = every slot filled, no slot at max (dangerous) risk, and
 * enough of the day's work got done. Matches the two mission chips shown
 * in the UI (工事の進み / 作業員の安全) exactly. */
export function isSuccess(plan: Plan): boolean {
  return isFilled(plan) && maxRiskFor(plan) < MAX_SAFE_RISK && totalProgress(plan) >= PROGRESS_TARGET;
}
