// Q1: 薬剤師 (gameType: rx_check)
// B: 処方が出た。この人にこのまま使って大丈夫？
// C: 処方せん／患者情報（体重・年齢）／検査値（腎機能）／今までの薬・
//    アレルギー。薬だけ見ても問題は見えず、患者情報を開くと気づく。
// D: 情報を開いて確かめる →「気になる点」を選ぶ → 医師に問い合わせる／
//    量の見直しを提案する。
//
// ※要ファクトチェック：実際の投与量調整は薬剤ごとに基準が異なる。
//   ここでは具体的な薬剤名を出さず「腎臓のはたらきに合わせて量を
//   見直す」という一般的な考え方だけを扱う。
//
// 2026-09-07 repair round 1 (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ42/CA72 — "重要文書の確認が保証されず、答えを直接
// 述べた固定選択肢を無コストで試せる"): see rxCheckLogic.ts for the fixes
// (all 4 cards required, wrong-guess budget per step). Round-1 independent
// review found 2 remaining HIGH, both fixed in round 2 (this version):
// (1) the "stop unilaterally" wrong reply semantically named the correct
// action ("まずは相談") -- reworded in rxCheckLogic.ts. (2) blind-guess
// success across both steps was too high given the action step's correct
// answer has generic professional face-validity independent of any data --
// the action step's wrong-guess budget is now separately tighter
// (MAX_ACTION_WRONG_ATTEMPTS = 0) than the concern step's. Also fixed a
// real race: the correct action had a 600ms delay before completing, during
// which the action buttons stayed clickable -- a second click in that
// window could set done-partial only for the pending timer to overwrite it
// back to done afterward. `resolving` now disables the buttons the instant
// a correct pick is made, and the partial-outcome text now names the
// SPECIFIC wrong action actually chosen, instead of always assuming one.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { ACTIONS, CARDS, CONCERNS, MAX_ACTION_WRONG_ATTEMPTS, MAX_CONCERN_WRONG_ATTEMPTS, hasSeenEnough } from "./rxCheckLogic";
import type { CardId } from "./rxCheckLogic";

type Step = "look" | "concern" | "act" | "done" | "done-partial";
type PartialReason = "concern" | "action" | null;

export default function RxCheckGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("look");
  const [open, setOpen] = useState<CardId | null>(null);
  const [seen, setSeen] = useState<CardId[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [concernWrong, setConcernWrong] = useState(0);
  const [actionWrong, setActionWrong] = useState(0);
  const [partialReason, setPartialReason] = useState<PartialReason>(null);
  const [wrongActionTaken, setWrongActionTaken] = useState<string | null>(null);
  // true from the instant a correct action is picked until the (delayed)
  // transition to "done" actually fires -- disables the action buttons so
  // a second click in that window can never race the pending timer.
  const [resolving, setResolving] = useState(false);

  if (step === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">安全に、治療をはじめられる</span>
          <div className="result-rows">
            <span className="rrow"><b>医師と相談して</b><span>腎臓のはたらきに合わせて量を調整</span></span>
            <span className="rrow"><b>そのあとも</b><span className="good">効きかたと副作用を見ていく</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          薬をわたすことがゴールじゃない。この人に安全に効くところまで。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          病棟へ届ける
        </button>
      </div>
    );
  }

  // 2026-09-07 repair: an honest, weaker outcome for exhausting the guess
  // budget -- either the concern was never correctly identified, or it was
  // identified but the wrong action was taken. Progress isn't blocked (Job
  // Reveal still happens), and neither is disguised as the safe outcome.
  if (step === "done-partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">
            {partialReason === "concern" ? "気になるところを、しぼりきれなかった" : "確認しないまま、話が進んでしまった"}
          </span>
        </div>
        <p className="game-line soft center-line">
          {partialReason === "concern"
            ? "カードの内容と見比べきれず、今日は気になるところを見つけられなかった。次はもう一度、カードを見くらべてみよう。"
            : wrongActionTaken === "asis"
              ? "気になるところには気づけたけど、そのまま薬を出してしまった。気になることがあるときは、渡す前に確かめることが安全な一歩になる。"
              : "気になるところには気づけたけど、自分の判断だけで薬をやめてしまった。ひとりで決めず、確かめることが安全な一歩になる。"}
        </p>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          病棟へ届ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {step === "look" && "この薬、この人にこのまま使って大丈夫？"}
          {step === "concern" && "気になるところは、どこ？"}
          {step === "act" && "どうする？"}
        </span>
        <span className="task-sub">カードをひらいて、確かめてみよう</span>
      </div>

      <div className="doc-stack">
        {CARDS.map((c) => {
          const isOpen = open === c.id;
          return (
            <div key={c.id} className={`doc-card ${isOpen ? "open" : ""}`}>
              <button
                className="doc-head"
                onClick={() => {
                  setOpen(isOpen ? null : c.id);
                  if (!isOpen) setSeen((s) => (s.includes(c.id) ? s : [...s, c.id]));
                  setNote(null);
                }}
              >
                <span className="doc-icon">{c.icon}</span>
                <span className="doc-title">{c.title}</span>
                <span className="doc-toggle">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="doc-body">
                  {c.lines.map((l) => <p key={l}>{l}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step === "concern" && (
        <div className="stack">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              className="btn choice"
              onClick={() => {
                if (c.ok) {
                  setNote(c.reply);
                  setStep("act");
                  return;
                }
                const next = concernWrong + 1;
                setConcernWrong(next);
                if (next > MAX_CONCERN_WRONG_ATTEMPTS) {
                  setPartialReason("concern");
                  setStep("done-partial");
                  return;
                }
                setNote(c.reply);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {step === "act" && (
        <div className="stack">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              className="btn choice"
              disabled={resolving}
              onClick={() => {
                if (resolving) return;
                if (a.ok) {
                  setResolving(true);
                  setNote(a.result);
                  setTimeout(() => setStep("done"), 600);
                  return;
                }
                const next = actionWrong + 1;
                setActionWrong(next);
                if (next > MAX_ACTION_WRONG_ATTEMPTS) {
                  setPartialReason("action");
                  setWrongActionTaken(a.id);
                  setStep("done-partial");
                  return;
                }
                setNote(a.result);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      {step === "look" && (
        <button
          className="btn primary big"
          onClick={() => {
            if (!hasSeenEnough(seen)) {
              setNote(`まだ ${seen.length} まいしか見ていない。ぜんぶのカードを見くらべてみよう。`);
              return;
            }
            setNote(null);
            setStep("concern");
          }}
        >
          ▶ 気になることを考える
        </button>
      )}
    </div>
  );
}
