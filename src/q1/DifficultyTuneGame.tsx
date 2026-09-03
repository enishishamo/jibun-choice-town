// Q1: 難易度調整 (gameType: difficulty_tune)
// 核: 「HPを下げる、だけが調整じゃない」— プレイログの証拠から原因を切り分け、
// 原因に合う調整を選ぶ。ズレた調整は再テストの数字が動かない。studioLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { TUNE_STAGES, TUNE_MISTAKE_LIMIT, newTuneState, tuneAct } from "./studioLogic";
import type { TuneState, Fix, StageLog } from "./studioLogic";

type Step = "work" | "failed" | "done";

const FIXES: { id: Fix; label: string; sub: string }[] = [
  { id: "add_telegraph", label: "予告を足す", sub: "攻撃の前に、光って知らせる" },
  { id: "add_signpost", label: "道しるべ", sub: "進む方向に、目印を置く" },
  { id: "lower_hp", label: "敵を弱く", sub: "敵のHPを下げる" },
  { id: "remap_buttons", label: "操作を直す", sub: "ボタンの配置を見直す" },
];

const evidenceLines = (st: StageLog): string[] => {
  const lines = [`クリアできた人：${st.clearRate}%`];
  if (st.deathsBeforeAttack) lines.push("倒された人の多くは、ボスが動く前にやられている");
  else if (st.wanderTime) lines.push("みんな同じ場所を、ぐるぐる歩き回っている");
  else if (st.quitAtMenu) lines.push("ボタン設定の画面で、やめてしまう人が多い");
  else lines.push("長いたたかいの末に、あと少しでやられている");
  return lines;
};

export default function DifficultyTuneGame({ onComplete }: Q1GameProps) {
  const [ts, setTs] = useState<TuneState>(() => newTuneState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("ログを読んで、原因に合う調整を選ぼう。");
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setTs(newTuneState());
    setNote("ログを読んで、原因に合う調整を選ぼう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const stage = ts.idx < TUNE_STAGES ? ts.stages[ts.idx] : null;

  // the log board IS the world: per-stage clear-rate bars + tester comments
  const board = (
    <div style={{ margin: "6px 14px", background: "#2c3440", borderRadius: 14, padding: "8px 10px", color: "#dfe6ee" }}>
      <div style={{ fontSize: 13.5, marginBottom: 6 }}>📊 プレイログ（遊びの記録）</div>
      {ts.stages.map((st, i) => (
        <div key={st.id} style={{ marginBottom: 6, opacity: i === ts.idx ? 1 : i < ts.idx ? 0.5 : 0.75 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span>{i < ts.idx ? "✅" : i === ts.idx ? "▶" : "・"}</span>
            <b>{st.name}</b>
            <span style={{ marginLeft: "auto", fontSize: 12 }}>{i < ts.idx ? "調整ずみ" : `クリア率 ${st.clearRate}%`}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#41505c", marginTop: 3 }}>
            <div style={{ width: `${i < ts.idx ? 55 : st.clearRate}%`, height: "100%", borderRadius: 4, background: i < ts.idx ? "#7fb98a" : "#d9a84a", transition: "width 0.6s" }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">調整は、ディレクターと相談に</span></div>
        {board}
        <p className="game-line center-line">再テストの数字が動かなかった。原因の切り分けから、いっしょにやり直すことに。</p>
        <p className="game-line soft center-line">ログは正直。どこで・どうやって失敗しているかが、原因を教えてくれる。（ログは毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別のログで</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ts.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">再テストで、数字が動いた！</span></div>
        {board}
        <p className="game-line soft center-line">
          {perfect ? "2ステージとも、原因に合う一手。テスターから「悔しいけど楽しい」の声。" : "クリア率が上がり、達成感の声はそのまま。それが良い調整。"}
        </p>
        <p className="game-line soft center-line">
          「かんたんにする」と「おもしろくする」はちがう。プランナーは、その線をログと相談しながら探すんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>調整案を送る</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{stage?.name}を、調整する（{ts.idx + 1}/{TUNE_STAGES}）</span>
        <span className="task-sub">まちがえられるのは あと{TUNE_MISTAKE_LIMIT - ts.mistakes - 1}回</span>
      </div>

      {board}

      {stage && (
        <div style={{ margin: "4px 14px", padding: "7px 10px", borderRadius: 10, background: "#f6f1e3", border: "1.5px solid #d8c9a8", fontSize: 16 }}>
          {evidenceLines(stage).map((l, i) => (
            <div key={i}>{i === 0 ? "📈 " : "💬 "}{l}</div>
          ))}
        </div>
      )}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "ログの読み方",
          body: (
            <>
              <p><strong>どこで・どうやって</strong>失敗しているかを見る。数字は原因のヒント。</p>
              <p>「敵を弱く」は最後の手。まず、伝わっていない情報がないかを疑う。</p>
              <p>調整のねらいは、かんたんにすることではなく「悔しい！もう1回」を作ること。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        {FIXES.map((f) => (
          <button
            key={f.id}
            className="choice-card"
            onClick={() => {
              const r = tuneAct(ts, f.id);
              setTs(r.state);
              if (r.state.outcome === "done") { setStep("done"); return; }
              if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
              if (!r.ok) setNote("…再テストの数字が、ぴくりとも動かない。ログをもう一度。");
              else setNote(null);
            }}
          >
            <span className="choice-name">{f.label}</span>
            <small style={{ opacity: 0.7 }}>{f.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
