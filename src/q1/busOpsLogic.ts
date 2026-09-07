// Pure rules for the chartered-bus dispatcher Q1 (gameType: bus_ops).
// No React here, same pattern as labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair round 1 (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ43/CA55 — "道路条件が固定され、山道は必ず失敗するため
// 資料から唯一の安全入力を転記する構造になっている"): choosing the
// mountain route used to ALWAYS fail regardless of anything the player did
// or read, so the only "answer" was to always pick coast -- copy-able
// straight from the road-info card with no actual risk assessment. Round 1
// introduced a departure-time-dependent closure window. Independent review
// found this reintroduced the same underlying defect in a new shape: the
// success screen never differentiated outcomes by route, so "always coast,
// ignore the road info and the departure-time picker" was STILL a
// guaranteed, content-blind win (coast was slower and needed a rest stop,
// but paid literally no other price) -- a genuine BLOCKER (win without
// using C). It also found blind mountain-timing succeeded 2 times out of 3
// (too permissive).
//
// Round 2 (this revision) fixes both: only 1 of 3 departure times is safe
// for mountain (was 2 of 3); and `isOptimalPlan` gives coast a REAL cost
// when it wasn't necessary -- if mountain was actually safe for the chosen
// departure time, using coast for any bus anyway is now a genuine
// suboptimal choice (slower, unnecessary rest stop) that the component
// surfaces as an honest, weaker outcome instead of an identical success.
export interface DepartureTime {
  id: string;
  label: string;
  /** does this departure time fall inside the mountain route's closure window? */
  inClosure: boolean;
}

// closure window stated in the road-info card: 9:00-13:00. Only the
// departure time strictly after the window is safe for mountain -- round 1
// left 2 of 3 times safe (67% blind success); this narrows it to 1 of 3.
export const DEPARTURE_TIMES: DepartureTime[] = [
  { id: "t930", label: "9:30 に出発する", inClosure: true },
  { id: "t11", label: "11:00 に出発する", inClosure: true },
  { id: "t14", label: "14:00 に出発する", inClosure: false },
];

export type RouteId = "mountain" | "coast";
export const ROUTES: { id: RouteId; name: string; min: number; needsRest: boolean }[] = [
  { id: "mountain", name: "山道ルート（45分）", min: 45, needsRest: false },
  { id: "coast", name: "海沿いルート（65分）", min: 65, needsRest: true },
];

/** Given the chosen departure time and each bus's route, does the trip hit
 * the mountain closure? Coast is always safe; mountain is only unsafe if
 * the departure time falls in the closure window. */
export function hitsClosure(departureId: string | null, routes: Record<string, RouteId>): boolean {
  if (!departureId) return false;
  const dep = DEPARTURE_TIMES.find((d) => d.id === departureId);
  if (!dep || !dep.inClosure) return false;
  return Object.values(routes).some((r) => r === "mountain");
}

/** Is mountain actually safe for the chosen departure time? (Independent
 * of what any bus actually picked -- this is the "could you have used it"
 * question, used to judge whether a coast choice was necessary or just an
 * unexamined default.) */
export function mountainSafe(departureId: string | null): boolean {
  const dep = DEPARTURE_TIMES.find((d) => d.id === departureId);
  return !!dep && !dep.inClosure;
}

/** 2026-09-07 repair round 2 (independent review BLOCKER: coast was
 * mechanically dominant -- identical success regardless of route, so a
 * player never needed to read the road info or engage with departure
 * timing at all). A plan is only fully optimal if it does NOT waste a
 * safe mountain opportunity: when mountain is safe for the day, every bus
 * should be using it (faster, no rest stop needed); when mountain is
 * unsafe, coast is the only way to reach this function at all (mountain
 * would have hit the closure first), so it's automatically correct.
 * Only reachable once `hitsClosure` is false (i.e. departure actually
 * succeeded) -- this judges QUALITY of a successful plan, not safety. */
export function isOptimalPlan(departureId: string | null, routes: Record<string, RouteId>): boolean {
  if (!mountainSafe(departureId)) return true; // coast was the only safe option -- using it is correct, not a compromise
  return Object.values(routes).every((r) => r === "mountain");
}
