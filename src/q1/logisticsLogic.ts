// Pure rules for the delivery-worker Q1 (gameType: load_and_route), redesigned per
// factory/projects/legacy-load-and-route (GAME_TRANSLATION_REBUILD, t1-zone-and-route).
// Same pattern as farmLogic.ts/clueJoinLogic.ts: no React here.
//
// The old implementation (superseded, see factory/state/legacy/reverse-audits/
// load_and_route.json) had 4 fixed cargo items with fixed correct zones, 2 fixed
// schools with a hardcoded visiting order, and per-item failure messages that let a
// child brute-force every combination. This module mirrors
// factory/projects/legacy-load-and-route/design/design-sim.mjs (v4, design review r4
// PASS 88) exactly -- FOODS/ZONES/DRAW_SIZE/ARCHETYPES/zoneWin/newRouteSession are
// byte-identical in structure. Keep the two in sync.
export interface Food {
  id: string;
  /** every zone that satisfies this food's real storage requirement (design review r2
   * BLOCKER fix: 厚生労働省's thresholds are upper bounds for 4 of 6 categories, so a
   * food can have more than one valid zone -- e.g. raw_meat/milk (10C or below) are
   * correctly stored in EITHER cold5 or cold10, not just one "correct answer"). */
  validZones: ZoneId[];
}

export type ZoneId = "frozen" | "cold5" | "cold10" | "ambient";

// 生鮮魚介類: 5℃以下 -- only cold5 satisfies this (stricter than meat/milk's 10C).
// 食肉・鯨肉/乳・濃縮乳等: 10℃以下 -- cold5 (colder) also satisfies this.
// 冷凍食品全般: -15℃以下. 生鮮果実・野菜: 10℃前後（範囲、上限条件ではない）.
// 穀類加工品: 室温（別区分、上限条件ではない）。design review r3 HIGH fix:
// "colder is always safe" does NOT generalize past the first 3 lines below.
export const FOODS: Food[] = [
  { id: "raw_fish", validZones: ["cold5"] },
  { id: "raw_meat", validZones: ["cold5", "cold10"] },
  { id: "milk", validZones: ["cold5", "cold10"] },
  { id: "frozen_croquette", validZones: ["frozen"] },
  { id: "frozen_vegetable", validZones: ["frozen"] },
  { id: "potato", validZones: ["ambient"] },
  { id: "bread", validZones: ["ambient"] },
  { id: "flour", validZones: ["ambient"] },
];
export const ZONES: ZoneId[] = ["frozen", "cold5", "cold10", "ambient"];
export const DRAW_SIZE = 4;

// Neutral, food-shape-free display data (design review r3 BLOCKER fix: zone icons must
// not resemble any specific food, e.g. no fish/meat/milk emoji on a zone).
export const FOOD_NAMES: Record<string, string> = {
  raw_fish: "さば",
  raw_meat: "とり肉",
  milk: "牛乳",
  frozen_croquette: "コロッケ",
  frozen_vegetable: "ミックス野菜",
  potato: "じゃがいも",
  bread: "パン",
  flour: "小麦粉",
};
export const FOOD_STORAGE_TEXT: Record<string, string> = {
  raw_fish: "生鮮魚介類は5℃以下で保存する決まり",
  raw_meat: "食肉・鯨肉は10℃以下で保存する決まり",
  milk: "乳・濃縮乳等は10℃以下で保存する決まり",
  frozen_croquette: "冷凍食品は-15℃以下で保存する決まり",
  frozen_vegetable: "冷凍食品は-15℃以下で保存する決まり",
  potato: "生鮮果実・野菜は10℃前後で保存する決まり（冷やしすぎに注意）",
  bread: "穀類加工品は室温で保存する決まり",
  flour: "穀類加工品は室温で保存する決まり",
};
export const ZONE_LABELS: Record<ZoneId, string> = {
  frozen: "🧊冷凍",
  cold5: "❄️冷蔵5℃",
  cold10: "🌡️冷蔵10℃",
  ambient: "📦常温",
};

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawFoods(rand: () => number = Math.random): Food[] {
  return shuffle(FOODS, rand).slice(0, DRAW_SIZE);
}

export function zoneWin(drawn: Food[], placement: Record<string, ZoneId | undefined>): boolean {
  return drawn.every((f) => !!placement[f.id] && f.validZones.includes(placement[f.id]!));
}

// per-session shuffle: independent random permutation of display order (mirrors
// farmLogic.ts's shuffledIds / clueJoinLogic.ts shuffledIds -- shuffle once per mount,
// id-based scoring only, never position-based).
export function shuffledIds(ids: string[], rand: () => number = Math.random): string[] {
  return shuffle(ids, rand);
}

// ---------------------------------------------------------------- route
export interface RouteArchetype {
  id: string;
  slotA: { travel: number; deadline: number };
  slotB: { travel: number; deadline: number };
  between: number;
  correctIsSlotA: boolean;
}

// Balanced stratified scenario pool (design review r1 fix): 3 hand-verified archetypes
// (route-tuning-notes.md), each drawn with equal 1/3 probability and independently
// mirrored, so each single-axis heuristic ("nearer first" / "tighter deadline first")
// is correct in exactly 2 of 3 -- a guaranteed 66.7% ceiling, not an empirical average.
export const ARCHETYPES: RouteArchetype[] = [
  { id: "both-agree", slotA: { travel: 10, deadline: 30 }, slotB: { travel: 40, deadline: 90 }, between: 30, correctIsSlotA: true },
  { id: "nearer-only-correct", slotA: { travel: 15, deadline: 50 }, slotB: { travel: 35, deadline: 45 }, between: 20, correctIsSlotA: true },
  { id: "tighter-only-correct", slotA: { travel: 15, deadline: 50 }, slotB: { travel: 25, deadline: 30 }, between: 20, correctIsSlotA: false },
];

export interface RouteSession {
  archetype: string;
  travelA: number; dlA: number;
  travelB: number; dlB: number;
  between: number;
  correctOrder: "AB" | "BA";
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function newRouteSession(rand: () => number = Math.random): RouteSession {
  const arc = pick(ARCHETYPES, rand);
  const mirror = rand() < 0.5; // which slot displays as "A" vs "B" -- independent of correctness
  const dispA = mirror ? arc.slotB : arc.slotA;
  const dispB = mirror ? arc.slotA : arc.slotB;
  const correctOrder: "AB" | "BA" = arc.correctIsSlotA !== mirror ? "AB" : "BA"; // XOR
  return {
    archetype: arc.id,
    travelA: dispA.travel, dlA: dispA.deadline,
    travelB: dispB.travel, dlB: dispB.deadline,
    between: arc.between,
    correctOrder,
  };
}

export function validOrder(s: RouteSession, order: "AB" | "BA"): boolean {
  if (order === "AB") return s.travelA <= s.dlA && s.travelA + s.between <= s.dlB;
  return s.travelB <= s.dlB && s.travelB + s.between <= s.dlA;
}

// ---------------------------------------------------------------- combined session
export interface Session {
  foods: Food[];
  route: RouteSession;
}

export function newSession(rand: () => number = Math.random): Session {
  return { foods: drawFoods(rand), route: newRouteSession(rand) };
}

export function sessionWin(session: Session, placement: Record<string, ZoneId | undefined>, order: "AB" | "BA" | undefined): boolean {
  return !!order && zoneWin(session.foods, placement) && validOrder(session.route, order);
}
