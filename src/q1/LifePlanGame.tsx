// Q1: MSW（医療ソーシャルワーカー）(gameType: life_plan)
// この仕事の核はひとつだけ：
//   「その人がどう暮らしたいかを聞いて、家で困りそうなところに
//     助けてくれる人や方法をつなぐ」
// 制度名・サービスの正式名称はQ1では出さない（Q2で「実はこんな名前がある」と紹介する）。
// 困りごととサービスの単純な線つなぎにもしない。全部やってもらうと本人が「それはやりたい」と返す。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

// 家で困りそうなこと（生活の場面のことばで）
interface Trouble {
  id: string;
  icon: string;
  label: string;
  say: string;
  /** これで手当てできる助け */
  helps: string[];
  /** 本人が「そこは自分でやりたい」と思っていること */
  keep?: string;
}
const TROUBLES: Trouble[] = [
  { id: "shop", icon: "🛒", label: "買い物", say: "「重いものを持って帰れるかなあ」",
    helps: ["food", "hand"], keep: "近所のお店には、自分で行きたい" },
  { id: "meal", icon: "🍚", label: "ごはん", say: "「毎日ごはんを用意できるかな」", helps: ["food", "hand"] },
  { id: "bath", icon: "🛁", label: "お風呂", say: "「一人で入るのは、ちょっと不安だな」", helps: ["hand", "rail"] },
  { id: "med", icon: "💊", label: "薬", say: "「薬、忘れずに飲めるかな」", helps: ["health"] },
  { id: "hosp", icon: "🏥", label: "病院", say: "「次の診察の日、どうやって行こう」", helps: ["ride", "family"] },
  { id: "alone", icon: "👤", label: "一人の時間", say: "「急に具合が悪くなったら、だれに言えばいい？」", helps: ["call", "health"] },
];

// 助けてくれる人・方法（正式名称ではなく「何をしてくれるか」で見せる）
interface Help { id: string; icon: string; label: string; note: string }
const HELPS: Help[] = [
  { id: "food", icon: "🍱", label: "ごはんを届けてくれる人", note: "あたたかいごはんを、家まで運んでくれる" },
  { id: "hand", icon: "🧹", label: "家に来て生活を手伝ってくれる人", note: "そうじや買い物、お風呂の手伝いをしてくれる" },
  { id: "health", icon: "🩺", label: "家で体調を見てくれる人", note: "家に来て、具合や薬のことを見てくれる" },
  { id: "walk", icon: "🚶", label: "家でも歩く練習を手伝ってくれる人", note: "家の中や近所で、安全に動く練習をしてくれる" },
  { id: "ride", icon: "🚐", label: "病院まで行くのを助ける方法", note: "送りむかえをしてもらえる" },
  { id: "family", icon: "👧", label: "娘さんにお願いできること", note: "遠くに住んでいて、来られるのは週に1回くらい" },
  { id: "call", icon: "🔔", label: "困ったとき相談できる人", note: "何かあったとき、すぐ連絡できるようにする" },
  { id: "rail", icon: "🤝", label: "家に手すりをつける", note: "つかまる場所があると、自分で動きやすい" },
];

// 本人の希望（画面に残しておく）
const WISHES = [
  "できることは、自分でやりたい",
  "自分の家で暮らしたい",
  "また近所を散歩したい",
];

type Step = "ask" | "find" | "plan" | "react" | "done";

