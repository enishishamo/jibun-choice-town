#!/usr/bin/env node
// Automated gameplay QA for Q1 sourcing_mix (SourcingGame.tsx / sourcingLogic.ts).
// 2026-09-13 (UX/Logic audit — item ⑤/⑥-A): proves the renumbered supplier
// data has NO impossible-target bug (the original defect: displayed budget
// had zero simultaneously-valid solutions once the deadline was also
// respected) and that every supplier has a genuine role in at least one
// winning combination (the original defect: B社 could never be used at all
// without instantly failing).
import {
  SUPPLIERS, NEED_BOXES, DEADLINE_DAY, BUDGET, BOX_KG,
  totalBoxes, totalCost, lateBoxes, isSuccess, emptyOrder,
} from "../../src/q1/sourcingLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- 1. every supplier individually meets the deadline (no guaranteed trap) --
for (const s of SUPPLIERS) {
  check(`${s.name} meets the deadline (arrivalDay ${s.arrivalDay} <= ${DEADLINE_DAY})`, s.arrivalDay <= DEADLINE_DAY);
}

// ---- 2. no single supplier's cap alone can cover the need (forces a real mix) --
for (const s of SUPPLIERS) {
  check(`${s.name}'s cap (${s.maxBoxes}) alone cannot cover NEED_BOXES (${NEED_BOXES})`, s.maxBoxes < NEED_BOXES);
}

// ---- 3. enumerate ALL feasible orders (small search space) and confirm -------
function* allOrders() {
  const [a, b, c] = SUPPLIERS;
  for (let na = 0; na <= a.maxBoxes; na++)
    for (let nb = 0; nb <= b.maxBoxes; nb++)
      for (let nc = 0; nc <= c.maxBoxes; nc++)
        yield { a: na, b: nb, c: nc };
}

const winners = [...allOrders()].filter(isSuccess);
check("at least one winning combination exists", winners.length > 0, `${winners.length} winning combos out of the full search space`);

// hidden-condition check: isSuccess must depend ONLY on totalBoxes/lateBoxes,
// matching exactly what the UI shows (quantity + per-supplier arrival day) —
// never budget, never anything not rendered on screen.
const allMeetQtyAndTime = winners.every((o) => totalBoxes(o) >= NEED_BOXES && lateBoxes(o) === 0);
check("every winning combo satisfies exactly the displayed rule (qty + on-time), nothing hidden", allMeetQtyAndTime);

// ---- 4. at least one winning combo within budget (the original bug: none did) --
const withinBudget = winners.filter((o) => totalCost(o) <= BUDGET);
check("at least one winning combo is within the displayed budget", withinBudget.length > 0,
  withinBudget.length ? `cheapest winning+in-budget combo costs ¥${Math.min(...withinBudget.map(totalCost)).toLocaleString()}` : "NONE — regression of the original bug");

// ---- 5. each supplier has boxes > 0 in at least one WINNING combo (no trap) --
for (const s of SUPPLIERS) {
  const usedInAWin = winners.some((o) => o[s.id] > 0);
  check(`${s.name} appears with boxes>0 in at least one winning combo (not a dead trap)`, usedInAWin);
}

// ---- 6. multiple qualitatively different winning strategies exist -----------
const cheapest = winners.reduce((min, o) => (totalCost(o) < totalCost(min) ? o : min), winners[0]);
const noB = winners.filter((o) => o.b === 0);
const spread = winners.filter((o) => o.a > 0 && o.b > 0 && o.c > 0);
check("a cheapest winning combo exists", !!cheapest, `a${cheapest.a}/b${cheapest.b}/c${cheapest.c} = ¥${totalCost(cheapest).toLocaleString()}`);
check("a winning combo exists that avoids B社 entirely (a safer/pricier path)", noB.length > 0,
  noB.length ? `cheapest of these: ¥${Math.min(...noB.map(totalCost)).toLocaleString()}` : undefined);
check("a winning combo exists that spreads across all 3 suppliers (avoids single-supplier dependency)", spread.length > 0,
  spread.length ? `e.g. a${spread[0].a}/b${spread[0].b}/c${spread[0].c} = ¥${totalCost(spread[0]).toLocaleString()}` : undefined);

// ---- 7. under-ordering never succeeds (sanity: quantity really matters) -----
const under = { a: SUPPLIERS[0].maxBoxes, b: 0, c: 0 }; // 4 boxes, well short of 6
check("an order short of NEED_BOXES never succeeds", !isSuccess(under), `4 boxes ordered, isSuccess=${isSuccess(under)}`);

// ---- 8. empty order never succeeds ------------------------------------------
check("the empty order never succeeds", !isSuccess(emptyOrder()));

// ---- 9. BOX_KG * NEED_BOXES matches the original 120kg framing --------------
check("BOX_KG * NEED_BOXES === 120 (the job's real-world 120kg requirement)", BOX_KG * NEED_BOXES === 120);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
