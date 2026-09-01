// Pure rules for the radiographer Q1 (gameType: xray_shoot).
// No React here: the same functions drive the component AND the automated
// gameplay QA (factory/harness/gameplay-qa-xray.mjs runs this file directly).
//
// Player judgments this module encodes:
//   1. FRAMING  — pick frame position x size so the lungs fit for THIS patient
//                 (build and posture vary per case; no answer overlay exists)
//   2. TIMING   — shoot while the breath is held, else motion blur
//   3. QUALITY  — decide whether the resulting image is deliverable
//   4. BUDGET   — X-ray exposures are limited (ALARA): wide L frames cost 2

export type Build = "small" | "medium" | "large";
export type Side = "right" | "left";
export type CaseKind = Side | "none";
export type FramePos = "high" | "mid" | "low";
export type FrameSize = "S" | "M" | "L";

export interface PatientCase {
  build: Build; // visible body size -> which frame size fits
  lungPos: FramePos; // where the chest sits on the plate (posture/height)
  haze: CaseKind; // what the finished image will show
}

export const EXPOSURE_LIMIT = 5;
export const FRAME_POSITIONS: FramePos[] = ["high", "mid", "low"];
export const FRAME_SIZES: FrameSize[] = ["S", "M", "L"];
export const BUILDS: Build[] = ["small", "medium", "large"];

// ---- geometry (SVG viewBox 240x250 of BodyInsideView) ---------------------
const BODY_CX = 120;
const BODY_CY = 143;
const BASE_LUNGS = { x: 72, y: 96, w: 96, h: 94 };
export const BUILD_SCALE: Record<Build, number> = { small: 0.85, medium: 1, large: 1.12 };
export const LUNG_POS_DY: Record<FramePos, number> = { high: -16, mid: 0, low: 16 };

// Frame sizes tuned so S fits only small builds, M up to medium, L everything.
const FRAME_DIMS: Record<FrameSize, { w: number; h: number }> = {
  S: { w: 88, h: 86 },
  M: { w: 100, h: 98 },
  L: { w: 170, h: 150 },
};
const FRAME_CY: Record<FramePos, number> = { high: 120, mid: 144, low: 168 };
export const FRAME_COST: Record<FrameSize, number> = { S: 1, M: 1, L: 2 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function lungsRect(c: PatientCase): Rect {
  const s = BUILD_SCALE[c.build];
  const dy = LUNG_POS_DY[c.lungPos];
  const x = BODY_CX + (BASE_LUNGS.x - BODY_CX) * s;
  const y = BODY_CY + (BASE_LUNGS.y - BODY_CY) * s + dy;
  return { x, y, w: BASE_LUNGS.w * s, h: BASE_LUNGS.h * s };
}

export function frameRect(pos: FramePos, size: FrameSize): Rect {
  const { w, h } = FRAME_DIMS[size];
  return { x: BODY_CX - w / 2, y: FRAME_CY[pos] - h / 2, w, h };
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.w >= inner.x + inner.w &&
    outer.y + outer.h >= inner.y + inner.h
  );
}

export function frameCovers(c: PatientCase, pos: FramePos, size: FrameSize): boolean {
  return contains(frameRect(pos, size), lungsRect(c));
}

/** Smallest exposure cost that can produce a covered image for this case. */
export function minimalCost(c: PatientCase): number {
  let best = Infinity;
  for (const pos of FRAME_POSITIONS)
    for (const size of FRAME_SIZES)
      if (frameCovers(c, pos, size)) best = Math.min(best, FRAME_COST[size]);
  return best;
}

/** True when a covering frame exists that is cheaper than the chosen size. */
export function isOversized(c: PatientCase, pos: FramePos, size: FrameSize): boolean {
  return frameCovers(c, pos, size) && FRAME_COST[size] > minimalCost(c);
}

// ---- case generation -------------------------------------------------------
export function newCase(rand: () => number = Math.random): PatientCase {
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  return {
    build: pick(BUILDS),
    lungPos: pick(FRAME_POSITIONS),
    haze: pick(["right", "left", "none"] as CaseKind[]),
  };
}

// ---- shooting ---------------------------------------------------------------
export interface ShotResult {
  covered: boolean;
  blurred: boolean;
  oversized: boolean;
  cost: number;
  deliverable: boolean;
}

export function shoot(c: PatientCase, pos: FramePos, size: FrameSize, duringHold: boolean): ShotResult {
  const covered = frameCovers(c, pos, size);
  const blurred = !duringHold;
  return {
    covered,
    blurred,
    oversized: isOversized(c, pos, size),
    cost: FRAME_COST[size],
    deliverable: covered && !blurred,
  };
}

/** Budget gate: a shot may only happen if its cost still fits the limit. */
export function canAfford(used: number, size: FrameSize): boolean {
  return used + FRAME_COST[size] <= EXPOSURE_LIMIT;
}

/** Delivering: only a covered, sharp image passes the senior's desk. */
export function deliveryRejectionReason(r: ShotResult): "cutoff" | "blurred" | null {
  if (!r.covered) return "cutoff";
  if (r.blurred) return "blurred";
  return null;
}

/** The observation note is the technologist's bonus contribution, not a gate. */
export function noteIsCorrect(c: PatientCase, note: CaseKind): boolean {
  return note === c.haze;
}

/** Perfect play: minimal exposures for this case, no retakes, correct note. */
export function isPerfect(c: PatientCase, exposuresUsed: number, retakes: number, noteCorrect: boolean): boolean {
  return exposuresUsed === minimalCost(c) && retakes === 0 && noteCorrect;
}
