// Q1: 雑踏警備 (gameType: crowd_flow)
// B: 開場して人が増え、入口の近くが混んできた。
// C: 混雑の見方（どこが詰まるか）と道具の性質。資料を見ないと
//    「柵は流れを分ける」「案内板は先に知らせて分散させる」
//    「出口を分けると戻り客とぶつからない」が分からない。
// D: 3か所のポイントに道具を置く →「ようすを見る」で混雑度が変化。
//    置き方で結果が変わり、置き直せる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const E = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.jpg`;
const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

type SpotId = "gate" | "food" | "stage";
type ToolId = "fence" | "signpost" | "infomap" | "cone";

interface Spot {
  id: SpotId;
  name: string;
  pos: { left: string; top: string };
  crowd: number; // 0-3
  why: string;
  /** この場所の混雑をやわらげる道具 */
  fix: ToolId[];
  wrong: Partial<Record<ToolId, string>>;
}

// ※実際の警備計画は現場ごとに大きく異なる。ここでは「詰まりを見つけて
//   流れを分ける」という考え方だけを取り出した簡易モデル。
const SPOTS: Spot[] = [
  {
    id: "gate",
    name: "入口",
    pos: { left: "50%", top: "78%" },
    crowd: 3,
    why: "入ってきた人が立ち止まって、うしろがつかえている",
    fix: ["fence", "infomap"],
    wrong: {
      cone: "コーンだけでは、人の列が分かれない…",
      signpost: "入口では、まだどこへ行くか決まっていない人が多い…",
    },
  },
  {
    id: "food",
    name: "飲食ブースの前",
    pos: { left: "22%", top: "46%" },
    crowd: 2,
    why: "行列が通路にはみ出している",
    fix: ["cone", "fence"],
    wrong: {
      infomap: "案内図を見に人が集まって、よけい混んでしまった…",
      signpost: "行列そのものは動かない…",
    },
  },
  {
    id: "stage",
    name: "ステージ前",
    pos: { left: "72%", top: "34%" },
    crowd: 2,
    why: "みんな同じ道からステージへ向かっている",
    fix: ["signpost"],
    wrong: {
      fence: "柵でふさぐと、行き場がなくなってもっと混んだ…",
      cone: "せまくすると、かえって詰まってしまった…",
      infomap: "立ち止まって見る人が増えてしまった…",
    },
  },
];

const TOOLS: { id: ToolId; name: string; img: string; desc: string }[] = [
  { id: "fence", name: "柵", img: P("p_fence"), desc: "列を分けて、流れを2つにする" },
  { id: "signpost", name: "方向案内サイン", img: P("p_signpost"), desc: "行き先を早めに知らせて、道を分ける" },
  { id: "infomap", name: "案内板・地図", img: P("p_infomap"), desc: "立ち止まって見る場所をつくる（広いところ向き）" },
  { id: "cone", name: "コーン", img: P("p_cone"), desc: "はみ出しをおさえて、通路を確保する" },
];

export default function CrowdFlowGame({ onComplete }: Q1GameProps) {
  const [placed, setPlaced] = useState<Partial<Record<SpotId, ToolId>>>({});
  const [holding, setHolding] = useState<ToolId | null>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [looked, setLooked] = useState<SpotId[]>([]);

  const crowdOf = (s: Spot) => {
    const t = placed[s.id];
    if (!t) return s.crowd;
    return s.fix.includes(t) ? 0 : s.crowd;
  };
  const allCalm = SPOTS.every((s) => crowdOf(s) === 0);

  const docs = [
    {
      id: "read",
      icon: "👀",
      title: "混雑の見かた",
      body: (
        <>
          <p>赤いところほど、人が<strong>詰まっている</strong>。</p>
          <p>場所をタップすると、<strong>なぜ詰まっているか</strong>が分かる。</p>
          <p className="soft-note">同じ「混雑」でも、理由がちがえば手当てもちがう。</p>
        </>
      ),
    },
    {
      id: "tools",
      icon: "🧰",
      title: "道具の性質",
      body: (
        <>
          {TOOLS.map((t) => (
            <p key={t.id}>{t.name}：{t.desc}</p>
          ))}
        </>
      ),
    },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="scene-shot">
          <img src={E("venue_busy")} alt="落ちついた会場" />
          <span className="scene-shot-cap">人の流れが分かれて、混雑が落ちついた</span>
        </div>
        <p className="game-line soft center-line">
          混んでから止めるのはむずかしい。混む前に、流れを分けておく。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          見まわりを続ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {holding ? `「${TOOLS.find((t) => t.id === holding)!.name}」を置く場所をタップ` : "混んでいる場所をタップして、ようすを見よう"}
        </span>
        <span className="task-sub">道具を置いたら「ようすを見る」で、人の流れが変わる</span>
      </div>

      <div className="crowd-board" style={{ backgroundImage: `url(${E("venue_map")})` }}>
        {SPOTS.map((s) => {
          const c = checked ? crowdOf(s) : s.crowd;
          const t = placed[s.id];
          return (
            <button
              key={s.id}
              className={`crowd-spot c${c} ${holding ? "aim" : ""}`}
              style={s.pos}
              onClick={() => {
                if (holding) {
                  setPlaced((p) => ({ ...p, [s.id]: holding }));
                  setHolding(null);
                  setChecked(false);
                  setNote(null);
                  return;
                }
                setLooked((l) => (l.includes(s.id) ? l : [...l, s.id]));
                setNote(`${s.name}：${s.why}`);
              }}
            >
              {t && <img className="crowd-tool" src={TOOLS.find((x) => x.id === t)!.img} alt="" />}
              <span className="crowd-people">{c === 0 ? "🙂" : "🧑‍🤝‍🧑"}</span>
              <span className="crowd-name">{s.name}</span>
            </button>
          );
        })}
      </div>

      <div className="tool-dock">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`dock-btn big-dock ${holding === t.id ? "active" : ""}`}
            onClick={() => { setHolding(holding === t.id ? null : t.id); setNote(null); }}
          >
            <img src={t.img} alt="" />
            <small>{t.name}</small>
          </button>
        ))}
      </div>

      {note && <p className="game-note">{note}</p>}

      {checked && !allCalm && (
        <div className="sched-issues">
          {SPOTS.filter((s) => crowdOf(s) > 0).map((s) => {
            const t = placed[s.id];
            return (
              <p key={s.id}>
                {s.name}：{t ? s.wrong[t] ?? "あまり変わらなかった…" : "まだ混んだまま"}
              </p>
            );
          })}
        </div>
      )}

      <InfoCards cards={docs} label="こまったら見る資料" />

      {!(checked && allCalm) ? (
        <button
          className="btn primary big"
          disabled={Object.keys(placed).length === 0}
          onClick={() => {
            setChecked(true);
            setNote(null);
            if (looked.length === 0) {
              setNote("場所をタップすると、なぜ詰まっているかが分かるよ。");
            }
          }}
        >
          {Object.keys(placed).length === 0 ? "道具を置いてみよう" : "▶ ようすを見る"}
        </button>
      ) : (
        <button className="btn primary big" onClick={() => setDone(true)}>
          会場全体を見わたす
        </button>
      )}
      {Object.keys(placed).length > 0 && !allCalm && (
        <button className="btn ghost" onClick={() => { setPlaced({}); setChecked(false); setNote(null); }}>
          ぜんぶ置き直す
        </button>
      )}
    </div>
  );
}
