#!/usr/bin/env node
// Automated gameplay QA for the zoo world's 4 games (Stage 8).
// Usage: node factory/harness/gameplay-qa-zoo.mjs

import {
  BABY_DAYS, BABY_MISTAKE_LIMIT, newBabyWeek, babyCorrect, newBabyState, babyMakeCall,
  CHECK_COST, BURDEN_BUDGET, newZooCase, zooInspect, zooPlanCorrect, newZooState, zooCheck, zooDecide,
  newFeedCase, feedValidate, feedExpected, SIZE_COST, FEED_REDO_LIMIT, newFeedState, feedServe, BABY_MILK_LINE, vegShort, BLOOD_ABORT_P,
  DEBUT_SLOTS, SIGN_LIMIT, EXPECT_MIN, newDebutCase, startDebut, debutStep, planValue, debutGrade, shrinkRelief,
} from "../../src/q1/zooLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// ============================ baby_care =====================================
function playBaby(days, decide) {
  // drive through the enforced state machine
  let st = { days, idx: 0, mistakes: 0, outcome: "open" };
  for (let g = 0; g < 10 && st.outcome === "open"; g++) {
    st = babyMakeCall(st, decide(st.days, st.idx)).state;
  }
  return st.outcome === "done" ? "done" : "fail";
}
{
  const rand = rng(11);
  let okSpam = 0, consultSpam = 0, adjustSpam = 0, informed = 0, weeksWithBoth = 0, dipWeeks = 0;
  for (let i = 0; i < N; i++) {
    const days = newBabyWeek(rand);
    const labels = days.map((_, k) => babyCorrect(days, k));
    if (labels.includes("adjust") && labels.includes("consult")) weeksWithBoth++;
    if (days.some((d, k) => d.delta < 0 && labels[k] === "ok")) dipWeeks++;
    if (playBaby(days, () => "ok") === "done") okSpam++;
    if (playBaby(days, () => "consult") === "done") consultSpam++;
    if (playBaby(days, () => "adjust") === "done") adjustSpam++;
    if (playBaby(days, (d, k) => babyCorrect(d, k)) === "done") informed++;
  }
  check("baby: every week teaches both adjust AND consult", weeksWithBoth === N);
  check("baby: benign dips appear (overreaction is punished)", dipWeeks / N > 0.25, `${dipWeeks}/${N}`);
  check("baby: ok-spam never completes", okSpam === 0, `${okSpam}`);
  check("baby: consult-spam never completes", consultSpam === 0, `${consultSpam}`);
  check("baby: adjust-spam never completes", adjustSpam === 0, `${adjustSpam}`);
  check("baby: rule-following play always completes", informed === N);
  // layouts are NOT memorizable: the stall pair and the consult day move
  {
    const r9 = rng(19); const layouts = new Set();
    for (let i = 0; i < 300; i++) {
      const days = newBabyWeek(r9);
      const labels = days.map((_, k) => babyCorrect(days, k));
      layouts.add(labels.join(","));
    }
    check("baby: many distinct week layouts (positions not memorizable)", layouts.size >= 8, `${layouts.size} layouts`);
  }
}

