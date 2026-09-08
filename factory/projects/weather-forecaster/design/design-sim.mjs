#!/usr/bin/env node
// Design-stage exploit simulation for weather-forecaster / t1-storm-night.
// Reads state_table.json and evaluates strategies mechanically. This is the
// evidence the design review r1 asked for (GAME_SPEC_MISSING_STATE /
// BRUTE_FORCE_SUCCESS / C_NOT_NEEDED_FOR_D): a content-blind strategy must
// not win on every path, and a 満点 solution must exist on every path.
// At implementation time the same rules move into src/q1/<x>Logic.ts and
// factory/harness/gameplay-qa-<x>.mjs.
//
// Usage: node factory/projects/weather-forecaster/design/design-sim.mjs
// Output: design-sim-result.json next to this file (+ summary on stdout).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(readFileSync(join(HERE, "state_table.json"), "utf8"));
const TOWNS = T.towns.map((t) => t.id);
const STEPS = T.steps.length;
const LEAD = T.warning_rule.lead_time_steps;

// plan: function(step, view) -> {warn:Set<town>, cancel:Set<town>} decided
// BEFORE advancing from `step`. `view` exposes only what the screen shows:
// current meters, thresholds, current rain per town, which towns have a
// standing warning / 避難情報, and past rain (what the child has seen).
function simulate(pathId, plan) {
  const rain = T.paths[pathId].rain;
  const meter = Object.fromEntries(T.towns.map((t) => [t.id, t.start]));
  const thr = Object.fromEntries(T.towns.map((t) => [t.id, t.threshold]));
  const warnedAt = {}; // town -> step warning issued (standing)
  const infoIssued = {}; // town -> step 避難情報 issued (end of that step)
  const evacuatedFrom = {}; // town -> step from which residents are safe
  const returnedAt = {}; // town -> step residents are home again after a cancel
  const crossedAt = {};
  const outcome = {};
  const history = [];
  for (let step = 1; step <= STEPS; step++) {
    const curRain = Object.fromEntries(TOWNS.map((id) => [id, rain[id][step - 1]]));
    const view = { step, meter: { ...meter }, threshold: thr, rain: curRain, pastRain: Object.fromEntries(TOWNS.map((id) => [id, rain[id].slice(0, step)])), standing: { ...warnedAt }, infoIssued: { ...infoIssued } };
    const d = plan(step, view) ?? {};
    const illegalCancels = [];
    for (const id of d.cancel ?? []) {
      // round-2 review HIGH (FACTUAL_PROFESSION_ERROR): 解除 is only valid
      // while it is not currently raining on that town (the checkable proxy
      // for "基準を下回り、再び上回らないと判断したとき", fact_check_r1.json
      // #2). A cancel attempted while it is raining is REJECTED -- the
      // button would be disabled in the real UI; here it is simply ignored
      // and recorded so a strategy cannot silently rely on illegal cancels.
      if (curRain[id] > 0) { illegalCancels.push(id); continue; }
      if (warnedAt[id] !== undefined) {
        if (infoIssued[id] !== undefined) {
          // 避難情報 already out: residents return home next step; counts as 空振り if it never crosses
          returnedAt[id] = step + 1;
          delete evacuatedFrom[id];
        }
        delete warnedAt[id];
      }
    }
    for (const id of d.warn ?? []) {
      if (warnedAt[id] === undefined) warnedAt[id] = step;
    }
    // advance: rain falls, meters move, 避難情報 issued at end of the step a warning was made
    for (const id of TOWNS) {
      meter[id] = curRain[id] > 0 ? Math.min(12, meter[id] + curRain[id]) : Math.max(0, meter[id] - 1);
    }
    for (const id of TOWNS) {
      if (warnedAt[id] === step && infoIssued[id] === undefined) {
        infoIssued[id] = step;
        evacuatedFrom[id] = step + LEAD; // safe from the start of step t+2
        delete returnedAt[id];
      } else if (warnedAt[id] !== undefined && infoIssued[id] !== undefined && evacuatedFrom[id] === undefined) {
        // re-warned after a cancel: residents go back out, another lead time
        evacuatedFrom[id] = step + LEAD;
      }
    }
    // crossing check at the end of the step (danger materializes at the start of the next step)
    for (const id of TOWNS) {
      if (crossedAt[id] === undefined && meter[id] >= thr[id]) {
        crossedAt[id] = step + 1; // the cliff gives way at the start of the next step
        const safe = evacuatedFrom[id] !== undefined && evacuatedFrom[id] <= step + 1 && (returnedAt[id] === undefined || returnedAt[id] > step + 1);
        outcome[id] = safe ? "safe" : "late";
      }
    }
    history.push({ step, meter: { ...meter }, standing: { ...warnedAt }, crossed: { ...crossedAt }, illegalCancelsAttempted: illegalCancels });
  }
  let falseAlarms = 0;
  for (const id of TOWNS) {
    if (outcome[id]) continue;
    if (infoIssued[id] !== undefined) { outcome[id] = "false_alarm"; falseAlarms++; } else outcome[id] = "quiet";
  }
  const late = Object.values(outcome).filter((o) => o === "late").length;
  const crossed = Object.keys(crossedAt).length;
  const grade = late > 0 ? "partial" : falseAlarms === 0 ? "perfect" : falseAlarms <= 1 ? "success" : "partial";
  return { pathId, grade, late, falseAlarms, crossed, outcome, crossedAt, history };
}

