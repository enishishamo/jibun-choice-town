#!/usr/bin/env node
// Automated gameplay QA for the waste world's 4 games (Stage 7).
// Simulates player strategies against src/q1/wasteLogic.ts directly:
// no-action / spam / all-select / ignore-C / wrong-on-purpose / shortest /
// repeated strategy / random / optimal — thoughtless play must mostly fail,
// informed play must reliably win, and every case must be solvable.
//
// Usage: node factory/harness/gameplay-qa-waste.mjs

import {
  CURB_MISTAKE_LIMIT, makeBags, judgeBag, pickDayType,
  PIT_TURNS, TEMP_MIN, TEMP_MAX, newPit, pitStep, adjacent,
  GAS_TIME, newGasCase, inspect, gasActionCorrect, newGasState, gasInspect, gasRequest,
  LF_DAYS, LF_CELLS, LF_CELL_CAP, LF_SOIL, LF_TANK_CAP, newLandfill, lfPlace, lfNight, lfNextLoad, lfCellAccepts, lfExposed,
} from "../../src/q1/wasteLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const N = 500;

// ============================ curb_check ====================================
function playCurb(bags, decide) {
  let mistakes = 0;
  for (const bag of bags) {
    const r = judgeBag(bag, decide(bag));
    if (r === "fire") return { result: "fire" };
    if (r === "mistake") { mistakes++; if (mistakes >= CURB_MISTAKE_LIMIT) return { result: "too_many_mistakes" }; }
  }
  return { result: "done", mistakes };
}
{
  const rand = rng(11);
  let loadAllWin = 0, rejectAllWin = 0, randomWin = 0, optimalWin = 0, perfect = 0, hazardSeen = 0;
  const correct = (b) => (b.truth === "ok" ? "load" : b.truth === "wrong_type" ? "reject_wrong_type" : b.truth === "hazard" ? "reject_hazard" : "reject_wrong_bag");
  const daysSeen = new Set();
  for (let i = 0; i < N; i++) {
    const day = pickDayType(rand);
    daysSeen.add(day);
    const bags = makeBags(rand, day);
    if (bags.some((b) => b.truth === "hazard")) hazardSeen++;
    if (playCurb(bags, () => "load").result === "done") loadAllWin++;
    if (playCurb(bags, (b) => (b.truth === "hazard" ? "reject_hazard" : "reject_wrong_type")).result === "done") rejectAllWin++;
    const acts = ["load", "reject_wrong_type", "reject_hazard", "reject_wrong_bag"];
    if (playCurb(bags, () => acts[Math.floor(rand() * 4)]).result === "done") randomWin++;
    const o = playCurb(bags, correct);
    if (o.result === "done") { optimalWin++; if (o.mistakes === 0) perfect++; }
  }
  check("curb: every case solvable by informed play", optimalWin === N && perfect === N);
  check("curb: blind load-all NEVER completes (>=2 violations, budget 1)", loadAllWin === 0, `${loadAllWin}/${N} won`);
  check("curb: reject-everything always fails", rejectAllWin === 0, `${rejectAllWin}`);
  check("curb: random mashing mostly fails", randomWin / N < 0.15, `${randomWin}/${N}`);
  check("curb: hazards appear often enough to matter", hazardSeen / N > 0.4, `${hazardSeen}/${N}`);
  // variation: bag sets differ
  const sig = (bags) => bags.map((b) => b.truth[0]).join("");
  const sigs = new Set(); const r2 = rng(12);
  for (let i = 0; i < 40; i++) sigs.add(sig(makeBags(r2)));
  check("curb: cases vary run to run", sigs.size >= 10, `${sigs.size} distinct`);
  check("curb: collection category varies (rule must be read)", daysSeen.size === 2, [...daysSeen].join(","));
}

