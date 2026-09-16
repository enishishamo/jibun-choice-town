#!/usr/bin/env node
// Automated gameplay QA for Q1 tenant_match (TenantMatchGame.tsx /
// tenantMatchLogic.ts). 2026-09-13 (mechanical-verification follow-up to
// the manual UX/logic audit): drives the exact drop-validation and
// win-check state machine Node-side.

import { GUESTS, SHOPS, STREET, CARDS, canDrop, evaluate, isSuccess } from "../../src/q1/tenantMatchLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- 1. at least one full winning combination exists (enumerate the ----
// full small search space: 3 shops x 3 guests-or-empty x 3 cards-or-null)
{
  const guestOptions = [null, "haru", "zakka", "bread"];
  let winners = 0;
  const examples = [];
  for (const a of guestOptions) for (const b of guestOptions) {
    if (a && b && a === b) continue; // same guest can't be in two shops
    for (const bCard of [null, "term", "rentup", "keep"]) {
      const assign = {};
      if (a) assign.A = a;
      if (b) assign.B = b;
      if (isSuccess(assign, bCard)) { winners++; if (examples.length < 4) examples.push({ ...assign, bCard }); }
    }
  }
  check("at least one winning combination exists in the full small search space", winners > 0, `${winners} winners, e.g. ${JSON.stringify(examples[0])}`);
  check("both qualitatively different A-tenants (zakka and bread) can win", examples.some((e) => e.A === "zakka") && examples.some((e) => e.A === "bread"), JSON.stringify(examples));
}

// ---- 2. concrete hand-built winning combos (both A-side tradeoffs) ------
{
  const zakkaWin = { A: "zakka", B: "haru" };
  const breadWin = { A: "bread", B: "haru" };
  for (const card of ["term", "rentup"]) {
    check(`haru@B + zakka@A + card="${card}" succeeds`, isSuccess(zakkaWin, card));
    check(`haru@B + bread@A + card="${card}" succeeds`, isSuccess(breadWin, card));
  }
}

// ---- 3. no false-positive: drop exactly ONE required condition at a time --
{
  const base = { A: "zakka", B: "haru" };
  const goodCard = "term";
  check("sanity: the base winning combo actually succeeds", isSuccess(base, goodCard));

  // (a) haru never placed
  check("haru placed nowhere fails (no_haru)", evaluate({ A: "zakka" }, goodCard) === "no_haru");
  // (b) haru placed at A instead of B
  check("haru placed at A fails (haru_at_a)", evaluate({ A: "haru" }, goodCard) === "haru_at_a");
  // (c) bCard is "keep"
  check('bCard="keep" fails (bad_card)', evaluate(base, "keep") === "bad_card");
  // (d) no card chosen yet
  check("no bCard chosen yet is 'need_card', not success", evaluate(base, null) === "need_card");
  // (e) shop A left empty
  check("shop A left unassigned fails (need_a)", evaluate({ B: "haru" }, goodCard) === "need_a");
}

// ---- 4. canDrop bounce rules (validated before assignment even happens) --
{
  check("shop C always refuses (any guest)", !canDrop("C", "haru").ok && canDrop("C", "haru").reason === "owner_refuses");
  check("shop C refuses zakka too", !canDrop("C", "zakka").ok);
  check("shop C refuses bread too", !canDrop("C", "bread").ok);
  check("shop B accepts haru", canDrop("B", "haru").ok);
  check("shop B refuses zakka (needs plumbing story, zakka doesn't need it)", !canDrop("B", "zakka").ok && canDrop("B", "zakka").reason === "wrong_guest_for_plumbing");
  check("shop B refuses bread", !canDrop("B", "bread").ok);
  check("shop A accepts haru", canDrop("A", "haru").ok);
  check("shop A accepts zakka", canDrop("A", "zakka").ok);
  check("shop A accepts bread", canDrop("A", "bread").ok);
}

// ---- 5. structural sanity -------------------------------------------------
check("GUESTS has 3 entries", GUESTS.length === 3);
check("SHOPS has 3 entries (A/B/C)", SHOPS.length === 3 && SHOPS.every((s) => ["A", "B", "C"].includes(s.id)));
check("STREET has 3 vacant shutters, one per shop", STREET.filter((s) => s.shopId).length === 3);
check("CARDS has exactly 3 contract options", CARDS.length === 3);
check("shop B carries the owner's intent memo (the key C for negotiation)", !!SHOPS.find((s) => s.id === "B").memo);
check("shop C has no memo (owner flatly refuses, nothing to negotiate)", !SHOPS.find((s) => s.id === "C").memo);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
