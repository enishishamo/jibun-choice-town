// Q1: イベントの進行をつくる (gameType: timetable)
// B: やりたい演目が多く、このままでは終演に間に合わない。
// C: 演目カード（分数）と転換の資料。転換時間はカードを見ないと
//    分からないので、単純に演目の分数だけ足すと必ず溢れる。
// D: タイムライン上に演目を並べ替え・出し入れする。終演時刻と
//    ステージ転換の条件を満たす組み合わせは複数ある。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

interface Act {
  id: string;
  name: string;
  img: string;
  min: number;
  /** ステージの作り（バンド編成など）。変わると転換に時間がかかる */
  setup: "band" | "light" | "none";
  must?: boolean;
}

const ACTS: Act[] = [
  { id: "open", name: "オープニング", img: P("a_mc"), min: 10, setup: "none", must: true },
  { id: "band", name: "バンド演奏", img: P("a_musician"), min: 45, setup: "band" },
  { id: "dance", name: "ダンスショー", img: P("a_dancer"), min: 30, setup: "light" },
  { id: "magic", name: "マジックショー", img: P("a_magician"), min: 25, setup: "light" },
  { id: "singer", name: "うたのステージ", img: P("a_singer"), min: 30, setup: "band" },
  { id: "quiz", name: "◯×クイズ", img: P("a_mascot"), min: 20, setup: "none" },
  { id: "end", name: "エンディング", img: P("a_mc"), min: 10, setup: "none", must: true },
];

const START = 10 * 60; // 10:00
const END = 15 * 60; // 15:00 終演
const SWAP = 15; // 作りが変わるときの転換
const SAME = 5; // 同じ作りのままの転換

const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

export default function TimetableGame({ onComplete }: Q1GameProps) {
  const [line, setLine] = useState<string[]>(["open", "end"]);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const acts = line.map((id) => ACTS.find((a) => a.id === id)!);
  // walk the timeline adding each act + the changeover before it
  let t = START;
  const rows = acts.map((a, i) => {
    const prev = i > 0 ? acts[i - 1] : null;
    const change = prev ? (prev.setup === a.setup ? SAME : SWAP) : 0;
    const startAt = t + change;
    t = startAt + a.min;
    return { act: a, change, startAt, endAt: t };
  });
  const finish = t;
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
    if (j < 0 || j >= line.length) return;
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
                <img src={r.act.img} alt="" />
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
              <img src={r.act.img} alt="" />
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
                <img src={a.img} alt="" />
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
            setNote(`${finish - END}分オーバー。演目を減らすか、同じ作りの演目を続けて転換をへらしてみよう（🔁の資料）。`);
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
