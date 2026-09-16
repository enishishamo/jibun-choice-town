#!/usr/bin/env node
// Automated gameplay QA for Q1 scene_audit (SceneAuditGame.tsx /
// sceneAuditLogic.ts). 2026-09-13 (mechanical-verification follow-up to
// the manual UX/logic audit): the design explicitly calls out that a
// "flag everything ✗" total-marking strategy must NOT pass (レバー式水栓・
// 古い2槽シンクは「紛らわしい適合」), and that the defect pool is
// randomized between two playthroughs (bin vs shelf) — this harness
// proves both branches independently, plus the exact defect-detection
// judging.

import { SPOTS, FIXES, defectsFor, isDefect, spotSeen, computeWrongMarks, evaluateJudge, isGoodFix, allInstructed, allRechecked } from "../../src/q1/sceneAuditLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

const allVisited = SPOTS.map((s) => s.id);

function correctMarksFor(drawn) {
  const marks = {};
  for (const s of SPOTS) marks[s.id] = isDefect(s.id, drawn) ? "ng" : "ok";
  return marks;
}

// ---- 1. a concrete winning sequence exists for BOTH random draws --------
for (const drawn of ["bin", "shelf"]) {
  const marks = correctMarksFor(drawn);
  check(`[drawn=${drawn}] correct marks (matching true defect status) reach ready_to_instruct`, evaluateJudge(allVisited, marks, drawn) === "ready_to_instruct");
  check(`[drawn=${drawn}] correct marks have zero wrong marks`, computeWrongMarks(marks, drawn).length === 0);

  const defects = defectsFor(drawn);
  check(`[drawn=${drawn}] defects are exactly backwash + ${drawn}`, defects.length === 2 && defects.includes("backwash") && defects.includes(drawn));

  // instruct each defect with its good fix option
  let instructed = [];
  for (const d of defects) {
    const goodIndex = FIXES[d].findIndex((f) => f.good);
    check(`[drawn=${drawn}] "${d}" has a good fix option`, goodIndex >= 0);
    check(`[drawn=${drawn}] isGoodFix("${d}", ${goodIndex}) is true`, isGoodFix(d, goodIndex));
    instructed = [...instructed, d];
  }
  check(`[drawn=${drawn}] instructing both defects with their good fix completes allInstructed`, allInstructed(instructed, drawn));

  // recheck completes similarly
  check(`[drawn=${drawn}] rechecking both defects completes allRechecked`, allRechecked(defects, drawn));
}

// ---- 2. the core BLOCKER this game's design calls out: flagging every ----
// spot ✗ (the "total-marking" strategy) must NOT pass, for either draw.
for (const drawn of ["bin", "shelf"]) {
  const allNg = Object.fromEntries(SPOTS.map((s) => [s.id, "ng"]));
  const result = evaluateJudge(allVisited, allNg, drawn);
  check(`[drawn=${drawn}] flagging every spot ✗ is rejected (marks_wrong), not a free pass`, result === "marks_wrong");
  check(`[drawn=${drawn}] flagging every spot ✗ produces wrong marks for the compliant spots`, computeWrongMarks(allNg, drawn).length > 0);
}

// ---- 3. flagging every spot ○ (the "total-marking" opposite) also fails --
for (const drawn of ["bin", "shelf"]) {
  const allOk = Object.fromEntries(SPOTS.map((s) => [s.id, "ok"]));
  check(`[drawn=${drawn}] flagging every spot ○ is rejected (misses the real defects)`, evaluateJudge(allVisited, allOk, drawn) === "marks_wrong");
}

// ---- 4. the "紛らわしい適合" (deceptively-compliant-looking) spots must ---
// read as genuinely NOT defective in both branches: wash (lever, hands-free
// already) and sink (old but 2-basin, compliant) are never in the defect
// pool at all, for either draw.
for (const drawn of ["bin", "shelf"]) {
  check(`[drawn=${drawn}] "wash" (lever faucet, already compliant) is never a defect`, !isDefect("wash", drawn));
  check(`[drawn=${drawn}] "sink" (old but 2-basin, compliant) is never a defect`, !isDefect("sink", drawn));
  check(`[drawn=${drawn}] "door" and "washT" are never defects (always-compliant baseline spots)`, !isDefect("door", drawn) && !isDefect("washT", drawn));
}

// ---- 5. no false-positive: mark everything correctly EXCEPT flip ONE -----
// spot's mark, and confirm judge rejects it (per drawn branch).
for (const drawn of ["bin", "shelf"]) {
  for (const flip of SPOTS) {
    const marks = correctMarksFor(drawn);
    marks[flip.id] = marks[flip.id] === "ng" ? "ok" : "ng";
    check(`[drawn=${drawn}] flipping only "${flip.id}"'s mark is rejected`, evaluateJudge(allVisited, marks, drawn) === "marks_wrong");
  }
}

// ---- 6. judge() gating: unvisited / unmarked block before mark-checking --
{
  const drawn = "bin";
  const marks = correctMarksFor(drawn);
  check("visiting nothing yet blocks with unvisited_remaining", evaluateJudge([], marks, drawn) === "unvisited_remaining");
  check("visiting everything but leaving one unmarked blocks with unmarked_remaining", evaluateJudge(allVisited, { ...marks, door: undefined }, drawn) === "unmarked_remaining");
}

// ---- 7. spotSeen reflects the pool draw correctly for bin/shelf ----------
{
  const binSpot = SPOTS.find((s) => s.id === "bin");
  const shelfSpot = SPOTS.find((s) => s.id === "shelf");
  check('when drawn="bin", the bin spot is seen as defective (lidless)', spotSeen(binSpot, "bin") === binSpot.seen);
  check('when drawn="bin", the shelf spot is seen as already-compliant (okSeen)', spotSeen(shelfSpot, "bin") === shelfSpot.okSeen);
  check('when drawn="shelf", the shelf spot is seen as defective', spotSeen(shelfSpot, "shelf") === shelfSpot.seen);
  check('when drawn="shelf", the bin spot is seen as already-compliant (okSeen)', spotSeen(binSpot, "shelf") === binSpot.okSeen);
  // backwash has no ngWhenDefect flag -- always shows its raw `seen` text regardless of draw
  const backwashSpot = SPOTS.find((s) => s.id === "backwash");
  check('backwash (always a defect, no pool flag) shows its raw seen text under both draws', spotSeen(backwashSpot, "bin") === backwashSpot.seen && spotSeen(backwashSpot, "shelf") === backwashSpot.seen);
}

// ---- 8. advice bounce: wrong fix options never silently "work" -----------
for (const [spotId, options] of Object.entries(FIXES)) {
  check(`"${spotId}" has exactly one good fix option`, options.filter((o) => o.good).length === 1);
  options.forEach((o, i) => {
    if (!o.good) {
      check(`"${spotId}" fix option ${i} (wrong) is correctly identified as not-good`, !isGoodFix(spotId, i));
      check(`"${spotId}" fix option ${i} (wrong) carries a bounce message`, !!o.bounce);
    }
  });
}

check("SPOTS has 7 entries", SPOTS.length === 7);
check("exactly bin and shelf are pool candidates (ngWhenDefect)", SPOTS.filter((s) => s.ngWhenDefect).map((s) => s.id).sort().join(",") === "bin,shelf");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
