#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-reach-mix (イベントを知らせる仕事
// ／主催団体の広報担当・実行委員会メンバー, gameType reach_mix).
//
// v5 (design review r4 FAIL 34 -> REDESIGN #2 [FINAL], design_iteration 2 -> 3,
// translation t4-scenario-driven-reach replaced by t5-compare-candidate-plans).
//
// r1(FAIL31)->r2(FAIL38)->r3(FAIL40)->r4(FAIL34): four consecutive rounds all reduced to
// some form of the same BLOCKER, CORE_CAUSAL_MODEL_DISTORTED, no matter how the reach
// numbers were sourced (fixed table -> independent dice -> tier-range dice -> a single
// shared scenario-driven formula -> per-channel scenario-driven formulas). r4's reviewer
// stated explicitly (checks.mechanic_structurally_capable_of_passing=false): "precomputed
// audience points plus budget thresholds will continue to make the child solve a synthetic
// knapsack, regardless of whether the numbers are random, shared-formula, or
// per-channel-formula" -- and recommended the FINAL redesign attempt be "a genuinely
// different interaction" rather than another numeric-knapsack variant.
//
// v5's structural change: the child no longer BUILDS a channel combination from scratch
// against a budget, and NO reach numbers are ever shown to the child at all (removing the
// exact "cards explicitly give computed answers... the child does not derive or test that
// causal relation" pattern r4 objected to). Instead, D becomes: read today's priority
// audience and 3 scenario facts (unchanged from t4 -- still grounded in research.md, still
// player-visible), then compare 3 ALREADY-COMPOSED candidate plans (each a named, small set
// of channels with a plain-language description of what it emphasizes) and pick which plan
// is best suited to today's specific audience+scenario combination. This is a holistic
// professional judgment ("does this draft plan make sense for who we're trying to reach,
// given what's different about this event") rather than an optimization the child performs
// -- much closer to how a real communications person reviews a colleague's draft plan than
// to a resource-allocation puzzle.
//
// A scoring function still exists internally (nothing playable can avoid this), but it
// operates only on WHICH PLAN WINS, never surfaces a number to the child, and is designed
// so the "obviously right" plan for today's audience is sometimes wrong because of a
// scenario fact making its core channel weak this session (e.g. the family-focused plan
// leans on flyer/school_board, which are weak this session if very few institutions
// cooperated) -- forcing the child to actually cross-reference the scenario facts against
// each plan's composition, not just match plan-topic to audience-name.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rand, lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }

export const AUDIENCES = ["family", "young", "older"];

// 3つの候補プラン（それぞれ固定の媒体構成——子どもが自分で組み立てるのではなく、
// 「すでに作られた案」を比較する）。
export const PLANS = {
  flyer_plan: { channels: ["flyer", "school_board"], target: "family" }, // チラシ・学校/保育園の掲示を中心にした案
  sns_plan: { channels: ["sns", "website"], target: "young" }, // SNS・ウェブサイトを中心にした案
  media_plan: { channels: ["poster", "media_relations"], target: "older" }, // 街のポスター・報道機関への投げ込みを中心にした案
};
export const PLAN_IDS = Object.keys(PLANS);

// 「今回の状況で、この案の中心となる媒体が弱くなる」条件——研究が示す方向性
// （協力施設が少ないとチラシ配布の効果が薄い、フォロワーが少ないとSNSの効果が薄い、
// 準備期間が短いと報道機関への投げ込み・ポスター掲示の効果が薄い）に基づく。
function planIsWeakenedThisSession(planId, scenario) {
  if (planId === "flyer_plan") return scenario.coopInstitutions === 1;
  if (planId === "sns_plan") return scenario.followerTier === 0;
  if (planId === "media_plan") return scenario.prepWeeks === 1;
  return false;
}

// 各プランの「今回の重点対象への適合度」を、数字としては子どもに一切見せない、
// 内部判定専用のスコアとして計算する。適合度は(1)重点対象とプランの主眼が一致するか、
// (2)今回の状況でプランの中心媒体が弱くなっていないか、の2軸のみで決まる——
// 具体的な到達数・手間コストの計算は行わない。
function planFit(planId, session) {
  const plan = PLANS[planId];
  const matchesTarget = plan.target === session.primary;
  const weakened = planIsWeakenedThisSession(planId, session.scenario);
  if (matchesTarget && !weakened) return 3; // 今回の重点対象に合っていて、状況も良い
  if (matchesTarget && weakened) return 1; // 重点対象には合っているが、今回は状況が悪く弱い
  if (!matchesTarget && !weakened) return 2; // 重点対象とは違うが、状況自体は悪くない（次点になりうる）
  return 0; // 重点対象とも違い、状況も悪い
}

