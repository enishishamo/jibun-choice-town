#!/usr/bin/env node
// Automated gameplay QA for Q1 allocate_and_forecast (legacy-allocate-and-forecast redesign,
// t5-brief-and-allocate-corrected). Simulates player strategies against
// src/q1/waterAllocationLogic.ts directly -- same rules as the design-stage design-sim.mjs, now
// against the shipped module: fixed-choice guessing, single-axis reads, and content-blind reads
// must stay well below full reasoning, every session must be winnable, and WaterGame.tsx must
// never leak the answer or use position-based scoring.
//
// Usage: node factory/harness/gameplay-qa-water-allocation.mjs
import { readFileSync } from "node:fs";
import {
  CAPACITY_TEXT,
  DEPTHS,
  DEPTH_TABLE,
  SECTORS,
  URGENCY_TEXT,
  newSession,
  sessionWin,
  shuffledIds,
} from "../../src/q1/waterAllocationLogic.ts";

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

// ---------------- pure rule-level checks (mirror design-sim.mjs) ----------------
{
  check("3 sectors defined (household/agriculture/industrial)", SECTORS.length === 3 && SECTORS.includes("household") && SECTORS.includes("agriculture") && SECTORS.includes("industrial"));
  check("3 depths defined (light/medium/heavy)", DEPTHS.length === 3 && DEPTHS.includes("light") && DEPTHS.includes("medium") && DEPTHS.includes("heavy"));
  check("DEPTH_TABLE matches design-sim.mjs exactly", DEPTH_TABLE["HIGH,SOON"] === "light" && DEPTH_TABLE["HIGH,FAR"] === "medium" && DEPTH_TABLE["LOW,SOON"] === "medium" && DEPTH_TABLE["LOW,FAR"] === "heavy");
  check("every sector has both urgency and capacity display text (household is not a special case)", SECTORS.every((s) => URGENCY_TEXT[s].yes && URGENCY_TEXT[s].no && CAPACITY_TEXT[s].yes && CAPACITY_TEXT[s].no));
}

// ---------------- strategies ----------------
const N = 8000;
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; } return Number((w / N).toFixed(4)); }

const results = {};
results.legitimate_full_reasoning = rate((s) => sessionWin(s, s.correctSector, s.correctDepth));

for (const sector of SECTORS) {
  for (const depth of DEPTHS) {
    results[`fixed_${sector}_${depth}`] = rate((s) => sessionWin(s, sector, depth));
  }
}
results.random_pick = rate((s, rand) => sessionWin(s, SECTORS[Math.floor(rand() * SECTORS.length)], DEPTHS[Math.floor(rand() * DEPTHS.length)]));
results.correct_sector_random_depth = rate((s, rand) => sessionWin(s, s.correctSector, DEPTHS[Math.floor(rand() * DEPTHS.length)]));
results.correct_depth_random_sector = rate((s, rand) => sessionWin(s, SECTORS[Math.floor(rand() * SECTORS.length)], s.correctDepth));
results.capacity_only_smart = rate((s, rand) => {
  const matches = SECTORS.filter((sec) => s.sectors[sec].capacity === "yes");
  const pool = matches.length > 0 ? matches : SECTORS;
  return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
});
results.urgency_only_smart = rate((s, rand) => {
  const matches = SECTORS.filter((sec) => s.sectors[sec].urgency === "no");
  const pool = matches.length > 0 ? matches : SECTORS;
  return sessionWin(s, pool[Math.floor(rand() * pool.length)], s.correctDepth);
});
results.reservoir_only_depth = rate((s) => sessionWin(s, s.correctSector, s.reservoir === "HIGH" ? "light" : "heavy"));
results.rain_only_depth = rate((s) => sessionWin(s, s.correctSector, s.rain === "SOON" ? "light" : "heavy"));

check("legitimate reasoning always wins (every session is solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
check("every fixed (sector,depth) guess fails well below reasoning, household included", Object.keys(results).filter((k) => k.startsWith("fixed_")).every((k) => results[k] <= 0.3), JSON.stringify(Object.fromEntries(Object.entries(results).filter(([k]) => k.startsWith("fixed_")))));
check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.2, `${results.random_pick}`);
check("correct sector + random depth stays capped near 1/3", results.correct_sector_random_depth <= 0.4, `${results.correct_sector_random_depth}`);
check("correct depth + random sector stays capped near 1/3", results.correct_depth_random_sector <= 0.4, `${results.correct_depth_random_sector}`);
check("'capacity-only smart' stays at or below 0.6", results.capacity_only_smart <= 0.6, `${results.capacity_only_smart}`);
check("'urgency-only smart' stays at or below 0.6", results.urgency_only_smart <= 0.6, `${results.urgency_only_smart}`);
check("reservoir-only depth heuristic caps near 50%", results.reservoir_only_depth <= 0.55, `${results.reservoir_only_depth}`);
check("rain-only depth heuristic caps near 50%", results.rain_only_depth <= 0.55, `${results.rain_only_depth}`);

