// Q1: 臨床検査技師 (gameType: lab_check)
// この仕事の核はひとつだけ：
//   「からだから採ったものを調べると、外から見えないからだの中が
//     数字や情報になって見えるようになる」
// 精度管理・再検査・測り直しの判断はここでは扱わない（小学生には細かすぎる）。
// 検査技師に診断もさせない。作った情報は医師へ返す。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Test {
  id: string;
  icon: string;
  name: string;
  hint: string;
  /** 分かること（＝見えなかったものが情報になる） */
  found: { label: string; value: string; means: string; off: boolean }[];
}

// ※数値はプロトタイプ用の簡略モデル。基準値の暗記はさせない。
const TESTS: Test[] = [
  {
    id: "cells", icon: "🔬", name: "血のつぶを数える", hint: "ばい菌とたたかう係が、どれくらいいる？",
    found: [{ label: "たたかう係（白血球）", value: "13,200", means: "ふだんよりずっと多い。からだが何かとたたかっている", off: true }],
  },
  {
    id: "fire", icon: "🔥", name: "炎症のしるしを調べる", hint: "からだのどこかが「もえている」ときに増えるもの",
    found: [{ label: "炎症のしるし（CRP）", value: "12.4", means: "強い炎症が起きているときの数字", off: true }],
  },
  {
    id: "oxy", icon: "🫁", name: "酸素のはこび役を調べる", hint: "血が酸素をはこべているか",
    found: [{ label: "はこび役（ヘモグロビン）", value: "13.2", means: "こちらは、ふだんどおり", off: false }],
  },
];

type Step = "intro" | "run" | "result" | "done";

export default function LabCheckGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("intro");
  const [picked, setPicked] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const rows = TESTS.filter((t) => picked.includes(t.id)).flatMap((t) => t.found);

  // ---------- Before：ただの血液 ----------
  if (step === "intro") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">とどいた血液から、からだの中を調べよう</span>
          <span className="task-sub">見ただけでは、中で何が起きているか分からない</span>
        </div>
        <div className="blood-before">
          <span className="blood-tube">🩸</span>
          <p>ぱっと見は、ただの赤い液体。<br />ここから、からだの中が分かるの？</p>
        </div>
        <button className="btn primary big" onClick={() => setStep("run")}>
          ▶ 調べてみる
        </button>
      </div>
    );
  }

  // ---------- 何を調べるか選ぶ → 装置が動く ----------
  if (step === "run") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">何を調べる？</span>
          <span className="task-sub">えらぶと、装置が血液を調べてくれる</span>
        </div>

        <div className="stack">
          {TESTS.map((t) => {
            const on = picked.includes(t.id);
            return (
              <button
                key={t.id}
                className={`btn choice ${on ? "on" : ""}`}
                disabled={!!running}
                onClick={() => {
                  if (on) return;
                  setRunning(t.id);
                  setNote(null);
                  window.setTimeout(() => {
                    setPicked((p) => (p.includes(t.id) ? p : [...p, t.id]));
                    setRunning(null);
                  }, 700);
                }}
              >
                <span className="tweak-check">{on ? "✓" : running === t.id ? "…" : "＋"}</span>
                <span className="tweak-body">
                  <b>{t.icon} {t.name}</b>
                  <small>{running === t.id ? "装置が動いている…" : on ? "調べた" : t.hint}</small>
                </span>
              </button>
            );
          })}
        </div>

        {picked.length > 0 && (
          <div className="lab-screen">
            <span className="lab-screen-title">画面に出てきた情報</span>
            {rows.map((r) => (
              <span key={r.label} className={`lab-line ${r.off ? "off" : ""}`}>
                <b>{r.label}</b>
                <span className="lab-num">{r.value}</span>
              </span>
            ))}
          </div>
        )}

        {note && <p className="game-note">{note}</p>}

        <button
          className="btn primary big"
          onClick={() => {
            if (picked.length < TESTS.length) {
              setNote(`まだ ${picked.length}つ。3つとも調べると、からだの中のようすがそろうよ。`);
              return;
            }
            setNote(null);
            setStep("result");
          }}
        >
          ▶ 結果をまとめる
        </button>
      </div>
    );
  }

  // ---------- After：情報になった ----------
  if (step === "result") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">見えなかったからだの中が、情報になった</span>
          <span className="task-sub">数字をタップすると、何を意味するか見られる</span>
        </div>
        <div className="lab-result">
          {rows.map((r) => (
            <button
              key={r.label}
              className={`lab-res-row ${r.off ? "off" : ""}`}
              onClick={() => setNote(`${r.label}：${r.means}`)}
            >
              <span className="lab-name">{r.label}</span>
              <span className="lab-value">{r.value}</span>
              <span className="lab-tap">？</span>
            </button>
          ))}
        </div>
        {note && <p className="game-note">{note}</p>}
        <p className="game-line soft center-line">
          どこで何が起きているかを決めるのは医師。検査技師は、<strong>たしかな情報</strong>を届ける。
        </p>
        <button className="btn primary big" onClick={() => setStep("done")}>
          ▶ 医師へ結果を届ける
        </button>
      </div>
    );
  }

  // ---------- E: Before → After ----------
  return (
    <div className="game board-game">
      <div className="result-card good">
        <span className="result-title">からだの中が、数字で見えるようになった</span>
        <div className="ba-mini">
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">🩸</span>
            <small>見ただけでは<br />分からなかった</small>
          </span>
          <span className="ba-mini-arrow">→</span>
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">📊</span>
            <small>たたかう係が多い<br />炎症のしるしも高い</small>
          </span>
        </div>
      </div>
      <p className="game-line soft center-line">
        からだを開かなくても、採った血液から中のようすが分かる。
      </p>
      <button className="btn primary big" onClick={onComplete}>
        結果を送る
      </button>
    </div>
  );
}
