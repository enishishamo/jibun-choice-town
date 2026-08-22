// Q1: 公園の暑さ対策を考える仕事 (gameType: place_and_test)
// B: 猛暑で遊具もベンチも熱く、だれも遊べない。
// C: 日射マップ／地面の表面温度／風の情報（レイヤーで開く）。
//    どの場所がなぜ暑いかは、レイヤーを見ないと分からない。
// D: 対策パーツを公園マップの各スポットへドラッグ →「ためす」で
//    暑さマップが変化。効かない組み合わせは赤のまま残る。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { useDragDrop } from "./useDragDrop";

type SpotId = "play" | "bench" | "plaza" | "path";
type PartId = "tree" | "shade" | "pavement" | "mist";
type Layer = "sun" | "ground" | "wind" | null;

interface Spot {
  id: SpotId;
  name: string;
  emoji: string;
  pos: { left: string; top: string };
  sun: string;
  ground: string;
  wind: string;
  /** parts that actually cool this spot (grounded in its conditions) */
  good: PartId[];
  weak: Partial<Record<PartId, string>>;
}

const SPOTS: Spot[] = [
  {
    id: "play",
    name: "遊具",
    emoji: "🛝",
    pos: { left: "26%", top: "24%" },
    sun: "一日中、日なた",
    ground: "金属＋砂　58℃",
    wind: "風はふつう",
    good: ["tree", "shade"],
    weak: { pavement: "遊具そのものが熱い。地面を変えても、すべり台の熱さは変わらない…", mist: "少し涼しいけど、遊具の直射日光はそのまま…" },
  },
  {
    id: "bench",
    name: "ベンチ",
    emoji: "🪑",
    pos: { left: "72%", top: "30%" },
    sun: "午後だけ日なた",
    ground: "コンクリ　52℃",
    wind: "風がとおる",
    good: ["tree", "shade"],
    weak: { pavement: "すわる面は日なたのまま…", mist: "ベンチがぬれてしまった…" },
  },
  {
    id: "plaza",
    name: "広場",
    emoji: "🟫",
    pos: { left: "44%", top: "62%" },
    sun: "さえぎるものなし",
    ground: "アスファルト　62℃！",
    wind: "風はよくとおる",
    good: ["pavement", "mist"],
    weak: { tree: "広すぎて、木1本の日陰では足りない…", shade: "広場ぜんぶは屋根でおおえない…" },
  },
  {
    id: "path",
    name: "通路",
    emoji: "🚶",
    pos: { left: "78%", top: "72%" },
    sun: "ほぼ日なた",
    ground: "アスファルト　57℃",
    wind: "風はよわい",
    good: ["tree", "pavement"],
    weak: { shade: "細長い通路には屋根がつけにくい…", mist: "通りぬけるだけなので、あまり効かない…" },
  },
];

const PARTS: { id: PartId; name: string; emoji: string }[] = [
  { id: "tree", name: "樹木", emoji: "🌳" },
  { id: "shade", name: "日よけ", emoji: "⛱" },
  { id: "pavement", name: "遮熱・保水の地面", emoji: "🧱" },
  { id: "mist", name: "ミスト", emoji: "💨" },
];

const LAYERS: { id: Exclude<Layer, null>; name: string; emoji: string }[] = [
  { id: "sun", name: "日射マップ", emoji: "☀️" },
  { id: "ground", name: "地面の温度", emoji: "🌡" },
  { id: "wind", name: "風の情報", emoji: "🍃" },
];