// r9 Human Decision（2026-09-12）: r5〜r8を通じて、planFit同点時のタイブレークに
// 使っていた「竹内2023の実測順位（チラシ＞テレビ・新聞＞SNS）」という固定の強さの
// 順位（OVERALL_STRENGTH_RANK）は、過大な評価文言を削除するたびに（r6/r7/r8で
// 繰り返し）根拠のない断定として再指摘され続けた。根本原因は、順位そのものが
// 「単一イベント・単一媒体の実測値を、3つの複合プランの序列へ転用した、ゲーム側の
// 発明」であり、narrowing（文言の削除）ではこの発明自体を消せなかったことにある。
// Human Decisionの結論: **唯一の正解を作るための固定順位・ゲーム都合の最適解は
// 追加しない。今回の重点対象・状況に照らして複数のプランが同程度に妥当な場合は、
// 複数正解として受容する。** これにより、子どもが体験するDは純粋に「今回の重点対象
// ・状況を見て、3つのプランを比較し、今回に合うものを判断する」ことだけになり、
// 同点をタイブレークで無理に1つへ絞り込む一切の追加ロジック（開示済みであれ非開示で
// あれ）を廃止した。bestPlanSet()は、今回のセッションでplanFitが最大のプラン
// **すべて**を返す（1件のことも、2件・3件同時のこともある）。sessionWin()は、
// 選んだプランがこの集合に含まれていれば正解として扱う。

function newSession(rand) {
  const primary = AUDIENCES[Math.floor(rand() * AUDIENCES.length)];
  const scenario = {
    coopInstitutions: randInt(rand, 1, 3),
    followerTier: randInt(rand, 0, 2),
    prepWeeks: randInt(rand, 1, 3),
  };
  // 3枚の候補プランの表示順は毎回シャッフルする（プランの並び順が正解を示唆しないように）。
  const order = [...PLAN_IDS].sort(() => rand() - 0.5);
  return { primary, scenario, order };
}

// 今回のセッションでplanFitが最大のプランをすべて返す（複数正解を許容する——
// 唯一の正解を作るための固定順位・ゲーム都合の最適解は一切追加しない）。
function bestPlanSet(session) {
  let bestScore = -1;
  for (const planId of PLAN_IDS) bestScore = Math.max(bestScore, planFit(planId, session));
  return PLAN_IDS.filter((planId) => planFit(planId, session) === bestScore);
}

// このセッションで「重点対象と主眼が一致するプラン」が、今回の状況次第で本当に
// 最善でなくなっているか（=弱くなっているために別のプランを選ぶべきか）。
function isTrapSession(session) {
  const obvious = PLAN_IDS.find((id) => PLANS[id].target === session.primary);
  return planIsWeakenedThisSession(obvious, session.scenario);
}

export function sessionWin(session, pick) {
  return bestPlanSet(session).includes(pick);
}

function newTriple(rand) { return [newSession(rand), newSession(rand), newSession(rand)]; }

// r5是正（CORE_CAUSAL_MODEL_DISTORTED/SIMULATION_ASSERTION_WEAKNESS）: bestPlanSetを
// 直接呼ぶだけの検証は同語反復（tautology）に過ぎず、実際に子どもがカードに書かれた
// 情報だけから同じ結論にたどり着けることの証明にはならない。この関数は、bestPlanSet/
// planFitの内部実装を一切呼ばず、プレイヤーに実際に開示される2つの事実——
// (a) 各プランがどの対象を主眼にしているか（プラン案カードに明記）、
// (b) 今回の状況が、そのプランの中心媒体を弱めているか（状況設定カード＋プラン案
//     カードの説明文から読み取れる、disclosed rule）——だけを使って、独立に同じ
// 結論（同点なら複数正解の集合）を導けるかを検証する。r9 Human Decision是正:
// 固定の強さの順位によるタイブレークを廃止したため、この関数はもはやタイブレーク
// 情報を必要としない——「対象一致＋弱くなっていない」を最優先し、同点（複数の
// プランが同じ優先度）ならその全部を返す、という単純な規則だけで内部の勝利条件と
// 完全に一致することを、下のindependent_strategy_matches_internal_oracleで検証する。
// r9 design review是正（SIMULATION_ASSERTION_WEAKNESS）: 以前はplanIsWeakenedThisSession
// （planFit/オラクル側と共有するヘルパー）をそのまま呼んでいたため、「独立実装」の主張が
// 厳密には正確でなかった。isWeakenedFromDisclosedFactsは、状況設定カードが開示する事実
// （coopInstitutions/followerTier/prepWeeks）から同じ判定を独自に再実装したものであり、
// スコアリングに関わるいかなる関数（planFit/bestPlanSet/planIsWeakenedThisSession）も一切
// 呼ばない、真に独立したコード経路になった。
function isWeakenedFromDisclosedFacts(planId, scenario) {
  if (planId === "flyer_plan") return scenario.coopInstitutions === 1;
  if (planId === "sns_plan") return scenario.followerTier === 0;
  if (planId === "media_plan") return scenario.prepWeeks === 1;
  return false;
}
function independentPlayerStrategy(session) {
  const tierOf = (planId) => {
    const matchesTarget = PLANS[planId].target === session.primary; // (a) カードに書かれている
    const weakened = isWeakenedFromDisclosedFacts(planId, session.scenario); // (b) 状況カードと説明文から読み取れる、独自に再実装した判定
    // 子どもの判断規則（カードに書かれた情報だけから導ける優先順位）:
    // 1位=対象に合っていて弱くなっていない、2位=対象とは違うが弱くなっていない、
    // 3位=対象に合っているが弱くなっている、4位=対象とも違い弱くなっている。
    return matchesTarget && !weakened ? 3 : !matchesTarget && !weakened ? 2 : matchesTarget && weakened ? 1 : 0;
  };
  const bestTier = Math.max(...PLAN_IDS.map(tierOf));
  return PLAN_IDS.filter((planId) => tierOf(planId) === bestTier);
}

