// Q1: 経営指導員（商工会議所） (gameType: plan_coach)
// B: ハルさんの創業計画書を「通る計画」に磨く。
// C: 計画書6欄＋チェックの観点カード＋面談でハルさんから聞き出した答え。
// D: 質問する → 聞いた欄だけ指摘できる → 弱点2つに合う助言を選ぶ。
//    「面談で確かめていないことは指摘できない」が攻略の背骨（design v1.2 §2）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

type FieldId = "naiyou" | "uriage" | "keihi" | "jikin" | "kariire" | "uri";

interface Field {
  id: FieldId;
  label: string;
  value: string;
  weak: boolean;
  /** reply when the child asks about this field */
  answer: string;
  /** reply when the child (wrongly) flags a non-weak field */
  notWeak?: string;
}
const FIELDS: Field[] = [
  { id: "naiyou", label: "お店の内容", value: "小さな定食屋（8席）", weak: false,
    answer: "カウンターごしに話せる、小さな定食屋にしたいんです。席は8席です。",
    notWeak: "お店の内容は、はっきりしている。ここは強みだ。" },
  { id: "uriage", label: "売上の見込み", value: "1日50人 × 700円", weak: true,
    answer: "1日50人くらいは来ると思うんです！" },
  { id: "keihi", label: "経費", value: "家賃 ＋ 材料費", weak: true,
    answer: "家賃と材料費は入れました。" },
  { id: "jikin", label: "自己資金", value: "150万円", weak: false,
    answer: "毎月コツコツ、3年かけて貯めました。",
    notWeak: "そこはだいじょうぶそう。毎月の貯金の記録があるからね。" },
  { id: "kariire", label: "借りたいお金", value: "250万円", weak: false,
    answer: "内装の工事に使う予定です。",
    notWeak: "使いみちははっきりしている。金額は、ほかの欄しだいかな。" },
  { id: "uri", label: "お店の売り", value: "出汁からとるみそ汁", weak: false,
    answer: "出汁からちゃんととる、みそ汁が自慢なんです。",
    notWeak: "いいね。ここは計画の弱点ではなさそうだ。" },
];

// Advice choices per weakness. Exactly one lands; the others bounce with a
// reason (never the answer itself).
const ADVICE: Record<string, { text: string; good?: true; bounce?: string }[]> = {
  uriage: [
    { text: "席の数と営業時間から、入れる人数を計算し直してみたら？", good: true },
    { text: "駅前の人通りを数えてみたら？",
      bounce: "人通りは参考になるけど、8席のお店に一度に入れる人数の答えにはならないみたいだ。" },
    { text: "値段を2倍にすれば？",
      bounce: "「お客さんが来なくなるかも…」とハルさんが心配そうだ。" },
  ],
  keihi: [
    { text: "アルバイト代と、自分の生活費も入れてみよう", good: true },
    { text: "材料費をうんと安いものにかえよう",
      bounce: "「出汁からとるみそ汁が売りなのに…」とハルさんが困っている。売りを削る直し方みたいだ。" },
    { text: "経費は少なく書いたほうが、計画がよく見えるよ",
      bounce: "その直し方だと、面談で「本当にこれだけ？」と聞かれたとき困りそうだ。" },
  ],
};

