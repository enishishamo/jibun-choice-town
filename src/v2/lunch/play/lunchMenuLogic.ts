// 給食 WORLD「こんだてを考える」— pure rules for the 栄養教諭 job vertical slice.
// No React. Driven by LunchMenuPlay.tsx and factory/harness/gameplay-qa-v2-lunch-menu.mjs.
//
// ─────────────────────────────────────────────────────────────────────────
// FACT → DESIGN TRANSLATION → GAME RULE
// ─────────────────────────────────────────────────────────────────────────
// Facts (primary sources): factory/projects/v2-lunch-menu/facts/research.md and
// research-2026-09-21.md (F1..F8 / V-A1..A9).
//
//   F1/V-A2  The 学校給食摂取基準 for 児童(10〜11歳) specifies エネルギー,
//            たんぱく質, 脂質 and ナトリウム(食塩相当量) among others, and is
//            applied 弾力的に (flexibly), i.e. as a target band rather than a
//            single correct number.
//            → the child balances exactly FOUR axes, and each axis has a
//              GOOD BAND rather than a maximum. More is not better.
//   F2/V-A1  完全給食 = 主食 + ミルク + おかず（学校給食法施行規則第1条の定義）.
//            → milk occupies a fixed slot; it is never a choice and is never
//              the thing that fails to arrive, AND a tray with no 主食 at all is
//              not a school lunch, however well the four axes sit. That is the
//              one structural requirement besides the four axes; it is not a
//              fifth gauge, and the child sees it as the bread-and-rice row
//              asking to be used.
//   F6       Real menu planning weighs nutrition together with 食材の重複,
//            調理法, 旬, 価格, アレルギー, 作業効率...
//            → the game shows only the four axes; the other considerations
//              belong to KNOW THE JOB, not to this board.
//   F7/V-A5  When an ingredient does not arrive, the 栄養教諭 proposes the
//            substitute and the 校長 decides.
//            → the EVENT removes one *swappable* dish after the child has
//              sent their first menu, and the child rebuilds.
//
// !! THE PER-DISH NUMBERS BELOW ARE GAME COEFFICIENTS, NOT NUTRITION DATA. !!
// No official source states "ごはん = N kcal" for a school lunch portion, and
// the real value depends on the recipe and the serving size. AXIS[] values are
// a normalized DESIGN MODEL chosen so that the board has: several genuinely
// different viable menus, real trade-offs between axes, and a recoverable
// EVENT. They must never be presented to a child, or anywhere else, as
// measured nutrition. The child sees a position in a band, never a number.

export type Axis = "energy" | "protein" | "fat" | "salt";
export const AXES: Axis[] = ["energy", "protein", "fat", "salt"];

/** Where a value sits relative to its good band. */
export type Band = "low" | "good" | "high";

export interface Dish {
  id: string;
  /** serving order on the counter (主食→主菜→副菜→汁物) — layout only, never a rule */
  course: "staple" | "main" | "side" | "soup" | "milk";
  /** GAME COEFFICIENTS (see header) — how far this dish moves each axis */
  axis: Record<Axis, number>;
}

const D = (id: string, course: Dish["course"], energy: number, protein: number, fat: number, salt: number): Dish =>
  ({ id, course, axis: { energy, protein, fat, salt } });

/** V-A1/F2: part of 完全給食 by definition → fixed slot, never removable, never the EVENT target. */
export const MILK: Dish = D("milk", "milk", 10, 18, 14, 2);

export const DISHES: Dish[] = [
  D("rice", "staple", 26, 8, 2, 1),
  D("bread", "staple", 27, 11, 11, 15),
  D("salmon", "main", 11, 30, 15, 22),
  D("karaage", "main", 20, 27, 30, 13),
  D("croquette", "main", 21, 12, 29, 13),
  D("gomaae", "side", 5, 6, 9, 9),
  D("potato_salad", "side", 13, 7, 20, 12),
  D("miso_soup", "soup", 5, 12, 6, 21),
  D("corn_soup", "soup", 12, 7, 16, 14),
];
export const DISH_BY_ID: Record<string, Dish> = Object.fromEntries([...DISHES, MILK].map((d) => [d.id, d]));

