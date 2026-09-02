// Pure rules for the 4 Q1 games of the zoo world (「動物園に赤ちゃんが生まれた」).
// No React: drives components AND factory/harness/gameplay-qa-zoo.mjs.
// Facts grounding: factory/projects/zoo/research.result.json
//   - keepers triage from the growth CURVE + diary, not single weights
//   - vets choose the lowest-burden test that would change the plan
//   - feed follows the per-species daily ration table; lactating mothers get more
//   - debuts start short/far; stress signs mean shrink or stop (stopping is GOOD)
// Safety rules (research): no animal death, failure = mentors take over & teach.

// ============================== baby_care ===================================
export interface BabyDay {
  delta: number; // weight change vs yesterday (g)
  milkLeftover: boolean;
  badStool: boolean;
  lowActivity: boolean;
}
export type BabyCall = "ok" | "adjust" | "consult";
export const BABY_DAYS = 5;
export const BABY_MISTAKE_LIMIT = 2; // 2nd mistake -> mentor takes over

/** Judgment rules (the C card teaches exactly these):
 *  consult: weight fell AND (bad stool OR low activity)
 *  adjust : 2nd consecutive non-gaining day AND milk leftover
 *  ok     : everything else (including a single benign dip)          */
export function babyCorrect(days: BabyDay[], idx: number): BabyCall {
  const d = days[idx];
  if (d.delta < 0 && (d.badStool || d.lowActivity)) return "consult";
  const prevStall = idx > 0 && days[idx - 1].delta <= 0;
  if (d.delta <= 0 && prevStall && d.milkLeftover) return "adjust";
  return "ok";
}

export interface BabyState {
  days: BabyDay[];
  idx: number;
  mistakes: number;
  outcome: "open" | "mentor_fail" | "done";
}
export function newBabyState(rand: () => number = Math.random): BabyState {
  return { days: newBabyWeek(rand), idx: 0, mistakes: 0, outcome: "open" };
}
/** Make today's call; the mistake budget is enforced HERE (source of truth). */
export function babyMakeCall(s: BabyState, call: BabyCall): { state: BabyState; correct: BabyCall } {
  if (s.outcome !== "open") return { state: s, correct: "ok" };
  const correct = babyCorrect(s.days, s.idx);
  const st = { ...s };
  if (call !== correct) {
    st.mistakes += 1;
    if (st.mistakes >= BABY_MISTAKE_LIMIT) {
      st.outcome = "mentor_fail";
      return { state: st, correct };
    }
  }
  st.idx += 1;
  if (st.idx >= BABY_DAYS) st.outcome = "done";
  return { state: st, correct };
}

/** Every week contains exactly ONE adjust-day (2-day stall + leftover) and ONE
 * consult-day (drop + flag), in random order, plus normal days and often a
 * benign dip. So: ok-spam always makes 2 mistakes (fails), consult/adjust-spam
 * fail on the normal days, and the benign dip punishes overreaction. */
export function newBabyWeek(rand: () => number = Math.random): BabyDay[] {
  const mk = (delta: number, o: Partial<BabyDay> = {}): BabyDay => ({
    delta, milkLeftover: false, badStool: false, lowActivity: false, ...o,
  });
  const gain = () => mk(8 + Math.floor(rand() * 8));
  const benignDip = () => mk(-2 - Math.floor(rand() * 3)); // single dip, no flags -> ok
  const sick = () => mk(-4 - Math.floor(rand() * 4), rand() < 0.5 ? { badStool: true } : { lowActivity: true });
  // the adjust pair occupies two consecutive days: (no-gain) then (stall+leftover)
  const stallLead = () => mk(0);
  const stallHit = () => mk(0 - Math.floor(rand() * 2), { milkLeftover: true });
  // the pair start and the consult day are placed freely (12 base layouts),
  // so positions cannot be memorized across weeks
  const i = Math.floor(rand() * (BABY_DAYS - 1)); // stall pair at (i, i+1)
  let j = Math.floor(rand() * BABY_DAYS);
  while (j === i || j === i + 1) j = Math.floor(rand() * BABY_DAYS);
  const days: BabyDay[] = Array.from({ length: BABY_DAYS }, () => gain());
  days[i] = stallLead();
  days[i + 1] = stallHit();
  days[j] = sick();
  const free = Array.from({ length: BABY_DAYS }, (_, k) => k).filter((k) => k !== i && k !== i + 1 && k !== j);
  if (free.length > 0 && rand() < 0.4) days[free[Math.floor(rand() * free.length)]] = benignDip();
  return days;
}

