// Shared 班 (group) list for 修学旅行編 — 安全計画・バス運行・宿の受け入れの
// 3ゲームが同じ5つの班を扱うことで、「さっきの班だ」というつながりを作る。
export interface Band { id: string; name: string; icon: string; note?: string }

export const BANDS: Band[] = [
  { id: "yuki", name: "雪組", icon: "❄️" },
  { id: "hana", name: "花組", icon: "🌸", note: "食物アレルギーのある子がいる" },
  { id: "kaze", name: "風組", icon: "🍃" },
  { id: "tsuki", name: "月組", icon: "🌙", note: "乗り物酔いしやすい子がいる" },
  { id: "sora", name: "空組", icon: "☁️" },
];
