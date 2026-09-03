#!/usr/bin/env node
// Automated gameplay QA for the game-studio world's 3 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-studio.mjs
import {
  CONDS, RUN_BUDGET, newReproState, reproRun, reproFile, crashes,
  TUNE_STAGES, newTuneState, tuneAct, FIX_FOR,
  UI_REPORT_POOL, UI_DECOYS, UI_PICK_LIMIT, newUiState, uiToggle, uiServe, uiValidate, uiFault,
} from "../../src/q1/studioLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// =============================== bug_repro ==================================
{
  // filing with no crash ever seen is refused
  {
    let s = newReproState(rng(3));
    const r = reproFile(s, ["after_save", "net_off"]);
    check("repro: filing before seeing any crash is refused", !!r.state.refusal && r.state.mistakes === 0);
  }
  // filing an empty report ("たまに止まる") is refused
  {
    let s = newReproState(rng(5));
    s = reproRun(s, CONDS); // full run always crashes
    const r = reproFile(s, []);
    check("repro: an empty-steps report is refused", !!r.state.refusal);
  }
  // informed play: full run, then drop one condition at a time; conditions
  // whose removal stops the crash are IN the pair. Confirm the pair alone.
  let wins = 0, runsUsed = 0;
  for (let i = 0; i < N; i++) {
    const rand = rng(1000 + i);
    let s = newReproState(rand);
    s = reproRun(s, CONDS); // crash confirmed
    const pair = [];
    for (const c of CONDS) {
      if (pair.length === 2) break;
      const without = CONDS.filter((x) => x !== c);
      s = reproRun(s, without);
      if (!s.runs[s.runs.length - 1].crashed) pair.push(c);
    }
    // at most 1+4 runs so far; confirm minimal pair alone (6th run)
    s = reproRun(s, pair);
    const r = reproFile(s, pair);
    if (r.state.outcome === "done") { wins++; runsUsed += s.runs.length; }
  }
  check(`repro: one-condition-at-a-time play wins ${wins}/${N}`, wins === N, `avg runs ${(runsUsed / N).toFixed(1)} <= ${RUN_BUDGET}`);
  // novice trap: reporting all 4 conditions (not minimal) bounces
  {
    let s = newReproState(rng(21));
    s = reproRun(s, CONDS);
    const r = reproFile(s, CONDS);
    check("repro: a 4-condition report is not the shortest and bounces", r.state.outcome === "open" && r.state.mistakes === 1 && !r.minimal);
  }
  // guessing a pair that was never run alone bounces even if correct
  {
    let hits = 0, bounced = 0;
    for (let i = 0; i < 200; i++) {
      let s = newReproState(rng(3000 + i));
      s = reproRun(s, CONDS);
      const r = reproFile(s, [...s.c.pair]);
      hits++;
      if (r.state.outcome !== "done" && !r.reproduced) bounced++;
    }
    check("repro: the exact pair still bounces if never confirmed on its own", bounced === hits, `${bounced}/${hits}`);
  }
  // budget enforced
  {
    let s = newReproState(rng(23));
    for (let k = 0; k < RUN_BUDGET; k++) s = reproRun(s, ["after_save"]);
    const over = reproRun(s, ["net_off"]);
    check("repro: the test bench budget is enforced", !!over.refusal && over.runs.length === RUN_BUDGET);
  }
}

// ============================= difficulty_tune ==============================
{
  // informed play: read the log evidence, apply the matching fix
  let wins = 0;
  for (let i = 0; i < N; i++) {
    let s = newTuneState(rng(4000 + i));
    while (s.outcome === "open") s = tuneAct(s, FIX_FOR[s.stages[s.idx].cause]).state;
    if (s.outcome === "done") wins++;
  }
  check(`tune: evidence-matched fixes win ${wins}/${N}`, wins === N);
  // novice trap: always nerf HP fails in most cases (enemy_hp appears <=1)
  let trapFails = 0;
  for (let i = 0; i < N; i++) {
    let s = newTuneState(rng(5000 + i));
    let guard = 0;
    while (s.outcome === "open" && guard++ < 10) s = tuneAct(s, "lower_hp").state;
    if (s.outcome !== "done") trapFails++;
  }
  check(`tune: HP-nerf-everything fails (${trapFails}/${N})`, trapFails > N * 0.8);
  // wrong fix does not advance the stage
  {
    let s = newTuneState(rng(31));
    const wrong = FIX_FOR[s.stages[0].cause] === "lower_hp" ? "add_signpost" : "lower_hp";
    const r = tuneAct(s, wrong);
    check("tune: a mismatched fix leaves the stage on the board", r.state.idx === 0 && r.state.mistakes === 1);
  }
  // evidence is honest: exactly one evidence flag per non-HP cause
  {
    let honest = true;
    for (let i = 0; i < 200; i++) {
      const s = newTuneState(rng(6000 + i));
      for (const st of s.stages) {
        const flags = [st.deathsBeforeAttack, st.wanderTime, st.quitAtMenu].filter(Boolean).length;
        if (st.cause === "enemy_hp" ? flags !== 0 : flags !== 1) honest = false;
      }
    }
    check("tune: log evidence flags always match the true cause", honest);
  }
}

// ================================ ui_clarity ================================
{
  // reports vary across cases
  {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
      const s = newUiState(rng(7000 + i));
      seen.add(s.c.reports.map((r) => r.id).sort().join("+"));
    }
    check(`ui: report sets vary across cases (${seen.size} distinct)`, seen.size >= 5);
  }
  // informed play: pick exactly the 3 matching fixes
  let wins = 0;
  for (let i = 0; i < N; i++) {
    let s = newUiState(rng(8000 + i));
    for (const r of s.c.reports) s = uiToggle(s, r.fix);
    const r2 = uiServe(s);
    if (r2.state.outcome === "done") wins++;
  }
  check(`ui: report-matched picks win ${wins}/${N}`, wins === N);
  // pick limit enforced
  {
    let s = newUiState(rng(41));
    for (const r of s.c.reports) s = uiToggle(s, r.fix);
    const over = uiToggle(s, UI_DECOYS[0]);
    check("ui: the 3-pick limit is enforced with a refusal", !!over.refusal && over.picked.length === 3);
  }
  // decoys always bounce
  {
    let s = newUiState(rng(43));
    s = uiToggle(s, "flashy_anim");
    s = uiToggle(s, s.c.reports[0].fix);
    s = uiToggle(s, s.c.reports[1].fix);
    const r = uiServe(s);
    check("ui: a decoy pick is always rejected", r.problem === "decoy_included" && r.state.outcome === "open");
    const fault = uiFault(s);
    check("ui: the WHERE hint names the decoy", fault?.kind === "decoy" && fault.fix === "flashy_anim");
  }
  // missing report fix → WHERE hint names that report
  {
    let s = newUiState(rng(47));
    s = uiToggle(s, s.c.reports[0].fix);
    const fault = uiFault(s);
    check("ui: the WHERE hint names the first unanswered report", fault?.kind === "report" && fault.report === s.c.reports[1].id);
    check("ui: validate flags the unfixed report", uiValidate(s) === "unfixed_report");
  }
  // fix pool sanity: every report's fix is unique and not a decoy
  {
    const fixes = UI_REPORT_POOL.map((r) => r.fix);
    check("ui: report fixes are unique and disjoint from decoys", new Set(fixes).size === fixes.length && fixes.every((f) => !UI_DECOYS.includes(f)));
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
