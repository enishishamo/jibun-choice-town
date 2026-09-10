// Pure rules for the urban-heat-analysis Q1 (gameType: layer_and_compare), redesigned per
// factory/projects/legacy-layer-and-compare (GAME_TRANSLATION_REBUILD, t1-diagnose-and-fix).
// Same pattern as farmLogic.ts/logisticsLogic.ts: no React here.
//
// The old implementation (superseded, see factory/state/legacy/reverse-audits/
// layer_and_compare.json) had 3 fixed locations where the single available countermeasure always
// worked at 2 of them (fixable=true, hardcoded) and never at the third (fixable=false, hardcoded,
// already cool) -- C_required=false, since the 4 data layers never gated success, and a "別の場所
// に置きなおす" button let the child brute-force the fixable location by trying each in turn. This
// module mirrors factory/projects/legacy-layer-and-compare/design/design-sim.mjs (design review r4
// PASS 88) exactly -- ROLES/ARCHETYPES/TOOLS/sessionWin are byte-identical in structure. Keep the
// two in sync.
export type Axis = "sun" | "wind" | "pavement";
export type RoleId = "SUN_TARGET" | "PAVEMENT_TARGET" | "WIND_CONFOUND_SUN" | "WIND_CONFOUND_PAVEMENT" | "FINE";
export type Tool = "shade" | "water_pavement";

export interface RoleReading {
  sun: "strong" | "weak";
  wind: "strong" | "weak";
  pavement: "asphalt" | "retentive";
}

// 日射/風/舗装 readings per role. Each archetype's WIND-CONFOUND role mimics that archetype's
// target symptom on the target's own axis but differs on 風 (its dominant, city/district-scale-only
// cause -- 環境省データシート表3.2). sessionWin's binary match is a resource-allocation/mission
// rule (did this session's one countermeasure go where the dominant cause is), not a claim the
// countermeasure has zero physical effect at a confound location (design review r2/r3 fix).
export const ROLES: Record<RoleId, RoleReading> = {
  SUN_TARGET: { sun: "strong", wind: "strong", pavement: "retentive" },
  PAVEMENT_TARGET: { sun: "weak", wind: "strong", pavement: "asphalt" },
  WIND_CONFOUND_SUN: { sun: "strong", wind: "weak", pavement: "retentive" },
  WIND_CONFOUND_PAVEMENT: { sun: "weak", wind: "weak", pavement: "asphalt" },
  FINE: { sun: "weak", wind: "strong", pavement: "retentive" },
};
export const TOOLS: Tool[] = ["shade", "water_pavement"];

// Neutral, cause-shape-free display data (no location name hints at its role; no tool icon hints
// at a location shape).
export const LOCATION_NAMES = ["駅前の広場", "住宅地のせまい道", "公園そばの道"];
export const AXIS_TEXT: Record<Axis, Record<string, string>> = {
  sun: { strong: "日射が強い（さえぎるものがない）", weak: "日射は弱い（日かげが多い）" },
  wind: { strong: "風がよく通る", weak: "風があまり通らない（まわりに高い建物が多い）" },
  pavement: { asphalt: "地面はアスファルト（蓄熱しやすい）", retentive: "地面は保水性の舗装（蓄熱しにくい）" },
};
export const TOOL_LABELS: Record<Tool, string> = {
  shade: "🌳街路樹・日除け",
  water_pavement: "💧保水性・遮熱性舗装",
};

interface Archetype {
  id: string;
  roles: RoleId[];
  correctRole: RoleId;
  correctTool: Tool;
}

// Exactly one scenario type per session (50/50): the fixable role present is EITHER SUN OR
// PAVEMENT, never both -- prevents a single-axis "always check 日射, apply shade" strategy from
// winning every session just because a fixable-by-shade location is always present. WIND-CONFOUND
// (mimics the target's symptom, differs only on 風) and FINE (nothing wrong) are always-present
// distractors.
const ARCHETYPES: Archetype[] = [
  { id: "fix-sun", roles: ["SUN_TARGET", "WIND_CONFOUND_SUN", "FINE"], correctRole: "SUN_TARGET", correctTool: "shade" },
  { id: "fix-pavement", roles: ["PAVEMENT_TARGET", "WIND_CONFOUND_PAVEMENT", "FINE"], correctRole: "PAVEMENT_TARGET", correctTool: "water_pavement" },
];

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface LocationSlot {
  roleId: RoleId;
  name: string;
  reading: RoleReading;
}

export interface Session {
  archetype: string;
  correctRole: RoleId;
  correctTool: Tool;
  slots: LocationSlot[];
}

export function newSession(rand: () => number = Math.random): Session {
  const arc = pick(ARCHETYPES, rand);
  const slotRoles = shuffle(arc.roles, rand);
  const slotNames = shuffle(LOCATION_NAMES, rand);
  return {
    archetype: arc.id,
    correctRole: arc.correctRole,
    correctTool: arc.correctTool,
    slots: slotRoles.map((roleId, i) => ({ roleId, name: slotNames[i], reading: ROLES[roleId] })),
  };
}

export function sessionWin(session: Session, slotIndex: number, tool: Tool): boolean {
  return session.slots[slotIndex]?.roleId === session.correctRole && tool === session.correctTool;
}

// per-session shuffle helper for any other id lists a component needs (mirrors farmLogic.ts's
// shuffledIds / logisticsLogic.ts shuffledIds -- shuffle once per mount, id-based scoring only).
export function shuffledIds(ids: string[], rand: () => number = Math.random): string[] {
  return shuffle(ids, rand);
}
