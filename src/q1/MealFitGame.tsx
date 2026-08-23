// Q1: 管理栄養士 (gameType: meal_fit)
// B: 病気は良くなってきた。でも、ごはんが進まない。
// C: 必要なエネルギーの目安／実際に食べられた量／本人の話。
//    本人に理由を聞かないと「一度に食べられない」ことが分からない。
// D: 1回の量・回数・食べやすさ・内容を調整 →「出してみる」で
//    “実際に食べられた量”が変わる。栄養満点でも食べられなければ届かない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

// ※数値はプロトタイプ用の簡略モデル。
const NEED = 1400; // 1日に届けたいエネルギーの目安（kcal）

type Portion = "full" | "half" | "small";
type Times = 3 | 5;
type Form = "normal" | "soft" | "drink";

const PORTION: Record<Portion, { label: string; perMeal: number; eatRate: number }> = {
  full: { label: "ふつう量", perMeal: 500, eatRate: 0.3 },
  half: { label: "半分くらい", perMeal: 300, eatRate: 0.75 },
  small: { label: "少なめ", perMeal: 200, eatRate: 0.95 },
};
const FORM: Record<Form, { label: string; bonus: number; note: string }> = {
  normal: { label: "ふつうの食事", bonus: 0, note: "かむ力はある。でも今はしんどい" },
  soft: { label: "やわらかめ", bonus: 0.1, note: "のどを通りやすい" },
  drink: { label: "飲みもので補う", bonus: 0.15, note: "栄養のある飲みものを足す" },
};

export default function MealFitGame({ onComplete }: Q1GameProps) {
  const [asked, setAsked] = useState(false);
  const [portion, setPortion] = useState<Portion>("full");
  const [times, setTimes] = useState<Times>(3);
  const [form, setForm] = useState<Form>("normal");
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const p = PORTION[portion];
  const served = p.perMeal * times;
  const rate = Math.min(1, p.eatRate + FORM[form].bonus);
  const eaten = Math.round(served * rate);
  // 「たくさん出して残す」では合格にしない：食べられた量 かつ 出しすぎでないこと。
  const wasted = served > NEED * 1.5;
  const ok = eaten >= NEED * 0.8 && !wasted;

  const docs = [
    { id: "need", icon: "🎯", title: "1日に届けたい栄養",
      body: (<><p>この人のからだが今 必要としているのは、1日 <strong>およそ {NEED} kcal</strong>。</p>
        <p className="soft-note">回復のためには、少なくともこの8割くらいは届けたい。</p></>) },
    { id: "now", icon: "📉", title: "いまの食べられている量",
      body: <p>ふつうの量を1日3回出しているが、実際に食べられているのは<strong>3割ほど</strong>。</p> },
  ];

  if (tried && ok) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">無理なく食べられるようになった</span>
          <div className="result-rows">
            <span className="rrow"><b>出した量</b><span>{served} kcal分</span></span>
            <span className="rrow"><b>実際に食べられた</b><span className="good">{eaten} kcal（目安 {NEED}）</span></span>
            <span className="rrow"><b>やり方</b><span>{p.label}・1日{times}回・{FORM[form].label}</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          栄養がそろっていても、食べられなければ届かない。その2つを近づけるのがこの仕事。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この食事にする
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {asked ? "食べ方を変えて、出してみよう" : "まず、本人に聞いてみよう"}
        </span>
        <span className="task-sub">目標：1日{NEED}kcalの8割くらいを、実際に食べられる形で</span>
      </div>

      <div className="bedside">
        <span className="bedside-face">🧓</span>
        {asked ? (
          <p className="bedside-say">「一度にこんなに食べられないんだよね。ちょっとずつなら…」</p>
        ) : (
          <button className="btn choice ask-btn" onClick={() => setAsked(true)}>
            💬「食べられないのは、どうしてですか？」と聞く
          </button>
        )}
      </div>

      {asked && (
        <>
          <div className="meal-panel">
            <div className="meal-row">
              <span className="meal-label">1回の量</span>
              <span className="meal-ctrl">
                {(Object.keys(PORTION) as Portion[]).map((k) => (
                  <button key={k} className={`toggle-btn ${portion === k ? "on" : ""}`}
                    onClick={() => { setPortion(k); setTried(false); setNote(null); }}>
                    {PORTION[k].label}
                  </button>
                ))}
              </span>
            </div>
            <div className="meal-row">
              <span className="meal-label">回数</span>
              <span className="meal-ctrl">
                {([3, 5] as Times[]).map((k) => (
                  <button key={k} className={`toggle-btn ${times === k ? "on" : ""}`}
                    onClick={() => { setTimes(k); setTried(false); setNote(null); }}>
                    1日{k}回
                  </button>
                ))}
              </span>
            </div>
            <div className="meal-row">
              <span className="meal-label">食べやすさ</span>
              <span className="meal-ctrl">
                {(Object.keys(FORM) as Form[]).map((k) => (
                  <button key={k} className={`toggle-btn ${form === k ? "on" : ""}`}
                    onClick={() => { setForm(k); setTried(false); setNote(null); }}>
                    {FORM[k].label}
                  </button>
                ))}
              </span>
            </div>
          </div>

          <div className="meter-box">
            <div className="meter-head"><span>出した量</span><strong>{served} kcal分</strong></div>
            {tried && (
              <>
                <div className="meter-head">
                  <span>実際に食べられた</span>
                  <strong className={ok ? "good" : "bad"}>{eaten} kcal</strong>
                </div>
                <div className="mini-bar">
                  <div className={`mini-fill ${ok ? "" : "warn"}`} style={{ width: `${Math.min(100, (eaten / NEED) * 100)}%` }} />
                </div>
              </>
            )}
          </div>

          {tried && !ok && (
            <div className="sched-issues">
              <p>{wasted
                ? "たくさん出したけれど、ほとんど残ってしまった…"
                : "食べきれてはいるけれど、必要な量にとどいていない…"}</p>
            </div>
          )}
          {note && <p className="game-note">{note}</p>}

          <InfoCards cards={docs} label="こまったら見る資料" />

          <button className="btn primary big" onClick={() => { setTried(true); setNote(null); }}>
            ▶ この食事を出してみる
          </button>
        </>
      )}
    </div>
  );
}
