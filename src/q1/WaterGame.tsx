// Q1: 水資源の管理・調整に関わる仕事 (gameType: allocate_and_forecast)
// B: 猛暑と少雨でダムの貯水率が下がっている。
// C: 現在の貯水率／今後の雨予測／このまま使った場合の予測。
//    雨予測を見ないと「あと何日もつか」が判断できない。
// D: 家庭・農業・工業の利用量スライダーを調整 →「7日進める」。
//    100%のまま進めると危険水準に落ちる（失敗が結果で返る）。
//    絞りすぎると各分野に影響が出る＝単一正解にしない。
//
// ※ゲーム上は「調整案をシミュレーションする」位置づけ。実際の取水制限は
//   一人の担当者が決めるものではなく、関係機関の協議で決まる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Sector {
  id: "home" | "farm" | "factory";
  name: string;
  emoji: string;
  base: number; // %/week of storage consumed at 100%
  impactAt: { level: number; text: string }[];
}

const SECTORS: Sector[] = [
  {
    id: "home",
    name: "家庭・水道",
    emoji: "🏠",
    base: 8,
    impactAt: [
      { level: 60, text: "水の出が弱くなって、生活が苦しい…" },
      { level: 80, text: "少し節水のおねがいが出ている" },
    ],
  },
  {
    id: "farm",
    name: "農業用水",
    emoji: "🌾",
    base: 9,
    impactAt: [
      { level: 50, text: "田んぼの水が足りず、稲が弱ってきた…" },
      { level: 75, text: "作物にすこし影響が出はじめた" },
    ],
  },
  {
    id: "factory",
    name: "工業用水",
    emoji: "🏭",
    base: 5,
    impactAt: [
      { level: 50, text: "工場の生産を止める日が出てきた…" },
      { level: 75, text: "生産を少しへらしている" },
    ],
  },
];

const STEPS = ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];

export default function WaterGame({ onComplete }: Q1GameProps) {
  const [level, setLevel] = useState<Record<string, number>>({ home: 100, farm: 100, factory: 100 });
  const [storage, setStorage] = useState(63);
  const [week, setWeek] = useState(0);
  const [openRain, setOpenRain] = useState(false);
  const [history, setHistory] = useState<number[]>([63]);
  // 一度でも危険水準に落ちたら「もたせた」ことにはしない
  const [hitCritical, setHitCritical] = useState(false);

  // 3週間後に大雨が来る（雨予測カードに書いてある）
  const RAIN_WEEK = 3;
  const rainArrived = week >= RAIN_WEEK;

  const weeklyUse = SECTORS.reduce((a, s) => a + (s.base * level[s.id]) / 100, 0);
  const projected = Math.max(0, Math.round(storage - weeklyUse));

  const advance = () => {
    const next = week + 1;
    const rain = next >= RAIN_WEEK ? 22 : 0; // 大雨で回復
    const v = Math.max(0, Math.min(100, Math.round(storage - weeklyUse + rain)));
    setStorage(v);
    setHistory((h) => [...h, v]);
    setWeek(next);
    if (v <= 20) setHitCritical(true);
  };

  const critical = storage <= 20;
  const survived = rainArrived && storage > 25 && !hitCritical;

  const impactOf = (s: Sector) => {
    const l = level[s.id];
    const hit = s.impactAt.find((i) => l <= i.level);
    return hit?.text;
  };

  if (survived) {
    return (
      <div className="game board-game">
        <div className="dam-visual">
          <div className="dam-water" style={{ height: `${storage}%` }} />
          <span className="dam-label">貯水率 {storage}%</span>
          <span className="rain-emoji">🌧</span>
        </div>
        <p className="game-line center-line">
          大きな雨がきた！<br />
          限られた水を、いろいろな人が使えるように分けあってつないだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          調整の記録をまとめる
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">
          {week === 0 ? "今日" : `${week * 7}日後`}　ダムの貯水率 {storage}%
        </span>
        <div className="mission-chips">
          <span className={`mchip ${critical ? "bad" : storage < 40 ? "soft" : "ok"}`}>
            {critical ? "🔴 危険な水準" : storage < 40 ? "🟡 少なくなってきた" : "🟢 まだ余裕"}
          </span>
          <span className="mchip">このまま7日後：約{projected}%</span>
        </div>
      </div>

      <div className="dam-visual">
        <div className={`dam-water ${critical ? "low" : ""}`} style={{ height: `${storage}%` }} />
        <span className="dam-label">{storage}%</span>
        {history.length > 1 && (
          <span className="dam-history">{history.join("% → ")}%</span>
        )}
      </div>

      {critical && (
        <div className="sched-issues">
          <p>🔴 ダムの水が危険な水準に…！このままでは街全体で水が足りなくなる。</p>
        </div>
      )}

      <button className={`layer-btn wide ${openRain ? "active" : ""}`} onClick={() => setOpenRain(!openRain)}>
        🌦 今後の雨予測を見る
      </button>
      {openRain && (
        <div className="tool-panel">
          <p>1週間後：まとまった雨の予報なし</p>
          <p>2週間後：まとまった雨の予報なし</p>
          <p className="good">3週間後：大きな雨が来そう</p>
          <p className="soft-note">＝ 大雨までの約3週間を、どうやってもたせるか。</p>
        </div>
      )}

      {/* sliders */}
      <div className="slider-stack">
        {SECTORS.map((s) => {
          const impact = impactOf(s);
          return (
            <div key={s.id} className="slider-row">
              <span className="slider-label">
                {s.emoji} {s.name}　<strong>{level[s.id]}%</strong>
              </span>
              <div className="slider-steps">
                {STEPS.map((st) => {
                  const v = parseInt(st);
                  return (
                    <button
                      key={st}
                      className={`slider-step ${level[s.id] >= v ? "on" : ""}`}
                      onClick={() => setLevel((l) => ({ ...l, [s.id]: v }))}
                      aria-label={`${s.name} ${st}`}
                    />
                  );
                })}
              </div>
              {impact && <span className="slider-impact">{impact}</span>}
            </div>
          );
        })}
      </div>

      <button className="btn primary big" onClick={advance}>
        ⏩ 7日進める
      </button>
      {(critical || hitCritical) && (
        <button
          className="btn ghost"
          onClick={() => {
            setStorage(63);
            setWeek(0);
            setHistory([63]);
            setHitCritical(false);
          }}
        >
          今日からやり直す
        </button>
      )}
    </div>
  );
}
