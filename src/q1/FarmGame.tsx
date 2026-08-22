// Q1: 農家・生産者 (gameType: sow_and_grow)
// B: 11月に給食用にんじん300kgが必要。今は7月。
// D: 種袋を畑へドラッグしてまく → 時間を進める → 品種が合わないと
//    「発芽しない」「まだ小さい」という“結果”が返り、リセットして
//    別の品種を試せる（試す→結果→やり直しのループ）。
// C: 種袋の栽培情報・気象情報・注文の時期。読まずに試しても、結果から
//    資料に戻れる。途中で土が乾く→かん水設備を動かす軽い操作あり。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

// ※品種名は架空。性質は一般的な「夏まき秋冬どり」にんじん栽培に沿わせた設定。
interface Seed {
  id: string;
  name: string;
  sow: string;
  days: string;
  heat: string;
}
const SEEDS: Seed[] = [
  { id: "natsu", name: "あかね夏", sow: "まきどき 7〜8月", days: "収穫まで 約110日", heat: "暑さに強い" },
  { id: "fuyu", name: "ふゆみね", sow: "まきどき 9〜10月", days: "収穫まで 約130日", heat: "寒さに強い" },
  { id: "haru", name: "はるひな", sow: "まきどき 3〜4月", days: "収穫まで 約100日", heat: "暑さに弱い" },
];

// 各品種を「今（7月）」にまいたときの、月ごとの結果
const TIMELINE: Record<string, { month: string; text: string; fail?: string }[]> = {
  natsu: [
    { month: "7月", text: "種まき完了。数日で芽が出た！暑さに強い品種だ。" },
    { month: "8月", text: "☀️ 猛暑つづき。土がカラカラにかわいてきた…！" },
    { month: "10月", text: "葉がぐんぐんしげって、土の中でにんじんが太ってきた。" },
    { month: "11月", text: "収穫のとき！注文どおりの時期に間に合った。" },
  ],
  haru: [
    { month: "7月", text: "種まき完了。…数日たっても芽が出ない。" },
    {
      month: "8月",
      text: "",
      fail: "真夏の高温で、ほとんど発芽しなかった…。この品種は暑さに弱い。🌡気象情報と種袋を見比べてみよう。",
    },
  ],
  fuyu: [
    { month: "7月", text: "種まき完了。芽は出たけど、なんだか小さい…。" },
    { month: "9月", text: "少しずつ育っている。" },
    {
      month: "11月",
      text: "",
      fail: "11月になったけど、まだ細くて小さい…。この品種の収穫は冬をこえた先。📅注文の時期と「収穫までの日数」を見比べてみよう。",
    },
  ],
};

export default function FarmGame({ onComplete }: Q1GameProps) {
  const [planted, setPlanted] = useState<Seed | null>(null);
  const [step, setStep] = useState(0);
  const [watered, setWatered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [harvested, setHarvested] = useState(false);

  const sow = (itemId: string, zoneId: string) => {
    if (zoneId !== "field") return;
    setPlanted(SEEDS.find((s) => s.id === itemId)!);
    setStep(0);
    setWatered(false);
    setSelected(null);
  };

  const { drag, startDrag, surfaceProps } = useDragDrop(sow, (id) =>
    setSelected(selected === id ? null : id),
  );

  const docs = [
    {
      id: "order",
      icon: "📅",
      title: "注文（必要な時期）",
      body: <p>給食室から：<strong>11月に、にんじん300kg</strong>。今日は7月のはじめ。</p>,
    },
    {
      id: "weather",
      icon: "🌡",
      title: "気象情報",
      body: (
        <>
          <p>今年の夏は猛暑予報。にんじんの芽が出やすいのは<strong>15〜25℃くらい</strong>。</p>
          <p>真夏は土が高温・乾燥しやすい。水の管理も大事。</p>
        </>
      ),
    },
    {
      id: "soil",
      icon: "🟤",
      title: "土壌診断",
      body: <p>土はやわらかく水はけ良好、堆肥入れずみ。準備はOK！</p>,
    },
  ];

  const timeline = planted ? TIMELINE[planted.id] : [];
  const current = timeline[step];
  const isFail = !!current?.fail;
  const isLast = planted && step >= timeline.length - 1 && !isFail;
  const needWater = planted?.id === "natsu" && step === 1 && !watered;

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="mission-bar">
        <span className="mission-bar-title">
          11月の給食に、にんじん300kg。どの種をまく？
        </span>
        <div className="mission-chips">
          <span className={`mchip ${planted ? "ok" : ""}`}>{planted ? "✓" : "・"} 種をまく</span>
          <span className={`mchip ${harvested ? "ok" : ""}`}>{harvested ? "✓" : "・"} 育てて収穫</span>
        </div>
      </div>

      {/* the field */}
      <div
        className={`field-plot ${drag || selected ? "ready" : ""}`}
        data-drop="field"
        onClick={() => {
          if (selected && !planted) sow(selected, "field");
        }}
        style={{ backgroundImage: `url(${A("bg-farm")})` }}
      >
        {!planted ? (
          <span className="field-hint">🥕 ここに種袋をドラッグ</span>
        ) : (
          <div className="field-state">
            <span className="field-month">{current?.month}</span>
            <span className="field-text">
              {isFail ? "…うまくいかなかった" : current?.text}
            </span>
          </div>
        )}
      </div>

      {/* seeds */}
      {!planted && (
        <div className="choice-row">
          {SEEDS.map((s) => (
            <button
              key={s.id}
              className={`seed-card drag-item ${selected === s.id ? "selected" : ""}`}
              onPointerDown={startDrag(s.id)}
            >
              <span className="choice-name">🌱 {s.name}</span>
              <small>{s.sow}</small>
              <small>{s.days}</small>
              <small>{s.heat}</small>
            </button>
          ))}
        </div>
      )}

      {/* grow controls / results */}
      {planted && isFail && (
        <>
          <p className="game-note">{current.fail}</p>
          <button
            className="btn primary big"
            onClick={() => {
              setPlanted(null);
              setStep(0);
            }}
          >
            畑をリセットして、別の種を試す
          </button>
        </>
      )}
      {planted && !isFail && needWater && (
        <button
          className="btn primary big"
          onClick={() => setWatered(true)}
        >
          💦 かん水設備（スプリンクラー）を動かす
        </button>
      )}
      {planted && !isFail && !needWater && !isLast && (
        <button className="btn primary big" onClick={() => setStep((s) => s + 1)}>
          ⏩ 時間をすすめる
        </button>
      )}
      {isLast && !harvested && (
        <button className="btn primary big" onClick={() => setHarvested(true)}>
          🥕 300kgを収穫して箱づめ！
        </button>
      )}
      {harvested && (
        <>
          <p className="game-line center-line">
            トラックが畑に来た。今日の給食は、何か月も前のこの畑から始まる。
          </p>
          <button className="btn primary big" onClick={onComplete}>
            給食室へ届けよう！
          </button>
        </>
      )}

      <InfoCards cards={docs} label="こまったら見る資料" />

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          🌱
        </div>
      )}
    </div>
  );
}
