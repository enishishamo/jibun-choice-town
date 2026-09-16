// Pure rules for the event-venue-layout Q1 (gameType: venue_layout).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass, which found and fixed a real bug -- see below): this file
// replaces the grid/placement rules that used to live only inline inside
// VenueLayoutGame.tsx, so factory/harness/gameplay-qa-venue-layout.mjs can
// drive the evaluation logic directly with Node.
//
// BUGFIX 2026-09-13 (carried over from the component, now covered by an
// executable regression test instead of just a comment): `pathClear` used
// to only check [food, goods] against the entrance cell, so placing "rest"
// (or "stage") directly in front of the entrance was never flagged even
// though it visually blocked the "🚶入口" — it now checks every placed
// item. This module is a REFACTOR of the existing (already-fixed) logic
// only; it does not change the entrance rule, the "見やすさ／通りやすさ"
// mechanic, or anything else this game's ESCALATED status is about.
export interface Cell {
  id: string;
  row: number;
  col: number;
}

// 3x3 grid. row0 = 奥（ステージ向き）, row2 = 手前（入口側）
export const CELLS: Cell[] = [
  { id: "c0", row: 0, col: 0 }, { id: "c1", row: 0, col: 1 }, { id: "c2", row: 0, col: 2 },
  { id: "c3", row: 1, col: 0 }, { id: "c4", row: 1, col: 1 }, { id: "c5", row: 1, col: 2 },
  { id: "c6", row: 2, col: 0 }, { id: "c7", row: 2, col: 1 }, { id: "c8", row: 2, col: 2 },
];
export const ENTRANCE_COL = 1; // 入口は手前の中央

export type ItemId = "stage" | "food" | "goods" | "rest";
export const ITEM_IDS: ItemId[] = ["stage", "food", "goods", "rest"];

/** cellId -> itemId. Mirrors the component's `placed` state exactly. */
export type Placement = Record<string, ItemId>;

export function cellById(id?: string): Cell | undefined {
  return CELLS.find((c) => c.id === id);
}

export function cellOfItem(placed: Placement, itemId: ItemId): Cell | undefined {
  const cellId = Object.entries(placed).find(([, i]) => i === itemId)?.[0];
  return cellById(cellId);
}

export function allPlaced(placed: Placement, itemIds: ItemId[] = ITEM_IDS): boolean {
  return itemIds.every((id) => !!cellOfItem(placed, id));
}

export interface Evaluation {
  stageVisible: boolean;
  pathClear: boolean;
  restQuiet: boolean;
  issues: string[];
  ok: boolean;
}

export function evaluate(placed: Placement): Evaluation {
  const stage = cellOfItem(placed, "stage");
  const food = cellOfItem(placed, "food");
  const goods = cellOfItem(placed, "goods");
  const rest = cellOfItem(placed, "rest");

  const stageVisible = !!stage && stage.row === 0; // 奥に置くと客席から見える
  // BUGFIX 2026-09-13: check every placed item against the entrance cell,
  // not just [food, goods] -- see file header.
  const pathClear = ![stage, food, goods, rest].some((c) => c && c.row === 2 && c.col === ENTRANCE_COL);
  const restQuiet = !!rest && !(rest.row === 0); // ステージ真横だとうるさい

  const issues: string[] = [];
  if (!stageVisible) issues.push("ステージが手前にあって、うしろの人から見えにくい…");
  if (!pathClear) issues.push("入口の正面に物があって、入ってきた人がすぐ止まってしまう…");
  if (!restQuiet) issues.push("休けいスペースがステージのすぐ横。ゆっくり休めない…");

  return { stageVisible, pathClear, restQuiet, issues, ok: allPlaced(placed) && issues.length === 0 };
}
