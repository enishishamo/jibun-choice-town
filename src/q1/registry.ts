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
import SourcingGame from "./SourcingGame";
import RecipeGame from "./RecipeGame";
import PackageGame from "./PackageGame";
import FactoryLineGame from "./FactoryLineGame";
import PlanEventGame from "./PlanEventGame";
import PromoGame from "./PromoGame";
import TimetableGame from "./TimetableGame";
import VenueLayoutGame from "./VenueLayoutGame";
import SoundCheckGame from "./SoundCheckGame";
import CrowdFlowGame from "./CrowdFlowGame";
import ClueBoardGame from "./ClueBoardGame";
import LabCheckGame from "./LabCheckGame";
import XrayGame from "./XrayGame";
import DiagnoseGame from "./DiagnoseGame";
import RxCheckGame from "./RxCheckGame";
import NurseObserveGame from "./NurseObserveGame";
import MealFitGame from "./MealFitGame";
import MoveTryGame from "./MoveTryGame";
import LifePlanGame from "./LifePlanGame";

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
  // 物価高編
  sourcing_mix: SourcingGame, // 条件を見比べて仕入れを組み立てる
  recipe_balance: RecipeGame, // 配合を動かしてトレードオフを見る
  package_design: PackageGame, // 素材×形×サイズを組み立ててテスト
  line_debug: FactoryLineGame, // データで原因を探し、調整して再実行
  // イベント編
  plan_mix: PlanEventGame, // 条件の中で企画を組み合わせる
  reach_mix: PromoGame, // 届けたい相手ごとの到達を組み立てる
  timetable: TimetableGame, // 演目＋転換を並べて終演に合わせる
  venue_layout: VenueLayoutGame, // 会場に配置して見やすさ・通りやすさを試す
  sound_check: SoundCheckGame, // 機材を操作して席ごとの聞こえ方を合わせる
  crowd_flow: CrowdFlowGame, // 詰まりを読んで道具で流れを分ける
  // 医療編（1人の患者を9章で追う）
  clue_board: ClueBoardGame, // 調べ方を選んで手がかりを集める
  lab_check: LabCheckGame, // 検体を確かめ、疑わしい値を測り直す
  xray_shoot: XrayGame, // 条件を決めて撮る→写りを見て撮り直す
  clue_join: DiagnoseGame, // 集まった手がかりをつないで見立てる
  rx_check: RxCheckGame, // 薬×患者情報を照らして安全を確かめる
  observe_care: NurseObserveGame, // 気づく→観察→見立て→ケア
  meal_fit: MealFitGame, // 必要な栄養と食べられる形を近づける
  move_try: MoveTryGame, // 動作を試す→工夫→再評価
  life_plan: LifePlanGame, // 本人の希望から支援を組み立てる
};
