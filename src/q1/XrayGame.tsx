// Q1: 診療放射線技師 (gameType: xray_shoot)
// この仕事の核はひとつだけ：
//   「外からは見えないからだの中を、画像にして見えるようにする」
// ポジショニング・撮影条件・撮り直しはゲームの中心にしない（細かすぎる）。
// 体験するのは「見えなかったものが見える」という変化そのもの。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import BodyInsideView from "./BodyInsideView";

type Where = "chest" | "belly" | "head";
const WHERE: { id: Where; icon: string; label: string }[] = [
  { id: "head", icon: "🧠", label: "あたま" },
  { id: "chest", icon: "🫁", label: "むね（肺）" },
  { id: "belly", icon: "🫄", label: "おなか" },
];

type Step = "before" | "shot" | "look" | "done";

export default function XrayGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("before");
  const [where, setWhere] = useState<Where | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  // ---------- Before：外から見ても分からない ----------
  if (step === "before") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">医師「肺の中で、何が起きているんだろう？」</span>
          <span className="task-sub">外から見ても、からだの中は分からない</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} />
          <span className="body-cap">外から見えるのは、ここまで</span>
        </div>

        <p className="pick-title">どこを見えるようにする？</p>
        <div className="choice-row wrap">
          {WHERE.map((w) => (
            <button
              key={w.id}
              className={`choice-card ${where === w.id ? "selected" : ""}`}
              onClick={() => {
                setWhere(w.id);
                setNote(
                  w.id === "chest"
                    ? null
                    : "医師が知りたいのは「肺の中」。むねを見えるようにしてみよう。",
                );
              }}
            >
              <span className="choice-emoji">{w.icon}</span>
              <span className="choice-name">{w.label}</span>
            </button>
          ))}
        </div>
        {note && <p className="game-note">{note}</p>}

        <button
          className="btn primary big"
          onClick={() => {
            if (where !== "chest") {
              setNote("まず、どこを見えるようにするか決めよう。今回みたいのは肺だったね。");
              return;
            }
            setNote(null);
            setStep("shot");
          }}
        >
          📷 装置を動かす
        </button>
      </div>
    );
  }

  // ---------- 変化：からだが透けて、中が見える ----------
  if (step === "shot") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">むねの中を、うつしている…</span>
          <span className="task-sub">からだの外側が、すーっと透けていく</span>
        </div>
        <div className="body-stage revealing">
          <BodyInsideView inside />
          <span className="body-cap">見えなかった中が、見えてきた</span>
        </div>
        <button className="btn primary big" onClick={() => setStep("look")}>
          ▶ うつった画像を見る
        </button>
      </div>
    );
  }

  // ---------- 見えたものを、自分で見くらべる ----------
  if (step === "look") {
    const both = seen.length === 2;
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">左右の肺を、見くらべてみよう</span>
          <span className="task-sub">肺をタップすると、よく見られる</span>
        </div>
        <div className="body-stage">
          <BodyInsideView
            inside
            focus={seen.includes("right") && !seen.includes("left") ? "right" : null}
            onPickLung={(side) => {
              setSeen((s) => (s.includes(side) ? s : [...s, side]));
              setNote(
                side === "right"
                  ? "右の肺に、白いモヤモヤしたところがある。何かたまっているみたい。"
                  : "左の肺は、きれいにすけて見える。",
              );
            }}
          />
          <span className="body-cap">タップ：右の肺 / 左の肺</span>
        </div>
        {note && <p className="game-note">{note}</p>}
        <button
          className="btn primary big"
          onClick={() => {
            if (!both) {
              setNote("かたっぽだけだと、それがふつうかどうか分からない。もう片方も見てみよう。");
              return;
            }
            setNote(null);
            setStep("done");
          }}
        >
          ▶ この画像を医師へ届ける
        </button>
      </div>
    );
  }

  // ---------- E: Before → After ----------
  return (
    <div className="game board-game">
      <div className="result-card good">
        <span className="result-title">見えなかった中が、画像になった</span>
        <div className="ba-mini">
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">🧍</span>
            <small>外からでは<br />分からない</small>
          </span>
          <span className="ba-mini-arrow">→</span>
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">🫁</span>
            <small>右の肺に<br />白いモヤがある</small>
          </span>
        </div>
      </div>
      <p className="game-line soft center-line">
        画像は、医師にとって<strong>新しい手がかり</strong>になる。
      </p>
      <button className="btn primary big" onClick={onComplete}>
        画像を送る
      </button>
    </div>
  );
}
