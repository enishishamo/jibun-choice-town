#!/usr/bin/env node
// Automated gameplay QA for the night-port world's 4 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-port.mjs
import {
  YARD_DEPTH, REHANDLE_LIMIT, newYardState, yardPlace, yardSimulate, yardFinish,
  CRANE_LIFTS, CRANE_STRIKE_LIMIT, CRANE_DELAY_LIMIT, newCraneState, craneAct, craneCorrect,
  TALLY_BOXES, newTallyState, tallyAct, tallyCorrect, damageWordingOk,
  TRUCKS, newDispatchState, dispatchServe, dispatchValidate, dispatchEmptyRun, newDispatchCase,
} from "../../src/q1/portLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// ============================== yard_plan ===================================
{
  const r = rng(11);
  // mechanical refusals
  {
    let st = newYardState(rng(12));
    // force queue fronts to test each rule
    const reefer = st.queue.find((c) => c.kind === "reefer");
    const haz = st.queue.find((c) => c.kind === "hazmat");
    const norm = st.queue.find((c) => c.kind === "normal");
    st = { ...st, queue: [reefer, haz, norm] };
    check("yard: reefer into a normal column is refused", !!yardPlace(st, "0").refusal);
    check("yard: reefer into hazmat pad is refused", !!yardPlace(st, "haz").refusal);
    const st2 = { ...st, queue: [haz] };
    check("yard: hazmat into a normal column is refused", !!yardPlace(st2, "1").refusal);
    check("yard: hazmat into power pad is refused", !!yardPlace(st2, "power").refusal);
    const st3 = { ...st, queue: [norm] };
    check("yard: normal into power pad is refused", !!yardPlace(st3, "power").refusal);
    const deep = { ...st, queue: [norm], cols: [[norm, norm, norm], [], []] };
    check("yard: 4th tier on a column is refused", !!yardPlace(deep, "0").refusal);
  }
  // strategies
  const play = (rand, pick) => {
    let s = newYardState(rand);
    let guard = 0;
    while (s.outcome === "open" && guard++ < 60) {
      const c = s.queue[0];
      let t;
      if (c.kind === "reefer") t = "power";
      else if (c.kind === "hazmat") t = "haz";
      else t = pick(s, c);
      const nx = yardPlace(s, t);
      if (nx.refusal) {
        // blocked column: fall to any legal one
        const alt = ["0", "1", "2"].find((k) => !yardPlace(s, k).refusal);
        s = yardPlace(s, alt);
      } else s = nx;
    }
    return yardFinish(s);
  };
  const informedPick = (s, c) => {
    // keep columns sorted: place onto a column whose TOP leaves later or equal
    // (pickup of top >= c.pickup means c on top exits first — fine)
    const okCols = ["0", "1", "2"].filter((k) => s.cols[Number(k)].length < YARD_DEPTH);
    const good = okCols.filter((k) => {
      const col = s.cols[Number(k)];
      return col.length === 0 || col[col.length - 1].pickup >= c.pickup;
    });
    const pool = good.length ? good : okCols;
    // prefer the fullest good column (leave empties for早い箱)
    pool.sort((a, b) => s.cols[Number(b)].length - s.cols[Number(a)].length);
    return pool[0];
  };
  const naivePick = (s) => ["0", "1", "2"].find((k) => s.cols[Number(k)].length < YARD_DEPTH);
  // planner = a player who reads the WHOLE manifest and thinks ahead (the
  // queue is fully visible in the TOS panel); brute-forced here
  const planOptimal = (state) => {
    let best = Infinity, bestFinal = null;
    const rec = (s2) => {
      if (s2.outcome !== "open") {
        const reh = yardSimulate(s2).rehandles;
        if (reh < best) { best = reh; bestFinal = s2; }
        return;
      }
      const c = s2.queue[0];
      const targets = c.kind === "reefer" ? ["power"] : c.kind === "hazmat" ? ["haz"] : ["0", "1", "2"];
      for (const t of targets) {
        const nx = yardPlace(s2, t);
        if (!nx.refusal) rec(nx);
      }
    };
    rec(state);
    return { best, final: yardFinish(bestFinal) };
  };
  let planFail = 0, planWorst = 0, greedyReh = 0, naiveFail = 0, naiveReh = 0, planDone = 0;
  for (let i = 0; i < N; i++) {
    const o = planOptimal(newYardState(rng(1000 + i)));
    if (o.final.outcome === "mentor_fail") planFail++;
    if (o.final.outcome === "done") planDone++;
    planWorst = Math.max(planWorst, o.best);
    const g = play(rng(1000 + i), informedPick);
    greedyReh += yardSimulate(g).rehandles;
    const b = play(rng(1000 + i), naivePick);
    if (b.outcome === "mentor_fail") naiveFail++;
    naiveReh += yardSimulate(b).rehandles;
  }
  check("yard: a manifest-planning player never fails", planFail === 0, `${planFail}/${N}`);
  check("yard: planning play always completes", planDone === N);
  check("yard: every ship is solvable under the limit", planWorst < REHANDLE_LIMIT, `worst optimal ${planWorst}`);
  check("yard: ignoring the pickup schedule fails often", naiveFail / N > 0.3, `${naiveFail}/${N}`);
  check("yard: even greedy schedule-reading beats schedule-blind play", greedyReh / N < naiveReh / N - 1, `${(greedyReh / N).toFixed(2)} vs ${(naiveReh / N).toFixed(2)}`);
  // variation
  const sigs = new Set();
  for (let i = 0; i < 40; i++) sigs.add(newYardState(r).queue.map((c) => `${c.pickup}${c.kind[0]}`).join(""));
  check("yard: ships vary run to run", sigs.size >= 30, `${sigs.size}`);
}

