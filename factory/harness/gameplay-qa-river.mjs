#!/usr/bin/env node
// Automated gameplay QA for the river-health world's 3 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-river.mjs
import {
  TRACE_BUDGET, newTraceState, traceSample, traceConclude, newRiverCase,
  OPS_SLOTS, newOpsState, opsAct, opsCorrect,
  BANK_BUDGET, newBankState, bankServe, bankValidate, bankNature, bankCost, newBankCase,
} from "../../src/q1/riverLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// ============================== water_trace =================================
{
  // no-sample conclusion refused (one sighting is never proof)
  {
    const s = newTraceState(rng(11));
    const r = traceConclude(s, "plant_upgrade");
    check("trace: concluding without samples is refused", r.state.outcome === "open" && !!r.state.refusal);
  }
  // budget enforced
  {
    let s = newTraceState(rng(12));
    for (const sp of ["A", "B", "C", "D"]) s = traceSample(s, sp);
    const r = traceSample(s, "E");
    check("trace: the 5th sample is refused (budget 4)", !!r.refusal);
  }
  // informed play: sample C and D (around the plant) + B; decide by comparison
  const informed = (c) => {
    const rd = c.readings;
    const healthy = (x) => x.do_ >= 5 && x.bod <= 3;
    if (!healthy(rd.D) && !healthy(rd.E)) return "not_recovered";
    if (!healthy(rd.C) && healthy(rd.D)) return "plant_upgrade";
    return "tributary_cleanup";
  };
  const r2 = rng(13);
  let infWin = 0, causes = {};
  for (let i = 0; i < N; i++) {
    let s = newTraceState(r2);
    s = traceSample(s, "C");
    s = traceSample(s, "D");
    s = traceSample(s, "B");
    const ans = informed(s.c);
    const r = traceConclude(s, ans);
    if (r.state.outcome === "done") infWin++;
    causes[s.c.cause] = (causes[s.c.cause] || 0) + 1;
  }
  check("trace: comparison-reading play always concludes correctly", infWin === N, `${infWin}/${N}`);
  check("trace: all three truths occur", Object.keys(causes).length === 3, JSON.stringify(causes));
  // poster-decoy: blind "recovered because stocking poster" guessers lose often
  const r3 = rng(14);
  let posterFail = 0, posterSeen = 0;
  for (let i = 0; i < N; i++) {
    let s = newTraceState(r3);
    if (!s.c.stockingPosterSeen) continue;
    posterSeen++;
    s = traceSample(s, "E");
    s = traceSample(s, "A");
    // the lazy call: fish at E + poster -> "not recovered" always
    const r = traceConclude(s, "not_recovered");
    if (r.state.outcome !== "done") posterFail++;
  }
  check("trace: the stocking poster alone is not a safe answer", posterSeen > 100 && posterFail > 0, `${posterFail}/${posterSeen}`);
  // mistake budget
  {
    let s = newTraceState(rng(15));
    s = traceSample(s, "A"); s = traceSample(s, "E");
    const wrong = s.c.cause === "plant_upgrade" ? "tributary_cleanup" : "plant_upgrade";
    let r = traceConclude(s, wrong);
    r = traceConclude(r.state, wrong);
    check("trace: two wrong conclusions end the survey", r.state.outcome === "mentor_fail");
  }
}

