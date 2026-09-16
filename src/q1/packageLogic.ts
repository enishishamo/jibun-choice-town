// Pure rules for the ice-cream packaging-design Q1 (gameType: package_design,
// PackageGame.tsx). No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the earlier logic/UX
// audit pass): this file did not exist before -- PackageGame.tsx
// redeclared MATERIALS/SHAPES/SIZES/COST_TARGET and the stat/pass
// calculation inline. No behavior bug was found in that audit; this is a
// refactor-only extraction so the material x shape x size combinatorics
// (frozen/carry/label/cost, each individually gate-able) can be asserted
// by factory/harness/gameplay-qa-package.mjs.
export interface Material {
  id: string;
  name: string;
  emoji: string;
  cost: number; // 1個あたり円
  frozen: number; // 冷凍への強さ 0-3
  strength: number; // つぶれにくさ 0-3
  desc: string;
}
export const MATERIALS: Material[] = [
  { id: "paper", name: "紙", emoji: "📄", cost: 6, frozen: 1, strength: 1, desc: "軽くて安い。ただし冷凍庫の水分でふやけやすい。" },
  { id: "plastic", name: "プラスチック", emoji: "🧴", cost: 9, frozen: 3, strength: 2, desc: "冷凍に強く、水をとおさない。使う材料はやや多め。" },
  { id: "alumi", name: "アルミ", emoji: "🥈", cost: 13, frozen: 3, strength: 3, desc: "とても丈夫で冷凍にも強い。そのぶんコストが高い。" },
  { id: "bio", name: "バイオ素材", emoji: "🌱", cost: 12, frozen: 2, strength: 2, desc: "植物からつくる素材。環境にやさしいが、まだコストは高め。" },
];

export interface Shape {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  strength: number;
  open: number; // あけやすさ 0-3
  desc: string;
}
export const SHAPES: Shape[] = [
  { id: "cup", name: "カップ", emoji: "🥣", cost: 3, strength: 2, open: 3, desc: "そのまま食べやすい。少し場所をとる。" },
  { id: "bag", name: "ふくろ", emoji: "🍬", cost: 0, strength: 0, open: 2, desc: "材料が少なくてすむ。つぶれには弱い。" },
  { id: "box", name: "はこ", emoji: "📦", cost: 5, strength: 3, open: 1, desc: "しっかり守れる。材料を多く使う。" },
];

export interface Size {
  id: string;
  name: string;
  costMul: number;
  label: number; // 表示スペース 0-3
  desc: string;
}
export const SIZES: Size[] = [
  { id: "s", name: "小さめ", costMul: 0.8, label: 1, desc: "材料が少なくてすむ。書ける表示のスペースが少ない。" },
  { id: "m", name: "ふつう", costMul: 1, label: 3, desc: "必要な表示がぜんぶ書ける。" },
  { id: "l", name: "大きめ", costMul: 1.3, label: 3, desc: "余裕があるが、材料もコストも増える。" },
];

export const COST_TARGET = 14; // 円/個 以下にしたい
export const MIN_FROZEN = 2;
export const MIN_CARRY = 2;
export const MIN_LABEL = 2;

export interface Combo {
  mat: Material;
  shape: Shape;
  size: Size;
}

export function cost(c: Combo): number {
  return Math.round((c.mat.cost + c.shape.cost) * c.size.costMul);
}

export function frozen(c: Pick<Combo, "mat">): number {
  return c.mat.frozen;
}

/** "carry" (つぶれにくさ) depends only on material + shape, not size --
 * matches the UI's own carryPreview, which is shown before size is picked. */
export function carry(c: Pick<Combo, "mat" | "shape">): number {
  return Math.min(3, c.mat.strength + c.shape.strength - 1);
}

export function openness(c: Pick<Combo, "shape">): number {
  return c.shape.open;
}

export function label(c: Pick<Combo, "size">): number {
  return c.size.label;
}

/** Success = frozen/carry/label each clear their floor AND cost is at/under target. */
export function isPass(c: Combo): boolean {
  return frozen(c) >= MIN_FROZEN && carry(c) >= MIN_CARRY && label(c) >= MIN_LABEL && cost(c) <= COST_TARGET;
}
