// Q1: 食べ残しを資源に変える工場の仕事 (gameType: sort_out)
// B: 届いた食べ残しに異物がまざっていて、このままでは処理できない。
// D: 道具（磁石・網・手選別）を持ちかえて、ライン上の異物に使う。
//    道具ごとに取れるものがちがう（磁石=鉄だけ、網=大きさで分ける、
//    手=目で見て取る）ので、組み合わせないと全部は取れない。
// E: 発酵→肥料→畑へ。「あ！さっきのにんじん畑だ！」の循環演出を維持。
//    最後に「まず食べ残しを減らすことが一番」という一言を添える。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type ToolId = "magnet" | "net" | "hand";

interface Foreign {
  id: string;
  name: string;
  emoji: string;
  tool: ToolId;
  rejects: Partial<Record<ToolId, string>>;
}

// ※選別方法の組み合わせは施設によって異なる（磁選・ふるい・手選別は
//   一般的な構成のひとつ）。
const FOREIGNS: Foreign[] = [
  {
    id: "spoon",
    name: "金属のスプーン",
    emoji: "🥄",
    tool: "magnet",
    rejects: {
      net: "網にかかったけど、食べ残しの大きなかたまりもいっしょに残ってしまう…。金属だけを確実に取れる道具は？",
      hand: "取れた！…でも食べ残しにうもれた金属は見落としそう。🧲金属をまとめて吸い付けられる機械があったはず。",
    },
  },
  {
    id: "bag",
    name: "大きなビニール袋",
    emoji: "🛍",
    tool: "net",
    rejects: {
      magnet: "磁石にくっつかない！🧲磁石が吸い付けられるのは「鉄」だけ。",
      hand: "取れた！…けど流れが速くて全部は追いつかない。🕸大きさで分けられる道具があったはず。",
    },
  },
  {
    id: "pspoon",
    name: "プラスチックのスプーン",
    emoji: "🥢",
    tool: "hand",
    rejects: {
      magnet: "くっつかない…プラスチックは磁石では取れない。",
      net: "小さくて網の目を通りぬけてしまった…。最後は人の目だ！",
    },
  },
];

const TOOLS: { id: ToolId; name: string; emoji: string; desc: string }[] = [
  { id: "magnet", name: "磁石（磁選機）", emoji: "🧲", desc: "鉄をまとめて吸い付ける" },
  { id: "net", name: "網（ふるい）", emoji: "🕸", desc: "大きさで分ける" },
  { id: "hand", name: "手選別", emoji: "🫲", desc: "目で見て取りのぞく" },
];

export default function RecycleGame({ onComplete, hasCompleted }: Q1GameProps) {
  const [holding, setHolding] = useState<ToolId | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [finale, setFinale] = useState(false);

  const farmDone = hasCompleted("farmer-lunch");
  const remaining = FOREIGNS.filter((f) => !removed.includes(f.id));

  const docs = [
    {
      id: "rule",
      icon: "📋",
      title: "この工場の受入ルール",
      body: (
        <>
          <p>この工場は、食べ残しを<strong>発酵させて肥料にする</strong>契約・しくみ。</p>
          <p>受け入れられるのは<strong>食品だけ</strong>。金属・プラスチック・ビニールは機械の故障や肥料の品質低下のもと。</p>
        </>
      ),
    },
  ];

  if (finale) {
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
          きれいになった食べ残しは、発酵させて約2か月で肥料に。
          <br />
          できた肥料は、畑へ運ばれていく…
          {farmDone && (
            <>
              <br />
              <strong>あ！さっきのにんじん畑につながった！</strong>
            </>
          )}
        </p>
        <p className="game-line soft">
          いちばんいいのは、まず食べ残しを減らすこと。それでも出たものを、できるだけもう一度使う。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          つながりを見届ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">
          異物がまざってる！道具を使い分けて取りのぞこう
        </span>
        <div className="mission-chips">
          {FOREIGNS.map((f) => (
            <span key={f.id} className={`mchip ${removed.includes(f.id) ? "ok" : ""}`}>
              {removed.includes(f.id) ? "✓" : "・"} {f.emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="conveyor">
        <span className="doc-label">🏭 ライン上の食べ残し{holding && "（道具を使いたい物をタップ！）"}</span>
        <div className="conveyor-belt">
          <span className="conveyor-food">🍚🥬🍞</span>
          {remaining.map((f) => (
            <button
              key={f.id}
              className={`foreign-item ${holding ? "aimable" : ""}`}
              onClick={() => {
                if (!holding) {
                  setNote("素手じゃあぶない！下の道具から、どれを使う？");
                  return;
                }
                if (holding !== f.tool) {
                  setNote(f.rejects[holding] ?? "この道具では取れないみたい…");
                  return;
                }
                setRemoved((r) => [...r, f.id]);
                setNote(null);
              }}
            >
              <span className="foreign-emoji">{f.emoji}</span>
              <small>{f.name}</small>
            </button>
          ))}
          {remaining.length === 0 && (
            <span className="task-queue-empty">異物ゼロ！食品だけになった</span>
          )}
        </div>
      </div>

      {note && <p className="game-note">{note}</p>}

      <div className="tool-dock">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`dock-btn big-dock ${holding === t.id ? "active" : ""}`}
            onClick={() => {
              setHolding(holding === t.id ? null : t.id);
              setNote(null);
            }}
          >
            <span>{t.emoji}</span>
            <small>{t.name}</small>
            <small className="dock-desc">{t.desc}</small>
          </button>
        ))}
      </div>

      <InfoCards cards={docs} label="こまったら見る資料" />

      {remaining.length === 0 && (
        <button className="btn primary big" onClick={() => setFinale(true)}>
          発酵タンクへ送る！
        </button>
      )}
    </div>
  );
}
