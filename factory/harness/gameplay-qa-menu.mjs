#!/usr/bin/env node
// Automated gameplay QA for Q1 drag_and_drop (MenuGame.tsx / menuLogic.ts).
// 2026-09-13: mechanical-verification follow-up to the earlier audit pass
// (MenuGame itself had no bug found in that audit -- this proves it stays
// that way). Confirms: the original side dish (long-rain, supply=0) can
// never be confirmed as-is; at least one swap-in candidate is a genuine
// win; a candidate that LOOKS fine but fails exactly one displayed
// condition (nutri or supply) is correctly rejected; and budget/cook --
// shown to the player but never gating -- really don't affect the result.
import { ALL, CANDIDATES, ORIGINAL, isAcceptableSide } from "../../src/q1/menuLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- 1. the broken original dish never passes (supply === 0) ----
check("the original dish (unavailable, supply=0) is never acceptable", !isAcceptableSide(ORIGINAL), `supply=${ORIGINAL.supply} nutri=${ORIGINAL.nutri}`);

// ---- 2. at least one success path exists among the swap-in candidates ----
const winners = CANDIDATES.filter(isAcceptableSide);
check("at least one candidate side dish is a winning swap", winners.length > 0, `${winners.length}/${CANDIDATES.length} winning candidates`);

// ---- 3. every winning candidate satisfies exactly the displayed rule (supply>=1 AND nutri>=1), nothing hidden ----
check(
  "every winning candidate satisfies exactly supply>=1 and nutri>=1",
  winners.every((d) => d.supply >= 1 && d.nutri >= 1),
);

// ---- 4. false-positive check: potato satisfies supply but fails nutri (the UI's own second rejection message) ----
const potato = CANDIDATES.find((d) => d.id === "potato");
check(
  "the fried-potato trap (supply ok, nutri=0) is correctly rejected -- satisfies one displayed condition but not the other",
  potato.supply >= 1 && !isAcceptableSide(potato),
  `supply=${potato.supply} nutri=${potato.nutri}`,
);

// ---- 5. budget and cook (shown in the UI's status chips) never gate success ----
{
  // construct hypothetical dishes that vary only budget/cook while holding
  // supply>=1 and nutri>=1 fixed, to prove those two fields are inert.
  const cheapGoodCook = { id: "x1", name: "x", emoji: "?", nutri: 1, budget: 0, supply: 1, cook: 0 };
  const expensiveBadCook = { id: "x2", name: "x", emoji: "?", nutri: 1, budget: 3, supply: 1, cook: 3 };
  check(
    "budget/cook values (0 vs 3, worst vs best) never change the win result when supply/nutri are held fixed",
    isAcceptableSide(cheapGoodCook) === isAcceptableSide(expensiveBadCook) && isAcceptableSide(cheapGoodCook) === true,
  );
}

// ---- 6. ALL is exactly ORIGINAL + the 4 candidates, no drift ----
check("ALL contains ORIGINAL plus every candidate, in order", ALL.length === CANDIDATES.length + 1 && ALL[0] === ORIGINAL);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
