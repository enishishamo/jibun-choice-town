// Q1: 伐木作業者 (gameType: fell_direction)
// 核: 「合図→退避→それから切る。無理な木は機械へ」— 傾き×障害物×手順の
// 空間判断。危険は指揮者とワイヤーがロジック側で止める（事故は起こさない）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { FELL_TREES, FELL_STRIKE_LIMIT, newFellState, fellAct } from "./forestLogic";
import type { FellState, Dir } from "./forestLogic";

const DIR_LABEL: Record<Dir, string> = { N: "↑ 山側", E: "→ 東", S: "↓ 谷側", W: "← 西" };
const DIR_POS: Record<Dir, { left: string; top: string }> = {
  N: { left: "50%", top: "12%" },
  S: { left: "50%", top: "88%" },
  E: { left: "88%", top: "50%" },
  W: { left: "12%", top: "50%" },
};

type Step = "work" | "failed" | "done";

export default function FellDirectionGame({ onComplete }: Q1GameProps) {
  const [fs, setFs] = useState<FellState>(() => newFellState());
  const [step, setStep] = useState<Step>("work");
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [falling, setFalling] = useState<Dir | null>(null);
  const [snapped, setSnapped] = useState<Dir | null>(null); // wire caught the tree mid-tilt
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setFs(newFellState());
    setNote(null);
    setFalling(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const c = fs.idx < FELL_TREES ? fs.cases[fs.idx] : null;

  // the stand IS the world: tree + lean arrow + obstacles + progress row
  const stand = (
    <div style={{ margin: "6px 14px" }}>
      {c && (
        <div style={{ position: "relative", height: 168, borderRadius: 14, background: "radial-gradient(circle at 50% 55%, #e8f0d8, #cadfb4)", border: "2px solid #b7d2a6", overflow: "hidden" }}>
          {/* the tree, leaning; falls with a CSS rotation when cut */}
          <span
            style={{
              position: "absolute", left: "50%", top: "48%", fontSize: 54,
              transform: `translate(-50%, -50%) rotate(${falling ? (falling === "E" ? 80 : falling === "W" ? -80 : falling === "S" ? 12 : -12) : snapped ? (snapped === "E" ? 28 : snapped === "W" ? -28 : snapped === "S" ? 8 : -8) : c.lean === "E" ? 10 : c.lean === "W" ? -10 : c.lean === "S" ? 4 : -4}deg) ${falling === "N" ? "scaleY(0.55)" : falling === "S" ? "scaleY(1.1)" : ""}`,
              transformOrigin: "50% 90%", transition: "transform 0.7s ease-in",
            }}
          >
            🌲
          </span>
          {/* lean arrow */}
          <span style={{ position: "absolute", left: "50%", top: "26%", transform: "translateX(-50%)", fontSize: 12, background: "rgba(255,253,245,0.9)", borderRadius: 8, padding: "1px 8px" }}>
            かたむき: {DIR_LABEL[c.lean]}
          </span>
          {/* obstacles */}
          {c.blocked.map((d) => (
            <span key={d} style={{ position: "absolute", ...DIR_POS[d], transform: "translate(-50%, -50%)", fontSize: 20 }} title="障害物">
              {d === "S" ? "🏞" : d === "N" ? "📍🌲" : "🚜"}
            </span>
          ))}
          {snapped && (
            <span style={{ position: "absolute", left: "50%", top: "40%", transform: "translateX(-50%)", fontSize: 16 }}>🪢⛓</span>
          )}
          {/* escape route marker */}
          <span style={{ position: "absolute", right: 8, bottom: 6, fontSize: 10, color: "#5c7250", background: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "1px 7px" }}>
            {fs.signaled ? "📣 合図ずみ・退避よし" : "…まだ合図していない"}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", fontSize: 13 }}>
        <span style={{ fontSize: 11, color: "#6d6350" }}>今日のぶん</span>
        {fs.felled.map((f, i) => (
          <span key={i}>{f.dir === "machine" ? "🚜" : "🪵"}</span>
        ))}
        {Array.from({ length: FELL_TREES - fs.felled.length }).map((_, i) => (
          <span key={`e${i}`} style={{ opacity: 0.25 }}>🌲</span>
        ))}
        <span style={{ marginLeft: "auto" }}>
          {Array.from({ length: FELL_STRIKE_LIMIT }).map((_, i) => (
            <span key={i} style={{ color: i < fs.strikes ? "#c0392b" : "#cfc6ad" }}>⬤</span>
          ))}
          <small style={{ fontSize: 10, color: "#6d6350" }}> 赤笛</small>
        </span>
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今日の伐倒は、ここまで</span></div>
        {stand}
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">だれもケガはない。止めてくれる仲間がいるから、この仕事は続けられる。</p>
        <button className="btn primary big" onClick={restart}>🔁 別の日に</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = fs.strikes === 0 && fs.delays === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">{FELL_TREES}本、ぶじ完了！</span></div>
        {stand}
        <p className="game-line soft center-line">
          {perfect
            ? "合図・退避・方向、ぜんぶ読めていた。機械にたのむ判断もふくめて満点。"
            : "終えられた。切る前の段どりが、倒れる方向を決める。"}
          {attempts > 1 ? `（${attempts}日目で完走）` : ""}
        </p>
        <p className="game-line soft center-line">
          {withRuby("木が倒れはじめてから逃げ道を探すのでは、おそい。｜受け口《うけぐち》を入れる前に、ぜんぶ決めておくんだ。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>道具を片づける</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{Math.min(fs.idx + 1, FELL_TREES)}本目：どう倒す？</span>
        <span className="task-sub">切る前に、合図と退避の確認</span>
      </div>

      {stand}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "伐倒のきまり",
          body: (
            <>
              <p><strong>順番：</strong>📣合図して、みんなの退避を確認してから切る。</p>
              <p><strong>方向：</strong>かたむきと反対には倒せない。📍将来木・🚜機械・🏞沢の方向もダメ。</p>
              <p>どの方向もダメな木は、無理をしない。ウインチと機械の班にたのむ。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        <button
          className="choice-card"
          style={{ opacity: fs.signaled ? 0.5 : 1 }}
          onClick={() => {
            const r = fellAct(fs, { kind: "signal" });
            setFs(r.state);
            setNote("📣 ホイッスル。全員の退避を目で確認した。");
          }}
        >
          <span className="choice-name">📣 合図する</span>
        </button>
        {(["N", "E", "S", "W"] as Dir[]).map((d) => (
          <button
            key={d}
            className="choice-card"
            onClick={() => {
              const wasSignaled = fs.signaled;
              const r = fellAct(fs, { kind: "cut", dir: d });
              if (r.ok) {
                setFalling(d);
                setNote(null);
                window.setTimeout(() => {
                  setFalling(null);
                  setFs(r.state);
                  if (r.state.outcome === "done") setStep("done");
                }, 750);
                return;
              }
              setFs(r.state);
              // the world reacts — but ONLY if the saw actually started: a cut
              // attempted before the signal is stopped BEFORE the tree moves
              // (crossed arms, engines off), so nothing tilts.
              if (wasSignaled) {
                setSnapped(d);
                window.setTimeout(() => setSnapped(null), 900);
              }
              if (r.state.outcome === "safety_fail") {
                setFailText("赤笛が2回。今日の伐倒は先輩と交代になった。");
                setStep("failed");
                return;
              }
              setNote(r.state.refusal ?? null);
            }}
          >
            <span className="choice-name">🪓 {DIR_LABEL[d]}</span>
          </button>
        ))}
        <button
          className="choice-card"
          onClick={() => {
            const r = fellAct(fs, { kind: "handoff" });
            setFs(r.state);
            if (r.state.outcome === "dusk_fail") {
              setFailText("機械班にたのんでばかりで、日が暮れてしまった。");
              setStep("failed");
              return;
            }
            if (r.ok) setNote("🚜 ウインチ班が来て、ワイヤーで安全に倒した。いい判断。");
            else setNote(r.state.refusal ?? null);
            if (r.state.outcome === "done") setStep("done");
          }}
        >
          <span className="choice-name">🚜 機械にたのむ</span>
        </button>
      </div>
    </div>
  );
}
