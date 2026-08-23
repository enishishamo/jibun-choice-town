// Q1: 臨床検査技師 (gameType: lab_check)
// B: 届いた血液から、からだの中を知る情報をつくる。
// C: 検体ラベル・検体の状態・基準範囲。ラベルを確認しないと取り違えに
//    気づけず、状態を見ないと「その結果を報告してよいか」が分からない。
// D: 受け取り確認 → 測定 → 結果を基準と見比べ → 疑わしい値は測り直す →
//    確認できたものだけ報告する。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

// ※検査値はプロトタイプ用の設定。基準範囲は子ども向けに簡略化。
interface Row { id: string; name: string; value: string; ref: string; high?: boolean; suspect?: boolean }
const RESULT: Row[] = [
  { id: "wbc", name: "白血球（WBC）", value: "13,200 /μL", ref: "3,300〜8,600", high: true },
  { id: "crp", name: "CRP（炎症のめやす）", value: "12.4 mg/dL", ref: "0.3以下", high: true },
  { id: "hb", name: "ヘモグロビン", value: "13.2 g/dL", ref: "13.0〜17.0" },
  { id: "k", name: "カリウム", value: "6.8 mEq/L", ref: "3.5〜5.0", high: true, suspect: true },
];

type Step = "receive" | "run" | "review" | "recheck" | "report";

export default function LabCheckGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("receive");
  const [labelOk, setLabelOk] = useState(false);
  const [stateSeen, setStateSeen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [rechecked, setRechecked] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);

  const docs = [
    { id: "ref", icon: "📏", title: "基準範囲とは",
      body: <p>「だいたいこのくらいなら、ふつう」という目安。ここから外れていたら、からだで何か起きているサインかもしれない。</p> },
    { id: "quality", icon: "🧪", title: "検体の状態でも数字は変わる",
      body: (<>
        <p>血液の採り方や運び方によっては、じっさいの体の中とちがう数字になることがある。</p>
        <p>たとえば<strong>採血のときに血球がこわれる（溶血）</strong>と、カリウムの値が実際より高く出ることがある。</p>
      </>) },
  ];

  if (step === "receive") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">とどいた検体を、まず確かめよう</span>
          <span className="task-sub">名前・検査の種類・検体の状態</span>
        </div>
        <div className="tube-card">
          <span className="tube-emoji">🩸</span>
          <div className="tube-info">
            <p><b>ラベル</b>：田中さん（70代・男性）／血液検査</p>
            <p><b>依頼</b>：救急外来より</p>
            {stateSeen && <p className="soft-note">見た目：うすく赤みがかっている（溶血のうたがい）</p>}
          </div>
        </div>
        <div className="stack">
          <button className={`btn choice ${labelOk ? "on" : ""}`} onClick={() => setLabelOk(true)}>
            <span className="tweak-check">{labelOk ? "✓" : "＋"}</span>
            <span className="tweak-body"><b>ラベルと依頼を照合する</b><small>ちがう人の検体だと、結果は意味をなさない</small></span>
          </button>
          <button className={`btn choice ${stateSeen ? "on" : ""}`} onClick={() => setStateSeen(true)}>
            <span className="tweak-check">{stateSeen ? "✓" : "＋"}</span>
            <span className="tweak-body"><b>検体の状態を見る</b><small>色や量に問題がないか</small></span>
          </button>
        </div>
        {note && <p className="game-note">{note}</p>}
        <InfoCards cards={docs} label="こまったら見る資料" />
        <button
          className="btn primary big"
          onClick={() => {
            if (!labelOk) { setNote("測る前に、これがだれの検体か確かめよう。"); return; }
            setNote(null); setStep("run");
          }}
        >
          ▶ 検査をはじめる
        </button>
      </div>
    );
  }

  if (step === "run") {
    return (
      <div className="game board-game">
        <div className="analyzer">
          <span className="analyzer-emoji">🔬</span>
          <p className="game-line center-line">分析装置が動いている…</p>
        </div>
        <button className="btn primary big" onClick={() => setStep("review")}>
          結果を見る
        </button>
      </div>
    );
  }

  const suspectRow = RESULT.find((r) => r.suspect)!;
  const canReport = rechecked || flagged.includes(suspectRow.id);

  if (step === "review" || step === "recheck") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">この結果、そのまま報告していい？</span>
          <span className="task-sub">気になる数字はタップして確かめよう</span>
        </div>
        <div className="lab-table">
          {RESULT.map((r) => (
            <button
              key={r.id}
              className={`lab-row ${r.high ? "high" : ""} ${flagged.includes(r.id) ? "flagged" : ""}`}
              onClick={() => {
                setFlagged((f) => (f.includes(r.id) ? f : [...f, r.id]));
                if (r.suspect) {
                  setNote("この値だけ、ほかの結果と合わない…。🧪検体の状態の資料を見てみよう。");
                } else if (r.high) {
                  setNote(`${r.name} は基準より高い。からだで炎症が起きているサインかもしれない。`);
                } else {
                  setNote(`${r.name} は基準の中。`);
                }
              }}
            >
              <span className="lab-name">{r.name}</span>
              <span className="lab-value">{r.value}</span>
              <span className="lab-ref">基準 {r.ref}</span>
              {rechecked && r.suspect && <span className="lab-fix">→ 採り直して 4.2（基準内）</span>}
            </button>
          ))}
        </div>
        {note && <p className="game-note">{note}</p>}
        <InfoCards cards={docs} label="こまったら見る資料" />
        {!rechecked && (
          <button
            className="btn"
            onClick={() => {
              if (!flagged.includes(suspectRow.id)) {
                setNote("どれか気になる数字はある？タップして確かめてみよう。");
                return;
              }
              setRechecked(true);
              setNote("採り直した血液で測り直したら、ちがう数字になった。さっきの値は検体のせいだった。");
            }}
          >
            🔁 気になる値を、採り直して測り直す
          </button>
        )}
        <button
          className="btn primary big"
          onClick={() => {
            if (!canReport) { setNote("報告する前に、気になる数字がないか確かめよう。"); return; }
            if (!rechecked) { setNote("その値、ほかと合わないまま報告していい？測り直せるよ。"); return; }
            setStep("report");
          }}
        >
          ▶ 医師へ報告する
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="result-card good">
        <span className="result-title">確かめた結果を、医師へ届けた</span>
        <div className="result-rows">
          <span className="rrow"><b>白血球</b><span className="bad">13,200（高い）</span></span>
          <span className="rrow"><b>CRP</b><span className="bad">12.4（高い）</span></span>
          <span className="rrow"><b>カリウム</b><span className="good">4.2（測り直して基準内）</span></span>
        </div>
      </div>
      <p className="game-line center-line">
        ただの血液が、からだの中を知るための<strong>信じられる情報</strong>になった。
      </p>
      <button className="btn primary big" onClick={onComplete}>
        結果を送る
      </button>
    </div>
  );
}
