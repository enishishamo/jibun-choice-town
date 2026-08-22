// Q1: 音響 (gameType: sound_check)
// B: リハーサル。うしろの席まで声がとどかない。
// C: 客席3か所の「聞こえ方」メーターと、機材の資料。資料を見ないと
//    「音量を上げるだけだと前がうるさくなる」「スピーカーを追加すると
//    後ろに届く」が分からない。
// D: メインの音量つまみ／スピーカーの向き／うしろ用スピーカーの追加を
//    操作 →「リハーサルする」で3席の聞こえ方が変わる。
//
// ※本物の音響はもっと複雑。ここでは「席によって聞こえ方がちがう」
//   「大きくすればいいわけではない」という感覚に絞った簡易モデル。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

type SeatId = "front" | "middle" | "back";
const SEATS: { id: SeatId; label: string }[] = [
  { id: "front", label: "前の席" },
  { id: "middle", label: "まん中" },
  { id: "back", label: "うしろ" },
];

// 0=聞こえない 1=小さい 2=ちょうどいい 3=うるさい
const LABEL = ["聞こえない", "小さい", "ちょうどいい", "うるさい！"];

export default function SoundCheckGame({ onComplete }: Q1GameProps) {
  const [volume, setVolume] = useState(3); // 1-6
  const [angle, setAngle] = useState<"down" | "wide">("down"); // 向き
  const [extra, setExtra] = useState(false); // うしろ用スピーカー
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // simple model: sound falls off with distance; wide angle trades front
  // level for reach; the extra speaker lifts the back only.
  const level = (seat: SeatId): number => {
    const base = volume;
    let v =
      seat === "front" ? base : seat === "middle" ? base - 1.5 : base - 3;
    if (angle === "wide") v += seat === "front" ? -1 : 0.5;
    if (extra && seat === "back") v += 2;
    if (extra && seat === "middle") v += 0.5;
    if (v >= 5.5) return 3; // too loud
    if (v >= 3) return 2;
    if (v >= 1.5) return 1;
    return 0;
  };

  const states = SEATS.map((s) => ({ ...s, v: level(s.id) }));
  const allGood = states.every((s) => s.v === 2);

  const docs = [
    {
      id: "gear",
      icon: "🔊",
      title: "使える機材",
      body: (
        <>
          <p><strong>メインスピーカー</strong>：ステージの左右。前のほうによく届く。</p>
          <p><strong>うしろ用スピーカー</strong>：客席の後ろに足せる。うしろだけ持ち上がる。</p>
          <p><strong>向き</strong>：下向き＝前が強い／広げる＝前が少し下がって、遠くに届く。</p>
        </>
      ),
    },
    {
      id: "rule",
      icon: "📋",
      title: "リハーサルのコツ",
      body: (
        <>
          <p>音は<strong>遠いほど小さく</strong>なる。うしろに合わせて上げすぎると、前の人がうるさい。</p>
          <p>目標は<strong>どの席も「ちょうどいい」</strong>。</p>
        </>
      ),
    },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">どの席にも、音がとどいた！</span>
          <div className="result-rows">
            {states.map((s) => (
              <span key={s.id} className="rrow">
                <b>{s.label}</b>
                <span className="good">ちょうどいい</span>
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          大きくすればいい、ではなかった。席ごとに確かめるのがリハーサル。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          本番へ！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">機材を動かして、リハーサルしてみよう</span>
        <span className="task-sub">目標：前・まん中・うしろ、ぜんぶ「ちょうどいい」に</span>
      </div>

      {/* the hall: stage at the top, three seat rows */}
      <div className="hall">
        <div className="hall-stage">
          <img src={P("s_speaker")} alt="" className={`hall-sp ${angle}`} />
          <span className="hall-stage-label">🎤 ステージ</span>
          <img src={P("s_speaker")} alt="" className={`hall-sp right ${angle}`} />
        </div>
        {states.map((s) => (
          <div key={s.id} className={`hall-row v${tried ? s.v : "x"}`}>
            <span className="hall-seat">{s.label}</span>
            <span className="hall-meter">
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className={`hall-bar ${tried && s.v >= n && s.v > 0 ? `on l${s.v}` : ""}`} />
              ))}
            </span>
            <span className="hall-state">{tried ? LABEL[s.v] : "？"}</span>
          </div>
        ))}
        {extra && (
          <div className="hall-extra">
            <img src={P("s_monitor")} alt="" />
            <small>うしろ用スピーカー</small>
          </div>
        )}
      </div>

      {/* the desk */}
      <div className="sound-desk">
        <div className="desk-row">
          <span className="desk-label">
            <img src={P("s_mixer")} alt="" />
            メインの音量
          </span>
          <span className="desk-ctrl">
            <button className="kg-btn" onClick={() => { setVolume(Math.max(1, volume - 1)); setTried(false); setNote(null); }} disabled={volume <= 1}>−</button>
            <span className="vol-bar">
              {[...Array(6)].map((_, n) => (
                <span key={n} className={`vol-cell ${n < volume ? "on" : ""}`} />
              ))}
            </span>
            <button className="kg-btn" onClick={() => { setVolume(Math.min(6, volume + 1)); setTried(false); setNote(null); }} disabled={volume >= 6}>＋</button>
          </span>
        </div>
        <div className="desk-row">
          <span className="desk-label">
            <img src={P("s_speaker")} alt="" />
            スピーカーの向き
          </span>
          <span className="desk-ctrl">
            <button
              className={`toggle-btn ${angle === "down" ? "on" : ""}`}
              onClick={() => { setAngle("down"); setTried(false); setNote(null); }}
            >
              下向き
            </button>
            <button
              className={`toggle-btn ${angle === "wide" ? "on" : ""}`}
              onClick={() => { setAngle("wide"); setTried(false); setNote(null); }}
            >
              広げる
            </button>
          </span>
        </div>
        <div className="desk-row">
          <span className="desk-label">
            <img src={P("s_monitor")} alt="" />
            うしろ用スピーカー
          </span>
          <span className="desk-ctrl">
            <button
              className={`toggle-btn ${extra ? "on" : ""}`}
              onClick={() => { setExtra(!extra); setTried(false); setNote(null); }}
            >
              {extra ? "つないだ" : "つなぐ"}
            </button>
          </span>
        </div>
      </div>

      {tried && !allGood && (
        <div className="sched-issues">
          {states.filter((s) => s.v !== 2).map((s) => (
            <p key={s.id}>{s.label}：{LABEL[s.v]}</p>
          ))}
        </div>
      )}
      {note && <p className="game-note">{note}</p>}

      <InfoCards cards={docs} label="こまったら見る資料" />

      {!(tried && allGood) ? (
        <button
          className="btn primary big"
          onClick={() => {
            setTried(true);
            if (!allGood) setNote("席によって聞こえ方がちがう。🔊機材の資料を見て、もう一度調整してみよう。");
          }}
        >
          ▶ リハーサルする
        </button>
      ) : (
        <button className="btn primary big" onClick={() => setDone(true)}>
          この設定で本番へ！
        </button>
      )}
    </div>
  );
}
