// Q1: 医師（前半）— たんていメモ型 (gameType: clue_board)
// B: 息苦しい・熱がある人が来た。何が起きている？
// C: 問診・身体診察・バイタルの3つの調べ方。バイタルの数字は「これって
//    どういう意味？」で基準を開くまで、良し悪しが分からない。
// D: 自分で調べ方を選ぶ → 手がかりがメモにたまる → 集めた数字を、
//    ふつうの範囲と見比べて「気になるもの」を見きわめる（詳細は
//    clueBoardLogic.ts）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { ASK, EXAM, hasGatheredEnough, isCorrectVitalFlagSet, MAX_REVIEW_ATTEMPTS, shuffledVitals } from "./clueBoardLogic";
import type { Clue } from "./clueBoardLogic";

type Tab = "ask" | "exam" | "vital";
type Step = "gather" | "review" | "done-partial";

export default function ClueBoardGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [toolsUsed, setToolsUsed] = useState<Set<Tab>>(new Set());
  const [said, setSaid] = useState<Record<string, string>>({});
  const [openNormal, setOpenNormal] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // 2026-09-07 repair (Human Decision — Q1 First-Play Standard): row order
  // is shuffled once per playthrough (not on every render) so "always
  // flag the first three rows" stops being a no-reading shortcut.
  const [vitals] = useState(() => shuffledVitals());
  const [step, setStep] = useState<Step>("gather");
  const [flagged, setFlagged] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  const add = (c?: Clue) => {
    if (!c) return;
    setClues((v) => (v.some((x) => x.id === c.id) ? v : [...v, c]));
  };
  const use = (t: Tab, c?: Clue) => {
    add(c);
    if (c) setToolsUsed((s) => (s.has(t) ? s : new Set(s).add(t)));
  };

  const enough = hasGatheredEnough(clues.length, toolsUsed);

  if (step === "review") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">数字を、ふつうの範囲と見比べよう</span>
          <span className="task-sub">「気になる」と思うものだけ選んでね</span>
        </div>
        <div className="vital-list">
          {vitals.map((v) => {
            const on = flagged.includes(v.id);
            return (
              <div key={v.id} className="vital-row">
                <span className="vital-label">{v.label}</span>
                <span className="vital-value">{v.value}</span>
                <span className="vital-normal">ふつうは {v.normal}</span>
                <button
                  className={`btn choice ${on ? "on" : ""}`}
                  onClick={() => {
                    setNote(null);
                    setFlagged((f) => (on ? f.filter((id) => id !== v.id) : [...f, v.id]));
                  }}
                >
                  {on ? "✓ 気になる" : "気になる？"}
                </button>
              </div>
            );
          })}
        </div>
        {note && <p className="game-note">{note}</p>}
        <button
          className="btn primary big"
          onClick={() => {
            if (isCorrectVitalFlagSet(flagged)) {
              onComplete();
              return;
            }
            const next = attempts + 1;
            setAttempts(next);
            if (next >= MAX_REVIEW_ATTEMPTS) {
              // 2026-09-07 repair (Human Decision — Q1 First-Play Standard,
              // BLOCKER: "2回誤答すると正解と同じonCompleteへ進む"): a
              // second miss must NOT complete the chapter as if correct —
              // it moves to an honest, different (weaker) outcome instead.
              setNote(null);
              setStep("done-partial");
              return;
            }
            setNote("もう一度、数字とふつうの範囲を見比べてみよう。");
          }}
        >
          ▶ これで医師に報告する
        </button>
      </div>
    );
  }

  // ---------- E（惜しい）：情報は届いたが、見立てはまだそろっていない ----------
  if (step === "done-partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">手がかりは集まったが、まだ見立てが定まらない</span>
          <div className="ba-mini">
            <span className="ba-mini-item">
              <span className="ba-mini-emoji">🔍</span>
              <small>話・診察・バイタルは<br />集めた</small>
            </span>
            <span className="ba-mini-arrow">→</span>
            <span className="ba-mini-item">
              <span className="ba-mini-emoji">🤔</span>
              <small>気になる数字を<br />うまく選べなかった</small>
            </span>
          </div>
        </div>
        {/* 2026-09-07 (Q1 First-Play Standard, HIGH: text-only consequence):
           show the ACTUAL gathered clue state, not just a static
           explanation — the child's own investigation results, honestly
           carried forward as "collected but not yet used correctly",
           instead of a purely textual "you failed" message. */}
        <div className="clue-memo">
          <span className="memo-title">🔍 医師に送った、たんていメモ</span>
          <div className="memo-list">
            {clues.map((c) => (
              <span key={c.id} className="memo-item">
                <b>{c.from}</b>
                {c.text}
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          数字をふつうの範囲と見比べることで、医師に伝わる情報は変わる。次はどこに注目するか考えてみよう。
        </p>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {tab ? "気になるところを調べてみよう" : "この人に、何が起きているんだろう？"}
        </span>
        <span className="task-sub">下の3つから、自分で調べ方をえらぶ</span>
      </div>

      {/* たんていメモ */}
      <div className="clue-memo">
        <span className="memo-title">🔍 たんていメモ</span>
        {clues.length === 0 ? (
          <p className="memo-empty">まだ手がかりがない。調べると、ここにたまっていく。</p>
        ) : (
          <div className="memo-list">
            {clues.map((c) => (
              <span key={c.id} className="memo-item">
                <b>{c.from}</b>
                {c.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3つの調べ方 */}
      <div className="tool-dock">
        {([["ask", "💬", "話を聞く"], ["exam", "🩺", "からだを診る"], ["vital", "🌡", "バイタルを見る"]] as [Tab, string, string][]).map(
          ([id, icon, label]) => (
            <button
              key={id}
              className={`dock-btn big-dock ${tab === id ? "active" : ""}`}
              onClick={() => { setTab(tab === id ? null : id); setNote(null); }}
            >
              <span>{icon}</span>
              <small>{label}</small>
            </button>
          ),
        )}
      </div>

      {tab === "ask" && (
        <div className="qa-list">
          {ASK.map((a) => (
            <div key={a.id} className="qa-item">
              <button className="qa-q" onClick={() => { setSaid((s) => ({ ...s, [a.id]: a.a })); use("ask", a.clue); }}>
                {a.q}
              </button>
              {said[a.id] && <p className="qa-a">{said[a.id]}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "exam" && (
        <div className="qa-list">
          {EXAM.map((e) => (
            <div key={e.id} className="qa-item">
              <button className="qa-q" onClick={() => { setSaid((s) => ({ ...s, [e.id]: e.result })); use("exam", e.clue); }}>
                🩺 {e.label}
              </button>
              {said[e.id] && <p className="qa-a">{said[e.id]}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "vital" && (
        <div className="vital-list">
          {/* 2026-09-06 repair: no `.off` colour cue here — that would hand
             the review step's answer away for free just by remembering
             which row turned red while gathering. Same value/normal-range
             text as the review step; the player just doesn't yet have to
             DO anything with the comparison. */}
          {vitals.map((v) => (
            <div key={v.id} className="vital-row">
              <span className="vital-label">{v.label}</span>
              <span className="vital-value">{v.value}</span>
              <button
                className="vital-more"
                onClick={() => {
                  setOpenNormal(openNormal === v.id ? null : v.id);
                  use("vital", v.clue);
                }}
              >
                {openNormal === v.id ? "とじる" : "これって？"}
              </button>
              {openNormal === v.id && (
                <span className="vital-normal">ふつうは {v.normal}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          if (!enough) {
            setNote(`手がかりがまだ ${clues.length}こ。3つの調べ方をつかって、もう少し集めてみよう。`);
            return;
          }
          setNote(null);
          setStep("review");
        }}
      >
        {enough ? "▶ ここまでで考えてみる" : "手がかりを集めよう"}
      </button>
    </div>
  );
}
