// Q1: 排ガス・環境計測の担当 (gameType: gas_watch)
// 核: 「アラートの原因を切り分けてから、正しい相手に依頼する」— 点検には
// 時間がかかり、まちがった依頼をしている間に本当の原因は煙突へ達してしまう。
// 証拠マトリクスと症例生成は src/q1/wasteLogic.ts（矛盾症例は生成されない）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { GAS_TIME, newGasState, gasInspect, gasRequest, inspect } from "./wasteLogic";
import type { GasState, GasCheck, GasAction, GasCause } from "./wasteLogic";

const CHECKS: { id: GasCheck; label: string }[] = [
  { id: "calib", label: "🗓️ 計器の校正記録" },
  { id: "tank", label: "🧪 薬剤タンクの残量" },
  { id: "furnace", label: "🔥 炉の燃焼状態" },
  { id: "filter", label: "🌀 バグフィルタの差圧" },
];
const ACTIONS: { id: GasAction; label: string }[] = [
  { id: "refill", label: "🧪 保全へ「薬剤の補給」を依頼" },
  { id: "recalib", label: "🗓️ 計器の校正を手配" },
  { id: "notify_operator", label: "📞 運転員へ「燃焼の調整」を連絡" },
  { id: "stop_furnace", label: "🛑 炉停止を要請" },
];
const CAUSE_LABEL: Record<GasCause, string> = {
  chemical_out: "薬剤切れ",
  sensor_drift: "計器の異常（ドリフト）",
  incomplete_burn: "不完全燃焼",
};

type Step = "work" | "failed" | "done";

export default function GasWatchGame({ onComplete }: Q1GameProps) {
  const [gs, setGs] = useState<GasState>(() => newGasState());
  const [step, setStep] = useState<Step>("work");
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);
  const c = gs.c;
  const time = gs.time;
  const evidence = gs.evidence;

  const restart = () => {
    setGs(newGasState());
    setNote(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  // どの原因がまだ証拠と両立するか（消し込み表示用）
  const alive = (cause: GasCause) => {
    for (const e of evidence) {
      const would = inspect({ cause, alertMeter: c.alertMeter }, e.check);
      if (would.text !== e.text) return false;
    }
    return true;
  };

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">基準超過の一歩手前だった</span></div>
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">アラートの原因は毎回ちがう。切り分けてから動こう。</p>
        <button className="btn primary big" onClick={restart}>🔁 次のアラートに備える</button>
      </div>
    );
  }

  if (step === "done") {
    const quick = time >= 2;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">原因を突き止めて、正しく依頼できた！</span></div>
        <p className="game-line soft center-line">
          原因は「{CAUSE_LABEL[c.cause]}」だった。
          {quick ? "少ない点検で確定させた、みごとな切り分け。" : "確定はできた。点検の順番を工夫すると、もっと早く絞れる。"}
          {attempts > 1 ? `（${attempts}回目のアラートで成功）` : ""}
        </p>
        <p className="game-line soft center-line">
          清掃工場の測定結果は<strong>まちに公開</strong>される。「まちに説明できる」ことが、この仕事の芯。
        </p>
        <button className="btn primary big" onClick={onComplete}>記録をまとめて公開する</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">⚠️ {c.alertMeter} の値が管理値に近づいている</span>
        <span className="task-sub">のこり時間 {"⏱".repeat(time)}{"・".repeat(GAS_TIME - time)}（点検1回=1コマ）</span>
      </div>

      {/* 容疑リスト（消し込み） */}
      <div style={{ display: "flex", gap: 6, margin: "6px 14px", flexWrap: "wrap" }}>
        {(Object.keys(CAUSE_LABEL) as GasCause[]).map((cause) => (
          <span
            key={cause}
            style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 12,
              background: alive(cause) ? "#fdf3d8" : "#e8e8e8",
              textDecoration: alive(cause) ? "none" : "line-through",
              opacity: alive(cause) ? 1 : 0.5,
            }}
          >
            {CAUSE_LABEL[cause]}
          </span>
        ))}
      </div>

      {evidence.length === 0 && (
        <p className="game-line soft center-line">
          本当に値が上がっているのか、計器がおかしいのか、まだ分からない。どこから点検する？
        </p>
      )}
      {evidence.map((e, i) => (
        <p key={i} className="game-note" style={{ margin: "4px 14px" }}>
          🔎 {CHECKS.find((k) => k.id === e.check)?.label}：{e.text}
        </p>
      ))}
      {note && <p className="game-note">{note}</p>}

      <p className="pick-title">点検する（1コマ）</p>
      <div className="choice-row wrap">
        {CHECKS.map((k) => (
          <button
            key={k.id}
            className="choice-card"
            disabled={evidence.some((e) => e.check === k.id) || time <= 1}
            style={{ opacity: evidence.some((e) => e.check === k.id) || time <= 1 ? 0.45 : 1 }}
            onClick={() => {
              setGs(gasInspect(gs, k.id));
              setNote(null);
            }}
          >
            <span className="choice-name">{k.label}</span>
          </button>
        ))}
      </div>

      <p className="pick-title">依頼・連絡する（1回勝負）</p>
      <div className="choice-row wrap">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className="choice-card"
            onClick={() => {
              const r = gasRequest(gs, a.id);
              setGs(r);
              if (r.outcome === "solved") { setStep("done"); return; }
              setFailText(
                a.id === "stop_furnace"
                  ? "確かめずに炉停止を要請してしまった。まち中のごみ処理が止まり、本当の原因もわからないまま——「切り分けてから動く」が鉄則だった。"
                  : `その依頼を進めている間に、本当の原因（${CAUSE_LABEL[c.cause]}）が進んでしまい、煙突の値が管理値を超えかけた。`,
              );
              setStep("failed");
            }}
          >
            <span className="choice-name">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