// ---------------- verification ----------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; }
    return Number((w / N).toFixed(4));
  }

  const results = {};
  const sameSet = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

  // 1. 正しい判断は、bestPlanSetを直接呼ぶのではなく、独立実装のindependentPlayerStrategy
  //    （プレイヤーに開示される情報だけを使う）で導いた「今回受け入れられる正解の集合」の
  //    中から実際にプレイヤーが選ぶ1つ（代表として先頭を使う）が、実際に勝利条件を
  //    満たすかを検証する（r5是正: SIMULATION_ASSERTION_WEAKNESS——旧版はbestPlan(s)を
  //    直接sessionWinに渡すだけの同語反復だった）。
  results.legitimate_reasoning = rate((s) => sessionWin(s, independentPlayerStrategy(s)[0]));

  // 1b. independentPlayerStrategyが返す「受け入れられる正解の集合」が、bestPlanSet
  //     （内部の勝利条件そのもの）と全セッションで完全に一致することを直接確認する
  //     ——開示された情報だけから、内部判定と同じ集合（複数正解を含む）に常に
  //     たどり着けることの直接的な証拠。
  results.independent_strategy_matches_internal_oracle = rate((s) => sameSet(independentPlayerStrategy(s), bestPlanSet(s)));

  // 1c. 実際に複数正解になるセッションの頻度（0件なら「複数正解を許容する」設計変更が
  //     何も変えていないことになる——意味のある頻度で発生していることを確認する）。
  results.multi_answer_session_rate = (() => {
    let n = 0;
    for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (bestPlanSet(s).length > 1) n++; }
    return Number((n / N).toFixed(4));
  })();

  // 2. 「重点対象の名前だけを見て、対応するプランを機械的に選ぶ」戦略（今回の状況設定
  //    を一切確認しない）——このゲームが本当にOBVIOUS_BINARY_CHOICEでないかの核心的な
  //    検証。状況次第でtrapが発生するセッションでは、これは失敗するはず。
  results.name_match_only = rate((s) => {
    const obvious = PLAN_IDS.find((id) => PLANS[id].target === s.primary);
    return sessionWin(s, obvious);
  });

  // 3. trapセッション（重点対象と一致する『いかにも正解』のプランが、今回の状況次第で
  //    実は最善でなくなっているセッション）の頻度。
  results.trap_session_rate = (() => {
    let n = 0;
    for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (isTrapSession(s)) n++; }
    return Number((n / N).toFixed(4));
  })();

  // 4. trapセッションに限定した場合、name_match_only戦略の成功率（低いほど、状況設定を
  //    実際に読む必要性が高いことを示す）。
  results.name_match_only_on_trap_sessions = (() => {
    let w = 0, n = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13); const s = newSession(rand);
      if (!isTrapSession(s)) continue;
      n++;
      const obvious = PLAN_IDS.find((id) => PLANS[id].target === s.primary);
      if (sessionWin(s, obvious)) w++;
    }
    return n > 0 ? Number((w / n).toFixed(4)) : null;
  })();

  // 5. 完全ランダム（3枚から適当に1枚を選ぶ、内容を一切見ない）。
  results.random_pick = rate((s, rand) => {
    const pick = PLAN_IDS[Math.floor(rand() * PLAN_IDS.length)];
    return sessionWin(s, pick);
  });

  // 6. 固定の1枚を毎回そのまま選ぶ（内容を一切見ない、旧v1〜v4が陥っていた
  //    「固定バケツ」戦略の直系）。
  for (const planId of PLAN_IDS) {
    results[`always_pick_${planId}`] = rate((s) => sessionWin(s, planId));
  }

  // 7. 重点対象は見るが今回の状況設定は見ない（trapに気づけない）ケースは上のname_match_
  //    onlyと同一戦略のため、ここでは3枚の表示順（シャッフル済み）だけを見て常に最初に
  //    表示されたプランを選ぶ、という位置だけに頼る戦略も検証する。
  results.always_first_displayed = rate((s) => sessionWin(s, s.order[0]));

  // 8. 3ラウンド独立合成。
  function tripleRate(pickFn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13); const sessions = newTriple(rand);
      const allWin = sessions.every((s) => sessionWin(s, pickFn(s, rand)));
      if (allWin) w++;
    }
    return Number((w / N).toFixed(4));
  }
  results.triple_legitimate_reasoning = tripleRate((s) => independentPlayerStrategy(s)[0]);
  results.triple_name_match_only = tripleRate((s) => PLAN_IDS.find((id) => PLANS[id].target === s.primary));
  results.triple_random_pick = tripleRate((s, rand) => PLAN_IDS[Math.floor(rand() * PLAN_IDS.length)]);

  // 9. 対象ごとの出現頻度、bestPlanの分布（3枚すべてが実際に正解になりうるか）。
  results.primary_freq = { family: 0, young: 0, older: 0 };
  results.best_plan_freq = { flyer_plan: 0, sns_plan: 0, media_plan: 0 };
  for (let i = 0; i < N; i++) {
    const rand = mulberry32(i * 7919 + 13); const s = newSession(rand);
    results.primary_freq[s.primary]++;
    for (const planId of bestPlanSet(s)) results.best_plan_freq[planId]++;
  }
  for (const a of AUDIENCES) results.primary_freq[a] = Number((results.primary_freq[a] / N).toFixed(4));
  for (const p of PLAN_IDS) results.best_plan_freq[p] = Number((results.best_plan_freq[p] / N).toFixed(4));

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

  check("legitimate reasoning, derived independently from only player-visible facts (no oracle call), always wins", results.legitimate_reasoning === 1, `${results.legitimate_reasoning}`);
  check("the independently-derived player strategy's accepted-answer set matches the internal win condition's set on every session (proves no hidden/unreadable rule remains, and multiple-correct-answer sessions are handled identically)", results.independent_strategy_matches_internal_oracle === 1, `${results.independent_strategy_matches_internal_oracle}`);
  check("multiple-correct-answer sessions (today's conditions make >1 plan equally valid) occur at a meaningful, non-trivial rate", results.multi_answer_session_rate > 0.05, `${results.multi_answer_session_rate}`);
  check("trap sessions (today's scenario weakens the 'obvious' plan) occur often enough to matter", results.trap_session_rate > 0.15 && results.trap_session_rate < 0.5, `${results.trap_session_rate}`);
  check("name-matching only (ignore today's scenario facts) mostly fails on trap sessions specifically -- proves scenario facts are NOT decorative (the rare exception: all 3 scenario facts are simultaneously unfavorable, so the target-matching plan is merely the least-bad option)", results.name_match_only_on_trap_sessions < 0.15, `${results.name_match_only_on_trap_sessions}`);
  check("name-matching only, overall, is well below full reasoning (still fails a meaningful share of all sessions)", results.name_match_only < 0.9 && results.name_match_only > results.trap_session_rate * 0, `${results.name_match_only}`);
  check("random pick stays close to the 1/3 baseline, well below full reasoning", results.random_pick < 0.4, `${results.random_pick}`);
  for (const planId of PLAN_IDS) {
    check(`always picking "${planId}" regardless of session fails most of the time`, results[`always_pick_${planId}`] < 0.5, `${results[`always_pick_${planId}`]}`);
  }
  check("always picking whichever plan is displayed first (position-only strategy) fails most of the time", results.always_first_displayed < 0.5, `${results.always_first_displayed}`);
  check("3-round compounding: legitimate reasoning always wins all 3 (deterministic mastery, no randomness in the win condition itself)", results.triple_legitimate_reasoning === 1, `${results.triple_legitimate_reasoning}`);
  check("3-round compounding: name-matching-only collapses well below single-round rate", results.triple_name_match_only < results.name_match_only, `${results.triple_name_match_only} vs ${results.name_match_only}`);
  check("3-round compounding: random picking collapses further", results.triple_random_pick < 0.1, `${results.triple_random_pick}`);
  for (const a of AUDIENCES) check(`primary=${a} is genuinely reachable (non-zero, roughly 1/3 frequency)`, results.primary_freq[a] > 0.25 && results.primary_freq[a] < 0.42, `${results.primary_freq[a]}`);
  for (const p of PLAN_IDS) check(`${p} is genuinely sometimes the best plan (non-zero, no permanently-dead option)`, results.best_plan_freq[p] > 0.15, `${results.best_plan_freq[p]}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
