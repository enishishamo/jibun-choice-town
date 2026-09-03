// Q1: 河川水質・生きもの調査 (gameType: water_trace)
// 核: 「1回の目撃で断定しない。上下流を比べる」— 採水予算内で地点を選び、
// 数値の変わり目から回復の理由を結論づける。riverLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { TRACE_BUDGET, newTraceState, traceSample, traceConclude } from "./riverLogic";
import type { TraceState, Spot, RiverCause } from "./riverLogic";

type Step = "work" | "failed" | "done";

const SPOTS: { id: Spot; name: string; x: number }[] = [
  { id: "A", name: "上流", x: 8 },
  { id: "B", name: "支流", x: 28 },
  { id: "C", name: "処理場の上", x: 48 },
  { id: "D", name: "処理場の下", x: 68 },
  { id: "E", name: "下流", x: 88 },
];
const ANSWERS: { id: RiverCause; label: string; sub: string }[] = [
  { id: "plant_upgrade", label: "処理場の改善", sub: "処理場の下から数値が良い" },
  { id: "tributary_cleanup", label: "支流がきれいに", sub: "支流の合流から良くなる" },
  { id: "not_recovered", label: "まだ回復していない", sub: "数値は昔のまま（魚は放流かも）" },
];

export default function WaterTraceGame({ onComplete }: Q1GameProps) {
  const [ts, setTs] = useState<TraceState>(() => newTraceState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("調べる地点を選ぼう（採水びんは4本）。");
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setTs(newTraceState());
    setNote("調べる地点を選ぼう（採水びんは4本）。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const healthy = (sp: Spot) => {
    const r = ts.c.readings[sp];
    return r.do_ >= 5 && r.bod <= 3;
  };

  // the river IS the world: a flowing band with sample flags and meters
  const river = (reveal = false) => (
    <div style={{ margin: "6px 14px" }}>
      <div style={{ position: "relative", height: 128, borderRadius: 14, background: "linear-gradient(180deg,#dcead0 0%,#dcead0 34%,#9fc8de 34%,#7fb2d0 100%)", overflow: "hidden", border: "2px solid #b7cbd6" }}>
        {/* tributary joining between B and C */}
        <div style={{ position: "absolute", left: "30%", top: 0, width: 14, height: "40%", background: "#9fc8de", borderRadius: 7 }} />
        {/* treatment plant between C and D */}
        <span style={{ position: "absolute", left: "56%", top: "6%", fontSize: 20 }}>🏭</span>
        <span style={{ position: "absolute", left: "55%", top: "30%", fontSize: 10, color: "#4c5c68" }}>処理場</span>
        {ts.c.stockingPosterSeen && (
          <span style={{ position: "absolute", right: 6, top: "4%", fontSize: 9, background: "#fff6da", border: "1px solid #d9c98a", borderRadius: 6, padding: "1px 5px" }}>
            はり紙「稚魚の放流をしました」
          </span>
        )}
        {SPOTS.map((sp) => {
          const sampled = ts.sampled.includes(sp.id);
          const r = ts.c.readings[sp.id];
          return (
            <button
              key={sp.id}
              disabled={step !== "work"}
              onClick={() => {
                const nx = traceSample(ts, sp.id);
                if (nx.refusal) { setNote(nx.refusal); return; }
                setTs(nx);
                setNote(null);
              }}
              style={{ position: "absolute", left: `${sp.x}%`, bottom: 4, transform: "translateX(-50%)", width: 62, background: sampled ? "rgba(255,253,245,0.96)" : "rgba(255,253,245,0.72)", border: sampled ? "2px solid #4a90d9" : "1.5px dashed #8fa8b8", borderRadius: 10, padding: "3px 2px", fontSize: 10 }}
            >
              <div style={{ fontWeight: "bold" }}>{sp.id} {sp.name}</div>
              {sampled ? (
                <div style={{ fontFamily: "monospace", fontSize: 10 }}>
                  DO {r.do_}
                  <br />
                  BOD {r.bod}
                  <br />
                  {r.fish ? "🐟あり" : "🐟なし"}
                </div>
              ) : (
                <div style={{ color: "#7d8a94" }}>（未調査）</div>
              )}
              {reveal && healthy(sp.id) && <span style={{ position: "absolute", top: -10, right: -4 }}>✨</span>}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 4, alignItems: "center", fontSize: 12 }}>
        <span>🧪 採水びん</span>
        {Array.from({ length: TRACE_BUDGET }).map((_, i) => (
          <span key={i} style={{ opacity: i < TRACE_BUDGET - ts.sampled.length ? 1 : 0.25 }}>🧪</span>
        ))}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">報告会で、結論が通らなかった</span></div>
        {river()}
        <p className="game-line center-line">数字の「変わり目」と結論が合っていなかった。調べ直しは先輩チームが引き継いだ。</p>
        <p className="game-line soft center-line">上下流を比べて、どこから良くなったかを読む。（川のようすは毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の調査で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ts.mistakes === 0 && attempts === 1 && ts.sampled.length <= 3;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">結論が、報告会で通った！</span></div>
        {river(true)}
        <p className="game-line soft center-line">
          {perfect ? "少ない採水で言い当てた。地点の選び方が良かった。" : "通った。どの地点を調べるかで、採水の数は変わる。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("魚1匹では「回復」と言えない。｜溶存酸素《ようぞんさんそ》（DO＝水にとけた酸素）の数字が、川の体温計なんだ。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>報告をまとめる</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">魚がもどった理由を、調べて確かめる</span>
        <span className="task-sub">まちがえられる結論は あと{2 - ts.mistakes - 1}回</span>
      </div>

      {river()}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "この川の基準（B類型）",
          body: (
            <>
              <p>{withRuby("健康なめやす：｜溶存酸素《ようぞんさんそ》DO 5以上・よごれBOD 3以下。")}</p>
              <p>コツは<strong>比べる</strong>こと。どの地点から数字が良くなるかで、理由がわかる。</p>
              <p>魚を1回見ただけでは「回復」と言わない。放流された魚かもしれない。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <p className="pick-title">結論を出す（報告会に出すもの）</p>
      <div className="choice-row wrap">
        {ANSWERS.map((a) => (
          <button
            key={a.id}
            className="choice-card"
            onClick={() => {
              const r = traceConclude(ts, a.id);
              setTs(r.state);
              if (r.state.refusal) { setNote(r.state.refusal); return; }
              if (r.state.outcome === "done") { setStep("done"); return; }
              if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
              setNote("…報告会がざわついた。数字と結論が、かみ合っていないようだ。");
            }}
          >
            <span className="choice-name" style={{ fontSize: 13 }}>{a.label}</span>
            <small style={{ opacity: 0.7 }}>{a.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
