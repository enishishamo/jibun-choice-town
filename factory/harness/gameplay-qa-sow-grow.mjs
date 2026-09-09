#!/usr/bin/env node
// Automated gameplay QA for Q1 sow_and_grow (legacy-sow-and-grow redesign,
// t1-season-deadline-match). Simulates player strategies against
// src/q1/farmLogic.ts directly — same rules as the design-stage
// design-sim.mjs, now against the shipped module: thoughtless play (fixed
// variety, month-only lookup) must stay well below full reasoning, no
// variety may dominate a month with 2+ seasonal candidates, every session
// must be winnable, and FarmGame.tsx must never leak the answer or use a
// position-based order.
//
// Usage: node factory/harness/gameplay-qa-sow-grow.mjs
import { readFileSync } from "node:fs";
import { evaluate, MONTHS, newSession, OFFSETS, shuffledIds, VARIETIES, VARIETY_IDS } from "../../src/q1/farmLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function winnersFor(m, o, f) { return VARIETIES.filter((v) => evaluate(v, m, o, f).win).map((v) => v.id); }

// ---------------- pure rule-level checks (mirror design-sim.mjs) ----------------
{
  check("3 varieties defined", VARIETIES.length === 3);
  check("varieties are season-neutral names (no 春/夏/秋/冬 kanji, design review r1 ANSWER_LEAK fix)", VARIETIES.every((v) => !/[春夏秋冬]/.test(v.name)));

  const stateSpace = {};
  for (const m of MONTHS) {
    stateSpace[m] = [];
    for (const o of OFFSETS) for (const f of [false, true]) {
      const w = winnersFor(m, o, f);
      if (w.length > 0) stateSpace[m].push({ offset: o, forecastHot: f, winners: w });
    }
  }
  check("every month has at least one winnable (offset, forecast) state", MONTHS.every((m) => stateSpace[m].length > 0));

  const monthsWithMultipleCandidates = MONTHS.filter((m) => VARIETIES.filter((v) => v.window.includes(m)).length >= 2);
  check("at least one month has 2+ seasonally-eligible varieties", monthsWithMultipleCandidates.length > 0);
  const monthOnlyWinRate = {};
  for (const m of monthsWithMultipleCandidates) {
    const accepted = stateSpace[m];
    for (const id of VARIETY_IDS) monthOnlyWinRate[`${m}_${id}`] = accepted.filter((s) => s.winners.includes(id)).length / accepted.length;
  }
  check(
    "no variety wins 100% of a multi-candidate month's own accepted states (design review r2 C_NOT_NEEDED_FOR_D fix)",
    monthsWithMultipleCandidates.every((m) => VARIETY_IDS.every((id) => (monthOnlyWinRate[`${m}_${id}`] ?? 0) < 1)),
    JSON.stringify(monthOnlyWinRate)
  );
}

// ---------------- content-blind / memorization strategies stay well below full reasoning ----------------
const N = 8000;
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) if (fn(mulberry32(i * 7919 + 13))) w++; return Number((w / N).toFixed(4)); }

const results = {};
for (const fixedId of VARIETY_IDS) {
  results[`always_plant_${fixedId}`] = rate((rand) => {
    const s = newSession(rand);
    return evaluate(VARIETIES.find((v) => v.id === fixedId), s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
  });
}
results.legitimate_full_reasoning = rate((rand) => {
  const s = newSession(rand);
  return winnersFor(s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).length > 0;
});
results.random_pick_content_blind = rate((rand) => {
  const s = newSession(rand);
  const pick = VARIETIES[Math.floor(rand() * VARIETIES.length)];
  return evaluate(pick, s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).win;
});

check("legitimate reasoning always wins (every session is solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
check("every fixed-variety memorization strategy loses more than it wins", VARIETY_IDS.every((id) => results[`always_plant_${id}`] < 0.6), JSON.stringify(results));
check("content-blind random guessing stays well below full reasoning", results.random_pick_content_blind < results.legitimate_full_reasoning - 0.3, `${results.random_pick_content_blind}`);

// ---------------- session generation ----------------
{
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(JSON.stringify(newSession(mulberry32(i))));
  check("newSession produces varied (month, deadline, forecast) combinations, not a fixed one", seen.size > 5, `${seen.size} distinct sessions / 200`);
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 13 + 1));
    if (winnersFor(s.sowMonth, s.deadlineOffsetMonths, s.forecastHot).length === 0) { check("newSession never returns an unwinnable session", false, JSON.stringify(s)); break; }
  }
  if (passed + failed > 0) check("newSession never returns an unwinnable session (500 samples)", true);
}

// ---------------- shuffle-lifecycle correctness ----------------
{
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(shuffledIds(VARIETY_IDS, mulberry32(i)).join(","));
  check("variety card order varies across sessions (not a fixed order)", seen.size >= 3, `${seen.size} distinct orders / 40`);
  check("shuffledIds never drops or duplicates ids", shuffledIds(VARIETY_IDS, mulberry32(7)).slice().sort().join(",") === [...VARIETY_IDS].sort().join(","));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/FarmGame.tsx", import.meta.url), "utf8");
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  check("shuffled order and session are generated once per mount via useState initializers, not recomputed every render", src.includes("useState(() => newSession())") && src.includes("useState(() => shuffledIds(VARIETY_IDS))"));
  check("scoring reads committed variety id, never the display order array, when checking a win", (() => {
    const line = body.split("\n").find((l) => l.includes("evaluate(v,"));
    return !!line;
  })());
  check("component imports VARIETIES/VARIETY_IDS from farmLogic instead of redeclaring its own variety data", src.includes('from "./farmLogic"') && !/const\s+(SEEDS|VARIETIES)\s*[:=]/.test(body));
  const codeOnly = body.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  check("no fixed month/deadline/forecast literals reintroduced (old exploit: '今は7月'/'11月に')", !codeOnly.includes("今は7月") && !codeOnly.includes("11月に、にんじん300kg"));
  check("committing a variety resolves the session immediately (single-shot commit, no in-session retry per design review r2/r3)", !body.includes("まき直"));
  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly — Gate H HONEST OUTCOME", (() => {
    const partialBlock = body.split('outcome === "partial"')[1]?.split('outcome === "playing"')[0] ?? "";
    return partialBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(partialBlock);
  })());
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
