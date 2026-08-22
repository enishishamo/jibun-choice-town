// Q1: 都市の暑さを分析し、街づくりを考える仕事 (gameType: layer_and_compare)
// B: 同じ39℃の日なのに、場所によって暑さがちがう。なぜ？
// C: 日射／風／建物／樹木のデータレイヤー。重ねないと理由が見えない。
// D: ①レイヤーをON/OFF ②2地点をタップして比較 ③対策を1つ置いて
//    再シミュレーション。効かない場所に置いてもヒートマップは変わらない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

type LayerId = "sun" | "wind" | "building" | "tree";
const LAYERS: { id: LayerId; name: string; emoji: string }[] = [
  { id: "sun", name: "日射", emoji: "☀️" },
  { id: "wind", name: "風", emoji: "🍃" },
  { id: "building", name: "建物", emoji: "🏢" },
  { id: "tree", name: "樹木", emoji: "🌳" },
];

interface Point {
  id: string;
  name: string;
  pos: { left: string; top: string };
  heat: number; // 0=涼しい 1=やや暑い 2=暑い
  sun: string;
  wind: string;
  building: string;
  tree: string;
  /** 対策が効く場所か（理由：日射が強く風が弱い＝熱がこもる） */
  fixable: boolean;
  afterFix?: number;
  fixNote: string;
}

const POINTS: Point[] = [
  {
    id: "a",
    name: "A：駅前の道",
    pos: { left: "30%", top: "28%" },
    heat: 2,
    sun: "強い（さえぎるものなし）",
    wind: "弱い（ビルにはさまれている）",
    building: "高いビルが両側に",
    tree: "なし",
    fixable: true,
    afterFix: 1,
    fixNote: "日射がやわらぎ、少し熱が抜けるようになった",
  },
  {
    id: "b",
    name: "B：川ぞいの道",
    pos: { left: "72%", top: "40%" },
    heat: 0,
    sun: "弱い（並木の陰）",
    wind: "強い（川から風がとおる）",
    building: "低い建物がまばら",
    tree: "並木あり",
    fixable: false,
    fixNote: "もともと涼しい場所。あまり変化はなかった",
  },
  {
    id: "c",
    name: "C：広い駐車場",
    pos: { left: "46%", top: "70%" },
    heat: 2,
    sun: "強い（一日中日なた）",
    wind: "ふつう",
    building: "まわりに建物なし",
    tree: "なし",
    fixable: true,
    afterFix: 1,
    fixNote: "地面の熱がやわらいだ",
  },
];

const HEAT_MARK = ["🟡", "🟠", "🔴"];

