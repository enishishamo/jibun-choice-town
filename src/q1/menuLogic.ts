// Pure rules for the school-lunch menu-adjustment Q1 (gameType: drag_and_drop, MenuGame.tsx).
// No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the earlier logic/UX
// audit pass): this file did not exist before -- MenuGame.tsx redeclared
// ORIGINAL/CANDIDATES and the "acceptable" win check inline, so nothing
// could import and exercise the win condition outside the component. No
// behavior bug was found in the audit; this is a refactor-only extraction
// so the win condition can be asserted by factory/harness/gameplay-qa-menu.mjs.
export interface SideDish {
  id: string;
  name: string;
  emoji: string;
  nutri: number;
  budget: number;
  supply: number;
  cook: number;
}

export const ORIGINAL: SideDish = {
  id: "hourensou",
  name: "ほうれん草のごまあえ",
  emoji: "🥬",
  nutri: 3,
  budget: 2,
  supply: 0, // 長雨で調達できない
  cook: 3,
};

export const CANDIDATES: SideDish[] = [
  { id: "betsusanchi", name: "ほうれん草（別の産地）", emoji: "🥬", nutri: 3, budget: 1, supply: 2, cook: 3 },
  { id: "komatsuna", name: "小松菜のごまあえ", emoji: "🥗", nutri: 3, budget: 3, supply: 3, cook: 3 },
  { id: "cabbage", name: "キャベツのおかかあえ", emoji: "🥦", nutri: 2, budget: 3, supply: 3, cook: 2 },
  { id: "potato", name: "フライドポテト", emoji: "🍟", nutri: 0, budget: 3, supply: 3, cook: 3 },
];

export const ALL: SideDish[] = [ORIGINAL, ...CANDIDATES];

/** Success = the swapped-in side dish can actually be supplied AND still
 * meets the nutrition floor. Displayed as the "確認する" gate in the UI
 * (the button's two rejection messages map 1:1 to these two clauses). */
export function isAcceptableSide(side: SideDish): boolean {
  return side.supply >= 1 && side.nutri >= 1;
}