// ============================ pit_crane =====================================
function playPit(rand, policy) {
  let s = newPit(rand);
  for (let guard = 0; guard < 40; guard++) {
    const action = policy(s);
    const r = pitStep(s, action, rand);
    if (r.event === "invalid") return { result: "stuck_invalid" };
    if (r.event === "overheat_fail") return { result: "overheat" };
    if (r.event === "cold_fail") return { result: "cold" };
    if (r.event === "cleared") return { result: "cleared" };
    s = r.state;
  }
  return { result: "loop" };
}
const firstIdx = (s, t) => s.grid.findIndex((c) => c === t);
const findMixPair = (s) => {
  for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) {
    if (a !== b && adjacent(a, b)) {
      const pair = [s.grid[a], s.grid[b]].sort().join("+");
      if (pair === "dry+wet") return { a, b };
    }
  }
  return null;
};
function optimalPitPolicy(s) {
  const has = (t) => firstIdx(s, t) >= 0;
  // keep a mixed reserve: if temp comfortable and a mix is possible, invest
  if (s.temp >= 900 && s.temp <= 950 && findMixPair(s) && s.grid.filter((c) => c === "mixed").length < 2) {
    const p = findMixPair(s);
    return { kind: "mix", ...p };
  }
  if (s.temp < 880) {
    if (has("dry")) return { kind: "grab", idx: firstIdx(s, "dry") };
    if (has("mixed")) return { kind: "grab", idx: firstIdx(s, "mixed") };
    return { kind: "wait" };
  }
  if (s.temp > 940) {
    if (has("wet")) return { kind: "grab", idx: firstIdx(s, "wet") };
    if (has("mixed")) return { kind: "grab", idx: firstIdx(s, "mixed") };
    return { kind: "wait" };
  }
  if (has("mixed")) return { kind: "grab", idx: firstIdx(s, "mixed") };
  if (has("dry") && s.temp < 920) return { kind: "grab", idx: firstIdx(s, "dry") };
  if (has("wet") && s.temp > 920) return { kind: "grab", idx: firstIdx(s, "wet") };
  return { kind: "wait" };
}
{
  const rand = rng(21);
  const run = (policy, n, seed) => {
    const r = rng(seed); const out = {};
    for (let i = 0; i < n; i++) { const x = playPit(r, policy).result; out[x] = (out[x] || 0) + 1; }
    return out;
  };
  const noAction = run(() => ({ kind: "wait" }), N, 22);
  check("pit: doing nothing fails fast", !noAction.cleared, JSON.stringify(noAction));
  const dryGreedy = run((s) => (firstIdx(s, "dry") >= 0 ? { kind: "grab", idx: firstIdx(s, "dry") } : { kind: "wait" }), N, 23);
  check("pit: dry-spam overheats or starves (mostly fails)", (dryGreedy.cleared || 0) / N < 0.2, JSON.stringify(dryGreedy));
  const randomPolicy = (s) => {
    const nonEmpty = s.grid.map((c, i) => (c !== "empty" ? i : -1)).filter((i) => i >= 0);
    if (!nonEmpty.length) return { kind: "wait" };
    return { kind: "grab", idx: nonEmpty[Math.floor(rand() * nonEmpty.length)] };
  };
  const randomRun = run(randomPolicy, N, 24);
  check("pit: random grabbing mostly fails", (randomRun.cleared || 0) / N < 0.35, JSON.stringify(randomRun));
  const optimal = run(optimalPitPolicy, N, 25);
  check("pit: informed play reliably clears", (optimal.cleared || 0) / N > 0.9, JSON.stringify(optimal));
}

