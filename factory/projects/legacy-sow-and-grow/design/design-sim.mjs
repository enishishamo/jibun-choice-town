#!/usr/bin/env node
// Design-stage exploit simulation for legacy-sow-and-grow / t1-season-deadline-match (v3).
//
// Audit finding (factory/state/legacy/reverse-audits/sow_and_grow.json): exploit=memorize,
// player_judgment_required=false -- the OLD implementation's result was fully determined by a
// fixed variety choice (fixed month/deadline/forecast every session).
//
// v3 fixes over v2 (superseded, not committed -- see design-review-r1.result.json, FAIL 38,
// 3 BLOCKERs):
// 1. ANSWER_LEAK (BLOCKER): v2 kept the old game's variety names あかね夏/ふゆみね/はるひな, which
//    literally spell out summer/winter/spring -- combined with non-overlapping season windows,
//    the NAME ALONE gave the answer away without reading any numeric data. v3 renames all three to
//    season-neutral fictional names (つぶたね/まんまる/ことね, matching this Factory's established
//    "fictional variety name, real-pattern behavior" convention already used in the old game).
// 2. C_NOT_NEEDED_FOR_D / CORE_DISTORTED_BY_GAME (BLOCKER): v2's three varieties covered three
//    DIFFERENT, non-overlapping seasons, so "today's month" alone always determined the single
//    eligible variety -- deadline and forecast never actually changed which variety to pick, just
//    confirmed or denied the one the month already selected. v3 redesigns all three varieties as
//    summer-sowing candidates (matching the real fukui prefecture trial's actual comparison of
//    愛紅/夏播用彩誉/向陽二号 -- see reference_research_v3.json) with OVERLAPPING sub-windows
//    within June-September, and diversified harvest-days (fast/medium/slow) and heat-tolerance, so
//    that in most sessions 2 of 3 varieties are seasonally eligible and the deadline/heat criteria
//    genuinely decide between them.
// 3. FAILURE_DISGUISED_AS_SUCCESS / zero_winner_session_rate=39.32% (HIGH): v3 uses REJECTION
//    SAMPLING -- deadlineOffsetMonths and forecastHot are redrawn (month is kept fixed, since it
//    represents "today", a real fact that should not be silently re-rolled away) until at least
//    one variety satisfies all three criteria, guaranteeing zero_winner_session_rate = 0.
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

// All three are summer-sowing (June-September) candidates, matching the real fukui trial anchor
// (7/22, 8/4, 8/17 sowing dates all reaching harvest in ~111-112 days) and the real qualitative
// differences it found among 愛紅 (early-vigor)/夏播用彩誉 (late-sowing specialist)/向陽二号
// (standard, wide window) -- see reference_research_v3.json. Names are fictional and season-
// neutral by design (ANSWER_LEAK fix).
const VARIETIES = [
  { id: "tsubutane", name: "つぶたね", window: [6, 7], harvest_days: 90, heat_ok: true },   // 愛紅-pattern: early-summer, fast, heat-hardy
  { id: "manmaru", name: "まんまる", window: [6, 7, 8], harvest_days: 125, heat_ok: true },  // 向陽二号-pattern: standard, wide window, heat-hardy, but slower to harvest
  { id: "kotone", name: "ことね", window: [8, 9], harvest_days: 135, heat_ok: false },       // 夏播用彩誉-pattern: late-summer specialist, slower, less heat-hardy
];
const IDS = VARIETIES.map((v) => v.id);

function inWindow(month, window) { return window.includes(month); }
function monthsNeeded(days) { return Math.ceil(days / 30); }

function evaluate(variety, sowMonth, deadlineOffsetMonths, forecastHot) {
  const seasonOk = inWindow(sowMonth, variety.window);
  const timeOk = monthsNeeded(variety.harvest_days) <= deadlineOffsetMonths;
  const heatOk = !forecastHot || variety.heat_ok;
  return { seasonOk, timeOk, heatOk, win: seasonOk && timeOk && heatOk };
}
function anyWinner(sowMonth, deadlineOffsetMonths, forecastHot) {
  return VARIETIES.some((v) => evaluate(v, sowMonth, deadlineOffsetMonths, forecastHot).win);
}
function eligibleBySeasonCount(sowMonth) { return VARIETIES.filter((v) => inWindow(sowMonth, v.window)).length; }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = [6, 7, 8, 9];
const OFFSETS = [3, 4, 5];
const MAX_RESAMPLES = 200;

