// Q1: 看護師 (gameType: observe_care)
// 気づく → 観察 → 見立てる → ケア
// B: 熱も呼吸も良くなってきたのに「なんか、だるくて……」。
// C: 観察できる項目（顔・食事・水分・排泄・睡眠・体温・酸素）。
//    どれを見るかは自分で選ぶ。全部は見なくてよい。
// D: 集めた情報から「何が起きていそうか」を自分で見立て、そのうえで
//    必要なケアを複数えらぶ。正解は1つではない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Obs { id: string; icon: string; label: string; result: string; flag: boolean }
const OBS: Obs[] = [
  { id: "face", icon: "😐", label: "顔・様子", result: "顔色はわるくない。でも、ぐったりしている", flag: true },
  { id: "meal", icon: "🍚", label: "食事", result: "きのうも今日も、ほとんど食べられていない", flag: true },
  { id: "water", icon: "🥤", label: "水分", result: "お茶を少し飲むだけ。コップ1杯くらい", flag: true },
  { id: "pee", icon: "🚻", label: "排泄", result: "尿の回数も量も、いつもより少ない", flag: true },
  { id: "sleep", icon: "😴", label: "睡眠", result: "夜は眠れている", flag: false },
  { id: "temp", icon: "🌡", label: "体温", result: "37.2℃。入院したときより下がっている", flag: false },
  { id: "spo2", icon: "🫁", label: "酸素（SpO₂）", result: "95%。きのうと大きな変化はない", flag: false },
];

const GUESSES = [
  { id: "worse", label: "肺炎がまた悪くなっている", ok: false,
    reply: "でも体温も酸素も、悪くなってはいないみたい。ほかに集めた情報を見てみよう。" },
  { id: "eatdrink", label: "食べられていない・水分が足りていないかも", ok: true,
    reply: "食事・水分・尿。3つがつながっている。" },
  { id: "sleepy", label: "ねむれていないだけ", ok: false,
    reply: "睡眠はとれているみたい。ほかの情報はどうだった？" },
];

const CARES = [
  { id: "drink", label: "少しずつ飲めるように工夫する", good: true, why: "一度にたくさんは飲めなくても、回数を分ければ飲めることがある" },
  { id: "pos", label: "らくな姿勢にする", good: true, why: "起き上がりぎみのほうが、呼吸も食事もらくになる" },
  { id: "tell", label: "医師に今の様子を伝える", good: true, why: "水分や尿の量は、治療の判断にも関わる大事な情報" },
  { id: "meal", label: "食事について相談する", good: true, why: "食べられる形にできないか、栄養の専門職と考える" },
  { id: "wait", label: "ようすを見るだけにする", good: false, why: "食べられない・飲めない状態が続くと、別のしんどさが出てくることがある" },
];

type Step = "notice" | "observe" | "guess" | "care" | "done";

export default function NurseObserveGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("notice");
  const [seen, setSeen] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [cares, setCares] = useState<string[]>([]);

  const flags = OBS.filter((o) => seen.includes(o.id) && o.flag).length;

  if (step === "notice") {
    return (
      <div className="game board-game">
        <div className="bedside">
          <span className="bedside-face">🧓</span>
          <p className="bedside-say">「なんか、だるくて……」</p>
        </div>
        <p className="game-line center-line">
          熱も呼吸も、よくなってきたはずなのに。<br />…あれ？
        </p>
        <button className="btn primary big" onClick={() => setStep("observe")}>
          もう少し、よく見てみる
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">少し、楽になった</span>
          <div className="result-rows">
            {CARES.filter((c) => cares.includes(c.id) && c.good).map((c) => (
              <span key={c.id} className="rrow"><b>やったこと</b><span>{c.label}</span></span>
            ))}
          </div>
        </div>
        <div className="alert-box slim">
          <span className="big-emoji">🍚</span>
          <p>でも、ごはんはほとんど食べられていないまま…</p>
        </div>
        <p className="game-line soft center-line">
          気づいて、見て、考えて、動いた。次は「食べられない」をどうするか。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          栄養の専門職に相談する
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {step === "observe" && "どこを見る？（ぜんぶ見なくていい）"}
          {step === "guess" && "集めた情報から、何が起きていそう？"}
          {step === "care" && "いま、どんなケアをする？（いくつでも）"}
        </span>
        <span className="task-sub">見たことは、下にたまっていく</span>
      </div>

      {step === "observe" && (
        <div className="obs-grid">
          {OBS.map((o) => (
            <button
              key={o.id}
              className={`obs-card ${seen.includes(o.id) ? "seen" : ""}`}
              onClick={() => { setSeen((s) => (s.includes(o.id) ? s : [...s, o.id])); setNote(null); }}
            >
              <span className="obs-icon">{o.icon}</span>
              <span className="obs-label">{o.label}</span>
            </button>
          ))}
        </div>
      )}

      {seen.length > 0 && (
        <div className="clue-memo">
          <span className="memo-title">👀 見てわかったこと</span>
          <div className="memo-list">
            {OBS.filter((o) => seen.includes(o.id)).map((o) => (
              <span key={o.id} className={`memo-item ${o.flag ? "flag" : ""}`}>
                <b>{o.label}</b>{o.result}
              </span>
            ))}
          </div>
        </div>
      )}

      {step === "guess" && (
        <div className="stack">
          {GUESSES.map((g) => (
            <button
              key={g.id}
              className="btn choice"
              onClick={() => { setNote(g.reply); if (g.ok) setStep("care"); }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {step === "care" && (
        <div className="stack">
          {CARES.map((c) => (
            <button
              key={c.id}
              className={`btn choice ${cares.includes(c.id) ? "on" : ""}`}
              onClick={() => {
                setCares((v) => (v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id]));
                setNote(c.why);
              }}
            >
              <span className="tweak-check">{cares.includes(c.id) ? "✓" : "＋"}</span>
              <span className="tweak-body"><b>{c.label}</b></span>
            </button>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      {step === "observe" && (
        <button
          className="btn primary big"
          onClick={() => {
            if (flags < 3) {
              setNote(`まだ気になることが少ないかも（いま ${seen.length}こ見た）。ほかの項目も見てみよう。`);
              return;
            }
            setNote(null); setStep("guess");
          }}
        >
          ▶ 見えてきたことを考える
        </button>
      )}
      {step === "care" && (
        <button
          className="btn primary big"
          disabled={cares.filter((c) => CARES.find((x) => x.id === c)?.good).length < 2}
          onClick={() => {
            if (cares.includes("wait")) {
              setNote("「ようすを見るだけ」だと、食べられない状態がそのまま続いてしまう。");
              return;
            }
            setStep("done");
          }}
        >
          ▶ このケアをする
        </button>
      )}
    </div>
  );
}
