// Pure rules for the 3 Q1 games of the game-studio world
// (「たまに止まる」の犯人さがし). No React: drives components AND
// factory/harness/gameplay-qa-studio.mjs.
// Facts grounding: factory/projects/game-studio/research.result.json
//   - QA: shortest repro = change ONE condition at a time; a bug report needs
//     steps/frequency, "たまに止まる" alone is bounced
//   - planner: don't just nerf HP — read WHERE players fail and why; matching
//     the fix to the diagnosed cause is the skill
//   - UI: contrast, never color-alone, prioritize what's needed NOW (adding
//     everything clutters the screen)

// =============================== bug_repro ==================================
export type Cond = "after_save" | "net_off" | "item_used" | "cave_area";
export const CONDS: Cond[] = ["after_save", "net_off", "item_used", "cave_area"];
export const RUN_BUDGET = 6;
export const REPRO_MISTAKE_LIMIT = 2;

export interface BugCase {
  /** the crash needs BOTH of these conditions (order-free pair) */
  pair: [Cond, Cond];
}
export function newBugCase(rand: () => number = Math.random): BugCase {
  const a = Math.floor(rand() * 4);
  let b = Math.floor(rand() * 3);
  if (b >= a) b += 1;
  return { pair: [CONDS[a], CONDS[b]] };
}
export function crashes(c: BugCase, conds: Cond[]): boolean {
  return c.pair.every((x) => conds.includes(x));
}

export interface ReproState {
  c: BugCase;
  runs: { conds: Cond[]; crashed: boolean }[];
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}
export function newReproState(rand: () => number = Math.random): ReproState {
  return { c: newBugCase(rand), runs: [], mistakes: 0, outcome: "open" };
}
export function reproRun(s: ReproState, conds: Cond[]): ReproState {
  if (s.outcome !== "open") return s;
  const st = { ...s, runs: [...s.runs] };
  delete st.refusal;
  if (s.runs.length >= RUN_BUDGET) return { ...s, refusal: "テスト機の予約時間が、終わってしまった。" };
  st.runs.push({ conds: [...conds].sort(), crashed: crashes(s.c, conds) });
  return st;
}
/** filing the report: the pair must be exact, minimal, and reproduced at least
 * once on the test bench (no guessing a pair you never ran). */
export function reproFile(
  s: ReproState,
  conds: Cond[],
): { state: ReproState; exact: boolean; reproduced: boolean; minimal: boolean } {
  const set = [...conds].sort();
  const exact = set.length === 2 && s.c.pair.every((x) => set.includes(x));
  const minimal = set.length <= 2;
  // the shortest repro must have been confirmed ON ITS OWN on the bench
  const reproduced = s.runs.some((r) => r.crashed && r.conds.length === set.length && set.every((x) => r.conds.includes(x)));
  if (s.outcome !== "open") return { state: s, exact, reproduced, minimal };
  if (conds.length === 0) {
    return { state: { ...s, refusal: "票の「発生手順」欄が、空っぽのままだ。" }, exact, reproduced, minimal };
  }
  if (!s.runs.some((r) => r.crashed)) {
    return { state: { ...s, refusal: "まだ一度も、この目で💥を見ていない。" }, exact, reproduced, minimal };
  }
  if (exact && reproduced) return { state: { ...s, outcome: "done" }, exact, reproduced, minimal };
  const mistakes = s.mistakes + 1;
  return {
    state: { ...s, mistakes, outcome: mistakes >= REPRO_MISTAKE_LIMIT ? "mentor_fail" : "open" },
    exact,
    reproduced,
    minimal,
  };
}

// ============================= difficulty_tune ==============================
export type Cause = "no_telegraph" | "lost_path" | "enemy_hp" | "confusing_controls";
export type Fix = "add_telegraph" | "add_signpost" | "lower_hp" | "remap_buttons";
export const TUNE_STAGES = 2;
export const TUNE_MISTAKE_LIMIT = 2;

export interface StageLog {
  id: string;
  name: string;
  cause: Cause;
  /** evidence lines shown to the player (derived from cause, honest) */
  clearRate: number; // %
  deathsBeforeAttack: boolean; // die before the boss even attacks? -> telegraph
  wanderTime: boolean; // long wandering -> signpost
  quitAtMenu: boolean; // quits during button config -> controls
}
export const FIX_FOR: Record<Cause, Fix> = {
  no_telegraph: "add_telegraph",
  lost_path: "add_signpost",
  enemy_hp: "lower_hp",
  confusing_controls: "remap_buttons",
};
export function newTuneStages(rand: () => number = Math.random): StageLog[] {
  const causes: Cause[] = ["no_telegraph", "lost_path", "enemy_hp", "confusing_controls"];
  // pick 2 distinct causes; enemy_hp appears at most once so the novice
  // "always nerf HP" answer cannot be right twice
  const a = causes[Math.floor(rand() * 4)];
  let b = a;
  while (b === a) b = causes[Math.floor(rand() * 4)];
  const names = ["どうくつステージ", "空中庭園ステージ"];
  return [a, b].map((cause, i) => ({
    id: `S${i + 1}`,
    name: names[i],
    cause,
    clearRate: 18 + Math.floor(rand() * 10),
    deathsBeforeAttack: cause === "no_telegraph",
    wanderTime: cause === "lost_path",
    quitAtMenu: cause === "confusing_controls",
  }));
}

