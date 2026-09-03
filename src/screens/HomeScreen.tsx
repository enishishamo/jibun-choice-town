// HOME: 「生きた町のアトラス」 (factory/state/expansion/map-architecture-decision.md)
// ONE continuous region canvas — the existing town illustration stays as the
// center tile, new districts attach around it, foggy silhouettes tease what is
// not open yet. The camera ZOOMS (CSS transform, no screen cuts) from the
// region view into a district; worlds are tapped inside a district.
// No profession lists. No NEW-badge walls: a capped set of living signals
// (people gathering / sparks) marks where something is happening right now.
import { useEffect, useMemo, useRef, useState } from "react";
import { events, places } from "../data";
import {
  DISTRICTS, TOWN_TILE, WORLD_DISTRICT, DISTRICT_CAPACITY, TERRAIN_FILL, districtSlot, getDistrict,
} from "../data/districts";
import type { District } from "../data/districts";
import { useGame } from "../state/GameState";
import type { WorldState } from "../state/GameState";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;
const CANVAS_W = 1200;
const CANVAS_H = 820;
/** at most this many "something is happening" signals on the region view (§15) */
const MAX_SIGNALS = 5;

interface WorldMarker {
  eventId: string;
  label: string;
  districtId: string;
  x: number;
  y: number;
  state: WorldState;
}

// ONE face icon per world state — the map reads without labels (§13):
// unseen worlds burn (come look!), visited ones rest, in-progress shows the
// tool, completed plants the flag, updated sparkles the call-back.
const STATE_FACE: Record<WorldState, string> = {
  DISCOVERED: "🔥",
  VISITED: "📍",
  IN_PROGRESS: "🔨",
  COMPLETED: "🚩",
  UPDATED: "✨",
};

