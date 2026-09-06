// Q1: 臨床検査技師 (gameType: lab_check)
// この仕事の核はひとつだけ：
//   「からだから採ったものを調べると、外から見えないからだの中が
//     数字や情報になって見えるようになる」
// 精度管理・再検査・測り直しの判断はここでは扱わない（小学生には細かすぎる）。
// 検査技師に診断もさせない。作った情報は医師へ返す。
//
// 2026-09-06: 「何を調べるか選ぶ」を実際の判断にした（詳細は labCheckLogic.ts）。
// 血液は1本だけ・3つ全部は調べられない、という制約の中で、直前の場面
// （熱・せき・息苦しさ）から「今知りたいこと」に合う2つを選ぶ。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { canRunAnother, isCompletePicture, MAX_TESTS_RUNNABLE, TESTS } from "./labCheckLogic";

type Step = "intro" | "run" | "result" | "done";

export default function LabCheckGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("intro");
  const [picked, setPicked] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);

  const rows = TESTS.filter((t) => picked.includes(t.id));
  const complete = isCompletePicture(picked);

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
          <p className="game-line soft center-line">とどいた血液は、この1本だけ。</p>
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
          <span className="task-sub">
            {retried
              ? "医師はまだ知りたいことがあるみたい。もう一度えらぼう。"
              : `血液はこれだけ。${MAX_TESTS_RUNNABLE}つまでしか調べられない。`}
          </span>
        </div>

        <div className="stack">
          {TESTS.map((t) => {
            const on = picked.includes(t.id);
            const capped = !canRunAnother(picked) && !on;
            return (
              <button
                key={t.id}
                className={`btn choice ${on ? "on" : ""}`}
                disabled={!!running || on || capped}
                onClick={() => {
                  if (on || capped) return;
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
                  <small>{running === t.id ? "装置が動いている…" : on ? "調べた" : capped ? "血液が足りない" : t.hint}</small>
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
            if (picked.length < MAX_TESTS_RUNNABLE) {
              setNote(`まだ ${picked.length}つ。あと${MAX_TESTS_RUNNABLE - picked.length}つ調べられるよ。`);
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
        {complete ? (
          <>
            <p className="game-line soft center-line">
              どこで何が起きているかを決めるのは医師。検査技師は、<strong>たしかな情報</strong>を届ける。
            </p>
            <button className="btn primary big" onClick={() => setStep("done")}>
              ▶ 医師へ結果を届ける
            </button>
          </>
        ) : (
          <>
            <p className="game-line soft center-line">
              医師から連絡が来た：「うーん……これだけだと、まだよく分からないな」
            </p>
            <button
              className="btn primary big"
              onClick={() => {
                setPicked([]);
                setNote(null);
                setRetried(true);
                setStep("run");
              }}
            >
              ▶ もう一度、選び直す
            </button>
          </>
        )}
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
