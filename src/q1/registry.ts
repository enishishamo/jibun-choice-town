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
import ParkHeatGame from "./ParkHeatGame";
import PowerGame from "./PowerGame";
import SiteHeatGame from "./SiteHeatGame";
import WaterGame from "./WaterGame";
import UrbanHeatGame from "./UrbanHeatGame";

export const gameRegistry: Record<string, ComponentType<Q1GameProps>> = {
  // 給食編
  drag_and_drop: MenuGame, // 制約を見ながら入れかえる
  inspect_and_measure: CookGame, // 測る→基準→対応→再確認→記録
  sow_and_grow: FarmGame, // 試す→時間経過→結果→やり直す
  load_and_route: LogisticsGame, // 積み分け＋順路計画→検収
  sort_out: RecycleGame, // 道具の性質で仕分ける
  // 猛暑編
  place_and_test: ParkHeatGame, // 配置→シミュレーション→再配置
  forecast_and_balance: PowerGame, // 予測を見て供給を合わせ、時間を進める
  schedule_and_protect: SiteHeatGame, // 安全と進捗の両立を工程で調整
  allocate_and_forecast: WaterGame, // 限られた資源の配分＋先の予測
  layer_and_compare: UrbanHeatGame, // データを重ねて原因を探し、試す
};
