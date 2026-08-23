// Q1: 薬剤師 (gameType: rx_check)
// B: 処方が出た。この人にこのまま使って大丈夫？
// C: 処方せん／患者情報（体重・年齢）／検査値（腎機能）／今までの薬・
//    アレルギー。薬だけ見ても問題は見えず、患者情報を開くと気づく。
// D: 情報を開いて確かめる →「気になる点」を選ぶ → 医師に問い合わせる／
//    量の見直しを提案する。
//
// ※要ファクトチェック：実際の投与量調整は薬剤ごとに基準が異なる。
//   ここでは具体的な薬剤名を出さず「腎臓のはたらきに合わせて量を
//   見直す」という一般的な考え方だけを扱う。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

type CardId = "rx" | "patient" | "lab" | "history";

const CARDS: { id: CardId; icon: string; title: string; lines: string[]; key?: boolean }[] = [
  { id: "rx", icon: "📄", title: "処方せん", lines: [
    "肺炎の治療につかう注射のくすり", "1日2回・7日分", "点滴でからだに入れる",
  ] },
  { id: "patient", icon: "🧑", title: "患者さんの情報", lines: [
    "70代前半・男性", "体重 52kg", "食事があまりとれていない",
  ] },
  { id: "lab", icon: "🔬", title: "検査の結果", lines: [
    "白血球・CRP：高い（炎症）", "腎臓のはたらきを示す値：ふつうより低め",
  ], key: true },
  { id: "history", icon: "💊", title: "今までの薬・アレルギー", lines: [
    "血圧の薬を毎日のんでいる", "くすりのアレルギー：なし",
  ] },
];

const CONCERNS = [
  { id: "kidney", label: "腎臓のはたらきが弱っているかも", ok: true,
    reply: "たしかに。腎臓のはたらきが弱いと、くすりがからだに残りやすくなることがある。" },
  { id: "allergy", label: "アレルギーがあるかも", ok: false,
    reply: "💊今までの薬・アレルギーのカードを見ると、アレルギーは「なし」と書いてある。" },
  { id: "double", label: "同じ薬が2つ出ているかも", ok: false,
    reply: "📄処方せんを見ると、出ているのは1種類だけ。" },
];

const ACTIONS = [
  { id: "asis", label: "このまま出す", ok: false,
    result: "気になることがあるまま出してしまうと、くすりがからだに残りすぎるかもしれない。" },
  { id: "ask", label: "医師に問い合わせる", ok: true,
    result: "「腎臓の値が低めですが、量はこのままでよいですか？」と確認した。" },
  { id: "stop", label: "自分の判断でやめる", ok: false,
    result: "薬剤師だけでやめてしまうと、肺炎の治療が始められない。まずは相談。" },
];

type Step = "look" | "concern" | "act" | "done";

export default function RxCheckGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("look");
  const [open, setOpen] = useState<CardId | null>(null);
  const [seen, setSeen] = useState<CardId[]>([]);
  const [note, setNote] = useState<string | null>(null);

  if (step === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">安全に、治療をはじめられる</span>
          <div className="result-rows">
            <span className="rrow"><b>医師と相談して</b><span>腎臓のはたらきに合わせて量を調整</span></span>
            <span className="rrow"><b>そのあとも</b><span className="good">効きかたと副作用を見ていく</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          薬をわたすことがゴールじゃない。この人に安全に効くところまで。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          病棟へ届ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {step === "look" && "この薬、この人にこのまま使って大丈夫？"}
          {step === "concern" && "気になるところは、どこ？"}
          {step === "act" && "どうする？"}
        </span>
        <span className="task-sub">カードをひらいて、確かめてみよう</span>
      </div>

      <div className="doc-stack">
        {CARDS.map((c) => {
          const isOpen = open === c.id;
          return (
            <div key={c.id} className={`doc-card ${isOpen ? "open" : ""}`}>
              <button
                className="doc-head"
                onClick={() => {
                  setOpen(isOpen ? null : c.id);
                  if (!isOpen) setSeen((s) => (s.includes(c.id) ? s : [...s, c.id]));
                  setNote(null);
                }}
              >
                <span className="doc-icon">{c.icon}</span>
                <span className="doc-title">{c.title}</span>
                <span className="doc-toggle">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="doc-body">
                  {c.lines.map((l) => <p key={l}>{l}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step === "concern" && (
        <div className="stack">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              className="btn choice"
              onClick={() => {
                setNote(c.reply);
                if (c.ok) setStep("act");
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {step === "act" && (
        <div className="stack">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              className="btn choice"
              onClick={() => {
                setNote(a.result);
                if (a.ok) setTimeout(() => setStep("done"), 600);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      {step === "look" && (
        <button
          className="btn primary big"
          onClick={() => {
            if (seen.length < 3) {
              setNote(`まだ ${seen.length} まいしか見ていない。薬だけでは、この人に合うかどうか分からないかも。`);
              return;
            }
            setNote(null);
            setStep("concern");
          }}
        >
          ▶ 気になることを考える
        </button>
      )}
    </div>
  );
}
