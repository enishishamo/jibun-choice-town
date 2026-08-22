// Q1: 農家・生産者
// B: 給食で使うにんじんを育てたい（11月に300kg必要、今は7月）。
// C: 品種カード（まきどき・日数・性質）／気温情報／必要時期／土。
// D: 品種×まきどきを、複数の資料を照合して決める小さなパズル。
//    常識だけでは解けず、品種カードと気温・時期の照合が必要。
// E: 育って収穫、給食用の箱→物流へつながる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

interface Variety {
  id: string;
  name: string;
  sow: string;
  sowIds: string[]; // timing ids that suit this variety
  days: number;
  heat: string;
  note: string;
}

// ※品種名は架空。性質は「夏まき秋冬どり」等の一般的なにんじん栽培に
//   合わせたプロトタイプ用の設定。
const VARIETIES: Variety[] = [
  {
    id: "natsu",
    name: "あかね夏",
    sow: "7月中旬〜8月",
    sowIds: ["july"],
    days: 110,
    heat: "暑さに強い",
    note: "夏にまいて、秋〜冬に収穫するタイプ。",
  },
  {
    id: "fuyu",
    name: "ふゆみね",
    sow: "9月〜10月",
    sowIds: ["sep"],
    days: 130,
    heat: "寒さに強い",
    note: "冬をこして、春先に収穫するタイプ。",
  },
  {
    id: "haru",
    name: "はるひな",
    sow: "3月〜4月",
    sowIds: ["mar"],
    days: 100,
    heat: "暑さに弱い",
    note: "春にまいて、初夏に収穫するタイプ。",
  },
];

const TIMINGS = [
  { id: "july", label: "今月（7月）にまく", month: 7 },
  { id: "sep", label: "9月にまく", month: 9 },
  { id: "mar", label: "来年3月にまく", month: 15 },
];

type Phase = "brief" | "plan" | "grow";

