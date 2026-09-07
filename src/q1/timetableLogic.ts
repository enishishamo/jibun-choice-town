// Pure rules for the event stage-manager Q1 (gameType: timetable).
// No React here, same pattern as labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ43/CA67 — "全演目を選択しても15時までに収まり、中心
// となる取捨選択や転換最適化をせず成功できる"): the original numbers let
// EVERY ordering of ALL 5 optional acts finish before the end time — even
// the worst possible (maximally alternating) changeover order still had
// slack. The whole point of the game (weigh which acts to keep, group
// same-setup acts to cut changeover time) was decorative: nothing the
// player did could ever cause failure once they'd added every act, so
// nothing they did could ever be WRONG either.
// Fix: shortened the available time so that even the BEST possible
// ordering of all 5 acts overflows -- at least one act must genuinely be
// cut. Which single act to cut now matters too: cutting the short "quiz"
// filler (leaving two 45+30/25+30 pairs of matching setups) only fits with
// a well-grouped order (worst-case ordering overflows by 5 minutes);
// cutting any other single act leaves enough slack to fit regardless of
// ordering. This mirrors a real scheduling insight -- a short filler slot
// can be more valuable as a changeover buffer than its own runtime
// suggests -- without inventing a mechanic beyond "read the numbers and
// try".
export interface Act {
  id: string;
  name: string;
  /** image filename (without extension/base path) -- the component
   * resolves this to an actual URL at render time via import.meta.env,
   * which doesn't exist outside a Vite build (e.g. when this module is
   * loaded directly by a Node-based QA script). */
  img: string;
  min: number;
  /** ステージの作り（バンド編成など）。変わると転換に時間がかかる */
  setup: "band" | "light" | "none";
  must?: boolean;
}

export const ACTS: Act[] = [
  { id: "open", name: "オープニング", img: "a_mc", min: 10, setup: "none", must: true },
  { id: "band", name: "バンド演奏", img: "a_musician", min: 45, setup: "band" },
  { id: "dance", name: "ダンスショー", img: "a_dancer", min: 30, setup: "light" },
  { id: "magic", name: "マジックショー", img: "a_magician", min: 25, setup: "light" },
  { id: "singer", name: "うたのステージ", img: "a_singer", min: 30, setup: "band" },
  { id: "quiz", name: "◯×クイズ", img: "a_mascot", min: 20, setup: "none" },
  { id: "end", name: "エンディング", img: "a_mc", min: 10, setup: "none", must: true },
];

export const START = 10 * 60; // 10:00
// 2026-09-07: was 15*60 (300min budget) -- enough slack that even the
// worst-case changeover order across all 5 acts fit. 13:40 (220min budget)
// sits below the best-case-all-5-acts total (230min), so at least one act
// must always be cut; see gameplay-qa-timetable.mjs for the exact bound.
export const END = 13 * 60 + 40; // 13:40 終演
export const SWAP = 15; // 作りが変わるときの転換
export const SAME = 5; // 同じ作りのままの転換

export const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

export interface ScheduleRow {
  act: Act;
  change: number;
  startAt: number;
  endAt: number;
}

/** Walk a lineup (act ids, in order) and compute each row's changeover +
 * start/end time, plus the overall finish time. Pure function of the
 * lineup order -- the same ids in a different order can produce a
 * different (better or worse) finish time, since changeover cost depends
 * on whether consecutive acts share a stage setup. */
export function computeSchedule(line: string[]): { rows: ScheduleRow[]; finish: number } {
  const acts = line.map((id) => ACTS.find((a) => a.id === id)!);
  let t = START;
  const rows = acts.map((a, i) => {
    const prev = i > 0 ? acts[i - 1] : null;
    const change = prev ? (prev.setup === a.setup ? SAME : SWAP) : 0;
    const startAt = t + change;
    t = startAt + a.min;
    return { act: a, change, startAt, endAt: t };
  });
  return { rows, finish: t };
}