// ---- named strategies (content-blind or content-light) ----
const S = {
  never: () => ({}),
  all_step1: (step) => (step === 1 ? { warn: TOWNS } : {}),
  all_step1_then_cancel_dry: (step, v) => (step === 1 ? { warn: TOWNS } : { cancel: TOWNS.filter((id) => v.rain[id] === 0 && v.standing[id] !== undefined) }),
  warn_where_raining_now: (step, v) => ({ warn: TOWNS.filter((id) => v.rain[id] > 0), cancel: TOWNS.filter((id) => v.rain[id] === 0 && v.standing[id] !== undefined) }),
  all_step3: (step) => (step === 3 ? { warn: TOWNS } : {}),
  // legitimate D: read meter + threshold + current rain + lead time (2 steps)
  meter_lead_rule: (step, v) => ({ warn: TOWNS.filter((id) => v.standing[id] === undefined && v.rain[id] > 0 && v.threshold[id] - v.meter[id] <= LEAD * v.rain[id] + 1) }),
  // legitimate D + rethink: same, but cancel a standing warning if the rain has left and the meter is falling well below the line
  meter_lead_rule_with_cancel: (step, v) => ({
    warn: TOWNS.filter((id) => v.standing[id] === undefined && v.rain[id] > 0 && v.threshold[id] - v.meter[id] <= LEAD * v.rain[id] + 1),
    cancel: TOWNS.filter((id) => v.standing[id] !== undefined && v.infoIssued[id] === undefined && v.rain[id] === 0),
  }),
  // adversarial: tries to cancel EVERY standing warning every step, including
  // while it is actively raining -- must never be allowed to succeed via an
  // illegal cancel (the gate must reject it, not the strategy politely avoid it).
  warn_all_step1_illegal_cancel_while_raining: (step, v) => (step === 1 ? { warn: TOWNS } : { cancel: TOWNS.filter((id) => v.standing[id] !== undefined) }),
};

const PATHS = Object.keys(T.paths);
const named = {};
for (const [name, plan] of Object.entries(S)) {
  named[name] = Object.fromEntries(PATHS.map((p) => { const r = simulate(p, plan); return [p, { grade: r.grade, late: r.late, falseAlarms: r.falseAlarms, outcome: r.outcome, illegalCancelsAttempted: r.history.flatMap((h) => h.illegalCancelsAttempted).length }]; }));
  named[name].wins_all_paths = PATHS.every((p) => ["perfect", "success"].includes(named[name][p].grade));
}
// the cancel-gate must actually reject illegal attempts (not just have strategies avoid them)
const illegalCancelStrategyResults = PATHS.map((p) => named.warn_all_step1_illegal_cancel_while_raining[p]);
const cancelGateEnforced = {
  attempts_made: illegalCancelStrategyResults.some((r) => r.illegalCancelsAttempted > 0),
  strategy_still_fails_or_no_worse: !named.warn_all_step1_illegal_cancel_while_raining.wins_all_paths,
  detail: illegalCancelStrategyResults,
};