export default function FarmGame({ experience, onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [variety, setVariety] = useState<Variety | null>(null);
  const [timing, setTiming] = useState<(typeof TIMINGS)[number] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [growStep, setGrowStep] = useState(0);

  const docs = [
    {
      id: "variety",
      icon: "🥕",
      title: "品種と栽培ごよみ",
      body: (
        <>
          {VARIETIES.map((v) => (
            <p key={v.id}>
              <strong>{v.name}</strong>｜まきどき：{v.sow}｜収穫まで約{v.days}日｜{v.heat}
              <br />
              <span className="soft-note">{v.note}</span>
            </p>
          ))}
        </>
      ),
    },
    {
      id: "weather",
      icon: "🌡",
      title: "気温の情報",
      body: (
        <>
          <p>今年の夏は、暑い日が多くなる予報。</p>
          <p>にんじんの芽が出やすいのは<strong>15〜25℃くらい</strong>。真夏は土が高温・乾燥しやすいので、暑さに強い品種と水の管理が大事。</p>
        </>
      ),
    },
    {
      id: "order",
      icon: "📅",
      title: "必要な時期（注文）",
      body: (
        <>
          <p>給食室からの注文：<strong>11月に、にんじん300kg</strong>。</p>
          <p className="soft-note">今日は7月のはじめ。逆算して考えよう。</p>
        </>
      ),
    },
    {
      id: "soil",
      icon: "🟤",
      title: "畑の土",
      body: (
        <>
          <p>土はやわらかく、水はけ良好。堆肥も入れてある。</p>
          <p className="soft-note">準備はばっちり。あとは「何を・いつ」だけ！</p>
        </>
      ),
    },
  ];

  const check = () => {
    if (!variety || !timing) return;
    // Judge with the same facts written in the C documents.
    if (variety.id === "natsu" && timing.id === "july") {
      setNote(null);
      setPhase("grow");
      return;
    }
    if (!variety.sowIds.includes(timing.id)) {
      setNote(
        `うーん、「${variety.name}」のまきどきは${variety.sow}。🥕品種カードをもう一度見てみよう。`,
      );
      return;
    }
    // Timing fits the variety but not the order (9月×ふゆみね / 3月×はるひな)
    const harvestNote =
      variety.id === "fuyu"
        ? "9月にまくと、収穫は約130日後…1月ごろ。11月の注文に間に合わない！"
        : "来年3月にまくと、収穫は初夏。今年の11月の注文には合わない！";
    setNote(`${harvestNote} 📅必要な時期と、収穫までの日数を見比べてみよう。`);
  };

  if (phase === "brief") {
    return (
      <div className="game board-game">
        <img className="game-scene" src={experience.place.image} alt="畑" />
        <p className="game-line">
          ここはにんじん畑。給食室から「<strong>11月に300kg</strong>」の注文が来ている。
          今日は7月のはじめ。どの品種を、いつまく？
        </p>
        <button className="btn primary big" onClick={() => setPhase("plan")}>
          資料を見て計画を立てる
        </button>
      </div>
    );
  }

  if (phase === "grow") {
    const steps = [
      { emoji: "🌱", text: "7月：種まき。暑い日は水の管理をしっかり。" },
      { emoji: "🥬", text: "9月：葉がぐんぐんしげってきた。" },
      { emoji: "🥕", text: "11月：土の中で、にんじんが太った！" },
    ];
    const done = growStep >= steps.length;
    return (
      <div className="game board-game">
        <div className="mission-bar">
          <span className="mission-bar-title">「あかね夏」を7月にまいた！</span>
          <div className="mission-chips">
            {steps.map((s, i) => (
              <span key={s.text} className={`mchip ${i < growStep ? "ok" : ""}`}>
                {i < growStep ? "✓" : "・"} {s.emoji}
              </span>
            ))}
          </div>
        </div>
        {!done ? (
          <>
            <span className="big-emoji center-line">{steps[growStep].emoji}</span>
            <p className="game-line center-line">{steps[growStep].text}</p>
            <button className="btn primary big" onClick={() => setGrowStep((s) => s + 1)}>
              時間をすすめる ▶
            </button>
          </>
        ) : (
          <>
            <img className="game-icon" src={A("item-carrot")} alt="にんじん" />
            <p className="game-line center-line">
              約110日。注文どおり、11月に立派なにんじんがそろった！
            </p>
            <button className="btn primary big" onClick={onComplete}>
              300kgを収穫して箱づめ！
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">11月に300kg届けるには？</span>
        <div className="mission-chips">
          <span className={`mchip ${variety ? "ok" : ""}`}>{variety ? "✓" : "・"} 品種をえらぶ</span>
          <span className={`mchip ${timing ? "ok" : ""}`}>{timing ? "✓" : "・"} まきどきをえらぶ</span>
        </div>
      </div>

      <InfoCards cards={docs} label="農家の資料" />

      <div className="plan-zone">
        <span className="doc-label">🥕 品種をえらぶ</span>
        <div className="choice-row">
          {VARIETIES.map((v) => (
            <button
              key={v.id}
              className={`choice-card ${variety?.id === v.id ? "selected" : ""}`}
              onClick={() => {
                setVariety(v);
                setNote(null);
              }}
            >
              <span className="choice-name">{v.name}</span>
              <small>{v.heat}</small>
            </button>
          ))}
        </div>
        <span className="doc-label">📅 いつまく？</span>
        <div className="choice-row">
          {TIMINGS.map((t) => (
            <button
              key={t.id}
              className={`choice-card ${timing?.id === t.id ? "selected" : ""}`}
              onClick={() => {
                setTiming(t);
                setNote(null);
              }}
            >
              <span className="choice-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {note && <p className="game-note">{note}</p>}
      <button className="btn primary big" disabled={!variety || !timing} onClick={check}>
        {variety && timing ? "この計画でいく！" : "品種とまきどきをえらぼう"}
      </button>
    </div>
  );
}