// ============================== zoo_checkup =================================
export type ZooCause = "worms" | "overfeed" | "injury";
export type ZooCheck = "diary" | "camera" | "inspect" | "fecal" | "blood";
export type ZooPlan = "deworm" | "diet_review" | "rest_pain";
export const CHECK_COST: Record<ZooCheck, number> = { diary: 0, camera: 0, inspect: 1, fecal: 1, blood: 3 };
export const BURDEN_BUDGET = 4;

export interface ZooCase { cause: ZooCause }
export function newZooCase(rand: () => number = Math.random): ZooCase {
  const causes: ZooCause[] = ["worms", "overfeed", "injury"];
  return { cause: causes[Math.floor(rand() * causes.length)] };
}

/** Evidence matrix. Coherence rules:
 *  - no single check separates all three causes
 *  - diary/camera (0 burden) separate injury vs {worms, overfeed} only
 *  - fecal (1) separates worms vs overfeed; inspect (1) confirms/denies injury
 *  - blood (3) identifies everything — the high-burden fallback              */
export function zooInspect(c: ZooCase, check: ZooCheck): { text: string; pointsTo: ZooCause | null } {
  const E: Record<ZooCause, Record<ZooCheck, { text: string; pointsTo: ZooCause | null }>> = {
    worms: {
      diary: { text: "ここ数日うんちがゆるい。おやつを多めにあげた記録もある。", pointsTo: null },
      camera: { text: "動きはふだん通り。足取りも普通に見える。", pointsTo: null },
      inspect: { text: "柵ごしに見るかぎり、体にけがや腫れは見えない。", pointsTo: null },
      fecal: { text: "うんちの検査で、寄生虫の卵が見つかった！", pointsTo: "worms" },
      blood: { text: "血液検査：寄生虫への反応が出ている。けがの反応はない。", pointsTo: "worms" },
    },
    overfeed: {
      diary: { text: "ここ数日うんちがゆるい。おやつを多めにあげた記録もある。", pointsTo: null },
      camera: { text: "動きはふだん通り。足取りも普通に見える。", pointsTo: null },
      inspect: { text: "柵ごしに見るかぎり、体にけがや腫れは見えない。", pointsTo: null },
      fecal: { text: "うんちの検査では、寄生虫の卵は見つからなかった。", pointsTo: "overfeed" },
      blood: { text: "血液検査：大きな異常なし。食事内容の影響が考えられる。", pointsTo: "overfeed" },
    },
    injury: {
      diary: { text: "食欲はふつうで、うんちも普通。ただ昨日から動きが少ないという記録。", pointsTo: null },
      camera: { text: "映像をよく見ると、右うしろ足をかばうような歩き方に見える。", pointsTo: "injury" },
      inspect: { text: "柵ごしの視診：右うしろ足のつけ根が少し腫れている！", pointsTo: "injury" },
      fecal: { text: "うんちの検査では、寄生虫の卵は見つからなかった。", pointsTo: null },
      blood: { text: "血液検査：炎症の値が上がっている。けがの可能性が高い。", pointsTo: "injury" },
    },
  };
  return E[c.cause][check];
}

export const BLOOD_ABORT_P = 0.12; // restraint can fail on the animal's terms

export interface ZooState {
  c: ZooCase;
  burden: number;
  checked: ZooCheck[];
  outcome: "open" | "solved" | "misdiagnosed" | "restraint_aborted";
  /** transient: set when the last action was refused by the rules */
  refusal?: string;
}
export function newZooState(rand: () => number = Math.random): ZooState {
  return { c: newZooCase(rand), burden: 0, checked: [], outcome: "open" };
}
/** Budget and duplicates are enforced HERE: an over-budget or repeated check
 * returns the state unchanged (the UI mirrors, never gates, this rule). */
