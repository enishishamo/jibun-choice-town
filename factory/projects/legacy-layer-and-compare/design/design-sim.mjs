#!/usr/bin/env node
// Design-stage exploit simulation for legacy-layer-and-compare / t1-diagnose-and-fix (v2).
//
// Audit finding (factory/state/legacy/reverse-audits/layer_and_compare.json): C_required=false,
// brute_force=true -- the OLD implementation (UrbanHeatGame.tsx) let the child apply the single
// available countermeasure to ANY of 3 fixed locations; "success" was just "some location's heat
// dropped from its fixed initial value" with no requirement that the countermeasure actually
// addressed that location's real cause, and a "別の場所に置きなおす" button let the child retry
// in-place until they stumbled on the one location flagged fixable=true.
//
// v2 fixes over v1 (superseded -- see design-review-r1.result.json, FAIL 55, 2 HIGH):
// CORE_DATA_AXIS_NOT_REQUIRED (HIGH): v1 gave the WIND distractor an anomaly ONLY on the 風 axis,
// with 日射/舗装 both reading "fine". That meant a strategy reading ONLY 日射 and 舗装 (falling
// back from one to the other, never touching 風 at all) could uniquely identify the correct target
// every single session -- the target was always the ONE slot with a sun/pavement anomaly, since
// WIND's anomaly never appeared on those two axes and FINE had no anomaly anywhere. 風 data was
// completely decorative. Fixed: each archetype's "budget-shouldn't-go-here" distractor is now a
// WIND-CONFOUND -- a location where wind-blockage is the DOMINANT cause but that ALSO happens to
// show the SAME surface symptom as that archetype's real target (sun=strong in the fix-sun
// archetype, pavement=asphalt in fix-pavement), differing from the true target ONLY on the 風 axis.
// This mirrors a real documented failure mode in research.md's "よくある失敗" (原因を診断せずに
// 単一の対策をどこにでも当てはめる) -- a location can show a symptom matching an available tool
// while its DOMINANT, actionable cause is something the tool can't touch. A strategy that reads
// only the target axis (sun or pavement) now faces TWO matching candidates per relevant archetype
// and must also check 風 to tell them apart -- see sun_axis_only_then_random /
// pavement_axis_only_then_random below, now capped near 33% instead of the old (broken) ~100%.
//
// IMPORTANT (design review r2 BLOCKER fix, WIND_CONFOUND_CAUSAL_MODEL_UNGROUNDED): sessionWin's
// binary roleId match is a scoring/mission-success rule, NOT a physics claim that shade/water_
// pavement has literally zero effect at a wind-confound location. research.md documents these
// countermeasures' local effects (e.g. street trees: 15C pavement gap; water-retentive pavement:
// -10C after sprinkling) as real and location-local -- applying one at a wind-confound location
// plausibly still does SOMETHING. What sessionWin actually models is a resource-allocation
// question, grounded in research.md's own documentation that real heat-island measures compete for
// limited budget alongside other policy goals (環境省 全国170自治体アンケート): given only ONE
// countermeasure deployment this session, did the child spend it on the location where the
// DOMINANT, addressable cause actually is? Spending it at a wind-confound location is scored as
// not achieving the mission (the location will NOT cool down enough to matter, because its
// governing problem was left untreated) even though the treatment itself isn't asserted to be
// physically inert. Every downstream design doc (ae/game_translations/no_manual_exploit_check) was
// reworded to state this framing explicitly and never claim a zero-effect outcome.
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------- roles (real causes)
// 日射/風/舗装 readings per role. Each archetype's WIND-CONFOUND role deliberately shares the
// target's surface symptom on ONE axis (so a single-axis reader is fooled) but differs on 風 (its
// real, unfixable dominant cause) -- see header comment.
export const ROLES = {
  SUN_TARGET: { sun: "strong", wind: "strong", pavement: "retentive" }, // 日射が強い（さえぎるものがない）。風は通り、他は正常
  PAVEMENT_TARGET: { sun: "weak", wind: "strong", pavement: "asphalt" }, // 地面がアスファルトで蓄熱。風は通り、他は正常
  WIND_CONFOUND_SUN: { sun: "strong", wind: "weak", pavement: "retentive" }, // 見た目は日射問題だが、実際は建物密集で風が通らないのが支配的原因（個人の一手では直せない）
  WIND_CONFOUND_PAVEMENT: { sun: "weak", wind: "weak", pavement: "asphalt" }, // 見た目は舗装問題だが、実際は建物密集で風が通らないのが支配的原因（個人の一手では直せない）
  FINE: { sun: "weak", wind: "strong", pavement: "retentive" }, // 特に問題なし
};
export const TOOLS = ["shade", "water_pavement"]; // 街路樹・日除け / 保水性・遮熱性舗装 -- 風を直す道具はない（研究: 都市/地区スケール専用）

