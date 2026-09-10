#!/usr/bin/env node
// Automated gameplay QA for Q1 layer_and_compare (legacy-layer-and-compare redesign,
// t1-diagnose-and-fix). Simulates player strategies against src/q1/heatDiagnosisLogic.ts directly
// -- same rules as the design-stage design-sim.mjs, now against the shipped module: fixed-choice
// guessing, single-axis reads, and wind-only reads must stay well below full reasoning, every
// session must be winnable, and UrbanHeatGame.tsx must never leak the answer or use position-based
// scoring.
//
// Usage: node factory/harness/gameplay-qa-heat-diagnosis.mjs
import { readFileSync } from "node:fs";
import {
  LOCATION_NAMES,
  ROLES,
  TOOLS,
  newSession,
  sessionWin,
  shuffledIds,
} from "../../src/q1/heatDiagnosisLogic.ts";

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
  check("5 roles defined (SUN_TARGET/PAVEMENT_TARGET/WIND_CONFOUND_SUN/WIND_CONFOUND_PAVEMENT/FINE)", Object.keys(ROLES).length === 5);
  check("2 tools defined (shade/water_pavement)", TOOLS.length === 2 && TOOLS.includes("shade") && TOOLS.includes("water_pavement"));
  check("SUN_TARGET and WIND_CONFOUND_SUN share the sun=strong symptom but differ on wind (the tie-breaker)", ROLES.SUN_TARGET.sun === "strong" && ROLES.WIND_CONFOUND_SUN.sun === "strong" && ROLES.SUN_TARGET.wind !== ROLES.WIND_CONFOUND_SUN.wind);
  check("PAVEMENT_TARGET and WIND_CONFOUND_PAVEMENT share the pavement=asphalt symptom but differ on wind", ROLES.PAVEMENT_TARGET.pavement === "asphalt" && ROLES.WIND_CONFOUND_PAVEMENT.pavement === "asphalt" && ROLES.PAVEMENT_TARGET.wind !== ROLES.WIND_CONFOUND_PAVEMENT.wind);
  check("FINE has no anomaly (matches neither target symptom, wind is strong)", ROLES.FINE.sun === "weak" && ROLES.FINE.pavement === "retentive" && ROLES.FINE.wind === "strong");
  check("3 neutral location names defined, none hinting a cause", LOCATION_NAMES.length === 3 && LOCATION_NAMES.every((n) => !/日射|風|舗装|アスファルト/.test(n)));
}

// ---------------- strategies ----------------
const N = 8000;
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; } return Number((w / N).toFixed(4)); }

const results = {};
results.legitimate_full_reasoning = rate((s) => {
  const idx = s.slots.findIndex((sl) => sl.roleId === s.correctRole);
  return sessionWin(s, idx, s.correctTool);
});
for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
  for (const tool of TOOLS) {
    results[`fixed_slot${slotIndex}_${tool}`] = rate((s) => sessionWin(s, slotIndex, tool));
  }
}
results.random_pick = rate((s, rand) => sessionWin(s, Math.floor(rand() * 3), TOOLS[Math.floor(rand() * TOOLS.length)]));
results.sun_axis_only_then_random = rate((s, rand) => {
  const matches = s.slots.map((sl, i) => (sl.reading.sun === "strong" ? i : -1)).filter((i) => i >= 0);
  if (matches.length > 0) return sessionWin(s, matches[0], "shade");
  return sessionWin(s, Math.floor(rand() * 3), TOOLS[Math.floor(rand() * TOOLS.length)]);
});
results.pavement_axis_only_then_random = rate((s, rand) => {
  const matches = s.slots.map((sl, i) => (sl.reading.pavement === "asphalt" ? i : -1)).filter((i) => i >= 0);
  if (matches.length > 0) return sessionWin(s, matches[0], "water_pavement");
  return sessionWin(s, Math.floor(rand() * 3), TOOLS[Math.floor(rand() * TOOLS.length)]);
});
results.sun_then_pavement_never_wind = rate((s, rand) => {
  const sunMatches = s.slots.map((sl, i) => (sl.reading.sun === "strong" ? i : -1)).filter((i) => i >= 0);
  if (sunMatches.length > 0) return sessionWin(s, sunMatches[0], "shade");
  const pavMatches = s.slots.map((sl, i) => (sl.reading.pavement === "asphalt" ? i : -1)).filter((i) => i >= 0);
  if (pavMatches.length > 0) return sessionWin(s, pavMatches[0], "water_pavement");
  return sessionWin(s, Math.floor(rand() * 3), TOOLS[Math.floor(rand() * TOOLS.length)]);
});
for (const fixedTool of TOOLS) {
  results[`avoid_wind_then_fixed_${fixedTool}`] = rate((s) => {
    const idx = s.slots.findIndex((sl) => sl.reading.wind !== "weak");
    return sessionWin(s, idx, fixedTool);
  });
}

