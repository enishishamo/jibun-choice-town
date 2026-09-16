#!/usr/bin/env node
// Automated gameplay QA for Q1 crowd_flow (CrowdFlowGame.tsx /
// crowdFlowLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass -- the parent audit found no bug here, but "read it and it looked
// fine" is not a mechanical guarantee, so this proves it with Node instead
// of a human read).
//
// crowd_flow is separately ESCALATED in factory/state/blocked-queue.md for
// a design-validity concern (does the "right tool per spot" causal claim
// hold up) -- this harness does NOT touch or re-litigate that; it only
// proves the CURRENT implementation (as written) has a reachable success
// path and no false-positive success.
import { SPOTS, TOOL_IDS, crowdOf, allCalm } from "../../src/q1/crowdFlowLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("there are 3 congestion spots", SPOTS.length === 3);
check("every spot starts genuinely congested (crowd > 0) -- no free win without acting", SPOTS.every((s) => s.crowd > 0));
check("every spot has at least one tool that fixes it", SPOTS.every((s) => s.fix.length > 0));

// ---- 1. a winning placement exists (use each spot's own first listed fix) --
{
  const placed = {};
  for (const s of SPOTS) placed[s.id] = s.fix[0];
  check(
    "a winning placement exists (each spot's own first-listed fix)",
    allCalm(placed) === true,
    JSON.stringify(placed),
  );
}

// ---- 2. every alternative correct fix for a spot also calms it (spots
// with 2+ valid fixes are a real choice, not a single memorized answer) --
for (const s of SPOTS) {
  for (const toolId of s.fix) {
    check(`"${s.name}" is calmed by its listed fix "${toolId}"`, crowdOf(s, toolId) === 0);
  }
}

// ---- 3. no false positive: fixing 2 of the 3 spots but using a WRONG
// tool on the third must never report allCalm ----------------------------
{
  const stage = SPOTS.find((s) => s.id === "stage");
  const wrongForStage = TOOL_IDS.find((t) => !stage.fix.includes(t));
  const placed = { gate: SPOTS.find((s) => s.id === "gate").fix[0], food: SPOTS.find((s) => s.id === "food").fix[0], stage: wrongForStage };
  check(
    "gate+food correctly fixed, stage given a wrong tool -> not allCalm",
    allCalm(placed) === false && crowdOf(stage, wrongForStage) > 0,
    `wrong tool used at stage: ${wrongForStage}`,
  );
}

// ---- 4. every tool NOT in a spot's fix list genuinely fails to calm it
// (no accidental universal fix) -------------------------------------------
for (const s of SPOTS) {
  for (const toolId of TOOL_IDS) {
    if (s.fix.includes(toolId)) continue;
    check(`"${s.name}" is NOT calmed by the wrong tool "${toolId}"`, crowdOf(s, toolId) === s.crowd && crowdOf(s, toolId) > 0);
  }
}

// ---- 5. no tool placed at all leaves every spot at its original crowd
// level (nothing calms itself) ---------------------------------------------
check("placing nothing anywhere never reaches allCalm", allCalm({}) === false);
check("with nothing placed, crowdOf equals the spot's own starting crowd level for every spot", SPOTS.every((s) => crowdOf(s, undefined) === s.crowd));

// ---- 6. every spot that lists a wrong-tool message actually has one for
// every non-fix tool it names as its "wrong" feedback (message coverage
// sanity -- not required by the mechanic, but reflects the manual audit's
// read that every button press gives feedback) ----------------------------
for (const s of SPOTS) {
  for (const toolId of Object.keys(s.wrong)) {
    check(`"${s.name}"'s wrong-tool message for "${toolId}" is for a tool NOT in its fix list (no contradictory feedback)`, !s.fix.includes(toolId));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
