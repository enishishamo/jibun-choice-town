// Pure rules for the doctor Q1 (gameType: sow_and_grow), redesigned per
// factory/projects/legacy-sow-and-grow (GAME_TRANSLATION_REBUILD,
// t1-season-deadline-match). Same pattern as clueJoinLogic.ts/labCheckLogic.ts:
// no React here.
//
// The old implementation (src/q1/FarmGame.tsx, superseded) had a fixed
// month/deadline/forecast every playthrough, so the result was fully
// determined by which of 3 varieties the child picked once (memorize
// exploit, per factory/state/legacy/reverse-audits/sow_and_grow.json).
// This module mirrors factory/projects/legacy-sow-and-grow/design/design-sim.mjs
// exactly (VARIETIES/evaluate/newSession) -- that script is this mechanic's
// design-stage exploit simulation and regression test; keep them in sync.
export interface Variety {
  id: string;
  name: string;
  window: number[];
  harvestDays: number;
  heatOk: boolean;
}

// All three are summer-sowing (June-September) candidates with genuine
// speed/heat-tolerance trade-offs (design review r2 repair -- see
// design-sim.mjs's header comment for why a strict dominance ordering was
// rejected). Exact day-counts/heat-tolerance are fictionalized teaching
// data (factory/projects/legacy-sow-and-grow/design/fact_sheet_v4.json's
// uncertainties) -- only the early/late sowing-timing pattern and 向陽二号's
// (→まんまる's) heat tolerance are grounded in the real 福井県 trial.
export const VARIETIES: Variety[] = [
  { id: "tsubutane", name: "つぶたね", window: [6, 7], harvestDays: 90, heatOk: false },
  { id: "manmaru", name: "まんまる", window: [6, 7, 8], harvestDays: 150, heatOk: true },
  { id: "kotone", name: "ことね", window: [8, 9], harvestDays: 105, heatOk: false },
];
export const VARIETY_IDS = VARIETIES.map((v) => v.id);

export const MONTHS = [6, 7, 8, 9];
export const OFFSETS = [3, 4, 5];
const MAX_RESAMPLES = 200;

function inWindow(month: number, window: number[]): boolean {
  return window.includes(month);
}
function monthsNeeded(days: number): number {
  return Math.ceil(days / 30);
}

export interface EvalResult { seasonOk: boolean; timeOk: boolean; heatOk: boolean; win: boolean }

export function evaluate(variety: Variety, sowMonth: number, deadlineOffsetMonths: number, forecastHot: boolean): EvalResult {
  const seasonOk = inWindow(sowMonth, variety.window);
  const timeOk = monthsNeeded(variety.harvestDays) <= deadlineOffsetMonths;
  const heatOk = !forecastHot || variety.heatOk;
  return { seasonOk, timeOk, heatOk, win: seasonOk && timeOk && heatOk };
}

export function isWinningAttempt(varietyId: string, sowMonth: number, deadlineOffsetMonths: number, forecastHot: boolean): boolean {
  const v = VARIETIES.find((x) => x.id === varietyId);
  return !!v && evaluate(v, sowMonth, deadlineOffsetMonths, forecastHot).win;
}

function winnersFor(sowMonth: number, deadlineOffsetMonths: number, forecastHot: boolean): string[] {
  return VARIETIES.filter((v) => evaluate(v, sowMonth, deadlineOffsetMonths, forecastHot).win).map((v) => v.id);
}

// exhaustive per-month accepted-state enumeration (mirrors design-sim.mjs's
// stateSpace) -- used only for the deterministic rejection-sampling
// fallback below, never for scoring itself.
const STATE_SPACE: Record<number, { offset: number; forecastHot: boolean }[]> = {};
for (const m of MONTHS) {
  STATE_SPACE[m] = [];
  for (const o of OFFSETS) {
    for (const f of [false, true]) {
      if (winnersFor(m, o, f).length > 0) STATE_SPACE[m].push({ offset: o, forecastHot: f });
    }
  }
}

export interface Session { sowMonth: number; deadlineOffsetMonths: number; forecastHot: boolean }

/** Per-session generator: sowMonth is drawn once (it represents "today", a
 * real fact that should not be silently re-rolled); deadlineOffsetMonths
 * and forecastHot are rejection-sampled until a winning variety exists,
 * guaranteeing every session is solvable. Falls back to a pre-enumerated
 * valid state if MAX_RESAMPLES is ever exhausted (never throws). */
export function newSession(rand: () => number = Math.random): Session {
  const sowMonth = MONTHS[Math.floor(rand() * MONTHS.length)];
  for (let i = 0; i < MAX_RESAMPLES; i++) {
    const deadlineOffsetMonths = OFFSETS[Math.floor(rand() * OFFSETS.length)];
    const forecastHot = rand() < 0.5;
    if (winnersFor(sowMonth, deadlineOffsetMonths, forecastHot).length > 0) return { sowMonth, deadlineOffsetMonths, forecastHot };
  }
  const fallback = STATE_SPACE[sowMonth][0];
  return { sowMonth, deadlineOffsetMonths: fallback.offset, forecastHot: fallback.forecastHot };
}

// per-session shuffle: independent random permutation of the variety
// display order, fixed for the whole session (mirrors clueBoardLogic.ts
// shuffledVitals / clueJoinLogic.ts shuffledIds -- shuffle once per mount,
// id-based scoring only, never position-based).
export function shuffledIds(ids: string[], rand: () => number = Math.random): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
