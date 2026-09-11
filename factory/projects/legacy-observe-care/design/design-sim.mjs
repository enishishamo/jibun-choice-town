#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-observe-care (病棟看護師,
// gameType observe_care).
//
// research.md summary driving this design (factory/projects/legacy-observe-care/research.md):
//
// - The reverse audit's exploit is "brute force": the old implementation
//   (src/q1/NurseObserveGame.tsx) let the child retry a diagnosis or re-pick care choices
//   on the same screen indefinitely with zero cost.
// - research.md §4/§6 found a DEEPER problem than the reverse audit's brute-force finding:
//   the old mechanic forced the child to pick exactly ONE of 3 named diagnoses as "the"
//   correct answer, but a real nurse's actual job is NOT to pin down a single diagnosis
//   (城西国際大学テキスト: 「病名診断にこだわる必要はありません」) -- the real judgment is
//   whether each individual observation looks concerning, and sharing that reading with the
//   team is never optional (看護記録に関する指針) -- "just watch and do nothing" is not a
//   real option; "just watch WITHOUT sharing" is the actual overclaim risk this design closes
//   from the start (unlike legacy-sort-out, which discovered the analogous overclaim the hard
//   way in its own design review r1).
// - v2 (design review r1 FAIL 42 repair): r1 found v1 had reproduced the SAME overclaim family
//   one level deeper -- v1 derived an escalate-vs-watch ACTION from an invented "2 of 3
//   concerning -> report" threshold that research.md never establishes (research documents a
//   SINGLE declining item as already warranting contact, contradicting a majority rule), and
//   then certified that invented derived action as "the professionally correct response" --
//   textbook EXCLUSIVITY_OVERCLAIM, just moved from "the one correct diagnosis" to "the one
//   correct derived action from a rule the designer made up". The fix removes the
//   report/watch action from the game's scoring AND narrative entirely: sessionWin below only
//   ever checked the child's 3 per-item marks against the actual evidence plus the mandatory
//   share flag -- it never depended on any derived action -- so this repair only touches the
//   JSON design chain's narrative (the outcome is now described as the doctor/team's own
//   response to what was shared, a consequence the child does not choose and the game does not
//   certify as "the correct response"), not this file's scoring logic.
// - D never asks the child to name a specific diagnosis, and never asks the child to choose or
//   have certified a specific escalate-vs-watch action. It only asks the child to mark, for
//   each of the 3 core evidence items, whether that item itself looks concerning (this is the
//   actual observational judgment -- matching the item's real, independently-random state this
//   session), and to always share the reading with the team as part of the same single commit.
//   Temperature/SpO2 stay normal in every session (their real role, per research, is a
//   relevant monitoring clue, not proof that pneumonia has not relapsed -- v2 softened this
//   claim after r1's MEDICAL_EXCLUSION_OVERCLAIM finding), and sleep is an explicitly
//   irrelevant distractor item never scored.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The 3 evidence items research.md validates as the core dehydration/malnutrition
// observation trio (食事 meal intake / 水分 fluid intake / 排尿 urine output). Each is
// independently, randomly "低下傾向" (concerning, true) or "安定" (not concerning, false)
// this session -- can be any combination, not a fixed pattern.
export const EVIDENCE_ITEMS = ["meal", "fluid", "urine"];

function newSession(rand) {
  const evidence = {};
  for (const k of EVIDENCE_ITEMS) evidence[k] = rand() < 0.5;
  return { evidence };
}

// picks: { flags: { meal, fluid, urine }: boolean, share: boolean }
// Winning requires the child's own per-item concern marks to exactly match the actual
// (independently-random) evidence, AND sharing to always be included. There is no separate
// escalate-vs-watch action to score -- v1 tried deriving and certifying one from an invented
// threshold, which design review r1 correctly flagged as a new form of EXCLUSIVITY_OVERCLAIM;
// v2 removed that concept entirely rather than trying to ground the threshold.
export function sessionWin(session, picks) {
  if (picks.share !== true) return false;
  return EVIDENCE_ITEMS.every((k) => picks.flags[k] === session.evidence[k]);
}

function legitimatePicks(session) {
  return { flags: { ...session.evidence }, share: true };
}

// ---------------- verification ----------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13);
      const s = newSession(rand);
      if (fn(s, rand)) w++;
    }
    return Number((w / N).toFixed(4));
  }

  const results = {};

  results.legitimate_full_reasoning = rate((s) => sessionWin(s, legitimatePicks(s)));

  // Content-blind random: random flag per item, random share choice.
  results.random_pick = rate((s, rand) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = rand() < 0.5;
    return sessionWin(s, { flags, share: rand() < 0.5 });
  });

  // Always mark everything concerning (report reflex), always share.
  results.always_all_concerning = rate((s) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = true;
    return sessionWin(s, { flags, share: true });
  });

  // Always mark nothing concerning (watch reflex), always share.
  results.always_none_concerning = rate((s) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = false;
    return sessionWin(s, { flags, share: true });
  });

  // Correct marks but forgets to share (the old exploit's mirror-image failure: reading
  // correctly but never actually sharing/reporting it to the team).
  results.correct_marks_never_share = rate((s) => sessionWin(s, { flags: { ...s.evidence }, share: false }));

  // Reading only 2 of the 3 evidence items and guessing the 3rd's mark.
  results.two_observed_plus_guess_third = rate((s, rand) => {
    const [a, b, c] = EVIDENCE_ITEMS;
    const flags = { [a]: s.evidence[a], [b]: s.evidence[b], [c]: rand() < 0.5 };
    return sessionWin(s, { flags, share: true });
  });

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning (mark each item's actual concern state, always share) always wins", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random flags+share stays well below full reasoning", results.random_pick < 0.1, `${results.random_pick}`);
  check("marking everything concerning regardless of content fails most of the time", results.always_all_concerning < 0.2, `${results.always_all_concerning}`);
  check("marking nothing concerning regardless of content fails most of the time", results.always_none_concerning < 0.2, `${results.always_none_concerning}`);
  check("getting every mark right but never sharing always fails (sharing is never optional)", results.correct_marks_never_share === 0, `${results.correct_marks_never_share}`);
  check("reading only 2 of 3 evidence items and guessing the 3rd's mark does not reliably succeed", results.two_observed_plus_guess_third < 0.6, `${results.two_observed_plus_guess_third}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
