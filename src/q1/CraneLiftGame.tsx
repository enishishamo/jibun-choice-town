// Q1: ガントリークレーン運転士 (gameType: crane_lift)
// 核: 「速さと安全がぶつかったら、止まるのが正解」— 風速計・ロック表示・地上
// 合図を読み、おろす/ゆっくり/止めて確認/見合わせる を選ぶ。危険な操作は
// 安全装置と指揮者がロジック側で止める（事故は画面に起こさない）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import {
  CRANE_LIFTS, CRANE_STRIKE_LIMIT, CRANE_DELAY_LIMIT, WIND_SLOW, WIND_STOP,
  newCraneState, craneAct,
} from "./portLogic";
import type { CraneState, CraneAction } from "./portLogic";

const ACTIONS: { id: CraneAction; label: string }[] = [
  { id: "lower", label: "▼ おろす" },
  { id: "slow", label: "🐢 ゆっくり" },
  { id: "recheck", label: "✋ 止めて確認" },
  { id: "hold", label: "⏸ 見合わせる" },
];

type Step = "work" | "failed" | "done";

export default function CraneLiftGame({ onComplete }: Q1GameProps) {
  const [cs, setCs] = useState<CraneState>(() => newCraneState());
  const [step, setStep] = useState<Step>("work");
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setCs(newCraneState());
    setNote(null);
    setStopped(false);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const [stopped, setStopped] = useState(false); // last act was stopped mid-air
  const lift = cs.idx < CRANE_LIFTS ? cs.lifts[cs.idx] : null;
  const windPct = lift ? Math.min(100, (lift.wind / 22) * 100) : 0;

  // the cab panel IS the world: gauges + delivered row stay on all screens
  const panel = (
    <div style={{ margin: "6px 14px", background: "#2e3440", borderRadius: 14, padding: "10px 12px", color: "#e9edf2" }}>
      {lift ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span>💨 風速 {lift.wind}m</span>
            <div style={{ flex: 1, position: "relative", height: 12, borderRadius: 6, background: "linear-gradient(90deg,#7fae6a 0%,#7fae6a 45%,#e5c77f 45%,#e5c77f 72%,#e57f7f 72%)" }}>
              <div style={{ position: "absolute", left: `${windPct}%`, top: -3, width: 4, height: 18, background: "#fff", borderRadius: 2, transition: "left 0.5s" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, alignItems: "center" }}>
            <span>
              🔒 ロック{" "}
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ color: i < lift.lockPins ? "#8fce8f" : "#e57f7f" }}>●</span>
              ))}
              {lift.lockPins < 4 && <small style={{ color: "#e5a97f" }}> 4点そろっていない</small>}
            </span>
            <span>
              📣 地上合図 {lift.cue === "match" ? <span style={{ color: "#8fce8f" }}>指示と一致</span> : <span style={{ color: "#e5a97f" }}>指示とちがう…？</span>}
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13 }}>計器盤：待機中</div>
      )}
      <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center", fontSize: 12 }}>
        <span>🚛 運んだ箱</span>
        {Array.from({ length: CRANE_LIFTS }).map((_, i) => (
          <span key={i} style={{ opacity: i < cs.done ? 1 : 0.25 }}>📦</span>
        ))}
        {stopped && <span style={{ color: "#e5a97f" }}>⛔📦吊り直し</span>}
        <span style={{ marginLeft: "auto" }}>
          {Array.from({ length: CRANE_STRIKE_LIMIT }).map((_, i) => (
            <span key={i} style={{ color: i < cs.strikes ? "#e57f7f" : "#4a5160" }}>⬤</span>
          ))}
          <small> 非常停止</small>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center", fontSize: 11, color: "#aab3c0" }}>
        <span>🌙 夜のこり</span>
        {Array.from({ length: CRANE_DELAY_LIMIT }).map((_, i) => (
          <span key={i} style={{ width: 18, height: 7, borderRadius: 4, background: i < CRANE_DELAY_LIMIT - cs.delays ? "#5c81a8" : "#3a4150" }} />
        ))}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今夜の運転は、ここまで</span></div>
        {panel}
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">交代した先輩の運転を、となりで見せてもらった。（風も合図も、夜ごとにちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の夜へ</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = cs.strikes === 0 && cs.delays === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">{CRANE_LIFTS}本、ぶじ下ろしきった！</span></div>
        {panel}
        <p className="game-line soft center-line">
          {perfect
            ? "止まるべき時に止まり、動かせる時に動かした。お手本の夜。"
            : `終えられた。非常停止${cs.strikes}回・待ち${cs.delays}回。計器と合図の読みが速さになる。`}
          {attempts > 1 ? `（${attempts}晩目で完走）` : ""}
        </p>
        <p className="game-line soft center-line">
          {withRuby("巨大クレーンの｜荷役《にやく》（積みおろし）でいちばんえらいのは、スピードより「止まれる」こと。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>日誌をつける</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">吊り {Math.min(cs.idx + 1, CRANE_LIFTS)}/{CRANE_LIFTS} 本目</span>
        <span className="task-sub">計器と合図を見てから、動かす</span>
      </div>

      {panel}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "運用きてい（この港のきまり）",
          body: (
            <>
              <p><strong>風：</strong>{WIND_SLOW}mをこえたら「ゆっくり」。{WIND_STOP}mをこえたら「見合わせる」。</p>
              <p><strong>ロック：</strong>4点そろうまで吊らない。そろっていなければ「止めて確認」。</p>
              <p><strong>合図：</strong>地上の合図が指示とちがったら、動かさずに「止めて確認」。</p>
              <p>正常なのに止まってばかりだと、夜のうちに終わらない。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className="choice-card"
            onClick={() => {
              const r = craneAct(cs, a.id);
              setCs(r.state);
              if (r.state.outcome === "safety_fail") {
                setFailText("非常停止が続いた。だれもケガはない——装置と指揮者が止めてくれたから。でも今夜は運転を交代。");
                setStep("failed");
                return;
              }
              if (r.state.outcome === "dawn_fail") {
                setFailText("止まってばかりで夜が明けてしまい、船の出港が遅れた。動かせる時を見きわめるのも仕事。");
                setStep("failed");
                return;
              }
              if (r.unsafe) { setNote("🔴 ブザー。箱は宙で止まり、クレーンが自動停止した。同じ箱を、もう一度。"); setStopped(true); }
              else if (a.id !== r.correct) { setNote("…無線がしずか。夜だけが、少しすすんだ。"); setStopped(false); }
              else { setNote(null); setStopped(false); }
              if (r.state.outcome === "done") setStep("done");
            }}
          >
            <span className="choice-name">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