// ---- exhaustive path-INDEPENDENT fixed schedules: per town, warn at step k in {0=never,1..6}, no cancel ----
const fixed = { total: 0, wins_all_paths: 0, wins_all_paths_examples: [], wins_per_path: Object.fromEntries(PATHS.map((p) => [p, 0])) };
const opts = [0, 1, 2, 3, 4, 5, 6];
for (const a of opts) for (const b of opts) for (const c of opts) for (const d of opts) {
  const sched = { [TOWNS[0]]: a, [TOWNS[1]]: b, [TOWNS[2]]: c, [TOWNS[3]]: d };
  const plan = (step) => ({ warn: TOWNS.filter((id) => sched[id] === step) });
  fixed.total++;
  const grades = PATHS.map((p) => simulate(p, plan).grade);
  grades.forEach((g, i) => { if (["perfect", "success"].includes(g)) fixed.wins_per_path[PATHS[i]]++; });
  if (grades.every((g) => ["perfect", "success"].includes(g))) { fixed.wins_all_paths++; if (fixed.wins_all_paths_examples.length < 5) fixed.wins_all_paths_examples.push({ sched, grades }); }
}

// ---- solvability: a perfect schedule must exist for every path (found by brute force per path) ----
const solvable = {};
for (const p of PATHS) {
  let best = null;
  for (const a of opts) for (const b of opts) for (const c of opts) for (const d of opts) {
    const sched = { [TOWNS[0]]: a, [TOWNS[1]]: b, [TOWNS[2]]: c, [TOWNS[3]]: d };
    const r = simulate(p, (step) => ({ warn: TOWNS.filter((id) => sched[id] === step) }));
    if (r.grade === "perfect") { best = { sched, crossedAt: r.crossedAt, outcome: r.outcome }; break; }
  }
  solvable[p] = best;
}

// ---- per-path facts a reviewer needs ----
const facts = Object.fromEntries(PATHS.map((p) => { const r = simulate(p, S.never); return [p, { label: T.paths[p].label, crossedAt: r.crossedAt, towns_that_cross: Object.keys(r.crossedAt) }]; }));

const result = {
  generated_at: new Date().toISOString(),
  rules: { lead_time_steps: LEAD, steps: STEPS, towns: T.towns },
  path_facts: facts,
  named_strategies: named,
  fixed_schedules: fixed,
  perfect_solution_exists_per_path: Object.fromEntries(PATHS.map((p) => [p, !!solvable[p]])),
  perfect_solutions: solvable,
  cancel_gate: cancelGateEnforced,
  verdict: {
    no_content_blind_strategy_wins_all_paths: fixed.wins_all_paths === 0 && !named.never.wins_all_paths && !named.all_step1.wins_all_paths && !named.all_step1_then_cancel_dry.wins_all_paths && !named.warn_where_raining_now.wins_all_paths && !named.all_step3.wins_all_paths,
    legitimate_meter_lead_rule_wins_all_paths: named.meter_lead_rule_with_cancel.wins_all_paths,
    every_path_solvable: PATHS.every((p) => !!solvable[p]),
    cancel_gate_enforced: cancelGateEnforced.attempts_made && cancelGateEnforced.strategy_still_fails_or_no_worse,
  },
};
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ path_facts: facts, named: Object.fromEntries(Object.entries(named).map(([k, v]) => [k, { wins_all_paths: v.wins_all_paths, grades: PATHS.map((p) => v[p].grade) }])), fixed: { total: fixed.total, wins_all_paths: fixed.wins_all_paths, wins_per_path: fixed.wins_per_path, examples: fixed.wins_all_paths_examples }, cancel_gate: cancelGateEnforced, verdict: result.verdict }, null, 2));
