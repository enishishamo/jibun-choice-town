#!/usr/bin/env node
// Automated gameplay QA for Q1 zone_and_fit (ZoneFitGame.tsx /
// zoneFitLogic.ts). 2026-09-13 (mechanical-verification follow-up to the
// manual UX/logic audit): drives the floor-grid placement constraints
// (plumbing-wall-only, toilet-adjacency, faucet-before-placement, budget
// cap) and the final kijun(基準)/eigyo(営業) check over a plain cell-id ->
// part-id map, matching the same shape ZoneFitGame.tsx uses internally.

import {
  COLS, ROWS, PARTS, FAUCETS, PILLAR, TOILET, SINK, BASE_COST,
  col, neighbors, seatsFor, costFor, canPlace, computeIssues, isSuccess,
} from "../../src/q1/zoneFitLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// Build a concrete winning floor plan by hand.
// Plumbing wall = col 0-1. Layout (index = row*COLS+col, COLS=6):
//   row0: [SINK=0(fixed,usable)] [1: wash] [2: door] [3: table] [4: table] [5: table]
//   row1: [6: kitchen] [7: --] [8: --] [9: table] [10: table] [11: table]
//   row2: [12: backyard] [13: --] [14: --] [15: PILLAR(fixed)] [16: --] [17: --]
//   row3: [18: --] [19: --] [20: --] [21: --] [22: --] [23: --]
//   row4: [24: --] [25: --] [26: --] [27: --] [28: washT] [29: TOILET(fixed)]
// washT (28) must be a neighbor of TOILET(29): neighbors(29) includes 28 (left), 23 (up). Good.
// door(2) must have a free neighbor for the kitchen-side corridor check on kitchen(6)/door(2):
//   neighbors(6) = [0(fixed,not free),12(has backyard),5? no -- col(6)=0 so left=-1, right=7(free)] -> has a free neighbor (7). OK.
//   neighbors(2) = [row-1: -8 invalid, row+1: 8(free), left:1(wash, occupied), right:3(table,occupied)] -> 8 is free. OK.
function buildWinningCells() {
  const cells = {};
  cells[1] = "wash";
  cells[2] = "door";
  cells[3] = "table";
  cells[4] = "table";
  cells[5] = "table";
  cells[6] = "kitchen";
  cells[9] = "table";
  cells[10] = "table";
  cells[11] = "table";
  cells[12] = "backyard";
  cells[28] = "washT";
  return cells;
}

{
  const cells = buildWinningCells();
  const faucet = "lever"; // hand-free structure, not the cheapest "handle"
  const loan = 280;
  const seats = seatsFor(cells);
  const cost = costFor(cells, faucet);
  const { kijun, eigyo } = computeIssues(cells, faucet, loan);

  check("hand-built winning plan has >= 8 seats", seats >= 8, `seats=${seats}`);
  check("hand-built winning plan's cost fits within the loan", cost <= loan, `cost=${cost} / loan=${loan}`);
  check("hand-built winning plan has zero kijun (基準) issues", kijun.length === 0, JSON.stringify(kijun));
  check("hand-built winning plan has zero eigyo (営業) issues", eigyo.length === 0, JSON.stringify(eigyo));
  check("hand-built winning plan is a success (isSuccess)", isSuccess(cells, faucet, loan));
}