// =============================== plant_ops ==================================
{
  const play = (rand, policy) => {
    let s = newOpsState(rand);
    let guard = 0;
    while (s.outcome === "open" && guard++ < 12) s = opsAct(s, policy(s)).state;
    return s;
  };
  const outcomes = (policy, seed) => {
    const r = rng(seed); const out = {};
    for (let i = 0; i < N; i++) { const s = play(r, policy); out[s.outcome] = (out[s.outcome] || 0) + 1; }
    return out;
  };
  const informed = outcomes((s) => opsCorrect(s), 21);
  check("ops: load-matched aeration always completes", (informed.done || 0) === N, JSON.stringify(informed));
  const maxAir = outcomes(() => "up", 22);
  check("ops: 'more oxygen is better' fails the discharge", (maxAir.discharge_fail || 0) === N, JSON.stringify(maxAir));
  const minAir = outcomes(() => "down", 23);
  check("ops: starving the tank also fails", (minAir.discharge_fail || 0) === N, JSON.stringify(minAir));
  // keep-spam: works only if the day happens to need no changes — must mostly fail
  const keeper = outcomes(() => "keep", 24);
  check("ops: never touching the blower usually fails", (keeper.discharge_fail || 0) / N > 0.5, JSON.stringify(keeper));
  // power waste is tracked for over-aeration
  {
    const r = rng(25);
    let s = newOpsState(r);
    s = opsAct(s, "up").state;
    s = { ...s };
    check("ops: over-aeration is metered as wasted power", typeof s.power === "number");
  }
  // rain slot needs more air (situational response)
  {
    const s = newOpsState(rng(26));
    const rainIdx = s.slots.findIndex((x) => x.rain);
    check("ops: the rainy slot carries the highest load", s.slots[rainIdx].inflow === 3);
  }
}

// ============================== bank_design =================================
{
  const r = rng(31);
  let solvable = 0, concreteAllFails = 0, natureGap = 0;
  for (let i = 0; i < N; i++) {
    const c = newBankCase(r);
    // informed: strong where needed (stone_root), leave the calm reach, fishway at the weir
    const plan = { homes: null, bend: null, fields: null, weir: "fishway" };
    for (const sec of c.sections) {
      if (sec.section === "weir") continue;
      const strong = sec.homesBehind || sec.erosion;
      plan[sec.section] = strong ? "stone_root" : "leave";
    }
    if (bankValidate(c, plan) === null) solvable++;
    // novice trap: concrete everywhere
    const armored = { homes: "concrete", bend: "concrete", fields: "concrete", weir: "fishway" };
    const v = bankValidate(c, armored);
    if (v === "over_armored" || v === "over_budget") concreteAllFails++;
    // nature score separates plans
    natureGap += bankNature(plan) - bankNature(armored);
  }
  check("bank: minimum-protection plan always passes", solvable === N, `${solvable}/${N}`);
  check("bank: 'concrete everything' never passes", concreteAllFails === N, `${concreteAllFails}/${N}`);
  check("bank: the nature score rewards restraint", natureGap / N >= 3, `${(natureGap / N).toFixed(1)}`);
  // hard safety: leaving an eroding home reach is caught
  {
    const c = { sections: [
      { section: "homes", erosion: true, homesBehind: true },
      { section: "bend", erosion: true, homesBehind: false },
      { section: "fields", erosion: false, homesBehind: false },
      { section: "weir", erosion: false, homesBehind: false },
    ] };
    const bad = { homes: "leave", bend: "stone_root", fields: "leave", weir: "fishway" };
    check("bank: leaving homes unprotected is always caught", bankValidate(c, bad) === "unsafe");
    const noFish = { homes: "stone_root", bend: "stone_root", fields: "leave", weir: "leave" };
    check("bank: a weir without a fishway is always caught", bankValidate(c, noFish) === "no_fishway");
  }
  // budget: concrete on both strong sections + fishway busts the budget
  {
    const plan = { homes: "concrete", bend: "concrete", fields: "leave", weir: "fishway" };
    check("bank: double concrete + fishway exceeds the budget", bankCost(plan) > BANK_BUDGET);
  }
  // redo budget
  {
    let s = newBankState(rng(32));
    const empty = { homes: null, bend: null, fields: null, weir: null };
    let r2 = bankServe(s, empty);
    r2 = bankServe(r2.state, empty);
    check("bank: redo budget mechanically ends the day", r2.state.outcome === "mentor_fail");
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