// ============================ zoo_checkup ===================================
{
  const rand = rng(21);
  // coherence: no single check separates all three causes
  const texts = (chk) => ["worms", "overfeed", "injury"].map((cause) => zooInspect({ cause }, chk).text);
  check("checkup: no single non-blood check identifies all causes", !["diary", "camera", "inspect", "fecal"].some((chk) => new Set(texts(chk)).size === 3));
  check("checkup: blood alone identifies (as designed high-burden fallback)", new Set(texts("blood")).size === 3);
  let blindWin = 0, lowBurdenWin = 0, lowBurdenCost = 0, bloodCost = 0;
  for (let i = 0; i < N; i++) {
    const c = newZooCase(rand);
    const plans = ["deworm", "diet_review", "rest_pain"];
    if (zooPlanCorrect(c, plans[Math.floor(rand() * 3)])) blindWin++;
    // expert route: diary+camera (0), then targeted 1-burden check
    let cause = null, cost = 0;
    const cam = zooInspect(c, "camera");
    if (cam.pointsTo === "injury") { cost += CHECK_COST.inspect; cause = zooInspect(c, "inspect").pointsTo === "injury" ? "injury" : null; }
    if (!cause) { cost += CHECK_COST.fecal; cause = zooInspect(c, "fecal").pointsTo || "injury"; }
    const plan = cause === "worms" ? "deworm" : cause === "overfeed" ? "diet_review" : "rest_pain";
    if (zooPlanCorrect(c, plan)) { lowBurdenWin++; lowBurdenCost += cost; }
    bloodCost += CHECK_COST.blood;
  }
  check("checkup: blind diagnosis ~1/3 only", blindWin / N < 0.45, `${blindWin}/${N}`);
  check("checkup: low-burden route always diagnoses", lowBurdenWin === N, `${lowBurdenWin}`);
  check("checkup: expert burden well under blood-first", lowBurdenCost / N < 1.2 && lowBurdenCost / N < bloodCost / N, `avg ${(lowBurdenCost / N).toFixed(2)} vs blood ${CHECK_COST.blood}`);
  check("checkup: budget forbids blood + both 1-burden checks", CHECK_COST.blood + CHECK_COST.fecal + CHECK_COST.inspect > BURDEN_BUDGET);
  // blood carries a REAL mechanical risk; the low-burden route never does
  {
    const r3 = rng(23);
    let aborted = 0;
    for (let i = 0; i < N; i++) {
      let st = newZooState(r3);
      st = zooCheck(st, "diary", r3).state;
      st = zooCheck(st, "camera", r3).state;
      const r = zooCheck(st, "blood", r3);
      if (r.state.outcome === "restraint_aborted") aborted++;
    }
    check("checkup: blood sometimes aborts the day (restraint risk)", aborted / N > 0.05 && aborted / N < 0.25, `${aborted}/${N}`);
    // the ladder is machine-enforced: no capture before low-burden observation
    {
      const fresh = newZooState(rng(26));
      const first = zooCheck(fresh, "blood", () => 0.9);
      check("checkup: blood as FIRST check is refused (last resort, enforced)", "refused" in first.result && first.state.checked.length === 0);
      let st2 = zooCheck(fresh, "diary", () => 0.9).state;
      const second = zooCheck(st2, "blood", () => 0.9);
      check("checkup: blood as second check still refused (needs 2 prior looks)", "refused" in second.result);
      st2 = zooCheck(st2, "camera", () => 0.9).state;
      const third = zooCheck(st2, "blood", () => 0.9);
      check("checkup: blood allowed after two low-burden checks", "text" in third.result);
    }
    // no findings, no plan: a zero-evidence diagnosis is refused by the rules
    {
      const fresh = newZooState(rng(27));
      const r = zooDecide(fresh, "deworm");
      check("checkup: zero-evidence diagnosis refused (no lucky 1/3 guess)", r.outcome === "open" && !!r.refusal);
    }
    check("checkup: expert 0/1-burden route carries no abort risk", ["diary","camera","inspect","fecal"].every((k)=>{const st=newZooState(rng(24));return zooCheck(st,k,()=>0.0).state.outcome==="open";}));
  }
  // machine-enforced: over-budget refused, duplicates refused, one-shot diagnosis
  {
    let st = newZooState(rng(22));
    st = zooCheck(st, "diary", () => 0.9).state;
    st = zooCheck(st, "camera", () => 0.9).state;
    st = zooCheck(st, "blood", () => 0.9).state; // burden 3
    st = zooCheck(st, "fecal", () => 0.9).state; // burden 4 = budget
    const over2 = zooCheck(st, "inspect", () => 0.9);
    check("checkup: over-budget check refused by the rules", "refused" in over2.result, JSON.stringify(st.checked));
    const dup = zooCheck(st, "blood", () => 0.9);
    check("checkup: duplicate check refused by the rules", "refused" in dup.result);
    let s2 = zooDecide(st, "deworm");
    const after = zooDecide(s2, "diet_review");
    check("checkup: diagnosis is one-shot in the rules", after.outcome === s2.outcome);
  }
}

