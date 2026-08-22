// Core content model for JIBUN CHOICE.
// The whole app is data-driven: adding a new theme (hospital, weather, ...)
// means adding a content module (see data/content/) — not new screens.

/** A spot in the virtual town (school, hospital, station, ...). */
export interface Place {
  id: string;
  name: string;
  /** Event currently happening here (entry point for the child). */
  eventId?: string;
  /** Position of the tap target on the town illustration (percent). */
  mapPos?: { left: string; top: string };
}

/**
 * Something happening in society ("school lunch will be late!").
 * One event connects to MANY professions through its incidents.
 */
export interface AreaEvent {
  id: string;
  placeId: string;
  title: string; // 大変！今日の給食が間に合わない！
  areaName: string; // 給食のうらがわ
  areaLead: string; // prompt shown above the incident list
  incidents: Incident[];
  /** Center image of the exploration scene (default: the school). */
  sceneImage?: string;
  /** Visual mood of the scene ("heat" = orange sky etc.). */
  mood?: string;
  /**
   * Shown in the area once 2+ incidents are experienced:
   * "同じ出来事を、違う仕事はまったく違う情報で見ていた".
   */
  lensSummary?: {
    intro: string;
    rows: { icon: string; label: string; view: string }[];
  };
}

/**
 * A concrete "thing going on" the child can poke at.
 * Shown WITHOUT profession names — curiosity first, job reveal later.
 */
export interface Incident {
  id: string;
  image?: string;
  emoji?: string;
  title: string; // にんじんが足りない！
  experienceId: string;
  /** Position of this hotspot inside the area exploration scene (percent). */
  scenePos?: { left: string; top: string };
  /**
   * "icon" (default) = cut-out object shown whole;
   * "scene" = a place photo, cropped to fill the round hotspot.
   */
  imageFit?: "icon" | "scene";
}

/** A tool / expertise item used inside a Q1 experience (the C layer). */
export interface ToolInfo {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  desc: string;
}

/**
 * Q1 = "try a slice of the job".
 * Internally follows the A-E skeleton (place / trouble / tools /
 * thinking / resolution) but those letters are never shown to kids.
 * gameType selects the interactive part from the game registry, so each
 * profession can play completely differently.
 */
export interface Q1Experience {
  id: string;
  professionId: string;
  eventId: string;
  gameType: string; // key into q1/registry
  /** A: where the child is taken. */
  place: { name: string; image?: string };
  /** B: the mission framing shown on the intro screen. */
  mission: { title: string; lines: string[]; deadline?: string };
  /** C: tools/expertise available during play. */
  tools: ToolInfo[];
  /** E: default resolution screen (games may add flourishes). */
  resolution: { clock?: string; title: string; lines: string[] };
  /**
   * One sentence connecting "what the child just did" to the real job,
   * shown on the discovery screen (きみがさっき〜したよね。〜).
   */
  discoveryEcho: string;
  /**
   * 「好きの種」: choices for the one-question "どこがちょっと気になった？"
   * asked after discovery. Derived from the actions in this Q1.
   * NOT used for any aptitude diagnosis — just gently recorded.
   */
  seeds: string[];
}

/** One openable card in the Q2 "know the job" view. */
export interface Q2Card {
  id: string;
  title: string; // どんな仕事？ / 1日をのぞく / ...
  icon?: string; // small emoji accent
  body: string[]; // paragraphs
  list?: string[]; // optional bullet list
  flow?: string[]; // optional step flow (rendered with arrows)
}

/**
 * A profession exists once, independent of events.
 * Multiple events / Q1 experiences can lead to the same profession.
 */
export interface Profession {
  id: string;
  name: string;
  catch: string; // 数百〜数千人分の料理を作るプロ！
  image: string;
  /** Line on the discovery ("NEW!") card. */
  discoveryLine: string;
  q2: Q2Card[];
  related: string[]; // names of similar professions
  /**
   * Q3 = "meet a person doing this job" (interviews, life stories).
   * Not implemented in this prototype; reserved so content can be
   * attached to a profession later without changing the model.
   */
  q3?: { available: boolean };
}

/** A content module = one theme (school lunch, hospital, weather...). */
export interface ContentModule {
  places: Place[];
  events: AreaEvent[];
  professions: Profession[];
  experiences: Q1Experience[];
}
