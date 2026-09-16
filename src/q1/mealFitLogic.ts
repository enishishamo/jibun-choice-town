// Pure rules for the registered-dietitian Q1 (gameType: meal_fit).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass): this file replaces the portion/eat-rate model that used to
// live only inline inside MealFitGame.tsx, so factory/harness/gameplay-qa-
// meal-fit.mjs can drive it directly with Node. Refactor only -- the model
// (serving too much still counts as a fail even if the raw eaten-kcal
// number clears the bar) is unchanged.
//
// ※数値はプロトタイプ用の簡略モデル。
export const NEED = 1400; // 1日に届けたいエネルギーの目安（kcal）
export const EAT_TARGET_RATIO = 0.8; // 「合格」に必要な割合
export const WASTE_RATIO = 1.5; // これを超えて出すと「出しすぎ」

export type Portion = "full" | "half" | "small";
export type Times = 3 | 5;
export type Form = "normal" | "soft" | "drink";

export const PORTION: Record<Portion, { label: string; perMeal: number; eatRate: number }> = {
  full: { label: "ふつう量", perMeal: 500, eatRate: 0.3 },
  half: { label: "半分くらい", perMeal: 300, eatRate: 0.75 },
  small: { label: "少なめ", perMeal: 200, eatRate: 0.95 },
};

export const FORM: Record<Form, { label: string; bonus: number; note: string }> = {
  normal: { label: "ふつうの食事", bonus: 0, note: "かむ力はある。でも今はしんどい" },
  soft: { label: "やわらかめ", bonus: 0.1, note: "のどを通りやすい" },
  drink: { label: "飲みもので補う", bonus: 0.15, note: "栄養のある飲みものを足す" },
};

export interface MealResult {
  served: number;
  eaten: number;
  wasted: boolean;
  ok: boolean;
}

/** 「たくさん出して残す」では合格にしない：食べられた量 かつ 出しすぎでないこと。 */
export function evaluateMeal(portion: Portion, times: Times, form: Form): MealResult {
  const p = PORTION[portion];
  const served = p.perMeal * times;
  const rate = Math.min(1, p.eatRate + FORM[form].bonus);
  const eaten = Math.round(served * rate);
  const wasted = served > NEED * WASTE_RATIO;
  const ok = eaten >= NEED * EAT_TARGET_RATIO && !wasted;
  return { served, eaten, wasted, ok };
}
