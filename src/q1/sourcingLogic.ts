// Q1: 食品メーカーの「調達」 (gameType: sourcing_mix) — pure logic module.
//
// 2026-09-13 (UX/Logic audit — item ⑤/⑥-A of the full-Q1 audit request):
// this file replaces numbers/rules that used to live only inline inside
// SourcingGame.tsx. The audit found a genuine BUG in the old numbers: the
// cheapest combination that still met the (hard) deadline requirement cost
// ¥99,000 (A60kg@¥900 + C60kg@¥750), while the displayed budget target was
// ¥96,000 — i.e. the UI declared a target with ZERO simultaneously-valid
// solutions once you also respected the deadline. On top of that, B社 could
// NEVER be used at all (any B purchase instantly failed the "0 late kg"
// rule), making it a pure trap with no legitimate role — exactly the
// "明らかにこの会社は使わない" failure mode the redesign brief calls out.
//
// Renumbered from scratch so that:
// - all three suppliers genuinely meet the deadline (no supplier is a
//   guaranteed-fail trap) — B社 is the cheapest AND arrives exactly ON the
//   deadline day (day 7), a real "ぎりぎり" trade-off, not an auto-fail;
// - no single supplier's cap can cover the whole order alone (forces
//   combining at least two, matching the "組み立てる" D);
// - multiple qualitatively different WINNING combinations exist (cheapest /
//   safer-but-pricier / spread-across-all-three) — see
//   factory/harness/gameplay-qa-sourcing.mjs for the enumerated proof.
export interface Supplier {
  id: "a" | "b" | "c";
  name: string;
  emoji: string;
  /** price for one 20kg box */
  pricePerBox: number;
  /** how many boxes this supplier can supply at all */
  maxBoxes: number;
  /** day (1 = today's order, counted from today) this supplier's boxes arrive */
  arrivalDay: number;
  /** flavor-only (per Human Decision: not a primary win/lose condition —
      surfaced only in the post-success "へえ" note, never gates success) */
  stable: boolean;
}

export const BOX_KG = 20;
export const NEED_BOXES = 6; // 6 * 20kg = 120kg
export const DEADLINE_DAY = 7; // "来週" — boxes must arrive on or before this day
export const BUDGET = 100_000; // 円, a soft "目安" — never a hard pass/fail gate

export const SUPPLIERS: Supplier[] = [
  { id: "a", name: "A社", emoji: "🚚", pricePerBox: 20_000, maxBoxes: 4, arrivalDay: 3, stable: true },
  { id: "b", name: "B社", emoji: "🛻", pricePerBox: 13_000, maxBoxes: 4, arrivalDay: 7, stable: false },
  { id: "c", name: "C社", emoji: "🚐", pricePerBox: 17_000, maxBoxes: 4, arrivalDay: 5, stable: true },
];

export type Order = Record<Supplier["id"], number>; // boxes bought per supplier

export function totalBoxes(order: Order): number {
  return SUPPLIERS.reduce((sum, s) => sum + (order[s.id] ?? 0), 0);
}

export function totalCost(order: Order): number {
  return SUPPLIERS.reduce((sum, s) => sum + (order[s.id] ?? 0) * s.pricePerBox, 0);
}

/** Boxes that will NOT be on the shelf by the deadline (their supplier's
 * arrivalDay is past DEADLINE_DAY). With the current numbers this is always
 * 0 (every supplier meets the deadline, by design — see file header), but
 * the check stays real/general rather than hardcoded, so re-tuning the
 * constants above can never silently desync the UI from the outcome. */
export function lateBoxes(order: Order): number {
  return SUPPLIERS.reduce((sum, s) => sum + (s.arrivalDay > DEADLINE_DAY ? (order[s.id] ?? 0) : 0), 0);
}

export function onTimeBoxes(order: Order): number {
  return totalBoxes(order) - lateBoxes(order);
}

/** Success = enough boxes, ALL of them on time. Budget is intentionally
 * NOT part of this — it's shown as a live "目安" meter (over/under), never
 * a pass/fail gate, so it can never combine with the other two into an
 * impossible-to-satisfy-simultaneously target (the original bug). */
export function isSuccess(order: Order): boolean {
  return totalBoxes(order) >= NEED_BOXES && lateBoxes(order) === 0;
}

/** true if the order leans on a single supplier for the WHOLE need — purely
 * flavor (surfaced only in the post-success "へえ" note per Human Decision,
 * never affects isSuccess). */
export function isSingleSupplierHeavy(order: Order): boolean {
  return SUPPLIERS.some((s) => (order[s.id] ?? 0) >= NEED_BOXES);
}

export function emptyOrder(): Order {
  return { a: 0, b: 0, c: 0 };
}
