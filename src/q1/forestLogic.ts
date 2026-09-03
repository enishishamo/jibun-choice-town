// Pure rules for the 3 Q1 games of the forest-care world (「もりをきる、もりをまもる」).
// No React: drives components AND factory/harness/gameplay-qa-forest.mjs.
// Facts grounding: factory/projects/forest-care/research.result.json
//   - thinning is counted by VOLUME (材積), not stem count; damaged/suppressed
//     trees go first; future crop trees stay; over-opening invites wind damage
//   - felling: signal -> escape check -> cut, in that order, every tree;
//     an impossible tree is handed to the machine (stopping is professional)
//   - replanting: species match site (dry ridge / moist valley), deer pressure
//     needs protection, and the budget never covers everything
// Safety rules (research): fatal-risk mistakes are STOPPED by the chief/winch
// before harm; no chainsaw play-acting for kids.

// ============================ thinning_pick =================================
export interface Tree {
  id: string;
  size: "thin" | "mid" | "thick"; // volume 1 / 2 / 4
  damaged: boolean;
  future: boolean; // future crop tree — never cut
  row: number;
  col: number;
}
export const PLOT_ROWS = 3;
export const PLOT_COLS = 4;
export const VOL: Record<Tree["size"], number> = { thin: 1, mid: 2, thick: 4 };
export const RATE_MIN = 0.15;
export const RATE_MAX = 0.3;
export const THIN_REDO_LIMIT = 2;

export interface ThinState {
  trees: Tree[];
  marked: string[];
  redos: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}

export function newPlot(rand: () => number = Math.random): Tree[] {
  const trees: Tree[] = [];
  const sizes: Tree["size"][] = ["thin", "thin", "thin", "thin", "mid", "mid", "mid", "mid", "mid", "thick", "thick", "thick"];
  for (let i = sizes.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
  }
  // damaged/suppressed trees are thin or mid (poor growth) — never thick,
  // so "damage first" can always fit under the volume cap
  const dmg = new Set<number>();
  while (dmg.size < 2) {
    const i = Math.floor(rand() * 12);
    if (sizes[i] !== "thick") dmg.add(i);
  }
  // the future tree is a healthy thick/mid tree
  let fut = Math.floor(rand() * 12);
  while (dmg.has(fut) || sizes[fut] === "thin") fut = Math.floor(rand() * 12);
  for (let i = 0; i < 12; i++) {
    trees.push({
      id: `T${i + 1}`,
      size: sizes[i],
      damaged: dmg.has(i),
      future: i === fut,
      row: Math.floor(i / PLOT_COLS),
      col: i % PLOT_COLS,
    });
  }
  return trees;
}
export function newThinState(rand: () => number = Math.random): ThinState {
  return { trees: newPlot(rand), marked: [], redos: 0, outcome: "open" };
}

export function totalVolume(trees: Tree[]): number {
  return trees.reduce((s, t) => s + VOL[t.size], 0);
}
export function markedVolume(s: ThinState): number {
  return s.trees.filter((t) => s.marked.includes(t.id)).reduce((n, t) => n + VOL[t.size], 0);
}

/** Toggle a mark. The future crop tree is protected HERE (the UI mirrors it). */
export function thinToggle(s: ThinState, id: string): ThinState {
  if (s.outcome !== "open") return s;
  const t = s.trees.find((x) => x.id === id);
  if (!t) return s;
  const st = { ...s, marked: [...s.marked] };
  delete st.refusal;
  if (t.future && !st.marked.includes(id)) {
    return { ...s, refusal: "先輩が幹のテープを指さした。（この木は、将来の主役だ）" };
  }
  const i = st.marked.indexOf(id);
  if (i >= 0) st.marked.splice(i, 1);
  else st.marked.push(id);
  return st;
}

/** Wind-lane rule: 3+ marked trees in a straight line (row) adjacent = over-opening. */
export function openGapTooWide(s: ThinState): boolean {
  const cut = new Set(
    s.trees.filter((t) => s.marked.includes(t.id)).map((t) => `${t.row},${t.col}`),
  );
  for (let r = 0; r < PLOT_ROWS; r++) {
    let run = 0;
    for (let c = 0; c < PLOT_COLS; c++) {
      run = cut.has(`${r},${c}`) ? run + 1 : 0;
      if (run >= 3) return true;
    }
  }
  return false;
}

