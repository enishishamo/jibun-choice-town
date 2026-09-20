// Ver.2 progress persistence — completely separate from Ver.1.
// Ver.1 uses localStorage["jibun-choice-progress-v1"] (src/state/GameState.tsx)
// and this module must never read or write that key. The Ver.2 key uses a
// colon namespace so no prefix-based migration of Ver.1 can ever pick it up.
// (T-03 in docs/jibun-choice-v2/OPEN_DECISIONS.md — adopted 2026-09-20 per
// Human instruction "命名承認待ちで停止しなくて構いません".)
import type { SpotId } from "../lunch/types";

export const V2_STORAGE_KEY = "jibun-choice:v2:progress";

export interface V2Progress {
  version: 1;
  /** spots (per world) the child has cleared, in order */
  solved: { world: "lunch"; spot: SpotId; at: string }[];
  /** 好きの種: the one "行為" the child picked after a PLAY, keyed by world:spot */
  seeds: Record<string, string>;
  /** committed scores per PLAY, most recent last (for AGAIN comparisons; never a label) */
  scores: Record<string, number[]>;
}

const EMPTY: V2Progress = { version: 1, solved: [], seeds: {}, scores: {} };

export function loadProgress(): V2Progress {
  try {
    const raw = localStorage.getItem(V2_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1 && Array.isArray(p.solved)) return { ...EMPTY, ...p };
    }
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

export function markSolved(p: V2Progress, spot: SpotId, score: number): V2Progress {
  const key = `lunch:${spot}`;
  return {
    ...p,
    solved: isSolved(p, spot) ? p.solved : [...p.solved, { world: "lunch", spot, at: new Date().toISOString() }],
    scores: { ...p.scores, [key]: [...(p.scores[key] ?? []), score] },
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
