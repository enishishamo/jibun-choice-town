// Pure rules for the 4 Q1 games of the waste world (「ごみのゆくえ」).
// No React: these functions drive the components AND the automated gameplay QA
// (factory/harness/gameplay-qa-waste.mjs runs this file directly with Node).
// Facts grounding: factory/projects/waste/research.result.json
//   - hazard items (spray cans / lithium batteries) can ignite in trucks
//   - stable combustion needs mixing wet/dry pit waste; ~850C guards dioxin
//   - alerts must be triaged: real rise vs instrument fault vs chemical outage
//   - remaining landfill years = remaining capacity / annual landfill volume

// ============================== curb_check ==================================
// Collection crew: judge each curbside bag — load it, or leave it with the
// correct violation sticker. Bags are random; the rules are the C.

export type DayType = "burnable" | "plastic";
export type BagTruth = "ok" | "wrong_type" | "hazard" | "wrong_bag";
export type CurbAction = "load" | "reject_wrong_type" | "reject_hazard" | "reject_wrong_bag";

export interface Bag {
  id: number;
  truth: BagTruth;
  /** what the child can SEE through the bag (emoji + hints) */
  look: { bagStyle: "designated" | "black" | "designated_torn"; items: string[]; hint: string };
}

export const CURB_MISTAKE_LIMIT = 2; // 2nd mistake ends the shift (collection halts)

// What counts as OK depends on TODAY'S collection category — the rule card
// must be read each run (the category is randomized per play).
const OK_ITEMS: Record<DayType, string[][]> = {
  burnable: [["🍌", "🥬", "🍂"], ["🧻", "🍞", "🍂"], ["🥕", "🍎", "🧻"], ["🍃", "🍙", "🧻"]],
  plastic: [["🥤", "🍱", "🛍️"], ["🥤", "🥡", "🛍️"], ["🍱", "🥡", "🥤"]],
};
const WRONG_TYPE_ITEMS: Record<DayType, { items: string[]; hint: string }[]> = {
  burnable: [
    { items: ["🍾", "🍌", "🧻"], hint: "袋の中に、ビンのようなものが見える" },
    { items: ["🥫", "🥬", "🍂"], hint: "カンのかたい影が見える" },
    { items: ["🥤", "🍱", "🛍️"], hint: "プラの容器がそろって見える" },
  ],
  plastic: [
    { items: ["🍌", "🥬", "🍂"], hint: "やわらかい生ものらしき影が見える" },
    { items: ["🥫", "🥤", "🛍️"], hint: "カンのかたい影がまざって見える" },
    { items: ["🍾", "🥤", "🥡"], hint: "ビンのようなものがまざって見える" },
  ],
};
const HAZARD_ITEMS = [
  { items: ["🧴", "🍂", "🧻"], hint: "細長い金属の缶が見える" },
  { items: ["🔋", "🍌", "🧻"], hint: "小さな四角いかたまりと配線らしき影が見える" },
];

export function pickDayType(rand: () => number = Math.random): DayType {
  return rand() < 0.5 ? "burnable" : "plastic";
}

export function makeBags(rand: () => number = Math.random, day: DayType = "burnable"): Bag[] {
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const bags: Bag[] = [];
  // 6 bags: violations 2-3 (hazard 0-2), rest ok — with the mistake budget of
  // 1, blindly loading everything can never complete a set (C_required per case)
  const nViol = 2 + Math.floor(rand() * 2);
  const truths: BagTruth[] = [];
  for (let i = 0; i < nViol; i++) {
    const r = rand();
    truths.push(r < 0.4 ? "hazard" : r < 0.75 ? "wrong_type" : "wrong_bag");
  }
  while (truths.filter((t) => t === "hazard").length > 2) truths[truths.indexOf("hazard")] = "wrong_type";
  while (truths.length < 6) truths.push("ok");
  // shuffle
  for (let i = truths.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [truths[i], truths[j]] = [truths[j], truths[i]];
  }
  truths.forEach((truth, i) => {
    if (truth === "ok") bags.push({ id: i, truth, look: { bagStyle: "designated", items: pick(OK_ITEMS[day]), hint: day === "burnable" ? "やわらかい燃やせるものだけに見える" : "プラの容器だけに見える" } });
    else if (truth === "wrong_type") { const w = pick(WRONG_TYPE_ITEMS[day]); bags.push({ id: i, truth, look: { bagStyle: "designated", items: w.items, hint: w.hint } }); }
    else if (truth === "hazard") { const h = pick(HAZARD_ITEMS); bags.push({ id: i, truth, look: { bagStyle: "designated", items: h.items, hint: h.hint } }); }
    else bags.push({ id: i, truth, look: { bagStyle: "black", items: pick(OK_ITEMS[day]), hint: "中身はよさそうだが、袋がまちの指定袋ではない" } });
  });
  return bags;
}