export default function PlanCoachGame({ onComplete }: Q1GameProps) {
  const [asked, setAsked] = useState<FieldId[]>([]);
  const [bubble, setBubble] = useState<string | null>(null);
  const [found, setFound] = useState<FieldId[]>([]);
  const [advised, setAdvised] = useState<FieldId[]>([]);
  const [advising, setAdvising] = useState<FieldId | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  const ask = (f: Field) => {
    setNote(null);
    setBubble(f.answer);
    if (!asked.includes(f.id)) setAsked((a) => [...a, f.id]);
  };

  const flag = (f: Field) => {
    setBubble(null);
    if (!asked.includes(f.id)) {
      setNote("まだ聞いていない欄だ。面談で確かめていないことは、指摘できないよ。");
      return;
    }
    if (found.includes(f.id)) {
      // reopen the advice dialog for a flagged-but-unadvised weakness
      if (!advised.includes(f.id)) setAdvising(f.id);
      return;
    }
    if (!f.weak) {
      setNote(f.notWeak ?? "そこは弱点ではなさそうだ。");
      return;
    }
    setNote(null);
    setFound((x) => [...x, f.id]);
    setAdvising(f.id);
  };

  const advise = (fid: FieldId, i: number) => {
    const a = ADVICE[fid][i];
    if (a.good) {
      setNote(null);
      setAdvised((x) => [...x, fid]);
      setAdvising(null);
    } else {
      setNote(a.bounce!);
    }
  };

  const done = advised.length === 2;
  const extraAsked = asked.filter((id) => !FIELDS.find((f) => f.id === id)!.weak).length;

  // ---------- E: the plan, rewritten into explainable numbers ----------
  if (cleared) {
    return (
      <div className="game board-game">
        <div className="beforeafter">
          <div className="ba-col">
            <span className="ba-title">Before</span>
            <span className="ba-row">売上：1日50人×700円</span>
            <span className="ba-row">経費：家賃＋材料費</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="ba-col">
            <span className="ba-title">After</span>
            <span className="ba-row">売上：8席×回転×700円で計算</span>
            <span className="ba-row">経費：＋アルバイト代・生活費</span>
          </div>
        </div>
        <p className="game-line center-line">
          「これなら、自分の言葉で説明できそうです」とハルさん。
        </p>
        {extraAsked >= 3 && (
          <p className="game-line soft center-line">
            弱点だけでなく、お店の強みまでたくさん聞いてくれたから、ハルさんはずっと話しやすそうだった。
          </p>
        )}
        <button className="btn primary big" onClick={onComplete}>
          ハルさんを見送る
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">計画書のあやしいところを2つ見つけよう</span>
        <div className="mission-chips">
          <span className={`mchip ${found.length ? "ok" : ""}`}>気になる欄 {found.length}/2</span>
          <span className={`mchip ${advised.length ? "ok" : ""}`}>直し方 {advised.length}/2</span>
        </div>
      </div>

      {/* C: the draft plan. tap a field to flag it (only if asked about) */}
      <p className="game-line soft">📄 ハルさんの創業計画書（草案）— あやしい欄をタップ</p>
      <div className="plan-sheet">
        {FIELDS.map((f) => {
          const isAsked = asked.includes(f.id);
          const isFound = found.includes(f.id);
          const isFixed = advised.includes(f.id);
          return (
            <button
              key={f.id}
              className={`plan-row ${isAsked ? "asked" : ""} ${isFound ? "flagged" : ""} ${isFixed ? "fixed" : ""}`}
              onClick={() => flag(f)}
            >
              <span className="plan-label">{f.label}</span>
              <span className="plan-value">
                {isFixed && f.id === "uriage" ? "8席×回転×700円" : isFixed && f.id === "keihi" ? "家賃＋材料費＋人件費" : f.value}
              </span>
              <span className="plan-state">{isFixed ? "✅" : isFound ? "⚠️" : isAsked ? "🗣" : "…"}</span>
            </button>
          );
        })}
      </div>

      {/* interview: ask, then the field becomes flaggable */}
      <p className="game-line soft">🗣 面談：ハルさんに聞いてみよう（聞いた欄だけ指摘できる）</p>
      <div className="choice-row wrap">
        {FIELDS.map((f) => (
          <button
            key={f.id}
            className={`layer-btn ${asked.includes(f.id) ? "active" : ""}`}
            onClick={() => ask(f)}
          >
            {f.label}は？
          </button>
        ))}
      </div>
      {bubble && <p className="talk-bubble">🙂 ハルさん「{bubble}」</p>}

      <InfoCards
        label="チェックの観点"
        cards={[
          { id: "sales", icon: "🧮", title: "売上のたしかめ方",
            body: <p>売上の予測は「客単価×席数×回転数」で計算できる（公庫の資料より）。客数に根拠がある？</p> },
          { id: "cost", icon: "🧾", title: "経費の見落とし",
            body: <p>家賃・材料費のほかに、人件費（アルバイト代や自分の生活費）を忘れやすい。</p> },
          { id: "balance", icon: "⚖️", title: "自己資金とのバランス",
            body: <p>自己資金と借りるお金のバランスも見る。コツコツ貯めた記録は強い味方。</p> },
        ]}
      />

      {note && <div className="sched-issues"><p>{note}</p></div>}

      {done && (
        <button className="btn primary big" onClick={() => setCleared(true)}>
          ✍️ 計画書を書き直してもらう
        </button>
      )}

      {/* ---------- advice dialog for a found weakness ---------- */}
      {advising && (
        <div className="modal-veil">
          <div className="modal-card">
            <p className="modal-title">
              ⚠️「{FIELDS.find((f) => f.id === advising)!.label}」— どう直すのがいい？
            </p>
            {note && <p className="karte-memo">{note}</p>}
            <div className="stack">
              {ADVICE[advising].map((a, i) => (
                <button key={a.text} className="btn card-line" onClick={() => advise(advising, i)}>
                  {a.text}
                </button>
              ))}
              <button className="btn ghost" onClick={() => { setAdvising(null); setNote(null); }}>
                あとで考える（資料や面談を見直す）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