// ============================ feed_prep =====================================
{
  const rand = rng(31);
  let correctWin = 0, staticLookupFails = 0, breadFails = 0, wrongSizeFails = 0, greedyFails = 0;
  let shortSeen = 0, plentySeen = 0, lineStraddle = new Set();
  for (let i = 0; i < N; i++) {
    const c = newFeedCase(rand);
    const exp = feedExpected(c);
    lineStraddle.add(c.cond.babyWeighin >= BABY_MILK_LINE ? "M" : "S");
    if (vegShort(c)) shortSeen++; else plentySeen++;
    const trays = { mother: exp.mother.map((x) => ({ ...x })), baby: exp.baby.map((x) => ({ ...x })), goat: exp.goat.map((x) => ({ ...x })) };
    if (feedValidate(c, trays) === null) correctWin++;
    // static lookup (ignores today's diary): always milk S + mother veg S + goat pellet
    const staticTrays = {
      mother: [{ item: "bamboo", size: "M" }, { item: "veg", size: "S" }],
      baby: [{ item: "milk", size: "S" }],
      goat: [{ item: "hay", size: "M" }, { item: "pellet", size: "S" }],
    };
    if (feedValidate(c, staticTrays) !== null) staticLookupFails++;
    // bread decoy
    const breadTrays = { ...trays, goat: [{ item: "hay", size: "M" }, { item: "bread", size: "S" }] };
    if (feedValidate(c, breadTrays) !== null) breadFails++;
    // size sloppiness: baby always M
    const bigMilk = { ...trays, baby: [{ item: "milk", size: "M" }] };
    if (c.cond.babyWeighin < BABY_MILK_LINE && feedValidate(c, bigMilk) !== null) wrongSizeFails++;
    // greedy: goat takes the veg on a short morning
    if (vegShort(c)) {
      const greedy = { ...trays, mother: [{ item: "bamboo", size: "M" }, { item: "pellet", size: "S" }], goat: [{ item: "hay", size: "M" }, { item: "veg", size: "S" }] };
      if (feedValidate(c, greedy) !== null) greedyFails++;
    }
  }
  check("feed: derived (rule x diary) trays always accepted", correctWin === N, `${correctWin}/${N}`);
  check("feed: baby milk line straddles both sizes across runs", lineStraddle.size === 2);
  check("feed: static memorized trays fail on most mornings", staticLookupFails / N > 0.6, `${staticLookupFails}/${N}`);
  check("feed: bread decoy always rejected", breadFails === N);
  check("feed: oversized milk rejected when under the line", wrongSizeFails > 0);
  check("feed: taking the short veg from the mother is rejected", greedyFails === shortSeen, `${greedyFails}/${shortSeen}`);
  check("feed: both short and plenty mornings occur", shortSeen > 100 && plentySeen > 100, `${shortSeen}/${plentySeen}`);
  // all-select exploit: correct items PLUS extra filled slots must be rejected
  {
    const c = newFeedCase(rng(33));
    const exp = feedExpected(c);
    const overfull = {
      mother: [...exp.mother.map((x) => ({ ...x })), { item: "hay", size: "S" }],
      baby: [...exp.baby.map((x) => ({ ...x })), { item: "milk", size: "S" }],
      goat: exp.goat.map((x) => ({ ...x })),
    };
    check("feed: extra filled slots beyond the ration are rejected (no all-select)", feedValidate(c, overfull) !== null, String(feedValidate(c, overfull)));
    const everything = {
      mother: [{ item: "bamboo", size: "M" }, { item: "veg", size: "M" }, { item: "veg", size: "S" }, { item: "hay", size: "M" }],
      baby: [{ item: "milk", size: "M" }, { item: "milk", size: "S" }],
      goat: [{ item: "hay", size: "M" }, { item: "veg", size: "S" }, { item: "pellet", size: "S" }],
    };
    check("feed: 'pile everything on' never passes", feedValidate(c, everything) !== null);
  }
  // shortage is ARITHMETIC, not a flag: same stock number can be short or
  // plenty depending on the mother's condition (stock 2 vs need 2 or 3)
  {
    const c2 = { cond: { babyWeighin: 520, motherNursing: "strong" }, stock: { bamboo: 2, milk: 2, hay: 3, veg: 2, pellet: 2, bread: 2 } };
    const c3 = { cond: { babyWeighin: 520, motherNursing: "normal" }, stock: { bamboo: 2, milk: 2, hay: 3, veg: 2, pellet: 2, bread: 2 } };
    check("feed: shortage depends on computed need, not the stock number alone", vegShort(c2) === true && vegShort(c3) === false);
  }
  // redo budget enforced in the machine
  {
    let st = newFeedState(rng(32));
    const bad = { mother: [{ item: "bread", size: "S" }, { item: "bread", size: "S" }], baby: [{ item: "bread", size: "S" }], goat: [{ item: "bread", size: "S" }, { item: "bread", size: "S" }] };
    let r = feedServe(st, bad);
    r = feedServe(r.state, bad);
    check("feed: redo budget mechanically ends the shift", r.state.outcome === "mentor_fail");
  }
}

