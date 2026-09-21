// 給食 WORLD MAP — the opened bento box with 5 spots (WORLD_DESIGN.md §3/§4).
//
// The bento box and the spot tiles are drawn as clay objects in CSS/SVG and are
// replaced 1:1 by the generated art through `assets` when it is present — the
// geometry (SPOT_POS, ROAD_PATH) is the same either way, so nothing shifts.
// Labels stay hidden (PLAY FIRST); they exist only for assistive technology.
// Strings come only from copy.ts.
import { useEffect, useRef, useState } from "react";
import Art from "../Art";
import PlaceMark from "../PlaceMark";
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
const MAP_H = 700;

/** Spot centers in map units — the single place to retune layout.
 * Supply-chain order: grow (TL) → carry (TR) → cook (BL) → serve (center); menu (BR). */
const SPOT_POS: Record<SpotId, { x: number; y: number }> = {
  grow: { x: 96, y: 250 },
  carry: { x: 279, y: 250 },
  cook: { x: 96, y: 560 },
  menu: { x: 279, y: 560 },
  serve: { x: 187, y: 405 },
};

/** Road paths (map units). Retune together with SPOT_POS so ends stay attached. */
const ROAD_PATH: Record<RoadId, string> = {
  "grow-carry": "M96,250 C140,226 235,226 279,250",
  "carry-cook": "M279,250 C196,300 104,330 96,560",
  "cook-serve": "M96,560 C122,500 152,448 187,405",
  "menu-cook": "M279,560 C235,584 140,584 96,560",
  "menu-serve": "M279,560 C258,500 220,445 187,405",
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
  // every tap reacts (touch → react): a place that has no PLAY yet still nudges,
  // so the child never touches something that seems broken
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
    <div className="lw-world">
    <div className="lw-map" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }} role="group" aria-label={COPY.world.title}>
      {/* Layer 1: bento box frame (open lid at top, tray body below) */}
      <Art
        src={assets?.bento}
        className="lw-bento-img"
        fallback={
        <svg className="lw-bento" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
          <rect className="lw-bento-shadow" x="22" y="130" width="331" height="558" rx="30" />
          <rect className="lw-bento-lid" x="26" y="10" width="323" height="96" rx="22" />
          <rect className="lw-bento-lid-inner" x="44" y="26" width="287" height="58" rx="15" />
          <rect className="lw-bento-clasp" x="166" y="92" width="43" height="22" rx="9" />
          <rect className="lw-bento-tray" x="14" y="122" width="347" height="560" rx="28" />
          <rect className="lw-bento-tray-inner" x="30" y="138" width="315" height="528" rx="21" />
        </svg>
        }
      />

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
            aria-label={`${COPY.world.spot[id]}（${COPY.world.state[state]}）`}
            style={{ left: pct(SPOT_POS[id].x, MAP_W), top: pct(SPOT_POS[id].y, MAP_H) }}
            onClick={() => tap(id)}
          >
            <span className="lw-spot-body">
              <Art src={art} className="lw-spot-img" fallback={<PlaceMark id={id} className="lw-spot-mark" />} />
              {state === "trouble" && <span className="lw-spot-badge" />}
            </span>
            <span className={showLabels ? "lw-spot-label" : "lw-visually-hidden"} aria-hidden="true">
              {COPY.world.spot[id]}
            </span>
          </button>
        );
      })}
    </div>
    </div>
  );
}