// ============================ gas_watch =====================================
{
  const rand = rng(31);
  let blindActionWin = 0, panicWin = 0, optimalWin = 0, allInspectWin = 0, causesSeen = new Set();
  const acts = ["refill", "recalib", "notify_operator", "stop_furnace"];
  for (let i = 0; i < N; i++) {
    const c = newGasCase(rand);
    causesSeen.add(c.cause + ":" + c.alertMeter);
    // blind action (no inspection): random pick
    if (gasActionCorrect(c, acts[Math.floor(rand() * 4)])) blindActionWin++;
    // panic stop always
    if (gasActionCorrect(c, "stop_furnace")) panicWin++;
    // optimal: inspect calib first (splits sensor_drift), then tank, decide — 3 slots max
    let cause = null;
    if (inspect(c, "calib").pointsTo === "sensor_drift") cause = "sensor_drift";
    else if (inspect(c, "tank").pointsTo === "chemical_out") cause = "chemical_out";
    else cause = "incomplete_burn"; // 2 checks used, both negative -> burn
    const act = cause === "chemical_out" ? "refill" : cause === "sensor_drift" ? "recalib" : "notify_operator";
    if (gasActionCorrect(c, act)) optimalWin++;
    // all-inspect uses 4 slots + action = 5 <= GAS_TIME, still needs the right mapping
    if (4 + 1 <= GAS_TIME && gasActionCorrect(c, act)) allInspectWin++;
  }
  check("gas: blind action ~25% (no free win)", blindActionWin / N < 0.35, `${blindActionWin}/${N}`);
  check("gas: panic furnace-stop never wins", panicWin === 0);
  check("gas: 2-check triage always identifies the cause", optimalWin === N, `${optimalWin}/${N}`);
  check("gas: causes and meters vary", causesSeen.size >= 4, [...causesSeen].join(","));
  // state machine: at most GAS_TIME-1 inspections are possible (all-select impossible)
  {
    const r2 = rng(32);
    let st = newGasState(r2);
    for (const chk of ["calib", "tank", "furnace", "filter"]) st = gasInspect(st, chk);
    check("gas: all-4-inspect is impossible (time budget)", st.evidence.length <= GAS_TIME - 1, `${st.evidence.length} inspections`);
    const wrong = gasRequest(st, "stop_furnace");
    check("gas: wrong request ends the case (state machine)", wrong.outcome === "failed_wrong_request");
  }
  // one fixed first check must NOT uniquely identify every cause
  {
    const texts = (chk) => ["chemical_out", "sensor_drift", "incomplete_burn"].map((cause) => inspect({ cause, alertMeter: "CO" }, chk).text);
    const uniquelyIdentifies = (chk) => new Set(texts(chk)).size === 3;
    check("gas: no single check identifies all causes", !["calib", "tank", "furnace", "filter"].some(uniquelyIdentifies));
  }
  check("gas: evidence never contradicts (calib positive only for drift)", (() => {
    for (const cause of ["chemical_out", "sensor_drift", "incomplete_burn"]) {
      const c = { cause, alertMeter: "CO" };
      if ((inspect(c, "calib").pointsTo === "sensor_drift") !== (cause === "sensor_drift")) return false;
      if ((inspect(c, "tank").pointsTo === "chemical_out") !== (cause === "chemical_out")) return false;
    }
    return true;
  })());
}

