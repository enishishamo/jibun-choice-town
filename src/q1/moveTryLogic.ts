// Pure rules for the physical-therapist Q1 (gameType: move_try).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass): this file replaces the move/fix matching table that used to
// live only inline inside MoveTryGame.tsx, so factory/harness/gameplay-qa-
// move-try.mjs can drive the evaluation logic directly with Node.
// Refactor only -- move_try's core causal claims (which fix "solves" which
// movement) are separately ESCALATED in factory/state/blocked-queue.md
// awaiting a Human Decision, and are NOT changed here; this only proves
// the CURRENT implementation behaves as currently written.
export type FixId = "rail" | "cane" | "height" | "rest" | "train";

export interface Move {
  id: string;
  name: string;
  icon: string;
  problem: string;
  fixes: FixId[]; // これで「できる」になる
  wrong: Partial<Record<FixId, string>>;
}

export const MOVES: Move[] = [
  {
    id: "sit", name: "ベッドから起き上がる", icon: "🛏",
    problem: "起き上がるときに、ぐらっとする",
    fixes: ["rail"],
    wrong: {
      cane: "寝ている姿勢では、杖は使えない…",
      height: "ベッドの高さより、まず起き上がるときの支えが要りそう",
      rest: "休んでも、起き上がりのぐらつきは変わらない",
      train: "練習も大事。でも今すぐ安全に起きるには？",
    },
  },
  {
    id: "stand", name: "立ち上がる", icon: "🧍",
    problem: "立つときに、ひざに力が入りきらない",
    fixes: ["height", "rail"],
    wrong: {
      cane: "立ち上がる瞬間は、杖だけだと不安定…",
      rest: "休んでも、立ち上がりの力は変わらない",
      train: "練習も大事。でも今日できる工夫は？",
    },
  },
  {
    id: "walk", name: "トイレまで歩く", icon: "🚶",
    problem: "10歩ほどで息が切れて、ふらつく",
    fixes: ["cane", "rest"],
    wrong: {
      rail: "廊下ぜんぶに手すりはつけられない…",
      height: "歩くときの高さは関係なさそう",
      train: "練習も大事。でも今のからだで届く方法は？",
    },
  },
];

export const FIXES: { id: FixId; name: string; icon: string; desc: string }[] = [
  { id: "rail", name: "手すり", icon: "🤝", desc: "つかまる場所があると、起きる・立つが安定する" },
  { id: "cane", name: "杖", icon: "🦯", desc: "歩くときの支えが増えて、ふらつきにくくなる" },
  { id: "height", name: "ベッド・いすの高さ", icon: "📏", desc: "少し高いほうが、立ち上がるときの力が少なくてすむ" },
  { id: "rest", name: "とちゅうで休む", icon: "🪑", desc: "途中に座れる場所があると、息が切れても続けられる" },
  { id: "train", name: "練習する", icon: "💪", desc: "くり返すと力がついてくる。ただし時間がかかる" },
];

export function isFixCorrect(move: Move, fixId: FixId): boolean {
  return move.fixes.includes(fixId);
}

/** applied: moveId -> the fix the player successfully cleared that move
 * with. Success requires every move to be present AND to hold a fix that
 * is actually correct for it (mirrors the component: `applied[move.id]`
 * is only ever set via the `isFixCorrect` branch, never the wrong one). */
export function isAllCleared(applied: Record<string, FixId>, moves: Move[] = MOVES): boolean {
  return moves.every((m) => {
    const f = applied[m.id];
    return !!f && isFixCorrect(m, f);
  });
}
