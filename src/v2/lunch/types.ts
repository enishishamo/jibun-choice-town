// Shared contract for the 給食 WORLD vertical slice (MAP → こんだて PLAY → CLEAR →
// JOB REVEAL → 好きの種 → MAP). Pure types, no React. Both the world map and
// the play screen import from here so the two lanes stay aligned.

/** The 5 spots inside the opened bento box (WORLD_DESIGN.md §3). */
export type SpotId = "grow" | "carry" | "cook" | "menu" | "serve";
export const SPOT_IDS: SpotId[] = ["grow", "carry", "cook", "menu", "serve"];

/** WORLD_DESIGN.md §4: unplayed = muted, solved = lit; "trouble" = the visible
 * 異変 that invites a tap (Reference E). Only "menu" is playable in this slice. */
export type SpotState = "muted" | "trouble" | "solved";

/** Roads light up when BOTH ends are solved (WORLD_DESIGN.md §4). The slice
 * animates only the menu→serve segment "一部分進む" after the menu PLAY. */
export type RoadId = "grow-carry" | "carry-cook" | "cook-serve" | "menu-cook" | "menu-serve";
export const ROAD_IDS: RoadId[] = ["grow-carry", "carry-cook", "cook-serve", "menu-cook", "menu-serve"];
export type RoadState = "off" | "partial" | "on";

export interface LunchWorldView {
  spots: Record<SpotId, SpotState>;
  roads: Record<RoadId, RoadState>;
  /** which spot should play its "異変が起きた" entrance animation on mount */
  newTrouble: SpotId | null;
}

/** Screens of this slice. Kept local so the TOP/overall-map task can mount
 * <LunchWorldApp/> as one unit without sharing a router. */
export type LunchScreen =
  | { name: "world" }
  | { name: "play"; spot: "menu" }
  | { name: "reveal" }
  | { name: "know" }
  | { name: "career" }
  | { name: "seed" };