export const MILK_FIXED = true;
export const FREE_SLOTS = 4;
/** The nine dishes a session offers. Expanding this pool is NEXT ITERATION work
 * (see factory/state/backlog/) — the core loop is complete at nine. */
export const DEFAULT_CANDIDATES = DISHES.map((d) => d.id);

/** Where the band sits inside the visible track, as a 0..1 sub-range. The CSS
 * draws the hollow from exactly these numbers, so the picture can never drift
 * from the rule. */
export function bandOnTrack(a: Axis): [number, number] {
  const [lo, hi] = BAND[a];
  const [t0, t1] = TRACK[a];
  return [(lo - t0) / (t1 - t0), (hi - t0) / (t1 - t0)];
}

/** The good band per axis, tuned by exhaustive search over all C(9,4)=126 menus
 * (see gameplay-qa-v2-lunch-menu.mjs, which re-proves every property below):
 *   19 viable menus in 8 genuinely different families,
 *   every dish leaves >= 6 viable menus when it fails to arrive,
 *   every one-axis-off menu is fixable in a single swap,
 *   every axis can be missed on BOTH sides (no axis where "more is better"). */
export const BAND: Record<Axis, [number, number]> = {
  energy: [52, 74],
  protein: [49, 74],
  fat: [43, 78],
  salt: [48, 70],
};

/** The visible track for each axis.
 * The floor is the empty tray (milk alone) — the real start of the journey — so
 * the very first dish already moves the bead instead of leaving it pinned
 * against the wall. The ceiling is then mirrored about the middle of the band,
 * so the band still sits exactly in the centre of the track and neither end of
 * it means "better". */
export const TRACK: Record<Axis, [number, number]> = Object.fromEntries(
  AXES.map((a) => {
    const [lo, hi] = BAND[a];
    const floor = MILK_FIXED ? MILK.axis[a] : 0;
    const centre = (lo + hi) / 2;
    return [a, [floor, centre + (centre - floor)]];
  }),
) as Record<Axis, [number, number]>;

export type Tray = (string | null)[];

export interface Reading {
  /** raw model total — internal only, never shown to a child */
  value: number;
  band: Band;
  /** 0..1 position on the visible track */
  pos: number;
}
export interface Evaluation {
  readings: Record<Axis, Reading>;
  filled: number;
  complete: boolean;
  /** F2: 完全給食 needs a 主食. False while the tray has neither rice nor bread. */
  hasStaple: boolean;
  /** every axis inside its band AND a 主食 present — the menu works */
  viable: boolean;
  /** axes outside their band */
  off: Axis[];
}

export function trayDishes(tray: Tray): Dish[] {
  const ds = tray.filter((d): d is string => !!d).map((id) => DISH_BY_ID[id]);
  return MILK_FIXED ? [...ds, MILK] : ds;
}

export function evaluate(tray: Tray): Evaluation {
  const dishes = trayDishes(tray);
  const filled = tray.filter(Boolean).length;
  const readings = {} as Record<Axis, Reading>;
  for (const a of AXES) {
    const value = dishes.reduce((s, d) => s + d.axis[a], 0);
    const [lo, hi] = BAND[a];
    const [t0, t1] = TRACK[a];
    readings[a] = {
      value,
      band: value < lo ? "low" : value > hi ? "high" : "good",
      pos: Math.max(0, Math.min(1, (value - t0) / (t1 - t0))),
    };
  }
  const complete = filled === FREE_SLOTS;
  const hasStaple = dishes.some((d) => d.course === "staple");
  const off = AXES.filter((a) => readings[a].band !== "good");
  return { readings, filled, complete, hasStaple, viable: complete && hasStaple && off.length === 0, off };
}

