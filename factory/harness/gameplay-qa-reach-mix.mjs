#!/usr/bin/env node
// Automated gameplay QA for Q1 reach_mix (legacy-reach-mix / 広報・PR). Re-runs the same
// checks as the design-stage factory/projects/legacy-reach-mix/design/design-sim.mjs, but
// against the SHIPPED module src/q1/reachMixLogic.ts, to confirm the implementation did not
// drift from the verified design (Human Decision 2026-09-12: bestPlanSet accepts multiple
// equally-valid plans, no fixed tie-break).
//
// Usage: node factory/harness/gameplay-qa-reach-mix.mjs

import {
  AUDIENCES, PLAN_IDS, PLANS, newSession, planIsWeakenedThisSession, planFit, bestPlanSet,
  isTrapSession, sessionWin,
} from "../../src/q1/reachMixLogic.ts";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Independent re-derivation from ONLY player-visible facts (never calls bestPlanSet/planFit),
// mirroring design-sim.mjs's independentPlayerStrategy — proves a real child, using only the
// disclosed audience + scenario facts, can reproduce the shipped win condition.
function isWeakenedFromDisclosedFacts(planId, scenario) {
  if (planId === "flyer_plan") return scenario.coopInstitutions === 1;
  if (planId === "sns_plan") return scenario.followerTier === 0;
  if (planId === "media_plan") return scenario.prepWeeks === 1;
  return false;
}
function independentPlayerStrategy(session) {
  const tierOf = (planId) => {
    const matchesTarget = PLANS[planId].target === session.primary;
    const weakened = isWeakenedFromDisclosedFacts(planId, session.scenario);
    return matchesTarget && !weakened ? 3 : !matchesTarget && !weakened ? 2 : matchesTarget && weakened ? 1 : 0;
  };
  const bestTier = Math.max(...PLAN_IDS.map(tierOf));
  return PLAN_IDS.filter((id) => tierOf(id) === bestTier);
}
const sameSet = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

const N = 20000;
function rate(fn) {
  let w = 0;
  for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; }
  return Number((w / N).toFixed(4));
}

const results = {};
results.legitimate_reasoning = rate((s) => sessionWin(s, independentPlayerStrategy(s)[0]));
results.independent_strategy_matches_internal_oracle = rate((s) => sameSet(independentPlayerStrategy(s), bestPlanSet(s)));
results.multi_answer_session_rate = (() => {
  let n = 0;
  for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (bestPlanSet(s).length > 1) n++; }
  return Number((n / N).toFixed(4));
})();
results.name_match_only = rate((s) => {
  const obvious = PLAN_IDS.find((id) => PLANS[id].target === s.primary);
  return sessionWin(s, obvious);
});
results.trap_session_rate = (() => {
  let n = 0;
  for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (isTrapSession(s)) n++; }
  return Number((n / N).toFixed(4));
})();
results.name_match_only_on_trap_sessions = (() => {
  let w = 0, n = 0;
  for (let i = 0; i < N; i++) {
    const rand = mulberry32(i * 7919 + 13); const s = newSession(rand);
    if (!isTrapSession(s)) continue;
    n++;
    const obvious = PLAN_IDS.find((id) => PLANS[id].target === s.primary);
    if (sessionWin(s, obvious)) w++;
  }
  return n > 0 ? Number((w / n).toFixed(4)) : null;
})();
results.random_pick = rate((s, rand) => {
  const pick = PLAN_IDS[Math.floor(rand() * PLAN_IDS.length)];
  return sessionWin(s, pick);
});
for (const planId of PLAN_IDS) results[`always_pick_${planId}`] = rate((s) => sessionWin(s, planId));
results.always_first_displayed = rate((s) => sessionWin(s, s.order[0]));

function tripleRate(pickFn) {
  let w = 0;
  for (let i = 0; i < N; i++) {
    const rand = mulberry32(i * 7919 + 13);
    const sessions = [newSession(rand), newSession(rand), newSession(rand)];
    if (sessions.every((s) => sessionWin(s, pickFn(s, rand)))) w++;
  }
  return Number((w / N).toFixed(4));
}
results.triple_legitimate_reasoning = tripleRate((s) => independentPlayerStrategy(s)[0]);
results.triple_name_match_only = tripleRate((s) => PLAN_IDS.find((id) => PLANS[id].target === s.primary));
results.triple_random_pick = tripleRate((s, rand) => PLAN_IDS[Math.floor(rand() * PLAN_IDS.length)]);

check("legitimate reasoning (independent, player-visible-facts strategy) always wins", results.legitimate_reasoning === 1, `${results.legitimate_reasoning}`);
check("independent strategy's accepted-answer set matches bestPlanSet on every session", results.independent_strategy_matches_internal_oracle === 1, `${results.independent_strategy_matches_internal_oracle}`);
check("multi-answer sessions occur at a meaningful rate", results.multi_answer_session_rate > 0.05, `${results.multi_answer_session_rate}`);
check("trap sessions occur often enough to matter", results.trap_session_rate > 0.15 && results.trap_session_rate < 0.5, `${results.trap_session_rate}`);
check("name-matching only mostly fails on trap sessions", results.name_match_only_on_trap_sessions < 0.15, `${results.name_match_only_on_trap_sessions}`);
check("name-matching only, overall, is well below full reasoning", results.name_match_only < 0.9, `${results.name_match_only}`);
check("random pick stays close to baseline", results.random_pick < 0.4, `${results.random_pick}`);
for (const planId of PLAN_IDS) check(`always picking "${planId}" fails most of the time`, results[`always_pick_${planId}`] < 0.5, `${results[`always_pick_${planId}`]}`);
check("always picking the first-displayed plan fails most of the time", results.always_first_displayed < 0.5, `${results.always_first_displayed}`);
check("3-round compounding: legitimate reasoning always wins all 3", results.triple_legitimate_reasoning === 1, `${results.triple_legitimate_reasoning}`);
check("3-round compounding: name-matching-only collapses below single-round rate", results.triple_name_match_only < results.name_match_only, `${results.triple_name_match_only} vs ${results.name_match_only}`);
check("3-round compounding: random picking collapses further", results.triple_random_pick < 0.1, `${results.triple_random_pick}`);

// sanity: every audience is reachable, every plan is sometimes correct (no permanently-dead option)
const primaryFreq = { family: 0, young: 0, older: 0 };
const bestPlanFreq = { flyer_plan: 0, sns_plan: 0, media_plan: 0 };
for (let i = 0; i < N; i++) {
  const rand = mulberry32(i * 7919 + 13); const s = newSession(rand);
  primaryFreq[s.primary]++;
  for (const id of bestPlanSet(s)) bestPlanFreq[id]++;
}
for (const a of AUDIENCES) check(`primary=${a} is genuinely reachable`, primaryFreq[a] / N > 0.25 && primaryFreq[a] / N < 0.42, `${(primaryFreq[a] / N).toFixed(4)}`);
for (const p of PLAN_IDS) check(`${p} is genuinely sometimes correct`, bestPlanFreq[p] / N > 0.15, `${(bestPlanFreq[p] / N).toFixed(4)}`);

console.log("\nfull results:", JSON.stringify(results, null, 2));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
