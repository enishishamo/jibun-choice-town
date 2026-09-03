// Q1: 下水処理場の運転管理 (gameType: plant_ops)
// 核: 「酸素は多いほど良い、ではない」— 微生物という生き物の世話。負荷に
// 合わせた送風で、水質と電力の両方を守る。riverLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { OPS_SLOTS, DO_LOW, DO_HIGH, newOpsState, opsAct } from "./riverLogic";
import type { OpsState, AirAction } from "./riverLogic";

type Step = "work" | "failed" | "done";

const ACTIONS: { id: AirAction; label: string }[] = [
  { id: "up", label: "💨 上げる" },
  { id: "keep", label: "⏸ そのまま" },
  { id: "down", label: "🔉 下げる" },
];

export default function PlantOpsGame({ onComplete }: Q1GameProps) {
  const [os, setOs] = useState<OpsState>(() => newOpsState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setOs(newOpsState());
    setNote(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const slot = os.idx < OPS_SLOTS ? os.slots[os.idx] : null;
  const doPct = Math.min(100, (os.do_ / 4.5) * 100);

  // the tank IS the world: bubbles, microbe face, DO meter, power meter
  const tank = (
    <div style={{ margin: "6px 14px", background: "#2c3e46", borderRadius: 14, padding: "10px 12px", color: "#e6eef2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 96, height: 74, background: "linear-gradient(#5b8aa6,#3e6c88)", borderRadius: 10, overflow: "hidden", border: "2px solid #22343c" }}>
          {/* bubbles by state */}
          {Array.from({ length: os.bubbles === "stormy" ? 14 : os.bubbles === "lively" ? 7 : 3 }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${(i * 37) % 90 + 4}%`, bottom: -6, fontSize: os.bubbles === "stormy" ? 12 : 9, animation: `bubble-rise ${1.2 + (i % 3) * 0.5}s linear ${i * 0.17}s infinite` }}>
              ○
            </span>
          ))}
          <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 26 }}>
            {os.bubbles === "lively" ? "🦠😊" : os.bubbles === "stormy" ? "🦠😵‍💫" : "🦠😪"}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span>{withRuby("DO")}</span>
            <div style={{ flex: 1, position: "relative", height: 12, borderRadius: 6, background: "#41545e" }}>
              <div style={{ position: "absolute", left: `${(DO_LOW / 4.5) * 100}%`, width: `${((DO_HIGH - DO_LOW) / 4.5) * 100}%`, top: 0, bottom: 0, background: "#5f8f6a", borderRadius: 6 }} />
              <div style={{ position: "absolute", left: `${doPct}%`, top: -3, width: 4, height: 18, background: "#fff", borderRadius: 2, transition: "left 0.5s" }} />
            </div>
            <span>{os.do_}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11 }}>
            <span>送風</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ width: 14, height: 8 + i * 2, borderRadius: 3, background: i <= os.air ? "#7fb2d0" : "#41545e", alignSelf: "flex-end" }} />
            ))}
            <span style={{ marginLeft: "auto" }}>⚡むだ {os.power}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11, color: "#b9c8d0" }}>
        {os.slots.map((sl, i) => (
          <span key={i} style={{ opacity: i === os.idx ? 1 : i < os.idx ? 0.45 : 0.7, fontWeight: i === os.idx ? "bold" : "normal" }}>
            {i < os.idx ? "✓" : ""}{sl.rain ? "🌧" : ""}{sl.label}
          </span>
        ))}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">放流を止めて、ベテランに交代</span></div>
        {tank}
        <p className="game-line center-line">タンクの調子がくずれ、放流の基準を守れなくなる前に運転を交代した。川はぶじ。</p>
        <p className="game-line soft center-line">送風は多くても少なくてもだめ。流れこむ量に合わせるのがコツ。</p>
        <button className="btn primary big" onClick={restart}>🔁 別の日に</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = os.troubles === 0 && os.power === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">今日の放流、ぜんぶ基準内！</span></div>
        {tank}
        <p className="game-line soft center-line">
          {perfect ? "水質も電力もむだなし。微生物のきげんを読み切った。" : `終えられた。電力のむだ${os.power}。ぴったり合わせるほど、電気も節約できる。`}
        </p>
        <p className="game-line soft center-line">
          {withRuby("よごれを食べているのは｜活性汚泥《かっせいおでい》という微生物のかたまり。運転員は、目に見えない生き物の飼育係でもあるんだ。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>日報を書く</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{slot?.rain ? "🌧 雨がふってきた" : `${slot?.label}の運転`}（{os.idx + 1}/{OPS_SLOTS}）</span>
        <span className="task-sub">流れこむ量：{"💧".repeat(slot?.inflow ?? 0)}</span>
      </div>

      {tank}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "運転のめやす",
          body: (
            <>
              <p>DOのめもりを<strong>みどりの帯</strong>に保つ。送風は流れこむ量に合わせる。</p>
              <p>上げすぎは電気のむだ＋微生物が乱れる。下げすぎは息切れ。</p>
              <p>雨の日は水がどっと増える——先を読んで。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className="choice-card"
            onClick={() => {
              const r = opsAct(os, a.id);
              setOs(r.state);
              if (r.state.outcome === "discharge_fail") { setStep("failed"); return; }
              if (r.state.outcome === "done") { setStep("done"); return; }
              setNote(null);
            }}
          >
            <span className="choice-name">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
