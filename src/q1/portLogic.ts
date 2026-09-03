// Pure rules for the 4 Q1 games of the night-port world (「真夜中のみなと」).
// No React: drives components AND factory/harness/gameplay-qa-port.mjs.
// Facts grounding: factory/projects/night-port/research.result.json
//   - yard planners place by RETRIEVAL order (rehandles are the real cost)
//   - crane rule: when speed and safety collide, STOPPING is the correct call
//   - tally = neutral proof of handover (never assert WHEN damage happened)
//   - dispatch: hard limits (tall/route/weight) are never overridden by rush
// Safety rules (research): no accidents happen on screen — safety devices and
// the signal chief stop unsafe acts BEFORE harm; night work is lit and managed.

// ============================== yard_plan ===================================
export type ContKind = "normal" | "reefer" | "hazmat";
export interface Cont {
  id: string;
  pickup: 1 | 2 | 3; // day the truck comes
  kind: ContKind;
}
export const YARD_COLS = 3; // normal stacking columns
export const YARD_DEPTH = 3; // max per normal column
export const SPECIAL_DEPTH = 2; // power / hazmat pads
export const REHANDLE_LIMIT = 4; // >=4 at dawn simulation -> fail

export interface YardState {
  queue: Cont[]; // still on the ship (place in order)
  cols: Cont[][]; // normal columns, bottom -> top
  power: Cont[]; // reefer pad (has plugs)
  haz: Cont[]; // hazmat pad (isolated)
  outcome: "open" | "placed" | "done" | "mentor_fail";
  /** transient: set when the last action was refused by the rules */
  refusal?: string;
}

export function newYardCase(rand: () => number = Math.random): Cont[] {
  // 8 containers: exactly 1 reefer + 1 hazmat, pickups spread over 3 days
  const picks: (1 | 2 | 3)[] = [1, 1, 2, 2, 3, 3, rand() < 0.5 ? 1 : 3, rand() < 0.5 ? 2 : 3];
  // shuffle pickup days (deterministic with rand)
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  const special = new Set<number>();
  while (special.size < 2) special.add(Math.floor(rand() * 8));
  const [a, b] = [...special];
  return picks.map((p, i) => ({
    id: `C${i + 1}`,
    pickup: p,
    kind: i === a ? "reefer" : i === b ? "hazmat" : "normal",
  }));
}

export function newYardState(rand: () => number = Math.random): YardState {
  return { queue: newYardCase(rand), cols: [[], [], []], power: [], haz: [], outcome: "open" };
}

/** Place the NEXT container from the ship onto a column ("0"|"1"|"2"|"power"|"haz").
 * Attribute rules are enforced HERE (the UI mirrors, never gates them). */
export function yardPlace(s: YardState, target: "0" | "1" | "2" | "power" | "haz"): YardState {
  if (s.outcome !== "open" || s.queue.length === 0) return s;
  const c = s.queue[0];
  const st: YardState = { ...s, queue: s.queue.slice(1), cols: s.cols.map((x) => [...x]), power: [...s.power], haz: [...s.haz] };
  delete st.refusal;
  if (target === "power") {
    if (c.kind !== "reefer") return { ...s, refusal: "作業員が首を横にふった。（電源つきの区画だ）" };
    if (st.power.length >= SPECIAL_DEPTH) return { ...s, refusal: "その区画は、もういっぱいだ。" };
    st.power.push(c);
  } else if (target === "haz") {
    if (c.kind !== "hazmat") return { ...s, refusal: "作業員が首を横にふった。（ここは隔離された区画だ）" };
    if (st.haz.length >= SPECIAL_DEPTH) return { ...s, refusal: "その区画は、もういっぱいだ。" };
    st.haz.push(c);
  } else {
    if (c.kind === "reefer") return { ...s, refusal: "作業員が電源プラグを指さして、首を横にふった。" };
    if (c.kind === "hazmat") return { ...s, refusal: "作業員が標識を指さして、首を横にふった。" };
    const col = st.cols[Number(target)];
    if (col.length >= YARD_DEPTH) return { ...s, refusal: "その列は、もう3段いっぱいだ。" };
    col.push(c);
  }
  if (st.queue.length === 0) st.outcome = "placed";
  return st;
}

export interface DawnSim {
  rehandles: number;
  log: { id: string; col: number; dug: string[] }[];
}
/** Dawn simulation: trucks come in pickup order. Every container ABOVE the
 * wanted one must be lifted aside once (a rehandle) and is restacked in place. */
