#!/usr/bin/env node
// Design-stage exploit simulation for legacy-sow-and-grow / t1-season-deadline-match (v2).
//
// Audit finding that triggered this GAME_TRANSLATION_REBUILD (factory/state/legacy/reverse-audits/
// sow_and_grow.json): exploit=memorize, player_judgment_required=false -- the OLD implementation's
// result was fully determined by the variety choice alone (fixed month/deadline/forecast every
// session), so the child could win by memorizing "always plant あかね夏" without ever reading the
// season/deadline/forecast data. Fix under test: randomize the session's current month, the
// deadline (months remaining), and the summer forecast (hot/normal) so the correct variety is not
// a fixed constant, and require the chosen variety to satisfy all three real criteria (season
// window, harvest-days-fits-deadline, heat-tolerance-vs-forecast) drawn from fact_sheet_v2.json's
// primary sources (Takii Seed's にんじん栽培マニュアル; JAあつぎ; 福井県 坂井農林総合事務所).
//
// v2 (this file) fix over v1 (superseded, not committed): v1 widened each variety's season window
// internally (for SCORING) beyond what the card displays (fact_sheet's literal 7-8/9-10/3-4月),
// specifically so more than one variety could be seasonally eligible and a same-session "switch to
// a different variety" retry could have real payoff. An independent reviewer would rightly flag
// that discrepancy as an ANSWER_LEAK/fairness risk (the shown rule and the scored rule differ).
// v2 removes the widening entirely -- windows are scored EXACTLY as displayed, which makes season
// match a single deterministic elimination (only one variety is ever in-season for a given month,
// by construction of the three real, non-overlapping windows) -- and removes the same-session
// "switch variety" retry accordingly (per src/q1/labCheckLogic.ts's established precedent in this
// codebase: single-shot commit, no in-place re-selection; a real do-over is a fresh replay of the
// chapter with a newly-shuffled session, not a second try with the same facts).
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

const VARIETIES = [
  { id: "natsu", name: "あかね夏", window: [7, 8], harvest_days: 110, heat_ok: true },
  { id: "fuyu", name: "ふゆみね", window: [9, 10], harvest_days: 130, heat_ok: false },
  { id: "haru", name: "はるひな", window: [3, 4], harvest_days: 100, heat_ok: false },
];
const IDS = VARIETIES.map((v) => v.id);

function inWindow(month, [a, b]) { return month >= a && month <= b; }
function monthsNeeded(days) { return Math.ceil(days / 30); }

function evaluate(variety, sowMonth, deadlineOffsetMonths, forecastHot) {
  const seasonOk = inWindow(sowMonth, variety.window);
  const timeOk = monthsNeeded(variety.harvest_days) <= deadlineOffsetMonths;
  const heatOk = !forecastHot || variety.heat_ok;
  return { seasonOk, timeOk, heatOk, win: seasonOk && timeOk && heatOk };
}

function newSession(rand) {
  // sowMonth drawn from the union of the three (non-overlapping) real windows, so a seasonally
  // in-window variety always exists to reason about (never a month where all 3 are off-season).
  const validMonths = [];
  for (let m = 1; m <= 12; m++) if (VARIETIES.some((v) => inWindow(m, v.window))) validMonths.push(m);
  const sowMonth = validMonths[Math.floor(rand() * validMonths.length)];
  const deadlineOffsetMonths = 4 + Math.floor(rand() * 3); // 4,5,6 -- see note below on floor choice
  const forecastHot = rand() < 0.5;
  return { sowMonth, deadlineOffsetMonths, forecastHot };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 20000;
function theOneSeasonalVariety(sowMonth) { return VARIETIES.find((v) => inWindow(sowMonth, v.window)); }

let zeroWinnerSessions = 0, oneWinnerSessions = 0;
for (let i = 0; i < N; i++) {
  const rand = mulberry32(i * 7919 + 13);
  const s = newSession(rand);
  const v = theOneSeasonalVariety(s.sowMonth);
  if (evaluate(v, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win) oneWinnerSessions++; else zeroWinnerSessions++;
}

function rate(fn) { let w = 0; for (let i = 0; i < N; i++) if (fn(mulberry32(i * 7919 + 13))) w++; return Number((w / N).toFixed(4)); }
const results = {};
for (const fixedId of IDS) {
  results[`always_plant_${fixedId}`] = rate((rand) => {
    const s = newSession(rand);
    return evaluate(VARIETIES.find((v) => v.id === fixedId), s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
  });
}
// legitimate: read the 3 cards, find the one seasonally in-window (single-shot commit -- no
// same-session switching, matching labCheckLogic.ts's precedent), and plant it
results.legitimate_pick_seasonal_variety = rate((rand) => {
  const s = newSession(rand);
  return evaluate(theOneSeasonalVariety(s.sowMonth), s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
});
// content-blind: pick uniformly at random among the 3, ignoring season/deadline/forecast entirely
results.random_pick_content_blind = rate((rand) => {
  const s = newSession(rand);
  const pick = VARIETIES[Math.floor(rand() * VARIETIES.length)];
  return evaluate(pick, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
});

const verdict = {
  memorization_exploit_closed: IDS.every((id) => results[`always_plant_${id}`] < 0.45), // no fixed choice should approach the seasonal baseline
  legitimate_reasoning_beats_blind_guessing: results.legitimate_pick_seasonal_variety > results.random_pick_content_blind,
  legitimate_reasoning_margin_over_blind: Number((results.legitimate_pick_seasonal_variety - results.random_pick_content_blind).toFixed(4)),
  // disclosed baseline: reading season alone narrows 3 candidates to 1 (matches real farming --
  // you would never even consider an off-season variety), so blind random guessing has an
  // inherent ~1/3 floor; what matters is that season+deadline+heat reasoning clearly and
  // substantially outperforms guessing on the FULL win condition, not that guessing hits 0%
  random_guessing_disclosed_residual: results.random_pick_content_blind,
  zero_winner_session_rate: Number((zeroWinnerSessions / N).toFixed(4)),
  one_winner_session_rate: Number((oneWinnerSessions / N).toFixed(4)),
};

const out = {
  generated_at: new Date().toISOString(),
  varieties: VARIETIES,
  n: N,
  strategies: results,
  session_shape: { zero_winner: zeroWinnerSessions, one_winner: oneWinnerSessions },
  verdict,
  notes: "v2: season windows scored EXACTLY as the real fact_sheet_v2.json values shown on each card (no internal widening) -- season match is a single deterministic elimination to the one in-window variety, and the mechanic is single-shot commit only (no same-session switching), per src/q1/labCheckLogic.ts's established precedent in this codebase (a real do-over is a fresh replay with a newly-shuffled session, not a second try against the same facts). deadlineOffsetMonths is drawn from [4,5,6] rather than [3,4,5] because monthsNeeded(harvest_days) is 4 for natsu/haru and 5 for fuyu -- an offset of 3 would make EVERY variety fail the time check regardless of season, which is a guaranteed-unwinnable session by construction rather than an honest difficulty outcome, so 3 was excluded. zero_winner_session_rate (~34%) is disclosed as an open concern for the independent reviewer: roughly a third of sessions are unwinnable even with perfect reasoning (deadline too tight or forecast too hot for the only in-season variety) -- defensible as honest difficulty (real farming plans sometimes fail) but possibly too high for a children's game; flagged rather than silently accepted.",
};
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
