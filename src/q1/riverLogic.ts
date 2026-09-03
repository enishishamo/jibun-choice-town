// Pure rules for the 3 Q1 games of the river-health world (「川に魚がもどった！」).
// No React: drives components AND factory/harness/gameplay-qa-river.mjs.
// Facts grounding: factory/projects/river-health/research.result.json
//   - recovery is judged by up/downstream COMPARISON, never one sighting
//   - aeration: more oxygen is NOT better (power waste + sludge trouble)
//   - nature-oriented river works: protect the MINIMUM, keep nature elsewhere
// Fairness rules (research): never pin the cause on one person/facility from a
// single number; a stocking event (放流) is a decoy, not proof of recovery.

// ============================== water_trace =================================
export type Spot = "A" | "B" | "C" | "D" | "E"; // 上流A・支流B・処理場上C・処理場下D・下流E
export type RiverCause = "plant_upgrade" | "tributary_cleanup" | "not_recovered";
export const TRACE_BUDGET = 4;
export const SPOT_COST: Record<Spot, number> = { A: 1, B: 1, C: 1, D: 1, E: 1 };

export interface SpotReading {
  do_: number; // mg/L (>=5 healthy for this river class)
  bod: number; // mg/L (<=3 healthy)
  fish: boolean; // small fish seen during sampling
}
export interface RiverCase {
  cause: RiverCause;
  stockingPosterSeen: boolean; // 放流イベントの掲示 (decoy)
  readings: Record<Spot, SpotReading>;
}

const good = (rand: () => number): SpotReading => ({
  do_: 6 + Math.round(rand() * 2 * 10) / 10,
  bod: 1 + Math.round(rand() * 1.5 * 10) / 10,
  fish: rand() < 0.75,
});
const poor = (rand: () => number): SpotReading => ({
  do_: 3 + Math.round(rand() * 1.5 * 10) / 10,
  bod: 4 + Math.round(rand() * 2 * 10) / 10,
  fish: rand() < 0.15,
});

export function newRiverCase(rand: () => number = Math.random): RiverCase {
  const roll = rand();
  const cause: RiverCause = roll < 0.4 ? "plant_upgrade" : roll < 0.75 ? "tributary_cleanup" : "not_recovered";
  const r = (g: boolean) => (g ? good(rand) : poor(rand));
  let readings: Record<Spot, SpotReading>;
  if (cause === "plant_upgrade") {
    // C (above plant) still poor-ish, D/E (below the outfall) clearly better
    readings = { A: r(true), B: r(false), C: r(false), D: r(true), E: r(true) };
  } else if (cause === "tributary_cleanup") {
    // B (tributary) now clean; improvement starts where B joins (C/D/E good)
    readings = { A: r(false), B: r(true), C: r(true), D: r(true), E: r(true) };
  } else {
    // numbers unchanged (mostly poor); any fish seen came from stocking
    readings = { A: r(false), B: r(false), C: r(false), D: r(false), E: r(false) };
    readings.E.fish = true; // the sighting that started the rumor
  }
  return { cause, stockingPosterSeen: cause === "not_recovered" ? true : rand() < 0.3, readings };
}

export interface TraceState {
  c: RiverCase;
  sampled: Spot[];
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}
export function newTraceState(rand: () => number = Math.random): TraceState {
  return { c: newRiverCase(rand), sampled: [], mistakes: 0, outcome: "open" };
}

export function traceSample(s: TraceState, spot: Spot): TraceState {
  if (s.outcome !== "open") return s;
  const st = { ...s, sampled: [...s.sampled] };
  delete st.refusal;
  if (st.sampled.includes(spot)) return { ...s, refusal: "その地点は、もう採水ずみ。" };
  if (st.sampled.length >= TRACE_BUDGET) return { ...s, refusal: "今日の採水びんは、もう空きがない。" };
  st.sampled.push(spot);
  return st;
}

export function traceCorrect(c: RiverCase): RiverCause {
  return c.cause;
}
/** Concluding with zero samples is refused: one sighting is never proof. */
export function traceConclude(s: TraceState, answer: RiverCause): { state: TraceState; correct: RiverCause } {
  const correct = traceCorrect(s.c);
  if (s.outcome !== "open") return { state: s, correct };
  if (s.sampled.length < 2) {
    return { state: { ...s, refusal: "先輩が採水びんを指さした。（比べる数字が、まだ足りない）" }, correct };
  }
  if (answer === correct) return { state: { ...s, outcome: "done" }, correct };
  const mistakes = s.mistakes + 1;
  return { state: { ...s, mistakes, outcome: mistakes >= 2 ? "mentor_fail" : "open" }, correct };
}

// =============================== plant_ops ==================================
export const OPS_SLOTS = 4; // 朝・昼・夕・雨の夜
export const DO_LOW = 1.2;
export const DO_HIGH = 3.2;
export type AirAction = "up" | "keep" | "down";

export interface OpsSlot {
  label: string;
  inflow: 1 | 2 | 3; // load level (rain = 3)
  rain: boolean;
}
export interface OpsState {
  slots: OpsSlot[];
  idx: number;
  air: number; // current blower level 1..5
  do_: number; // current tank DO
  power: number; // accumulated power waste (over-aeration)
  troubles: number; // DO out-of-band slots
  bubbles: "calm" | "lively" | "stormy";
  outcome: "open" | "done" | "discharge_fail";
  refusal?: string;
}