export function zooCheck(s: ZooState, check: ZooCheck, rand: () => number = Math.random): { state: ZooState; result: { text: string } | { refused: string } } {
  if (s.outcome !== "open") return { state: s, result: { refused: "診察は終わっている。" } };
  if (s.checked.includes(check)) return { state: s, result: { refused: "その調べ方はもう済んでいる。" } };
  if (s.burden + CHECK_COST[check] > BURDEN_BUDGET) {
    return { state: s, result: { refused: "これ以上の負担はかけられない（今日はここまで、と決めるのも獣医の仕事）。" } };
  }
  if (check === "blood" && s.checked.length < 2) {
    // Research ladder: 追跡・保定・麻酔は最後の手段。 A capture is only
    // justifiable after low-burden observation has been tried first.
    return { state: s, result: { refused: "いきなり保定はできない——動物への負担が大きすぎる。" } };
  }
  if (check === "blood" && rand() < BLOOD_ABORT_P) {
    // The restraint itself is a real risk (research: 追跡・保定・麻酔の危険と比較).
    // The animal resists hard; the team aborts and the diagnosis day is lost.
    return {
      state: { ...s, burden: s.burden + CHECK_COST[check], outcome: "restraint_aborted" },
      result: { refused: "保定しようとしたが、強い抵抗。無理はさせられない——今日は中止。" },
    };
  }
  const r = zooInspect(s.c, check);
  return { state: { ...s, burden: s.burden + CHECK_COST[check], checked: [...s.checked, check] }, result: { text: r.text } };
}
/** One-shot diagnosis, enforced in the rules. A plan with zero findings is
 * refused: a vet cannot commit a treatment plan on no evidence at all. */
export function zooDecide(s: ZooState, p: ZooPlan): ZooState {
  if (s.outcome !== "open") return s;
  if (s.checked.length === 0) {
    return { ...s, refusal: "所見がひとつもないまま、方針は出せない。" };
  }
  const st = { ...s, outcome: zooPlanCorrect(s.c, p) ? ("solved" as const) : ("misdiagnosed" as const) };
  delete st.refusal;
  return st;
}

export function zooPlanCorrect(c: ZooCase, p: ZooPlan): boolean {
  return (
    (c.cause === "worms" && p === "deworm") ||
    (c.cause === "overfeed" && p === "diet_review") ||
    (c.cause === "injury" && p === "rest_pain")
  );
}

// ============================== feed_prep ===================================
// The ration TABLE gives RULES (per condition); today's DIARY gives the data.
// The correct trays must be DERIVED (rule x observation), not looked up:
//   baby milk size = today's weigh-in vs the 500g line
//   mother's veg   = M when nursing hard, S otherwise (bamboo M always)
//   goat           = hay M + veg S; pellet S substitutes ONLY on short mornings
// Bread sits in the pantry as a decoy — no ration allows it.

export type FeedAnimal = "mother" | "baby" | "goat";
export type FeedItem = "bamboo" | "milk" | "hay" | "veg" | "pellet" | "bread";
export type FeedSize = "S" | "M";
export const FEED_REDO_LIMIT = 2; // 2nd rejected serve -> mentor takes over
export const SIZE_COST: Record<FeedSize, number> = { S: 1, M: 2 };
export const BABY_MILK_LINE = 500; // g: at or above -> M, below -> S

export interface FeedConditions {
  babyWeighin: number; // today's grams (varies)
  motherNursing: "strong" | "normal"; // diary note (varies) -> veg M(2) or S(1)
}
export interface FeedCase {
  cond: FeedConditions;
  stock: Record<FeedItem, number>;
}
export interface FeedTraySlot { item: FeedItem | null; size: FeedSize | null }
export type FeedTrays = Record<FeedAnimal, FeedTraySlot[]>;

/** Whether the goat must substitute is NOT a flag — it is arithmetic the
 * player must do: does the veg stock cover the mother's need (M=2/S=1)
 * AND the goat's S? The stock number itself is the only clue. */
