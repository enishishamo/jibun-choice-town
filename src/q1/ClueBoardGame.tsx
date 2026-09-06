// Q1: 医師（前半）— たんていメモ型 (gameType: clue_board)
// B: 息苦しい・熱がある人が来た。何が起きている？
// C: 問診・身体診察・バイタルの3つの調べ方。バイタルの数字は「これって
//    どういう意味？」で基準を開くまで、良し悪しが分からない。
// D: 自分で調べ方を選ぶ → 手がかりがメモにたまる → 集めた数字を、
//    ふつうの範囲と見比べて「気になるもの」を見きわめる（詳細は
//    clueBoardLogic.ts）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { ASK, EXAM, hasGatheredEnough, isCorrectVitalFlagSet, MAX_REVIEW_ATTEMPTS, VITALS } from "./clueBoardLogic";
import type { Clue } from "./clueBoardLogic";

type Tab = "ask" | "exam" | "vital";

export default function ClueBoardGame({ onComplete }: Q1GameProps) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [toolsUsed, setToolsUsed] = useState<Set<Tab>>(new Set());
  const [said, setSaid] = useState<Record<string, string>>({});
  const [openNormal, setOpenNormal] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // 2026-09-06 repair: reviewing gates completion on actually reading the
  // vitals against their own normal range, not just tallying clue count.
  const [reviewing, setReviewing] = useState(false);
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

  if (reviewing) {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">数字を、ふつうの範囲と見比べよう</span>
          <span className="task-sub">「気になる」と思うものだけ選んでね</span>
        </div>
        <div className="vital-list">
          {VITALS.map((v) => {
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
              // bounded cost, not an infinite free enumeration of the 16
              // possible flag-sets: the chapter still isn't blocked, but a
              // second miss moves on without a third free look.
              onComplete();
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
          {VITALS.map((v) => (
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
          setReviewing(true);
        }}
      >
        {enough ? "▶ ここまでで考えてみる" : "手がかりを集めよう"}
      </button>
    </div>
  );
}
