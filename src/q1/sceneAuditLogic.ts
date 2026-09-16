// Pure rules for the food-safety-inspector (食品衛生監視員) Q1 (gameType:
// scene_audit). No React here, same pattern as sourcingLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-scene-audit.mjs can drive the exact
// defect-detection judging (marks must match which spots are actually
// defective, for BOTH possible random draws) and the improvement-
// instruction validation Node-side. Refactor-only — behavior unchanged
// from the inline version in SceneAuditGame.tsx.

export type SpotId = "door" | "wash" | "sink" | "washT" | "bin" | "shelf" | "backwash";
export type Mark = "ok" | "ng";

export interface Spot {
  id: SpotId;
  emoji: string;
  area: string;
  label: string;
  /** what the inspector actually SEES (the raw observation, not the verdict) */
  seen: string;
  fixedSeen?: string; // after improvement
  okSeen?: string; // when this pool candidate was NOT drawn (already compliant)
  ngWhenDefect?: boolean; // becomes a defect if drawn from the pool
}

export const SPOTS: Spot[] = [
  { id: "door", emoji: "🚪", area: "厨房", label: "厨房と客席のあいだ",
    seen: "新しいスイングドアで仕切られている。きちんと閉まる。" },
  { id: "wash", emoji: "🚰", area: "厨房", label: "厨房の手洗い",
    seen: "棒のような長いレバーがついた水栓。ひじでも押して止められそう。" },
  { id: "sink", emoji: "💧", area: "厨房", label: "シンク",
    seen: "前の店から残っている古いシンク。年季は入っているが、槽が2つあって、みがかれている。" },
  { id: "washT", emoji: "🧼", area: "トイレ", label: "トイレの手洗い",
    seen: "トイレのドアのすぐ横に、専用の小さな手洗いがある。" },
  { id: "bin", emoji: "🗑", area: "バックヤード", label: "ゴミ箱", ngWhenDefect: true,
    seen: "新品のゴミ箱がとどいている。でも、上があいたまま…フタが見あたらない。",
    okSeen: "フタ付きの新しいゴミ箱が置かれている。",
    fixedSeen: "同じゴミ箱に、フタが付いた。" },
  { id: "shelf", emoji: "🗄", area: "バックヤード", label: "食器棚", ngWhenDefect: true,
    seen: "新しい食器棚。でも扉がまだ付いておらず、食器がむき出し。横に扉の板が立てかけてある。",
    okSeen: "扉付きの食器棚に、食器がきちんとしまわれている。",
    fixedSeen: "扉が付いて、食器がしまわれた。" },
  { id: "backwash", emoji: "🚿", area: "バックヤード", label: "奥の古い手洗い",
    seen: "図面にのっていない古い手洗いが残っていて、スタッフが使う場所にある。十字のハンドルを回して止める水栓だ。",
    fixedSeen: "水栓が、レバー式にかえられた。" },
];

export const FIXES: Record<string, { text: string; good?: true; bounce?: string }[]> = {
  backwash: [
    { text: "手でさわらずに止められる水栓に、かえてください", good: true },
    { text: "よくみがいて、きれいにしてください",
      bounce: "きれいかどうかではなく、水栓の「構造」の話みたいだ。もう一度、基準を見てみよう。" },
    { text: "使用禁止のはり紙をしてください",
      bounce: "はり紙だけでは、スタッフがつい使ってしまいそうだ。" },
  ],
  bin: [
    { text: "フタ付きの容器に、かえてください", good: true },
    { text: "ゴミをこまめに捨ててください",
      bounce: "こまめに捨てても、あいたままでは虫やほこりが入ってしまう。" },
  ],
  shelf: [
    { text: "扉を取り付けて、食器をしまってください", good: true },
    { text: "食器にラップをかけてください",
      bounce: "その場しのぎになってしまう。棚そのものの話みたいだ。" },
  ],
};

/** The pool-drawn candidate, chosen once per playthrough: "bin" or "shelf". */
export type Drawn = "bin" | "shelf";

/** defects = backwash (always) + whichever of bin/shelf was drawn. */
export function defectsFor(drawn: Drawn): SpotId[] {
  return ["backwash", drawn];
}

export function isDefect(spotId: SpotId, drawn: Drawn): boolean {
  return defectsFor(drawn).includes(spotId);
}

/** What the inspector sees at a spot, honoring the pool (the non-drawn
 * candidate among bin/shelf reads as already-compliant). */
export function spotSeen(spot: Spot, drawn: Drawn): string {
  return spot.ngWhenDefect && !isDefect(spot.id, drawn) ? spot.okSeen! : spot.seen;
}

/** Mirrors judge()'s wrong-mark computation: spots where the mark
 * disagrees with the true defect status. */
export function computeWrongMarks(marks: Partial<Record<SpotId, Mark>>, drawn: Drawn): SpotId[] {
  return SPOTS.filter((s) => (marks[s.id] === "ng") !== isDefect(s.id, drawn)).map((s) => s.id);
}

export type JudgeResult = "unvisited_remaining" | "unmarked_remaining" | "marks_wrong" | "ready_to_instruct";

/** Mirrors judge() exactly. */
export function evaluateJudge(
  visited: SpotId[],
  marks: Partial<Record<SpotId, Mark>>,
  drawn: Drawn,
): JudgeResult {
  const unvisited = SPOTS.filter((s) => !visited.includes(s.id));
  if (unvisited.length) return "unvisited_remaining";
  const unmarked = SPOTS.filter((s) => marks[s.id] === undefined);
  if (unmarked.length) return "unmarked_remaining";
  const wrong = computeWrongMarks(marks, drawn);
  if (wrong.length) return "marks_wrong";
  return "ready_to_instruct";
}

/** Mirrors instruct(): true iff the chosen fix option index for this spot
 * is the "good" (correct) one. */
export function isGoodFix(spotId: SpotId, index: number): boolean {
  return !!FIXES[spotId]?.[index]?.good;
}

export function allInstructed(instructed: SpotId[], drawn: Drawn): boolean {
  const defects = defectsFor(drawn);
  return defects.every((d) => instructed.includes(d));
}

export function allRechecked(rechecked: SpotId[], drawn: Drawn): boolean {
  const defects = defectsFor(drawn);
  return defects.every((d) => rechecked.includes(d));
}