export type ThinProblem = "rate_low" | "rate_high" | "gap" | "damaged_left" | null;
export function thinValidate(s: ThinState): ThinProblem {
  const rate = markedVolume(s) / totalVolume(s.trees);
  if (rate < RATE_MIN) return "rate_low";
  if (rate > RATE_MAX) return "rate_high";
  if (openGapTooWide(s)) return "gap";
  const missedDamaged = s.trees.some((t) => t.damaged && !s.marked.includes(t.id));
  if (missedDamaged) return "damaged_left";
  return null;
}

export function thinServe(s: ThinState): { state: ThinState; problem: ThinProblem } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = thinValidate(s);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem };
  const redos = s.redos + 1;
  return { state: { ...s, redos, outcome: redos >= THIN_REDO_LIMIT ? "mentor_fail" : "open" }, problem };
}

// ============================ fell_direction ================================
export type Dir = "N" | "E" | "S" | "W";
export interface FellCase {
  lean: Dir; // natural lean — felling opposite the lean is impossible by hand
  blocked: Dir[]; // keep-trees / machine / stream in these directions
  impossible: boolean; // heavy lean INTO a blocked dir -> hand to the machine
}
export const FELL_TREES = 5;
export const FELL_STRIKE_LIMIT = 2;
export const FELL_DELAY_LIMIT = 3;

const DIRS: Dir[] = ["N", "E", "S", "W"];
const OPPOSITE: Record<Dir, Dir> = { N: "S", S: "N", E: "W", W: "E" };

export function newFellDay(rand: () => number = Math.random): FellCase[] {
  const cases: FellCase[] = [];
  for (let i = 0; i < FELL_TREES; i++) {
    const lean = DIRS[Math.floor(rand() * 4)];
    const nBlocked = 1 + Math.floor(rand() * 2);
    const blocked: Dir[] = [];
    while (blocked.length < nBlocked) {
      const d = DIRS[Math.floor(rand() * 4)];
      if (!blocked.includes(d)) blocked.push(d);
    }
    cases.push({ lean, blocked, impossible: false });
  }
  // teeth: at least one machine-handoff tree (every allowed dir blocked),
  // at least one clean tree
  const idx = Math.floor(rand() * FELL_TREES);
  const lean = DIRS[Math.floor(rand() * 4)];
  cases[idx] = { lean, blocked: allowedDirs(lean), impossible: true };
  const clean = (idx + 1 + Math.floor(rand() * (FELL_TREES - 1))) % FELL_TREES;
  if (clean !== idx) cases[clean] = { lean: cases[clean].lean, blocked: [], impossible: false };
  return cases;
}

/** By hand you can fell into the lean or perpendicular (with wedges) — never
 * straight against the lean. */
export function allowedDirs(lean: Dir): Dir[] {
  return DIRS.filter((d) => d !== OPPOSITE[lean]);
}
export function fellCorrectDirs(c: FellCase): Dir[] {
  return allowedDirs(c.lean).filter((d) => !c.blocked.includes(d));
}

export type FellAction =
  | { kind: "signal" } // whistle + escape-route check
  | { kind: "cut"; dir: Dir }
  | { kind: "handoff" }; // give the tree to the winch/machine team

export interface FellState {
  cases: FellCase[];
  idx: number;
  signaled: boolean; // signal done for the CURRENT tree
  strikes: number;
  delays: number;
  felled: { dir: Dir | "machine" }[];
  outcome: "open" | "done" | "safety_fail" | "dusk_fail";
  refusal?: string;
}
export function newFellState(rand: () => number = Math.random): FellState {
  return { cases: newFellDay(rand), idx: 0, signaled: false, strikes: 0, delays: 0, felled: [], outcome: "open" };
}

