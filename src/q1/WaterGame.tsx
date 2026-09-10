// Q1: 渇水時に水を分け合う仕事 (gameType: allocate_and_forecast)
// B: 雨が少なく、ダムの貯水率が下がり続けている。貯水率と雨の予報（毎セッションランダムな組み合わせ）
//    を見て、今週どのくらい強い制限が必要かを決め、家庭・農業・工業のうちどこに一番重い制限を
//    割り当てるべきかを決めなければならない。
// C: 貯水率・雨予報の読み物と、家庭・農業・工業それぞれのタイミング事情・需要側の余地の読み物
//    （詳細はwaterAllocationLogic.ts）。
// D: 制限の強さ（軽い/中程度/重い）を1つ、割り当て先のセクター（家庭/農業/工業）を1つ選んで、
//    「実施する」を1回だけ押して結果を確定する（同一セッション内のやり直しはない）。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-allocate-and-forecast rebuild, t5-brief-and-allocate-
// corrected): 旧実装は家庭・農業・工業の利用率スライダーを10%刻みで調整するだけで、3部門を均等に
// 絞っても貯水率さえ保てば成功する（部門ごとの結果の違いがない）記憶ゲームだった上、危険水準に
// 落ちても「今日からやり直す」で同一試行内の総当たりを許していた（reverse audit: C_required=false,
// exploit=select-all）。新実装では家庭を含む3セクターを完全に対称な候補とし（design review r1
// CORE_DISTORTED_BY_GAME是正）、単一軸判断が約58%キャップになるよう非対象パターンを調整し
// （design review r2/r3 C_NOT_NEEDED_FOR_D/CORE_CAUSAL_MODEL_DISTORTED是正）、フラットな失敗結果の
// みを返す1回のコミット判断にした（design-sim.mjs参照、design review r4 PASS 76）。失敗時は同じ
// データを再提示する非採点の振り返り選択（セクター・強さの両方）を挟み、Q1 First-Play Standard
// Gate G「考え直す余地」に対応する（この振り返りは結果を一切変えない）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  CAPACITY_TEXT,
  DEPTHS,
  DEPTH_LABELS,
  RAIN_TEXT,
  RESERVOIR_TEXT,
  SECTORS,
  SECTOR_LABELS,
  URGENCY_TEXT,
  newSession,
  sessionWin,
  shuffledIds,
  type Depth,
  type Sector,
} from "./waterAllocationLogic";

type CardId = "reservoir" | "rain" | Sector;
const ALL_CARD_IDS: CardId[] = ["reservoir", "rain", ...SECTORS];