// ============================ landfill_ops ==================================
function playLandfill(rand, placer, coverer) {
  let s = newLandfill(rand);
  for (let guard = 0; guard < 60; guard++) {
    // place all of today's loads
    while (s.placedToday < s.schedule[s.day - 1].length) {
      const cell = placer(s);
      const r = lfPlace(s, cell);
      if (r.result === "no_space_fail") return { result: "no_space" };
      if (r.result === "cell_full" || r.result === "type_mismatch") {
        const load = lfNextLoad(s);
        let open = -1;
        for (let i = 0; i < LF_CELLS; i++) if (lfCellAccepts(s, i, load)) { open = i; break; }
        if (open < 0) return { result: "no_space" };
        s = lfPlace(s, open).state;
        continue;
      }
      s = r.state;
    }
    const night = lfNight(s, coverer(s));
    if (night.note.includes("足りない")) {
      // cover request over budget: retry with no covers (worst case)
      const n2 = lfNight(s, []);
      if (n2.event === "overflow_fail") return { result: "overflow" };
      if (n2.event === "complaint_fail") return { result: "complaints" };
      if (n2.event === "cleared") return { result: "cleared", soil: n2.state.soil };
      s = n2.state;
      continue;
    }
    if (night.event === "overflow_fail") return { result: "overflow" };
    if (night.event === "complaint_fail") return { result: "complaints" };
    if (night.event === "cleared") return { result: "cleared", soil: night.state.soil };
    s = night.state;
  }
  return { result: "loop" };
}
{
  const run = (placer, coverer, n, seed) => {
    const r = rng(seed); const out = {};
    for (let i = 0; i < n; i++) { const x = playLandfill(r, placer, coverer).result; out[x] = (out[x] || 0) + 1; }
    return out;
  };
  const spreadPlacer = (s) => { // ignore-C: spread loads across legal cells evenly
    const load = lfNextLoad(s);
    let best = -1;
    for (let i = 0; i < LF_CELLS; i++) if (lfCellAccepts(s, i, load) && (best < 0 || s.fill[i] < s.fill[best])) best = i;
    return best < 0 ? 0 : best;
  };
  const concentratePlacer = (s) => { // informed: fullest LEGAL cell first (per type)
    const load = lfNextLoad(s);
    let best = -1;
    for (let i = 0; i < LF_CELLS; i++) if (lfCellAccepts(s, i, load) && (best < 0 || s.fill[i] > s.fill[best])) best = i;
    return best < 0 ? 0 : best;
  };
  const neverCover = () => [];
  // duty player: cover everything exposed while material lasts; when material
  // is running short, ration it for the remaining bad-weather nights (this is
  // the sanctioned scarcity judgment, not routine skipping)
  // duty is enforced by lfNight: always cover min(exposed, soil)
  const dutyCover = (s) => lfExposed(s).slice(0, s.soil);
  // careless player: covers only when it already rained / complaints exist
  const lazyCover = (s) => (s.tank > 3 || s.complaints > 0 ? lfExposed(s).slice(0, s.soil) : []);
  const noCover = run(spreadPlacer, neverCover, N, 41);
  check("landfill: shirking the covering duty mostly fails", (noCover.cleared || 0) / N < 0.2, JSON.stringify(noCover));
  const lazy = run(spreadPlacer, lazyCover, N, 42);
  check("landfill: covering only after trouble is unreliable", (lazy.cleared || 0) / N < 0.6, JSON.stringify(lazy));
  const sloppyDuty = run(spreadPlacer, dutyCover, N, 46);
  const informed = run(concentratePlacer, dutyCover, N, 43);
  check("landfill: duty + CONCENTRATED placement reliably wins", (informed.cleared || 0) / N > 0.9, JSON.stringify(informed));
  check("landfill: duty with sloppy spread placement is worse (placement matters)", (informed.cleared || 0) - (sloppyDuty.cleared || 0) > N * 0.15, `${informed.cleared} vs ${sloppyDuty.cleared}`);
  // duty enforcement: under-covering while material suffices is rejected
  {
    const r6 = rng(47);
    let st = newLandfill(r6);
    st = lfPlace(st, 0).state; // one exposed cell, plenty of soil
    const n = lfNight(st, []);
    check("landfill: skipping the duty while material suffices is rejected", n.note.includes("日課"), n.note);
  }
  // variation
  const r5 = rng(44); const sigs = new Set();
  for (let i = 0; i < 30; i++) { const s = newLandfill(r5); sigs.add(s.schedule.map((d) => d.map((l) => l[0]).join("")).join(".") + "|" + s.weather.map((w) => w[0]).join("")); }
  check("landfill: schedules and weather vary", sigs.size >= 15, `${sigs.size}`);
  // every generated case is solvable by informed play (stronger: 100% over 300)
  const solv = run(concentratePlacer, dutyCover, 300, 45);
  check("landfill: every sampled case solvable", (solv.cleared || 0) === 300, JSON.stringify(solv));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
