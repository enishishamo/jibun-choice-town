// Q1: 食べ残しを資源に変える工場の仕事
// B: 学校からの食べ残しに異物がまざっていて、このままでは処理できない。
// C: 受入ルール／磁選機（鉄だけ）／風力選別（軽いものだけ）／手選別。
// D: 異物ごとに「どの道具なら取れるか」を性質で考える。道具の性質を
//    知らないと解けない（プラに磁石は効かない、重い物は風で飛ばない）。
// E: 発酵→肥料→畑へ。「あ！さっきのにんじん畑につながった！」
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

interface Foreign {
  id: string;
  name: string;
  emoji: string;
  tool: string; // the tool that works
  rejects: Record<string, string>; // toolId -> why it fails (from C)
}

const FOREIGNS: Foreign[] = [
  {
    id: "spoon",
    name: "金属のスプーン",
    emoji: "🥄",
    tool: "magnet",
    rejects: {
      wind: "スプーンは重くて、風では飛ばない…。🧲べつの機械の性質を見てみよう。",
      hand: "取れた！…でも量が多いと見落としそう。🧲金属をまとめて取れる機械があったはず。",
    },
  },
  {
    id: "vinyl",
    name: "ビニールの切れはし",
    emoji: "🛍",
    tool: "wind",
    rejects: {
      magnet: "磁石にくっつかない！🧲磁選機のカードを見ると…取れるのは「鉄」だけ。",
      hand: "小さくてバラバラで、手では取りきれない…。💨軽さをいかせる機械は？",
    },
  },
  {
    id: "cup",
    name: "大きなプラスチックのカップ",
    emoji: "🥤",
    tool: "hand",
    rejects: {
      magnet: "プラスチックは磁石にくっつかない。🧲磁選機は「鉄」専用。",
      wind: "大きくて重さがあるから、風では飛ばない。👀目で見てわかる大きさなら…？",
    },
  },
];

const TOOLS = [
  { id: "magnet", name: "磁選機", emoji: "🧲" },
  { id: "wind", name: "風力選別", emoji: "💨" },
  { id: "hand", name: "手選別", emoji: "🫲" },
];

type Phase = "brief" | "sort" | "finale";

export default function RecycleGame({ onComplete, hasCompleted }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [removed, setRemoved] = useState<string[]>([]);
  const [target, setTarget] = useState<Foreign | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const farmDone = hasCompleted("farmer-lunch");

  const docs = [
    {
      id: "rule",
      icon: "📋",
      title: "この工場の受入ルール",
      body: (
        <>
          <p>この工場は、食べ残しを<strong>発酵させて肥料に変える</strong>工場（そういう契約・しくみ）。</p>
          <p>受け入れられるのは<strong>食品だけ</strong>。金属・プラスチック・ビニールは、機械の故障や肥料の品質低下のもとになるので、先に取りのぞく。</p>
        </>
      ),
    },
    {
      id: "magnet",
      icon: "🧲",
      title: "磁選機",
      body: (
        <>
          <p>強力な磁石で、流れてくる<strong>鉄（金属）</strong>を吸いつけて取りのぞく。</p>
          <p>磁石にくっつかないもの（プラスチック・ビニールなど）は取れない。</p>
        </>
      ),
    },
    {
      id: "wind",
      icon: "💨",
      title: "風力選別",
      body: (
        <>
          <p>風の力で、<strong>軽いもの</strong>（ビニールやうすいプラの切れはし）を飛ばして分ける。</p>
          <p>重いものは飛ばないので取れない。</p>
        </>
      ),
    },
    {
      id: "hand",
      icon: "🫲",
      title: "手選別",
      body: (
        <>
          <p>人の<strong>目で見て</strong>、大きな異物を取りのぞく。</p>
          <p>機械が苦手なもの（大きなプラ容器など）を見つけられる。</p>
        </>
      ),
    },
  ];

  if (phase === "brief") {
    return (
      <div className="game board-game">
        <div className="trouble-card">
          <span className="trouble-flash">🏭 リサイクル工場</span>
          <p className="trouble-title">
            学校から食べ残しが届いた。<br />でも…異物がまざってる！
          </p>
          <p className="trouble-line">
            このままでは肥料にできない。<br />機械と道具の性質を使い分けて、取りのぞこう。
          </p>
        </div>
        <button className="btn primary big" onClick={() => setPhase("sort")}>
          ラインをスタートする
        </button>
      </div>
    );
  }

  if (phase === "finale") {
    return (
      <div className="game board-game">
        <div className="recycle-flow">
          <img src={A("item-leftover")} alt="食べ残し" />
          <span className="flow-arrow">→</span>
          <img src={A("item-compost")} alt="肥料" />
          <span className="flow-arrow">→</span>
          <img src={A("bg-farm")} alt="畑" />
        </div>
        <p className="game-line center-line">
          異物のなくなった食べ残しは、発酵させて約2か月で肥料に。
          <br />
          できた肥料は、畑へ運ばれていく…
          {farmDone && (
            <>
              <br />
              <strong>あ！さっきのにんじん畑につながった！</strong>
            </>
          )}
        </p>
        <button className="btn primary big" onClick={onComplete}>
          つながりを見届ける
        </button>
      </div>
    );
  }

  const remaining = FOREIGNS.filter((f) => !removed.includes(f.id));

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">異物を取りのぞこう</span>
        <div className="mission-chips">
          {FOREIGNS.map((f) => (
            <span key={f.id} className={`mchip ${removed.includes(f.id) ? "ok" : ""}`}>
              {removed.includes(f.id) ? "✓" : "・"} {f.emoji}
            </span>
          ))}
        </div>
      </div>

      <InfoCards cards={docs} label="工場の資料と機械" />

      <div className="conveyor">
        <span className="doc-label">🏭 ライン上の食べ残し</span>
        <div className="conveyor-belt">
          <span className="conveyor-food">🍚🥬🍞</span>
          {remaining.map((f) => (
            <button
              key={f.id}
              className={`foreign-item ${target?.id === f.id ? "selected" : ""}`}
              onClick={() => {
                setTarget(target?.id === f.id ? null : f);
                setNote(null);
              }}
            >
              <span className="foreign-emoji">{f.emoji}</span>
              <small>{f.name}</small>
            </button>
          ))}
          {remaining.length === 0 && <span className="task-queue-empty">異物ゼロ！食品だけになった</span>}
        </div>
      </div>

      {target && (
        <>
          <p className="game-line soft">「{target.name}」— どの方法で取りのぞく？</p>
          <div className="choice-row">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className="choice-card"
                onClick={() => {
                  if (t.id !== target.tool) {
                    setNote(target.rejects[t.id]);
                    return;
                  }
                  setNote(null);
                  setRemoved((r) => [...r, target.id]);
                  setTarget(null);
                }}
              >
                <span className="choice-name">{t.emoji} {t.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {!target && remaining.length > 0 && (
        <p className="game-line soft">気になる異物をタップしてえらぼう。</p>
      )}
      {note && <p className="game-note">{note}</p>}

      {remaining.length === 0 && (
        <button className="btn primary big" onClick={() => setPhase("finale")}>
          発酵タンクへ送る！
        </button>
      )}
    </div>
  );
}
