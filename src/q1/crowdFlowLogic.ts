// Pure rules for the crowd-safety-management Q1 (gameType: crowd_flow).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass): this file replaces the spot/tool matching rules that used
// to live only inline inside CrowdFlowGame.tsx, so factory/harness/
// gameplay-qa-crowd-flow.mjs can drive the evaluation logic directly with
// Node. Refactor only -- this does NOT touch crowd_flow's core causal
// claims (which are separately ESCALATED in factory/state/blocked-queue.md
// awaiting a Human Decision); it only proves the CURRENT implementation
// behaves as currently written.
//
// ※実際の警備計画は現場ごとに大きく異なる。ここでは「詰まりを見つけて
//   流れを分ける」という考え方だけを取り出した簡易モデル。
export type SpotId = "gate" | "food" | "stage";
export type ToolId = "fence" | "signpost" | "infomap" | "cone";

export interface Spot {
  id: SpotId;
  name: string;
  pos: { left: string; top: string };
  crowd: number; // 0-3, starting (untreated) congestion level
  why: string;
  /** この場所の混雑をやわらげる道具 */
  fix: ToolId[];
  wrong: Partial<Record<ToolId, string>>;
}

export const SPOTS: Spot[] = [
  {
    id: "gate",
    name: "入口",
    pos: { left: "50%", top: "78%" },
    crowd: 3,
    why: "入ってきた人が立ち止まって、うしろがつかえている",
    fix: ["fence", "infomap"],
    wrong: {
      cone: "コーンだけでは、人の列が分かれない…",
      signpost: "入口では、まだどこへ行くか決まっていない人が多い…",
    },
  },
  {
    id: "food",
    name: "飲食ブースの前",
    pos: { left: "22%", top: "46%" },
    crowd: 2,
    why: "行列が通路にはみ出している",
    fix: ["cone", "fence"],
    wrong: {
      infomap: "案内図を見に人が集まって、よけい混んでしまった…",
      signpost: "行列そのものは動かない…",
    },
  },
  {
    id: "stage",
    name: "ステージ前",
    pos: { left: "72%", top: "34%" },
    crowd: 2,
    why: "みんな同じ道からステージへ向かっている",
    fix: ["signpost"],
    wrong: {
      fence: "柵でふさぐと、行き場がなくなってもっと混んだ…",
      cone: "せまくすると、かえって詰まってしまった…",
      infomap: "立ち止まって見る人が増えてしまった…",
    },
  },
];

export const TOOL_IDS: ToolId[] = ["fence", "signpost", "infomap", "cone"];

/** spotId -> placed tool (a spot may have none placed yet). */
export type Placement = Partial<Record<SpotId, ToolId>>;

export function crowdOf(spot: Spot, tool?: ToolId): number {
  if (!tool) return spot.crowd;
  return spot.fix.includes(tool) ? 0 : spot.crowd;
}

export function allCalm(placed: Placement, spots: Spot[] = SPOTS): boolean {
  return spots.every((s) => crowdOf(s, placed[s.id]) === 0);
}
