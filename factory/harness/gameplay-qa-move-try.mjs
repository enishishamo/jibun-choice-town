#!/usr/bin/env node
// Automated gameplay QA for Q1 move_try (MoveTryGame.tsx / moveTryLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass -- the parent audit found no bug here, but "read it and it looked
// fine" is not a mechanical guarantee, so this proves it with Node instead
// of a human read).
//
// move_try is separately ESCALATED in factory/state/blocked-queue.md for a
// design-validity concern (does the fix-per-movement causal claim hold
// up) -- this harness does NOT touch or re-litigate that; it only proves
// the CURRENT implementation (as written) has a reachable success path
// and no false-positive success.
import { MOVES, FIXES, isFixCorrect, isAllCleared } from "../../src/q1/moveTryLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("there are 3 movements to clear", MOVES.length === 3);
check("every movement has at least one correct fix", MOVES.every((m) => m.fixes.length > 0));

// ---- 1. a full winning playthrough exists (each move's own first-listed
// correct fix) --------------------------------------------------------
{
  const applied = {};
  for (const m of MOVES) applied[m.id] = m.fixes[0];
  check("clearing all 3 movements with their own first-listed correct fix wins", isAllCleared(applied) === true, JSON.stringify(applied));
}

// ---- 2. every alternative correct fix for a movement also clears it
// (movements with 2+ valid fixes are a real choice) ----------------------
for (const m of MOVES) {
  for (const fixId of m.fixes) {
    check(`"${m.name}" is correctly clearable with its listed fix "${fixId}"`, isFixCorrect(m, fixId) === true);
  }
}

// ---- 3. no false positive: clearing 2 of 3 movements correctly but the
// 3rd with a WRONG fix must never report all-cleared ----------------------
{
  const walk = MOVES.find((m) => m.id === "walk");
  const wrongForWalk = FIXES.map((f) => f.id).find((id) => !walk.fixes.includes(id));
  const applied = { sit: MOVES.find((m) => m.id === "sit").fixes[0], stand: MOVES.find((m) => m.id === "stand").fixes[0], walk: wrongForWalk };
  check(
    "sit+stand correctly cleared, walk given a wrong fix -> not all-cleared",
    isAllCleared(applied) === false && isFixCorrect(walk, wrongForWalk) === false,
    `wrong fix used for walk: ${wrongForWalk}`,
  );
}

// ---- 4. a movement missing from `applied` entirely must not be treated
// as cleared (an incomplete playthrough never wins) -----------------------
{
  const applied = { sit: MOVES.find((m) => m.id === "sit").fixes[0], stand: MOVES.find((m) => m.id === "stand").fixes[0] }; // walk missing
  check("an incomplete playthrough (walk never attempted) never wins", isAllCleared(applied) === false);
}

// ---- 5. every fix NOT listed for a movement genuinely fails it (no
// accidental universal fix) -------------------------------------------
for (const m of MOVES) {
  for (const f of FIXES) {
    if (m.fixes.includes(f.id)) continue;
    check(`"${m.name}" is NOT clearable with the wrong fix "${f.id}"`, isFixCorrect(m, f.id) === false);
  }
}

// ---- 6. every movement's wrong-fix feedback is only defined for fixes
// that are actually wrong for it (no contradictory feedback) --------------
for (const m of MOVES) {
  for (const fixId of Object.keys(m.wrong)) {
    check(`"${m.name}"'s wrong-fix message for "${fixId}" is for a fix that is genuinely not in its correct list`, !m.fixes.includes(fixId));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
