// Pure rules for the event-planner Q1 (gameType: plan_mix).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass): this file replaces numbers/rules that used to live only
// inline inside PlanEventGame.tsx, so factory/harness/gameplay-qa-plan-
// mix.mjs can drive the win/lose logic directly with Node instead of
// relying on a one-time manual read of the component.
//
// `img` stores only the bare filename (no import.meta.env.BASE_URL
// resolution) -- same convention as timetableLogic.ts's Act.img -- so this
// module has zero Vite/DOM dependencies and can be imported by a plain
// Node script. The component resolves it to a real URL via its own P().
export interface Idea {
  id: string;
  name: string;
  img: string;
  minutes: number;
  /** 会場条件に引っかかる場合の理由（資料に書いてある）。真なら選べない。 */
  blocked?: string;
  forKids: number; // 小さい子も楽しめる 0-2
  forAdults: number; // 大人も楽しめる 0-2
  note: string;
}

export const IDEAS: Idea[] = [
  { id: "band", name: "バンド演奏", img: "a_musician", minutes: 60, forKids: 1, forAdults: 2, note: "音が大きい。ステージが必要。" },
  { id: "dance", name: "ダンスショー", img: "a_dancer", minutes: 40, forKids: 2, forAdults: 1, note: "見ていて楽しい。ステージが必要。" },
  { id: "magic", name: "マジックショー", img: "a_magician", minutes: 30, forKids: 2, forAdults: 2, note: "近くで見ると盛り上がる。" },
  { id: "mascot", name: "マスコットと写真", img: "a_mascot", minutes: 30, forKids: 2, forAdults: 0, note: "小さい子に人気。" },
  { id: "food", name: "キッチンカー", img: "p_booth_food", minutes: 0, forKids: 1, forAdults: 2, note: "ずっと出ている。休けいにもなる。" },
  { id: "goods", name: "手づくり市（物販）", img: "p_booth_goods", minutes: 0, forKids: 0, forAdults: 2, note: "ずっと出ている。" },
  {
    id: "fire",
    name: "キャンプファイヤー",
    img: "p_flag",
    minutes: 40,
    forKids: 1,
    forAdults: 1,
    blocked: "この広場は火を使えない決まりだった…",
    note: "夜にもりあがる。",
  },
];

export const STAGE_MINUTES = 150; // ステージで使える時間（10:00-16:00のうち）
export const MIN_KIDS_SCORE = 3; // 「小さい子も楽しめる」の合格ライン

export function isBlocked(idea: Idea): boolean {
  return !!idea.blocked;
}

function pickedIdeas(pickedIds: string[], ideas: Idea[] = IDEAS): Idea[] {
  return ideas.filter((i) => pickedIds.includes(i.id));
}

export function totalMinutes(pickedIds: string[], ideas: Idea[] = IDEAS): number {
  return pickedIdeas(pickedIds, ideas).reduce((a, i) => a + i.minutes, 0);
}

export function totalKids(pickedIds: string[], ideas: Idea[] = IDEAS): number {
  return pickedIdeas(pickedIds, ideas).reduce((a, i) => a + i.forKids, 0);
}

export function totalAdults(pickedIds: string[], ideas: Idea[] = IDEAS): number {
  return pickedIdeas(pickedIds, ideas).reduce((a, i) => a + i.forAdults, 0);
}

/** at least one all-day stall (minutes === 0) is picked. */
export function hasAllDayIdea(pickedIds: string[], ideas: Idea[] = IDEAS): boolean {
  return pickedIdeas(pickedIds, ideas).some((i) => i.minutes === 0);
}

/** Success = fits the stage-time budget, is genuinely kid-friendly, and
 * has at least one always-on stall so there's something during downtime.
 * Matches PlanEventGame's three sequential checks exactly (over-time /
 * not-enough-for-kids / no-all-day-stall), just expressed as one pure
 * predicate instead of three early-return button handlers. */
export function isSuccess(pickedIds: string[], ideas: Idea[] = IDEAS): boolean {
  if (pickedIds.length === 0) return false;
  return (
    totalMinutes(pickedIds, ideas) <= STAGE_MINUTES &&
    totalKids(pickedIds, ideas) >= MIN_KIDS_SCORE &&
    hasAllDayIdea(pickedIds, ideas)
  );
}
