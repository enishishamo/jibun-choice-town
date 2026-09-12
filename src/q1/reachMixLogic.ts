// Pure game logic for Q1 "reach_mix" (イベントを知らせる仕事 / 広報・PR, legacy-reach-mix).
// Mirrors factory/projects/legacy-reach-mix/design/design-sim.mjs exactly (same PLANS,
// same planFit/bestPlanSet/sessionWin rules) — factory/harness/gameplay-qa-reach-mix.mjs
// simulates strategies against this module directly, the same way design-sim.mjs simulated
// them at the design stage.
//
// Human Decision (2026-09-12): there is NO fixed tie-break. When today's audience + scenario
// make more than one plan equally valid, bestPlanSet() returns ALL of them and any one of
// them is accepted as correct — the component must never invent a single "the" answer.
// No reach numbers are ever computed or shown to the child; only the 4 disclosed facts
// (primary audience + 3 scenario values) and the plan cards' own qualitative text.

export type Audience = "family" | "young" | "older";
export const AUDIENCES: Audience[] = ["family", "young", "older"];

export type PlanId = "flyer_plan" | "sns_plan" | "media_plan";
export const PLAN_IDS: PlanId[] = ["flyer_plan", "sns_plan", "media_plan"];

export const PLANS: Record<PlanId, { target: Audience }> = {
  flyer_plan: { target: "family" }, // チラシ・掲示中心
  sns_plan: { target: "young" }, // SNS・ウェブサイト中心
  media_plan: { target: "older" }, // ポスター・報道機関中心
};

export interface Scenario {
  coopInstitutions: 1 | 2 | 3; // 協力してくれる施設の数
  followerTier: 0 | 1 | 2; // SNSアカウントのフォロワーの多さ
  prepWeeks: 1 | 2 | 3; // 準備にかけられる期間
}

export interface ReachMixSession {
  primary: Audience;
  scenario: Scenario;
  order: PlanId[]; // display order (shuffled every session)
}

export type Rand = () => number;
function randInt(rand: Rand, lo: number, hi: number): number { return lo + Math.floor(rand() * (hi - lo + 1)); }

export function newSession(rand: Rand = Math.random): ReachMixSession {
  const primary = AUDIENCES[Math.floor(rand() * AUDIENCES.length)];
  const scenario: Scenario = {
    coopInstitutions: randInt(rand, 1, 3) as 1 | 2 | 3,
    followerTier: randInt(rand, 0, 2) as 0 | 1 | 2,
    prepWeeks: randInt(rand, 1, 3) as 1 | 2 | 3,
  };
  const order = [...PLAN_IDS].sort(() => rand() - 0.5);
  return { primary, scenario, order };
}

/** 今回の状況で、このプランの中心となる媒体が弱くなっているか。 */
export function planIsWeakenedThisSession(planId: PlanId, scenario: Scenario): boolean {
  if (planId === "flyer_plan") return scenario.coopInstitutions === 1;
  if (planId === "sns_plan") return scenario.followerTier === 0;
  if (planId === "media_plan") return scenario.prepWeeks === 1;
  return false;
}

/** 内部判定専用のスコア（子どもには一切見せない）。3=対象一致&強い, 2=対象不一致&強い, 1=対象一致&弱い, 0=対象不一致&弱い。 */
export function planFit(planId: PlanId, session: ReachMixSession): 0 | 1 | 2 | 3 {
  const matchesTarget = PLANS[planId].target === session.primary;
  const weakened = planIsWeakenedThisSession(planId, session.scenario);
  if (matchesTarget && !weakened) return 3;
  if (matchesTarget && weakened) return 1;
  if (!matchesTarget && !weakened) return 2;
  return 0;
}

/** 今回のセッションでplanFitが最大のプランをすべて返す（複数正解を許容する——固定順位・ゲーム都合の最適解は一切追加しない）。 */
export function bestPlanSet(session: ReachMixSession): PlanId[] {
  let bestScore = -1;
  for (const id of PLAN_IDS) bestScore = Math.max(bestScore, planFit(id, session));
  return PLAN_IDS.filter((id) => planFit(id, session) === bestScore);
}

/** 重点対象と主眼が一致するプランが、今回の状況次第で本当に弱くなっているか（trapセッション）。 */
export function isTrapSession(session: ReachMixSession): boolean {
  const obvious = PLAN_IDS.find((id) => PLANS[id].target === session.primary)!;
  return planIsWeakenedThisSession(obvious, session.scenario);
}

export function sessionWin(session: ReachMixSession, pick: PlanId): boolean {
  return bestPlanSet(session).includes(pick);
}

/** つまずきの種類（失敗結果の文言の出し分けに使う。対象側の反応には一切依拠しない）。 */
export function stumbleFor(planId: PlanId): "flyer" | "sns" | "media" {
  if (planId === "flyer_plan") return "flyer";
  if (planId === "sns_plan") return "sns";
  return "media";
}
