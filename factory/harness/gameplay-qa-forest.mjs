#!/usr/bin/env node
// Automated gameplay QA for the forest-care world's 3 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-forest.mjs
import {
  RATE_MIN, RATE_MAX, THIN_REDO_LIMIT, newThinState, thinToggle, thinValidate, thinServe, markedVolume, totalVolume, VOL, openGapTooWide,
  FELL_TREES, newFellState, fellAct, fellCorrectDirs, allowedDirs,
  PLANT_BUDGET, GUARD_COST, newPlantState, plantServe, plantValidate, speciesFit, newPlantCase, plantCost,
} from "../../src/q1/forestLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// ============================ thinning_pick =================================
{
  // future tree is machine-protected
  {
    const s = newThinState(rng(11));
    const fut = s.trees.find((t) => t.future);
    const r = thinToggle(s, fut.id);
    check("thin: marking the future crop tree is refused", !!r.refusal && !r.marked?.includes?.(fut.id));
  }
  // informed strategy: damaged first, then thin/mid non-future until rate in
  // range, avoiding 3-in-a-row
  const playInformed = (rand) => {
    let s = newThinState(rand);
    const damaged = s.trees.filter((t) => t.damaged && !t.future);
    for (const t of damaged) s = thinToggle(s, t.id);
    const total = totalVolume(s.trees);
    const cands = s.trees
      .filter((t) => !t.damaged && !t.future)
      .sort((a, b) => VOL[a.size] - VOL[b.size]);
    for (const t of cands) {
      const rate = markedVolume(s) / total;
      if (rate >= RATE_MIN) break;
      const nx = thinToggle(s, t.id);
      if (nx.refusal) continue;
      // avoid creating a wind lane (check directly — rate_low masks it)
      if (openGapTooWide(nx)) continue;
      if (markedVolume(nx) / total <= RATE_MAX) s = nx;
    }
    // fallback pass: still under the floor -> try any remaining tree (any size)
    if (markedVolume(s) / total < RATE_MIN) {
      for (const t of s.trees.filter((x) => !x.future && !s.marked.includes(x.id))) {
        if (markedVolume(s) / total >= RATE_MIN) break;
        const nx = thinToggle(s, t.id);
        if (nx.refusal) continue;
        if (markedVolume(nx) / total > RATE_MAX) continue;
        if (openGapTooWide(nx)) continue;
        s = nx;
      }
    }
    return thinServe(s);
  };
  let infDone = 0;
  for (let i = 0; i < N; i++) {
    const r = playInformed(rng(1000 + i));
    if (r.state.outcome === "done") infDone++;
  }
  check("thin: rule-following play (damage-first, volume-counted) always completes", infDone === N, `${infDone}/${N}`);
  // count-not-volume trap A: "two stems feel like enough" — but 2 thin trees
  // are only ~8% by volume: always below the floor
  let lowCaught = 0;
  for (let i = 0; i < N; i++) {
    let s = newThinState(rng(2000 + i));
    const thins = s.trees.filter((x) => x.size === "thin" && !x.future).slice(0, 2);
    for (const t of thins) s = thinToggle(s, t.id);
    if (thinValidate(s) === "rate_low") lowCaught++;
  }
  check("thin: counting stems instead of volume is caught (2 thin = too little)", lowCaught === N, `${lowCaught}/${N}`);
  // count-not-volume trap B: "cut all the thin ones" ignores damaged MID trees
  let trapCaught = 0, trapApplicable = 0;
  for (let i = 0; i < N; i++) {
    let s = newThinState(rng(2100 + i));
    const midDamaged = s.trees.some((t) => t.damaged && t.size !== "thin");
    if (!midDamaged) continue;
    trapApplicable++;
    for (const t of s.trees.filter((x) => x.size === "thin" && !x.future)) s = thinToggle(s, t.id);
    if (thinValidate(s) !== null) trapCaught++;
  }
  check("thin: 'cut all thin' leaves damaged mid trees -> always rejected", trapApplicable > 100 && trapCaught === trapApplicable, `${trapCaught}/${trapApplicable}`);
  // over-cutting thick trees blows the volume cap
  let overCaught = 0;
  for (let i = 0; i < N; i++) {
    let s = newThinState(rng(3000 + i));
    for (const t of s.trees.filter((x) => x.size === "thick" && !x.future)) s = thinToggle(s, t.id);
    for (const t of s.trees.filter((x) => x.damaged && !x.future)) if (!s.marked.includes(t.id)) s = thinToggle(s, t.id);
    if (thinValidate(s) === "rate_high" || thinValidate(s) === "gap") overCaught++;
  }
  check("thin: felling every thick tree exceeds the volume cap", overCaught / N > 0.9, `${overCaught}/${N}`);
  // redo budget
  {
    let s = newThinState(rng(12));
    let r = thinServe(s); // empty selection -> rate_low
    r = thinServe(r.state);
    check("thin: redo budget mechanically ends the day", r.state.outcome === "mentor_fail");
  }
  // variation
  const sigs = new Set();
  const r7 = rng(13);
  for (let i = 0; i < 40; i++) sigs.add(newThinState(r7).trees.map((t) => `${t.size[0]}${t.damaged ? "d" : ""}${t.future ? "F" : ""}`).join(""));
  check("thin: plots vary run to run", sigs.size >= 35, `${sigs.size}`);
}

