// 給食 WORLD MAP — the opened bento box with 5 spots (WORLD_DESIGN.md §3/§4).
//
// TEMP_IMPLEMENTATION_ONLY: every shape drawn here (bento box, spot discs,
// trouble badge, roads, solved ring) is a placeholder so the flow can be
// exercised. Real art is DESIGN_NEEDED and drops in through `assets` without
// code changes (see README.md in this folder). Strings come only from copy.ts.
import { useEffect, useRef, useState } from "react";
import { COPY } from "../copy";
import { ROAD_IDS, SPOT_IDS } from "../types";
import type { LunchWorldView, RoadId, RoadState, SpotId } from "../types";
import "./lunchWorld.css";

export interface LunchWorldMapProps {
  view: LunchWorldView;
  onTapSpot: (id: SpotId) => void;
  assets?: { bento?: string; spot?: Partial<Record<SpotId, string>> };
  /** PLAY FIRST: labels are hidden by default (aria-label still present). */
  showLabels?: boolean;
}

/** Map coordinate space (viewBox units). The bento art is expected at this ratio. */
const MAP_W = 375;
const MAP_H = 560;

/** Spot centers in map units — the single place to retune layout.
 * Supply-chain order: grow (TL) → carry (TR) → cook (BL) → serve (center); menu (BR). */
const SPOT_POS: Record<SpotId, { x: number; y: number }> = {
  grow: { x: 95, y: 190 },
  carry: { x: 280, y: 190 },
  cook: { x: 95, y: 450 },
  menu: { x: 280, y: 450 },
  serve: { x: 187, y: 320 },
};

/** Road paths (map units). Retune together with SPOT_POS so ends stay attached. */
const ROAD_PATH: Record<RoadId, string> = {
  "grow-carry": "M95,190 C140,170 235,170 280,190",
  "carry-cook": "M280,190 C190,230 100,260 95,450",
  "cook-serve": "M95,450 C120,400 150,360 187,320",
  "menu-cook": "M280,450 C235,470 140,470 95,450",
  "menu-serve": "M280,450 C260,400 220,350 187,320",
};

/** Placeholder disc colors per spot (palette tokens only; TEMP). */
const SPOT_TONE: Record<SpotId, string> = {
  grow: "var(--v2-fresh-green)",
  carry: "var(--v2-sky-blue)",
  cook: "var(--v2-deep-green)",
  menu: "var(--v2-honey-yellow)",
  serve: "var(--v2-soft-sky)",
};

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function Road({ id, state }: { id: RoadId; state: RoadState }) {
  const d = ROAD_PATH[id];
  return (
    <g className={`lw-road is-${state}`} data-road={id}>
      <path className="lw-road-base" d={d} pathLength={100} />
      {state !== "off" && (
        // key remounts the pulse path when the state changes, restarting the one-shot run
        <path key={state} className="lw-road-pulse" d={d} pathLength={100} />
      )}
    </g>
  );
}

export default function LunchWorldMap({ view, onTapSpot, assets, showLabels = false }: LunchWorldMapProps) {
  // every tap reacts (touch → react): non-playable spots get a short nudge
  // (placeholder motion; the approved reaction is DESIGN_NEEDED DN-12)
  const [nudged, setNudged] = useState<SpotId | null>(null);
  const nudgeTimer = useRef<number | null>(null);
  useEffect(() => () => { if (nudgeTimer.current !== null) clearTimeout(nudgeTimer.current); }, []);
  const tap = (id: SpotId) => {
    setNudged(id);
    if (nudgeTimer.current !== null) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = window.setTimeout(() => setNudged(null), 450);
    onTapSpot(id);
  };
  return (
    <div className="lw-map" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
      {/* Layer 1: bento box frame (open lid at top, tray body below) */}
      {assets?.bento ? (
        <img className="lw-bento-img" src={assets.bento} alt="" draggable={false} />
      ) : (
        <svg className="lw-bento" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
          <rect className="lw-bento-lid" x="28" y="8" width="319" height="78" rx="18" />
          <rect className="lw-bento-lid-inner" x="44" y="22" width="287" height="46" rx="12" />
          <rect className="lw-bento-tray" x="16" y="96" width="343" height="456" rx="24" />
          <rect className="lw-bento-tray-inner" x="32" y="112" width="311" height="424" rx="18" />
          <text className="lw-temp-tag" x="40" y="130">{COPY.dev.tag}</text>
        </svg>
      )}

      {/* Layer 2: roads */}
      <svg className="lw-roads" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
        {ROAD_IDS.map((id) => (
          <Road key={id} id={id} state={view.roads[id]} />
        ))}
      </svg>

      {/* Layer 3: tappable spots */}
      {SPOT_IDS.map((id) => {
        const state = view.spots[id];
        const cls = [
          "lw-spot",
          `is-${state}`,
          view.newTrouble === id ? "is-new" : "",
          nudged === id ? "is-nudged" : "",
          id === "menu" ? "is-playable" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const art = assets?.spot?.[id];
        return (
          <button
            key={id}
            type="button"
            className={cls}
            data-spot={id}
            aria-label={COPY.world.spotLabel[id]}
            style={{ left: pct(SPOT_POS[id].x, MAP_W), top: pct(SPOT_POS[id].y, MAP_H) }}
            onClick={() => tap(id)}
          >
            <span className="lw-spot-body">
              {art ? (
                <img className="lw-spot-img" src={art} alt="" draggable={false} />
              ) : (
                <span className="lw-spot-shape" style={{ background: SPOT_TONE[id] }}>
                  {/* TEMP marker, not user copy: flags the placeholder shape as non-final art */}
                  <span className="lw-temp-tag">{COPY.dev.tag}</span>
                </span>
              )}
              {state === "trouble" && <span className="lw-spot-badge" />}
            </span>
            <span className={showLabels ? "lw-spot-label" : "lw-visually-hidden"} aria-hidden="true">
              {COPY.world.spotLabel[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