export function yardSimulate(s: YardState): DawnSim {
  const cols = s.cols.map((c) => [...c]);
  const specials = [...s.power, ...s.haz];
  const all = [...cols.flat(), ...specials].sort((x, y) => x.pickup - y.pickup || x.id.localeCompare(y.id));
  let rehandles = 0;
  const log: DawnSim["log"] = [];
  for (const want of all) {
    const ci = cols.findIndex((c) => c.some((x) => x.id === want.id));
    if (ci < 0) {
      // power / hazmat pads are shallow: straight out, no digging
      log.push({ id: want.id, col: -1, dug: [] });
      continue;
    }
    const col = cols[ci];
    const pos = col.findIndex((x) => x.id === want.id);
    const above = col.slice(pos + 1);
    rehandles += above.length;
    log.push({ id: want.id, col: ci, dug: above.map((x) => x.id) });
    col.splice(pos, 1); // blockers settle back down in place
  }
  return { rehandles, log };
}

export function yardFinish(s: YardState): YardState {
  if (s.outcome !== "placed") return s;
  const sim = yardSimulate(s);
  return { ...s, outcome: sim.rehandles >= REHANDLE_LIMIT ? "mentor_fail" : "done" };
}

// ============================== crane_lift ==================================
export const CRANE_LIFTS = 6;
export const WIND_SLOW = 10; // m/s: slow down above this
export const WIND_STOP = 16; // m/s: suspend above this (規程)
export const CRANE_STRIKE_LIMIT = 2; // 2nd unsafe act -> shift ends
export const CRANE_DELAY_LIMIT = 4; // 4th needless hold -> dawn comes, fail

export interface Lift {
  wind: number; // m/s
  lockPins: 3 | 4; // twist locks engaged (4 = fully locked)
  cue: "match" | "mismatch"; // ground signal vs work order
}
export type CraneAction = "lower" | "slow" | "recheck" | "hold";

export function newCraneNight(rand: () => number = Math.random): Lift[] {
  const lifts: Lift[] = [];
  const mk = (wind: number, lockPins: 3 | 4, cue: "match" | "mismatch"): Lift => ({ wind, lockPins, cue });
  lifts.push(mk(3 + Math.floor(rand() * 6), 4, "match")); // normal
  lifts.push(mk(11 + Math.floor(rand() * 5), 4, "match")); // slow band
  lifts.push(mk(17 + Math.floor(rand() * 4), 4, "match")); // stop band
  lifts.push(rand() < 0.5 ? mk(4 + Math.floor(rand() * 5), 3, "match") : mk(5 + Math.floor(rand() * 4), 4, "mismatch"));
  lifts.push(mk(3 + Math.floor(rand() * 6), 4, "match"));
  lifts.push(mk(rand() < 0.4 ? 11 + Math.floor(rand() * 5) : 4 + Math.floor(rand() * 5), 4, "match"));
  // shuffle
  for (let i = lifts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [lifts[i], lifts[j]] = [lifts[j], lifts[i]];
  }
  return lifts;
}

export function craneCorrect(l: Lift): CraneAction {
  if (l.lockPins < 4 || l.cue === "mismatch") return "recheck";
  if (l.wind > WIND_STOP) return "hold";
  if (l.wind > WIND_SLOW) return "slow";
  return "lower";
}

export interface CraneState {
  lifts: Lift[];
  idx: number;
  strikes: number; // unsafe acts (stopped by safety devices / the chief)
  delays: number; // needless holds on safe lifts
  done: number;
  outcome: "open" | "done" | "safety_fail" | "dawn_fail";
  refusal?: string;
}
export function newCraneState(rand: () => number = Math.random): CraneState {
  return { lifts: newCraneNight(rand), idx: 0, strikes: 0, delays: 0, done: 0, outcome: "open" };
}

/** One decision per lift. Unsafe choices are STOPPED by the machine before any
 * harm; overcaution wastes the night (both are enforced here). */
export function craneAct(s: CraneState, a: CraneAction): { state: CraneState; correct: CraneAction; unsafe: boolean } {
  if (s.outcome !== "open") return { state: s, correct: "lower", unsafe: false };
  const l = s.lifts[s.idx];
  const correct = craneCorrect(l);
  const st = { ...s };
  delete st.refusal;
  const dangerous = (a === "lower" || a === "slow") && correct === "recheck";
  const stormRun = (a === "lower" || a === "slow") && correct === "hold";
  const unsafe = dangerous || stormRun;
  const rushing = a === "lower" && correct === "slow"; // the chief brakes you by radio
  if (unsafe || rushing) {
    // the container does NOT move: the safety chain stopped the lift. The
    // same lift must be handled again, correctly.
    st.strikes += 1;
    if (st.strikes >= CRANE_STRIKE_LIMIT) st.outcome = "safety_fail";
    return { state: st, correct, unsafe: true };
  } else if (a !== correct) {
    // every other miss is caution in the wrong place: the night gets shorter
    st.delays += 1;
    if (st.delays >= CRANE_DELAY_LIMIT) {
      st.outcome = "dawn_fail";
      return { state: st, correct, unsafe };
    }
  }
  // recheck fixes the lift (locks re-seated / cue re-confirmed); hold waits out
  // the gust; either way the lift completes when handled correctly.
  st.idx += 1;
  st.done += 1;
  if (st.idx >= CRANE_LIFTS) st.outcome = "done";
  return { state: st, correct, unsafe };
}