// ---- no false-positive: drop exactly ONE required element at a time ----
{
  const base = buildWinningCells();
  const faucet = "lever";
  const loan = 280;
  check("sanity: base plan succeeds", isSuccess(base, faucet, loan));

  // (a) remove the kitchen -> both a kijun issue (no partition needed once
  // there's no kitchen, but eigyo flags "no kitchen") — assert failure at least
  const noKitchen = { ...base };
  delete noKitchen[6];
  check("removing the kitchen fails (no kitchen to cook in)", !isSuccess(noKitchen, faucet, loan));
  check("removing the kitchen is flagged as the no-kitchen eigyo issue", computeIssues(noKitchen, faucet, loan).eigyo.some((i) => i.includes("厨房が、まだない")));

  // (b) remove the door (区画) while kitchen stays -> kijun issue
  const noDoor = { ...base };
  delete noDoor[2];
  check("removing the door (with kitchen present) fails", !isSuccess(noDoor, faucet, loan));
  check("removing the door is flagged as the missing-partition kijun issue", computeIssues(noDoor, faucet, loan).kijun.some((i) => i.includes("区画がない")));

  // (c) remove the wash (手洗い設備) -> kijun issue
  const noWash = { ...base };
  delete noWash[1];
  check("removing the employee handwash fails", !isSuccess(noWash, faucet, loan));
  check("removing the employee handwash is flagged", computeIssues(noWash, faucet, loan).kijun.some((i) => i.includes("従業員用の手洗い設備がない")));

  // (d) use the handle faucet (not hands-free) -> kijun issue
  check("using the handle (non-hands-free) faucet fails", !isSuccess(base, "handle", loan));
  check("handle faucet is flagged as the non-hands-free structure issue", computeIssues(base, "handle", loan).kijun.some((i) => i.includes("手でさわらずに止められる")));

  // (e) remove washT (トイレ専用手洗い) -> kijun issue
  const noWashT = { ...base };
  delete noWashT[28];
  check("removing the toilet-only handwash fails", !isSuccess(noWashT, faucet, loan));
  check("removing washT is flagged", computeIssues(noWashT, faucet, loan).kijun.some((i) => i.includes("トイレに専用の手洗いがない")));

  // (f) remove backyard (ゴミ箱+食器棚) -> kijun issue
  const noBackyard = { ...base };
  delete noBackyard[12];
  check("removing the backyard storage fails", !isSuccess(noBackyard, faucet, loan));
  check("removing backyard storage is flagged", computeIssues(noBackyard, faucet, loan).kijun.some((i) => i.includes("フタ付きゴミ箱")));

  // (g) too few seats (<8) -> eigyo issue
  const fewSeats = { ...base };
  delete fewSeats[9]; delete fewSeats[10]; delete fewSeats[11];
  check(`fewer than 8 seats (${seatsFor(fewSeats)}) fails`, !isSuccess(fewSeats, faucet, loan));
  check("too few seats is flagged as the seats eigyo issue", computeIssues(fewSeats, faucet, loan).eigyo.some((i) => i.includes("この席数")));

  // (h) over budget: sensor faucet pushes cost past a tight loan
  const overBudgetLoan = BASE_COST + 5; // sensor costs +25, lever +10; base+10 (lever) still <= overBudgetLoan only if <= ; let's force strictly under with lever, over with sensor
  check("sensor faucet cost pushes plan over a tight loan", costFor(base, "sensor") > overBudgetLoan);
  check("over-budget plan (sensor on a tight loan) fails", !isSuccess(base, "sensor", overBudgetLoan));
  check("over-budget plan is flagged as the budget eigyo issue", computeIssues(base, "sensor", overBudgetLoan).eigyo.some((i) => i.includes("承認された")));
}

// ---- canPlace placement-time constraints (the "return a reason at the ----
// moment of placement" behavior the component surfaces) --------------------
{
  const empty = {};
  check("fixed sink cell cannot be placed on (returns fixed_sink)", canPlace("kitchen", SINK, empty, null, 280) === "fixed_sink");
  check("fixed toilet cell cannot be placed on (returns fixed_toilet)", canPlace("kitchen", TOILET, empty, null, 280) === "fixed_toilet");
  check("fixed pillar cell cannot be placed on (returns fixed_pillar)", canPlace("kitchen", PILLAR, empty, null, 280) === "fixed_pillar");
  check("placing kitchen beyond the plumbing wall (col>1) is rejected", canPlace("kitchen", 2, empty, null, 280) === "plumbing_wall_only");
  check("placing kitchen ON the plumbing wall (col<=1) is allowed", canPlace("kitchen", 1, empty, null, 280) === null);
  check("placing wash beyond the plumbing wall (col>1) is rejected", canPlace("wash", 3, empty, "lever", 280) === "plumbing_wall_only");
  check("placing washT not adjacent to the toilet is rejected", canPlace("washT", 10, empty, null, 280) === "toilet_adjacency_required");
  check("placing washT adjacent to the toilet is allowed", canPlace("washT", 28, empty, null, 280) === null);
  check("placing wash without choosing a faucet first is rejected", canPlace("wash", 1, empty, null, 280) === "faucet_type_required");
  check("placing wash after choosing a faucet is allowed", canPlace("wash", 1, empty, "handle", 280) === null);
  const oneKitchen = { 1: "kitchen" };
  check("placing a second kitchen (single-only part) is rejected", canPlace("kitchen", 7, oneKitchen, null, 280) === "single_only");
  check("no selection at all yields no_selection", canPlace(null, 10, empty, null, 280) === "no_selection");
  check("sensor faucet over a loan that can't afford it is rejected at placement time", canPlace("wash", 1, empty, "sensor", BASE_COST) === "over_budget");
  check("sensor faucet within an affordable loan is allowed", canPlace("wash", 1, empty, "sensor", BASE_COST + 25) === null);
}

// ---- multiple qualitatively different winning layouts (table vs counter) --
{
  const counterVariant = buildWinningCells();
  counterVariant[9] = "counter"; counterVariant[10] = "counter"; counterVariant[11] = "counter";
  check("a counter-seating variant of the winning plan also succeeds", isSuccess(counterVariant, "lever", 280));
  check("counter-seating variant still has >= 8 seats", seatsFor(counterVariant) >= 8);
}

check("PARTS has 7 entries", PARTS.length === 7);
check("FAUCETS has 3 entries", FAUCETS.length === 3);
check("the grid is COLS(6) x ROWS(5) = 30 cells", COLS === 6 && ROWS === 5);
check("neighbors() never returns an out-of-range index", [0, 5, 29, 15].every((i) => neighbors(i).every((n) => n >= 0 && n < COLS * ROWS)));
check("col() is consistent with COLS", col(7) === 1 && col(0) === 0 && col(5) === 5);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
