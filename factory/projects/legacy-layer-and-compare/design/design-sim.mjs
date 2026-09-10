#!/usr/bin/env node
// Design-stage exploit simulation for legacy-layer-and-compare / t1-diagnose-and-fix (v1).
//
// Audit finding (factory/state/legacy/reverse-audits/layer_and_compare.json): C_required=false,
// brute_force=true -- the OLD implementation (UrbanHeatGame.tsx) let the child apply the single
// available countermeasure to ANY of 3 fixed locations; "success" was just "some location's heat
// dropped from its fixed initial value" with no requirement that the countermeasure actually
// addressed that location's real cause, and a "別の場所に置きなおす" button let the child retry
// in-place until they stumbled on the one location flagged fixable=true.
//
// v1 design (per factory/projects/legacy-layer-and-compare/research.md, 環境省 ヒートアイランド
// 対策ガイドライン): real heat-island causes are 日射 (strong solar exposure), 舗装 (asphalt heat
// storage), and 風 (wind blocked by dense buildings) -- and NOT ALL causes have a single-point fix:
// 風 (wind-corridor) countermeasures only work at city/district scale (環境省データシート表3.2),
// so a location whose real problem is wind-blockage genuinely CANNOT be fixed by a single placed
// countermeasure. This is the source of real C⇄D structure the old game lacked: the child must
// read each location's 日射/風/舗装 readings, find the ONE location whose problem matches an
// available tool (街路樹・日除け for 日射, 保水性舗装 for 舗装), and apply the matching tool --
// never the wind-blocked location (no tool fixes it) and never a location with no problem at all.
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
// 日射/風/舗装 readings per role -- each role has EXACTLY ONE "bad" axis (research.md 3節: 3つの
// 原因を体感できる形に翻訳). "fine" = no problem on that axis.
export const ROLES = {
  SUN: { sun: "strong", wind: "strong", pavement: "retentive" }, // 日射が強い（さえぎるものがない）
  PAVEMENT: { sun: "weak", wind: "strong", pavement: "asphalt" }, // 地面がアスファルトで蓄熱
  WIND: { sun: "weak", wind: "weak", pavement: "retentive" }, // 建物が密集し風が通らない（個人の一手では直せない）
  FINE: { sun: "weak", wind: "strong", pavement: "retentive" }, // 特に問題なし
};
export const TOOLS = ["shade", "water_pavement"]; // 街路樹・日除け / 保水性・遮熱性舗装 -- 風を直す道具はない（研究: 都市/地区スケール専用）

