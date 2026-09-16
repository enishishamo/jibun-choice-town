// Pure rules for the food-manufacturer recipe-rebalancing Q1
// (gameType: recipe_balance, RecipeGame.tsx).
// No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the earlier logic/UX
// audit pass): this file did not exist before -- RecipeGame.tsx
// redeclared ING/START/TARGET_COST/MIN and the cost/taste calculation
// inline. No behavior bug was found in the audit; this is a refactor-only
// extraction so the "cost down, taste held" success condition -- and the
// design's own claim that multiple different winning recipes exist -- can
// be asserted by factory/harness/gameplay-qa-recipe.mjs.
export interface Ing {
  id: string;
  name: string;
  emoji: string;
  yen: number; // 1あたりのコスト
  smooth: number;
  sweet: number;
  milk: number;
  berry: number;
  max: number;
}

// 「いつもの配合」= 基準。ここから動かして試す。
export const ING: Ing[] = [
  { id: "milk", name: "乳原料", emoji: "🥛", yen: 8, smooth: 3, sweet: 0, milk: 5, berry: 0, max: 12 },
  { id: "sugar", name: "糖類", emoji: "🧊", yen: 3, smooth: 1, sweet: 5, milk: 0, berry: 0, max: 12 },
  { id: "berry", name: "いちご原料", emoji: "🍓", yen: 12, smooth: 0, sweet: 2, milk: 0, berry: 6, max: 12 },
  { id: "water", name: "水分", emoji: "💧", yen: 1, smooth: -2, sweet: -2, milk: -2, berry: -2, max: 12 },
  { id: "other", name: "その他原料", emoji: "🌿", yen: 4, smooth: 4, sweet: 0, milk: 1, berry: 0, max: 12 },
];

export const START: Record<string, number> = { milk: 7, sugar: 5, berry: 5, water: 3, other: 2 };

export const TARGET_COST = 150; // 円以下にしたい
export const MIN = { smooth: 20, sweet: 18, milk: 24, berry: 20 }; // 守りたいおいしさ

export interface Calc {
  cost: number;
  smooth: number;
  sweet: number;
  milk: number;
  berry: number;
}

export function calc(a: Record<string, number>): Calc {
  const sum = (k: keyof Ing) => ING.reduce((t, i) => t + (a[i.id] ?? 0) * (i[k] as number), 0);
  return {
    cost: Math.round(sum("yen") + 40), // 40 = その他の固定費
    smooth: Math.max(0, sum("smooth")),
    sweet: Math.max(0, sum("sweet")),
    milk: Math.max(0, sum("milk")),
    berry: Math.max(0, sum("berry")),
  };
}

export function isTasteOk(c: Calc): boolean {
  return c.smooth >= MIN.smooth && c.sweet >= MIN.sweet && c.milk >= MIN.milk && c.berry >= MIN.berry;
}

export function isCostOk(c: Calc): boolean {
  return c.cost <= TARGET_COST;
}

/** Success = cost at/under target AND every taste axis holds at/above its floor. */
export function isSuccess(a: Record<string, number>): boolean {
  const c = calc(a);
  return isCostOk(c) && isTasteOk(c);
}