/** Which dishes on the tray push `axis` in `dir` the hardest. At most two, so a
 * hint never covers the tray and never points at a single "answer" when more
 * than one dish is involved. */
export const RELATED_CAP = 2;
export function relatedDishes(tray: Tray, axis: Axis, dir: Band): string[] {
  const ids = tray.filter((d): d is string => !!d);
  if (!ids.length) return [];
  const sorted = [...ids].sort((a, b) =>
    dir === "high" ? DISH_BY_ID[b].axis[axis] - DISH_BY_ID[a].axis[axis] : DISH_BY_ID[a].axis[axis] - DISH_BY_ID[b].axis[axis],
  );
  return sorted.slice(0, RELATED_CAP);
}
/** Union over every off-axis, still capped at two dishes in total. */
export function relatedSet(tray: Tray, ev: Evaluation): Set<string> {
  const weight = new Map<string, number>();
  for (const a of ev.off) {
    for (const id of relatedDishes(tray, a, ev.readings[a].band)) {
      weight.set(id, (weight.get(id) ?? 0) + Math.abs(DISH_BY_ID[id].axis[a]));
    }
  }
  return new Set([...weight.entries()].sort((x, y) => y[1] - x[1]).slice(0, RELATED_CAP).map(([id]) => id));
}

// ---------------------------------------------------------------- session

/** build → (send) → rebuild → (send) → cleared.
 * The child sends the tray twice: the first send is intercepted by the delivery
 * trouble, the second one actually reaches the school. Nothing ever clears by
 * itself — `send` is only ever called from the child's own gesture. */
export type Phase = "build" | "rebuild" | "cleared";

export interface Session {
  candidates: string[];
  tray: Tray;
  /** false = this dish did not arrive (EVENT) */
  available: Record<string, boolean>;
  phase: Phase;
  /** the child has completed a viable menu at least once (drives the status layer) */
  sawFirstViable: boolean;
  /** the dish that failed to arrive, null until the EVENT */
  eventDish: string | null;
}

export function newSession(candidates: string[] = DEFAULT_CANDIDATES): Session {
  return {
    candidates: [...candidates],
    tray: Array(FREE_SLOTS).fill(null),
    available: Object.fromEntries(candidates.map((c) => [c, true])),
    phase: "build",
    sawFirstViable: false,
    eventDish: null,
  };
}

export type PlaceResult =
  | { ok: true; session: Session; slot: number }
  | { ok: false; reason: "unavailable" | "full" | "not_candidate" | "on_tray" | "cleared" };

export function place(s: Session, dishId: string): PlaceResult {
  if (s.phase === "cleared") return { ok: false, reason: "cleared" };
  if (!s.candidates.includes(dishId)) return { ok: false, reason: "not_candidate" };
  if (!s.available[dishId]) return { ok: false, reason: "unavailable" };
  if (s.tray.includes(dishId)) return { ok: false, reason: "on_tray" };
  const slot = s.tray.indexOf(null);
  if (slot < 0) return { ok: false, reason: "full" };
  const tray = [...s.tray];
  tray[slot] = dishId;
  const next: Session = { ...s, tray };
  if (evaluate(tray).viable) next.sawFirstViable = true;
  return { ok: true, session: next, slot };
}

export function remove(s: Session, dishId: string): Session {
  if (s.phase === "cleared") return s;
  const slot = s.tray.indexOf(dishId);
  if (slot < 0) return s;
  const tray = [...s.tray];
  tray[slot] = null;
  return { ...s, tray };
}

/** Swap in place: used when the tray is full and the child taps a new dish. */
export function swap(s: Session, outId: string, inId: string): PlaceResult {
  const slot = s.tray.indexOf(outId);
  if (slot < 0) return { ok: false, reason: "not_candidate" };
  if (!s.available[inId]) return { ok: false, reason: "unavailable" };
  if (s.tray.includes(inId)) return { ok: false, reason: "on_tray" };
  const tray = [...s.tray];
  tray[slot] = inId;
  const next: Session = { ...s, tray };
  if (evaluate(tray).viable) next.sawFirstViable = true;
  return { ok: true, session: next, slot };
}

