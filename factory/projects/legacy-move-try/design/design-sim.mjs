#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-move-try
// (理学療法士 — per-movement cause diagnosis + fix selection, gameType move_try).
//
// v2 (design review r1 FAIL 52, BLOCKER x3 repair): r1 found v1's standup/walk cause x condition
// mappings were NOT jointly-necessary -- one branch of each (standup's "support" cause, walk's
// "balance" cause) mapped to a fixed fix regardless of the second axis, making that axis
// decorative in half the sessions and letting a cause-axis-only reader reach ~75%, looser than
// this session's established ~50-60% single-axis precedent. Fix: both movements now use a full
// 2x2 assignment where the one repeated fix appears ONLY on the diagonal (the two cells that
// differ in BOTH axes), so neither axis alone is majority-sufficient in ANY branch -- verified
// below to land both cause-only and condition-only reads at exactly 50% analytically (no
// reweighting needed, unlike the mathematically-impossible-to-fully-fix case legacy-allocate-and-
// forecast hit with only 2 candidate sectors; 3 candidates over a 2x2 grid has enough room for a
// true Latin-square-style diagonal).
// v1 also overclaimed that research.md "confirmed" situp is single-factor -- research.md simply
// never discussed a second factor for that specific movement (absence of evidence, not evidence
// of absence). fact_sheet/scope_core/ae v2 reword this as a disclosed design simplification for
// the first/opening movement, not an asserted clinical fact. This is a narrative-only change --
// situp's own math (single real axis, 2 candidates) is unchanged from v1.

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

// M1 situp: single real axis (cause). research.md discusses this movement's observation (支持点の
//有無) but never raises or rules out a second factor -- kept deliberately single-axis as the
// simplest, opening movement, disclosed as a design simplification (not a claimed clinical fact).
function newSitup(rand) {
  const cause = rand() < 0.5 ? "support" : "balance"; // 支持点不足 / 体幹バランス
  const correct = cause === "support" ? "rail" : "train";
  return { cause, correct };
}

// M2 standup: cause axis (下肢筋力不足 / 支持点不足) x environment axis (椅子・ベッドの高さや
// 手すりの設置余地など、住環境を調整できるか). Full 2x2 Latin-square-style assignment -- "height"
// is the one fix that repeats, but ONLY on the diagonal (legs+adjustable and support+not_
// adjustable, which differ in BOTH axes), grounded in the real fact that seat/bed height affects
// how much push-off effort standing requires regardless of WHY standing is hard (a real
// biomechanical relationship, not specific to leg strength alone) -- so raising the seat is a
// legitimate partial compensation even when the root cause is a missing support point and no rail
// can be installed. No branch is axis-constant: check every row/column below.
function newStandup(rand) {
  const cause = rand() < 0.5 ? "legs" : "support"; // 下肢筋力不足 / 支持点不足
  const envAdjustable = rand() < 0.5; // 住環境: 調整・工夫の余地があるか
  let correct;
  if (cause === "legs") correct = envAdjustable ? "height" : "train";
  else correct = envAdjustable ? "rail" : "height";
  return { cause, envAdjustable, correct };
}

// M3 walk: cause axis (持久力不足/息切れ / 動的バランス不足/ふらつき) x caregiver axis (介護者が
// 付き添えるか). Full 2x2 Latin-square-style assignment -- "cane" repeats only on the diagonal
// (balance+caregiver_available and endurance+caregiver_unavailable, which differ in BOTH axes),
// grounded in the real fact that a cane reduces the energy cost of walking regardless of the root
// cause (a real gait-biomechanics relationship) -- so when no caregiver is available to safely
// pace an endurance-limited walk, a cane letting the patient expend less effort per step is a
// legitimate fallback even though the root cause isn't balance.
function newWalk(rand) {
  const cause = rand() < 0.5 ? "endurance" : "balance"; // 持久力不足 / 動的バランス不足
  const caregiverAvailable = rand() < 0.5; // 介護力: 付き添えるか
  let correct;
  if (cause === "balance") correct = caregiverAvailable ? "cane" : "train";
  else correct = caregiverAvailable ? "rest" : "cane";
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
    // cause=legs -> tie between height/train; cause=support -> tie between rail/height. Both
    // ties are exactly 50/50 by construction (diagonal Latin square), so a fixed "always guess
    // height first" tie-break is exactly as good as random -- use random to avoid overstating.
    const pick = s.standup.cause === "legs" ? (rand() < 0.5 ? "height" : "train") : (rand() < 0.5 ? "rail" : "height");
    return sessionWin(s, { situp: s.situp.correct, standup: pick, walk: s.walk.correct });
  });
  results.standup_env_axis_only = rate((s, rand) => {
    const pick = s.standup.envAdjustable ? (rand() < 0.5 ? "height" : "rail") : (rand() < 0.5 ? "train" : "height");
    return sessionWin(s, { situp: s.situp.correct, standup: pick, walk: s.walk.correct });
  });
  results.walk_cause_axis_only = rate((s, rand) => {
    const pick = s.walk.cause === "balance" ? (rand() < 0.5 ? "cane" : "train") : (rand() < 0.5 ? "rest" : "cane");
    return sessionWin(s, { situp: s.situp.correct, standup: s.standup.correct, walk: pick });
  });
  results.walk_caregiver_axis_only = rate((s, rand) => {
    const pick = s.walk.caregiverAvailable ? (rand() < 0.5 ? "cane" : "rest") : (rand() < 0.5 ? "train" : "cane");
    return sessionWin(s, { situp: s.situp.correct, standup: s.standup.correct, walk: pick });
  });
  // Combined worst case: single-axis-only reasoning on BOTH multi-axis movements at once.
  results.single_axis_only_combined = rate((s, rand) => {
    const standupPick = s.standup.cause === "legs" ? (rand() < 0.5 ? "height" : "train") : (rand() < 0.5 ? "rail" : "height");
    const walkPick = s.walk.cause === "balance" ? (rand() < 0.5 ? "cane" : "train") : (rand() < 0.5 ? "rest" : "cane");
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
