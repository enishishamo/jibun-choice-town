#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-move-try
// (理学療法士 — per-movement cause diagnosis + fix selection, gameType move_try).
//
// v2 (design review r1 FAIL 52, BLOCKER x3 repair): r1 found v1's standup/walk cause x condition
// mappings were NOT jointly-necessary -- one branch of each (standup's "support" cause, walk's
// "balance" cause) mapped to a fixed fix regardless of the second axis, making that axis
// decorative in half the sessions and letting a cause-axis-only reader reach ~75%, looser than
// this session's established ~50-60% single-axis precedent. Fix: both movements used a 2x2
// assignment where the one repeated fix (3 candidates over 4 cells) appeared ONLY on the diagonal.
// v3 (design review r2 FAIL 45, BLOCKER x1 -> REDESIGN t1->t1v2): r2 accepted the diagonal
// structure's MATH (no_axis_constant_branch=true, ~50% ceiling confirmed both analytically and
// numerically) but rejected its two off-diagonal repeat cells (standup: support+not_adjustable->
// height; walk: endurance+caregiver_no->cane) as math-driven retrofits -- "height helps regardless
// of cause" and "a cane is a universal energy-saving substitute" aren't established by research.md.
// v3 tried fixing this by introducing a 4th candidate ("rest") reused across two cells that still
// differ in BOTH cause and condition -- but design review r3 (FAIL 38, BLOCKER x1: same
// CORE_CAUSAL_MODEL_DISTORTED code) correctly found that "rest" does not causally address a
// missing support point (standup) or impaired dynamic balance (walk) -- pacing/rest genuinely only
// addresses ENDURANCE limitation (research.md D: "②ペーシング＝休憩を挟む" is explicitly tied to
// 持久力/心肺機能), so reusing it for support/balance cells was the same "one fix generalized to an
// unrelated cause" defect in a new costume.
// v4 (design review r3 FAIL 38 fix): removes ALL candidate reuse. Both standup and walk now use
// 4 FULLY DISTINCT candidates, one per cell, so no candidate's justification ever needs to
// generalize across more than one (cause, condition) combination -- each cell's fix only has to be
// true for that one cell. The 4th candidate per movement is "compensate" (代償動作): a
// PT-taught compensatory movement technique (e.g. leaning further forward and shifting weight to
// stand without a grab point; walking with light contact along walls/furniture already in the
// home) -- this is a real, distinct intervention category documented in research.md's D section
// citing 兵庫県理学療法士会's manual ("動作の代償方法（手すりの使い方、良い方の足を使う動作
// パターン等）"), separate from 用具/環境 (height/rail/cane), 休憩・ペーシング (rest, now used
// ONLY for the endurance-caused cell it is actually grounded for), and 訓練 (train). No cell's fix
// is claimed to work "regardless of cause" -- every cell has its own single-purpose justification.
// v2 also overclaimed that research.md "confirmed" situp is single-factor -- research.md simply
// never discussed a second factor for that specific movement (absence of evidence, not evidence
// of absence). fact_sheet/scope_core/ae v2 reword this as a disclosed design simplification for
// the first/opening movement, not an asserted clinical fact (confirmed closed by design review r2,
// unchanged since).

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOVEMENTS = ["situp", "standup", "walk"];

export const CANDIDATES = {
  situp: ["rail", "train"],
  standup: ["height", "rail", "train", "compensate"],
  walk: ["cane", "rest", "train", "compensate"],
};

// M1 situp: single real axis (cause). research.md discusses this movement's observation (支持点の
//有無) but never raises or rules out a second factor -- kept deliberately single-axis as the
// simplest, opening movement, disclosed as a design simplification (not a claimed clinical fact).
function newSitup(rand) {
  const cause = rand() < 0.5 ? "support" : "balance"; // 支持点不足 / 体幹バランス
  const correct = cause === "support" ? "rail" : "train";
  return { cause, correct };
}