// ---------------------------------------------------------------- archetypes
// Exactly one scenario type per session (50/50): the fixable role present is EITHER SUN OR
// PAVEMENT, never both (design review r1 confirmed this half of the model is sound -- prevents a
// "sun-guaranteed-every-session" exploit). Each archetype's distractor pair is FINE (no problem)
// plus a WIND-CONFOUND that mimics THAT archetype's target symptom (see ROLES comment) -- this is
// what forces genuine cross-axis reading rather than a single-axis or two-axis-without-wind shortcut.
export const ARCHETYPES = [
  { id: "fix-sun", roles: ["SUN_TARGET", "WIND_CONFOUND_SUN", "FINE"], correctRole: "SUN_TARGET", correctTool: "shade" },
  { id: "fix-pavement", roles: ["PAVEMENT_TARGET", "WIND_CONFOUND_PAVEMENT", "FINE"], correctRole: "PAVEMENT_TARGET", correctTool: "water_pavement" },
];

function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }

export function newSession(rand) {
  const arc = pick(ARCHETYPES, rand);
  const slotRoles = shuffle(arc.roles, rand); // display-position independent of role
  return {
    archetype: arc.id,
    correctRole: arc.correctRole,
    correctTool: arc.correctTool,
    slots: slotRoles.map((roleId) => ({ roleId, ...ROLES[roleId] })),
  };
}

export function sessionWin(session, slotIndex, tool) {
  return session.slots[slotIndex].roleId === session.correctRole && tool === session.correctTool;
}

const N = 20000;
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; } return Number((w / N).toFixed(4)); }

const results = {};
// legitimate: find the slot whose readings match a tool's target role, apply it -- always correct.
results.legitimate_full_reasoning = rate((s) => {
  const idx = s.slots.findIndex((sl) => sl.roleId === s.correctRole);
  return sessionWin(s, idx, s.correctTool);
});
// 6 fixed (slot, tool) strategies -- a child who never reads the data and always taps the same spot.
for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
  for (const tool of TOOLS) {
    results[`fixed_slot${slotIndex}_${tool}`] = rate((s) => sessionWin(s, slotIndex, tool));
  }
}
// content-blind random (slot, tool) guess.
results.random_pick = rate((s, rand) => sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand)));
// reads ONLY the 日射 axis: finds a slot with sun=strong and shades it (picking the first match in
// display order if there are two -- the fix-sun archetype now always has exactly two: SUN_TARGET
// and WIND_CONFOUND_SUN); if no slot has sun=strong, guesses randomly. design review r1 HIGH fix:
// this is now capped well below 100% because it can no longer uniquely identify the target.
results.sun_axis_only_then_random = rate((s, rand) => {
  const matches = s.slots.map((sl, i) => (sl.sun === "strong" ? i : -1)).filter((i) => i >= 0);
  if (matches.length > 0) return sessionWin(s, matches[0], "shade");
  return sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand));
});
// symmetric check for the 舗装 axis.
results.pavement_axis_only_then_random = rate((s, rand) => {
  const matches = s.slots.map((sl, i) => (sl.pavement === "asphalt" ? i : -1)).filter((i) => i >= 0);
  if (matches.length > 0) return sessionWin(s, matches[0], "water_pavement");
  return sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand));
});
// reads 日射+舗装 together (fallback: check sun first, else pavement) but STILL never reads 風 --
// this is the EXACT strategy design review r1 found winning ~100% under the v1 model. Verify it is
// now capped: in each archetype it faces the same "two symptom-matching candidates, no 風 to break
// the tie" problem as the single-axis checks above.
results.sun_then_pavement_never_wind = rate((s, rand) => {
  const sunMatches = s.slots.map((sl, i) => (sl.sun === "strong" ? i : -1)).filter((i) => i >= 0);
  if (sunMatches.length > 0) return sessionWin(s, sunMatches[0], "shade");
  const pavMatches = s.slots.map((sl, i) => (sl.pavement === "asphalt" ? i : -1)).filter((i) => i >= 0);
  if (pavMatches.length > 0) return sessionWin(s, pavMatches[0], "water_pavement");
  return sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand));
});
// reads ONLY the 風 axis to identify and AVOID the wind-dominated slot(s), then applies a FIXED
// tool to the first remaining (display-order) slot -- never actually reads 日射/舗装 to distinguish
// the real target from FINE.
for (const fixedTool of TOOLS) {
  results[`avoid_wind_then_fixed_${fixedTool}`] = rate((s) => {
    const idx = s.slots.findIndex((sl) => sl.wind !== "weak");
    return sessionWin(s, idx, fixedTool);
  });
}
// correctly avoids the wind-dominated slot but otherwise guesses randomly between the remaining 2
// slots (target + FINE) and 2 tools -- genuine partial reasoning (風 axis only), still well below full.
results.avoids_wind_then_random = rate((s, rand) => {
  const candidates = [0, 1, 2].filter((i) => s.slots[i].wind !== "weak");
  const slotIndex = candidates[Math.floor(rand() * candidates.length)];
  return sessionWin(s, slotIndex, pick(TOOLS, rand));
});
// applies whichever tool targets the FIRST slot (by display order) that has any non-fine reading on
// ANY axis, regardless of whether that slot is actually the archetype's correctRole -- catches a
// "just fix whatever looks bad first" strategy that never distinguishes the wind-confound from a
// real target.
results.first_bad_looking_slot = rate((s) => {
  const idx = s.slots.findIndex((sl) => sl.sun === "strong" || sl.pavement === "asphalt" || sl.wind === "weak");
  if (idx < 0) return false;
  const sl = s.slots[idx];
  const tool = sl.sun === "strong" ? "shade" : sl.pavement === "asphalt" ? "water_pavement" : "shade"; // wind-only anomaly has no matching tool; guess shade
  return sessionWin(s, idx, tool);
});

