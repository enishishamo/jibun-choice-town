// Q1: 給食食材の配送員 (gameType: load_and_route)
// B: 今日届く4つの食材（毎セッションランダム抽選）を、正しい荷室へ積み分ける。
//    2つの学校（毎セッション移動時間・受け入れ時刻がランダム）を、両校とも
//    間に合う順で訪問する。
// C: 食材ごとの保存温度基準の読み物（validZonesモデル: 魚介類・食肉・乳製品・
//    冷凍食品は「◯℃以下」という上限条件、野菜・穀類は専用の常温区分）。
//    学校ごとの移動時間・受け入れ時刻、学校間の移動時間。
// D: 各食材を、その保存条件を満たす荷室へ積み分ける判断と、両校の移動時間・
//    受け入れ時刻を照らし合わせて間に合う訪問順を選ぶ判断（詳細は
//    logisticsLogic.ts）。積み分け・訪問順を決めたら「出発する」を1回だけ
//    押して結果を確定する（同一セッション内のやり直しはない）。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-load-and-route rebuild,
// t1-zone-and-route): 旧実装は4つの食材の正解荷室と2校の訪問順が常に固定
// （魚・肉はどちらも「冷蔵」の1ゾーン、ひまわり小→みなみ小の順が常に正解）
// で、内容を読まずに覚えるだけの記憶ゲームだった上、検収失敗時に個別の
// 食材ごとの理由を示して総当たり再挑戦を許していた（reverse audit:
// exploit=memorize, brute_force=true）。新実装では食材の組み合わせ・学校の
// 移動時間/締切を毎セッションランダム化し、フラットな失敗結果のみを返す
// 1回のコミット判断にした（design-sim.mjs参照、design review r4 PASS 88）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  FOOD_NAMES,
  FOOD_STORAGE_TEXT,
  ZONE_LABELS,
  ZONES,
  newSession,
  sessionWin,
  shuffledIds,
  type ZoneId,
} from "./logisticsLogic";

type Slot = "A" | "B";

export default function LogisticsGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState(() => newSession());
  const [foodOrder] = useState(() => shuffledIds(session.foods.map((f) => f.id)));
  const [schoolName] = useState<Record<Slot, string>>(() =>
    Math.random() < 0.5 ? { A: "たんぽぽ小", B: "けやき小" } : { A: "けやき小", B: "たんぽぽ小" }
  );
  const [slotOrder] = useState<Slot[]>(() => shuffledIds(["A", "B"]) as Slot[]);

  const [placement, setPlacement] = useState<Partial<Record<string, ZoneId>>>({});
  const [visitOrder, setVisitOrder] = useState<Slot[]>([]);
  const [openFoodId, setOpenFoodId] = useState<string | null>(null);
  const [openSchool, setOpenSchool] = useState<Slot | null>(null);
  const [outcome, setOutcome] = useState<"playing" | "success" | "partial">("playing");

  const foodList = foodOrder.map((id) => session.foods.find((f) => f.id === id)!);
  const allPlaced = session.foods.every((f) => placement[f.id]);
  const orderReady = visitOrder.length === 2;
  const canDepart = allPlaced && orderReady;

  const assign = (foodId: string, zone: ZoneId) => setPlacement((prev) => ({ ...prev, [foodId]: zone }));

  const tapSchool = (slot: Slot) =>
    setVisitOrder((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : prev.length >= 2 ? prev : [...prev, slot]));

  const depart = () => {
    const order = visitOrder.join("") as "AB" | "BA";
    const win = sessionWin(session, placement, order);
    setOutcome(win ? "success" : "partial");
  };

  if (outcome === "success") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">2校とも、安全な状態で時間までに届いた！</span>
          <p className="join-conclusion">→ 積み分け・訪問順のどちらも、条件に合っていた</p>
        </div>
        <button className="btn primary big" onClick={onComplete}>
          学校へ届けよう！
        </button>
      </div>
    );
  }

  if (outcome === "partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">うまく届けられなかった</span>
          <p className="game-line soft">
            積み分けか訪問順、どちらかが条件に合わなかったみたい。センターへ連絡して、次はどう届けるか考え直すことになった。
          </p>
        </div>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          今日届く4つの食材を、正しい荷室へ積み分けよう。学校間の移動には{session.route.between}分かかる。
        </span>
        <span className="task-sub">積み分け・訪問順を決めたら「出発する」</span>
      </div>

      <div className="dx-grid route-grid">
        {foodList.map((f) => {
          const assigned = placement[f.id];
          return (
            <div key={f.id} className={`dx-card ${assigned ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{FOOD_NAMES[f.id]}</span>
                <button
                  className="dx-more"
                  aria-label={openFoodId === f.id ? "とじる" : "保存の目安を見る"}
                  onClick={() => setOpenFoodId(openFoodId === f.id ? null : f.id)}
                >
                  {openFoodId === f.id ? "－" : "？"}
                </button>
              </div>
              {openFoodId === f.id && <p className="dx-pattern">{FOOD_STORAGE_TEXT[f.id]}</p>}
              <div className="zone-row">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    className={`zone-btn ${assigned === z ? "on" : ""}`}
                    onClick={() => assign(f.id, z)}
                  >
                    {ZONE_LABELS[z]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dx-grid route-grid">
        {slotOrder.map((slot) => {
          const idx = visitOrder.indexOf(slot);
          const travel = slot === "A" ? session.route.travelA : session.route.travelB;
          const deadline = slot === "A" ? session.route.dlA : session.route.dlB;
          return (
            <div key={slot} className={`dx-card ${idx >= 0 ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{schoolName[slot]}</span>
                <button
                  className="dx-more"
                  aria-label={openSchool === slot ? "とじる" : "移動時間・受け入れ時刻を見る"}
                  onClick={() => setOpenSchool(openSchool === slot ? null : slot)}
                >
                  {openSchool === slot ? "－" : "？"}
                </button>
              </div>
              {openSchool === slot && (
                <p className="dx-pattern">
                  センターから移動{travel}分／出発から{deadline}分後までに受け入れ
                </p>
              )}
              <button className={`dx-commit ${idx >= 0 ? "on" : ""}`} onClick={() => tapSchool(slot)}>
                {idx >= 0 ? `${idx + 1}番目に訪問` : "この順番にする"}
              </button>
            </div>
          );
        })}
      </div>

      <button className="btn primary big" disabled={!canDepart} onClick={depart}>
        出発する
      </button>

      <p className="game-line soft center-line farm-disclaimer">
        ※学校の移動時間・受け入れ時刻はこのゲームの中だけの、学習用の設定です
      </p>
    </div>
  );
}