// ---------------- session generation ----------------
{
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(newSession(mulberry32(i)).archetypeSector);
  check("newSession produces varied archetype sectors, not a fixed one", seen.size === 3, `${seen.size} distinct archetypes / 200`);
  let allSolvable = true;
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 13 + 1));
    if (!sessionWin(s, s.correctSector, s.correctDepth)) { allSolvable = false; break; }
  }
  check("newSession never returns an unwinnable session (500 samples)", allSolvable);
}

// ---------------- shuffle-lifecycle correctness ----------------
{
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(shuffledIds(SECTORS, mulberry32(i)).join(","));
  check("card display order varies across sessions", seen.size >= 3, `${seen.size} distinct orders / 40`);
  check("shuffledIds never drops or duplicates ids", shuffledIds(SECTORS, mulberry32(7)).slice().sort().join(",") === [...SECTORS].sort().join(","));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/WaterGame.tsx", import.meta.url), "utf8");
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  check("session is generated once per mount via a useState initializer, not recomputed every render", src.includes("useState(() => newSession())"));
  check("component imports SECTORS/DEPTHS data from waterAllocationLogic instead of redeclaring its own sector/depth data", src.includes('from "./waterAllocationLogic"') && !/const\s+(SECTORS|DEPTHS|DEPTH_TABLE)\s*[:=]/.test(body));
  const codeOnly = body.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  check("no old-implementation literals reintroduced (old exploit: percent sliders, hitCritical restart)", !codeOnly.includes("STEPS") && !codeOnly.includes("hitCritical") && !codeOnly.includes("今日からやり直す"));
  check("no per-sector impact text reintroduced (old exploit: impactAt shown per slider) and no same-session scored retry button", !codeOnly.includes("impactAt") && !codeOnly.includes("advance"));
  check("committing resolves the session immediately (single-shot commit, no in-session scored retry)", (() => {
    const commitFn = body.match(/const commit = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
    return commitFn.includes("setOutcome");
  })());
  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly — Gate H HONEST OUTCOME", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split('outcome === "playing"')[0] ?? body;
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());
  check("the post-failure reflection step covers BOTH sector and depth (THINK_AGAIN_INCOMPLETE regression, design review r2 BLOCKER)", src.includes("reflectSector") && src.includes("reflectDepth") && src.includes("canContinueReflection"));
  check("commit button requires all 5 cards opened AND sector AND depth selected — CORE_DATA_DISCLOSURE_NOT_REQUIRED regression", (() => {
    const canCommitLine = src.match(/const canCommit = ([^;]+);/)?.[1] ?? "";
    const allDataReadLine = src.match(/const allDataRead = ([^;]+);/)?.[1] ?? "";
    const toggleOpenBody = src.match(/const toggleOpen = \(id: CardId\) => \{([\s\S]*?)\};/)?.[1] ?? "";
    return (
      /disabled=\{!canCommit\}/.test(src) &&
      canCommitLine.includes("allDataRead") && canCommitLine.includes("selectedSector !== null") && canCommitLine.includes("selectedDepth !== null") &&
      allDataReadLine.includes("openedCards.size") &&
      /setOpenedCards\(\(prev\) => \(prev\.has\(id\) \? prev : new Set\(prev\)\.add\(id\)\)\)/.test(toggleOpenBody) &&
      !/delete|filter/.test(toggleOpenBody)
    );
  })());
  check("the reflection continue button is disabled until BOTH reflection picks are made — THINK_AGAIN_SKIPPABLE regression", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split('outcome === "playing"')[0] ?? "";
    return /disabled=\{!canContinueReflection\}/.test(reflectBlock);
  })());
  check("sector card display order is shuffled once per mount, not rendered in fixed SECTORS order", src.includes("useState<CardId[]>(() => shuffledIds(ALL_CARD_IDS))") && src.includes("cardOrder.map"));
  check("depth button display order is shuffled once per mount, not rendered in fixed DEPTHS order", src.includes("useState<Depth[]>(() => shuffledIds(DEPTHS))") && src.includes("depthOrder.map"));
  check("scoring is id-based (sessionWin reads correctSector/correctDepth by id), never position-based", !/session\.sectors\[\d/.test(body) && !/slots\[\d/.test(body));
  check("the reflection screen re-presents all 5 readings (THINK_AGAIN_CONTEXT_MISSING regression, impl review r1 BLOCKER) — not just the 2 question sets", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split('outcome === "playing"')[0] ?? "";
    return reflectBlock.includes("readingOf(id)") && reflectBlock.includes("cardOrder.map");
  })());
  check("the reflection screen shows the previously-selected sector's unchanged state (VISUAL_FAILURE_CONSEQUENCE_INCOMPLETE regression, impl review r1 HIGH)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split('outcome === "playing"')[0] ?? "";
    return reflectBlock.includes("selectedSector") && reflectBlock.includes("様子は変わっていない");
  })());
  check("the playing (pre-commit) screen shows a reservoir meter baseline before any commit (impl review r1 HIGH)", (() => {
    const playingBlock = body.split('outcome === "reflecting"')[0] ?? body;
    return (playingBlock.match(/className="meter"/g) || []).length >= 1;
  })());
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
