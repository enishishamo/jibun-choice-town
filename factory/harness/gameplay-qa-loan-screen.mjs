#!/usr/bin/env node
// Automated gameplay QA for Q1 loan_screen (LoanScreenGame.tsx /
// loanScreenLogic.ts). 2026-09-13 (mechanical-verification follow-up to
// the manual UX/logic audit): drives the exact mark-validation gates
// (passbook must be fully read; both plan+quote must be opened before
// marking the amount discrepancy) and the interview-gate/decide() rules
// Node-side.

import { CHECKS, PASSBOOK_PAGES, PROFIT, repay, passbookRead, allMarked, canMark, evaluateInterviewGate, canReachInterview, CORRECT_MARKS, isApproval } from "../../src/q1/loanScreenLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- 1. a concrete winning sequence: read the full passbook, open both --
// plan+quote, mark CORRECT_MARKS, reach the interview, and approve either
// 250 or 280.
{
  const maxPage = PASSBOOK_PAGES.length - 1; // fully read
  const seenDocs = ["plan", "quote"];
  check("passbook fully read at maxPage = last page", passbookRead(maxPage));
  check("savings can be marked once passbook is fully read", canMark("savings", maxPage, seenDocs) === null);
  check("amount can be marked once both plan and quote are seen", canMark("amount", maxPage, seenDocs) === null);
  check("sales can always be marked (no precondition)", canMark("sales", maxPage, seenDocs) === null);

  check("allMarked is true once all 3 CHECKS carry a mark", allMarked(CORRECT_MARKS));
  check("CORRECT_MARKS reaches the interview gate (evaluateInterviewGate === ready)", evaluateInterviewGate(CORRECT_MARKS) === "ready");
  check("canReachInterview(CORRECT_MARKS) is true", canReachInterview(CORRECT_MARKS));

  check("approving 250 is a valid win", isApproval(250));
  check("approving 280 is a valid win (the OTHER qualitatively different solution)", isApproval(280));
}

// ---- 2. no false-positive success: satisfy every condition except ONE ----
{
  const maxPage = PASSBOOK_PAGES.length - 1;
  const seenDocs = ["plan", "quote"];

  // (a) amount marked "ok" instead of "ask" -- the discrepancy must be raised
  const wrongAmount = { ...CORRECT_MARKS, amount: "ok" };
  check('marking amount="ok" (missing the discrepancy) fails the interview gate', evaluateInterviewGate(wrongAmount) !== "ready", evaluateInterviewGate(wrongAmount));
  check('the specific rejection reason for amount="ok" is amount_marked_ok', evaluateInterviewGate(wrongAmount) === "amount_marked_ok");

  // (b) savings marked "ask" instead of "ok" -- it's fully resolvable from the passbook alone
  const wrongSavings = { ...CORRECT_MARKS, savings: "ask" };
  check('marking savings="ask" (should be resolvable from documents) fails the gate', evaluateInterviewGate(wrongSavings) !== "ready");
  check('the specific rejection reason for savings="ask" is savings_or_sales_marked_ask', evaluateInterviewGate(wrongSavings) === "savings_or_sales_marked_ask");

  // (c) sales marked "ask" instead of "ok"
  const wrongSales = { ...CORRECT_MARKS, sales: "ask" };
  check('marking sales="ask" fails the gate', evaluateInterviewGate(wrongSales) !== "ready");

  // (d) one check left unmarked entirely
  const missingOne = { savings: "ok", amount: "ask" }; // sales missing
  check("leaving one check unmarked fails allMarked / the gate", !allMarked(missingOne) && evaluateInterviewGate(missingOne) === "not_all_marked");

  // (e) savings marked before the passbook was fully read
  check("marking savings before finishing the passbook is rejected", canMark("savings", 1, seenDocs) === "savings_needs_full_passbook");
  check("marking savings at exactly the last page is allowed", canMark("savings", PASSBOOK_PAGES.length - 1, seenDocs) === null);

  // (f) amount marked before both plan and quote were opened
  check("marking amount having only opened the plan is rejected", canMark("amount", maxPage, ["plan"]) === "amount_needs_both_docs_seen");
  check("marking amount having only opened the quote is rejected", canMark("amount", maxPage, ["quote"]) === "amount_needs_both_docs_seen");
  check("marking amount having opened neither is rejected", canMark("amount", maxPage, []) === "amount_needs_both_docs_seen");

  // (g) declining the loan (見送る) is never an approval
  check("decide(null) ('見送る') is never a valid approval", !isApproval(null));
  check("decide(220) (not one of the two designed amounts) is not a valid approval", !isApproval(220));
  check("decide(310) is not a valid approval", !isApproval(310));
}

// ---- 3. repay() sanity: the repayment math the UI displays live ----------
{
  check("repay(280) < 280 (a sane monthly figure, not the raw principal)", repay(280) < 280);
  check("repay(250) < repay(280) (a smaller loan means a smaller monthly repayment)", repay(250) < repay(280));
  check(`repay(280) is approximately ${(280 / 84).toFixed(1)}`, Math.abs(repay(280) - Math.round((280 / 84) * 10) / 10) < 1e-9);
}

check("CHECKS has 3 entries", CHECKS.length === 3);
check("PASSBOOK_PAGES has 4 pages", PASSBOOK_PAGES.length === 4);
check("PROFIT is 9 (万円/月)", PROFIT === 9);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
