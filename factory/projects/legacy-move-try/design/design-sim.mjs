#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-move-try
// (理学療法士 — per-movement cause diagnosis + fix selection, gameType move_try).
//
// The old implementation (src/q1/MoveTryGame.tsx) already had C_required=true and
// player_judgment_required=true (reverse audit) -- the child DOES read real per-movement
// symptom text and match it to a fix description. The ONLY flagged defect was BRUTE_FORCE:
// a wrong fix pick showed an explanatory hint with zero cost, and the child could stay on the
// same movement retrying every option until one worked. This redesign's job is narrowly scoped
// to that finding (not a full CORE rebuild): remove cost-free retry (each movement becomes a
// single commit, no retry), and strengthen the C->D judgment using research.md's genuine
// multi-axis finding (MHLW's welfare-equipment "使用が想定しにくい状態像" is an AND-condition
// across axes, e.g. 電動車いす is unsuitable when 歩行=つかまらないでできる AND
// 短期記憶=できない -- a single symptom axis does not by itself determine fitness).
//
// CORE: 3 movements in the real fixed sequence toward the goal (起き上がる -> 立ち上がる ->
// 歩く, research.md 兵庫県PT会マニュアル), each a single-commit fix selection:
//  - M1 起き上がり: genuinely single-axis per research (a bed transfer either has a support-
//    point problem or doesn't -- no second real axis was found for this specific movement).
//    2 candidates: 手すり (support-point fix) / 練習 (training, when the real issue is trunk-
//    balance which improves with practice rather than needing a fixed grab point).
//  - M2 立ち上がり: 2-axis, grounded in research's 3-phase breakdown (which phase fails) plus
//    the real 住環境 (home environment) constraint -- whether the chair/bed height can actually
//    be adjusted at home. 3 candidates: 高さ調整 / 手すり / 練習.
//  - M3 歩行: 2-axis, grounded in TUG-test-style observation (endurance vs. dynamic balance)
//    plus the real 介護力 (caregiver availability) constraint. 3 candidates: 杖 / 休憩 / 練習.
// Win requires ALL 3 movements correct. A wrong movement is a flat, honest "まだ安全にできない"
// result (no explanatory hint revealing why -- the old game's per-wrong-answer hints were
// themselves part of the brute-force problem, since a child could read every hint in turn and
// narrow down the answer for free). No retry. This is not a claim that research.md found a
// crisp official "鍛える vs 用具 vs 休憩" decision rule (it explicitly did not; research.md
// FACT_CHECK_REQUIRED #2) -- the axis mapping below is an explicit game-design simplification
// of real, sourced clinical categories (機能面の原因, 住環境, 介護力), disclosed as such in
// fact_sheet's uncertainties, not presented as an official clinical algorithm.

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
  standup: ["height", "rail", "train"],
  walk: ["cane", "rest", "train"],
};

// M1 situp: single real axis (cause). No second axis -- research.md found no genuine second
// factor distinguishing this specific movement's fix.
function newSitup(rand) {
  const cause = rand() < 0.5 ? "support" : "balance"; // 支持点不足 / 体幹バランス
  const correct = cause === "support" ? "rail" : "train";
  return { cause, correct };
}

// M2 standup: cause axis (下肢筋力不足 / 支持点不足) x environment axis (椅子・ベッドの高さを
// 変えられるか). When cause=support, the fix is always "rail" regardless of environment (a
// support-point problem isn't solved by seat height) -- environment only matters in the
// leg-strength branch, where it decides height-adjustment (if the home can accommodate it) vs.
// training (if it can't).
function newStandup(rand) {
  const cause = rand() < 0.5 ? "legs" : "support"; // 下肢筋力不足 / 支持点不足
  const envAdjustable = rand() < 0.5; // 住環境: 高さを変えられるか
  let correct;
  if (cause === "support") correct = "rail";
  else correct = envAdjustable ? "height" : "train";
  return { cause, envAdjustable, correct };
}

// M3 walk: cause axis (持久力不足/息切れ / 動的バランス不足/ふらつき) x caregiver axis (介護者が
// 付き添えるか). When cause=balance, the fix is always "cane" regardless of caregiver
// availability (a balance problem needs a physical aid) -- caregiver availability only matters
// in the endurance branch, where it decides pacing-with-a-caregiver (rest) vs. building
// endurance through training (when no one can accompany frequent rest stops safely).
function newWalk(rand) {
  const cause = rand() < 0.5 ? "endurance" : "balance"; // 持久力不足 / 動的バランス不足
  const caregiverAvailable = rand() < 0.5; // 介護力: 付き添えるか
  let correct;
  if (cause === "balance") correct = "cane";
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
  // isolation (other two movements reasoned correctly) -- confirms no single fixed answer is
  // secretly always right for a given movement.
  for (const m of MOVEMENTS) {
    for (const c of CANDIDATES[m]) {
      results[`fixed_${m}_${c}`] = rate((s) => {
        const picks = { situp: s.situp.correct, standup: s.standup.correct, walk: s.walk.correct };
        picks[m] = c;
        return sessionWin(s, picks);
      });
    }
  }

  // Single-axis-only reasoning for standup/walk (read the cause axis only, guess randomly
  // between the environment/caregiver-dependent candidates when cause doesn't already fully
  // determine the fix) -- the sharpest exploit this design must defend against, per
  // legacy-layer-and-compare/legacy-allocate-and-forecast's established precedent of testing
  // "read only one of the two real axes."
  results.standup_cause_axis_only = rate((s, rand) => {
    const pick = s.standup.cause === "support" ? "rail" : rand() < 0.5 ? "height" : "train";
    const picks = { situp: s.situp.correct, standup: pick, walk: s.walk.correct };
    return sessionWin(s, picks);
  });
  results.walk_cause_axis_only = rate((s, rand) => {
    const pick = s.walk.cause === "balance" ? "cane" : rand() < 0.5 ? "rest" : "train";
    const picks = { situp: s.situp.correct, standup: s.standup.correct, walk: pick };
    return sessionWin(s, picks);
  });
  // Combined worst case: single-axis-only reasoning on BOTH multi-axis movements at once
  // (situp is genuinely single-axis so "reading only the cause axis" there IS full reasoning).
  results.single_axis_only_combined = rate((s, rand) => {
    const standupPick = s.standup.cause === "support" ? "rail" : rand() < 0.5 ? "height" : "train";
    const walkPick = s.walk.cause === "balance" ? "cane" : rand() < 0.5 ? "rest" : "train";
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
  check("'read only the cause axis' for standup stays meaningfully below full reasoning", results.standup_cause_axis_only <= 0.8, `${results.standup_cause_axis_only}`);
  check("'read only the cause axis' for walk stays meaningfully below full reasoning", results.walk_cause_axis_only <= 0.8, `${results.walk_cause_axis_only}`);
  check("worst-case combined single-axis-only reasoning across both multi-axis movements stays well below full reasoning", results.single_axis_only_combined <= 0.65, `${results.single_axis_only_combined}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