export interface TuneState {
  stages: StageLog[];
  idx: number;
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newTuneState(rand: () => number = Math.random): TuneState {
  return { stages: newTuneStages(rand), idx: 0, mistakes: 0, outcome: "open" };
}
export function tuneAct(s: TuneState, fix: Fix): { state: TuneState; correct: Fix; ok: boolean } {
  const stage = s.stages[s.idx];
  const correct = FIX_FOR[stage.cause];
  if (s.outcome !== "open") return { state: s, correct, ok: false };
  const ok = fix === correct;
  const st = { ...s };
  if (!ok) {
    st.mistakes += 1;
    if (st.mistakes >= TUNE_MISTAKE_LIMIT) {
      st.outcome = "mentor_fail";
      return { state: st, correct, ok };
    }
    // the retest numbers do NOT move — the stage stays on the board
    return { state: st, correct, ok };
  }
  st.idx += 1;
  if (st.idx >= TUNE_STAGES) st.outcome = "done";
  return { state: st, correct, ok };
}

// ================================ ui_clarity ================================
export type UiFixId =
  | "separate_buttons" // report: 誤操作 (attack next to confirm)
  | "shape_enemy_mark" // report: 色だけで敵味方
  | "bigger_hp_text" // report: 文字が小さい
  | "cooldown_ring" // report: 技がいつ使えるか分からない
  | "dim_background" // report: 背景がまぶしくて弾が見えない
  | "flashy_anim" // decoy: worsens clutter
  | "show_everything" // decoy: worsens clutter
  | "recolor_only"; // decoy: still color-alone
export const UI_DECOYS: UiFixId[] = ["flashy_anim", "show_everything", "recolor_only"];
export const UI_PICK_LIMIT = 3;
export const UI_MISTAKE_LIMIT = 2;

export type UiReportId = "misstap" | "color_only" | "tiny_text" | "no_cooldown" | "glare";
export interface UiReport {
  id: UiReportId;
  fix: UiFixId;
}
export const UI_REPORT_POOL: UiReport[] = [
  { id: "misstap", fix: "separate_buttons" },
  { id: "color_only", fix: "shape_enemy_mark" },
  { id: "tiny_text", fix: "bigger_hp_text" },
  { id: "no_cooldown", fix: "cooldown_ring" },
  { id: "glare", fix: "dim_background" },
];

export interface UiCase {
  /** 3 of the 5 test reports, randomized per case */
  reports: UiReport[];
}
export function newUiCase(rand: () => number = Math.random): UiCase {
  const pool = [...UI_REPORT_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { reports: pool.slice(0, 3) };
}

export interface UiState {
  c: UiCase;
  picked: UiFixId[];
  redos: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}
export function newUiState(rand: () => number = Math.random): UiState {
  return { c: newUiCase(rand), picked: [], redos: 0, outcome: "open" };
}
export function uiToggle(s: UiState, id: UiFixId): UiState {
  if (s.outcome !== "open") return s;
  const st = { ...s, picked: [...s.picked] };
  delete st.refusal;
  if (st.picked.includes(id)) {
    st.picked = st.picked.filter((x) => x !== id);
    return st;
  }
  if (st.picked.length >= UI_PICK_LIMIT) {
    return { ...s, refusal: "画面がもう、いっぱいだ。（直しは3つまで）" };
  }
  st.picked.push(id);
  return st;
}
export type UiProblem = "unfixed_report" | "decoy_included" | null;
export function uiValidate(s: UiState): UiProblem {
  if (s.picked.some((p) => UI_DECOYS.includes(p))) return "decoy_included";
  if (!s.c.reports.every((r) => s.picked.includes(r.fix))) return "unfixed_report";
  return null;
}
/** WHERE hint: the first unanswered report, or the first decoy picked. */
export function uiFault(s: UiState): { kind: "decoy"; fix: UiFixId } | { kind: "report"; report: UiReportId } | null {
  const decoy = s.picked.find((p) => UI_DECOYS.includes(p));
  if (decoy) return { kind: "decoy", fix: decoy };
  const missing = s.c.reports.find((r) => !s.picked.includes(r.fix));
  if (missing) return { kind: "report", report: missing.id };
  return null;
}
export function uiServe(s: UiState): { state: UiState; problem: UiProblem } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = uiValidate(s);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem };
  const redos = s.redos + 1;
  return { state: { ...s, redos, outcome: redos >= UI_MISTAKE_LIMIT ? "mentor_fail" : "open" }, problem };
}
