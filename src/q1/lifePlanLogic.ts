// Pure rules for the hospital-discharge MSW Q1 (gameType: life_plan).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-life-plan.mjs can drive the exact
// win/lose rule Node-side instead of relying on a human having read the
// component once. Behavior is unchanged from the inline version in
// LifePlanGame.tsx -- this is a refactor-only extraction.

export interface Trouble {
  id: string;
  icon: string;
  label: string;
  say: string;
  /** これで手当てできる助け */
  helps: string[];
  /** 本人が「そこは自分でやりたい」と思っていること */
  keep?: string;
}

export const TROUBLES: Trouble[] = [
  { id: "shop", icon: "🛒", label: "買い物", say: "「重いものを持って帰れるかなあ」",
    helps: ["food", "hand"], keep: "近所のお店には、自分で行きたい" },
  { id: "meal", icon: "🍚", label: "ごはん", say: "「毎日ごはんを用意できるかな」", helps: ["food", "hand"] },
  { id: "bath", icon: "🛁", label: "お風呂", say: "「一人で入るのは、ちょっと不安だな」", helps: ["hand", "rail"] },
  { id: "med", icon: "💊", label: "薬", say: "「薬、忘れずに飲めるかな」", helps: ["health"] },
  { id: "hosp", icon: "🏥", label: "病院", say: "「次の診察の日、どうやって行こう」", helps: ["ride", "family"] },
  { id: "alone", icon: "👤", label: "一人の時間", say: "「急に具合が悪くなったら、だれに言えばいい？」", helps: ["call", "health"] },
];

export interface Help { id: string; icon: string; label: string; note: string }
export const HELPS: Help[] = [
  { id: "food", icon: "🍱", label: "ごはんを届けてくれる人", note: "あたたかいごはんを、家まで運んでくれる" },
  { id: "hand", icon: "🧹", label: "家に来て生活を手伝ってくれる人", note: "そうじや買い物、お風呂の手伝いをしてくれる" },
  { id: "health", icon: "🩺", label: "家で体調を見てくれる人", note: "家に来て、具合や薬のことを見てくれる" },
  { id: "walk", icon: "🚶", label: "家でも歩く練習を手伝ってくれる人", note: "家の中や近所で、安全に動く練習をしてくれる" },
  { id: "ride", icon: "🚐", label: "病院まで行くのを助ける方法", note: "送りむかえをしてもらえる" },
  { id: "family", icon: "👧", label: "娘さんにお願いできること", note: "遠くに住んでいて、来られるのは週に1回くらい" },
  { id: "call", icon: "🔔", label: "困ったとき相談できる人", note: "何かあったとき、すぐ連絡できるようにする" },
  { id: "rail", icon: "🤝", label: "家に手すりをつける", note: "つかまる場所があると、自分で動きやすい" },
];

export const WISHES = [
  "できることは、自分でやりたい",
  "自分の家で暮らしたい",
  "また近所を散歩したい",
];

export function covered(t: Trouble, picked: string[]): boolean {
  return t.helps.some((h) => picked.includes(h));
}

export function allCovered(picked: string[]): boolean {
  return TROUBLES.every((t) => covered(t, picked));
}

/** 「全部やってもらう」＝本人がやりたいことまで代わりにしてしまう組み方 */
export function isTooMuch(picked: string[]): boolean {
  return picked.includes("food") && picked.includes("hand") && picked.length >= 5;
}

export function isFamilyOnly(picked: string[]): boolean {
  return picked.length > 0 && picked.every((p) => p === "family");
}

/** Success = every trouble covered, without leaning only on the daughter,
 * and without doing everything for the person (keeping their own "自分
 * でやりたい" wishes intact). */
export function isSuccess(picked: string[]): boolean {
  return allCovered(picked) && !isTooMuch(picked) && !isFamilyOnly(picked);
}