// M2 standup: cause axis (下肢筋力不足 / 支持点不足) x environment axis (椅子・ベッドの高さや
// 手すりの設置余地など、住環境を調整できるか). All 4 cells map to their OWN distinct fix, no
// candidate reused anywhere: legs+adjustable->height (raise the seat -- addresses leg strength by
// reducing the distance to travel), legs+not_adjustable->train (environment can't help, so build
// leg strength directly), support+adjustable->rail (add a grab point -- addresses the missing
// support directly), support+not_adjustable->compensate (neither a device nor an environment
// change is available right now -- research.md's D section, citing 兵庫県理学療法士会's manual,
// documents a distinct real intervention category, 動作の代償方法 [movement compensation
// technique] -- e.g. leaning further forward and shifting weight further ahead before pushing up,
// so the patient doesn't need an external grab point at all. This is NOT "rest/pacing" [which only
// addresses endurance, see newWalk] and NOT claimed to work for a different cause -- it is a
// distinct, single-purpose technique that only needs to be true for THIS cell). No branch is
// axis-constant (every row and column has 2 different answers): check below.
function newStandup(rand) {
  const cause = rand() < 0.5 ? "legs" : "support"; // 下肢筋力不足 / 支持点不足
  const envAdjustable = rand() < 0.5; // 住環境: 調整・工夫の余地があるか
  let correct;
  if (cause === "legs") correct = envAdjustable ? "height" : "train";
  else correct = envAdjustable ? "rail" : "compensate";
  return { cause, envAdjustable, correct };
}

// M3 walk: cause axis (持久力不足/息切れ / 動的バランス不足/ふらつき) x caregiver axis (介護者が
// 付き添えるか). All 4 cells map to their OWN distinct fix, no candidate reused anywhere:
// balance+caregiver_yes->cane (a new physical support device, safe to start using with someone
// present to supervise the fit), balance+caregiver_no->compensate (a balance problem with no one
// around to supervise a NEW device is the highest-risk combination for introducing one -- the
// distinct, defensible answer here is a movement-compensation technique using support ALREADY
// present in the home, e.g. light contact along a wall or furniture the patient already knows,
// taught once by the PT, not a new device and not requiring supervision), endurance+caregiver_yes
// ->rest (research.md's D section explicitly ties ペーシング＝休憩を挟む to 持久力/心肺機能 --
// pacing genuinely addresses endurance, and caregiver presence makes supervised rest-stops safer),
// endurance+caregiver_no->train (build endurance capacity directly through training, which is
// self-directed and doesn't require supervision the way paced rest-stops during an actual walk
// would). No candidate appears in more than one cell, so no fix's justification needs to
// generalize across more than one cause.
function newWalk(rand) {
  const cause = rand() < 0.5 ? "endurance" : "balance"; // 持久力不足 / 動的バランス不足
  const caregiverAvailable = rand() < 0.5; // 介護力: 付き添えるか
  let correct;
  if (cause === "balance") correct = caregiverAvailable ? "cane" : "compensate";
  else correct = caregiverAvailable ? "rest" : "train";
  return { cause, caregiverAvailable, correct };
}

export function newSession(rand = Math.random) {
  return { situp: newSitup(rand), standup: newStandup(rand), walk: newWalk(rand) };
}