export default function UrbanHeatGame({ onComplete }: Q1GameProps) {
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [fixAt, setFixAt] = useState<string | null>(null);
  const [simmed, setSimmed] = useState(false);
  const [heats, setHeats] = useState<Record<string, number>>(
    Object.fromEntries(POINTS.map((p) => [p.id, p.heat])),
  );
  const [note, setNote] = useState<string | null>(null);

  const toggleLayer = (id: LayerId) =>
    setLayers((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const comparedPoints = POINTS.filter((p) => compare.includes(p.id));
  const improved = simmed && POINTS.some((p) => heats[p.id] < p.heat);

  const simulate = () => {
    if (!fixAt) return;
    const target = POINTS.find((p) => p.id === fixAt)!;
    if (target.fixable) {
      setHeats((h) => ({ ...h, [target.id]: target.afterFix! }));
      setNote(`${target.name}：${target.fixNote}`);
    } else {
      setNote(`${target.name}：${target.fixNote}。ほかの場所はどうだろう？レイヤーを見比べてみよう。`);
    }
    setSimmed(true);
  };

  if (improved) {
    return (
      <div className="game board-game">
        <div className="beforeafter">
          <div className="ba-col">
            <span className="ba-title">Before</span>
            {POINTS.map((p) => (
              <span key={p.id} className="ba-row">
                {HEAT_MARK[p.heat]} {p.name}
              </span>
            ))}
          </div>
          <span className="flow-arrow">→</span>
          <div className="ba-col">
            <span className="ba-title">After</span>
            {POINTS.map((p) => (
              <span key={p.id} className="ba-row">
                {HEAT_MARK[heats[p.id]]} {p.name}
              </span>
            ))}
          </div>
        </div>
        <p className="game-line center-line">
          暑い理由が見えると、どこを変えればいいかも見えてくる。
        </p>
        <p className="game-line soft center-line">
          このデータは、新しい街づくりや暑さ対策を考えるときにも使われる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          分析をまとめる
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">同じ39℃の日。なぜ、ここだけ暑い？</span>
        <div className="mission-chips">
          <span className={`mchip ${layers.length > 0 ? "ok" : ""}`}>
            {layers.length > 0 ? "✓" : "・"} データを重ねる
          </span>
          <span className={`mchip ${compare.length === 2 ? "ok" : ""}`}>
            {compare.length === 2 ? "✓" : "・"} 2地点をくらべる
          </span>
          <span className={`mchip ${fixAt ? "ok" : ""}`}>{fixAt ? "✓" : "・"} 対策を置く</span>
        </div>
      </div>

      <div className="layer-row">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            className={`layer-btn ${layers.includes(l.id) ? "active" : ""}`}
            onClick={() => toggleLayer(l.id)}
          >
            {l.emoji} {l.name}
          </button>
        ))}
      </div>

      <div className={`city-map ${layers.map((l) => `on-${l}`).join(" ")}`}>
        {POINTS.map((p) => (
          <button
            key={p.id}
            className={`city-point heat${heats[p.id]} ${compare.includes(p.id) ? "picked" : ""} ${fixAt === p.id ? "fixed" : ""}`}
            style={p.pos}
            onClick={() => {
              setCompare((c) =>
                c.includes(p.id) ? c.filter((x) => x !== p.id) : [...c.slice(-1), p.id],
              );
              setNote(null);
            }}
          >
            <span className="cp-heat">{HEAT_MARK[heats[p.id]]}</span>
            <small>{p.name}</small>
            {fixAt === p.id && <small className="layer-info">🌳 対策ずみ</small>}
          </button>
        ))}
      </div>

      {/* comparison panel: only shows layers the child turned on */}
      {comparedPoints.length > 0 && (
        <div className="compare-grid">
          {comparedPoints.map((p) => (
            <div key={p.id} className="compare-col">
              <span className="compare-name">{p.name}</span>
              {layers.length === 0 && (
                <small className="soft-note">上のデータをONにすると、中身が見えるよ</small>
              )}
              {layers.includes("sun") && <small>☀️ 日射：{p.sun}</small>}
              {layers.includes("wind") && <small>🍃 風：{p.wind}</small>}
              {layers.includes("building") && <small>🏢 建物：{p.building}</small>}
              {layers.includes("tree") && <small>🌳 樹木：{p.tree}</small>}
            </div>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      {/* place one countermeasure */}
      <div className="fix-zone">
        <span className="doc-label">🌳 暑さ対策（街路樹＋日よけ）をどこに置く？</span>
        <div className="choice-row">
          {POINTS.map((p) => (
            <button
              key={p.id}
              className={`choice-card ${fixAt === p.id ? "selected" : ""}`}
              onClick={() => {
                setFixAt(p.id);
                setSimmed(false);
                setNote(null);
              }}
            >
              <span className="choice-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn primary big" disabled={!fixAt} onClick={simulate}>
        {fixAt ? "▶ もう一度シミュレーション" : "対策を置く場所をえらぼう"}
      </button>
      {simmed && !improved && (
        <button
          className="btn ghost"
          onClick={() => {
            setFixAt(null);
            setSimmed(false);
            setNote(null);
          }}
        >
          別の場所に置きなおす
        </button>
      )}
    </div>
  );
}
