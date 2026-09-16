// Q1: MSW（医療ソーシャルワーカー）(gameType: life_plan)
// この仕事の核はひとつだけ：
//   「その人がどう暮らしたいかを聞いて、家で困りそうなところに
//     助けてくれる人や方法をつなぐ」
// 制度名・サービスの正式名称はQ1では出さない（Q2で「実はこんな名前がある」と紹介する）。
// 困りごととサービスの単純な線つなぎにもしない。全部やってもらうと本人が「それはやりたい」と返す。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { TROUBLES, HELPS, WISHES, covered, allCovered, isTooMuch, isFamilyOnly } from "./lifePlanLogic";

type Step = "ask" | "find" | "plan" | "react" | "done";

export default function LifePlanGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("ask");
  const [found, setFound] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  const allCoveredNow = allCovered(picked);
  const tooMuch = isTooMuch(picked);
  const familyOnly = isFamilyOnly(picked);

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
              <span key={t.id} className={`tstat ${covered(t, picked) ? "ok" : ""}`}>
                {t.icon} {t.label} {covered(t, picked) ? "✓" : ""}
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
                    : !allCoveredNow
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
              <span key={t.id} className={`tstat ${covered(t, picked) ? "ok" : ""}`}>
                {t.icon} {t.label} {covered(t, picked) ? "✓" : ""}
              </span>
            ))}
          </div>
          {(familyOnly || tooMuch || !allCoveredNow) ? (
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