// ============================ fell_direction ================================
{
  // teeth: every day has a machine tree and a clean tree
  const r = rng(21);
  let mach = 0, clean = 0;
  for (let i = 0; i < N; i++) {
    const s = newFellState(r);
    if (s.cases.some((c) => c.impossible)) mach++;
    if (s.cases.some((c) => !c.impossible && c.blocked.length === 0)) clean++;
  }
  check("fell: every day contains a hand-to-the-machine tree", mach === N);
  check("fell: every day contains a clean tree", clean === N);

  const play = (rand, policy) => {
    let s = newFellState(rand);
    let guard = 0;
    while (s.outcome === "open" && guard++ < 40) s = fellAct(s, policy(s)).state;
    return s;
  };
  const informed = (s) => {
    if (!s.signaled) return { kind: "signal" };
    const c = s.cases[s.idx];
    if (c.impossible) return { kind: "handoff" };
    return { kind: "cut", dir: fellCorrectDirs(c)[0] };
  };
  const outcomes = (policy, seed) => {
    const r2 = rng(seed); const out = {};
    for (let i = 0; i < N; i++) { const o = play(r2, policy).outcome; out[o] = (out[o] || 0) + 1; }
    return out;
  };
  const inf = outcomes(informed, 22);
  check("fell: procedure-following play always completes", (inf.done || 0) === N, JSON.stringify(inf));
  // no-signal cutter is stopped by the chief
  const rusher = outcomes((s) => ({ kind: "cut", dir: allowedDirs(s.cases[s.idx].lean)[0] }), 23);
  check("fell: cutting without the signal is always stopped", (rusher.safety_fail || 0) === N, JSON.stringify(rusher));
  // handoff-spam wastes the day
  const coward = outcomes((s) => (s.signaled ? { kind: "handoff" } : { kind: "signal" }), 24);
  check("fell: handing every tree to the machine wastes the day", (coward.dusk_fail || 0) === N, JSON.stringify(coward));
  // blocked-direction cut is caught by the wire
  {
    const s = newFellState(rng(25));
    const bad = { ...s, cases: [{ lean: "N", blocked: ["N"], impossible: false }, ...s.cases.slice(1)], signaled: true };
    const r3 = fellAct(bad, { kind: "cut", dir: "N" });
    check("fell: felling toward the keep-trees is stopped by the wire", r3.ok === false && r3.state.strikes === 1);
  }
  // felling against the lean is never allowed
  check("fell: the direction against the lean is never available", allowedDirs("N").includes("S") === false);
}

// ============================== plant_plan ==================================
{
  const r = rng(31);
  let solvable = 0, fenceBudget = 0;
  for (let i = 0; i < N; i++) {
    const c = newPlantCase(r);
    // informed: fit species per moisture; fence high-deer, tube if budget tight
    const plan = { ridge: null, slope: null, valley: null };
    for (const z of c.zones) {
      const sp = z.moisture === "wet" ? "sugi" : z.moisture === "dry" ? "karamatsu" : "hinoki";
      plan[z.zone] = { species: sp, guard: z.deer === "high" ? "fence" : "none" };
    }
    if (plantCost(plan) > PLANT_BUDGET) {
      // downgrade one fence to tube
      const hz = c.zones.find((z) => z.deer === "high");
      plan[hz.zone] = { ...plan[hz.zone], guard: "tube" };
    }
    if (plantValidate(c, plan) === null) solvable++;
    // greedy over-guard: fencing everything must break the budget when 2 high zones
    const rich = { ridge: { species: "karamatsu", guard: "fence" }, slope: { species: "hinoki", guard: "fence" }, valley: { species: "sugi", guard: "fence" } };
    if (plantValidate(c, rich) === "over_budget") fenceBudget++;
  }
  check("plant: informed fit+guard plan always passes", solvable === N, `${solvable}/${N}`);
  check("plant: fencing everything always breaks the budget", fenceBudget === N, `${fenceBudget}/${N}`);
  // mismatched species is caught
  {
    const c = { zones: [{ zone: "ridge", moisture: "dry", deer: "low" }, { zone: "slope", moisture: "mid", deer: "low" }, { zone: "valley", moisture: "wet", deer: "low" }] };
    const bad = { ridge: { species: "sugi", guard: "none" }, slope: { species: "hinoki", guard: "none" }, valley: { species: "sugi", guard: "none" } };
    check("plant: a moisture-mismatched species is always caught", plantValidate(c, bad) === "fit");
  }
  // unguarded high-deer zone is caught
  {
    const c = { zones: [{ zone: "ridge", moisture: "dry", deer: "high" }, { zone: "slope", moisture: "mid", deer: "low" }, { zone: "valley", moisture: "wet", deer: "low" }] };
    const bad = { ridge: { species: "karamatsu", guard: "none" }, slope: { species: "hinoki", guard: "none" }, valley: { species: "sugi", guard: "none" } };
    check("plant: an unguarded high-deer zone is always caught", plantValidate(c, bad) === "deer");
  }
  // fit matrix honesty
  check("plant: sugi hates dry ridges", speciesFit("dry", "sugi") === false && speciesFit("wet", "sugi") === true);
  check("plant: karamatsu tolerates dry", speciesFit("dry", "karamatsu") === true && speciesFit("wet", "karamatsu") === false);
  // redo budget
  {
    let s = newPlantState(rng(32));
    const empty = { ridge: { species: null, guard: "none" }, slope: { species: null, guard: "none" }, valley: { species: null, guard: "none" } };
    let r2 = plantServe(s, empty);
    r2 = plantServe(r2.state, empty);
    check("plant: redo budget mechanically ends the day", r2.state.outcome === "mentor_fail");
  }
  // deer distribution: budget pressure is real (2-high days exist)
  const r8 = rng(33);
  let twoHigh = 0;
  for (let i = 0; i < N; i++) if (newPlantCase(r8).zones.filter((z) => z.deer === "high").length === 2) twoHigh++;
  check("plant: two-high-deer days occur (budget pressure)", twoHigh / N > 0.3, `${twoHigh}/${N}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