export default function WaterGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState(() => newSession());
  const [cardOrder] = useState<CardId[]>(() => shuffledIds(ALL_CARD_IDS));
  const [depthOrder] = useState<Depth[]>(() => shuffledIds(DEPTHS));
  const [openCard, setOpenCard] = useState<CardId | null>(null);
  const [openedCards, setOpenedCards] = useState<Set<CardId>>(new Set());
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<Depth | null>(null);
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "success">("playing");
  const [reflectSector, setReflectSector] = useState<Sector | null>(null);
  const [reflectDepth, setReflectDepth] = useState<Depth | null>(null);
  const [meter] = useState(() => (session.reservoir === "HIGH" ? 65 : 35));
  const [resultMeter, setResultMeter] = useState<number | null>(null);

  const allDataRead = openedCards.size === ALL_CARD_IDS.length;
  const canCommit = allDataRead && selectedSector !== null && selectedDepth !== null;
  const canContinueReflection = reflectSector !== null && reflectDepth !== null;

  const toggleOpen = (id: CardId) => {
    setOpenCard((cur) => (cur === id ? null : id));
    setOpenedCards((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const readingOf = (id: CardId): string => {
    if (id === "reservoir") return RESERVOIR_TEXT[session.reservoir];
    if (id === "rain") return RAIN_TEXT[session.rain];
    const sector = id as Sector;
    return `${URGENCY_TEXT[sector][session.sectors[sector].urgency]} ／ ${CAPACITY_TEXT[sector][session.sectors[sector].capacity]}`;
  };

  const cardLabel = (id: CardId): string => {
    if (id === "reservoir") return "💧 貯水率";
    if (id === "rain") return "🌦 雨予報";
    const sector = id as Sector;
    return `${SECTOR_LABELS[sector].icon} ${SECTOR_LABELS[sector].name}`;
  };

  const commit = () => {
    if (selectedSector === null || selectedDepth === null) return;
    const win = sessionWin(session, selectedSector, selectedDepth);
    if (win) {
      setResultMeter(Math.min(100, meter + 20));
      setOutcome("success");
    } else {
      setResultMeter(Math.max(0, meter - 8));
      setOutcome("reflecting");
    }
  };

  if (outcome === "success") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">限られた水を、必要な場所に届けられた</span>
          <p className="join-conclusion">→ 割り当て先も、制限の強さも、どちらも今週の状況に合っていた</p>
        </div>
        <div className="meter">
          <span>貯水率</span>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${resultMeter ?? meter}%` }} />
          </div>
        </div>
        <p className="game-line soft center-line">
          {SECTOR_LABELS[session.correctSector].icon} {SECTOR_LABELS[session.correctSector].name}が節水・協力中
        </p>
        <button className="btn primary big" onClick={onComplete}>
          調整の記録をまとめる
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">今週の状況に合った対応ではなかった</span>
          <p className="game-line soft">
            対応そのものが無駄だったわけではないが、本当に必要だった場所・強さに届いていなかった
            みたい。同じ週のデータをもう一度見比べて、次はどうするか考えてみよう。
          </p>
        </div>
        <div className="meter">
          <span>貯水率</span>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${resultMeter ?? meter}%` }} />
          </div>
        </div>
        {selectedSector && (
          <p className="game-line soft center-line">
            {SECTOR_LABELS[selectedSector].icon} {SECTOR_LABELS[selectedSector].name}の様子は変わっていない
          </p>
        )}

        <p className="game-line soft center-line farm-disclaimer">今週のデータをもう一度見比べよう</p>
        <div className="dx-grid route-grid">
          {cardOrder.map((id) => (
            <div key={id} className="dx-card">
              <div className="dx-head">
                <span className="dx-name">{cardLabel(id)}</span>
              </div>
              <p className="dx-pattern">{readingOf(id)}</p>
            </div>
          ))}
        </div>

        <p className="game-line soft center-line farm-disclaimer">
          ①今週、本当はどこに一番重い制限を割り当てるべきだったと思う？
        </p>
        <div className="dx-grid route-grid">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              className={`dx-commit ${reflectSector === sector ? "on" : ""}`}
              onClick={() => setReflectSector(sector)}
            >
              {SECTOR_LABELS[sector].icon} {SECTOR_LABELS[sector].name}
            </button>
          ))}
        </div>

        <p className="game-line soft center-line farm-disclaimer">②制限の強さはどれくらいが正しかったと思う？</p>
        <div className="zone-row">
          {DEPTHS.map((depth) => (
            <button
              key={depth}
              className={`zone-btn ${reflectDepth === depth ? "on" : ""}`}
              onClick={() => setReflectDepth(depth)}
            >
              {DEPTH_LABELS[depth]}
            </button>
          ))}
        </div>

        <p className="game-line soft center-line farm-disclaimer">※この選択で結果は変わりません</p>
        <button
          className="btn primary big"
          disabled={!canContinueReflection}
          onClick={() => (onPartialComplete ?? onComplete)()}
        >
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">雨が少なく、貯水率が下がっている。今週の対応を決めよう</span>
        <span className="task-sub">データを読んで、割り当て先と制限の強さを決めよう</span>
      </div>

      <div className="meter">
        <span>貯水率</span>
        <div className="meter-bar">
          <div className="meter-fill" style={{ width: `${meter}%` }} />
        </div>
      </div>

      <div className="dx-grid route-grid">
        {cardOrder.map((id) => {
          const isSector = id !== "reservoir" && id !== "rain";
          return (
            <div key={id} className={`dx-card ${isSector && selectedSector === id ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{cardLabel(id)}</span>
                <button
                  className="dx-more"
                  aria-label={openCard === id ? "とじる" : "データを見る"}
                  onClick={() => toggleOpen(id)}
                >
                  {openCard === id ? "－" : "？"}
                </button>
              </div>
              {openCard === id && <p className="dx-pattern">{readingOf(id)}</p>}
              {isSector && (
                <button className={`dx-commit ${selectedSector === id ? "on" : ""}`} onClick={() => setSelectedSector(id as Sector)}>
                  ここに割り当てる
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="zone-row">
        {depthOrder.map((depth) => (
          <button
            key={depth}
            className={`zone-btn ${selectedDepth === depth ? "on" : ""}`}
            onClick={() => setSelectedDepth(depth)}
          >
            {DEPTH_LABELS[depth]}
          </button>
        ))}
      </div>

      <button className="btn primary big" disabled={!canCommit} onClick={commit}>
        実施する
      </button>
      {!allDataRead && (
        <p className="game-line soft center-line farm-disclaimer">※5枚すべての「？」を見てから実施しよう</p>
      )}
    </div>
  );
}
