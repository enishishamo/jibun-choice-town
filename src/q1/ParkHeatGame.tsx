// Q1: 公園の暑さ対策を考える仕事 (gameType: place_and_test)
//
// UI rules for this game:
//  - The park is ONE illustration that stays on screen the whole time.
//    Countermeasures are ADDED on top of it; slides, benches and paths are
//    never replaced or hidden.
//  - No abstract gauges. The goal is concrete: 「あそべる場所を4か所つくろう」.
//  - Data layers (日射 / 地面の温度 / 風) overlay the same park, so the child
//    reads the park itself instead of a text explanation.
//  - 2026-09-13 audit fix: GOAL was 3 of 4 spots. Since "tree" alone is a
//    correct countermeasure for play/bench/path (3 of the 4 spots), a child
//    could win by dropping the same part everywhere without ever reasoning
//    about the one spot (plaza) that needs different treatment — exactly
//    the "気づく" moment this game's weak-messages were written to trigger.
//    Raising GOAL to require all 4 spots closes that shortcut; a fully
//    correct solution still exists (tree/shade/mist/pavement, one per spot).
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { useDragDrop } from "./useDragDrop";
import { SPOTS, PARTS, GOAL, computeResult, countOk, isGoalReached, type PartId, type SpotId } from "./parkHeatLogic";

const H = (n: string) => `${import.meta.env.BASE_URL}assets/heat/${n}.png`;

type Layer = "sun" | "surface" | "wind" | null;

const LAYERS: { id: Exclude<Layer, null>; name: string; img: string }[] = [
  { id: "sun", name: "日射マップ", img: H("data-sun") },
  { id: "surface", name: "地面の温度", img: H("data-surface") },
  { id: "wind", name: "風の情報", img: H("data-wind") },
];

export default function ParkHeatGame({ onComplete }: Q1GameProps) {
  const [layer, setLayer] = useState<Layer>(null);
  const [placed, setPlaced] = useState<Partial<Record<SpotId, PartId>>>({});
  const [result, setResult] = useState<Partial<Record<SpotId, boolean>> | null>(null);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [cleared, setCleared] = useState(false);

  const put = (itemId: string, zoneId: string) => {
    setPlaced((p) => ({ ...p, [zoneId as SpotId]: itemId as PartId }));
    setSelected(null);
    setResult(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === (id as PartId) ? null : (id as PartId)),
  );

  const okCount = countOk(result);
  const anyPlaced = Object.keys(placed).length > 0;

  // 「ためす」は結果を公園に描くだけ。達成していても自動では進まず、
  // 子どもが変化（人が戻る／まだ暑い場所）を見てから自分で次へ進む。
  const run = () => {
    setResult(computeResult(placed));
  };
  const goalReached = isGoalReached(result);

  // Which "after" illustration matches what the child actually built?
  const afterImage = () => {
    const used = SPOTS.filter((s) => result?.[s.id]).map((s) => placed[s.id]!);
    const count = (p: PartId) => used.filter((u) => u === p).length;
    const best = (["tree", "shade", "pavement", "mist"] as PartId[]).sort(
      (a, b) => count(b) - count(a),
    )[0];
    return H(`after-${best === "pavement" ? "pavement" : best}`);
  };

  // ---------- E: the park after the child's work ----------
  if (cleared) {
    return (
      <div className="game board-game">
        <div className="park-after">
          <img src={afterImage()} alt="対策したあとの公園" />
          <span className="park-after-people">
            <img src={H("icon-people")} alt="" />
            人が戻ってきた！
          </span>
        </div>
        <p className="game-line center-line">
          日かげができて、地面もすずしくなった。<br />
          だれもいなかった公園に、また子どもや家族が戻ってきた。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          公園を見わたす
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game park-game" {...surfaceProps}>
      {/* B: the concrete goal, in the child's words */}
      <div className="park-goal">
        <p className="park-goal-lead">
          暑すぎて、公園に人がいなくなっちゃった！<br />
          どこを涼しくしたら、みんなが戻ってくるかな？
        </p>
        <div className="park-goal-row">
          <span className="park-goal-label">目標：あそべる場所を{GOAL}か所つくろう</span>
          <span className="park-goal-count">
            {[...Array(GOAL)].map((_, i) =>
              i < okCount ? (
                <img key={i} src={H("icon-good")} alt="" className="goal-dot" />
              ) : (
                <span key={i} className="goal-dot empty" />
              ),
            )}
          </span>
        </div>
      </div>

      {/* C: data layers, drawn over the same park */}
      <div className="layer-row">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            className={`layer-card ${layer === l.id ? "active" : ""}`}
            onClick={() => setLayer(layer === l.id ? null : l.id)}
          >
            <img src={l.img} alt="" />
            <small>{l.name}</small>
          </button>
        ))}
      </div>

      {/* the park: one illustration, always intact */}
      <div className={`park-stage layer-${layer ?? "none"}`}>
        <img className="park-photo" src={H("park-base")} alt="猛暑の公園" />
        <span className="park-overlay" />

        {SPOTS.map((s) => {
          const part = placed[s.id];
          const state = result ? (result[s.id] ? "ok" : "hot") : "idle";
          return (
            <button
              key={s.id}
              className={`park-zone ${state} ${drag || selected ? "ready" : ""}`}
              style={s.pos}
              data-drop={s.id}
              onClick={() => {
                if (selected) put(selected, s.id);
              }}
            >
              {part && (
                <img className="zone-part" src={H(`part-${part}`)} alt="" />
              )}
              <span className="zone-tag">
                {result && (
                  <img
                    className="zone-status"
                    src={H(result[s.id] ? "icon-good" : "icon-bad")}
                    alt=""
                  />
                )}
                {s.name}
              </span>
              {layer === "sun" && <span className="zone-data">{s.sun}</span>}
              {layer === "surface" && <span className="zone-data">{s.surface}</span>}
              {layer === "wind" && <span className="zone-data">{s.wind}</span>}
              {result?.[s.id] && (
                <img className="zone-people" src={H("icon-people")} alt="" />
              )}
            </button>
          );
        })}
      </div>

      {/* what didn't change — never the answer */}
      {result && okCount < GOAL && (
        <div className="sched-issues">
          {SPOTS.filter((s) => !result[s.id]).map((s) => {
            const part = placed[s.id];
            return (
              <p key={s.id}>
                {s.name}：{part ? s.weak[part] ?? "あまり変わらなかった…" : "まだ何も置いていない"}
              </p>
            );
          })}
        </div>
      )}

      {/* parts to place */}
      <div className="part-row">
        {PARTS.map((p) => (
          <button
            key={p.id}
            className={`part-card drag-item ${selected === p.id ? "selected" : ""}`}
            onPointerDown={startDrag(p.id)}
          >
            <img src={H(`part-${p.id}`)} alt="" />
            <small>{p.name}</small>
          </button>
        ))}
      </div>

      <div className="stack">
        {goalReached ? (
          <button className="btn primary big" onClick={() => setCleared(true)}>
            🎉 みんなが戻ってきた！公園を見わたす
          </button>
        ) : (
          <button className="btn primary big" disabled={!anyPlaced} onClick={run}>
            {anyPlaced ? "▶ ためす" : "公園に対策を置いてみよう"}
          </button>
        )}
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
        <img
          className="drag-ghost-img"
          src={H(`part-${drag.id}`)}
          alt=""
          style={{ left: drag.x, top: drag.y }}
        />
      )}
    </div>
  );
}
