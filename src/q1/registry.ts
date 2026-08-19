// Game registry: maps a Q1Experience.gameType to its interactive component.
// A new kind of job experience (e.g. a doctor's 鑑別 game) is added here
// without touching the shared Q1 shell.
import type { ComponentType } from "react";
import type { Q1GameProps } from "./gameTypes";
import CookGame from "./CookGame";
import MenuGame from "./MenuGame";
import FarmGame from "./FarmGame";
import LogisticsGame from "./LogisticsGame";
import RecycleGame from "./RecycleGame";

export const gameRegistry: Record<string, ComponentType<Q1GameProps>> = {
  cook: CookGame,
  menu: MenuGame,
  farm: FarmGame,
  logistics: LogisticsGame,
  recycle: RecycleGame,
};
