#!/usr/bin/env node
// Automated gameplay QA for Q1 plan_mix (PlanEventGame.tsx / planEventLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass -- the parent audit found no bug here, but "read it and it looked
// fine" is not a mechanical guarantee, so this proves it with Node instead
// of a human read).
//
// Proves: (a) at least one winning combination exists, (b) no combination
// wins by satisfying only two of the three displayed requirements (stage
// time / kid-friendliness / an always-on stall), and (c) the blocked idea
// (campfire) is correctly flagged as blocked.
import { IDEAS, STAGE_MINUTES, MIN_KIDS_SCORE, totalMinutes, totalKids, hasAllDayIdea, isSuccess, isBlocked } from "../../src/q1/planEventLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

// ---- 0. sanity on the constants themselves ----------------------------
check("STAGE_MINUTES is 150", STAGE_MINUTES === 150);
check("MIN_KIDS_SCORE is 3", MIN_KIDS_SCORE === 3);
check("the campfire idea is blocked (会場の条件で使えない)", isBlocked(IDEAS.find((i) => i.id === "fire")));
check("no other idea is blocked", IDEAS.filter((i) => i.id !== "fire").every((i) => !isBlocked(i)));

// ---- 1. at least one winning combination exists (enumerate all subsets
// of the SELECTABLE ideas -- i.e. excluding the blocked one, since the UI
// never lets a player add it) ------------------------------------------
const pickable = IDEAS.filter((i) => !isBlocked(i));
function* allSubsets(ids) {
  const n = ids.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    yield ids.filter((_, i) => mask & (1 << i));
  }
}
const winners = [...allSubsets(pickable.map((i) => i.id))].filter((ids) => isSuccess(ids));
check("at least one winning combination exists", winners.length > 0, `${winners.length} winning combos out of ${pickable.length ? 2 ** pickable.length : 0} subsets`);

// ---- 2. concrete winning combo, by hand -------------------------------
{
  const combo = ["dance", "magic", "mascot", "food"];
  check(
    "a concrete hand-picked combo (dance+magic+mascot+food) wins",
    isSuccess(combo) === true,
    `minutes=${totalMinutes(combo)}/${STAGE_MINUTES}, kids=${totalKids(combo)}, allDay=${hasAllDayIdea(combo)}`,
  );
}

// ---- 3. no false-positive: satisfying exactly 2 of the 3 displayed
// requirements must never win -------------------------------------------
{
  // over the stage-time budget, but kid-friendly enough AND has an all-day stall
  const overTime = ["band", "dance", "magic", "mascot", "food"];
  check(
    "over stage-time budget (kids+allDay otherwise satisfied) does not win",
    isSuccess(overTime) === false,
    `minutes=${totalMinutes(overTime)} (> ${STAGE_MINUTES}), kids=${totalKids(overTime)}, allDay=${hasAllDayIdea(overTime)}`,
  );
}
{
  // within time and has an all-day stall, but not enough for kids
  const notKidFriendly = ["band", "food"];
  check(
    "not kid-friendly enough (time+allDay otherwise satisfied) does not win",
    isSuccess(notKidFriendly) === false,
    `minutes=${totalMinutes(notKidFriendly)}, kids=${totalKids(notKidFriendly)} (< ${MIN_KIDS_SCORE}), allDay=${hasAllDayIdea(notKidFriendly)}`,
  );
}
{
  // within time and kid-friendly enough, but no all-day stall
  const noAllDay = ["dance", "magic"];
  check(
    "no all-day stall (time+kids otherwise satisfied) does not win",
    isSuccess(noAllDay) === false,
    `minutes=${totalMinutes(noAllDay)}, kids=${totalKids(noAllDay)}, allDay=${hasAllDayIdea(noAllDay)}`,
  );
}

// ---- 4. empty selection never wins -------------------------------------
check("picking nothing never wins", isSuccess([]) === false);

// ---- 5. every winning combo genuinely satisfies all 3 displayed rules,
// nothing hidden ----------------------------------------------------------
check(
  "every winning combo satisfies exactly the displayed rules (time, kids, all-day), nothing hidden",
  winners.every((ids) => totalMinutes(ids) <= STAGE_MINUTES && totalKids(ids) >= MIN_KIDS_SCORE && hasAllDayIdea(ids)),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