// ============================ debut_plan ====================================
function playDebut(rand, planFor, policy) {
  const c = newDebutCase(rand);
  let s = startDebut(c, planFor(c));
  if (s.outcome === "expect_fail") return { result: "expect_fail" };
  for (let guard = 0; guard < 10 && s.outcome === "open"; guard++) {
    s = debutStep(s, policy(s), rand);
  }
  return { result: s.outcome, signs: s.signs, grade: s.outcome.startsWith("done") ? debutGrade(s) : null };
}
{
  const run = (planFor, policy, n, seed) => {
    const r = rng(seed); const out = {};
    for (let i = 0; i < n; i++) { const x = playDebut(r, planFor, policy).result; out[x] = (out[x] || 0) + 1; }
    return out;
  };
  const maxPlan = () => ({ duration: 3, distance: 3, capped: false });
  const minPlan = () => ({ duration: 1, distance: 1, capped: true });
  const matchedPlan = (c) => (c.sensitivity === "calm" ? { duration: 3, distance: 2, capped: true } : { duration: 2, distance: 2, capped: true });
  // matched: calm load 2 / normal load 2 / shy load 3 (pre-shrunk to 1 by ops)
  const pushOn = () => ({ kind: "continue" });
  // expert ops: shy days start shrunk (先回りの縮小); otherwise shrink on the
  // first sign and stop on the second (welfare first)
  const reactive = (s) => (s.c.sensitivity === "shy" && s.shrinks.length === 0 ? { kind: "shrink", lever: "widen" } : s.signs >= 2 && s.slot >= 2 && s.shrinks.length > 0 ? { kind: "stop" } : s.signs >= 1 && s.shrinks.length < 3 ? { kind: "shrink", lever: ["widen", "cap", "shorten"].find((l) => !s.shrinks.includes(l)) } : { kind: "continue" });
  check("debut: lazy minimal plan is rejected by expectations", run(minPlan, pushOn, N, 42).expect_fail === N);
  // the "always-safe" log-blind plan cannot even clear expectations on a calm
  // cub's day: reading the practice record is required to pass the gate
  const safeCheese = run(() => ({ duration: 2, distance: 2, capped: true }), pushOn, N, 50);
  check("debut: log-blind safe plan fails expectations on calm days", (safeCheese.expect_fail || 0) / N > 0.2, JSON.stringify(safeCheese));
  const greedy = run(maxPlan, pushOn, N, 43);
  check("debut: max plan pushed blindly mostly ends hidden", (greedy.hidden_fail || 0) / N > 0.5, JSON.stringify(greedy));
  const informed = run(matchedPlan, reactive, N, 44);
  const informedOk = ((informed.done_full || 0) + (informed.done_early || 0)) / N;
  check("debut: sensitivity-matched plan + reactive ops reliably succeeds", informedOk > 0.9, JSON.stringify(informed));
  // the professional ladder: shrink on the first sign, stop on the pattern
  {
    const r = rng(45);
    const ladder = (s) => (s.signs >= 2 && s.slot >= 2 && s.shrinks.length > 0 ? { kind: "stop" } : s.signs >= 1 && s.shrinks.length < 3 ? { kind: "shrink", lever: ["widen", "cap", "shorten"].find((l) => !s.shrinks.includes(l)) } : { kind: "continue" });
    let earlyPerfect = 0, earlyTotal = 0, earlyUngraded = 0;
    for (let i = 0; i < 300; i++) {
      const res = playDebut(r, matchedPlan, ladder);
      if (res.result === "done_early") { earlyTotal++; if (res.grade === "perfect") earlyPerfect++; if (!res.grade) earlyUngraded++; }
    }
    // a pattern stop is ALWAYS a successful ending (never punished); it grades
    // perfect when the plan fit the cub, good when the plan overreached
    check("debut: a pattern-justified stop always ends the day well", earlyTotal > 0 && earlyUngraded === 0, `${earlyTotal} early stops`);
    check("debut: an early stop from a FITTING plan grades perfect", earlyPerfect > 0, `${earlyPerfect}/${earlyTotal}`);
  }
  // variation
  const r6 = rng(46); const sigs = new Set();
  for (let i = 0; i < 30; i++) { const c = newDebutCase(r6); sigs.add(c.sensitivity + "|" + c.events.join(",")); }
  check("debut: sensitivity and day events vary", sigs.size >= 15, `${sigs.size}`);
  // instant-stop cheese is refused by the rules and advances nothing
  {
    const r7 = rng(47);
    const c = newDebutCase(r7);
    const st = startDebut(c, { duration: 2, distance: 2, capped: false });
    const r = debutStep(st, { kind: "stop" }, r7);
    check("debut: stop with zero signs is refused (no progress, no end)", r.outcome === "open" && !!r.refusal && r.slot === 0);
    const one = { ...st, signs: 1 };
    const r1 = debutStep(one, { kind: "stop" }, r7);
    check("debut: stop on a single sign is refused (shrink is the answer)", r1.outcome === "open" && !!r1.refusal);
  }
  // C matters: identical reactive ops with a log-ignoring fixed plan must be
  // clearly worse (success AND grade) than a sensitivity-matched plan
  {
    const ops = (s) => (s.signs >= 2 && s.slot >= 2 && s.shrinks.length > 0 ? { kind: "stop" } : s.signs >= 1 && s.shrinks.length < 3 ? { kind: "shrink", lever: ["widen", "cap", "shorten"].find((l) => !s.shrinks.includes(l)) } : { kind: "continue" });
    const fixedPlan = () => ({ duration: 1, distance: 2, capped: false }); // value 5, log unread
    const tally = (planFor, seed) => {
      const r = rng(seed); let win = 0, perfect = 0;
      for (let i = 0; i < N; i++) {
        const res = playDebut(r, planFor, ops);
        if (res.result === "done_full" || res.result === "done_early") { win++; if (res.grade === "perfect") perfect++; }
      }
      return { win: win / N, perfect: perfect / N };
    };
    const ignore = tally(fixedPlan, 48);
    const matched = tally(matchedPlan, 49);
    check("debut: matched plan is never worse on success", matched.win >= ignore.win - 0.02, `matched ${matched.win.toFixed(2)} vs ignore ${ignore.win.toFixed(2)}`);
    check("debut: matched plan clearly beats log-ignoring plan on QUALITY (perfect rate)", matched.perfect >= ignore.perfect + 0.10, `matched ${matched.perfect.toFixed(2)} vs ignore ${ignore.perfect.toFixed(2)}`);
  }
  // levers are NOT interchangeable: each counters a different pressure
  {
    const plan = { duration: 2, distance: 3, capped: false };
    check("debut: capping visitors counters a crowd surge best", shrinkRelief(plan, "cap", "crowd") > shrinkRelief(plan, "cap", "none"));
    check("debut: widening distance counters a close-viewing plan", shrinkRelief(plan, "widen", "none") > shrinkRelief({ ...plan, distance: 2 }, "widen", "none"));
    check("debut: cutting time counters a long-day plan", shrinkRelief({ ...plan, duration: 3 }, "shorten", "none") > shrinkRelief(plan, "shorten", "none"));
    // behavioral: on crowd slots, the matched lever (cap) yields fewer signs
    const trial = (lever, seed) => {
      const r = rng(seed); let signs = 0;
      for (let i = 0; i < N; i++) {
        const c = { sensitivity: "shy", practiceLog: [], events: ["crowd", "crowd", "crowd", "crowd"] };
        let s = startDebut(c, { duration: 2, distance: 2, capped: false });
        s = debutStep(s, { kind: "shrink", lever }, r);
        signs += s.signs;
      }
      return signs / N;
    };
    const capSigns = trial("cap", 51), shortenSigns = trial("shorten", 52);
    check("debut: matched lever (cap on crowd) outperforms a mismatched one", capSigns < shortenSigns - 0.05, `cap ${capSigns.toFixed(2)} vs shorten ${shortenSigns.toFixed(2)}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
