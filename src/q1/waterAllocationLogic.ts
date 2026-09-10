// Pure rules for the water-allocation Q1 (gameType: allocate_and_forecast), redesigned per
// factory/projects/legacy-allocate-and-forecast (GAME_TRANSLATION_REBUILD, t5-brief-and-allocate-
// corrected, design review r4 PASS 76). Same pattern as heatDiagnosisLogic.ts: no React here.
//
// The old implementation (superseded, see factory/state/legacy/reverse-audits/
// allocate_and_forecast.json) let the 3 sectors be cut by equal-percentage sliders with no
// sector-specific consequence check (C_required=false, exploit=select-all). This module mirrors
// factory/projects/legacy-allocate-and-forecast/design/design-sim.mjs (v4) exactly --
// SECTORS/DEPTH_TABLE/NON_TARGET_PATTERNS/newSession/sessionWin are byte-identical in structure.
// Keep the two in sync.
export type Sector = "household" | "agriculture" | "industrial";
export type Depth = "light" | "medium" | "heavy";
export type Reservoir = "HIGH" | "LOW";
export type Rain = "SOON" | "FAR";

export interface SectorReading {
  urgency: "yes" | "no"; // "yes" = has a timing reason this sector must NOT be cut right now
  capacity: "yes" | "no"; // "yes" = has real slack that makes cutting this sector tolerable
}

export const SECTORS: Sector[] = ["household", "agriculture", "industrial"];
export const DEPTHS: Depth[] = ["light", "medium", "heavy"];

// Decision-2 lookup: reservoir level x rain-forecast timing -> restriction depth (research.md's
// real 70%/50%/30% staged threshold ladder, collapsed to a HIGH/LOW binary for 10-12 year olds).
export const DEPTH_TABLE: Record<string, Depth> = {
  "HIGH,SOON": "light",
  "HIGH,FAR": "medium",
  "LOW,SOON": "medium",
  "LOW,FAR": "heavy",
};

// A non-target sector is drawn from 2 patterns (50/50) -- deliberately excluding (urgency=no,
// capacity=yes), which would tie the target's own signature and make the session ambiguous. This
// symmetric 50/50 split (design review r2's fix for a threshold set to just clear a measured
// result) pushes the single-axis-only mathematical floor down to ~58.3%, verified in
// design-sim.mjs.
const NON_TARGET_PATTERNS: SectorReading[] = [
  { urgency: "no", capacity: "no" },
  { urgency: "yes", capacity: "yes" },
];
function pickNonTargetPattern(rand: () => number): SectorReading {
  return NON_TARGET_PATTERNS[rand() < 0.5 ? 0 : 1];
}

export interface Session {
  archetypeSector: Sector;
  correctSector: Sector;
  correctDepth: Depth;
  reservoir: Reservoir;
  rain: Rain;
  sectors: Record<Sector, SectorReading>;
}

export function newSession(rand: () => number = Math.random): Session {
  const archetypeSector = SECTORS[Math.floor(rand() * SECTORS.length)];

  const sectors = {} as Record<Sector, SectorReading>;
  for (const sector of SECTORS) {
    sectors[sector] =
      sector === archetypeSector ? { urgency: "no", capacity: "yes" } : pickNonTargetPattern(rand);
  }

  const reservoir: Reservoir = rand() < 0.5 ? "HIGH" : "LOW";
  const rain: Rain = rand() < 0.5 ? "SOON" : "FAR";
  const correctDepth = DEPTH_TABLE[`${reservoir},${rain}`];

  return { archetypeSector, correctSector: archetypeSector, correctDepth, reservoir, rain, sectors };
}

export function sessionWin(session: Session, sectorChoice: Sector, depthChoice: Depth): boolean {
  return sectorChoice === session.correctSector && depthChoice === session.correctDepth;
}

// Display data. Sector identity is fixed (not shuffled -- real named sectors, not anonymous
// locations), but card/button DISPLAY ORDER is shuffled once per mount via shuffledIds below.
export const SECTOR_LABELS: Record<Sector, { name: string; icon: string }> = {
  household: { name: "家庭", icon: "🏠" },
  agriculture: { name: "農業", icon: "🌾" },
  industrial: { name: "工業", icon: "🏭" },
};
export const DEPTH_LABELS: Record<Depth, string> = {
  light: "軽い制限",
  medium: "中程度の制限",
  heavy: "重い制限",
};
export const URGENCY_TEXT: Record<Sector, Record<"yes" | "no", string>> = {
  household: {
    yes: "今週は生活への影響が特に心配な理由がある",
    no: "今週は生活への影響が特に心配な理由はない",
  },
  agriculture: {
    yes: "田植え前の代かき期で、水が特に必要な時期",
    no: "代かき期は過ぎていて、普通期",
  },
  industrial: {
    yes: "工場の生産が忙しいピーク期",
    no: "工場の生産は閑散期",
  },
};
export const CAPACITY_TEXT: Record<Sector, Record<"yes" | "no", string>> = {
  household: {
    yes: "庭の水やりや洗車など、不要不急の使い方を後回しにできる",
    no: "不要不急の使い方を後回しにできる余地はあまりない",
  },
  agriculture: {
    yes: "番水や反復利用の余地がある",
    no: "番水や反復利用の余地はあまりない",
  },
  industrial: {
    yes: "近隣地域からの応援給水協定がある",
    no: "応援給水協定はない",
  },
};
export const RESERVOIR_TEXT: Record<Reservoir, string> = {
  HIGH: "貯水率は高め",
  LOW: "貯水率は低め",
};
export const RAIN_TEXT: Record<Rain, string> = {
  SOON: "まとまった雨がもうすぐ来そうな予報",
  FAR: "まとまった雨はまだ先という予報",
};

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// per-session shuffle helper for display order (mirrors heatDiagnosisLogic.ts's shuffledIds --
// shuffle once per mount, id-based scoring only, never position-based).
export function shuffledIds<T>(ids: T[], rand: () => number = Math.random): T[] {
  return shuffle(ids, rand);
}