export default function ParkHeatGame({ onComplete }: Q1GameProps) {
  const [layer, setLayer] = useState<Layer>(null);
  const [placed, setPlaced] = useState<Partial<Record<SpotId, PartId>>>({});
  const [result, setResult] = useState<Partial<Record<SpotId, boolean>> | null>(null);
  const [selected, setSelected] = useState<PartId | null>(null);

  const put = (itemId: string, zoneId: string) => {
    setPlaced((p) => ({ ...p, [zoneId as SpotId]: itemId as PartId }));
    setSelected(null);
    setResult(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === (id as PartId) ? null : (id as PartId)),
  );

  const anyPlaced = Object.keys(placed).length > 0;
  const cooled = (s: Spot) => {
    const part = placed[s.id];
    return !!part && s.good.includes(part);
  };
  const allCooled = SPOTS.every(cooled);

  const run = () => {
    const r: Partial<Record<SpotId, boolean>> = {};
    SPOTS.forEach((s) => (r[s.id] = cooled(s)));
    setResult(r);
  };

  if (result && allCooled) {
    return (
      <div className="game board-game">
        <div className="park-map cooled">
          {SPOTS.map((s) => (
            <span key={s.id} className="park-spot ok" style={s.pos}>
              <span className="spot-emoji-big">{s.emoji}</span>
              <small>🟢</small>
            </span>
          ))}
          <span className="park-people">👧🧒👨‍👩‍👧</span>
        </div>
        <p className="game-line center-line">
          暑くてだれもいなかった場所に、また人が戻ってきた。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          公園を見わたす
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="mission-bar">
        <span className="mission-bar-title">公園のどこが暑い？対策を置いて、ためしてみよう</span>
        <div className="mission-chips">
          {SPOTS.map((s) => (
            <span
              key={s.id}
              className={`mchip ${result ? (result[s.id] ? "ok" : "bad") : ""}`}
            >
              {s.emoji} {result ? (result[s.id] ? "🟢" : "🔴") : "🔴"}
            </span>
          ))}
        </div>
      </div>

      {/* layer toggles = C */}
      <div className="layer-row">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            className={`layer-btn ${layer === l.id ? "active" : ""}`}
            onClick={() => setLayer(layer === l.id ? null : l.id)}
          >
            {l.emoji} {l.name}
          </button>
        ))}
      </div>

      {/* the park map */}
      <div className={`park-map layer-${layer ?? "none"}`}>
        {SPOTS.map((s) => {
          const part = placed[s.id];
          const state = result ? (result[s.id] ? "ok" : "hot") : part ? "set" : "hot";
          return (
            <button
              key={s.id}
              className={`park-spot ${state} ${drag || selected ? "ready" : ""}`}
              style={s.pos}
              data-drop={s.id}
              onClick={() => {
                if (selected) put(selected, s.id);
              }}
            >
              <span className="spot-emoji-big">
                {part ? PARTS.find((p) => p.id === part)!.emoji : s.emoji}
              </span>
              <small>{s.name}</small>
              {layer === "sun" && <small className="layer-info">☀️ {s.sun}</small>}
              {layer === "ground" && <small className="layer-info">🌡 {s.ground}</small>}
              {layer === "wind" && <small className="layer-info">🍃 {s.wind}</small>}
              {part && <small className="layer-info">{PARTS.find((p) => p.id === part)!.name}</small>}
            </button>
          );
        })}
      </div>

      {/* result feedback: show what didn't change, never the answer */}
      {result && !allCooled && (
        <div className="sched-issues">
          {SPOTS.filter((s) => !result[s.id]).map((s) => {
            const part = placed[s.id];
            return (
              <p key={s.id}>
                🔴 {s.name}：{part ? s.weak[part] ?? "あまり変わらなかった…" : "まだ何も置いていない"}
              </p>
            );
          })}
        </div>
      )}

      {/* parts to drag */}
      <div className="choice-row wrap">
        {PARTS.map((p) => (
          <button
            key={p.id}
            className={`choice-card drag-item ${selected === p.id ? "selected" : ""}`}
            onPointerDown={startDrag(p.id)}
          >
            <span className="choice-emoji">{p.emoji}</span>
            <span className="choice-name">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="stack">
        <button className="btn primary big" disabled={!anyPlaced} onClick={run}>
          {anyPlaced ? "▶ ためす" : "対策を公園に置いてみよう"}
        </button>
        {anyPlaced && (
          <button
            className="btn ghost"
            onClick={() => {
              setPlaced({});
              setResult(null);
            }}
          >
            ぜんぶ置き直す
          </button>
        )}
      </div>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {PARTS.find((p) => p.id === drag.id)?.emoji}
        </div>
      )}
    </div>
  );
}