// ============================== tally_check =================================
export type TallyIssue = "clean" | "number" | "seal" | "damage";
export type TallyAction = "accept" | "query_number" | "query_seal" | "record_damage";
export const TALLY_BOXES = 5;
export const TALLY_MISTAKE_LIMIT = 2;

export interface TallyBox {
  id: string;
  issue: TallyIssue;
  docNo: string;
  realNo: string; // 1 char differs when issue==="number"
  checkOk: boolean; // check-digit aid: false when realNo is inconsistent
  docSeal: string;
  realSeal: string;
  dentVisible: boolean; // visible dent when issue==="damage"
}

const LETTERS = "ABCDEFGHJKLMNPRSTUW";
function contNo(rand: () => number): string {
  let s2 = "";
  for (let i = 0; i < 3; i++) s2 += LETTERS[Math.floor(rand() * LETTERS.length)];
  s2 += "U";
  let d = "";
  for (let i = 0; i < 7; i++) d += Math.floor(rand() * 10);
  return s2 + d;
}

export function newTallyRow(rand: () => number = Math.random): TallyBox[] {
  const issues: TallyIssue[] = ["number", "seal", "damage", "clean", "clean"];
  for (let i = issues.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [issues[i], issues[j]] = [issues[j], issues[i]];
  }
  return issues.map((issue, i) => {
    const no = contNo(rand);
    let realNo = no;
    if (issue === "number") {
      const pos = 4 + Math.floor(rand() * 7);
      const wrong = String((Number(no[pos]) + 1 + Math.floor(rand() * 8)) % 10);
      realNo = no.slice(0, pos) + wrong + no.slice(pos + 1);
    }
    const seal = "S" + Math.floor(100000 + rand() * 900000);
    let realSeal = seal;
    if (issue === "seal") realSeal = "S" + Math.floor(100000 + rand() * 900000);
    return {
      id: `B${i + 1}`,
      issue,
      docNo: no,
      realNo,
      checkOk: issue !== "number",
      docSeal: seal,
      realSeal,
      dentVisible: issue === "damage",
    };
  });
}

