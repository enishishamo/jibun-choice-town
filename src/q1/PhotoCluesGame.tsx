// Q1: 郷土資料の照合 (gameType: photo_clues)
// 核: 「1つの手がかりで断定しない」— 独立した手がかりを資料と照合し、
// 一致3つ以上で確定、2つなら推定と答えるのがプロ。libraryLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { CLUES, CLUE_BUDGET, CONFIRM_MIN, newPhotoState, photoCheck, photoConclude, verifiedMatches } from "./libraryLogic";
import type { PhotoState, Clue, Candidate, Certainty } from "./libraryLogic";

type Step = "work" | "failed" | "done";

const CLUE_INFO: Record<Clue, { emoji: string; label: string; source: string }> = {
  road: { emoji: "🛣", label: "道の曲がり方", source: "古い地形図と比べる" },
  ridge: { emoji: "⛰", label: "山のかたち", source: "写真の奥の山のりんかくと比べる" },
  sign: { emoji: "🏪", label: "店の看板", source: "昔の商店の名簿で調べる" },
  pole: { emoji: "🌉", label: "橋と電柱", source: "古い住宅地図で調べる" },
};
const CAND_INFO: Record<Candidate["id"], { emoji: string; label: string }> = {
  kita: { emoji: "🏔", label: "北町のつじ" },
  naka: { emoji: "🏮", label: "仲見世どおり" },
  minato: { emoji: "⚓", label: "みなと橋" },
};