export default function LifePlanGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("ask");
  const [found, setFound] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  const covered = (t: Trouble) => t.helps.some((h) => picked.includes(h));
  const allCovered = TROUBLES.every(covered);
  // 「全部やってもらう」＝本人がやりたいことまで代わりにしてしまう組み方
  const tooMuch = picked.includes("food") && picked.includes("hand") && picked.length >= 5;
  const familyOnly = picked.length > 0 && picked.every((p) => p === "family");

  // ---------- ①本人に聞く ----------
  if (step === "ask") {
    return (
      <div className="game board-game">
        <div className="bedside">
          <span className="bedside-face">🧓</span>
          <p className="bedside-say">「家に帰れるのはうれしいけど、一人だからちょっと心配なんだよなあ。」</p>
        </div>
        <p className="game-line center-line">まず、何から聞こう？</p>
        <div className="stack">
          {/* 3つとも同じ見た目：色で正解が分かってしまわないように */}
          <button className="btn choice" onClick={() => setNote("それも大事。でもその前に、この人が家でどんなふうに過ごしたいのかを聞いてみない？")}>
            使えるサービスを調べる
          </button>
          <button className="btn choice" onClick={() => setNote("家族に聞くのも大事。でも、いちばん先に聞きたいのは？")}>
            娘さんに相談する
          </button>
          <button className="btn choice" onClick={() => { setNote(null); setStep("find"); }}>
            💬「家に帰ったら、どんなふうに過ごしたい？」と聞く
          </button>
        </div>
        {note && <p className="game-note">{note}</p>}
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">家に帰ってからの毎日が、つながった</span>
          <p className="join-conclusion">「これなら、自分の家で続けられそうだ。散歩にも行けるな。」</p>
          <div className="result-rows">
            {HELPS.filter((h) => picked.includes(h.id)).map((h) => (
              <span key={h.id} className="rrow"><b>{h.icon} {h.label}</b><span>{h.note}</span></span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          全部を代わりにやってあげるのではなく、その人がやりたいことを残したまま、足りないところをつなぐ。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          退院の日をむかえる
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {step === "find" ? "家に帰ったら、どこで困りそう？" : "困りそうなところに、助けをつなごう"}
        </span>
        <span className="task-sub">
          {step === "find" ? "気になるところをタップ" : "本人の希望は、上に出しっぱなしにしておこう"}
        </span>
      </div>

      <div className="wish-card">
        <span className="wish-face">🧓</span>
        <p>
          {WISHES.map((w) => (
            <span key={w} className="wish-line">「{w}」</span>
          ))}
        </p>
      </div>

      {step === "find" && (
        <>
          <div className="obs-grid">
            {TROUBLES.map((t) => (
              <button
                key={t.id}
                className={`obs-card ${found.includes(t.id) ? "seen" : ""}`}
                onClick={() => { setFound((f) => (f.includes(t.id) ? f : [...f, t.id])); setNote(`${t.label}：${t.say}`); }}
              >
                <span className="obs-icon">{t.icon}</span>
                <span className="obs-label">{t.label}</span>
              </button>
            ))}
          </div>
          {note && <p className="game-note">{note}</p>}
          <button
            className="btn primary big"
            onClick={() => {
              if (found.length < TROUBLES.length) { setNote("まだ見ていないところがあるかも。ぜんぶのぞいてみよう。"); return; }
              setNote(null); setStep("plan");
            }}
          >
            ▶ 助けてくれる人をさがす
          </button>
        </>
      )}

      {step === "plan" && (
        <>
          <div className="trouble-status">
            {TROUBLES.map((t) => (
              <span key={t.id} className={`tstat ${covered(t) ? "ok" : ""}`}>
                {t.icon} {t.label} {covered(t) ? "✓" : ""}
              </span>
            ))}
          </div>
          <div className="stack">
            {HELPS.map((h) => (
              <button
                key={h.id}
                className={`btn choice ${picked.includes(h.id) ? "on" : ""}`}
                onClick={() => {
                  setPicked((p) => (p.includes(h.id) ? p.filter((x) => x !== h.id) : [...p, h.id]));
                  setNote(h.note);
                }}
              >
                <span className="tweak-check">{picked.includes(h.id) ? "✓" : "＋"}</span>
                <span className="tweak-body"><b>{h.icon} {h.label}</b><small>{h.note}</small></span>
              </button>
            ))}
          </div>
          {note && <p className="game-note">{note}</p>}
          <button
            className="btn primary big"
            onClick={() => {
              if (picked.length === 0) { setNote("どれか、つないでみよう。"); return; }
              setNote(null);
              setSaid(
                familyOnly
                  ? "「娘は遠くてね……週に1回来てくれるだけでも、ありがたいんだけど。」"
                  : tooMuch
                    ? "「そこまでしてもらったら助かるけど……近所のお店には、自分で行きたいなあ。」"
                    : !allCovered
                      ? "「うーん、まだちょっと不安なところがあるなあ。」"
                      : "「これなら、自分の家でやっていけそうだ。」",
              );
              setStep("react");
            }}
          >
            ▶ この組み合わせを本人に話す
          </button>
        </>
      )}

      {step === "react" && (
        <>
          <div className="bedside">
            <span className="bedside-face">🧓</span>
            <p className="bedside-say">{said}</p>
          </div>
          <div className="trouble-status">
            {TROUBLES.map((t) => (
              <span key={t.id} className={`tstat ${covered(t) ? "ok" : ""}`}>
                {t.icon} {t.label} {covered(t) ? "✓" : ""}
              </span>
            ))}
          </div>
          {(familyOnly || tooMuch || !allCovered) ? (
            <>
              <p className="game-note">
                {familyOnly
                  ? "娘さんだけにお願いすると、毎日のことはむずかしそう。"
                  : tooMuch
                    ? "全部を代わりにしてもらうと、本人が「やりたい」と言っていたことまでなくなってしまう。"
                    : "まだ手当てできていないところがあるみたい。上の印を見てみよう。"}
              </p>
              <button className="btn primary big" onClick={() => { setStep("plan"); setNote(null); }}>
                ▶ 組み合わせを考えなおす
              </button>
            </>
          ) : (
            <button className="btn primary big" onClick={() => setStep("done")}>
              ▶ この形で、退院の準備をする
            </button>
          )}
        </>
      )}
    </div>
  );
}
