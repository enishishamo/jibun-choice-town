// Q1 game: 物流 — loading, routing, and racing the lunch deadline.
// The dock (trucks / road info / deadline) is the driver's judgment
// material; the roadwork event makes the child consult it and re-route.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoDock from "./InfoDock";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type Step = "load" | "route" | "roadwork" | "arrive";

export default function LogisticsGame({ experience, onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("load");
  const [note, setNote] = useState<string | null>(null);

  const dockExtra = (toolId: string) => {
    if (toolId === "map") {
      return (
        <p className="soft-note">
          {step === "load" || step === "route"
            ? "道路情報：大通りで工事の予定あり…？"
            : "道路情報：🚧大通りは工事中！川ぞいの道は通れる。"}
        </p>
      );
    }
    if (toolId === "truck") {
      return <p className="soft-note">夏の生もの（魚・肉）は冷蔵車。温度をまちがえると食材がだめになる。</p>;
    }
    if (toolId === "time") {
      return <p className="soft-note">給食室の調理開始は11:00。そこから逆算して動く！</p>;
    }
    return null;
  };

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">11:00までに食材を学校へ！</span>
        <div className="mission-chips">
          <span className={`mchip ${step !== "load" ? "ok" : ""}`}>{step !== "load" ? "✓" : "・"} 積み込み</span>
          <span className={`mchip ${step === "arrive" ? "ok" : ""}`}>{step === "arrive" ? "✓" : "・"} ルート</span>
          <span className="mchip">・ 到着</span>
        </div>
      </div>

      {step === "load" && (
        <>
          <img className="game-scene" src={experience.place.image} alt="物流センター" />
          <p className="game-line">
            学校に届けるのは「魚」と「野菜」。トラックの情報を見て考えよう。魚はどっちに積む？
          </p>
          {note && <p className="game-note">{note}</p>}
          <div className="stack">
            <button className="btn primary" onClick={() => { setNote(null); setStep("route"); }}>
              ❄️ 冷蔵車に積む
            </button>
            <button
              className="btn ghost"
              onClick={() => setNote("🚚トラックの情報を見てみよう。夏の魚をふつうの荷台で運ぶと、いたんでしまうかも。食べ物は温度が命！")}
            >
              ふつうの荷台に積む
            </button>
          </div>
        </>
      )}

      {step === "route" && (
        <>
          <img className="game-icon" src={A("item-map")} alt="地図" />
          <p className="game-line">出発！どっちの道で行く？</p>
          <div className="stack">
            <button className="btn primary" onClick={() => setStep("roadwork")}>
              いちばん近い大通り
            </button>
            <button className="btn primary" onClick={() => setStep("roadwork")}>
              少し遠い川ぞいの道
            </button>
          </div>
        </>
      )}

      {step === "roadwork" && (
        <>
          <div className="alert-box">
            <span className="big-emoji">🚧</span>
            <p>この先、工事で通れない！</p>
          </div>
          <p className="game-line">🗺 道路情報をチェック…川ぞいのルートなら11:00に間に合う！</p>
          <button className="btn primary" onClick={() => setStep("arrive")}>
            ルートを組み直して急ぐ！
          </button>
        </>
      )}

      {step === "arrive" && (
        <>
          <img className="game-icon" src={A("item-truck")} alt="トラック" />
          <p className="game-line">学校が見えてきた。荷物も温度もばっちり！</p>
          <button className="btn primary" onClick={onComplete}>
            11:00 学校に到着！
          </button>
        </>
      )}

      <InfoDock tools={experience.tools} extra={dockExtra} />
    </div>
  );
}
