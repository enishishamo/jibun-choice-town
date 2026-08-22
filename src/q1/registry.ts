// Game registry: maps a Q1Experience.gameType to its interactive component.
// gameType names describe the MECHANIC so future professions can reuse them
// (e.g. a pharmacist Q1 could reuse "inspect_and_measure").
// A new kind of Q1 = add a component here; the shared shell stays unchanged.
import type { ComponentType } from "react";
import type { Q1GameProps } from "./gameTypes";
import CookGame from "./CookGame";
import MenuGame from "./MenuGame";
import FarmGame from "./FarmGame";
import LogisticsGame from "./LogisticsGame";
import RecycleGame from "./RecycleGame";

export const gameRegistry: Record<string, ComponentType<Q1GameProps>> = {
  drag_and_drop: MenuGame, // 制約を見ながら入れかえる
  inspect_and_measure: CookGame, // 測る→基準→対応→再確認→記録
  sow_and_grow: FarmGame, // 試す→時間経過→結果→やり直す
  load_and_route: LogisticsGame, // 積み分け＋順路計画→検収
  sort_out: RecycleGame, // 道具の性質で仕分ける
};
