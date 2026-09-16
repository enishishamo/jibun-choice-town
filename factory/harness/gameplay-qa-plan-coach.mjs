#!/usr/bin/env node
// Automated gameplay QA for Q1 plan_coach (PlanCoachGame.tsx /
// planCoachLogic.ts). 2026-09-13 (mechanical-verification follow-up to
// the manual UX/logic audit): the audit's central claim was "面談で確か
// めていないことは指摘できない" is the backbone of this game's D. This
// harness turns that hand-reasoned claim into an executable assertion by
// driving src/q1/planCoachLogic.ts directly.

import { FIELDS, ADVICE, WEAK_FIELD_IDS, evaluateFlag, isGoodAdvice, isComplete } from "../../src/q1/planCoachLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("exactly 2 fields are weak (uriage, keihi)", WEAK_FIELD_IDS.length === 2 && WEAK_FIELD_IDS.includes("uriage") && WEAK_FIELD_IDS.includes("keihi"));

// ---- 1. a concrete full winning sequence: ask both weak fields, flag ----
// them (in order), and pick the "good" advice for each -> isComplete.
{
  let asked = [], found = [], advised = [];

  // ask uriage, flag it (new_weak_found), advise with the good option (index 0)
  asked = [...asked, "uriage"];
  check('flagging "uriage" after asking it is new_weak_found', evaluateFlag("uriage", asked, found, advised) === "new_weak_found");
  found = [...found, "uriage"];
  check('the good advice option for "uriage" is index 0', isGoodAdvice("uriage", 0));
  advised = [...advised, "uriage"];

  // ask keihi, flag it, advise with the good option (index 0)
  asked = [...asked, "keihi"];
  check('flagging "keihi" after asking it is new_weak_found', evaluateFlag("keihi", asked, found, advised) === "new_weak_found");
  found = [...found, "keihi"];
  check('the good advice option for "keihi" is index 0', isGoodAdvice("keihi", 0));
  advised = [...advised, "keihi"];

  check("the full winning sequence (both weak fields asked, flagged, and correctly advised) completes the game", isComplete(advised), JSON.stringify(advised));
}

// ---- 2. the core BLOCKER this game exists to test: flagging BEFORE asking --
// must never succeed, for every field (weak or not).
for (const f of FIELDS) {
  const outcome = evaluateFlag(f.id, /* asked */ [], [], []);
  check(`flagging "${f.id}" without asking first is rejected (not_asked)`, outcome === "not_asked");
}

// ---- 3. no false-positive: complete the sequence but SKIP asking one -----
// weak field first (drop the "asked" precondition for keihi specifically)
{
  const asked = ["uriage"]; // keihi never asked
  const found = ["uriage"];
  const advised = [];
  check('flagging "keihi" without having asked it first is rejected even mid-sequence', evaluateFlag("keihi", asked, found, advised) === "not_asked");
}

// ---- 4. no false-positive: flagging a genuinely non-weak field never counts --
for (const f of FIELDS.filter((x) => !x.weak)) {
  const asked = [f.id];
  const outcome = evaluateFlag(f.id, asked, [], []);
  check(`flagging non-weak field "${f.id}" (after asking) is rejected (not_weak)`, outcome === "not_weak");
}

// ---- 5. isComplete requires BOTH weak fields advised, not just count=2 ---
{
  // Only possible incomplete case with length 2: can't happen since there
  // are exactly 2 weak fields and advised only ever grows via new_weak_found
  // on a truly weak field -- but assert directly that a wrong pair (e.g.
  // some non-weak id sneaking in) is correctly rejected by isComplete.
  check("isComplete rejects a mismatched pair (a non-weak id present)", !isComplete(["uriage", "naiyou"]));
  check("isComplete rejects only 1 advised", !isComplete(["uriage"]));
  check("isComplete rejects 0 advised", !isComplete([]));
  check("isComplete accepts exactly the 2 real weak fields regardless of order", isComplete(["keihi", "uriage"]));
}

// ---- 6. advice bounce: the wrong options for each weak field must bounce --
for (const fid of WEAK_FIELD_IDS) {
  const options = ADVICE[fid];
  check(`"${fid}" has exactly one good advice option`, options.filter((o) => o.good).length === 1);
  options.forEach((o, i) => {
    if (!o.good) {
      check(`"${fid}" advice option ${i} (wrong) is correctly identified as not-good`, !isGoodAdvice(fid, i));
      check(`"${fid}" advice option ${i} (wrong) carries a bounce message (never reveals the answer)`, !!o.bounce);
    }
  });
}

// ---- 7. re-flagging an already-advised field is a no-op, not a re-trigger --
{
  const asked = ["uriage"];
  const found = ["uriage"];
  const advised = ["uriage"];
  check('re-flagging an already-advised field returns already_advised', evaluateFlag("uriage", asked, found, advised) === "already_advised");
}

// ---- 8. re-flagging a found-but-not-yet-advised field reopens the dialog --
{
  const asked = ["uriage"];
  const found = ["uriage"];
  const advised = [];
  check("re-flagging a found-but-unadvised field reopens the advice dialog", evaluateFlag("uriage", asked, found, advised) === "reopen_advice");
}

check("FIELDS has 6 entries", FIELDS.length === 6);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
