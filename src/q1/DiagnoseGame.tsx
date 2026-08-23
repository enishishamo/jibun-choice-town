// Q1: 医師（後半）— 情報を統合する (gameType: clue_join)
// B: 話・からだ・数字・検査・画像が集まった。これをどうまとめる？
// C: 5つの手がかりカード。ひとつだけでは何とも言えない。
// D: 「同じことを指していそうな手がかり」を自分で選んでまとめる。
//    肺を指す手がかりが3つ以上そろって、はじめて見立てにたどりつく。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Clue {
  id: string;
  from: string;
  text: string;
  /** この手がかりが指している場所 */
  points: "lung" | "general" | "none";
  note: string;
}

const CLUES: Clue[] = [
  { id: "talk", from: "話", text: "3日前から熱・咳、動くと息苦しい", points: "lung", note: "息のことを言っている＝呼吸に関係しそう" },
  { id: "exam", from: "診察", text: "右の胸で、いつもと違う音", points: "lung", note: "胸の音がおかしい＝肺のどこかで何か起きている？" },
  { id: "spo2", from: "バイタル", text: "SpO₂ 88%（低い）・呼吸が速い", points: "lung", note: "酸素がうまく取りこめていない" },
  { id: "lab", from: "検査", text: "白血球・CRPが高い", points: "general", note: "からだのどこかで炎症が起きている（場所までは分からない）" },
  { id: "xray", from: "画像", text: "右の肺に、白くうつっている部分がある", points: "lung", note: "肺のその場所に、何かたまっている" },
  { id: "bp", from: "バイタル", text: "血圧 128/78（基準の中）", points: "none", note: "とくに問題はない" },
];

export default function DiagnoseGame({ onComplete }: Q1GameProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const chosen = CLUES.filter((c) => picked.includes(c.id));
  const lungCount = chosen.filter((c) => c.points === "lung").length;
  const hasNoise = chosen.some((c) => c.points === "none");

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">つないでみたら、見えてきた</span>
          <div className="join-list">
            {chosen.map((c) => (
              <span key={c.id} className="join-item"><b>{c.from}</b>{c.text}</span>
            ))}
          </div>
          <p className="join-conclusion">
            → <strong>右の肺で炎症が起きている可能性が高い</strong>
          </p>
        </div>
        <p className="game-line soft center-line">
          ひとつの手がかりだけでは決められない。いくつも重なって、はじめて見えてくる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          治療を始めよう
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">同じことを指していそうな手がかりを、まとめよう</span>
        <span className="task-sub">カードをタップで選ぶ／「？」で意味を見る</span>
      </div>

      <div className="join-grid">
        {CLUES.map((c) => {
          const on = picked.includes(c.id);
          return (
            <div key={c.id} className={`join-card ${on ? "selected" : ""}`}>
              <button
                className="join-main"
                onClick={() => { setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id])); setNote(null); }}
              >
                <span className="join-from">{c.from}</span>
                <span className="join-text">{c.text}</span>
                {on && <span className="idea-check">✓</span>}
              </button>
              <button className="join-more" onClick={() => setOpen(open === c.id ? null : c.id)}>
                {open === c.id ? "− とじる" : "？ これって"}
              </button>
              {open === c.id && <p className="join-note">{c.note}</p>}
            </div>
          );
        })}
      </div>

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          if (lungCount < 3) {
            setNote(`まとめた手がかりが、まだバラバラかも。「？」を開いて、同じところを指しているものをさがしてみよう。`);
            return;
          }
          if (hasNoise) {
            setNote("この中に、今回の困りごとと関係なさそうなものが混じっているかも。");
            return;
          }
          setNote(null);
          setDone(true);
        }}
      >
        ▶ これでまとめてみる
      </button>
    </div>
  );
}