export default function PhotoCluesGame({ onComplete }: Q1GameProps) {
  const [ps, setPs] = useState<PhotoState>(() => newPhotoState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("手がかりを選んで、資料と照合しよう。");
  const [pick, setPick] = useState<Candidate["id"] | null>(null);
  const [bounced, setBounced] = useState<Candidate["id"][]>([]); // answers returned by the desk
  const [doneCert, setDoneCert] = useState<Certainty>("confirmed");
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setPs(newPhotoState());
    setPick(null);
    setBounced([]);
    setNote("手がかりを選んで、資料と照合しよう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  // 2026-09-19 (子ども共創テスト「間違い探し」案): 同じ判定ロジック
  // （photoCheck/verifiedMatches、libraryLogic.tsは無変更）を、テキスト表の
  // 読み比べではなく「1枚の古写真の中の気になる部分をタップして資料と
  // 見比べる」操作に置き換えた最小プロトタイプ。新規画像は使わず、既存の
  // CLUE_INFO絵文字を写真内の“ちがいがあるかもしれない場所”として配置する。
  const board = (
    <div className="photo-diff-board">
      <div className="photo-diff-frames">
        <div className="photo-frame photo-frame-old">
          <span className="photo-frame-emoji">🖼</span>
          <span className="photo-frame-label">古い写真</span>
        </div>
        <div className="photo-frame photo-frame-ref">
          <span className="photo-frame-emoji">📚</span>
          <span className="photo-frame-label">資料写真帳</span>
        </div>
      </div>
      <p className="game-line soft center-line photo-diff-instruction">
        気になる場所をタップして、資料と見比べよう（のこり{CLUE_BUDGET - ps.checked.length}回）
      </p>
      <div className="photo-diff-grid">
        {CLUES.map((cl) => {
          const checked = ps.checked.includes(cl);
          return (
            <button
              key={cl}
              className={`photo-diff-spot ${checked ? "checked" : ""}`}
              disabled={checked}
              onClick={() => {
                const nx = photoCheck(ps, cl);
                if (nx.refusal) { setNote(nx.refusal); return; }
                setPs(nx);
                setNote(null);
              }}
            >
              <span className="photo-diff-emoji">{CLUE_INFO[cl].emoji}</span>
              <span className="photo-diff-label">{CLUE_INFO[cl].label}</span>
              {checked ? (
                <span className="photo-diff-result">
                  {ps.c.candidates.map((cd) => (
                    <span key={cd.id} className={`photo-diff-tag ${cd.matches[cl] ? "match" : "nomatch"}`}>
                      {CAND_INFO[cd.id].emoji}{cd.matches[cl] ? "○" : "×"}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="photo-diff-hint">？ タップして比べる</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="game-line" style={{ margin: "6px 2px 0", fontSize: 13 }}>
        一致の数：{(["kita", "naka", "minato"] as const).map((id) => `${bounced.includes(id) ? "📄↩" : ""}${CAND_INFO[id].label.slice(0, 3)} ${verifiedMatches(ps, id)}${pick === id ? "★" : ""}`).join("・")}
      </p>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">回答が、受付で止まった</span></div>
        {board}
        <p className="game-line center-line">この質問は、ベテラン司書が引き継いだ。あとで調べ方を教えてくれるそうだ。</p>
        <p className="game-line soft center-line">似ている、だけでは決められない。いくつ一致したかが根拠になる。（写真は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の写真で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ps.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">{doneCert === "confirmed" ? "撮影地、確定！" : "「推定」として、回答できた"}</span>
        </div>
        {board}
        <p className="game-line soft center-line">
          {doneCert === "confirmed"
            ? "独立した手がかりが3つそろった。これが「確定」の根拠。"
            : withRuby("一致は2つ。だから「｜推定《すいてい》」と答える——それが誠実な回答なんだ。")}
        </p>
        <p className="game-line soft center-line">
          {perfect ? "質問した人は、根拠の一覧を見て深くうなずいた。" : "回答は受付票にとじられ、次の調査の出発点になる。"}
        </p>
        <button className="btn primary big" onClick={onComplete}>回答をわたす</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{withRuby("この写真は「どこ」か、資料と｜照合《しょうごう》してつきとめる")}</span>
        <span className="task-sub">まちがえられる回答は あと{2 - ps.mistakes - 1}回</span>
      </div>

      {board}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "レファレンスのきまり",
          body: (
            <>
              <p>1つの手がかりで<strong>断定しない</strong>。似た建物は、よそにもある。</p>
              <p>{withRuby(`独立した一致が${CONFIRM_MIN}つ以上そろったら「確定」。`)}</p>
              <p>{withRuby("2つなら「｜推定《すいてい》（たぶんここ）」として答える。それも正しい回答。")}</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{withRuby(note)}</p>}

      <p className="pick-title">回答を出す（場所と、たしからしさ）</p>
      <div className="choice-row wrap">
        {(["kita", "naka", "minato"] as const).map((id) => (
          <button
            key={id}
            className={`choice-card ${pick === id ? "selected" : ""}`}
            style={bounced.includes(id) ? { opacity: 0.55, borderColor: "#c9857a" } : undefined}
            onClick={() => { setPick(pick === id ? null : id); setNote(null); }}
          >
            <span className="choice-name">{bounced.includes(id) ? "📄↩ " : ""}{CAND_INFO[id].emoji} {CAND_INFO[id].label}</span>
            <small style={{ opacity: 0.7 }}>一致 {verifiedMatches(ps, id)}</small>
          </button>
        ))}
      </div>
      {pick && (
        <div className="choice-row">
          {(["confirmed", "probable"] as const).map((ct) => (
            <button
              key={ct}
              className="choice-card"
              onClick={() => {
                const r = photoConclude(ps, pick, ct);
                setPs(r.state);
                if (r.state.refusal) { setNote(r.state.refusal); return; }
                if (r.state.outcome === "done") { setDoneCert(ct); setStep("done"); return; }
                if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
                setBounced((b2) => (pick && !b2.includes(pick) ? [...b2, pick] : b2));
                setPick(null);
                setNote("…回答の紙が、だまって戻ってきた。");
              }}
            >
              <span className="choice-name">{ct === "confirmed" ? "✅ 確定" : "🤔 推定"}</span>
              <small style={{ opacity: 0.7 }}>{ct === "confirmed" ? "一致3つ以上" : "一致2つのとき"}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