// ============================== crane_lift ==================================
{
  // generation teeth: every night has a hold lift and a recheck lift
  const r = rng(21);
  let holds = 0, rechecks = 0, slows = 0;
  for (let i = 0; i < N; i++) {
    const night = newCraneState(r).lifts.map((l) => craneCorrect(l));
    if (night.includes("hold")) holds++;
    if (night.includes("recheck")) rechecks++;
    if (night.includes("slow")) slows++;
  }
  check("crane: every night contains a suspend-worthy gust", holds === N);
  check("crane: every night contains a stop-and-confirm lift", rechecks === N);
  check("crane: slow band appears nearly every night", slows / N > 0.95, `${slows}/${N}`);

  const play = (rand, policy) => {
    let s = newCraneState(rand);
    let guard = 0;
    while (s.outcome === "open" && guard++ < 20) s = craneAct(s, policy(s.lifts[s.idx])).state;
    return s;
  };
  const tally = (policy, seed) => {
    const r2 = rng(seed); const out = {};
    for (let i = 0; i < N; i++) { const o = play(r2, policy).outcome; out[o] = (out[o] || 0) + 1; }
    return out;
  };
  const lowerSpam = tally(() => "lower", 22);
  check("crane: lower-spam is stopped by the safety chain", (lowerSpam.safety_fail || 0) === N, JSON.stringify(lowerSpam));
  const holdSpam = tally(() => "hold", 23);
  check("crane: hold-spam wastes the night (dawn comes)", (holdSpam.dawn_fail || 0) === N, JSON.stringify(holdSpam));
  const recheckSpam = tally(() => "recheck", 24);
  check("crane: recheck-spam wastes the night", (recheckSpam.dawn_fail || 0) === N, JSON.stringify(recheckSpam));
  const informed = tally((l) => craneCorrect(l), 25);
  check("crane: gauge-reading play always completes", (informed.done || 0) === N, JSON.stringify(informed));
  // machine enforcement: unsafe lower never "succeeds"
  {
    const s = newCraneState(rng(26));
    const bad = { ...s, lifts: [{ wind: 5, lockPins: 3, cue: "match" }, ...s.lifts.slice(1)] };
    const r3 = craneAct(bad, "lower");
    check("crane: lowering on 3/4 locks is caught as unsafe", r3.unsafe === true && r3.state.strikes === 1);
  }
}

// ============================== tally_check =================================
{
  const play = (rand, policy) => {
    let s = newTallyState(rand);
    let guard = 0;
    while (s.outcome === "open" && guard++ < 20) {
      const b = s.boxes[s.idx];
      const a = policy(b);
      s = tallyAct(s, a.action, a.wording).state;
    }
    return s;
  };
  const tallyOutcomes = (policy, seed) => {
    const r2 = rng(seed); const out = {};
    for (let i = 0; i < N; i++) { const o = play(r2, policy).outcome; out[o] = (out[o] || 0) + 1; }
    return out;
  };
  const acceptSpam = tallyOutcomes(() => ({ action: "accept" }), 31);
  check("tally: accept-spam is exposed by the handover records", (acceptSpam.mentor_fail || 0) === N, JSON.stringify(acceptSpam));
  const querySpam = tallyOutcomes(() => ({ action: "query_number" }), 32);
  check("tally: query-spam halts the night work (fails)", (querySpam.mentor_fail || 0) === N, JSON.stringify(querySpam));
  const informed = tallyOutcomes((b) => ({ action: tallyCorrect(b), wording: "neutral" }), 33);
  check("tally: three-point matching always completes", (informed.done || 0) === N, JSON.stringify(informed));
  {
    const r4 = rng(34); let punished = 0;
    for (let i = 0; i < N; i++) {
      const s = play(r4, (b) => ({ action: tallyCorrect(b), wording: "blame_now" }));
      if (s.mistakes > 0) punished++;
    }
    check("tally: asserting WHEN damage happened is punished (a fairness mistake)", punished === N, `${punished}/${N}`);
  }
  check("tally: neutral wording is the only fair record", damageWordingOk("neutral") && !damageWordingOk("blame_now") && !damageWordingOk("ignore"));
  // aid coherence: check-digit aid flags exactly the number-issue box
  const r5 = rng(35);
  let coherent = 0;
  for (let i = 0; i < N; i++) {
    const s = newTallyState(r5);
    if (s.boxes.every((b) => (b.issue === "number") === !b.checkOk)) coherent++;
  }
  check("tally: check-digit aid is coherent with reality", coherent === N);
  check("tally: five boxes per night", newTallyState(rng(36)).boxes.length === TALLY_BOXES);
}