export function fellAct(s: FellState, a: FellAction): { state: FellState; correct: "cut" | "handoff"; ok: boolean } {
  const c = s.cases[s.idx];
  const correctKind = c.impossible ? "handoff" : "cut";
  if (s.outcome !== "open") return { state: s, correct: correctKind, ok: false };
  const st: FellState = { ...s, felled: [...s.felled] };
  delete st.refusal;

  if (a.kind === "signal") {
    st.signaled = true;
    return { state: st, correct: correctKind, ok: true };
  }
  if (a.kind === "cut" && !s.signaled) {
    // the order is law: no cut before signal + escape check — the chief stops it
    st.strikes += 1;
    if (st.strikes >= FELL_STRIKE_LIMIT) st.outcome = "safety_fail";
    return { state: { ...st, refusal: "笛より先にエンジン音——指揮者が腕を交差させ、全員が止まった。" }, correct: correctKind, ok: false };
  }
  if (a.kind === "cut") {
    const good = !c.impossible && fellCorrectDirs(c).includes(a.dir);
    if (!good) {
      st.strikes += 1;
      if (st.strikes >= FELL_STRIKE_LIMIT) {
        st.outcome = "safety_fail";
        return { state: st, correct: correctKind, ok: false };
      }
      return { state: { ...st, refusal: "倒れかけた木がワイヤーで止められた。指揮者がこちらを見ている。" }, correct: correctKind, ok: false };
    }
    st.felled.push({ dir: a.dir });
  } else {
    // handoff
    if (!c.impossible) {
      st.delays += 1;
      if (st.delays >= FELL_DELAY_LIMIT) {
        st.outcome = "dusk_fail";
        return { state: st, correct: correctKind, ok: false };
      }
      return { state: { ...st, refusal: "機械班は道具を持ったまま、しばらくこちらを見て、だまって戻っていった。" }, correct: correctKind, ok: false };
    }
    st.felled.push({ dir: "machine" });
  }
  st.idx += 1;
  st.signaled = false;
  if (st.idx >= FELL_TREES) st.outcome = "done";
  return { state: st, correct: correctKind, ok: true };
}

// ============================== plant_plan ==================================
export type Zone = "ridge" | "slope" | "valley";
export type Species = "sugi" | "hinoki" | "karamatsu";
export type Guard = "none" | "tube" | "fence";
export const PLANT_BUDGET = 6;
export const PLANT_REDO_LIMIT = 2;
export const GUARD_COST: Record<Guard, number> = { none: 0, tube: 1, fence: 2 };
export const SPECIES_COST = 1; // per zone planting

export interface ZoneCond {
  zone: Zone;
  moisture: "dry" | "mid" | "wet";
  deer: "low" | "high";
}
export interface PlantCase {
  zones: ZoneCond[]; // exactly ridge / slope / valley
}
/** species fit: sugi needs wet-ish, hinoki mid/dry-ish, karamatsu dry & tough. */
export function speciesFit(moisture: ZoneCond["moisture"], sp: Species): boolean {
  if (sp === "sugi") return moisture !== "dry";
  if (sp === "hinoki") return moisture !== "wet";
  return moisture === "dry" || moisture === "mid";
}

export function newPlantCase(rand: () => number = Math.random): PlantCase {
  const moistures: Record<Zone, ZoneCond["moisture"]> = {
    ridge: "dry",
    slope: rand() < 0.5 ? "mid" : "dry",
    valley: rand() < 0.7 ? "wet" : "mid",
  };
  // deer pressure: 1-2 zones high — the budget can NOT fence everything
  const zones: Zone[] = ["ridge", "slope", "valley"];
  const highCount = 1 + (rand() < 0.5 ? 1 : 0);
  const deerSet = new Set<Zone>();
  while (deerSet.size < highCount) deerSet.add(zones[Math.floor(rand() * 3)]);
  return {
    zones: zones.map((z) => ({ zone: z, moisture: moistures[z], deer: deerSet.has(z) ? "high" : "low" })),
  };
}

export interface ZonePlan {
  species: Species | null;
  guard: Guard;
}
export type PlantPlan = Record<Zone, ZonePlan>;

export function plantCost(plan: PlantPlan): number {
  return (Object.values(plan) as ZonePlan[]).reduce(
    (n, p) => n + (p.species ? SPECIES_COST : 0) + GUARD_COST[p.guard],
    0,
  );
}

export type PlantProblem = "empty" | "fit" | "deer" | "over_budget" | null;
export function plantValidate(c: PlantCase, plan: PlantPlan): PlantProblem {
  if (plantCost(plan) > PLANT_BUDGET) return "over_budget";
  for (const z of c.zones) {
    const p = plan[z.zone];
    if (!p?.species) return "empty";
    if (!speciesFit(z.moisture, p.species)) return "fit";
    if (z.deer === "high" && p.guard === "none") return "deer";
  }
  return null;
}

export interface PlantState {
  c: PlantCase;
  redos: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newPlantState(rand: () => number = Math.random): PlantState {
  return { c: newPlantCase(rand), redos: 0, outcome: "open" };
}
export function plantServe(s: PlantState, plan: PlantPlan): { state: PlantState; problem: PlantProblem } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = plantValidate(s.c, plan);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem };
  const redos = s.redos + 1;
  return { state: { ...s, redos, outcome: redos >= PLANT_REDO_LIMIT ? "mentor_fail" : "open" }, problem };
}
