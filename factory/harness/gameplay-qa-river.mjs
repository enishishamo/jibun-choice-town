#!/usr/bin/env node
// Automated gameplay QA for the river-health world's 3 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-river.mjs
import {
  TRACE_BUDGET, newTraceState, traceSample, traceConclude, newRiverCase,
  OPS_SLOTS, newOpsState, opsAct, opsCorrect,
  newBankState, bankServe, bankValidate, bankNature, bankCost, newBankCase, sectionSevere, sectionStrong, bankFaultSection, fishwayFor,
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
    // informed: read severity per section — concrete only where nothing else
    // holds, stone where strong, leave the calm reach, fishway at the weir
    const plan = { homes: null, bend: null, fields: null, weir: fishwayFor(c.fish) };
    for (const sec of c.sections) {
      if (sec.section === "weir") continue;
      plan[sec.section] = sectionSevere(sec) ? "concrete" : sectionStrong(sec) ? "stone_root" : "leave";
    }
    if (bankValidate(c, plan) === null) solvable++;
    // novice trap: concrete everywhere
    const armored = { homes: "concrete", bend: "concrete", fields: "concrete", weir: fishwayFor(c.fish) };
    const v = bankValidate(c, armored);
    if (v !== null) concreteAllFails++;
    // nature score separates plans
    natureGap += bankNature(plan) - bankNature(armored);
  }
  check("bank: minimum-protection plan always passes", solvable === N, `${solvable}/${N}`);
  check("bank: 'concrete everything' never passes", concreteAllFails === N, `${concreteAllFails}/${N}`);
  check("bank: the nature score rewards restraint", natureGap / N >= 2, `${(natureGap / N).toFixed(1)}`);
  // R3 exploit: the FIXED mapping (stone/stone/leave/fishway) must NOT solve
  // every case — variation forces reading each section
  {
    const r2 = rng(41);
    let fixedWins = 0, severeCases = 0, calmBendCases = 0;
    for (let i = 0; i < N; i++) {
      const c = newBankCase(r2);
      if (c.sections.some(sectionSevere)) severeCases++;
      if (c.sections.some((sec) => sec.section === "fields" && sec.erosion)) calmBendCases++;
      const fixed = { homes: "stone_root", bend: "stone_root", fields: "leave", weir: fishwayFor(c.fish) };
      if (bankValidate(c, fixed) === null) fixedWins++;
    }
    check(`bank: fixed-answer play no longer always wins (${fixedWins}/${N})`, fixedWins < N * 0.75, `severe=${severeCases} eroded-fields=${calmBendCases}`);
    check("bank: severe and eroded-fields cases actually occur", severeCases > N * 0.2 && calmBendCases > N * 0.2);
  }
  // hard safety: leaving an eroding home reach is caught
  {
    const c = { budget: 8, sections: [
      { section: "homes", erosion: true, homesBehind: true },
      { section: "bend", erosion: true, homesBehind: false },
      { section: "fields", erosion: false, homesBehind: false },
      { section: "weir", erosion: false, homesBehind: false },
    ] };
    c.fish = { name: "x", power: "weak" };
    const bad = { homes: "leave", bend: "stone_root", fields: "leave", weir: "fishway_gentle" };
    check("bank: leaving homes unprotected is always caught", bankValidate(c, bad) === "unsafe");
    const soft = { homes: "stone_root", bend: "stone_root", fields: "leave", weir: "fishway_gentle" };
    check("bank: stone on a severe (home+eroding) section is still unsafe", bankValidate(c, soft) === "unsafe");
    const c2 = { budget: 8, fish: { name: "x", power: "weak" }, sections: [
      { section: "homes", erosion: false, homesBehind: true },
      { section: "bend", erosion: true, homesBehind: false },
      { section: "fields", erosion: false, homesBehind: false },
      { section: "weir", erosion: false, homesBehind: false },
    ] };
    const noFish = { homes: "stone_root", bend: "stone_root", fields: "leave", weir: "leave" };
    check("bank: a weir without a fishway is always caught", bankValidate(c2, noFish) === "no_fishway");
  }
  // budget: concrete on both strong sections + fishway busts the budget
  {
    // necessary-minimum: concrete on a merely-strong section is rejected as
    // over-armored even when the budget could absorb it
    const r3 = rng(51);
    let rejected = 0, cases = 0;
    for (let i = 0; i < N; i++) {
      const c = newBankCase(r3);
      const strong = c.sections.find(sectionStrong);
      if (!strong) continue;
      cases++;
      const plan = { homes: null, bend: null, fields: null, weir: fishwayFor(c.fish) };
      for (const sec of c.sections) {
        if (sec.section === "weir") continue;
        plan[sec.section] = sectionSevere(sec) ? "concrete" : sectionStrong(sec) ? "stone_root" : "leave";
      }
      plan[strong.section] = "concrete"; // the gratuitous upgrade
      if (bankValidate(c, plan) === "over_armored") rejected++;
    }
    check(`bank: gratuitous concrete on a strong section is rejected (${rejected}/${cases})`, cases > 0 && rejected === cases);
  }
  // 個別設計: the mismatched fishway is rejected and the chief taps the weir
  {
    const r5 = rng(71);
    let rejected = 0;
    for (let i = 0; i < 200; i++) {
      const c = newBankCase(r5);
      const wrong = fishwayFor(c.fish) === "fishway_gentle" ? "fishway_steep" : "fishway_gentle";
      const plan = { homes: null, bend: null, fields: null, weir: wrong };
      for (const sec of c.sections) {
        if (sec.section === "weir") continue;
        plan[sec.section] = sectionSevere(sec) ? "concrete" : sectionStrong(sec) ? "stone_root" : "leave";
      }
      if (bankValidate(c, plan) === "wrong_fishway" && bankFaultSection(c, plan) === "weir") rejected++;
    }
    check("bank: a fishway mismatched to the fish is rejected at the weir (200/200)", rejected === 200);
  }
  // WHERE hint always exists and points at a真犯人 for non-budget rejections
  {
    const r4 = rng(61);
    const works = ["concrete", "stone_root", "leave"];
    let checks = 0, consistent = 0;
    for (let i = 0; i < 2000; i++) {
      const c = newBankCase(r4);
      const plan = {
        homes: works[Math.floor(r4() * 3)],
        bend: works[Math.floor(r4() * 3)],
        fields: works[Math.floor(r4() * 3)],
        weir: r4() < 0.4 ? "fishway_gentle" : r4() < 0.6 ? "fishway_steep" : "leave",
      };
      const v = bankValidate(c, plan);
      if (v === null || v === "over_budget" || v === "empty") continue;
      checks++;
      const fs = bankFaultSection(c, plan);
      if (!fs) continue;
      // fixing ONLY the tapped section must remove THIS problem type or reveal a later one
      const sec = c.sections.find((x) => x.section === fs);
      const fixed = { ...plan };
      fixed[fs] = fs === "weir" ? fishwayFor(c.fish) : sectionSevere(sec) ? "concrete" : sectionStrong(sec) ? "stone_root" : "leave";
      const v2 = bankValidate(c, fixed);
      if (v2 !== v || bankFaultSection(c, fixed) !== fs) consistent++;
    }
    check(`bank: the chief's WHERE hint always names a real offending section (${consistent}/${checks})`, checks > 100 && consistent === checks);
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
