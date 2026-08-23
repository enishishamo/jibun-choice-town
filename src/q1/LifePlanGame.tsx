// Q1: MSW（医療ソーシャルワーカー）(gameType: life_plan)
// B: 家に帰りたい。でもひとり暮らし。
// C: 本人の希望／家の様子／家族／お金。まず本人に聞かないと、何を
//    残すべきか（散歩・自分でできること）が分からない。
// D: ①本人の希望を聞く ②家に帰ったあとの困りごとを探す ③支援を選ぶ。
//    「全部つける」でも「家族に全部頼む」でもうまくいかず、条件が返る。
//
// ※要ファクトチェック：使える制度・サービス・費用は自治体や状況で
//   大きく異なる。ここでは考え方だけを扱う。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Trouble { id: string; icon: string; label: string; detail: string; needs: string[] }
const TROUBLES: Trouble[] = [
  { id: "stairs", icon: "🪜", label: "家の中の段差", detail: "玄関に段差があって、手すりがない", needs: ["rail"] },
  { id: "shop", icon: "🛒", label: "買い物", detail: "お店まで歩くのは、まだしんどい", needs: ["meal", "family"] },
  { id: "med", icon: "💊", label: "薬・通院", detail: "病院までバスで30分。薬ののみ忘れも心配", needs: ["visit"] },
  { id: "alone", icon: "😟", label: "ひとりの時間", detail: "ぐあいが悪くなったとき、気づいてもらえるか不安", needs: ["watch", "family"] },
];

interface Support { id: string; icon: string; label: string; cost: number; note: string }
const SUPPORTS: Support[] = [
  { id: "rail", icon: "🤝", label: "手すりをつける", cost: 1, note: "住まいを直して、自分で動けるようにする" },
  { id: "visit", icon: "🏥", label: "訪問看護", cost: 2, note: "看護師が家に来て、体調や薬を見てくれる" },
  { id: "meal", icon: "🍱", label: "配食サービス", cost: 2, note: "食事を届けてもらう" },
  { id: "watch", icon: "🔔", label: "見守りサービス", cost: 1, note: "何かあったとき、連絡できるしくみ" },
  { id: "family", icon: "👧", label: "娘さんに頼む", cost: 0, note: "遠くに住んでいて、来られるのは週1回くらい" },
  { id: "helper", icon: "🧹", label: "毎日ヘルパーに来てもらう", cost: 4, note: "身のまわりのことを毎日手伝ってもらう" },
];

const BUDGET = 6; // 使えるお金・制度のめやす（プロトタイプ用）

type Step = "ask" | "find" | "plan" | "done";

export default function LifePlanGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("ask");
  const [found, setFound] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const cost = SUPPORTS.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.cost, 0);
  const covered = (t: Trouble) => t.needs.some((n) => picked.includes(n));
  const allCovered = TROUBLES.every(covered);
  const tooMuch = picked.includes("helper");
  const familyOnly = picked.includes("family") && picked.length === 1;

  if (step === "ask") {
    return (
      <div className="game board-game">
        <div className="bedside">
          <span className="bedside-face">🧓</span>
          <p className="bedside-say">「家に帰りたい。」</p>
        </div>
        <p className="game-line center-line">ひとり暮らし。まず、何から聞こう？</p>
        <div className="stack">
          <button
            className="btn choice"
            onClick={() => {
              setNote("それも大事。でもその前に、この人が「どう暮らしたいか」を聞いてみない？");
            }}
          >
            すぐに使えるサービスを調べる
          </button>
          <button
            className="btn choice"
            onClick={() => {
              setNote("家族に聞くのも大事。でも、いちばん先に聞きたいのは？");
            }}
          >
            娘さんに相談する
          </button>
          {/* 3つとも同じ見た目：色で正解が分かってしまわないように */}
          <button className="btn choice" onClick={() => { setNote(null); setStep("find"); }}>
            💬「家に帰ったら、どんなふうに暮らしたい？」と聞く
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
          <span className="result-title">退院後のくらしが、つながった</span>
          <p className="join-conclusion">
            「できれば今まで通り、自分の家で。近所を散歩したり、自分でできることは続けたい」
          </p>
          <div className="result-rows">
            {SUPPORTS.filter((s) => picked.includes(s.id)).map((s) => (
              <span key={s.id} className="rrow"><b>{s.icon} {s.label}</b><span>{s.note}</span></span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          全部を手伝えばいい、ではない。この人が続けたいことを残したまま、足りないところをつなぐ。
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
          {step === "find" ? "家に帰ったら、どこで困りそう？" : "本人の希望を残したまま、支援を組み合わせよう"}
        </span>
        <span className="task-sub">
          {step === "find" ? "気になるところをタップ" : `使えるめやす ${cost} / ${BUDGET}`}
        </span>
      </div>

      <div className="wish-card">
        <span className="wish-face">🧓</span>
        <p>
          「できれば今まで通り、自分の家で暮らしたい。<br />
          近所を散歩したり、<strong>自分でできることは続けたい</strong>」
        </p>
      </div>

      {step === "find" && (
        <>
          <div className="obs-grid">
            {TROUBLES.map((t) => (
              <button
                key={t.id}
                className={`obs-card ${found.includes(t.id) ? "seen" : ""}`}
                onClick={() => { setFound((f) => (f.includes(t.id) ? f : [...f, t.id])); setNote(`${t.label}：${t.detail}`); }}
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
              if (found.length < 4) { setNote("まだ見ていないところがあるかも。4つとも見てみよう。"); return; }
              setNote(null); setStep("plan");
            }}
          >
            ▶ 支援を考える
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
            {SUPPORTS.map((s) => (
              <button
                key={s.id}
                className={`btn choice ${picked.includes(s.id) ? "on" : ""}`}
                onClick={() => {
                  setPicked((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]));
                  setNote(s.note);
                }}
              >
                <span className="tweak-check">{picked.includes(s.id) ? "✓" : "＋"}</span>
                <span className="tweak-body">
                  <b>{s.icon} {s.label}</b>
                  <small>{s.cost > 0 ? `めやす ${s.cost}` : "費用はかからない"}</small>
                </span>
              </button>
            ))}
          </div>
          {note && <p className="game-note">{note}</p>}
          <button
            className="btn primary big"
            onClick={() => {
              if (familyOnly) { setNote("娘さんは遠くに住んでいて、来られるのは週1回くらい。毎日のことは、それだけではむずかしそう。"); return; }
              if (tooMuch) { setNote("毎日ヘルパーに来てもらえば安心。でも本人は「自分でできることは続けたい」と言っていた。それに費用も大きい。"); return; }
              if (cost > BUDGET) { setNote(`ぜんぶ足すと ${cost}。使えるめやすの ${BUDGET} をこえてしまう…`); return; }
              if (!allCovered) { setNote("まだ手当てできていない困りごとがあるみたい。上の印を見てみよう。"); return; }
              setNote(null); setStep("done");
            }}
          >
            ▶ このプランで相談する
          </button>
        </>
      )}
    </div>
  );
}
