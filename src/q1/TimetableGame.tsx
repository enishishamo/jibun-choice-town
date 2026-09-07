// Q1: イベントの進行をつくる (gameType: timetable)
// B: やりたい演目が多く、このままでは終演に間に合わない。
// C: 演目カード（分数）と転換の資料。転換時間はカードを見ないと
//    分からないので、単純に演目の分数だけ足すと必ず溢れる。
// D: タイムライン上に演目を並べ替え・出し入れする。終演時刻と
//    ステージ転換の条件を満たす組み合わせは複数ある。
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ43/CA67): see timetableLogic.ts for why the end time
// was shortened -- selecting every act used to fit regardless of order.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { ACTS, END, SAME, START, SWAP, computeSchedule, fmt } from "./timetableLogic";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

export default function TimetableGame({ onComplete }: Q1GameProps) {
  // 2026-09-07 repair round 2 (independent review HIGH: the submit gate
  // only required 2+ optional acts, so a player could add just any two and
  // always win regardless of choice or order -- the whole "can't fit all
  // 5" rebalance was irrelevant if the game never forced reaching that
  // point). The lineup now starts with EVERY act already in it -- matching
  // the mission's own "このままだと時間どおり終わらない" framing (it's
  // already overfull) -- so the player's first move must be removing at
  // least one act, not just adding a couple.
  const [line, setLine] = useState<string[]>(ACTS.map((a) => a.id));
  const [note, setNote] = useState<string | null>(null);
  const [overAttempts, setOverAttempts] = useState(0);
  const [done, setDone] = useState(false);

  const { rows, finish } = computeSchedule(line);
  const over = finish > END;

  const docs = [
    {
      id: "rule",
      icon: "🔁",
      title: "転換（入れかえ）の時間",
      body: (
        <>
          <p>演目と演目の間には、機材を入れかえる時間が必要。</p>
          <p>ステージの作りが<strong>変わるとき {SWAP}分</strong>、<strong>同じままなら {SAME}分</strong>。</p>
          <p className="soft-note">バンド編成＝ドラムやアンプを組む／ライト中心＝マイクと照明だけ</p>
        </>
      ),
    },
    {
      id: "time",
      icon: "🕙",
      title: "始まりと終わり",
      body: <p>開演 {fmt(START)}／<strong>終演 {fmt(END)}</strong>。オープニングとエンディングは必ず入れる。</p>,
    },
  ];

  const move = (i: number, d: number) => {
    const j = i + d;
    // 2026-09-07: keep オープニング/エンディング pinned to the first/last
    // slot -- neither can move, and nothing can be moved into their spot
    // either. They are structurally "must" acts; letting them drift into
    // the middle never made narrative sense and only complicated the
    // schedule math for no gameplay benefit.
    if (j < 0 || j >= line.length) return;
    if (i === 0 || i === line.length - 1 || j === 0 || j === line.length - 1) return;
    const n = [...line];
    [n[i], n[j]] = [n[j], n[i]];
    setLine(n);
    setNote(null);
  };

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">当日の進行、組めた！</span>
          <div className="tl-list">
            {rows.map((r) => (
              <span key={r.act.id} className="tl-row done">
                <b>{fmt(r.startAt)}</b>
                <img src={A(r.act.img)} alt="" />
                <span>{r.act.name}</span>
                <small>{r.act.min}分</small>
              </span>
            ))}
            <span className="tl-row finish">
              <b>{fmt(finish)}</b>
              <span>終演（{fmt(END)}まで）</span>
            </span>
          </div>
        </div>
        <p className="game-line soft center-line">
          ならべ方はひとつじゃない。転換をへらすと、演目を増やせることもある。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この進行でいく！
        </button>
      </div>
    );
  }

  const waiting = ACTS.filter((a) => !line.includes(a.id));

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">演目をならべて、{fmt(END)}までに終わらせよう</span>
        <span className="task-sub">
          いまの終演 <strong className={over ? "bad" : "good"}>{fmt(finish)}</strong>（転換の時間も入っている）
        </span>
      </div>

      <div className="timeline">
        {rows.map((r, i) => (
          <div key={r.act.id} className="tl-item">
            {r.change > 0 && (
              <span className="tl-change">🔁 転換 {r.change}分</span>
            )}
            <div className={`tl-row ${r.endAt > END ? "over" : ""}`}>
              <b>{fmt(r.startAt)}</b>
              <img src={A(r.act.img)} alt="" />
              <span className="tl-name">{r.act.name}</span>
              <small>{r.act.min}分</small>
              <span className="tl-ctrl">
                <button className="tl-btn" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button className="tl-btn" onClick={() => move(i, 1)} disabled={i === line.length - 1}>↓</button>
                {!r.act.must && (
                  <button
                    className="tl-btn del"
                    onClick={() => { setLine(line.filter((x) => x !== r.act.id)); setNote(null); }}
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
          </div>
        ))}
        <div className={`tl-finish ${over ? "over" : ""}`}>
          終演 {fmt(finish)} {over && `（${fmt(END)}を ${finish - END}分 オーバー）`}
        </div>
      </div>

      {waiting.length > 0 && (
        <div className="act-pool">
          <span className="doc-label">🎪 入れられる演目</span>
          <div className="choice-row wrap">
            {waiting.map((a) => (
              <button
                key={a.id}
                className="act-card"
                onClick={() => {
                  // insert before the ending so it stays last
                  const n = [...line];
                  n.splice(Math.max(0, n.length - 1), 0, a.id);
                  setLine(n);
                  setNote(null);
                }}
              >
                <img src={A(a.img)} alt="" />
                <span className="act-name">{a.name}</span>
                <small>{a.min}分</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {note && <p className="game-note">{note}</p>}
      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        onClick={() => {
          if (over) {
            // 2026-09-07 repair round 2 (independent review HIGH: the very
            // first overtime attempt used to hand over the full strategy
            // -- "keep same-setup acts consecutive" -- for free. The first
            // miss now shows only the consequence (how far over); the
            // grouping strategy is only pointed at (not stated outright)
            // from the second attempt on, nudging the player toward the
            // rule card they can already see rather than reading the
            // answer directly here.
            const next = overAttempts + 1;
            setOverAttempts(next);
            setNote(
              next === 1
                ? `${finish - END}分オーバー。演目の数や順番を変えて、もう一度試してみよう。`
                : `${finish - END}分オーバー。演目を減らすか、順番を変えてみよう。🔁の資料も見てみて。`,
            );
            return;
          }
          if (line.length < 4) {
            setNote("オープニングとエンディングだけだと、ちょっとさびしいかも。演目を入れてみよう。");
            return;
          }
          setNote(null);
          setDone(true);
        }}
      >
        ▶ この進行でやってみる
      </button>
    </div>
  );
}