export function sessionWin(session, picks) {
  return (
    picks.situp === session.situp.correct &&
    picks.standup === session.standup.correct &&
    picks.walk === session.walk.correct
  );
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

  results.legitimate_full_reasoning = rate((s) =>
    sessionWin(s, { situp: s.situp.correct, standup: s.standup.correct, walk: s.walk.correct })
  );

  // Fully blind random guessing across all 3 movements' candidate sets.
  results.random_pick = rate((s, rand) =>
    sessionWin(s, {
      situp: CANDIDATES.situp[Math.floor(rand() * CANDIDATES.situp.length)],
      standup: CANDIDATES.standup[Math.floor(rand() * CANDIDATES.standup.length)],
      walk: CANDIDATES.walk[Math.floor(rand() * CANDIDATES.walk.length)],
    })
  );

  // Fixed-choice guessing (content-blind, same pick every session) for each movement in
  // isolation (other two movements reasoned correctly).
  for (const m of MOVEMENTS) {
    for (const c of CANDIDATES[m]) {
      results[`fixed_${m}_${c}`] = rate((s) => {
        const picks = { situp: s.situp.correct, standup: s.standup.correct, walk: s.walk.correct };
        picks[m] = c;
        return sessionWin(s, picks);
      });
    }
  }

  // Single-axis-only, SMART (Bayes-optimal majority-predict, not naive random tie-break) reading
  // for standup/walk -- the sharpest single-axis exploit, per this session's established
  // precedent of testing "read only one of the two real axes, guess the best you can on the
  // other."
  results.standup_cause_axis_only = rate((s, rand) => {
    // cause=legs -> tie between height/train; cause=support -> tie between rail/compensate. Both
    // ties are exactly 50/50 by construction, so a fixed tie-break is exactly as good as random --
    // use random to avoid overstating.
    const pick = s.standup.cause === "legs" ? (rand() < 0.5 ? "height" : "train") : (rand() < 0.5 ? "rail" : "compensate");
    return sessionWin(s, { situp: s.situp.correct, standup: pick, walk: s.walk.correct });
  });
  results.standup_env_axis_only = rate((s, rand) => {
    const pick = s.standup.envAdjustable ? (rand() < 0.5 ? "height" : "rail") : (rand() < 0.5 ? "train" : "compensate");
    return sessionWin(s, { situp: s.situp.correct, standup: pick, walk: s.walk.correct });
  });
  results.walk_cause_axis_only = rate((s, rand) => {
    const pick = s.walk.cause === "balance" ? (rand() < 0.5 ? "cane" : "compensate") : (rand() < 0.5 ? "rest" : "train");
    return sessionWin(s, { situp: s.situp.correct, standup: s.standup.correct, walk: pick });
  });
  results.walk_caregiver_axis_only = rate((s, rand) => {
    const pick = s.walk.caregiverAvailable ? (rand() < 0.5 ? "cane" : "rest") : (rand() < 0.5 ? "compensate" : "train");
    return sessionWin(s, { situp: s.situp.correct, standup: s.standup.correct, walk: pick });
  });
  // Combined worst case: single-axis-only reasoning on BOTH multi-axis movements at once.
  results.single_axis_only_combined = rate((s, rand) => {
    const standupPick = s.standup.cause === "legs" ? (rand() < 0.5 ? "height" : "train") : (rand() < 0.5 ? "rail" : "compensate");
    const walkPick = s.walk.cause === "balance" ? (rand() < 0.5 ? "cane" : "compensate") : (rand() < 0.5 ? "rest" : "train");
    return sessionWin(s, { situp: s.situp.correct, standup: standupPick, walk: walkPick });
  });

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning always wins (every session solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.1, `${results.random_pick}`);
  check("every fixed-choice guess (per movement, others correct) fails well below full reasoning", Object.keys(results).filter((k) => k.startsWith("fixed_")).every((k) => results[k] <= 0.55), JSON.stringify(Object.fromEntries(Object.entries(results).filter(([k]) => k.startsWith("fixed_")))));
  check("'read only the cause axis' for standup stays at or below 0.6 (no threshold above 0.6 permitted, fixed before measurement)", results.standup_cause_axis_only <= 0.6, `${results.standup_cause_axis_only}`);
  check("'read only the environment axis' for standup stays at or below 0.6", results.standup_env_axis_only <= 0.6, `${results.standup_env_axis_only}`);
  check("'read only the cause axis' for walk stays at or below 0.6", results.walk_cause_axis_only <= 0.6, `${results.walk_cause_axis_only}`);
  check("'read only the caregiver axis' for walk stays at or below 0.6", results.walk_caregiver_axis_only <= 0.6, `${results.walk_caregiver_axis_only}`);
  check("worst-case combined single-axis-only reasoning across both multi-axis movements stays well below full reasoning", results.single_axis_only_combined <= 0.4, `${results.single_axis_only_combined}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
