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
  /** Compact one-line label for the balloon on the town map. */
  shortLabel?: string;
  areaName: string; // 給食のうらがわ
  areaLead: string; // prompt shown above the incident list
  incidents: Incident[];
  /**
   * 出来事を時間の流れで大きく分ける（医療編：前半＝診断まで／後半＝生活へ戻るまで）。
   * 章がある場合、次の章は前の章をやり終えるまで開かない（＝患者さんの時間軸を守る）。
   * 一度やり終えれば、どの章にも自由に戻れる。
   */
  chapters?: EventChapter[];
  /** Center image of the exploration scene (default: the school). */
  sceneImage?: string;
  /**
   * If set, the area is drawn as ONE wide illustration with hotspots
   * placed on it (instead of icons floating on a coloured backdrop).
   */
  sceneMap?: { image: string; opening?: { image: string; lines: string[]; cta?: string } };
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
  /**
   * Shown once every incident of this event has been experienced.
   * beforeAfter は「はじまり → いま」を2枚の絵で見せたいとき用
   * （医療編：救急外来に来たとき → 自分の家で過ごしている）。
   */
  wrapUp?: {
    image?: string;
    beforeAfter?: { before: string; after: string; beforeLabel: string; afterLabel: string };
    title: string;
    lines: string[];
  };
}

/** One time-block of an event (前半／後半). */
export interface EventChapter {
  id: string;
  /** タブに出す短い名前（前半／後半） */
  tab: string;
  title: string;
  lead: string;
  /** この章のマップ画像 */
  image: string;
  incidentIds: string[];
  /** 章を終えたときの区切り */
  clear?: { title: string; lines: string[]; cta?: string };
  /** まだ開いていないときに出す一言 */
  lockedHint?: string;
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
  /**
   * これができるようになる前に終えておく体験（医療編の時間軸用）。
   * 満たしていないあいだは鍵つきで表示される。
   */
  requires?: string[];
  /** 鍵つきのときに出す一言 */
  requiresHint?: string;
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
  place: {
    name: string;
    image?: string;
    /** How the scene image is framed on the intro/game header. */
    fit?: "cover" | "contain";
    /** CSS object-position for the scene image (e.g. "center top"). */
    focus?: string;
  };
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
 * "どうやってなるの？" — a career path, shown in Job Reveal right after
 * "どんな仕事？" (§3 of the 2026-09-04 Career Path directive). Fact-checked
 * against Japanese public/authoritative sources per profession (see
 * factory/state/career-path/ for the research + fact_sources). NEVER a
 * single forced route: professions with genuinely multiple entry points list
 * multiple `routes`. `canStartLater=true` professions must never be framed
 * as "decide now or it's too late" — see language rules in
 * factory/state/career-path/career-path-copy-guide.md.
 */
export interface CareerPathStep {
  /** the stage name itself, e.g. "高校" / "医師国家試験" — ruby-marked where a technical term first appears */
  stage: string;
  requirementType: "education" | "license" | "training" | "experience" | "exam";
  /** is this step legally/structurally required for this route, or a common-but-optional path? */
  required: boolean;
  /** short child-facing explanation of this stage (target: grades 5-9, ruby-marked where needed) */
  description: string;
}
export interface CareerPathRoute {
  routeName: string;
  /** e.g. "国家資格必須ルート" / "実務経験ルート" / "未経験からのOJTルート" */
  routeType: string;
  steps: CareerPathStep[];
}
export interface CareerPath {
  /** true only if a specific named qualification is legally/structurally required to do this job */
  qualificationRequired: boolean;
  qualificationName: string | null;
  /** one short child-facing overview line */
  pathSummary: string;
  routes: CareerPathRoute[];
  /** other routes worth mentioning without a full step breakdown, or null */
  alternatives: string | null;
  /** can an adult realistically start pursuing this later (career change), not just from childhood? */
  canStartLater: boolean;
  /** honest caveats — e.g. "this is an office-level requirement, not required of every individual" */
  importantNotes: string | null;
  factSources: string[];
  lastVerified: string;
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
   * "どうやってなるの？" section of Job Reveal. Optional so existing
   * professions render unchanged until their career path is added; looked
   * up from src/data/careerPaths.ts by profession id (kept out of each
   * content module to avoid bloating 14 files with a large nested object
   * per profession — see that file's header comment).
   */
  careerPath?: CareerPath;
  /**
   * Q3 = "meet a person doing this job" (interviews, life stories).
   * NOT implemented — Real Professional Profile stays DESIGN_RESERVED
   * (2026-09-04 directive §20: no fabricated individual professional data).
   * Reserved so content can be attached to a profession later without
   * changing the model.
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