check("legitimate reasoning always wins (every session is solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
check("every fixed (slot,tool) guess fails well below reasoning", Object.keys(results).filter((k) => k.startsWith("fixed_slot")).every((k) => results[k] < 0.3), JSON.stringify(results));
check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.3, `${results.random_pick}`);
check("single-axis-only strategies stay capped (wind-confound forces cross-axis reading)", results.sun_axis_only_then_random <= 0.5 && results.pavement_axis_only_then_random <= 0.5, JSON.stringify({ sun: results.sun_axis_only_then_random, pavement: results.pavement_axis_only_then_random }));
check("'read sun then pavement, never wind' (the exact defect design review r1 found) stays capped near 50%", results.sun_then_pavement_never_wind <= 0.6, `${results.sun_then_pavement_never_wind}`);
check("'avoid wind, apply fixed tool' strategies stay well below full reasoning", TOOLS.every((t) => results[`avoid_wind_then_fixed_${t}`] <= 0.4), JSON.stringify(results));

// ---------------- session generation ----------------
{
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(JSON.stringify(newSession(mulberry32(i)).slots.map((s) => s.roleId)));
  check("newSession produces varied role combinations, not a fixed one", seen.size > 2, `${seen.size} distinct combos / 200`);
  let allSolvable = true;
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 13 + 1));
    const idx = s.slots.findIndex((sl) => sl.roleId === s.correctRole);
    if (idx < 0 || !sessionWin(s, idx, s.correctTool)) { allSolvable = false; break; }
  }
  check("newSession never returns an unwinnable session (500 samples)", allSolvable);
}

// ---------------- shuffle-lifecycle correctness ----------------
{
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(shuffledIds(LOCATION_NAMES, mulberry32(i)).join(","));
  check("location name display order varies across sessions", seen.size >= 3, `${seen.size} distinct orders / 40`);
  check("shuffledIds never drops or duplicates ids", shuffledIds(LOCATION_NAMES, mulberry32(7)).slice().sort().join(",") === [...LOCATION_NAMES].sort().join(","));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/UrbanHeatGame.tsx", import.meta.url), "utf8");
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  check("session is generated once per mount via a useState initializer, not recomputed every render", src.includes("useState(() => newSession())"));
  check("component imports ROLES/TOOLS data from heatDiagnosisLogic instead of redeclaring its own location/tool data", src.includes('from "./heatDiagnosisLogic"') && !/const\s+(POINTS|ROLES|TOOLS)\s*[:=]/.test(body));
  const codeOnly = body.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  check("no fixed old-implementation literals reintroduced (old exploit: hardcoded fixable/afterFix per point)", !codeOnly.includes("fixable") && !codeOnly.includes("afterFix"));
  check("no per-item failure feedback reintroduced (old exploit: fixNote shown per point) and no same-session retry button", !codeOnly.includes("fixNote") && !codeOnly.includes("別の場所に置きなお"));
  check("committing resolves the session immediately (single-shot commit, no in-session scored retry)", !body.includes("再シミュレーション"));
  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly — Gate H HONEST OUTCOME", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split('return (')[1]?.split("outcome ===")[0] ?? body;
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());
  check("the post-failure reflection step exists and is visually distinct from the scored commit step", src.includes("reflectionPick") && src.includes("結果は変わりません"));
  check("commit button requires a location, a tool, AND that all three locations' data has been opened — CORE_DATA_DISCLOSURE_NOT_REQUIRED regression (impl review r1 BLOCKER)", (() => {
    const canCommitLine = src.match(/const canCommit = ([^;]+);/)?.[1] ?? "";
    const allDataReadLine = src.match(/const allDataRead = ([^;]+);/)?.[1] ?? "";
    const toggleOpenBody = src.match(/const toggleOpen = \(i: number\) => \{([\s\S]*?)\};/)?.[1] ?? "";
    return (
      /disabled=\{!canCommit\}/.test(src) &&
      canCommitLine.includes("allDataRead") && canCommitLine.includes("selectedSlot !== null") && canCommitLine.includes("selectedTool !== null") &&
      allDataReadLine.includes("openedSlots.size") &&
      // toggleOpen must be an add-only functional update (never remove an index, e.g. re-closing a
      // card must not revoke disclosure credit -- impl review r2 LOW: strengthen beyond string
      // presence to actually check add-only semantics).
      /setOpenedSlots\(\(prev\) => \(prev\.has\(i\) \? prev : new Set\(prev\)\.add\(i\)\)\)/.test(toggleOpenBody) &&
      !/delete|filter/.test(toggleOpenBody)
    );
  })());
  check("the reflection continue button is disabled until a reflection pick is made — THINK_AGAIN_SKIPPABLE regression (impl review r1 BLOCKER)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split('outcome === "playing"')[0] ?? "";
    return /disabled=\{reflectionPick === null\}/.test(reflectBlock);
  })());
  check("tool card display order is shuffled once per mount, not rendered in fixed TOOLS order — TOOL_ORDER_NOT_SHUFFLED regression (impl review r1 MEDIUM)", src.includes("useState<Tool[]>(() => shuffledIds(TOOLS)") && src.includes("toolOrder.map"));
  check("no unused 'partial' outcome state left in the type union (impl review r1 LOW)", !/"playing" \| "reflecting" \| "success" \| "partial"/.test(src));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