export function vegShort(c: FeedCase): boolean {
  const motherNeed = c.cond.motherNursing === "strong" ? 2 : 1;
  return c.stock.veg < motherNeed + 1;
}

export function newFeedCase(rand: () => number = Math.random): FeedCase {
  const cond: FeedConditions = {
    babyWeighin: 440 + Math.floor(rand() * 25) * 6, // 440..584 straddles the 500 line
    motherNursing: rand() < 0.5 ? "strong" : "normal",
  };
  const motherNeed = cond.motherNursing === "strong" ? 2 : 1;
  const stock: Record<FeedItem, number> = {
    bamboo: 2,
    milk: 2,
    hay: 3,
    // always covers the mother; whether the goat's S also fits is the math
    veg: motherNeed + Math.floor(rand() * 3), // +0(short)..+2(plenty)
    pellet: 2,
    bread: 2, // decoy: in the pantry, in no ration
  };
  return { cond, stock };
}

/** The derived requirement per animal (what the rules + today's data demand). */
export function feedExpected(c: FeedCase): Record<FeedAnimal, { item: FeedItem; size: FeedSize }[]> {
  return {
    mother: [
      { item: "bamboo", size: "M" },
      { item: "veg", size: c.cond.motherNursing === "strong" ? "M" : "S" },
    ],
    baby: [{ item: "milk", size: c.cond.babyWeighin >= BABY_MILK_LINE ? "M" : "S" }],
    goat: [
      { item: "hay", size: "M" },
      vegShort(c) ? { item: "pellet", size: "S" } : { item: "veg", size: "S" },
    ],
  };
}

/** Child-readable rejection, or null when the serve is correct. */
export function feedValidate(c: FeedCase, trays: FeedTrays): string | null {
  const used: Record<FeedItem, number> = { bamboo: 0, milk: 0, hay: 0, veg: 0, pellet: 0, bread: 0 };
  const exp = feedExpected(c);
  const key = (x: { item: FeedItem | null; size: FeedSize | null }) => `${x.item}:${x.size}`;
  for (const animal of Object.keys(exp) as FeedAnimal[]) {
    const want = exp[animal];
    // the WHOLE tray is inspected: extra filled slots are rejected, so
    // "put everything on every tray" can never pass the senior's check
    const tray = trays[animal].filter((x) => x?.item || x?.size);
    if (tray.length < want.length) return "まだ空のトレイがある。";
    if (tray.length > want.length) return "日量表より多くのせている。決められた品数どおりに。";
    for (const got of tray) {
      if (!got?.item || !got.size) return "まだ空のトレイがある。";
      used[got.item] += SIZE_COST[got.size];
      if (got.item === "bread") return "パンは日量表にない。表にないものは出さないのがきまり。";
    }
    // order-agnostic: compare as multisets (the tray layout does not matter)
    const wantSet = want.map(key).sort().join("|");
    const gotSet = tray.map(key).sort().join("|");
    if (wantSet !== gotSet) {
      const gotVeg = tray.some((x) => x.item === "veg");
      const gotPellet = tray.some((x) => x.item === "pellet");
      if (animal === "goat" && gotPellet && !vegShort(c)) {
        return "在庫をよく数えて。今朝は野菜が足りているのに、代わりの食材になっている。";
      }
      if (animal === "mother" && !gotVeg) {
        return "足りない食材は、じゅにゅう中のおかあさんを優先するのがきまり。";
      }
      if (animal === "baby") {
        return "ミルクの量は、今朝の体重と500gの線を見くらべて決める。";
      }
      return "日量表の規則と今日の日誌・在庫に合っていないトレイがある。見くらべよう。";
    }
  }
  for (const item of Object.keys(used) as FeedItem[]) {
    if (used[item] > c.stock[item]) return "在庫より多く使っている食材がある。";
  }
  return null;
}