// ---------------------------------------------------------------- archetypes
// Exactly one scenario type per session (50/50): the fixable role present is EITHER SUN OR
// PAVEMENT, never both -- this is what prevents a single-axis heuristic ("always look for 日射=
// strong, apply shade") from winning every session just because a fixable-by-shade location is
// always present (design review self-check: an earlier draft of this model guaranteed both SUN and
// PAVEMENT every session, which let a shade-only strategy win ~100% by ignoring 舗装 entirely).
// Every session also includes WIND (the unfixable trap) and FINE (nothing to fix) as distractors.
export const ARCHETYPES = [
  { id: "fix-sun", roles: ["SUN", "WIND", "FINE"], correctRole: "SUN", correctTool: "shade" },
  { id: "fix-pavement", roles: ["PAVEMENT", "WIND", "FINE"], correctRole: "PAVEMENT", correctTool: "water_pavement" },
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
// reads ONLY the 日射 axis: finds a slot with sun=strong and shades it; if none, guesses randomly.
// This is the single-axis exploit an earlier design draft allowed to win ~100% -- verify it now
// fails whenever this session's archetype is fix-pavement (no sun=strong slot exists that session).
results.sun_axis_only_then_random = rate((s, rand) => {
  const idx = s.slots.findIndex((sl) => sl.sun === "strong");
  if (idx >= 0) return sessionWin(s, idx, "shade");
  return sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand));
});
// symmetric check for the 舗装 axis.
results.pavement_axis_only_then_random = rate((s, rand) => {
  const idx = s.slots.findIndex((sl) => sl.pavement === "asphalt");
  if (idx >= 0) return sessionWin(s, idx, "water_pavement");
  return sessionWin(s, Math.floor(rand() * 3), pick(TOOLS, rand));
});
// reads ONLY the 風 axis to identify and AVOID the wind-blocked slot (genuine partial reasoning),
// then applies a FIXED tool to the first remaining (display-order) non-wind slot -- never actually
// distinguishes SUN/PAVEMENT/FINE from each other. Two variants (fixed tool = shade / water_pavement).
for (const fixedTool of TOOLS) {
  results[`avoid_wind_then_fixed_${fixedTool}`] = rate((s) => {
    const idx = s.slots.findIndex((sl) => sl.roleId !== "WIND");
    return sessionWin(s, idx, fixedTool);
  });
}
// correctly avoids the wind-blocked slot (knows wind isn't point-fixable) but otherwise guesses
// randomly between the remaining 2 slots and 2 tools -- partial reasoning, still well below full.
results.avoids_wind_then_random = rate((s, rand) => {
  const candidates = [0, 1, 2].filter((i) => s.slots[i].roleId !== "WIND");
  const slotIndex = candidates[Math.floor(rand() * candidates.length)];
  return sessionWin(s, slotIndex, pick(TOOLS, rand));
});
// applies whichever tool targets the FIRST slot (by display order) that has any non-fine reading,
// regardless of whether that slot is actually the archetype's correctRole -- catches a "just fix
// whatever looks bad first" strategy that never distinguishes WIND (unfixable) from a real target.
results.first_bad_looking_slot = rate((s) => {
  const idx = s.slots.findIndex((sl) => sl.sun === "strong" || sl.pavement === "asphalt" || sl.wind === "weak");
  if (idx < 0) return false;
  const sl = s.slots[idx];
  const tool = sl.sun === "strong" ? "shade" : sl.pavement === "asphalt" ? "water_pavement" : "shade"; // wind has no matching tool; guess shade
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
  avoids_wind_heuristic_capped: results.avoids_wind_then_random <= 0.7,
  avoid_wind_then_fixed_tool_capped: TOOLS.every((t) => results[`avoid_wind_then_fixed_${t}`] <= 0.7),
  first_bad_looking_heuristic_capped: results.first_bad_looking_slot <= 0.7,
  margin_over_sun_axis_shortcut: Number((results.legitimate_full_reasoning - results.sun_axis_only_then_random).toFixed(4)),
  margin_over_pavement_axis_shortcut: Number((results.legitimate_full_reasoning - results.pavement_axis_only_then_random).toFixed(4)),
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
  notes: "v1: real causes (日射/舗装/風) and countermeasures (街路樹・日除け/保水性舗装, no point-fix for 風) per research.md. Each session draws ONE of 2 archetypes (fix-sun / fix-pavement, 50/50) so the fixable-by-shade location is NOT guaranteed every session -- this specifically prevents a single-axis 'always check 日射, apply shade' strategy from reaching ~100% by exploiting an always-present SUN role (an earlier draft of this design had both SUN and PAVEMENT present every session and would have allowed exactly that exploit). WIND (unfixable at point scale, per 環境省データシート表3.2 -- wind-corridor measures are city/district-scale only) and FINE (nothing to fix) are always-present distractors. sun_axis_only_then_random / pavement_axis_only_then_random verify a strategy that reads only one cause axis is capped near 58% (wins its own archetype 100%, falls back to a 1-in-6 random guess on the other), well below full reasoning's 100%. avoid_wind_then_fixed_shade / avoid_wind_then_fixed_water_pavement additionally verify a strategy that correctly reads ONLY the 風 axis to avoid the unfixable location, then applies a fixed tool to whichever other slot comes first in display order without ever distinguishing SUN/PAVEMENT/FINE -- capped near 25%, since it never actually reads 日射/舗装.",
};
try {
  writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  console.error(`(non-fatal: could not write design-sim-result.json in this environment -- ${e.message}. Printing result to stdout only.)`);
}
console.log(JSON.stringify(out, null, 2));