export default function HomeScreen() {
  const { navigate, progress, worldState } = useGame();
  const [focus, setFocus] = useState<string | null>(null); // district id or null = region
  const [teaser, setTeaser] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // region-mode drag offset
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 375, h: 480 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setVp({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- world markers (positions are DERIVED, never hand-tuned per world) ---
  const markers = useMemo<WorldMarker[]>(() => {
    const byDistrict: Record<string, string[]> = {};
    for (const ev of events) {
      if (!(ev.id in WORLD_DISTRICT)) {
        // §30: a world must be registered to a district — never silently pile
        // onto the center tile
        console.warn(`[atlas] world "${ev.id}" has no WORLD_DISTRICT entry — defaulting to center`);
      }
      const d = WORLD_DISTRICT[ev.id] ?? "center";
      (byDistrict[d] ??= []).push(ev.id);
    }
    for (const [districtId, ids] of Object.entries(byDistrict)) {
      if (districtId !== "center" && ids.length > DISTRICT_CAPACITY) {
        console.warn(`[atlas] district "${districtId}" holds ${ids.length} worlds (capacity ${DISTRICT_CAPACITY}) — open a new district (§12/§30)`);
      }
    }
    const out: WorldMarker[] = [];
    for (const [districtId, ids] of Object.entries(byDistrict)) {
      const d = getDistrict(districtId);
      if (!d) continue;
      ids.forEach((eventId, i) => {
        const ev = events.find((e) => e.id === eventId)!;
        let x: number, y: number;
        const place = places.find((p) => p.eventId === eventId);
        if (districtId === "center" && place?.mapPos) {
          // existing worlds keep their authored positions on the town tile
          x = TOWN_TILE.x + (parseFloat(place.mapPos.left) / 100) * TOWN_TILE.w;
          y = TOWN_TILE.y + (parseFloat(place.mapPos.top) / 100) * TOWN_TILE.h;
        } else {
          const s = districtSlot(d, i, ids.length);
          x = s.x;
          y = s.y;
        }
        out.push({ eventId, label: ev.shortLabel ?? ev.title.split("\n")[0], districtId, x, y, state: worldState(eventId) });
      });
    }
    // generic de-collision pass (§30): whatever produced the raw positions
    // (authored tile spots or district rings), labels never stack. Deterministic
    // relaxation — push overlapping pairs apart, clamp to the canvas.
    const MIN_H = 52;
    const approxW = (m: WorldMarker) => Math.min(160, 40 + m.label.length * 13);
    for (let pass = 0; pass < 14; pass++) {
      let moved = false;
      for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
          const a = out[i], b2 = out[j];
          const dx = b2.x - a.x, dy = b2.y - a.y;
          const ox = (approxW(a) + approxW(b2)) / 2 - Math.abs(dx), oy = MIN_H - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            if (ox < oy) {
              const push = (ox / 2 + 1) * (dx >= 0 ? 1 : -1);
              a.x -= push; b2.x += push;
            } else {
              const push = (oy / 2 + 1) * (dy >= 0 ? 1 : -1);
              a.y -= push; b2.y += push;
            }
          }
        }
      }
      if (!moved) break;
    }
    for (const m of out) {
      m.x = Math.min(Math.max(m.x, 48), CANVAS_W - 48);
      m.y = Math.min(Math.max(m.y, 30), CANVAS_H - 24);
    }
    return out;
  }, [worldState]);

  // living signals: worlds never visited yet, newest (registry order) first
  const signalIds = useMemo(() => {
    const fresh = markers.filter((m) => m.state === "DISCOVERED" || m.state === "UPDATED");
    return new Set(fresh.slice(-MAX_SIGNALS).map((m) => m.eventId));
  }, [markers]);

  // ---- camera --------------------------------------------------------------
  // region mode fills the viewport height and is PANNABLE (the map is a place,
  // not a thumbnail); district mode zooms the camera onto the district.
  // mobile: show a generous ~840px slice (all open districts peek in, fog
  // teases at the edges, pan reaches the rest). wide screens: fit the atlas.
  const regionScale = vp.w < 700 ? vp.w / 840 : Math.min(vp.w / CANVAS_W, vp.h / CANVAS_H);
  const clampPan = (tx: number, ty: number, s: number) => ({
    tx: Math.min(0, Math.max(vp.w - CANVAS_W * s, tx)),
    ty: Math.min(0, Math.max(vp.h - CANVAS_H * s, ty)),
  });
  const cam = useMemo(() => {
    if (!focus) {
      const s = regionScale;
      const center = getDistrict("center")!;
      const base = clampPan(vp.w / 2 - center.cx * s, vp.h / 2 - center.cy * s, s);
      const c = clampPan(base.tx + pan.x, base.ty + pan.y, s);
      return { s, tx: c.tx, ty: c.ty };
    }
    const d = getDistrict(focus)!;
    const s = Math.min(Math.max((Math.min(vp.w, vp.h) * 0.92) / (d.r * 2), regionScale * 1.5), 2.2);
    return { s, tx: vp.w / 2 - d.cx * s, ty: vp.h / 2 - d.cy * s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, vp, regionScale, pan]);

  // drag-to-pan (region mode only); a real drag suppresses the tap
  const onPointerDown = (e: React.PointerEvent) => {
    if (focus) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) { setPan({ x: d.px + dx, y: d.py + dy }); setDragging(true); setHasPanned(true); }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d?.moved) suppressTap.current = true;
    window.setTimeout(() => (suppressTap.current = false), 80);
  };
  const suppressTap = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [hasPanned, setHasPanned] = useState(false);

  // first-visit sweep: the camera starts a little west and glides home,
  // showing that the map continues beyond the screen
  useEffect(() => {
    setPan({ x: 140, y: 30 });
    const t = window.setTimeout(() => setPan({ x: 0, y: 0 }), 450);
    return () => window.clearTimeout(t);
  }, []);

  const openDistrict = (d: District) => {
    if (d.foggy) {
      setTeaser(d.teaser ?? "まだ、もやの向こう。");
      window.setTimeout(() => setTeaser(null), 3200);
      return;
    }
    setPan({ x: 0, y: 0 });
    setFocus(d.id);
  };

  const focused = focus ? getDistrict(focus) : null;
  const quietPlaces = places.filter((p) => !p.eventId && p.mapPos);

  return (
    <div className="screen world-screen">
      <div className="world">
        <header className="world-header">
          <div className="world-header-text">
            <h1 className="logo">JIBUN CHOICE</h1>
            <p className="tagline">知らない社会を、ちょっとのぞいてみよう。</p>
          </div>
          <button className="zukan-btn" onClick={() => navigate({ name: "zukan" })}>
            📖 しごと図鑑
            {progress.discovered.length > 0 && (
              <span className="zukan-count">{progress.discovered.length}</span>
            )}
          </button>
        </header>

        <p className="world-lead">
          {focused
            ? focused.lead
            : "きらきらしている場所で、いま何かが起きている。気になったところへ行ってみよう。"}
        </p>

        <div
          className={`region-viewport ${focus ? "is-district" : "is-region"}`}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className={`region-canvas ${dragging ? "no-anim" : ""}`}
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}
          >
            {/* terrain */}
            <svg className="region-terrain" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={CANVAS_W} height={CANVAS_H}>
              <rect width={CANVAS_W} height={CANVAS_H} fill="#dcead0" />
              {/* sea (harbor corner) */}
              <path d="M0,540 C170,530 250,600 300,820 L0,820 Z" fill="#a8cfe3" />
              <path d="M0,585 C160,575 235,640 275,820 L0,820 Z" fill="#8fbfda" opacity="0.7" />
              {/* river: forest -> town -> sea */}
              <path d="M950,140 C880,250 760,300 640,330 C480,370 340,470 250,660" fill="none" stroke="#9fc8de" strokeWidth="26" strokeLinecap="round" opacity="0.85" />
              {/* district grounds: generated from the registry (terrain field),
                  never hard-coded per district (§30) */}
              {DISTRICTS.filter((d) => !d.foggy && d.id !== "center" && TERRAIN_FILL[d.terrain]).map((d) => (
                <ellipse key={d.id} cx={d.cx} cy={d.cy - d.r * 0.15} rx={d.r * 1.25} ry={d.r * 0.9} fill={TERRAIN_FILL[d.terrain]!} />
              ))}
              {/* roads: center to districts */}
              {DISTRICTS.filter((d) => !d.foggy && d.id !== "center").map((d) => (
                <path
                  key={d.id}
                  d={`M${TOWN_TILE.x + TOWN_TILE.w / 2},${TOWN_TILE.y + TOWN_TILE.h / 2} Q${(TOWN_TILE.x + TOWN_TILE.w / 2 + d.cx) / 2 + 40},${(TOWN_TILE.y + TOWN_TILE.h / 2 + d.cy) / 2 - 40} ${d.cx},${d.cy}`}
                  fill="none"
                  stroke="#e9e0c8"
                  strokeWidth="16"
                  strokeDasharray="2 22"
                  strokeLinecap="round"
                />
              ))}
              {/* fog patches */}
              {DISTRICTS.filter((d) => d.foggy).map((d) => (
                <g key={d.id} opacity="0.9">
                  <ellipse cx={d.cx} cy={d.cy} rx={d.r + 30} ry={d.r * 0.7} fill="#cfd4d9" />
                  <ellipse cx={d.cx - 30} cy={d.cy + 10} rx={d.r * 0.7} ry={d.r * 0.45} fill="#dde1e4" />
                </g>
              ))}
            </svg>

            {/* the existing town — untouched, still the heart of the region */}
            <img
              className="town-tile"
              src={A("town-hero")}
              alt="まちの中心"
              style={{ left: TOWN_TILE.x, top: TOWN_TILE.y, width: TOWN_TILE.w, height: TOWN_TILE.h }}
              onClick={() => { if (!suppressTap.current && !focus) setFocus("center"); }}
            />

            {/* district landmarks + names */}
            {DISTRICTS.filter((d) => d.id !== "center").map((d) => (
              <button
                key={d.id}
                className={`district-node ${d.foggy ? "foggy" : ""}`}
                style={{ left: d.cx, top: d.cy - (d.foggy ? 0 : d.r * 0.55) }}
                onClick={() => { if (!suppressTap.current) openDistrict(d); }}
              >
                <span className="district-emoji">
                  {d.foggy ? (
                    <span className="fog-silhouette">{d.silhouette ?? "🌫"}</span>
                  ) : (
                    d.landmarkEmoji
                  )}
                </span>
                <span className="district-name">{d.foggy ? "？？？" : d.name}</span>
              </button>
            ))}

            {/* quiet places on the town tile (under preparation) */}
            {focus === "center" &&
              quietPlaces.map((p) => (
                <span
                  key={p.id}
                  className="quiet-dot"
                  style={{
                    left: TOWN_TILE.x + (parseFloat(p.mapPos!.left) / 100) * TOWN_TILE.w,
                    top: TOWN_TILE.y + (parseFloat(p.mapPos!.top) / 100) * TOWN_TILE.h,
                  }}
                >
                  {p.name}・じゅんびちゅう
                </span>
              ))}

            {/* world markers */}
            {markers.map((m, idx) => {
              const inFocus = focus === m.districtId;
              const signal = signalIds.has(m.eventId);
              return (
                <button
                  key={m.eventId}
                  className={[
                    "world-marker",
                    `st-${m.state.toLowerCase()}`,
                    inFocus ? "in-focus" : "far",
                    signal ? "signal" : "",
                    idx % 2 === 1 ? "label-up" : "",
                  ].join(" ")}
                  style={{ left: m.x, top: m.y }}
                  onClick={() => {
                    if (suppressTap.current) return;
                    if (!inFocus) {
                      setFocus(m.districtId);
                      return; // first zoom in — the world never cuts
                    }
                    navigate({ name: "area", eventId: m.eventId });
                  }}
                >
                  {signal && <span className="marker-crowd">👥</span>}
                  <span className="marker-face">
                    <span className="marker-fire">{STATE_FACE[m.state]}</span>
                  </span>
                  <span className="marker-label">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* teaser toast for foggy districts */}
          {teaser && <div className="fog-teaser">{teaser}</div>}

          {focus && (
            <button className="region-back" onClick={() => setFocus(null)}>
              🗺 ちいき全体
            </button>
          )}
          {!focus && !hasPanned && <div className="pan-hint">👆 地図は うごかせる</div>}
        </div>

        {/* district chips: always reachable, never lost (§ anti-迷子) */}
        <div className="district-chips">
          {DISTRICTS.map((d) => (
            <button
              key={d.id}
              className={`district-chip ${focus === d.id ? "active" : ""} ${d.foggy ? "foggy" : ""}`}
              onClick={() => (d.foggy ? openDistrict(d) : setFocus(focus === d.id ? null : d.id))}
            >
              {d.foggy ? "🌫" : d.landmarkEmoji} {d.foggy ? "？？？" : d.name}
            </button>
          ))}
        </div>

        <p className="town-hint">
          {focus
            ? "気になる出来事をタップ。ぜんぶ回らなくてもいい。"
            : "地図はこれからも広がっていく。もやの向こうは、まだひみつ。"}
        </p>
      </div>
    </div>
  );
}