// newSession: month is drawn once and kept (it represents "today", a real fact); deadline/forecast
// are resampled (rejection sampling) until at least one variety can win this month -- this is the
// r1 reviewer's explicit recommended fix for the zero-winner-session problem.
function newSession(rand) {
  const sowMonth = MONTHS[Math.floor(rand() * MONTHS.length)];
  for (let i = 0; i < MAX_RESAMPLES; i++) {
    const deadlineOffsetMonths = OFFSETS[Math.floor(rand() * OFFSETS.length)];
    const forecastHot = rand() < 0.5;
    if (anyWinner(sowMonth, deadlineOffsetMonths, forecastHot)) return { sowMonth, deadlineOffsetMonths, forecastHot, resampled: i > 0 };
  }
  throw new Error(`no winnable (deadline, forecast) found for month ${sowMonth} within ${MAX_RESAMPLES} resamples`);
}

const N = 20000;
let zeroWinnerCheckFailures = 0;
let sessionsWithTwoPlusEligibleBySeason = 0;
const sessions = [];
for (let i = 0; i < N; i++) {
  const rand = mulberry32(i * 7919 + 13);
  const s = newSession(rand);
  sessions.push(s);
  if (!anyWinner(s.sowMonth, s.deadlineOffsetMonths, s.forecastHot)) zeroWinnerCheckFailures++; // should never happen
  if (eligibleBySeasonCount(s.sowMonth) >= 2) sessionsWithTwoPlusEligibleBySeason++;
}

function rate(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; } return Number((w / N).toFixed(4)); }
const results = {};
for (const fixedId of IDS) {
  results[`always_plant_${fixedId}`] = rate((s) => evaluate(VARIETIES.find((v) => v.id === fixedId), s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win);
}
// legitimate: read all 3 cards' window/harvest_days/heat_ok, compare against sowMonth/deadline/
// forecast, and pick a variety that wins IF one exists among the seasonally-eligible ones (ties
// broken by picking the first eligible winner -- a real player would just need to find ONE)
results.legitimate_full_reasoning = rate((s) => VARIETIES.some((v) => evaluate(v, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win));
// season-only heuristic: pick any seasonally-eligible variety at random, ignoring deadline/heat
// entirely -- tests whether season alone (without deadline/heat reasoning) still wins too often
results.season_only_heuristic = rate((s, rand) => {
  const eligible = VARIETIES.filter((v) => inWindow(s.sowMonth, v.window));
  const pick = eligible[Math.floor(rand() * eligible.length)];
  return evaluate(pick, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
});
// content-blind: pick uniformly at random among all 3, ignoring everything
results.random_pick_content_blind = rate((s, rand) => {
  const pick = VARIETIES[Math.floor(rand() * VARIETIES.length)];
  return evaluate(pick, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
});

const verdict = {
  zero_winner_session_rate: 0, // guaranteed by rejection sampling in newSession()
  rejection_sampling_never_exhausted: zeroWinnerCheckFailures === 0,
  at_least_two_varieties_seasonally_eligible_rate: Number((sessionsWithTwoPlusEligibleBySeason / N).toFixed(4)),
  memorization_exploit_closed: IDS.every((id) => results[`always_plant_${id}`] < 0.6),
  season_alone_is_not_sufficient: results.season_only_heuristic < results.legitimate_full_reasoning,
  legitimate_reasoning_beats_season_only_by: Number((results.legitimate_full_reasoning - results.season_only_heuristic).toFixed(4)),
  legitimate_reasoning_beats_blind_guessing_by: Number((results.legitimate_full_reasoning - results.random_pick_content_blind).toFixed(4)),
  random_guessing_disclosed_residual: results.random_pick_content_blind,
};

const out = {
  generated_at: new Date().toISOString(),
  varieties: VARIETIES,
  n: N,
  months: MONTHS,
  deadline_offsets: OFFSETS,
  strategies: results,
  verdict,
  notes: "v3 (design review r1 FAIL 38 repair): renamed varieties to season-neutral names (ANSWER_LEAK fix); redesigned all 3 as overlapping summer-sowing candidates so deadline/heat genuinely decide between multiple seasonally-eligible options in most sessions (at_least_two_varieties_seasonally_eligible_rate reported above), not just confirm a single season-determined pick (C_NOT_NEEDED_FOR_D / CORE_DISTORTED_BY_GAME fix); rejection-sampled (deadlineOffsetMonths, forecastHot) per session, keeping sowMonth fixed, to guarantee zero_winner_session_rate=0 (FAILURE_DISGUISED_AS_SUCCESS / unfair-session fix) -- rejection_sampling_never_exhausted confirms every one of the N sessions found a winnable combination within 200 resamples.",
};
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