export interface FeedState {
  c: FeedCase;
  redos: number;
  outcome: "open" | "mentor_fail" | "done";
}
export function newFeedState(rand: () => number = Math.random): FeedState {
  return { c: newFeedCase(rand), redos: 0, outcome: "open" };
}
/** Serve attempt; the redo budget is enforced HERE. */
export function feedServe(s: FeedState, trays: FeedTrays): { state: FeedState; problem: string | null } {
  if (s.outcome !== "open") return { state: s, problem: null };
  const problem = feedValidate(s.c, trays);
  if (problem === null) return { state: { ...s, outcome: "done" }, problem: null };
  const redos = s.redos + 1;
  if (redos >= FEED_REDO_LIMIT) return { state: { ...s, redos, outcome: "mentor_fail" }, problem };
  return { state: { ...s, redos }, problem };
}

// ============================== debut_plan ==================================
export type Sensitivity = "calm" | "normal" | "shy";
export interface DebutPlan { duration: 1 | 2 | 3; distance: 1 | 2 | 3; capped: boolean }
export type ShrinkLever = "shorten" | "widen" | "cap";
export type SignType = "pace" | "hide" | "eat_stop"; // 往復行動・隠れがち・採食中断
export const DEBUT_SLOTS = 4;
export const SIGN_LIMIT = 3;
export const EXPECT_MIN = 4; // 園の期待の下限（練習記録に応じて上がる）

/** The zoo's expectation SCALES WITH the practice record: a cub that sailed
 * through practice justifies a fuller debut, so a one-size-fits-all "safe
 * minimal plan" cannot pass the gate on a calm cub's day. Reading the log is
 * required to even clear expectations, not just to optimize. */
export function expectMin(c: DebutCase): number {
  return c.sensitivity === "calm" ? 5 : EXPECT_MIN;
}

export interface DebutCase {
  sensitivity: Sensitivity;
  practiceLog: string[];
  events: ("none" | "crowd" | "noise")[];
}

export function newDebutCase(rand: () => number = Math.random): DebutCase {
  const s: Sensitivity = rand() < 0.34 ? "calm" : rand() < 0.5 ? "normal" : "shy";
  const logs: Record<Sensitivity, string[]> = {
    calm: ["扉を開けると、自分からすぐ出てきた", "観覧通路の人影にも驚かず、探索を続けた", "隠れ場に入ったのは短い時間だけ"],
    normal: ["扉を開けて数分ためらってから出た", "人影が動くと一度立ち止まった", "隠れ場と外を行ったり来たりした"],
    shy: ["扉を開けても、なかなか出てこなかった", "小さな物音で隠れ場にもどった", "出ている時間より隠れている時間が長い"],
  };
  const events = Array.from({ length: DEBUT_SLOTS }, () => {
    const r = rand();
    return r < 0.2 ? "crowd" : r < 0.35 ? "noise" : "none";
  }) as DebutCase["events"];
  return { sensitivity: s, practiceLog: logs[s], events };
}

export function planValue(p: DebutPlan): number {
  return p.duration + p.distance + (p.capped ? 0 : 2); // 2..8
}
export function baseStress(c: DebutCase, p: DebutPlan): number {
  const sens = c.sensitivity === "calm" ? 0 : c.sensitivity === "normal" ? 1 : 2;
  // capping the crowd actively CALMS the yard (fewer eyes, less noise)
  return Math.max(0, sens + (p.duration - 1) + (p.distance - 1) + (p.capped ? -1 : 1)); // 0..8
}

export interface DebutState {
  c: DebutCase;
  plan: DebutPlan;
  slot: number;
  signs: number;
  shrinks: ShrinkLever[]; // which operational cuts were made (each once, -2 load)
  outcome: "open" | "hidden_fail" | "expect_fail" | "postponed" | "done_full" | "done_early";
  /** transient: set when the last action was refused by the rules */
  refusal?: string;
  slotLog: { event: string; sign: SignType | null }[];
}

export function startDebut(c: DebutCase, plan: DebutPlan): DebutState {
  if (planValue(plan) < expectMin(c)) {
    return { c, plan, slot: 0, signs: 0, shrinks: [], outcome: "expect_fail", slotLog: [] };
  }
  return { c, plan, slot: 0, signs: 0, shrinks: [], outcome: "open", slotLog: [] };
}

