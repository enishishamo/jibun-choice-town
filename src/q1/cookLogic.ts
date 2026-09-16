// Pure rules for the school-lunch cook's core-temperature check Q1
// (gameType: inspect_and_measure, CookGame.tsx).
// No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the earlier logic/UX
// audit pass): this file did not exist before -- CookGame.tsx redeclared
// SPOTS/TEMPS and the round-2 success check inline. No behavior bug was
// found in the audit; this is a refactor-only extraction so the hygiene
// rule (3 spots incl. the thickest, each >=75C, only after the round-2
// re-heat) can be asserted by factory/harness/gameplay-qa-cook.mjs.
export type SpotId = "thin" | "middle" | "thick";

export const SPOTS: { id: SpotId; label: string }[] = [
  { id: "thin", label: "うすい切り身" },
  { id: "middle", label: "ふつうの切り身" },
  { id: "thick", label: "いちばん厚い切り身" },
];

// round1: 厚いところがまだ低い / round2: 追加加熱後
export const TEMPS: Record<1 | 2, Record<SpotId, number>> = {
  1: { thin: 76, middle: 68, thick: 62 },
  2: { thin: 82, middle: 78, thick: 76 },
};

/** the hygiene-rule threshold: 中心75℃以上 */
export const MIN_CORE_TEMP = 75;

export type Measured = Record<SpotId, number | null>;

export function allSpotsMeasured(measured: Measured): boolean {
  return SPOTS.every((s) => measured[s.id] !== null);
}

export function anySpotMeasured(measured: Measured): boolean {
  return SPOTS.some((s) => measured[s.id] !== null);
}

/** the lowest of the 3 measured temps -- unmeasured spots don't count as 0,
 * they simply don't clear the "all measured" gate above yet. Returns
 * Infinity if nothing has been measured (never mistaken for a pass). */
export function minMeasuredTemp(measured: Measured): number {
  const vals = SPOTS.map((s) => measured[s.id]).filter((v): v is number => v !== null);
  return vals.length ? Math.min(...vals) : Infinity;
}

/** Success = round 2 (post re-heat), all 3 spots (incl. the thickest)
 * measured, and every one of them >= MIN_CORE_TEMP. Matches the hygiene
 * card verbatim: "厚い切り身などをふくめて3か所以上はかる" + "中心75℃以上". */
export function isRoundSuccess(round: 1 | 2, measured: Measured): boolean {
  return round === 2 && allSpotsMeasured(measured) && minMeasuredTemp(measured) >= MIN_CORE_TEMP;
}

export function emptyMeasured(): Measured {
  return { thin: null, middle: null, thick: null };
}
