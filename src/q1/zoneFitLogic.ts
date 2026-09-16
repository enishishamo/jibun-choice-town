// Pure rules for the shop-interior-design (店舗デザイナー) Q1 (gameType:
// zone_and_fit). No React here, same pattern as sourcingLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-zone-and-fit.mjs can drive the floor-
// grid placement constraints (plumbing-wall-only, toilet-adjacency,
// faucet-before-placement, budget cap) and the final kijun/eigyo check
// Node-side over a plain grid data structure. Refactor-only — behavior
// unchanged from the inline version in ZoneFitGame.tsx.

export const COLS = 6;
export const ROWS = 5;

export type PartId = "kitchen" | "door" | "wash" | "washT" | "backyard" | "table" | "counter";
export type Faucet = "handle" | "lever" | "sensor";

export const PARTS: { id: PartId; emoji: string; name: string; multi?: boolean }[] = [
  { id: "kitchen", emoji: "🍳", name: "厨房セット" },
  { id: "door", emoji: "🚪", name: "区画ドア" },
  { id: "wash", emoji: "🚰", name: "手洗い設備" },
  { id: "washT", emoji: "🧼", name: "トイレ用手洗い" },
  { id: "backyard", emoji: "🗄", name: "ゴミ箱＋食器棚" },
  { id: "table", emoji: "🪑", name: "テーブル席(2席)", multi: true },
  { id: "counter", emoji: "🍜", name: "カウンター席(2席)", multi: true },
];

export const FAUCETS: { id: Faucet; name: string; cost: number }[] = [
  { id: "handle", name: "ハンドル式（安い）", cost: 2 },
  { id: "lever", name: "レバー式", cost: 10 },
  { id: "sensor", name: "センサー式（高い）", cost: 25 },
];

// fixed features on the as-is floor (現況図)
export const PILLAR = 15; // (3,2)
export const TOILET = 29; // (5,4)
export const SINK = 0; // 居抜きの2槽シンク (0,0) — 使える
export const FIXED: Record<number, string> = { [PILLAR]: "🧱", [TOILET]: "🚻", [SINK]: "💧" };
export const BASE_COST = 230; // 万円: 区画・設備の基本工事

export function col(i: number): number {
  return i % COLS;
}
export function neighbors(i: number): number[] {
  return [i - COLS, i + COLS, col(i) > 0 ? i - 1 : -1, col(i) < COLS - 1 ? i + 1 : -1].filter(
    (n) => n >= 0 && n < COLS * ROWS,
  );
}

export type Cells = Partial<Record<number, PartId>>;

export function placedOf(cells: Cells, p: PartId): number[] {
  return Object.entries(cells).filter(([, v]) => v === p).map(([k]) => Number(k));
}

export function seatsFor(cells: Cells): number {
  return (placedOf(cells, "table").length + placedOf(cells, "counter").length) * 2;
}

export function costFor(cells: Cells, faucet: Faucet | null): number {
  return BASE_COST + (placedOf(cells, "wash").length && faucet ? FAUCETS.find((f) => f.id === faucet)!.cost : 0);
}

export type PlaceRejectReason =
  | "fixed_sink" // informational: sink is usable, not a real rejection, but place() bounces (no part gets placed)
  | "fixed_toilet"
  | "fixed_pillar"
  | "no_selection"
  | "plumbing_wall_only"
  | "toilet_adjacency_required"
  | "faucet_type_required"
  | "single_only"
  | "over_budget";

/** Mirrors place() exactly (the validation half — NOT the actual
 * cell-toggle/removal side effects, which stay in the component). Returns
 * null if placement at cell `i` with the current selection/faucet/loan
 * would be allowed. */
export function canPlace(
  selected: PartId | null,
  i: number,
  cells: Cells,
  faucet: Faucet | null,
  loan: number,
): PlaceRejectReason | null {
  if (FIXED[i]) {
    if (i === SINK) return "fixed_sink";
    if (i === TOILET) return "fixed_toilet";
    return "fixed_pillar";
  }
  if (cells[i]) return null; // tapping an occupied cell removes it -- always allowed
  if (!selected) return "no_selection";
  if ((selected === "kitchen" || selected === "wash") && col(i) > 1) return "plumbing_wall_only";
  if (selected === "washT" && !neighbors(TOILET).includes(i)) return "toilet_adjacency_required";
  if (selected === "wash" && !faucet) return "faucet_type_required";
  if (!PARTS.find((p) => p.id === selected)!.multi && placedOf(cells, selected).length > 0) return "single_only";
  if (selected === "wash" && faucet === "sensor" && BASE_COST + 25 > loan) return "over_budget";
  return null;
}

export interface Issues { kijun: string[]; eigyo: string[] }

/** Mirrors runCheck() exactly. */
export function computeIssues(cells: Cells, faucet: Faucet | null, loan: number): Issues {
  const kijun: string[] = [];
  const eigyo: string[] = [];
  const kitchen = placedOf(cells, "kitchen");
  const doors = placedOf(cells, "door");
  const seats = seatsFor(cells);
  const cost = costFor(cells, faucet);

  if (!kitchen.length) eigyo.push("料理をつくる厨房が、まだない。");
  if (kitchen.length && !doors.length) kijun.push("厨房と客席のあいだに、区画がない。");
  if (!placedOf(cells, "wash").length) kijun.push("従業員用の手洗い設備がない。");
  if (placedOf(cells, "wash").length && faucet === "handle")
    kijun.push("手洗いの水栓が、手でさわらずに止められる構造になっていない。");
  if (!placedOf(cells, "washT").length) kijun.push("トイレに専用の手洗いがない。");
  if (!placedOf(cells, "backyard").length) kijun.push("フタ付きゴミ箱と、扉付き食器棚の置き場がない。");
  if (seats < 8) eigyo.push(`この席数（${seats}席）だと、融資のときの売上計画にとどかない。`);
  if (doors.length && !neighbors(doors[0]).some((n) => !cells[n] && !FIXED[n]))
    eigyo.push("区画ドアのまわりがふさがっていて、料理を運ぶ通路がない。");
  if (kitchen.length && !neighbors(kitchen[0]).some((n) => !cells[n] && !FIXED[n]))
    eigyo.push("厨房のまわりに余白がなくて、調理がまわらない。");
  if (cost > loan) eigyo.push(`工事の見込みが${cost}万円。承認された${loan}万円をこえている。`);

  return { kijun, eigyo };
}

export function isSuccess(cells: Cells, faucet: Faucet | null, loan: number): boolean {
  const { kijun, eigyo } = computeIssues(cells, faucet, loan);
  return kijun.length === 0 && eigyo.length === 0;
}
