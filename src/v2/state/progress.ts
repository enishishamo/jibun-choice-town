// Ver.2 progress persistence — completely separate from Ver.1.
// Ver.1 uses localStorage["jibun-choice-progress-v1"] (src/state/GameState.tsx)
// and this module must never read or write that key. The Ver.2 key uses a
// colon namespace so no prefix-based migration of Ver.1 can ever pick it up.
// (T-03 in docs/jibun-choice-v2/OPEN_DECISIONS.md — adopted 2026-09-20.)
import { SPOT_IDS, type SpotId } from "../lunch/types";

export const V2_STORAGE_KEY = "jibun-choice:v2:progress";

export interface V2Progress {
  version: 1;
  /** spots (per world) the child has cleared, in order */
  solved: { world: "lunch"; spot: SpotId; at: string }[];
  /** 好きの種: the one 行為 the child picked after a PLAY, keyed by world:spot */
  seeds: Record<string, string>;
}

const EMPTY: V2Progress = { version: 1, solved: [], seeds: {} };

const isSpot = (x: unknown): x is SpotId => typeof x === "string" && (SPOT_IDS as string[]).includes(x);
const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/** Strict normalisation: every nested field is rebuilt from validated pieces,
 * so a malformed or hand-edited store can never crash markSolved/recordSeed. */
export function normalizeProgress(raw: unknown): V2Progress {
  if (!isRecord(raw) || raw.version !== 1) return { ...EMPTY };
  const solved = Array.isArray(raw.solved)
    ? raw.solved.flatMap((e) =>
        isRecord(e) && e.world === "lunch" && isSpot(e.spot)
          ? [{ world: "lunch" as const, spot: e.spot, at: typeof e.at === "string" ? e.at : "" }]
          : [],
      )
    : [];
  const seeds: Record<string, string> = {};
  if (isRecord(raw.seeds)) for (const [k, v] of Object.entries(raw.seeds)) if (typeof v === "string") seeds[k] = v;
  // Anything else a previous build wrote (e.g. the old per-play `scores`) is
  // dropped on purpose: the game keeps no score, so none is persisted.
  return { version: 1, solved, seeds };
}

export function loadProgress(): V2Progress {
  try {
    const raw = localStorage.getItem(V2_STORAGE_KEY);
    if (raw) return normalizeProgress(JSON.parse(raw));
  } catch {
    /* private mode / corrupted -> fresh */
  }
  return { ...EMPTY };
}

export function saveProgress(p: V2Progress): void {
  try {
    localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: the session still works in memory */
  }
}

export function isSolved(p: V2Progress, spot: SpotId): boolean {
  return p.solved.some((s) => s.world === "lunch" && s.spot === spot);
}

export function markSolved(p: V2Progress, spot: SpotId): V2Progress {
  return {
    ...p,
    solved: isSolved(p, spot) ? p.solved : [...p.solved, { world: "lunch", spot, at: new Date().toISOString() }],
  };
}

export function recordSeed(p: V2Progress, spot: SpotId, seedId: string): V2Progress {
  return { ...p, seeds: { ...p.seeds, [`lunch:${spot}`]: seedId } };
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(V2_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
