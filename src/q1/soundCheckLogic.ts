// Pure rules for the event sound-engineer Q1 (gameType: sound_check).
// No React here, same pattern as sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/Logic
// audit pass): this file replaces the simplified sound-falloff model that
// used to live only inline inside SoundCheckGame.tsx, so factory/harness/
// gameplay-qa-sound-check.mjs can drive it directly with Node. Refactor
// only -- the model itself (distance falloff, wide-angle trade-off, extra
// speaker lifting back/middle only) is unchanged.
//
// ※本物の音響はもっと複雑。ここでは「席によって聞こえ方がちがう」
//   「大きくすればいいわけではない」という感覚に絞った簡易モデル。
export type SeatId = "front" | "middle" | "back";
export type Angle = "down" | "wide";

export const SEATS: { id: SeatId; label: string }[] = [
  { id: "front", label: "前の席" },
  { id: "middle", label: "まん中" },
  { id: "back", label: "うしろ" },
];

// 0=聞こえない 1=小さい 2=ちょうどいい 3=うるさい
export const LABEL = ["聞こえない", "小さい", "ちょうどいい", "うるさい！"];

/** simple model: sound falls off with distance; wide angle trades front
 * level for reach; the extra speaker lifts the back (and a little of the
 * middle) only. Returns an index into LABEL (0-3). */
export function level(seat: SeatId, volume: number, angle: Angle, extra: boolean): number {
  const base = volume;
  let v = seat === "front" ? base : seat === "middle" ? base - 1.5 : base - 3;
  if (angle === "wide") v += seat === "front" ? -1 : 0.5;
  if (extra && seat === "back") v += 2;
  if (extra && seat === "middle") v += 0.5;
  if (v >= 5.5) return 3; // too loud
  if (v >= 3) return 2;
  if (v >= 1.5) return 1;
  return 0;
}

export interface SeatState {
  id: SeatId;
  label: string;
  v: number;
}

export function evaluate(volume: number, angle: Angle, extra: boolean): { states: SeatState[]; allGood: boolean } {
  const states = SEATS.map((s) => ({ ...s, v: level(s.id, volume, angle, extra) }));
  return { states, allGood: states.every((s) => s.v === 2) };
}
