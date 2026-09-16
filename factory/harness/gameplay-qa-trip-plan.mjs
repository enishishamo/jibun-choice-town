#!/usr/bin/env node
// Automated gameplay QA for Q1 trip_plan (TripPlanGame.tsx / tripPlanLogic.ts).
// 2026-09-13 (mechanical-verification follow-up): this is the game whose
// manual audit found a REAL bug -- BUDGET was 220 but the sum of every
// card's cost is only 171, so "予算オーバー" could never fire, and a
// TIRED_CAP hard-fail could never be reached either. Both were retuned/
// removed as part of that fix. This harness exists specifically to make
// sure that class of bug (a displayed constant with zero chance of ever
// mattering) cannot silently recur: it proves BUDGET is both reachable
// (a case exists that legitimately overspends) and satisfiable (a winning
// combo exists comfortably under it).

import { CARDS, DAYS, BUDGET, dayStats, totals, computeIssues, enoughPlaced, isSuccess, computeTags, emptyDays } from "../../src/q1/tripPlanLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- a concrete hand-built winning plan --------------------------------
// day1: go to Kyoto, check into hotel. day2: 3 learn visits + lunch + rest.
// day3: bus + return shinkansen. Total learn>=2, hotel day1, rest/meal day2,
// return day3, cost within BUDGET, >=8 cards placed.
const winningPlan = {
  d1: ["shinkansen_go", "hotel_in"],
  d2: ["kiyomizu", "lunch1", "kinkaku", "nara", "rest1"],
  d3: ["bus2", "shinkansen_back"],
};

{
  const t = totals(winningPlan);
  check("hand-built winning plan places >= 8 cards", enoughPlaced(winningPlan), `${[...new Set(Object.values(winningPlan).flat())].length} placed`);
  check("hand-built winning plan has >= 2 learn experiences", t.learnTotal >= 2, `learnTotal=${t.learnTotal}`);
  check("hand-built winning plan is within BUDGET", t.costTotal <= BUDGET, `cost=${t.costTotal} / ${BUDGET}`);
  check("hand-built winning plan has zero issues", computeIssues(winningPlan).length === 0, JSON.stringify(computeIssues(winningPlan)));
  check("hand-built winning plan is a success (isSuccess)", isSuccess(winningPlan));
}

// ---- no false-positive success: drop ONE required element at a time ----
{
  // (a) drop hotel_in from day1 -> "1日目のうちに、宿に着けるようにしよう。"
  const noHotel = { ...winningPlan, d1: ["shinkansen_go"] };
  check("dropping hotel check-in from day1 fails", !isSuccess(noHotel), JSON.stringify(computeIssues(noHotel)));
  check("dropping hotel check-in from day1 is flagged as the hotel issue", computeIssues(noHotel).some((i) => i.includes("宿に着ける")));
}
{
  // (b) drop the return shinkansen from day3 -> fails "3日目、学校へ帰る新幹線"
  const noReturn = { ...winningPlan, d3: ["bus2"] };
  check("dropping the return shinkansen from day3 fails", !isSuccess(noReturn));
  check("dropping the return shinkansen is flagged as the return-trip issue", computeIssues(noReturn).some((i) => i.includes("学校へ帰る新幹線")));
}
{
  // (c) drop one learn visit so only 1 remains -> "学びになる見学・体験が、まだ少ないかも"
  const oneLearn = { ...winningPlan, d2: ["kiyomizu", "lunch1", "rest1"] };
  check("dropping down to only 1 learn experience fails", !isSuccess(oneLearn), `learnTotal=${totals(oneLearn).learnTotal}`);
  check("only 1 learn experience is flagged as the learn issue", computeIssues(oneLearn).some((i) => i.includes("学びになる")));
}
{
  // (d) drop rest/meal from day2 -> "2日目に休憩や昼食がないと"
  const noRestDay2 = { ...winningPlan, d2: ["kiyomizu", "kinkaku", "nara"] };
  check("dropping rest/meal from day2 fails", !isSuccess(noRestDay2));
  check("no rest/meal on day2 is flagged as the day2 issue", computeIssues(noRestDay2).some((i) => i.includes("2日目に休憩や昼食")));
}
{
  // (e) fewer than 8 cards placed total -> not enoughPlaced
  const tooFew = { d1: ["shinkansen_go", "hotel_in"], d2: ["kiyomizu", "kinkaku"], d3: ["shinkansen_back"] };
  check("fewer than 8 cards placed is not enoughPlaced", !enoughPlaced(tooFew), `${[...new Set(Object.values(tooFew).flat())].length} placed`);
  check("fewer than 8 cards placed does not succeed even if issues=0 otherwise", !isSuccess(tooFew));
}

// ---- the exact bug class this file guards against: BUDGET reachability --
{
  // BUDGET is reachable: sum every single card's cost and confirm it exceeds BUDGET
  const totalOfAllCards = CARDS.reduce((a, c) => a + c.cost, 0);
  check(`the sum of every card's cost (${totalOfAllCards}) exceeds BUDGET (${BUDGET}) -- overspending is reachable at all`, totalOfAllCards > BUDGET);

  // construct a concrete over-budget plan (use the two most expensive move
  // cards twice each isn't possible -- cards are unique ids, so instead use
  // every card that exists, which trivially exceeds budget and also proves
  // the check function actually fires on a real over-budget total)
  const allCardIds = CARDS.map((c) => c.id);
  const overBudgetPlan = { d1: allCardIds, d2: [], d3: [] };
  const overCost = totals(overBudgetPlan).costTotal;
  check(`a plan using every card (cost ${overCost}) exceeds BUDGET and is flagged`, overCost > BUDGET && computeIssues(overBudgetPlan).some((i) => i.includes("予算オーバー")));

  // BUDGET is satisfiable: the hand-built winning plan above is comfortably under it
  check(`BUDGET is satisfiable -- the winning plan (cost ${totals(winningPlan).costTotal}) fits under BUDGET (${BUDGET})`, totals(winningPlan).costTotal <= BUDGET);
}

// ---- day-window overflow is a real, reachable fail condition -----------
{
  const d = DAYS.find((x) => x.id === "d1");
  // shinkansen_go(210) + kiyomizu(90) + kinkaku(80) + nara(100) + todaiji(70) + craft(100) = 650 > 600
  const overStuffedDay1 = { d1: ["shinkansen_go", "kiyomizu", "kinkaku", "nara", "todaiji", "craft"], d2: [], d3: [] };
  const s = dayStats("d1", overStuffedDay1);
  check(`an over-stuffed day1 (${s.time}min) exceeds its window (${d.window}min)`, s.time > d.window);
  check("an over-stuffed day is flagged in issues", computeIssues(overStuffedDay1).some((i) => i.includes("1日目の予定が詰め込みすぎ")));
}

// ---- tags: computeTags only meaningfully called on a success, but the ----
// pure function itself should reflect the thresholds honestly
{
  const tags = computeTags(winningPlan);
  check("computeTags returns at least one tag for the winning plan", tags.length > 0, JSON.stringify(tags));
  const t = totals(winningPlan);
  if (t.costTotal <= 135) check("costTotal<=135 plan is tagged 費用をおさえた旅程", tags.includes("費用をおさえた旅程"));
}

// ---- empty plan never succeeds -------------------------------------------
check("an empty plan never succeeds", !isSuccess(emptyDays()));

check("CARDS has 14 entries", CARDS.length === 14);
check("DAYS has 3 entries", DAYS.length === 3);
check("BUDGET is 150 (the fixed, reachable value)", BUDGET === 150);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
