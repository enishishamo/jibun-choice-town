// Q1: 電力の需給や系統運用に関わる仕事 (gameType: forecast_and_balance)
// B: 猛暑で冷房の需要が伸び続けている。
// C: 需要予測グラフ／気温予報／現在の供給力／使える調整力カード。
//    気温予報を見ないと「このあと需要がどこまで伸びるか」が分からない。
// D: 供給を足す/減らす → 時間を進める → 需給バランスが変化。
//    現在値だけ見て進めると15時に足りなくなる（＝失敗が結果で返る）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Hour {
  h: number;
  temp: number;
  demand: number; // 万kW
}
// 需要は気温とともに上がり、夕方に少し下がる（猛暑日の典型的な形）
const HOURS: Hour[] = [
  { h: 13, temp: 37, demand: 4600 },
  { h: 14, temp: 38, demand: 4900 },
  { h: 15, temp: 39, demand: 5200 },
  { h: 16, temp: 38, demand: 5050 },
  { h: 17, temp: 36, demand: 4800 },
];

const BASE_SUPPLY = 4700; // 万kW（今の供給力）

interface Source {
  id: string;
  name: string;
  emoji: string;
  add: number;
  note: string;
}
const SOURCES: Source[] = [
  { id: "thermal", name: "火力発電を追加で動かす", emoji: "🏭", add: 300, note: "動かすまで少し時間がかかる" },
  { id: "hydro", name: "水力（貯水）を使う", emoji: "💧", add: 200, note: "短い時間ならすぐ出せる" },
  { id: "buy", name: "ほかの地域から電気を送ってもらう", emoji: "🔌", add: 250, note: "送れる量にかぎりがある" },
];

export default function PowerGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState(0); // index into HOURS
  const [on, setOn] = useState<string[]>([]);
  const [openTemp, setOpenTemp] = useState(false);
  const [openGraph, setOpenGraph] = useState(false);
  const [shortage, setShortage] = useState(false);
  const [done, setDone] = useState(false);

  const cur = HOURS[step];
  const supply = BASE_SUPPLY + SOURCES.filter((s) => on.includes(s.id)).reduce((a, s) => a + s.add, 0);
  const margin = supply - cur.demand;
  const level = margin >= 400 ? "green" : margin >= 0 ? "yellow" : "red";
  const levelText = { green: "🟢 余裕あり", yellow: "🟡 余裕が少ない", red: "🔴 足りない" }[level];

  const advance = () => {
    if (step + 1 >= HOURS.length) {
      setDone(true);
      return;
    }
    const next = HOURS[step + 1];
    if (supply < next.demand) {
      setShortage(true);
    }
    setStep(step + 1);
  };

  if (done) {
    return (
      <div className="game board-game">
        <div className="city-lights">
          <span>🏥</span><span>🚃</span><span>🏠</span><span>🏪</span>
        </div>
        <p className="game-line center-line">
          17時。街の電気は、一度も途切れなかった。<br />
          病院も、電車も、家も、お店も、いつもどおり。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          今日の記録をつける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">
          {cur.h}:00　気温{cur.temp}℃　電気の使用量：{cur.demand}万kW
        </span>
        <div className="mission-chips">
          <span className={`mchip ${level === "green" ? "ok" : level === "yellow" ? "soft" : "bad"}`}>
            {levelText}
          </span>
          <span className="mchip">供給 {supply}万kW</span>
        </div>
      </div>

      {/* balance gauge = live feedback */}
      <div className="balance-box">
        <div className="balance-bar">
          <div
            className="balance-demand"
            style={{ width: `${Math.min(100, (cur.demand / 6000) * 100)}%` }}
          >
            <span>使う量</span>
          </div>
          <div
            className={`balance-supply ${level}`}
            style={{ width: `${Math.min(100, (supply / 6000) * 100)}%` }}
          >
            <span>作る量</span>
          </div>
        </div>
        {shortage && level !== "green" && (
          <p className="balance-warn">
            使う量が、作る量に追いついてきた…！このあと、どうなるんだろう？
          </p>
        )}
      </div>

      {/* C: data cards */}
      <div className="layer-row">
        <button className={`layer-btn ${openTemp ? "active" : ""}`} onClick={() => setOpenTemp(!openTemp)}>
          🌡 気温予報
        </button>
        <button className={`layer-btn ${openGraph ? "active" : ""}`} onClick={() => setOpenGraph(!openGraph)}>
          📈 需要予測グラフ
        </button>
      </div>
      {openTemp && (
        <div className="tool-panel">
          {HOURS.map((h) => (
            <p key={h.h} className={h.h === 15 ? "bad" : ""}>
              {h.h}:00　{h.temp}℃{h.h === 15 && "　← いちばん暑い"}
            </p>
          ))}
        </div>
      )}
      {openGraph && (
        <div className="tool-panel">
          <div className="mini-graph">
            {HOURS.map((h) => (
              <span key={h.h} className={`graph-bar ${h.h === cur.h ? "now" : ""}`}>
                <span style={{ height: `${(h.demand / 5400) * 100}%` }} />
                <small>{h.h}時</small>
              </span>
            ))}
          </div>
          <p className="soft-note">15時ごろに、いちばん電気が使われそう。</p>
        </div>
      )}

      {/* D: supply controls */}
      <div className="choice-row wrap">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            className={`choice-card ${on.includes(s.id) ? "selected" : ""}`}
            onClick={() =>
              setOn((o) => (o.includes(s.id) ? o.filter((x) => x !== s.id) : [...o, s.id]))
            }
          >
            <span className="choice-emoji">{s.emoji}</span>
            <span className="choice-name">{s.name}</span>
            <small>{on.includes(s.id) ? `+${s.add}万kW 稼働中` : `+${s.add}万kW`}</small>
          </button>
        ))}
      </div>

      <button className="btn primary big" onClick={advance}>
        ⏩ {step + 1 >= HOURS.length ? "夕方まで進める" : `${HOURS[step + 1].h}:00へ進める`}
      </button>
    </div>
  );
}
