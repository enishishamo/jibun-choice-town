// Q1: 港の検数員 (gameType: tally_check)
// 核: 「数えるだけじゃない。受け渡しを証明する」— 書類と現物の3点照合
// （番号・封印・外観）。損傷は「いつついたか」を断定しない公正な記録が正解。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { TALLY_BOXES, TALLY_MISTAKE_LIMIT, newTallyState, tallyAct } from "./portLogic";
import type { TallyState, TallyAction, DamageWording } from "./portLogic";

type Step = "work" | "wording" | "failed" | "done";

const WORDINGS: { id: DamageWording; label: string; sub: string }[] = [
  { id: "neutral", label: "見たまま書く", sub: "「右下にへこみ。時点は不明」" },
  { id: "blame_now", label: "今と書く", sub: "「今回の荷役でへこんだ」" },
  { id: "ignore", label: "書かない", sub: "小さいへこみだから…" },
];

export default function TallyCheckGame({ onComplete }: Q1GameProps) {
  const [ts, setTs] = useState<TallyState>(() => newTallyState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>(null);
  const [processed, setProcessed] = useState<{ id: string; wrong: boolean }[]>([]);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setTs(newTallyState());
    setNote(null);
    setProcessed([]);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  // gate strip: checked boxes line up for the gate (world state)
  const gateStrip = (
    <div style={{ display: "flex", gap: 6, margin: "6px 14px", alignItems: "center", fontSize: 15 }}>
      <span style={{ fontSize: 11, color: "#6d6350" }}>ゲート通過待ち</span>
      {processed.map((_, i) => (<span key={i}>📦</span>))}
      {Array.from({ length: TALLY_BOXES - processed.length }).map((_, i) => (
        <span key={`e${i}`} style={{ opacity: 0.2 }}>📦</span>
      ))}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">記録が合わず、朝の受け渡しが止まった</span></div>
        {gateStrip}
        <p className="game-line center-line">
          船側と荷主側の記録がそろわなくて、先輩が照合をやり直した。
          {withRuby("｜検数《けんすう》の記録は、受け渡しの「証拠」になるんだ。")}
        </p>
        <p className="game-line soft center-line">（箱の番号も封印も、毎晩ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 次の船で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ts.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">{TALLY_BOXES}箱の照合、完了！</span></div>
        {gateStrip}
        <p className="game-line soft center-line">
          {perfect ? "全箱ノーミス。番号・封印・外観を、ひと組で見られた。" : `照合ちがい${ts.mistakes}回。3点をひと組で見るのがコツ。`}
          {attempts > 1 ? `（${attempts}晩目で安定）` : ""}
        </p>
        <p className="game-line soft center-line">
          検数員は船側にも荷主側にも味方しない。だから「見たまま」を書く——それが公正の証明になる。
        </p>
        <button className="btn primary big" onClick={onComplete}>まとめる</button>
      </div>
    );
  }

  const b = ts.boxes[ts.idx];

  const handle = (a: TallyAction, wording?: DamageWording) => {
    const r = tallyAct(ts, a, wording);
    setTs(r.state);
    const ok = a === r.correct && !r.wrongWording;
    if (ok) setProcessed((h) => [...h, { id: b.id, wrong: false }]);
    if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
    if (!ok) {
      // the box is NOT handed over — it returns to the booth
      setNote(r.wrongWording
        ? "…事務所から記録が差し戻された。この箱は、もう一度。"
        : "…無線が入った。「その箱、まだ渡せない」——もう一度。");
    } else setNote(null);
    setStep(r.state.outcome === "done" ? "done" : "work");
  };

  if (step === "wording") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">損傷を、どう記録する？</span>
          <span className="task-sub">記録は受け渡しの証拠になる</span>
        </div>
        {gateStrip}
        <p className="game-note" style={{ margin: "4px 14px" }}>📦 {b.id}：とびらの右下に、へこみが見える。</p>
        <div className="choice-row wrap">
          {WORDINGS.map((w) => (
            <button key={w.id} className="choice-card" onClick={() => { setStep("work"); handle("record_damage", w.id); }}>
              <span className="choice-name">{w.label}</span>
              <small style={{ opacity: 0.7 }}>{w.sub}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">箱 {ts.idx + 1}/{TALLY_BOXES} の受け渡し照合</span>
        <span className="task-sub">まちがえられるのは あと{TALLY_MISTAKE_LIMIT - ts.mistakes - 1}回</span>
      </div>

      {gateStrip}

      <div style={{ display: "flex", gap: 8, margin: "6px 14px" }}>
        <div style={{ flex: 1, background: "#fffdf5", border: "2px solid #d8ccae", borderRadius: 12, padding: "8px 10px", fontSize: 12 }}>
          <div style={{ fontSize: 11, color: "#8a7f6a" }}>📄 書類（タリーシート）</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 4 }}>{b.docNo}</div>
          <div style={{ marginTop: 4 }}>封印 <span style={{ fontFamily: "monospace" }}>{b.docSeal}</span></div>
          <div style={{ marginTop: 4, color: "#8a7f6a" }}>外観の記載：なし</div>
        </div>
        <div style={{ flex: 1, background: "#e8ecef", border: "2px solid #9aa4ad", borderRadius: 12, padding: "8px 10px", fontSize: 12 }}>
          <div style={{ fontSize: 11, color: "#5c666f" }}>📦 現物のコンテナ</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 4 }}>{b.realNo}</div>
          <div style={{ marginTop: 4 }}>封印 <span style={{ fontFamily: "monospace" }}>{b.realSeal}</span></div>
          <div style={{ marginTop: 4 }}>{b.dentVisible ? "🔍 とびら右下に、へこみ" : "外観：とくに気づく点なし"}</div>
        </div>
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "検数のきまり",
          body: (
            <>
              <p>{withRuby("番号・｜封印《ふういん》・外観を、書類とひと組で照合する。")}</p>
              <p>番号は11文字。1文字ずつ、指でなぞって見比べる。</p>
              <p>ちがいがあれば照会（といあわせ）。ちがいがないのに照会すると、作業が止まる。</p>
              <p>損傷は「見たまま」を記録する。<strong>いつついたかは、確かめられた時だけ</strong>書く。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        <button className="choice-card" onClick={() => handle("accept")}><span className="choice-name">✅ 正常受け</span></button>
        <button className="choice-card" onClick={() => handle("query_number")}><span className="choice-name">🔢 番号を照会</span></button>
        <button className="choice-card" onClick={() => handle("query_seal")}><span className="choice-name">🔏 封印を照会</span></button>
        <button className="choice-card" onClick={() => setStep("wording")}><span className="choice-name">📝 損傷を記録</span></button>
      </div>
    </div>
  );
}
