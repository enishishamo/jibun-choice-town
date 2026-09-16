#!/usr/bin/env node
// Automated gameplay QA for Q1 venue_layout (VenueLayoutGame.tsx /
// venueLayoutLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass that found AND FIXED a real bug: `pathClear` used to only check
// [food, goods] against the entrance cell, so placing "rest" -- or any
// other item -- directly in front of the "🚶入口" was never flagged even
// though it visually blocked the entrance). This harness turns that fix
// into an executable regression test, plus proves a reachable success
// path and no false-positive success on the other two rules.
//
// venue_layout is separately ESCALATED in factory/state/blocked-queue.md
// for a design-validity concern -- this harness does NOT touch or
// re-litigate that; it only proves the CURRENT implementation (bugs
// notwithstanding) behaves as written.
import { CELLS, ENTRANCE_COL, ITEM_IDS, evaluate, allPlaced, cellById } from "../../src/q1/venueLayoutLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("there are 9 cells (3x3 grid)", CELLS.length === 9);
check("the entrance cell (row2, entrance col) exists", !!CELLS.find((c) => c.row === 2 && c.col === ENTRANCE_COL));
check("there are exactly 4 placeable items", ITEM_IDS.length === 4);

// ---- 1. at least one winning layout exists (exhaustive search over all
// ways to place the 4 distinct items into 4 of the 9 distinct cells) ----
function* placements() {
  const cellIds = CELLS.map((c) => c.id);
  // choose 4 distinct cells (ordered, since each gets a distinct item) out of 9
  for (const c0 of cellIds) for (const c1 of cellIds) for (const c2 of cellIds) for (const c3 of cellIds) {
    const chosen = [c0, c1, c2, c3];
    if (new Set(chosen).size !== 4) continue;
    yield { stage: c0, food: c1, goods: c2, rest: c3 };
  }
}
let winnerCount = 0;
let exampleWinner = null;
for (const p of placements()) {
  const placed = { [p.stage]: "stage", [p.food]: "food", [p.goods]: "goods", [p.rest]: "rest" };
  if (evaluate(placed).ok) {
    winnerCount++;
    if (!exampleWinner) exampleWinner = placed;
  }
}
check("at least one winning layout exists (exhaustive search)", winnerCount > 0, `${winnerCount} winning layouts found`);

// ---- 2. a concrete hand-picked winning layout ---------------------------
{
  // stage at the back (row0), rest away from stage and off the entrance,
  // food/goods anywhere else off the entrance cell.
  const placed = { c0: "stage", c3: "food", c5: "goods", c6: "rest" };
  const evalResult = evaluate(placed);
  check(
    "a concrete hand-picked layout (stage back-left, rest front-left) wins",
    evalResult.ok === true,
    JSON.stringify(evalResult.issues),
  );
}

// ---- 3. no false positive: satisfying 2 of the 3 rules must not win ----
{
  // stage NOT at the back (row1) -- everything else fine
  const placed = { c3: "stage", c5: "food", c0: "goods", c6: "rest" };
  const r = evaluate(placed);
  check(
    "stage not visible (path clear + rest quiet otherwise satisfied) does not win",
    r.ok === false && r.stageVisible === false && r.pathClear === true && r.restQuiet === true,
    JSON.stringify(r),
  );
}
{
  // rest right next to the stage (row0) -- everything else fine
  const placed = { c0: "stage", c1: "rest", c3: "food", c5: "goods" };
  const r = evaluate(placed);
  check(
    "rest not quiet (stage visible + path clear otherwise satisfied) does not win",
    r.ok === false && r.restQuiet === false && r.stageVisible === true && r.pathClear === true,
    JSON.stringify(r),
  );
}

// ---- 4. THE BUGFIX this harness exists to lock in: ANY item placed on
// the entrance cell (row2, ENTRANCE_COL) must block pathClear, not just
// food/goods. ---------------------------------------------------------
{
  const entranceCell = CELLS.find((c) => c.row === 2 && c.col === ENTRANCE_COL).id;
  for (const itemId of ITEM_IDS) {
    // place the other 3 items safely (back row, off-entrance), and the
    // item under test on the entrance cell.
    const others = ITEM_IDS.filter((i) => i !== itemId);
    const safeCells = CELLS.filter((c) => c.id !== entranceCell).map((c) => c.id).slice(0, 3);
    const placed = { [entranceCell]: itemId };
    others.forEach((id, i) => { placed[safeCells[i]] = id; });
    const r = evaluate(placed);
    check(
      `placing "${itemId}" on the entrance cell blocks pathClear (regression test for the fixed bug)`,
      r.pathClear === false && r.ok === false,
      JSON.stringify(r.issues),
    );
  }
}

// ---- 5. not all 4 items placed never wins, even if the 3 placed would
// otherwise be fine -----------------------------------------------------
{
  const placed = { c0: "stage", c3: "food", c5: "goods" }; // rest missing
  check("an incomplete layout (rest not placed) never wins", evaluate(placed).ok === false);
  check("allPlaced correctly reports false for an incomplete layout", allPlaced(placed) === false);
}

// ---- 6. cellById sanity -------------------------------------------------
check("cellById resolves a known cell", cellById("c4")?.row === 1 && cellById("c4")?.col === 1);
check("cellById(undefined) returns undefined", cellById(undefined) === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