export interface TallyState {
  boxes: TallyBox[];
  idx: number;
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newTallyState(rand: () => number = Math.random): TallyState {
  return { boxes: newTallyRow(rand), idx: 0, mistakes: 0, outcome: "open" };
}

export function tallyCorrect(b: TallyBox): TallyAction {
  if (b.issue === "number") return "query_number";
  if (b.issue === "seal") return "query_seal";
  if (b.issue === "damage") return "record_damage";
  return "accept";
}

/** Damage wording rule (fairness): record WHAT you saw, never WHEN it happened. */
export type DamageWording = "neutral" | "blame_now" | "ignore";
export function damageWordingOk(w: DamageWording): boolean {
  return w === "neutral";
}

export function tallyAct(s: TallyState, a: TallyAction, wording?: DamageWording): { state: TallyState; correct: TallyAction; wrongWording: boolean } {
  if (s.outcome !== "open") return { state: s, correct: "accept", wrongWording: false };
  const b = s.boxes[s.idx];
  const correct = tallyCorrect(b);
  const st = { ...s };
  let wrongWording = false;
  let miss = a !== correct;
  if (!miss && a === "record_damage") {
    wrongWording = !damageWordingOk(wording ?? "neutral");
    miss = wrongWording; // asserting "it happened NOW" is a fairness mistake
  }
  if (miss) {
    // the box is NOT handed over: the record would not match, so the same box
    // comes back to the booth. A legal proof admits no unresolved errors.
    st.mistakes += 1;
    if (st.mistakes >= TALLY_MISTAKE_LIMIT) st.outcome = "mentor_fail";
    return { state: st, correct, wrongWording };
  }
  st.idx += 1;
  if (st.idx >= TALLY_BOXES) st.outcome = "done";
  return { state: st, correct, wrongWording };
}

// ============================= truck_dispatch ===============================
export interface Job {
  id: string;
  size: 20 | 40;
  tall: boolean; // 40ft high-cube -> low-bed chassis only + no 3.8m underpass
  heavy: boolean; // near max gross -> not on the light tractor
  dest: "A" | "B" | "C";
  window: 1 | 2; // morning slot the receiver booked (1st run / 2nd run)
}
/** B-bound deliveries choose a road: the short way has a 3.8m underpass
 * (a high-cube rig is ~4.1m tall), the detour is legal for everything but
 * costs extra empty-run distance. */
export type RouteChoice = "short" | "detour";
export interface Truck {
  id: string;
  name: string;
  lowbed: boolean;
  light: boolean; // light tractor: no heavy jobs
}
export const TRUCKS: Truck[] = [
  { id: "t1", name: "1号車", lowbed: false, light: false },
  { id: "t2", name: "2号車", lowbed: false, light: true },
  { id: "t3", name: "3号車（低床）", lowbed: true, light: false },
];
export const DISPATCH_REDO_LIMIT = 2;

export interface DispatchCase {
  jobs: Job[];
}
export function newDispatchCase(rand: () => number = Math.random): DispatchCase {
  const dests: ("A" | "B" | "C")[] = ["A", "B", "C"];
  const jobs: Job[] = [];
  // guaranteed teeth: one tall job (never window-2-only solvable conflicts),
  // one heavy job, destinations varied
  const tallDest = dests[Math.floor(rand() * 3)]; // tall to B forces the detour
  jobs.push({ id: "J1", size: 40, tall: true, heavy: false, dest: tallDest, window: rand() < 0.5 ? 1 : 2 });
  jobs.push({ id: "J2", size: 40, tall: false, heavy: true, dest: dests[Math.floor(rand() * 3)], window: rand() < 0.5 ? 1 : 2 });
  jobs.push({ id: "J3", size: 20, tall: false, heavy: false, dest: "B", window: 1 });
  jobs.push({ id: "J4", size: 20, tall: false, heavy: false, dest: dests[Math.floor(rand() * 3)], window: 2 });
  return { jobs };
}

/** assignment: jobId -> {truckId, slot(1|2), route (B-bound only)} */
export type Assignment = Record<string, { truckId: string; slot: 1 | 2; route?: RouteChoice }>;

/** Hard rules, enforced here. Returns null when the plan is servable, else the
 * FIRST problem (the UI shows the world's reaction, not the rule text). */
export function dispatchValidate(c: DispatchCase, asg: Assignment): string | null {
  const seen: Record<string, Job[]> = {};
  for (const j of c.jobs) {
    const a = asg[j.id];
    if (!a) return "empty";
    const t = TRUCKS.find((x) => x.id === a.truckId)!;
    if (j.tall && !t.lowbed) return "tall_chassis";
    if (j.dest === "B" && j.tall && (a.route ?? "short") !== "detour") return "tall_route"; // 4.1m rig vs 3.8m underpass
    if (j.heavy && t.light) return "overweight";
    if (a.slot !== j.window) return "window";
    (seen[a.truckId] ??= []).push(j);
  }
  for (const [tid, js] of Object.entries(seen)) {
    const slots = js.map((j) => asg[j.id].slot);
    if (new Set(slots).size !== slots.length) return "double_book";
    if (js.length === 2) {
      // a truck can chain two runs only if the second is reachable: same or
      // adjacent area (A-B adjacent, B-C adjacent, A-C far)
      const [j1, j2] = js.sort((x, y) => asg[x.id].slot - asg[y.id].slot);
      const far = (j1.dest === "A" && j2.dest === "C") || (j1.dest === "C" && j2.dest === "A");
      if (far) return "too_far";
    }
    void tid;
  }
  return null;
}

/** empty-run score: chained same-area = 0, adjacent = 1 per chain, plus 1 per
 * truck used beyond the minimum. Lower is better; 0-1 = expert. */
export function dispatchEmptyRun(c: DispatchCase, asg: Assignment): number {
  const byTruck: Record<string, Job[]> = {};
  for (const j of c.jobs) (byTruck[asg[j.id].truckId] ??= []).push(j);
  let score = 0;
  for (const js of Object.values(byTruck)) {
    if (js.length === 2) {
      const [j1, j2] = js.sort((x, y) => asg[x.id].slot - asg[y.id].slot);
      if (j1.dest !== j2.dest) score += 1;
    }
  }
  score += Math.max(0, Object.keys(byTruck).length - 2);
  // the detour is legal but longer
  for (const j of c.jobs) if (j.dest === "B" && (asg[j.id]?.route ?? "short") === "detour") score += 1;
  return score;
}

export interface DispatchState {
  c: DispatchCase;
  redos: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newDispatchState(rand: () => number = Math.random): DispatchState {
  return { c: newDispatchCase(rand), redos: 0, outcome: "open" };
}
export function dispatchServe(s: DispatchState, asg: Assignment): { state: DispatchState; problem: string | null } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = dispatchValidate(s.c, asg);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem };
  const redos = s.redos + 1;
  return { state: { ...s, redos, outcome: redos >= DISPATCH_REDO_LIMIT ? "mentor_fail" : "open" }, problem };
}