// ============================= truck_dispatch ===============================
{
  const allAssignments = (c) => {
    const opts = [];
    const jobIds = c.jobs.map((j) => j.id);
    const rec = (i, cur) => {
      if (i === jobIds.length) { opts.push({ ...cur }); return; }
      for (const t of TRUCKS) {
        const j = c.jobs[i];
        const routes = j.dest === "B" ? (j.tall ? ["detour"] : ["short", "detour"]) : [undefined];
        for (const route of routes) {
          cur[j.id] = { truckId: t.id, slot: j.window, route };
          rec(i + 1, cur);
        }
      }
    };
    rec(0, {});
    return opts;
  };
  const r = rng(41);
  let solvable = 0, optSum = 0, randSum = 0, randCnt = 0, randomValidFail = 0, hardCaught = 0;
  for (let i = 0; i < N; i++) {
    const c = newDispatchCase(r);
    const opts = allAssignments(c);
    const valid = opts.filter((a) => dispatchValidate(c, a) === null);
    if (valid.length > 0) solvable++;
    const best = Math.min(...valid.map((a) => dispatchEmptyRun(c, a)));
    optSum += best;
    const rv = valid[Math.floor(r() * valid.length)];
    randSum += dispatchEmptyRun(c, rv);
    randCnt++;
    // a naive plan: tall job on truck 1 must be caught
    const naive = { ...valid[0] };
    const tall = c.jobs.find((j) => j.tall);
    naive[tall.id] = { truckId: "t1", slot: tall.window, route: naive[tall.id]?.route };
    if (dispatchValidate(c, naive) === "tall_chassis") hardCaught++;
    // a tall B-bound job on the SHORT road must be caught
    if (tall.dest === "B") {
      const lowRoad = { ...valid[0], [tall.id]: { truckId: "t3", slot: tall.window, route: "short" } };
      if (dispatchValidate(c, lowRoad) !== "tall_route") failed++ , console.log("FAIL  dispatch: tall short-road not caught");
    }
    // wrong slot must be caught
    const late = { ...valid[0], [c.jobs[3].id]: { truckId: valid[0][c.jobs[3].id].truckId, slot: c.jobs[3].window === 1 ? 2 : 1 } };
    if (dispatchValidate(c, late) !== null) randomValidFail++;
  }
  check("dispatch: every morning is solvable", solvable === N, `${solvable}/${N}`);
  check("dispatch: optimizing empty runs is real mastery headroom", optSum / N < randSum / randCnt - 0.3, `opt ${(optSum / N).toFixed(2)} vs random-valid ${(randSum / randCnt).toFixed(2)}`);
  check("dispatch: high-cube on a normal chassis is always caught", hardCaught === N, `${hardCaught}/${N}`);
  check("dispatch: missing the booked window is always caught", randomValidFail === N, `${randomValidFail}/${N}`);
  // redo budget machine-enforced
  {
    let s = { c: newDispatchCase(rng(42)), redos: 0, outcome: "open" };
    const bad = Object.fromEntries(s.c.jobs.map((j) => [j.id, { truckId: "t1", slot: j.window }]));
    let r2 = dispatchServe(s, bad);
    r2 = dispatchServe(r2.state, bad);
    check("dispatch: redo budget mechanically ends the morning", r2.state.outcome === "mentor_fail");
  }
  // variation
  const sigs = new Set();
  const r7 = rng(43);
  for (let i = 0; i < 40; i++) sigs.add(newDispatchCase(r7).jobs.map((j) => `${j.dest}${j.window}${j.tall ? "T" : ""}${j.heavy ? "H" : ""}`).join("|"));
  check("dispatch: mornings vary run to run", sigs.size >= 12, `${sigs.size}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
