// Pure rules for the school-trip educational-travel Q1 (gameType: trip_plan).
// No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (UX/logic audit): this file already carried a fixed bug
// (BUDGET was 220 but the sum of every card's cost is only 171, so
// "予算オーバー" could never fire; lowered to 150) and a removed dead
// check (a TIRED_CAP hard-fail that summing every card's `tired` value
// could never reach, so it was deleted rather than kept as misleading
// decoration). This extraction (mechanical-verification follow-up) pulls
// those already-fixed numbers and the day/issue rules out of
// TripPlanGame.tsx into a pure module so gameplay-qa-trip-plan.mjs can
// prove BUDGET is both reachable (a losing case exists) and satisfiable
// (a winning case exists) — guarding against the exact "unreachable
// constant" bug class recurring. Refactor-only: behavior unchanged.

export interface Card {
  id: string;
  name: string;
  icon: string;
  time: number; // 分
  cost: number; // 予算ポイント
  learn?: boolean;
  tired: number; // 増える(+)か、休むと減る(-)
  cat: "move" | "visit" | "meal" | "rest" | "hotel" | "free";
}

export const CARDS: Card[] = [
  { id: "shinkansen_go", name: "新幹線で京都へ", icon: "🚄", time: 210, cost: 40, tired: 2, cat: "move" },
  { id: "bus1", name: "バスにのりかえる", icon: "🚌", time: 30, cost: 5, tired: 1, cat: "move" },
  { id: "kiyomizu", name: "清水寺を見学する", icon: "⛩️", time: 90, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "kinkaku", name: "金閣寺を見学する", icon: "🏯", time: 80, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "nara", name: "奈良公園でシカとふれあう", icon: "🦌", time: 100, cost: 10, learn: true, tired: 1, cat: "visit" },
  { id: "todaiji", name: "東大寺の大仏を見学する", icon: "🗿", time: 70, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "craft", name: "清水焼の絵付け体験をする", icon: "🎨", time: 100, cost: 15, learn: true, tired: 2, cat: "visit" },
  { id: "lunch1", name: "昼食をとる", icon: "🍱", time: 50, cost: 8, tired: -2, cat: "meal" },
  { id: "lunch2", name: "昼食をとる", icon: "🍱", time: 50, cost: 8, tired: -2, cat: "meal" },
  { id: "rest1", name: "休憩をとる", icon: "🪑", time: 20, cost: 0, tired: -2, cat: "rest" },
  { id: "free1", name: "自由時間・おみやげ", icon: "🎁", time: 60, cost: 10, tired: 1, cat: "free" },
  { id: "hotel_in", name: "旅館にチェックインする", icon: "🏮", time: 20, cost: 0, tired: -1, cat: "hotel" },
  { id: "bus2", name: "バスで学校へもどる準備", icon: "🚌", time: 20, cost: 5, tired: 1, cat: "move" },
  { id: "shinkansen_back", name: "新幹線で東京へ帰る", icon: "🚄", time: 150, cost: 40, tired: 2, cat: "move" },
];

export interface DaySpec { id: string; label: string; window: number; note: string }
export const DAYS: DaySpec[] = [
  { id: "d1", label: "1日目", window: 600, note: "8:00 学校を出発 → 18:00までに宿へ" },
  { id: "d2", label: "2日目", window: 660, note: "8:00〜19:00 京都・奈良をまわる" },
  { id: "d3", label: "3日目", window: 480, note: "8:00 宿を出発 → 16:00までに学校へ" },
];

// 2026-09-13 logic audit fix: see file header. Was 220 (unreachable), now 150.
export const BUDGET = 150;

export type DayPlacements = Record<string, string[]>; // dayId -> ordered card ids

export function emptyDays(): DayPlacements {
  return { d1: [], d2: [], d3: [] };
}

export function usedCardIds(days: DayPlacements): Set<string> {
  return new Set(Object.values(days).flat());
}

export function dayCards(dayId: string, days: DayPlacements, cards: Card[] = CARDS): Card[] {
  return (days[dayId] ?? []).map((cid) => cards.find((c) => c.id === cid)!);
}

export interface DayStats {
  time: number;
  hasHotel: boolean;
  hasReturn: boolean;
  hasRestOrMeal: boolean;
}

export function dayStats(dayId: string, days: DayPlacements, cards: Card[] = CARDS): DayStats {
  const list = dayCards(dayId, days, cards);
  return {
    time: list.reduce((a, c) => a + c.time, 0),
    hasHotel: list.some((c) => c.cat === "hotel"),
    hasReturn: list.some((c) => c.id === "shinkansen_back"),
    hasRestOrMeal: list.some((c) => c.cat === "meal" || c.cat === "rest"),
  };
}

export interface Totals { learnTotal: number; costTotal: number; tiredTotal: number }

export function totals(days: DayPlacements, cards: Card[] = CARDS): Totals {
  const used = usedCardIds(days);
  const usedCards = cards.filter((c) => used.has(c.id));
  return {
    learnTotal: usedCards.filter((c) => c.learn).length,
    costTotal: usedCards.reduce((a, c) => a + c.cost, 0),
    tiredTotal: usedCards.reduce((a, c) => a + c.tired, 0),
  };
}

/** Exactly the rules the UI displays as `issues`. */
export function computeIssues(days: DayPlacements, cards: Card[] = CARDS, days_: DaySpec[] = DAYS): string[] {
  const issues: string[] = [];
  days_.forEach((d) => {
    const s = dayStats(d.id, days, cards);
    if (s.time > d.window) issues.push(`${d.label}の予定が詰め込みすぎ。乗換や移動の時間が足りないかも。`);
  });
  const { learnTotal, costTotal } = totals(days, cards);
  if (learnTotal < 2) issues.push("学びになる見学・体験が、まだ少ないかも。もう1つ増やしてみよう。");
  if (!dayStats("d1", days, cards).hasHotel) issues.push("1日目のうちに、宿に着けるようにしよう。");
  if (!dayStats("d2", days, cards).hasRestOrMeal) issues.push("2日目に休憩や昼食がないと、100人が動きにくいよ。");
  if (!dayStats("d3", days, cards).hasReturn) issues.push("3日目、学校へ帰る新幹線を入れよう。");
  if (costTotal > BUDGET) issues.push(`予算オーバー（${costTotal} / ${BUDGET}）。安く済む予定に変えてみよう。`);
  return issues;
}

export function enoughPlaced(days: DayPlacements): boolean {
  return usedCardIds(days).size >= 8;
}

export function isSuccess(days: DayPlacements, cards: Card[] = CARDS, days_: DaySpec[] = DAYS): boolean {
  return computeIssues(days, cards, days_).length === 0 && enoughPlaced(days);
}

export function computeTags(days: DayPlacements, cards: Card[] = CARDS): string[] {
  const { learnTotal, costTotal, tiredTotal } = totals(days, cards);
  const tags: string[] = [];
  if (learnTotal >= 3) tags.push("学びが多い旅程");
  if (costTotal <= 135) tags.push("費用をおさえた旅程");
  if (tiredTotal <= 10) tags.push("ゆとりのある旅程");
  if (tags.length === 0) tags.push("バランスの取れた旅程");
  return tags;
}
