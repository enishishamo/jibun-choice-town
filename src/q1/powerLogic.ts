// Pure rules for the power-supply/demand balancer Q1 (gameType:
// forecast_and_balance). No React here, same pattern as
// labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ48/CA57 — "全供給源を最初から稼働すれば予報も各電源の
// 制約も無視して確実に勝てる"): turning on every source immediately at
// 13:00 and never touching anything again used to guarantee success for
// the whole day, because thermal+buy alone already exceeded the old peak
// demand (5200) with room to spare -- the temperature forecast and demand
// graph cards (both already present, both already narratively pointing at
// 15:00 as the peak) were never actually load-bearing.
//
// This revision makes hydro genuinely scarce (a real, limited reservoir --
// matching its own flavor text "短い時間ならすぐ出せる") and raises the
// peak demand so that all three sources are required SIMULTANEOUSLY at the
// 15:00 peak, and ONLY at that peak. Hydro can be used for exactly 1 hour
// total across the whole day. Turning it on immediately at 13:00 spends
// that one hour on an hour that never needed it, leaving nothing for the
// actual peak -- the naive "turn everything on and forget" strategy now
// fails at 15:00. Reaching 15:00 with hydro still in reserve requires
// noticing (via the temp forecast, the demand graph, or simply the
// balance-bar's own "余裕が少ない" warning at 14:00) that the real trouble
// is still ahead, and holding hydro back until then.
export interface Hour {
  h: number;
  temp: number;
  demand: number; // 万kW
}

// 需要は気温とともに上がり、夕方に少し下がる（猛暑日の典型的な形）
export const HOURS: Hour[] = [
  { h: 13, temp: 37, demand: 4650 },
  { h: 14, temp: 38, demand: 4950 },
  { h: 15, temp: 39, demand: 5300 },
  { h: 16, temp: 38, demand: 5100 },
  { h: 17, temp: 36, demand: 4800 },
];

export const BASE_SUPPLY = 4700; // 万kW（今の供給力）

export type SourceId = "thermal" | "hydro" | "buy";
export interface Source {
  id: SourceId;
  name: string;
  emoji: string;
  add: number;
  note: string;
}
export const SOURCES: Source[] = [
  { id: "thermal", name: "火力発電を追加で動かす", emoji: "🏭", add: 300, note: "動かすまで少し時間がかかる" },
  { id: "hydro", name: "水力（貯水）を使う", emoji: "💧", add: 200, note: "一日に合計1時間ぶんしか出せない" },
  { id: "buy", name: "ほかの地域から電気を送ってもらう", emoji: "🔌", add: 250, note: "送れる量にかぎりがある" },
];

// hydro's total usable duration across the whole day, in hours (advance()
// calls while it's switched on). Not a per-activation cooldown -- once
// spent, it never comes back for the rest of the day.
export const HYDRO_BUDGET_HOURS = 1;

export function computeSupply(on: SourceId[]): number {
  return BASE_SUPPLY + SOURCES.filter((s) => on.includes(s.id)).reduce((a, s) => a + s.add, 0);
}

export function marginLevel(supply: number, demand: number): "green" | "yellow" | "red" {
  const margin = supply - demand;
  if (margin >= 400) return "green";
  if (margin >= 0) return "yellow";
  return "red";
}

// 2026-09-07 repair round 2 (independent review HIGH: after correctly
// surviving 15:00, hydro's spent 1-hour budget auto-turns it off, dropping
// "current" supply -- comparing that against the CURRENT hour's demand
// (already satisfied, since you're standing here) produced a false "🔴
// 足りない" on an hour you'd already secured). The live balance
// bar/badge/warning must always answer "will THIS plan survive the NEXT
// advance" -- the same question advance() itself checks -- never "did the
// hour I'm already standing in work out", which is stale history once a
// resource can be consumed on arrival. The final hour has no next step to
// preview, so it falls back to its own demand.
export function checkDemandFor(step: number): number {
  const next = HOURS[step + 1];
  return next ? next.demand : HOURS[step].demand;
}

/** Would advancing with this supply level cover the next hour's demand? */
export function canCover(supply: number, nextDemand: number): boolean {
  return supply >= nextDemand;
}