export type CurbResult = "correct" | "mistake" | "fire";

/** Judge one action. Loading a hazard bag is an immediate truck fire (fail). */
export function judgeBag(bag: Bag, action: CurbAction): CurbResult {
  if (action === "load") {
    if (bag.truth === "hazard") return "fire";
    return bag.truth === "ok" ? "correct" : "mistake";
  }
  const map: Record<Exclude<CurbAction, "load">, BagTruth> = {
    reject_wrong_type: "wrong_type",
    reject_hazard: "hazard",
    reject_wrong_bag: "wrong_bag",
  };
  return map[action] === bag.truth ? "correct" : "mistake";
}

// ============================== pit_crane ===================================
// Incinerator operator: keep the furnace in the safe band for 8 turns by
// choosing WHAT to feed (grab a cell) or preparing fuel (mix wet+dry).

export type CellType = "dry" | "wet" | "mixed" | "empty";
export interface PitState {
  grid: CellType[]; // 9 cells, 3x3
  temp: number;
  tempMin: number; // stability tracking (mastery evaluation)
  tempMax: number;
  turn: number; // 1-based; game ends after TURNS
  lowStreak: number;
  deliveries: { turn: number; cells: { idx: number; type: CellType }[] }[];
}
export const PIT_TURNS = 8;
export const TEMP_MIN = 850;
export const TEMP_MAX = 1000; // reaching this damages the furnace (fail)
export const TEMP_CAUTION = 950; // above this = caution zone (allowed, but graded)

/** Mastery: stayed inside the aim band the whole run, small swing. */
export function pitStability(s: PitState): "perfect" | "good" {
  return s.tempMax <= TEMP_CAUTION && s.tempMax - s.tempMin <= 130 ? "perfect" : "good";
}
export const TEMP_START = 900;
export const TEMP_EFFECT: Record<Exclude<CellType, "empty">, number> = { dry: 80, mixed: 30, wet: -60 };
export const TEMP_IDLE = -70; // feeding nothing starves the furnace

export function newPit(rand: () => number = Math.random): PitState {
  // guarantee a workable mix: 4 dry, 3 wet, 2 mixed shuffled
  const grid: CellType[] = ["dry", "dry", "dry", "dry", "wet", "wet", "wet", "mixed", "mixed"];
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  // deliveries on 2 random mid-game turns drop wet (mostly) into empty cells
  const dTurns = [3 + Math.floor(rand() * 2), 5 + Math.floor(rand() * 3)];
  const deliveries = dTurns.map((turn) => ({
    turn,
    cells: [
      { idx: -1, type: (rand() < 0.75 ? "wet" : "dry") as CellType },
      { idx: -1, type: (rand() < 0.6 ? "wet" : "dry") as CellType },
    ],
  }));
  return { grid, temp: TEMP_START, tempMin: TEMP_START, tempMax: TEMP_START, turn: 1, lowStreak: 0, deliveries };
}

export type PitAction = { kind: "grab"; idx: number } | { kind: "mix"; a: number; b: number } | { kind: "wait" };

