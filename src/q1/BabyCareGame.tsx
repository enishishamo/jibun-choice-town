// Q1: 飼育員 (gameType: baby_care)
// 核: 「単発の数字でなく、傾向で見立てる」— 毎朝体重を量って成長曲線に足し、
// 飼育日誌と重ねて 順調/ミルクを調整/獣医に相談 の3値を判定する。
// ルールは src/q1/zooLogic.ts（毎週かならず調整の日と相談の日が1つずつある）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { BABY_DAYS, BABY_MISTAKE_LIMIT, newBabyState, babyMakeCall } from "./zooLogic";
import type { BabyState, BabyCall } from "./zooLogic";

const BASE_WEIGHT = 180; // g at day 0 (fictional red panda cub)

const CALLS: { id: BabyCall; label: string }[] = [
  { id: "ok", label: "🙂 順調（このまま）" },
  { id: "adjust", label: "🍼 ミルクの量を調整する" },
  { id: "consult", label: "🩺 獣医さんに相談する" },
];

type Step = "work" | "failed" | "done";

export default function BabyCareGame({ onComplete }: Q1GameProps) {
  const [bs, setBs] = useState<BabyState>(() => newBabyState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false); // mentor points back at the data
  const [calls, setCalls] = useState<BabyCall[]>([]); // the week's decisions, etched on the chart
  const [attempts, setAttempts] = useState(1);
  const days = bs.days;
  const idx = Math.min(bs.idx, BABY_DAYS - 1);
  const mistakes = bs.mistakes;

  const restart = () => {
    setBs(newBabyState());
    setNote(null);
    setNudge(false);
    setCalls([]);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const weights: number[] = [];
  let w = BASE_WEIGHT;
  for (let i = 0; i <= idx && i < BABY_DAYS; i++) {
    w += days[i].delta;
    weights.push(w);
  }

  // the growth chart is the world: it stays visible on terminal screens, and
  // every call the player made is etched under its day
  const CALL_ICON: Record<BabyCall, string> = { ok: "🙂", adjust: "🍼", consult: "🩺" };
  const pts = weights.map((wt, i) => `${20 + i * 60},${120 - (wt - BASE_WEIGHT) * 1.6}`).join(" ");
  const curveSvg = (
    <div className="body-stage" style={{ padding: "10px 0" }}>
      <svg viewBox="0 0 320 152" style={{ width: "92%", maxWidth: 360, background: "#fffdf5", borderRadius: 12, border: nudge ? "2px solid #d9744a" : "1px solid #e5ddc8", boxShadow: nudge ? "0 0 10px rgba(217,116,74,0.55)" : "none", transition: "box-shadow 0.4s" }}>
        <text x="8" y="14" fontSize="10" fill="#999">たいじゅう(g) — 成長曲線</text>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={20 + i * 60} y1={20} x2={20 + i * 60} y2={125} stroke="#eee" />
        ))}
        <polyline points={pts} fill="none" stroke="#d98f4a" strokeWidth="3" strokeLinecap="round" />
        {weights.map((wt, i) => (
          <circle key={i} cx={20 + i * 60} cy={120 - (wt - BASE_WEIGHT) * 1.6} r="5" fill={i === idx && step === "work" ? "#c0392b" : "#d98f4a"} />
        ))}
        {weights.map((_, i) => (
          <text key={i} x={20 + i * 60} y={135} fontSize="9" textAnchor="middle" fill="#888">{i + 1}日</text>
        ))}
        {calls.map((cl, i) => (
          <text key={i} x={20 + i * 60} y={149} fontSize="11" textAnchor="middle">{CALL_ICON[cl]}</text>
        ))}
      </svg>
      <span className="body-cap">🔴 今朝の点。きみの見立てが日付の下に残る</span>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今週は、先輩と一緒に</span></div>
        {curveSvg}
        <p className="game-line center-line">
          見立てがちがう日が続いたので、先輩飼育員が交代して見立てのコツを教えてくれた。
          赤ちゃんはチームがしっかりケアしているよ。
        </p>
        <p className="game-line soft center-line">曲線の形と日誌のサインを、あわせて読むのがコツ。（週のようすは毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 来週の担当にもう一度挑戦</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">今週の見立て、おつかれさま！</span></div>
        {curveSvg}
        <p className="game-line soft center-line">
          {perfect
            ? "5日間ぜんぶ正しい見立て。単発の数字にまどわされず、傾向とサインで判断できた。"
            : `見立てちがい${mistakes}回${attempts > 1 ? `・${attempts}週目で安定` : ""}。曲線の「形」を見るのがコツ。`}
        </p>
        <p className="game-line soft center-line">
          きみの飼育日誌は、獣医さんの診察の<strong>大事な手がかり</strong>になる。
          野生動物は不調をかくすから、毎日の小さな変化のメモが宝物なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>日誌を書いて引き継ぐ</button>
      </div>
    );
  }

  const d = days[idx];

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{idx + 1}日目の朝：体重 {weights[idx]}g（{d.delta >= 0 ? "+" : ""}{d.delta}g）</span>
        <span className="task-sub">見立てをまちがえられるのは あと{BABY_MISTAKE_LIMIT - mistakes - 1}回</span>
      </div>

      {curveSvg}

      <p className="game-note" style={{ margin: "4px 14px", border: nudge ? "2px solid #d9744a" : undefined, borderRadius: nudge ? 8 : undefined, boxShadow: nudge ? "0 0 10px rgba(217,116,74,0.55)" : undefined, transition: "box-shadow 0.4s" }}>
        📔 今朝の日誌：ミルクの飲み残し{d.milkLeftover ? "あり" : "なし"} ・ うんち{d.badStool ? "がゆるい" : "ふつう"} ・ 動き{d.lowActivity ? "が少ない" : "ふつう"}
      </p>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "見立てのめやす（先輩のメモ）",
          body: (
            <>
              <p><strong>🩺 相談：</strong>体重が減って、しかも「うんちがゆるい」か「動きが少ない」が重なった日。</p>
              <p><strong>🍼 調整：</strong>増えない日が2日続いて、飲み残しがある（＝量やあげ方が合っていないかも）。</p>
              <p><strong>🙂 順調：</strong>それ以外。<strong>1日だけの小さな凹みはよくあること</strong>——単発の数字であわてない。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        {CALLS.map((c) => (
          <button
            key={c.id}
            className="choice-card"
            onClick={() => {
              const { state, correct } = babyMakeCall(bs, c.id);
              setBs(state);
              setCalls((h) => [...h, c.id]);
              if (c.id === correct) {
                setNote(
                  correct === "ok" ? "うん、この形なら大丈夫。" :
                  correct === "adjust" ? "ミルクの量と回数を、獣医さん・栄養担当と相談して調整した。" :
                  "すぐ獣医さんへ。日誌のメモが診察の手がかりになる。",
                );
                setNudge(false);
              } else {
                // staged hint: the game does NOT explain the rule on a mistake.
                // 1st miss = the mentor silently re-opens the data (visual nudge);
                // the 2nd miss ends the week (mentor takeover teaches the method).
                setNote("…先輩は何も言わず、成長曲線と今朝の日誌をもう一度ならべて見せた。");
                setNudge(true);
              }
              if (state.outcome === "mentor_fail") setStep("failed");
              else if (state.outcome === "done") setStep("done");
            }}
          >
            <span className="choice-name">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
