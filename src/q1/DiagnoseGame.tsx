// Q1: 医師（後半）— 情報を統合する (gameType: clue_join)
// B: 話・からだ・数字・検査・画像が集まった。これをどうまとめる？
// C: 4つの診断候補の一般的な典型像と、6つの所見。
// D: 1つの候補に「これだと思う」とコミットし、決め手になる所見を自分で
//    選ぶ（検査・画像は必須、話・診察は任意、呼吸状態・循環は決め手に
//    ならない）——本物の鑑別診断の縮小版（詳細は clueJoinLogic.ts）。
//
// 2026-09-09 (Q1 Autonomous Factory, legacy-clue-join redesign,
// t1d-flexible-commit-and-defend): 旧実装は「肺を指す手がかりが3つ以上」
// という数合わせで、しかも「？」の説明文自体が答え（どこを指しているか）
// を教えてしまっていた（C_NOT_NEEDED_FOR_D寄りの答え漏れ）。新実装では
// 診断候補への明示的なコミットを求め、フィードバックは完全にフラット
// （診断/根拠のどちらが違うか、多い/少ないかを一切示さない）。診断・
// 所見カードの表示順は今夜のセッション開始時に1回だけ独立にシャッフル
// され（clueBoardLogic.ts の shuffledVitals と同じ考え方）、採点は常に
// idで行い表示順には依存しない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  CORRECT_DIAGNOSIS,
  DIAGNOSES,
  EVIDENCE,
  EVIDENCE_IDS,
  isWinningAttempt,
  MAX_ATTEMPTS,
  shuffledIds,
} from "./clueJoinLogic";

const DIAGNOSIS_IDS = DIAGNOSES.map((d) => d.id);

function newOrders() {
  return { diagnosisOrder: shuffledIds(DIAGNOSIS_IDS), evidenceOrder: shuffledIds(EVIDENCE_IDS) };
}

export default function DiagnoseGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [orders, setOrders] = useState(newOrders);
  const [committed, setCommitted] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [openPattern, setOpenPattern] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"playing" | "success" | "partial">("playing");

  const diagnosisList = orders.diagnosisOrder.map((id) => DIAGNOSES.find((d) => d.id === id)!);
  const evidenceList = orders.evidenceOrder.map((id) => EVIDENCE.find((e) => e.id === id)!);

  const restart = () => {
    setOrders(newOrders());
    setCommitted(null);
    setSelected([]);
    setOpenPattern(null);
    setAttemptsLeft(MAX_ATTEMPTS);
    setFeedback(null);
    setOutcome("playing");
  };

  if (outcome === "success") {
    const chosen = EVIDENCE.filter((e) => selected.includes(e.id));
    const others = DIAGNOSES.filter((d) => d.id !== CORRECT_DIAGNOSIS);
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">つないでみたら、肺炎だと分かった</span>
          <div className="join-list">
            {chosen.map((e) => (
              <span key={e.id} className="join-item"><b>{e.from}</b>{e.text}</span>
            ))}
          </div>
          <p className="join-conclusion">
            → <strong>右の肺で炎症が起きている可能性が高い</strong>
          </p>
        </div>
        <div className="join-list">
          {others.map((d) => (
            <span key={d.id} className="join-item"><b>{d.name.split("（")[0]}との比較</b>{d.pattern}　今回そろった所見は、これよりも肺炎の典型像によく合う。</span>
          ))}
          <span className="join-item"><b>呼吸状態・循環</b>からだの重さ・緊急度を知るための大事な情報だったけど、どの病気かを決める手がかりにはならなかった</span>
        </div>
        <p className="game-line soft center-line">
          ひとつの手がかりだけでは決められない。診断候補と見比べて、決め手になるものを選ぶ。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          治療を始めよう
        </button>
      </div>
    );
  }

  if (outcome === "partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">今回は、はっきりした決め手にたどりつけなかった</span>
          <p className="game-line soft">
            応援の医師と、もう一度手がかりを見直すことになった。
          </p>
        </div>
        <button className="btn" onClick={restart}>
          もう一度考える
        </button>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">集まった手がかりから、見立てをまとめよう</span>
        <span className="task-sub">診断候補を1つ選び、決め手になる所見を選ぶ</span>
      </div>

      <div className="dx-grid">
        {diagnosisList.map((d) => {
          const isCommitted = committed === d.id;
          return (
            <div key={d.id} className={`dx-card ${isCommitted ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{d.name}</span>
                <button
                  className="dx-more"
                  aria-label={openPattern === d.id ? "とじる" : "どんな病気か見る"}
                  onClick={() => setOpenPattern(openPattern === d.id ? null : d.id)}
                >
                  {openPattern === d.id ? "－" : "？"}
                </button>
              </div>
              {openPattern === d.id && <p className="dx-pattern">{d.pattern}</p>}
              <button
                className={`dx-commit ${isCommitted ? "on" : ""}`}
                onClick={() => { setCommitted(d.id); setFeedback(null); }}
              >
                {isCommitted ? "✓ これだと思う" : "これだと思う"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="join-grid">
        {evidenceList.map((e) => {
          const on = selected.includes(e.id);
          return (
            <button
              key={e.id}
              className={`join-card join-main ${on ? "selected" : ""}`}
              onClick={() => {
                setFeedback(null);
                setSelected((s) => (on ? s.filter((x) => x !== e.id) : [...s, e.id]));
              }}
            >
              <span className="join-from">{e.from}</span>
              <span className="join-text">{e.text}</span>
              {on && <span className="idea-check">✓</span>}
            </button>
          );
        })}
      </div>

      {feedback && <p className="game-note">{feedback}</p>}

      <button
        className="btn primary big"
        disabled={committed === null}
        onClick={() => {
          if (isWinningAttempt(committed, selected)) {
            setOutcome("success");
            return;
          }
          const left = attemptsLeft - 1;
          setAttemptsLeft(left);
          if (left <= 0) {
            setOutcome("partial");
            return;
          }
          setFeedback("まだ、はっきりまとめきれていないみたい。見立てと手がかりを、もう一度見比べてみよう。");
        }}
      >
        ▶ これでまとめてみる（あと{attemptsLeft}回）
      </button>
    </div>
  );
}
