// Pure rules for the factory-line worker Q1 (gameType: line_debug).
// No React here, same pattern as labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair round 1 (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ39/CA57 — "赤い詰まり表示が固定の正解工程を直接示し、
// 調整内容に関係なく同じ改善結果になる"): removed the red pre-tap
// highlight and made the tweak choice affect the outcome (guide -> full
// fix, anything else -> a weaker "partial" fix). Independent review found
// this reintroduced the SAME class of defect in new shapes:
// - "select all" tweaks still won (guide was allowed alongside others).
// - diagnosis had no attempt limit, so opening any 3 stations (regardless
//   of content) then clicking every station in turn always eventually hit
//   the answer for free.
// - s5 was the ONLY station with any non-zero loss, so checking that ONE
//   field alone (no real cross-field comparison) already uniquely
//   identified it.
// - the "guide" tweak's own description ("ひっかかりを減らす") directly
//   restated the diagnosis, handing over the answer's REASONING for free.
//
// Round 2 (this revision) fixes all four: tweak choice is single-select
// (isFullFix takes one id, not a set, so "pick everything" is not
// physically possible); MAX_DIAGNOSIS_ATTEMPTS caps wrong station guesses;
// s6 now also carries a small, genuinely-lesser loss so distinguishing the
// bottleneck requires comparing MAGNITUDE across stations, not just
// presence/absence of one field; and all three tweak descriptions describe
// only the literal action, not why it would help.
export interface Step {
  id: string;
  name: string;
  emoji: string;
  rate: number; // 個/h
  stop: number; // 分
  queue: number; // たまり
  loss: number; // ロス
}

export const BASE: Step[] = [
  { id: "s1", name: "原料", emoji: "🥛", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s2", name: "混ぜる", emoji: "🌀", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s3", name: "冷やす", emoji: "❄️", rate: 400, stop: 1, queue: 2, loss: 0 },
  { id: "s4", name: "容器へ", emoji: "🥤", rate: 390, stop: 0, queue: 5, loss: 0 },
  { id: "s5", name: "包装", emoji: "🎁", rate: 240, stop: 12, queue: 25, loss: 30 },
  { id: "s6", name: "箱づめ", emoji: "📦", rate: 200, stop: 8, queue: 10, loss: 4 },
];
export const FIXED: Step[] = [
  { id: "s1", name: "原料", emoji: "🥛", rate: 460, stop: 0, queue: 0, loss: 0 },
  { id: "s2", name: "混ぜる", emoji: "🌀", rate: 460, stop: 0, queue: 0, loss: 0 },
  { id: "s3", name: "冷やす", emoji: "❄️", rate: 460, stop: 0, queue: 1, loss: 0 },
  { id: "s4", name: "容器へ", emoji: "🥤", rate: 460, stop: 0, queue: 2, loss: 0 },
  { id: "s5", name: "包装", emoji: "🎁", rate: 460, stop: 3, queue: 4, loss: 10 },
  { id: "s6", name: "箱づめ", emoji: "📦", rate: 460, stop: 0, queue: 2, loss: 1 },
];
// without the guide fix, speed/switch tweaks alone smooth out timing
// (stop/queue improve) but never address the jamming that causes wasted
// product — loss barely moves, an honest partial improvement.
export const PARTIAL: Step[] = [
  { id: "s1", name: "原料", emoji: "🥛", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s2", name: "混ぜる", emoji: "🌀", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s3", name: "冷やす", emoji: "❄️", rate: 400, stop: 1, queue: 1, loss: 0 },
  { id: "s4", name: "容器へ", emoji: "🥤", rate: 400, stop: 0, queue: 3, loss: 0 },
  { id: "s5", name: "包装", emoji: "🎁", rate: 320, stop: 6, queue: 14, loss: 27 },
  { id: "s6", name: "箱づめ", emoji: "📦", rate: 280, stop: 4, queue: 8, loss: 2 },
];

export const BOTTLENECK = "s5";
/** must open at least this many steps before diagnosing — forces an actual
 * data comparison instead of tapping the one step a removed red highlight
 * used to point at. */
export const MIN_STEPS_SEEN = 3;
/** wrong station guesses allowed before diagnosis moves on without ever
 * naming the answer — closes the "open all 6, click each in turn" brute
 * force loop (previously unlimited, no cost). */
export const MAX_DIAGNOSIS_ATTEMPTS = 1;

// 2026-09-07 round 2: each description names only the literal action taken
// on the equipment, never the reason it would (or wouldn't) help — that
// reasoning has to come from the player comparing the case's own stop/loss
// numbers, not from reading which tweak "sounds like" it matches jamming.
export const TWEAKS = [
  { id: "guide", name: "ガイドの位置を変える", desc: "包装フィルムの通り道の位置を、少し変える" },
  { id: "speed", name: "ラインの速さを変える", desc: "ラインが動く速さの設定を変える" },
  { id: "switch", name: "切替えの条件を変える", desc: "フィルムを交換するタイミングの設定を変える" },
];

/** Does the chosen tweak match what the data actually points to?
 * Single-select by construction (one id, not a set) — "pick everything"
 * is not a selectable state, closing the round-1 select-all shortcut. */
export function isFullFix(tweak: string | null): boolean {
  return tweak === "guide";
}
