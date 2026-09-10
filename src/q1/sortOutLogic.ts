// Pure rules for the food-waste sorting factory worker Q1 (gameType: sort_out), rebuilt per
// factory/projects/legacy-sort-out (GAME_TRANSLATION_REBUILD, t1-observe-and-apply-once, design
// review r2 PASS 84). Mirrors factory/projects/legacy-sort-out/design/design-sim.mjs exactly --
// PROPERTIES/TOOLS/CORRECT_TOOL/newSession/sessionWin are structurally identical. Keep the two in
// sync.
//
// The only real judgment this game asks for: of 3 items on the sorting line, each independently and
// randomly has one of 3 real, physically-grounded properties (research.md §2) -- attracted to a
// magnet, light enough to blow away in a breeze, or neither (too small/dense for either machine,
// caught only by a final human check). The child reads each item's actual observed behavior (all 3
// item cards share the same neutral appearance -- the observation IS the property, never a fixed
// named object independently receiving an incompatible one, per design review r1's
// CORE_CAUSAL_MODEL_DISTORTED fix) and picks the tool whose physical principle matches. Selecting a
// tool never claims the unmatched tools have zero real-world effect, and a match never claims the
// facility's contamination is now fully/completely resolved -- only that this item, in this attempt,
// was or wasn't sorted correctly (design review r1's MISMATCH_PARTIAL_EFFECT_OVERCLAIM /
// EXCLUSIVITY_OVERCLAIM fix).

export type PropertyId = "magnetic_metal" | "light_film" | "dense_small_nonmagnetic";
export const PROPERTIES: PropertyId[] = ["magnetic_metal", "light_film", "dense_small_nonmagnetic"];

export type ToolId = "magnet" | "wind" | "hand";
export const TOOLS: ToolId[] = ["magnet", "wind", "hand"];

export const CORRECT_TOOL: Record<PropertyId, ToolId> = {
  magnetic_metal: "magnet",
  light_film: "wind",
  dense_small_nonmagnetic: "hand",
};

export type ItemId = "item_a" | "item_b" | "item_c";
export const ITEMS: ItemId[] = ["item_a", "item_b", "item_c"];

export interface Session {
  assignment: Record<ItemId, PropertyId>;
}

export function newSession(rand: () => number = Math.random): Session {
  const assignment = {} as Record<ItemId, PropertyId>;
  for (const item of ITEMS) assignment[item] = PROPERTIES[Math.floor(rand() * PROPERTIES.length)];
  return { assignment };
}

export function sessionWin(session: Session, picks: Partial<Record<ItemId, ToolId>>): boolean {
  return ITEMS.every((item) => picks[item] === CORRECT_TOOL[session.assignment[item]]);
}

// Display data. Observation text deliberately avoids the tool's own kanji (design review r1 MEDIUM
// LABEL_LEAK_TRIVIAL_MATCH fix) -- it describes the observed behavior, not the mechanism's name.
export const PROPERTY_OBSERVATION: Record<PropertyId, string> = {
  magnetic_metal: "近づけると、カチッと引き寄せられた。",
  light_film: "持ち上げると、ふわっと軽く舞い上がりそうだった。",
  dense_small_nonmagnetic: "近づけても引き寄せられず、持ち上げてもふわっとしない。小さくて、ずしっと重い。",
};

export const TOOL_LABELS: Record<ToolId, { name: string; icon: string; desc: string }> = {
  magnet: { name: "磁選機", icon: "🧲", desc: "磁力で引き寄せて取りのぞく" },
  wind: { name: "風力選別", icon: "💨", desc: "風の力で軽い物を飛ばして分ける" },
  hand: { name: "手選別", icon: "🫲", desc: "人の目で見て取りのぞく" },
};