export function adjacent(a: number, b: number): boolean {
  const ax = a % 3, ay = Math.floor(a / 3), bx = b % 3, by = Math.floor(b / 3);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export interface PitStep {
  state: PitState;
  event: "ok" | "invalid" | "overheat_fail" | "cold_fail" | "cleared";
  note: string;
}

export function pitStep(s: PitState, action: PitAction, rand: () => number = Math.random): PitStep {
  const st: PitState = { ...s, grid: [...s.grid] };
  let delta = TEMP_IDLE;
  let note = "";
  if (action.kind === "grab") {
    const t = st.grid[action.idx];
    if (!t || t === "empty") return { state: s, event: "invalid", note: "そこには、つかめるごみがない。" };
    delta = TEMP_EFFECT[t];
    st.grid[action.idx] = "empty";
    note = t === "dry" ? "かわいたごみ。よく燃える！" : t === "wet" ? "水分の多いごみ…炉の温度が下がる。" : "まぜたごみ。安定して燃える。";
  } else if (action.kind === "mix") {
    const ta = st.grid[action.a], tb = st.grid[action.b];
    const pair = [ta, tb].sort().join("+");
    if (!adjacent(action.a, action.b) || pair !== "dry+wet") {
      return { state: s, event: "invalid", note: "まぜられるのは、となり合った「かわき」と「しめり」。" };
    }
    st.grid[action.a] = "mixed";
    st.grid[action.b] = "mixed";
    delta = TEMP_IDLE; // mixing takes the turn: nothing is fed
    note = "クレーンで撹拌した。2つが「まぜたごみ」になった（このターンは投入なし）。";
  } else {
    note = "このターンは何も投入しなかった。炉が冷えていく…";
  }
  st.temp = Math.round(st.temp + delta);
  st.tempMin = Math.min(st.tempMin, st.temp);
  st.tempMax = Math.max(st.tempMax, st.temp);
  // deliveries land after the action
  const d = st.deliveries.find((x) => x.turn === st.turn);
  if (d) {
    for (const c of d.cells) {
      const empties = st.grid.map((t, i) => (t === "empty" ? i : -1)).filter((i) => i >= 0);
      if (!empties.length) break;
      const idx = empties[Math.floor(rand() * empties.length)];
      st.grid[idx] = c.type;
    }
    note += " 収集車が新しいごみを運んできた。";
  }
  if (st.temp >= TEMP_MAX) return { state: st, event: "overheat_fail", note: note + " 温度が上がりすぎて炉を傷めてしまった。" };
  st.lowStreak = st.temp < TEMP_MIN ? st.lowStreak + 1 : 0;
  if (st.lowStreak >= 2) return { state: st, event: "cold_fail", note: note + " 850℃を保てず、炉を止めることになった。" };
  st.turn += 1;
  if (st.turn > PIT_TURNS) return { state: st, event: "cleared", note };
  return { state: st, event: "ok", note };
}

// ============================== gas_watch ===================================
// Emissions watcher: an alert fires; inspect (each costs time), identify the
// real cause, take ONE action before time runs out.

export type GasCause = "chemical_out" | "sensor_drift" | "incomplete_burn";
export type GasCheck = "tank" | "calib" | "furnace" | "filter";
export type GasAction = "refill" | "recalib" | "notify_operator" | "stop_furnace";
export const GAS_TIME = 4; // max 3 inspections + the one-shot request

export interface GasCase {
  cause: GasCause;
  alertMeter: "HCl" | "CO";
}

export function newGasCase(rand: () => number = Math.random): GasCase {
  const causes: GasCause[] = ["chemical_out", "sensor_drift", "incomplete_burn"];
  const cause = causes[Math.floor(rand() * causes.length)];
  const alertMeter = cause === "chemical_out" ? "HCl" : cause === "incomplete_burn" ? "CO" : rand() < 0.5 ? "HCl" : "CO";
  return { cause, alertMeter };
}

/** Evidence text a check reveals for the current case (deterministic per cause). */
export function inspect(c: GasCase, check: GasCheck): { text: string; pointsTo: GasCause | null } {
  const E: Record<GasCause, Record<GasCheck, { text: string; pointsTo: GasCause | null }>> = {
    chemical_out: {
      tank: { text: "薬剤タンクの残りが、ほとんど空だ！", pointsTo: "chemical_out" },
      calib: { text: "計器の校正記録は先週済み。計器は信じてよさそう。", pointsTo: null },
      furnace: { text: "炉の燃焼は安定している。", pointsTo: null },
      filter: { text: "バグフィルタの差圧はふだん通り。", pointsTo: null },
    },
    sensor_drift: {
      tank: { text: "薬剤タンクは十分に残っている。", pointsTo: null },
      calib: { text: "この計器、校正の期限が切れている！ほかの計器は正常値だ。", pointsTo: "sensor_drift" },
      furnace: { text: "炉の燃焼は安定している。", pointsTo: null },
      filter: { text: "バグフィルタの差圧はふだん通り。", pointsTo: null },
    },
    incomplete_burn: {
      tank: { text: "薬剤タンクは十分に残っている。", pointsTo: null },
      calib: { text: "校正記録は問題なし。計器は本当の値を示していそうだ。", pointsTo: null },
      furnace: { text: "炉の温度が下がり気味で、燃え方にムラがある！", pointsTo: "incomplete_burn" },
      filter: { text: "差圧はふだんの範囲（ばいじん確認のための参考情報）。", pointsTo: null },
    },
  };
  return E[c.cause][check];
}

export interface GasState {
  c: GasCase;
  time: number; // slots left; an inspection costs 1; the final request needs 1
  evidence: { check: GasCheck; text: string; pointsTo: GasCause | null }[];
  outcome: "open" | "solved" | "failed_wrong_request" | "failed_no_time";
}

export function newGasState(rand: () => number = Math.random): GasState {
  return { c: newGasCase(rand), time: GAS_TIME, evidence: [], outcome: "open" };
}

export function gasInspect(s: GasState, check: GasCheck): GasState {
  if (s.outcome !== "open" || s.time <= 1) return s; // must keep 1 slot for the request
  if (s.evidence.some((e) => e.check === check)) return s;
  const r = inspect(s.c, check);
  return { ...s, time: s.time - 1, evidence: [...s.evidence, { check, ...r }] };
}

/** The one-shot request. A wrong request spends the remaining time on the
 * wrong fix while the real cause keeps worsening toward the stack. */
export function gasRequest(s: GasState, a: GasAction): GasState {
  if (s.outcome !== "open") return s;
  if (gasActionCorrect(s.c, a)) return { ...s, time: s.time - 1, outcome: "solved" };
  return { ...s, time: 0, outcome: "failed_wrong_request" };
}

export function gasActionCorrect(c: GasCase, a: GasAction): boolean {
  // stop_furnace is always the panic overreaction — never the right first move
  return (
    (c.cause === "chemical_out" && a === "refill") ||
    (c.cause === "sensor_drift" && a === "recalib") ||
    (c.cause === "incomplete_burn" && a === "notify_operator")
  );
}

// ============================== landfill_ops ================================
// Landfill manager: run the site for 5 days. Daily cover is a DUTY, not a
// tactic: every cell you worked today must be re-covered at night (opening a
// covered cell to keep filling exposes it). Covers persist on untouched cells.
// This week's cover-material delivery was delayed, so on heavy days there may
// not be enough — then the manager must choose which face stays exposed,
// reading the night's weather (rain -> leachate, wind -> scatter complaints).
// Grounding (research): 受入・埋立区画・即日覆土（飛散/におい/雨水対策）・浸出水処理.
// NOTE: 「灰と不燃は別区画」はこの施設の受入区分ルールとしてゲーム内資料に明示
// （研究の受入基準・区画管理を子ども向けに単純化した施設固有ルール）。

export const LF_DAYS = 5;
export const LF_CELLS = 3;
export const LF_CELL_CAP = 5;
export const LF_SOIL = 7; // cover material for the whole week
export const LF_TANK_CAP = 6;
export const LF_TANK_DRAIN = 1;
export const LF_WATER_PER_CELL = 2; // per EXPOSED dirty cell on a rain night
export const LF_COMPLAINT_LIMIT = 3;
export type LfWeather = "rain" | "wind" | "calm";
export type LfLoad = "ash" | "incomb";

export interface LandfillState {
  day: number;
  fill: number[];
  cellType: (LfLoad | null)[];
  covered: boolean[]; // persists; working a cell re-opens it
  soil: number;
  tank: number;
  complaints: number;
  schedule: LfLoad[][];
  weather: LfWeather[];
  placedToday: number;
}

export function newLandfill(rand: () => number = Math.random): LandfillState {
  const counts: number[] = [];
  let total = 0;
  for (let d = 0; d < LF_DAYS; d++) {
    const n = 2 + (rand() < 0.35 ? 1 : 0);
    counts.push(n);
    total += n;
  }
  while (total > 10) {
    const i = counts.findIndex((n) => n > 2);
    if (i < 0) break;
    counts[i] -= 1;
    total -= 1;
  }
  const nAsh = Math.min(6, Math.max(5, Math.round(total * 0.55)));
  const types: LfLoad[] = [...Array(nAsh).fill("ash" as LfLoad), ...Array(total - nAsh).fill("incomb" as LfLoad)];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  const schedule: LfLoad[][] = [];
  let k = 0;
  for (const n of counts) {
    schedule.push(types.slice(k, k + n));
    k += n;
  }
  const weather: LfWeather[] = Array.from({ length: LF_DAYS }, () => {
    const r = rand();
    return r < 0.35 ? "rain" : r < 0.65 ? "wind" : "calm";
  });
  if (!weather.includes("rain")) weather[1 + Math.floor(rand() * (LF_DAYS - 1))] = "rain";
  while (weather.filter((w) => w === "rain").length > 3) weather[weather.indexOf("rain")] = "calm";
  while (weather.filter((w) => w !== "calm").length > 4) weather[weather.indexOf("wind")] = "calm";
  return {
    day: 1, fill: [0, 0, 0], cellType: [null, null, null], covered: [true, true, true],
    soil: LF_SOIL, tank: 0, complaints: 0, schedule, weather, placedToday: 0,
  };
}

export type LfPlaceResult = "ok" | "cell_full" | "type_mismatch" | "no_space_fail" | "done_today";

export function lfNextLoad(s: LandfillState): LfLoad | null {
  const todays = s.schedule[s.day - 1];
  return s.placedToday < todays.length ? todays[s.placedToday] : null;
}

export function lfCellAccepts(s: LandfillState, cell: number, load: LfLoad): boolean {
  if (s.fill[cell] >= LF_CELL_CAP) return false;
  return s.cellType[cell] === null || s.cellType[cell] === load;
}

/** Place the next load. Working a covered cell RE-OPENS it (cover comes off). */
export function lfPlace(s: LandfillState, cell: number): { state: LandfillState; result: LfPlaceResult } {
  const load = lfNextLoad(s);
  if (!load) return { state: s, result: "done_today" };
  if (s.fill[cell] >= LF_CELL_CAP) {
    if (![0, 1, 2].some((i) => lfCellAccepts(s, i, load))) return { state: s, result: "no_space_fail" };
    return { state: s, result: "cell_full" };
  }
  if (!lfCellAccepts(s, cell, load)) {
    if (![0, 1, 2].some((i) => lfCellAccepts(s, i, load))) return { state: s, result: "no_space_fail" };
    return { state: s, result: "type_mismatch" };
  }
  const st = { ...s, fill: [...s.fill], cellType: [...s.cellType], covered: [...s.covered] };
  st.fill[cell] += 1;
  st.cellType[cell] = load;
  st.covered[cell] = false; // today's work face is exposed until re-covered
  st.placedToday += 1;
  return { state: st, result: "ok" };
}

/** Cells that need covering tonight (dirty and currently exposed). */
export function lfExposed(s: LandfillState): number[] {
  return s.fill.map((f, i) => (f > 0 && !s.covered[i] ? i : -1)).filter((i) => i >= 0);
}

export interface LfNight {
  state: LandfillState;
  event: "ok" | "overflow_fail" | "complaint_fail" | "cleared";
  weather: LfWeather;
  waterAdded: number;
  complaintsAdded: number;
  note: string;
}

/** End the day. `coverChoice` = exposed cells to cover tonight (1 soil each).
 * Covering everything exposed is the duty; the choice only exists when the
 * delayed delivery has left too little material. Covers persist. */
export function lfNight(s: LandfillState, coverChoice: number[]): LfNight {
  const exposed = lfExposed(s);
  const wanted = coverChoice.filter((i) => exposed.includes(i));
  if (wanted.length > s.soil) {
    return { state: s, event: "ok", weather: "calm", waterAdded: 0, complaintsAdded: 0, note: "覆い材が足りない。かける区画をえらび直そう。" };
  }
  const st: LandfillState = { ...s, fill: [...s.fill], cellType: [...s.cellType], covered: [...s.covered] };
  st.soil -= wanted.length;
  for (const i of wanted) st.covered[i] = true;
  const weather = st.weather[st.day - 1];
  const stillExposed = lfExposed(st).length;
  let waterAdded = 0;
  let complaintsAdded = 0;
  if (weather === "rain") {
    waterAdded = LF_WATER_PER_CELL * stillExposed;
    st.tank += waterAdded;
  } else if (weather === "wind") {
    complaintsAdded = stillExposed;
    st.complaints += complaintsAdded;
  }
  if (st.tank > LF_TANK_CAP) {
    return { state: st, event: "overflow_fail", weather, waterAdded, complaintsAdded, note: "処理が追いつかず、浸出水タンクがあふれてしまった。" };
  }
  if (st.complaints >= LF_COMPLAINT_LIMIT) {
    return { state: st, event: "complaint_fail", weather, waterAdded, complaintsAdded, note: "飛散とにおいの苦情が重なり、操業を見直すことになった。" };
  }
  st.tank = Math.max(0, st.tank - LF_TANK_DRAIN);
  st.day += 1;
  st.placedToday = 0;
  if (st.day > LF_DAYS) return { state: st, event: "cleared", weather, waterAdded, complaintsAdded, note: "" };
  return { state: st, event: "ok", weather, waterAdded, complaintsAdded, note: "" };
}

/** Mastery: fulfilled the covering duty (no complaints, low water). */
export function lfGrade(s: LandfillState): "perfect" | "good" {
  return s.complaints === 0 && s.tank <= 2 ? "perfect" : "good";
}