/** The tray may be sent when it is full, every dish on it arrived, and the menu
 * works. There is no score threshold — "works" means all four axes are inside
 * their band, and many different menus satisfy that. */
export function canSend(s: Session): boolean {
  if (s.phase === "cleared") return false;
  return evaluate(s.tray).viable && s.tray.every((d) => d && s.available[d]);
}

/** All menus, from the currently available dishes, that work. */
export function viableMenus(s: Session): string[][] {
  const pool = s.candidates.filter((c) => s.available[c]);
  const out: string[][] = [];
  const pick = (start: number, acc: string[]) => {
    if (acc.length === FREE_SLOTS) { if (evaluate(acc).viable) out.push([...acc]); return; }
    for (let i = start; i < pool.length; i++) pick(i + 1, [...acc, pool[i]]);
  };
  pick(0, []);
  return out;
}

/** F7/V-A5: one ingredient does not arrive. We pick the dish on the tray that
 * is carrying the most weight, among those whose loss still leaves at least
 * MIN_RECOVERIES different working menus — so the rebuild is a real problem and
 * never a dead end. Milk is never picked (F2: it is part of the definition of a
 * 完全給食, not a choice). Deterministic for a given tray, but different trays
 * lose different dishes. */
export const MIN_RECOVERIES = 3;
export function pickEventDish(s: Session): string | null {
  const onTray = s.tray.filter((d): d is string => !!d);
  const scored = onTray
    .map((id) => {
      const after: Session = { ...s, available: { ...s.available, [id]: false } };
      const recoveries = viableMenus(after).length;
      const load = AXES.reduce((sum, a) => sum + DISH_BY_ID[id].axis[a], 0);
      return { id, recoveries, load };
    })
    .filter((x) => x.recoveries >= MIN_RECOVERIES)
    .sort((a, b) => b.load - a.load || a.id.localeCompare(b.id));
  return scored[0]?.id ?? null;
}

/** The first send is intercepted: the trouble arrives instead of the lunch. */
export function fireEvent(s: Session, dishId: string | null = pickEventDish(s)): Session {
  if (s.phase !== "build" || !dishId || !s.tray.includes(dishId)) return s;
  return {
    ...s,
    tray: s.tray.map((d) => (d === dishId ? null : d)),
    available: { ...s.available, [dishId]: false },
    phase: "rebuild",
    eventDish: dishId,
  };
}

export type SendResult = { ok: false } | { ok: true; session: Session; outcome: "intercepted" | "delivered" };

/** The child's own commit. Never called by a timer. */
export function send(s: Session): SendResult {
  if (!canSend(s)) return { ok: false };
  if (s.phase === "build") {
    const next = fireEvent(s);
    // if nothing could be taken away safely, deliver rather than trap the child
    if (next === s) return { ok: true, session: { ...s, phase: "cleared" }, outcome: "delivered" };
    return { ok: true, session: next, outcome: "intercepted" };
  }
  return { ok: true, session: { ...s, phase: "cleared" }, outcome: "delivered" };
}

// ---------------------------------------------------------------- analysis (QA)

export function enumerateTrays(candidates: string[] = DEFAULT_CANDIDATES): { tray: string[]; ev: Evaluation }[] {
  const out: { tray: string[]; ev: Evaluation }[] = [];
  const pick = (start: number, acc: string[]) => {
    if (acc.length === FREE_SLOTS) { out.push({ tray: [...acc], ev: evaluate(acc) }); return; }
    for (let i = start; i < candidates.length; i++) pick(i + 1, [...acc, candidates[i]]);
  };
  pick(0, []);
  return out;
}
