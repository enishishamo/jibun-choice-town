// Pure rules for the business-loan-screening (日本政策金融公庫) Q1
// (gameType: loan_screen). No React here, same pattern as
// sourcingLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-loan-screen.mjs can drive the exact
// mark-validation gates (passbook must be fully read before marking
// savings; both plan+quote must be opened before marking the amount
// mismatch) and the toInterview()/decide() rules Node-side. Refactor-only
// — behavior unchanged from the inline version in LoanScreenGame.tsx.

export type CheckId = "savings" | "amount" | "sales";
export type Mark = "ok" | "ask";
export type DocId = "plan" | "passbook" | "quote";

export const CHECKS: { id: CheckId; label: string }[] = [
  { id: "savings", label: "自己資金の貯まり方" },
  { id: "amount", label: "計画書の金額と見積書" },
  { id: "sales", label: "売上の根拠" },
];

export const PASSBOOK_PAGES: string[][] = [
  ["3年前〜", "毎月 +3万円", "+3万 +3万 +3万 …", "残高 12万 → 36万"],
  ["2年前〜", "毎月 +3万円", "+3万 +3万 +3万 …", "残高 36万 → 72万"],
  ["1年前〜", "毎月 +3万円", "ボーナス月 +5万", "残高 72万 → 114万"],
  ["今年", "毎月 +3万円", "先月まで続く", "残高 150万円"],
];

export const PROFIT = 9; // 万円/月（計画書v2の月の利益）
export function repay(amount: number): number {
  return Math.round((amount / 84) * 10) / 10; // 7年返済のめやす
}

export function passbookRead(maxPage: number): boolean {
  return maxPage >= PASSBOOK_PAGES.length - 1;
}

export function allMarked(marks: Partial<Record<CheckId, Mark>>): boolean {
  return CHECKS.every((c) => !!marks[c.id]);
}

export type MarkRejectReason = "savings_needs_full_passbook" | "amount_needs_both_docs_seen" | null;

/** Mirrors mark(): whether the given check may currently be marked at all,
 * and why not if it can't. */
export function canMark(id: CheckId, maxPage: number, seenDocs: DocId[]): MarkRejectReason {
  if (id === "savings" && !passbookRead(maxPage)) return "savings_needs_full_passbook";
  if (id === "amount" && !(seenDocs.includes("plan") && seenDocs.includes("quote"))) return "amount_needs_both_docs_seen";
  return null;
}

export type InterviewGateResult = "not_all_marked" | "amount_marked_ok" | "savings_or_sales_marked_ask" | "ready";

/** Mirrors toInterview() exactly: every check must be marked, "amount"
 * must be flagged "ask" (there IS a discrepancy to raise), and
 * "savings"/"sales" must both be "ok" (they're fully resolvable from the
 * documents alone, not genuine interview questions). */
export function evaluateInterviewGate(marks: Partial<Record<CheckId, Mark>>): InterviewGateResult {
  if (!allMarked(marks)) return "not_all_marked";
  if (marks.amount === "ok") return "amount_marked_ok";
  if (marks.savings === "ask" || marks.sales === "ask") return "savings_or_sales_marked_ask";
  return "ready";
}

/** The single mark combination that passes evaluateInterviewGate. */
export const CORRECT_MARKS: Record<CheckId, Mark> = { savings: "ok", amount: "ask", sales: "ok" };

export function canReachInterview(marks: Partial<Record<CheckId, Mark>>): boolean {
  return evaluateInterviewGate(marks) === "ready";
}

/** Mirrors decide(): only 250 or 280 approve the loan (both are valid,
 * qualitatively different outcomes); null ("見送る") never approves. */
export function isApproval(amount: number | null): amount is 250 | 280 {
  return amount === 250 || amount === 280;
}
