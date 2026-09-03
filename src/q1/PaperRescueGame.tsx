// Q1: 資料保存・修復 (gameType: paper_rescue)
// 核: 「直すほど、こわすことがある」— テープ・ラミネートは世界が拒否。
// 処置しない選択（そのまま記録）が正解になる。libraryLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { RESCUE_ITEMS, RESCUE_MISTAKE_LIMIT, newRescueState, rescueAct } from "./libraryLogic";
import type { RescueState, Treatment, Damage } from "./libraryLogic";

type Step = "work" | "failed" | "done";

const DAMAGE_EMOJI: Record<Damage, string> = { dust: "🌫", tear: "📄", mold: "🦠", taped_before: "🩹", fine: "✨" };
const TREATMENTS: { id: Treatment; label: string; sub: string }[] = [
  { id: "brush", label: "刷毛", sub: "はけで、そっとはらう" },
  { id: "wrap", label: "包む", sub: "中性紙（長もちする紙）で包む" },
  { id: "isolate", label: "隔離", sub: "かくり・ほかの資料から遠ざける" },
  { id: "record_only", label: "そのまま記録", sub: "手を入れず、状態を書きとめる" },
  { id: "tape", label: "テープではる", sub: "はやい・かんたん" },
  { id: "laminate", label: "ラミネート", sub: "ぴかぴかに保護？" },
];

export default function PaperRescueGame({ onComplete }: Q1GameProps) {
  const [rs, setRs] = useState<RescueState>(() => newRescueState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("資料の状態を見て、処置を選ぼう。");
  const [stickies, setStickies] = useState(0); // returned-work sticky notes on the current item
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setRs(newRescueState());
    setStickies(0);
    setNote("資料の状態を見て、処置を選ぼう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const item = rs.idx < RESCUE_ITEMS ? rs.items[rs.idx] : null;
  const moldLoose = rs.items.some((it, i) => it.damage === "mold" && i === rs.idx);

  // the workbench IS the world: desk + storage boxes filling up
  const bench = (
    <div style={{ margin: "6px 14px", background: "#efe7d6", borderRadius: 14, padding: "8px 10px", border: "2px solid #d8c9a8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 56 }}>
        <span style={{ position: "relative", fontSize: 30 }}>
          {item ? DAMAGE_EMOJI[item.damage] : "🗂"}
          {stickies > 0 && (
            <span style={{ position: "absolute", top: -8, right: -12, fontSize: 12 }}>{"🔖".repeat(stickies)}</span>
          )}
        </span>
        <div style={{ fontSize: 15 }}>
          {item ? (
            <>
              <b>{item.label}</b>
              <br />
              <small style={{ color: "#6b5d45" }}>
                {item.damage === "dust" && "表面に、うすくほこり"}
                {item.damage === "tear" && "はしが、やぶれている"}
                {item.damage === "mold" && "しめったにおい。白いてんてん…"}
                {item.damage === "taped_before" && "むかしのテープが、変色している"}
                {item.damage === "fine" && "とくに、いたみは見あたらない"}
              </small>
            </>
          ) : (
            <b>作業だい、から</b>
          )}
        </div>
        {moldLoose && <span style={{ marginLeft: "auto", fontSize: 10, background: "#fde8e0", border: "1px solid #e0a898", borderRadius: 6, padding: "2px 6px" }}>⚠ となりの資料に近い</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#6b5d45" }}>📦 保存箱</span>
        {rs.items.map((it, i) => (
          <span
            key={it.id}
            style={{
              width: 34, height: 26, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 13,
              background: i < rs.idx ? "#dcead0" : "#e7ddc6",
              border: i < rs.idx ? "2px solid #9dbb8a" : "1.5px dashed #c9b88f",
              opacity: i < rs.idx ? 1 : 0.6,
            }}
          >
            {i < rs.idx ? (it.damage === "mold" ? "🔒" : DAMAGE_EMOJI[it.damage]) : ""}
          </span>
        ))}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">作業は、いったん中止に</span></div>
        {bench}
        <p className="game-line center-line">のこりの資料は、保存の専門家が処置を決めることになった。資料はぶじ。</p>
        <p className="game-line soft center-line">よく見て、必要なぶんだけ。それが資料を100年のこすコツ。（資料は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の持ちこみで</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = rs.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">5点ぜんぶ、保存箱へ</span></div>
        {bench}
        <p className="game-line soft center-line">
          {perfect ? "手を入れたのは、必要な資料だけ。見きわめが良かった。" : "納まった。「そのまま記録」も、りっぱな処置なんだ。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("台紙も、古いテープのあとさえも、写真の｜来歴《らいれき》（たどってきた道すじ）を語る証拠になる。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>状態調査票を書く</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">持ちこまれた資料5点を、安全にあずかる（{rs.idx + 1}/{RESCUE_ITEMS}）</span>
        <span className="task-sub">まちがえられるのは あと{RESCUE_MISTAKE_LIMIT - rs.mistakes - 1}回</span>
      </div>

      {bench}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "保存のきまり",
          body: (
            <>
              <p>{withRuby("ほこりは｜刷毛《はけ》。やぶれは｜中性紙《ちゅうせいし》で包む。カビはまず｜隔離《かくり》。")}</p>
              <p>いたみのない資料、古い補修あとは「そのまま記録」がいちばん。</p>
              <p>直すほど、こわすことがある。テープやラミネートは使わない。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        {TREATMENTS.map((t) => (
          <button
            key={t.id}
            className="choice-card"
            onClick={() => {
              const r = rescueAct(rs, t.id);
              setRs(r.state);
              if (r.state.refusal) { setNote(r.state.refusal); return; }
              if (r.state.outcome === "done") { setStep("done"); return; }
              if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
              if (r.state.idx === rs.idx) {
                // the item visibly stays, now carrying a returned-work sticky
                setStickies((n) => n + 1);
                setNote("…資料は作業だいに残ったまま。付せん🔖が1枚、はられた。");
              } else {
                setStickies(0);
                setNote(null);
              }
            }}
          >
            <span className="choice-name" style={{ fontSize: 13 }}>{t.label}</span>
            <small style={{ opacity: 0.7 }}>{t.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
