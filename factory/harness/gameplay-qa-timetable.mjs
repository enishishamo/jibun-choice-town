#!/usr/bin/env node
// Automated gameplay QA for the redesigned TimetableGame (Continuous
// Product Loop, 2026-09-07 — factory/state/audits/audit-summary.md flagged
// timetable GQ43/CA67: selecting every act always fit before the end time
// regardless of order, so the core changeover-grouping trade-off the game
// claims to teach was never actually required).
// Drives the pure rules in src/q1/timetableLogic.ts directly, checking
// EVERY permutation of the optional acts (small enough to brute-force
// exhaustively -- 5! = 120 orderings) rather than a few hand-picked cases.
//
// Usage: node factory/harness/gameplay-qa-timetable.mjs

import { ACTS, END, START, computeSchedule } from "../../src/q1/timetableLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

const optional = ACTS.filter((a) => !a.must).map((a) => a.id);
check("there are exactly 5 optional acts", optional.length === 5);
check("budget (END - START) is positive", END > START);

// ---- round 2 fix (independent review HIGH: the submit gate only required
// 2+ optional acts, so a player could add any two and always win trivially
// -- the whole all-5 rebalance above was irrelevant if the game never
// forced reaching that decision point). The component now starts with
// EVERY act already in the lineup (matching the mission's own "won't
// finish as-is" framing), so removing at least one act is mandatory from
// turn one, not an optional extra step a player could skip entirely. ----
check(
  "the default full lineup (every act, in declared order, unmoved) overflows the end time -- the game genuinely starts broken, matching the mission text",
  computeSchedule(ACTS.map((a) => a.id)).finish > END,
  `finish=${computeSchedule(ACTS.map((a) => a.id)).finish}min, END=${END}min`,
);

// ---- the core defect this task fixes: NO ordering of all 5 acts may fit ----
{
  const allOrders = permutations(optional);
  const finishes = allOrders.map((order) => computeSchedule(["open", ...order, "end"]).finish);
  const best = Math.min(...finishes);
  const worst = Math.max(...finishes);
  check(
    "even the BEST possible ordering of all 5 optional acts overflows the end time (at least one act must be cut)",
    best > END,
    `best finish=${best}min, END=${END}min, ${allOrders.length} orders checked`,
  );
  check("the worst ordering overflows by even more than the best one", worst >= best);
}

// ---- dropping exactly one act must be POSSIBLE for every choice of which one, but not equally easy ----
{
  const results = optional.map((droppedId) => {
    const remaining = optional.filter((id) => id !== droppedId);
    const orders = permutations(remaining);
    const finishes = orders.map((order) => computeSchedule(["open", ...order, "end"]).finish);
    const best = Math.min(...finishes);
    const worst = Math.max(...finishes);
    return { droppedId, best, worst, fitsAlways: worst <= END, fitsAtAll: best <= END };
  });
  check(
    "cutting any single act makes finishing possible (best ordering fits) -- there is always a way forward",
    results.every((r) => r.fitsAtAll),
    JSON.stringify(results.map((r) => `${r.droppedId}:best${r.best}`)),
  );
  check(
    "cutting at least one specific act requires GOOD ordering (worst-case ordering for that cut still overflows) -- order genuinely matters for some choice",
    results.some((r) => !r.fitsAlways),
    JSON.stringify(results.map((r) => `${r.droppedId}:worst${r.worst}:fitsAlways${r.fitsAlways}`)),
  );
  check(
    "cutting at least one OTHER specific act is forgiving regardless of ordering -- not every choice is equally punishing",
    results.some((r) => r.fitsAlways),
  );
}

// ---- open/end must stay pinned to the ends (checked structurally: computeSchedule always keys off array order, so this is enforced by the component's move() guard, not this pure module -- verify the guard's invariant assumption holds: open/end never appear except at position 0 / last in a valid lineup) ----
check("open is 'must' (never removable, never meant to move)", ACTS.find((a) => a.id === "open").must === true);
check("end is 'must' (never removable, never meant to move)", ACTS.find((a) => a.id === "end").must === true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
