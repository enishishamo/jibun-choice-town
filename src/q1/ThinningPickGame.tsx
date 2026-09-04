// Q1: 間伐の選木 (gameType: thinning_pick)
// 核: 「本数でなく材積で数え、残す木で森を決める」— 損傷木を優先し、将来木を
// 守り、開けすぎない。検証・保護はforestLogic側で機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import {
  PLOT_COLS, RATE_MIN, RATE_MAX, THIN_REDO_LIMIT, VOL,
  newThinState, thinToggle, thinServe, thinValidate, markedVolume, totalVolume,
} from "./forestLogic";
import type { ThinState, Tree } from "./forestLogic";

type Step = "work" | "failed" | "done";

const SIZE_STYLE = {
  thin: { emoji: "🌲", fontSize: 24 },
  mid: { emoji: "🌲", fontSize: 34 },
  thick: { emoji: "🌲", fontSize: 46 },
} as const;

export default function ThinningPickGame({ onComplete }: Q1GameProps) {
  const [ts, setTs] = useState<ThinState>(() => newThinState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("印をつけよう。");
  const [seniorAt, setSeniorAt] = useState<string | null>(null); // tree id / "meter"
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setTs(newThinState());
    setSeniorAt(null);
    setNote("印をつけよう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const total = totalVolume(ts.trees);
  const vol = markedVolume(ts);
  const pct = Math.round((vol / total) * 100);

  const treeBtn = (t: Tree) => {
    const marked = ts.marked.includes(t.id);
    const st = SIZE_STYLE[t.size];
    return (
      <button
        key={t.id}
        disabled={step !== "work"}
        onClick={() => {
          const nx = thinToggle(ts, t.id);
          if (nx.refusal) { setNote(nx.refusal); return; }
          setTs(nx);
          setNote(null);
          setSeniorAt(null);
        }}
        style={{
          position: "relative", height: 74, borderRadius: 10,
          border: marked ? "2.5px solid #d9744a" : "2px solid transparent",
          background: marked ? "#f7e3d8" : "rgba(255,255,255,0.35)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
        }}
      >
        <span style={{ fontSize: st.fontSize, lineHeight: 1, filter: marked ? "grayscale(0.6) brightness(1.1)" : t.damaged ? "sepia(0.6)" : "none" }}>
          {st.emoji}
        </span>
        <span style={{ fontSize: 9, color: "#5b6b4c" }}>
          {t.future ? "📍将来木" : t.damaged ? "傷あり" : `材積${VOL[t.size]}`}
        </span>
        {marked && <span style={{ position: "absolute", top: 2, right: 4, fontSize: 12 }}>🪓</span>}
        {seniorAt === t.id && <span style={{ position: "absolute", top: -6, left: 2, fontSize: 18 }}>👷</span>}
      </button>
    );
  };

  // the plot IS the world — and the after-picture shows the 5-years-later light
  const plot = (after = false) => (
    <div style={{ margin: "6px 14px", padding: 8, borderRadius: 14, background: after ? "linear-gradient(#f2f7e0, #dcedc4)" : "linear-gradient(#e2ecd4, #cfe0bb)", display: "grid", gridTemplateColumns: `repeat(${PLOT_COLS}, 1fr)`, gap: 6 }}>
      {ts.trees.map((t) => {
        if (after && ts.marked.includes(t.id)) {
          return (
            <div key={t.id} style={{ height: 74, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 16 }}>☀️</span>
              <span style={{ fontSize: 9, color: "#8a9a6e" }}>切りかぶ</span>
            </div>
          );
        }
        if (after) {
          const st = SIZE_STYLE[t.size];
          return (
            <div key={t.id} style={{ height: 74, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: st.fontSize + 6, lineHeight: 1 }}>🌳</span>
              <span style={{ fontSize: 9, color: "#5b6b4c" }}>{t.future ? "📍のびのび" : "枝が広がる"}</span>
            </div>
          );
        }
        return treeBtn(t);
      })}
    </div>
  );

  const meter = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 14px", fontSize: 12 }}>
      <span>{withRuby("｜材積《ざいせき》")}</span>
      <div style={{ flex: 1, position: "relative", height: 12, borderRadius: 6, background: "#e9e2cf" }}>
        <div style={{ position: "absolute", left: `${RATE_MIN * 100}%`, width: `${(RATE_MAX - RATE_MIN) * 100}%`, top: 0, bottom: 0, background: "#cfe3b8", borderRadius: 6 }} />
        <div style={{ position: "absolute", left: `${Math.min(99, pct)}%`, top: -3, width: 4, height: 18, background: pct >= RATE_MIN * 100 && pct <= RATE_MAX * 100 ? "#5f8f4a" : "#c0703f", borderRadius: 2, transition: "left 0.3s" }} />
      </div>
      <span>{pct}%</span>
      {seniorAt === "meter" && <span style={{ fontSize: 16 }}>👷👈</span>}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今日の選木は、先輩とやり直し</span></div>
        {plot()}
        {meter}
        <p className="game-line center-line">印のつけ方を、先輩ともう一度歩いて見直した。</p>
        <p className="game-line soft center-line">材積で数える・傷んだ木から・開けすぎない。（林の中身は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の林で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ts.redos === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">選木、承認された！</span></div>
        <p className="game-line soft center-line">5年後の、この林——</p>
        {plot(true)}
        <p className="game-line soft center-line">
          {perfect ? "一発承認。材積・傷んだ木・風の通り道、ぜんぶ読めていた。" : "承認された。切りかぶの場所に、光が差しこむ。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("木を伐ったのに、残った木は前より育つ。それが｜間伐《かんばつ》——「伐って守る」ひみつだ。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>次の班へ渡す</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{withRuby("｜伐《き》る木をえらぶ——｜選木《せんぼく》をたのむ")}</span>
        <span className="task-sub">やり直せるのは あと{THIN_REDO_LIMIT - ts.redos - 1}回</span>
      </div>

      {plot()}
      {meter}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "選木のめやす",
          body: (
            <>
              <p>{withRuby("伐る量は、本数でなく｜材積《ざいせき》（木の体積）で数える。目標は" + Math.round(RATE_MIN * 100) + "〜" + Math.round(RATE_MAX * 100) + "%。")}</p>
              <p>「傷あり」の木から先に。📍将来木は、ぜったい残す。</p>
              <p>横にならんだ3本を続けて伐ると、風の通り道ができてしまう。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{withRuby(note)}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          const r = thinServe(ts);
          setTs(r.state);
          if (r.state.outcome === "done") { setStep("done"); return; }
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          // staged: the senior WALKS TO the problem (where, never why)
          const v = thinValidate(r.state);
          if (v === "rate_low" || v === "rate_high") setSeniorAt("meter");
          else if (v === "damaged_left") {
            const t = r.state.trees.find((x) => x.damaged && !r.state.marked.includes(x.id));
            setSeniorAt(t ? t.id : null);
          } else if (v === "gap") {
            // stand at the widest cut lane
            const cutRow = r.state.trees.filter((x) => r.state.marked.includes(x.id));
            setSeniorAt(cutRow.length ? cutRow[Math.floor(cutRow.length / 2)].id : null);
          }
          setNote("先輩がだまって歩いていき、ある場所で立ち止まった。");
        }}
      >
        ✅ 印を見せる
      </button>
    </div>
  );
}