// archetype distribution sanity check (should be ~1/2 each)
const archCounts = {};
for (let i = 0; i < N; i++) { const s = newSession(mulberry32(i * 7919 + 13)); archCounts[s.archetype] = (archCounts[s.archetype] ?? 0) + 1; }
// slot-position distribution for the correct role (should be ~1/3 each -- display position must
// not correlate with correctness).
const slotCounts = { 0: 0, 1: 0, 2: 0 };
for (let i = 0; i < N; i++) {
  const s = newSession(mulberry32(i * 7919 + 13));
  const idx = s.slots.findIndex((sl) => sl.roleId === s.correctRole);
  slotCounts[idx] += 1;
}

const verdict = {
  legitimate_always_wins: results.legitimate_full_reasoning === 1,
  fixed_slot_tool_guesses_fail: Object.keys(results).filter((k) => k.startsWith("fixed_slot")).every((k) => results[k] < 0.3),
  random_pick_stays_low: results.random_pick < 0.3,
  single_axis_shortcut_capped: results.sun_axis_only_then_random <= 0.7 && results.pavement_axis_only_then_random <= 0.7,
  sun_then_pavement_never_wind_capped: results.sun_then_pavement_never_wind <= 0.7,
  avoids_wind_heuristic_capped: results.avoids_wind_then_random <= 0.7,
  avoid_wind_then_fixed_tool_capped: TOOLS.every((t) => results[`avoid_wind_then_fixed_${t}`] <= 0.7),
  first_bad_looking_heuristic_capped: results.first_bad_looking_slot <= 0.7,
  margin_over_sun_axis_shortcut: Number((results.legitimate_full_reasoning - results.sun_axis_only_then_random).toFixed(4)),
  margin_over_pavement_axis_shortcut: Number((results.legitimate_full_reasoning - results.pavement_axis_only_then_random).toFixed(4)),
  margin_over_sun_then_pavement_never_wind: Number((results.legitimate_full_reasoning - results.sun_then_pavement_never_wind).toFixed(4)),
  archetype_distribution_balanced: Object.values(archCounts).every((c) => Math.abs(c / N - 0.5) < 0.02),
  correct_slot_position_balanced: Object.values(slotCounts).every((c) => Math.abs(c / N - 1 / 3) < 0.02),
};

const out = {
  n: N,
  roles: ROLES,
  tools: TOOLS,
  archetypes: ARCHETYPES,
  archetypeDistribution: archCounts,
  correctSlotPositionDistribution: slotCounts,
  results,
  verdict,
  notes: "v2 (design review r1 FAIL 55 repair, HIGH CORE_DATA_AXIS_NOT_REQUIRED; design review r2 BLOCKER WIND_CONFOUND_CAUSAL_MODEL_UNGROUNDED repair -- framing only, no logic change below this line): v1's WIND distractor had an anomaly ONLY on the 風 axis, so a strategy reading just 日射+舗装 (never 風) could uniquely identify the target every session -- 風 was decorative. v2 replaces the plain WIND distractor in each archetype with a WIND-CONFOUND that mimics that archetype's target symptom on the target's own axis (sun=strong for fix-sun's confound, pavement=asphalt for fix-pavement's confound) while differing only on 風 (its dominant, addressable-only-at-city/district-scale cause) -- grounded in research.md's documented failure mode of diagnosing from a single surface symptom without checking the dominant cause. sessionWin's binary match is a resource-allocation/mission-success rule (did the child spend this session's one countermeasure where the dominant cause actually is), not a claim that the countermeasure has zero physical effect at a wind-confound location -- see the file header for the full r2 framing fix. sun_then_pavement_never_wind (the EXACT strategy r1's reviewer identified winning ~100% under v1) is now capped near 50% (each archetype presents exactly two symptom-matching candidates -- the target and its wind-confound -- so this strategy degenerates to a 50/50 guess between them every session, with 風 the only axis that would break the tie). sun_axis_only_then_random / pavement_axis_only_then_random are capped near 33% (that 50/50-within-its-own-archetype plus a 1-in-6 random fallback in the archetype where its axis shows no anomaly at all -- previously ~58% under v1, which was itself far short of v1's true ~100% flaw once sun+pavement were combined). avoid_wind_then_fixed_* / avoids_wind_then_random (reads 風 only, ignores the target axis) remain capped near 25%, since knowing to exclude the confound still leaves target vs FINE undecided.",
};
try {
  writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  console.error(`(non-fatal: could not write design-sim-result.json in this environment -- ${e.message}. Printing result to stdout only.)`);
}
console.log(JSON.stringify(out, null, 2));