export function newOpsDay(rand: () => number = Math.random): OpsSlot[] {
  const mk = (label: string, inflow: 1 | 2 | 3, rain = false): OpsSlot => ({ label, inflow, rain });
  // load moves at most one step per slot (a blower moves one step per slot,
  // so every day stays followable — the judgment is WHEN, not luck)
  const morning = (rand() < 0.5 ? 1 : 2) as 1 | 2;
  const noon = (morning === 1 ? 2 : rand() < 0.5 ? 2 : 3) as 2 | 3;
  const evening = (noon === 3 ? (rand() < 0.5 ? 2 : 3) : 2) as 2 | 3;
  return [mk("朝", morning), mk("昼", noon), mk("夕方", evening), mk("雨の夜", 3, true)];
}
export function newOpsState(rand: () => number = Math.random): OpsState {
  return { slots: newOpsDay(rand), idx: 0, air: 3, do_: 2.2, power: 0, troubles: 0, bubbles: "calm", outcome: "open" };
}

/** The correct move keeps DO in band for THIS slot's load: air should roughly
 * match inflow+1 (rain slots need more air; calm slots waste power on high air). */
export function opsCorrect(s: OpsState): AirAction {
  const target = s.slots[s.idx].inflow + 1; // 2..4
  if (s.air < target) return "up";
  if (s.air > target) return "down";
  return "keep";
}

export function opsAct(s: OpsState, a: AirAction): { state: OpsState; correct: AirAction } {
  const correct = opsCorrect(s);
  if (s.outcome !== "open") return { state: s, correct };
  const st = { ...s };
  delete st.refusal;
  if (a === "up") st.air = Math.min(5, st.air + 1);
  if (a === "down") st.air = Math.max(1, st.air - 1);
  const target = st.slots[st.idx].inflow + 1;
  const gap = st.air - target;
  st.do_ = Math.round((2.2 + gap * 1.1) * 10) / 10;
  if (gap > 0) st.power += gap;
  st.bubbles = gap > 0 ? "stormy" : gap < 0 ? "calm" : "lively";
  if (st.do_ < DO_LOW || st.do_ > DO_HIGH) {
    st.troubles += 1;
    if (st.troubles >= 2) {
      st.outcome = "discharge_fail";
      return { state: st, correct };
    }
  }
  st.idx += 1;
  if (st.idx >= OPS_SLOTS) st.outcome = "done";
  return { state: st, correct };
}

// ============================== bank_design =================================
export type Section = "homes" | "bend" | "fields" | "weir";
export type Work = "concrete" | "stone_root" | "leave" | "fishway";
export const BANK_BUDGET = 6;
export const BANK_REDO_LIMIT = 2;
export const WORK_COST: Record<Work, number> = { concrete: 3, stone_root: 2, leave: 0, fishway: 2 };

export interface SectionCond {
  section: Section;
  erosion: boolean; // 侵食の履歴
  homesBehind: boolean;
}
export interface BankCase {
  sections: SectionCond[];
}
export function newBankCase(rand: () => number = Math.random): BankCase {
  return {
    sections: [
      { section: "homes", erosion: rand() < 0.5, homesBehind: true },
      { section: "bend", erosion: true, homesBehind: rand() < 0.3 },
      { section: "fields", erosion: false, homesBehind: false },
      { section: "weir", erosion: false, homesBehind: false },
    ],
  };
}

export type BankPlan = Record<Section, Work | null>;
export function bankCost(plan: BankPlan): number {
  return (Object.values(plan) as (Work | null)[]).reduce((n, w) => n + (w ? WORK_COST[w] : 0), 0);
}

export type BankProblem = "empty" | "unsafe" | "over_armored" | "no_fishway" | "over_budget" | null;
/** Safety first, nature next: homes/eroding bends need strong protection; the
 * calm field reach must NOT be fully armored; the weir needs a fishway. */
export function bankValidate(c: BankCase, plan: BankPlan): BankProblem {
  if (bankCost(plan) > BANK_BUDGET) return "over_budget";
  for (const sec of c.sections) {
    const w = plan[sec.section];
    if (w === null || w === undefined) return "empty";
    if (sec.section === "weir") {
      if (w !== "fishway") return "no_fishway";
      continue;
    }
    const needStrong = sec.homesBehind || sec.erosion;
    if (needStrong && w === "leave") return "unsafe";
    if (!needStrong && w === "concrete") return "over_armored";
  }
  return null;
}

export interface BankState {
  c: BankCase;
  redos: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newBankState(rand: () => number = Math.random): BankState {
  return { c: newBankCase(rand), redos: 0, outcome: "open" };
}
export function bankServe(s: BankState, plan: BankPlan): { state: BankState; problem: BankProblem } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = bankValidate(s.c, plan);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem };
  const redos = s.redos + 1;
  return { state: { ...s, redos, outcome: redos >= BANK_REDO_LIMIT ? "mentor_fail" : "open" }, problem };
}

/** nature score: leave=2, stone=1, concrete=0 on the three bank sections. */
export function bankNature(plan: BankPlan): number {
  return (["homes", "bend", "fields"] as Section[]).reduce((n, s) => {
    const w = plan[s];
    return n + (w === "leave" ? 2 : w === "stone_root" ? 1 : 0);
  }, 0);
}
