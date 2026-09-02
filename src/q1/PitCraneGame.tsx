// Q1: 清掃工場の焼却炉運転員 (gameType: pit_crane)
// 核: 「クレーンは、炉に入る燃料の質をそろえる運転装置」— ごみ質を見て
// つかむ場所を選び、先読みで混ぜ、炉温を850〜950℃に保ち続ける。
// ルールは src/q1/wasteLogic.ts。850℃はダイオキシン類対策の一般則、
// 上限帯はこの工場の運転マニュアル値（架空施設）としてゲーム内資料に明示。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { PIT_TURNS, TEMP_MIN, newPit, pitStep, pitStability } from "./wasteLogic";
import type { PitState, CellType } from "./wasteLogic";

const CELL_STYLE: Record<CellType, { bg: string; label: string; emoji: string }> = {
  dry: { bg: "#d9b38c", label: "かわき", emoji: "📦" },
  wet: { bg: "#8fbcbb", label: "しめり", emoji: "💧" },
  mixed: { bg: "#a3c586", label: "まぜた", emoji: "🌀" },
  empty: { bg: "#e8e4da", label: "", emoji: "" },
};

type Step = "work" | "failed" | "done";

export default function PitCraneGame({ onComplete }: Q1GameProps) {
  const [s, setS] = useState<PitState>(() => newPit());
  const [step, setStep] = useState<Step>("work");
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>("クレーンで、どのごみをつかむ？");
  const [mixSel, setMixSel] = useState<number | null>(null);
  const [mixMode, setMixMode] = useState(false);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setS(newPit());
    setStep("work");
    setNote("クレーンで、どのごみをつかむ？");
    setMixSel(null);
    setMixMode(false);
    setAttempts((a) => a + 1);
  };

  const applyStep = (action: Parameters<typeof pitStep>[1]) => {
    const r = pitStep(s, action);
    setNote(r.note);
    if (r.event === "invalid") return;
    if (r.event === "overheat_fail" || r.event === "cold_fail") {
      setFailText(r.note);
      setStep("failed");
      return;
    }
    if (r.event === "cleared") {
      setS(r.state);
      setStep("done");
      return;
    }
    setS(r.state);
    setMixSel(null);
    setMixMode(false);
  };

  // final world state stays visible on the terminal screens — the gauge and
  // the pit ARE the explanation of what went wrong
  const finalPct = Math.max(0, Math.min(100, ((s.temp - 750) / 350) * 100));
  const finalBoard = (
    <div style={{ margin: "6px 12px" }}>
      <div style={{ position: "relative", height: 14, borderRadius: 7, background: "linear-gradient(90deg,#7fb2e5 0%,#7fb2e5 28%,#8fce8f 28%,#8fce8f 57%,#e5a97f 57%,#e5c77f 71%,#e57f7f 71%)" }}>
        <div style={{ position: "absolute", left: `${finalPct}%`, top: -3, width: 4, height: 20, background: s.temp >= TEMP_MIN && s.temp < 1000 ? "#2c7a2c" : "#c0392b", borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 6, fontSize: 15 }}>
        {s.grid.map((c, i) => (<span key={i} style={{ opacity: c === "empty" ? 0.3 : 1 }}>{CELL_STYLE[c].emoji}</span>))}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#8a7f6a" }}>最終ターンの炉温 {s.temp}℃ とピットのようす</div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">炉を止めて、点検へ</span>
        </div>
        {finalBoard}
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">ピットのごみの置き方は毎回ちがう。もう一度、質を見て運転しよう。</p>
        <button className="btn primary big" onClick={restart}>🔁 もう一度運転する</button>
      </div>
    );
  }

  if (step === "done") {
    const stable = pitStability(s) === "perfect";
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">今日の運転、安定して燃やしきった！</span>
        </div>
        <p className="game-line soft center-line">
          温度は {s.tempMin}〜{s.tempMax}℃。
          {stable ? "ねらい帯の中でふり幅も小さい、みごとな運転。混ぜて質をそろえた成果。" : "クリアはできた。混ぜるタイミングを先に仕込むと、もっと安定する。"}
          {attempts > 1 ? `（${attempts}回目の運転で成功）` : ""}
        </p>
        <p className="game-line soft center-line">
          燃やした熱は蒸気タービンで<strong>発電</strong>に。灰の体積はおよそ<strong>20分の1</strong>になる。
        </p>
        <button className="btn primary big" onClick={onComplete}>中央制御室へ知らせる</button>
      </div>
    );
  }

  const temp = s.temp;
  const pct = Math.max(0, Math.min(100, ((temp - 750) / 350) * 100));
  const inBand = temp >= TEMP_MIN && temp < 1000;
  const delivery = s.deliveries.find((d) => d.turn === s.turn);

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">ターン {s.turn}/{PIT_TURNS}：炉温 {temp}℃</span>
        <span className="task-sub">{delivery ? "🚛 このターン、収集車の搬入がある" : "850〜950℃に保とう"}</span>
      </div>

      {/* 温度ゲージ */}
      <div style={{ margin: "6px 12px" }}>
        <div style={{ position: "relative", height: 18, borderRadius: 9, background: "linear-gradient(90deg,#7fb2e5 0%,#7fb2e5 28%,#8fce8f 28%,#8fce8f 57%,#e5a97f 57%,#e5c77f 71%,#e57f7f 71%)" }}>
          <div style={{ position: "absolute", left: `${pct}%`, top: -4, width: 4, height: 26, background: inBand ? "#2c7a2c" : "#c0392b", borderRadius: 2, transition: "left 0.4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#777" }}>
          <span>750</span><span>850</span><span>950</span><span>1000℃</span>
        </div>
      </div>

      {/* ピット3x3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "8px 16px" }}>
        {s.grid.map((c, i) => (
          <button
            key={i}
            disabled={c === "empty"}
            onClick={() => {
              if (!mixMode) { applyStep({ kind: "grab", idx: i }); return; }
              if (mixSel === null) { setMixSel(i); setNote("もう1つ、となりのマスを選ぼう（かわき×しめり）。"); return; }
              if (mixSel === i) { setMixSel(null); return; }
              applyStep({ kind: "mix", a: mixSel, b: i });
            }}
            style={{
              height: 62,
              borderRadius: 12,
              border: mixSel === i ? "3px solid #4a90d9" : "2px solid rgba(0,0,0,0.12)",
              background: CELL_STYLE[c].bg,
              opacity: c === "empty" ? 0.45 : 1,
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20 }}>{CELL_STYLE[c].emoji}</span>
            <span>{CELL_STYLE[c].label}</span>
          </button>
        ))}
      </div>

      <div className="choice-row">
        <button
          className={`btn ${mixMode ? "primary" : ""}`}
          onClick={() => { setMixMode(!mixMode); setMixSel(null); setNote(mixMode ? "つかんで投入するモード。" : "まぜるモード：となり合う「かわき」と「しめり」を2つ選ぶ（このターンは投入なし）。"); }}
        >
          🌀 まぜる{mixMode ? "のをやめる" : ""}
        </button>
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[
          {
            id: "manual",
            icon: "📘",
            title: "この工場の運転マニュアル",
            body: (
              <>
                <p><strong>850℃以上</strong>を保つ（下回るとダイオキシン類をおさえられない）。
                  <strong>1000℃</strong>に達すると炉を傷める（この工場の決まり）。</p>
                <p>ごみの質: 📦かわき=よく燃える(+80) / 💧しめり=温度が下がる(-60) /
                  🌀まぜた=安定(+30)。何も入れないと -70。</p>
                <p>クレーンの「まぜる」は、かわきとしめりを均一にして<strong>燃料の質をそろえる</strong>大事な運転。</p>
              </>
            ),
          },
        ]}
      />

      {note && <p className="game-note">{note}</p>}
    </div>
  );
}