export type DebutAction =
  | { kind: "continue" }
  | { kind: "shrink"; lever: ShrinkLever }
  | { kind: "stop" };

/** Each operational cut counters a DIFFERENT pressure (they are not
 * interchangeable): capping visitors calms crowd surges, widening distance
 * only helps if the plan brought people close, cutting time only relieves a
 * long-day plan. Picking the lever that matches today's pressure is the job. */
export function shrinkRelief(plan: DebutPlan, lever: ShrinkLever, event: "none" | "crowd" | "noise"): number {
  if (lever === "cap") return event === "crowd" ? 2 : 1;
  if (lever === "widen") return plan.distance === 3 ? 2 : 1;
  return plan.duration === 3 ? 2 : 1; // shorten counters a long-day plan
}

/** Advance one time slot. Sign types are concrete welfare observations.
 *  Stopping WITHOUT any sign is an unjustified cancellation (the zoo cannot
 *  explain it to visitors) — the courage-to-stop is honored only as a
 *  RESPONSE to what the animal shows. Enforced here, not in the UI. */
export function debutStep(s: DebutState, action: DebutAction, rand: () => number = Math.random): DebutState {
  if (s.outcome !== "open") return s;
  const st: DebutState = { ...s, shrinks: [...s.shrinks], slotLog: [...s.slotLog] };
  delete st.refusal;
  if (action.kind === "stop") {
    if (st.signs === 0) {
      // Refused: a cancellation with no welfare sign cannot be explained.
      return { ...s, refusal: "サインが出ていないのに中止はできない（お客さんに説明がつかない）。ようすを見よう。" };
    }
    if (st.signs === 1) {
      // Research: one behavior alone must not decide a cancellation. The
      // proportionate response to a single sign is to SHRINK, not stop.
      return { ...s, refusal: "サイン1つでは、まだお客さんに説明がつかない。" };
    }
    if (st.shrinks.length === 0) {
      // Research: 縮小→それでも続けば中止. Stopping without ever trying a
      // mitigation is skipping the professional ladder.
      return { ...s, refusal: "何も手を打たないままの中止は、園として説明がつかない。" };
    }
    // pattern (>=2 signs) + mitigation attempted: stopping is professional.
    st.outcome = st.slot >= 2 ? "done_early" : "postponed";
    return st;
  }
  if (action.kind === "shrink" && !st.shrinks.includes(action.lever)) {
    st.shrinks.push(action.lever);
  }
  const event = st.c.events[st.slot];
  const relief = st.shrinks.reduce((sum, lever) => sum + shrinkRelief(st.plan, lever, event), 0);
  const load = baseStress(st.c, st.plan) - relief + (event === "none" ? 0 : 1);
  const p = load <= 2 ? 0.08 : load === 3 ? 0.35 : load === 4 ? 0.6 : 0.9;
  const signed = rand() < p;
  if (signed) {
    st.signs += 1;
    const types: SignType[] = ["pace", "hide", "eat_stop"];
    st.slotLog.push({ event, sign: types[Math.floor(rand() * types.length)] });
  } else {
    st.slotLog.push({ event, sign: null });
  }
  if (st.signs >= SIGN_LIMIT) {
    st.outcome = "hidden_fail";
    return st;
  }
  st.slot += 1;
  if (st.slot >= DEBUT_SLOTS) st.outcome = "done_full";
  return st;
}

/** Welfare-first grading: a pattern-justified stop late in the day is as
 * professional as a calm full run. */
export function debutGrade(s: DebutState): "perfect" | "good" {
  // A full calm day with at most one gentle cut = the plan truly fit the animal.
  if (s.outcome === "done_full" && s.signs === 0 && s.shrinks.length <= 1) return "perfect";
  // A pattern stop after mitigation is the RIGHT call — but it only grades
  // perfect when the plan itself fit the cub (the signs were the day's events,
  // not a plan that overreached the practice record).
  if (s.outcome === "done_early" && baseStress(s.c, s.plan) <= 2) return "perfect";
  return "good";
}
