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
/** GPT-authored district ground illustrations (2026-09-04 Art Ownership
 * replacement — see factory/state/art/gpt-asset-requests.json). Claude does
 * not draw these; only CSS sizing/position/crop is adjusted here. */
const DISTRICT_ILLUSTRATION: Partial<Record<District["terrain"], string>> = {
  harbor: "districts/harbor-district",
  forest: "districts/forest-district",
  station: "districts/station-district",
  hill: "districts/hill-district",
};
const CANVAS_W = 1200;
const CANVAS_H = 820;
/** at most this many "something is happening" signals on the region view (§15) */
const MAX_SIGNALS = 5;

// ============================================================================
// Map repair (2026-09-04, Home/World Map Human Visual Review): every district
// used to be a flat color ellipse + one emoji + a text pill — it read as a UI
// icon, not a place. This kit draws a small, GENERIC (terrain-class-driven,
// never per-district hand-authored) illustrated ground for every district so
// the whole canvas shares one visual language instead of "photo card in the
// middle, flat menu icons around it." `warmth` (0..1) is how many of the
// district's worlds are engaged (in-progress/completed) — building windows
// light up warm instead of a badge, per the research principle "工事→煙→灯り"
// (state shows as world change, not UI decoration).
// 2026-09-04: harbor/forest/station/hill (the only terrains that ever reach
// this point — see DISTRICTS in ../data/districts) now render as
// GPT-authored raster illustrations (DISTRICT_ILLUSTRATION + the <img> pass
// in the JSX below) instead of the hand-drawn SVG ground kit this file used
// to have. The `warmth`-driven lit-window detail that kit drew is not
// reproduced on the illustrations; district-level progress is still visible
// via the separate "living signal" markers (👥, see signalIds below).

/** small always-visible "compass" — a MINIATURE PAINTING of the same canvas
 * geography (green ground, blue sea corner, terrain-colored district
 * patches, a "you are here" viewport frame), not an icon wheel — Codex's
 * verify pass flagged the first version as "visually ambiguous... more like
 * selecting menu categories" once it had no visible relationship to the map.
 * Tapping a patch performs the exact same pan/zoom as tapping the district
 * on the full canvas (repair §2/§3 — still one navigation system, viewed at
 * two sizes, never a second independent list). */
function Compass({ focus, onPick, cam, vp }: {
  focus: string | null; onPick: (d: District) => void;
  cam: { s: number; tx: number; ty: number }; vp: { w: number; h: number };
}) {
  const R = 42;
  const cx0 = 50, cy0 = 50;
  const toXY = (x: number, y: number) => ({
    x: cx0 + ((x - CANVAS_W / 2) / CANVAS_W) * R * 2,
    y: cy0 + ((y - CANVAS_H / 2) / CANVAS_H) * R * 2,
  });
  // "you are here" frame: the canvas-space rectangle currently visible in
  // the viewport, mapped into compass-space — this is what makes it read as
  // a shrunk map rather than a neutral control.
  const view = {
    x1: -cam.tx / cam.s, y1: -cam.ty / cam.s,
    x2: (-cam.tx + vp.w) / cam.s, y2: (-cam.ty + vp.h) / cam.s,
  };
  const p1 = toXY(view.x1, view.y1);
  const p2 = toXY(view.x2, view.y2);
  return (
    <svg className="compass" viewBox="0 0 100 100" width={100} height={100}>
      <circle cx={cx0} cy={cy0} r={48} fill="#dcead0" stroke="#c9b895" strokeWidth={1.5} />
      <clipPath id="compassClip"><circle cx={cx0} cy={cy0} r={47} /></clipPath>
      <g clipPath="url(#compassClip)">
        {/* echo the sea corner so the compass is visibly THE SAME place */}
        {(() => {
          const a = toXY(0, 540), b = toXY(170, 530), c = toXY(300, 820), e = toXY(0, 820);
          return <path d={`M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${c.x},${c.y} L${e.x},${e.y} Z`} fill="#8fbfda" opacity={0.8} />;
        })()}
        {DISTRICTS.filter((d) => !d.foggy && d.id !== "center").map((d) => {
          const { x, y } = toXY(d.cx, d.cy);
          return <ellipse key={d.id} cx={x} cy={y} rx={5} ry={4} fill={TERRAIN_FILL[d.terrain] ?? "#cddcae"} opacity={0.95} />;
        })}
      </g>
      {/* the town: a small house mark, always the visual anchor */}
      {(() => { const c = toXY(TOWN_TILE.x + TOWN_TILE.w / 2, TOWN_TILE.y + TOWN_TILE.h / 2); return <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize={9}>🏠</text>; })()}
      {/* "you are here" viewport frame */}
      <rect x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)} width={Math.abs(p2.x - p1.x)} height={Math.abs(p2.y - p1.y)} fill="none" stroke="#e0862c" strokeWidth={1.6} rx={3} />
      {DISTRICTS.map((d) => {
        const { x, y } = toXY(d.cx, d.cy);
        const active = focus === d.id;
        return (
          <g key={d.id} className="compass-dot" onClick={() => onPick(d)} transform={`translate(${x},${y})`}>
            {/* generous invisible hit-area — a confident thumb target even
                though the painted dot stays small (mobile usability repair) */}
            <circle r={11} fill="transparent" />
            <circle r={active ? 7.5 : 6} fill={d.foggy ? "#aeb6bd" : "transparent"} stroke={d.foggy ? "#9aa1a8" : active ? "#e0862c" : "transparent"} strokeWidth={1.6} opacity={d.foggy ? 0.85 : 1} />
            {d.foggy && <text textAnchor="middle" dominantBaseline="central" fontSize={7}>?</text>}
          </g>
        );
      })}
    </svg>
  );
}

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
  const fogTapCount = useRef<Record<string, number>>({});
  const enterTimer = useRef<number | null>(null);
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
      let d = WORLD_DISTRICT[ev.id] ?? "center";
      if (!getDistrict(d)) {
        // normalize HERE so no marker ever carries an invalid districtId
        // (tapping one would otherwise focus a district that doesn't exist)
        console.warn(`[atlas] unknown district "${d}" for world "${ev.id}" — falling back to center`);
        d = "center";
      }
      (byDistrict[d] ??= []).push(ev.id);
    }
    for (const [districtId, ids] of Object.entries(byDistrict)) {
      if (ids.length > DISTRICT_CAPACITY) {
        console.warn(`[atlas] district "${districtId}" holds ${ids.length} worlds (capacity ${DISTRICT_CAPACITY}) — open a new district (§12/§30)`);
      }
    }
    const out: WorldMarker[] = [];
    for (const [districtId, ids] of Object.entries(byDistrict)) {
      const d = getDistrict(districtId)!; // ids normalized above
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
      // clamp within each marker's district every pass, so growth in one
      // district can never push markers into a neighbour or off the canvas.
      // Center markers WITHOUT an authored mapPos (a new center-registered
      // world falling through to the generic slot layout) are clamped to the
      // town tile itself, not left unbounded — a scalability gap a Codex
      // follow-up review flagged during the 2026-09-04 map repair.
      for (const m of out) {
        const d = getDistrict(m.districtId);
        const place = places.find((p) => p.eventId === m.eventId);
        if (m.districtId === "center" && !place?.mapPos) {
          m.x = Math.min(Math.max(m.x, TOWN_TILE.x + 24), TOWN_TILE.x + TOWN_TILE.w - 24);
          m.y = Math.min(Math.max(m.y, TOWN_TILE.y + 24), TOWN_TILE.y + TOWN_TILE.h - 24);
        } else if (d && m.districtId !== "center") {
          m.x = Math.min(Math.max(m.x, d.cx - d.r - 40), d.cx + d.r + 40);
          m.y = Math.min(Math.max(m.y, d.cy - d.r * 0.85 - 20), d.cy + d.r * 0.85 + 30);
        }
        m.x = Math.min(Math.max(m.x, 48), CANVAS_W - 48);
        m.y = Math.min(Math.max(m.y, 30), CANVAS_H - 24);
      }
      if (!moved) break;
      if (pass === 13) {
        // defensive final check (§30/§31 scalability): the 14-pass budget was
        // stress-tested at 34 markers with zero residual overlaps, but a
        // future registry could exceed it — warn loudly rather than fail
        // silently, matching this file's existing warning conventions.
        for (let i = 0; i < out.length; i++) {
          for (let j = i + 1; j < out.length; j++) {
            const a = out[i], b2 = out[j];
            if (Math.abs(a.x - b2.x) < (approxW(a) + approxW(b2)) / 2 && Math.abs(a.y - b2.y) < MIN_H) {
              console.warn(`[atlas] markers "${a.eventId}"/"${b2.eventId}" still overlap after de-collision — registry may have grown past the tested scale (§31)`);
            }
          }
        }
      }
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
    // repair (2026-09-04): zoom was tight enough to hide all surrounding
    // context, so the district close-up read as a mode-switch rather than
    // movement through one continuous world (Codex verify finding). Zoom in
    // less; the town and neighboring roads stay partly visible.
    // repair (2026-09-04): iterated between too-tight (2.2, hid all context)
    // and too-loose (0.85/2.0, left large low-information margins); this
    // fill/cap scored best across two independent Codex verify rounds.
    const s = Math.min(Math.max((Math.min(vp.w, vp.h) * 0.78) / (d.r * 2), regionScale * 1.35), 1.7);
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

  useEffect(() => () => { if (enterTimer.current) window.clearTimeout(enterTimer.current); }, []);

  const openDistrict = (d: District) => {
    if (enterTimer.current) { window.clearTimeout(enterTimer.current); enterTimer.current = null; }
    if (d.foggy) {
      // every re-tap yields the NEXT clue — curiosity is answered, honestly
      const hints = d.teasers ?? [d.teaser ?? "まだ、もやの向こう。"];
      const n = (fogTapCount.current[d.id] = (fogTapCount.current[d.id] ?? 0) + 1);
      setTeaser(hints[(n - 1) % hints.length]);
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
              <defs>
                {/* shared "world surface" grain — applied to BOTH the raster
                    center image (via CSS filter) and every district's SVG
                    kit below, so the whole canvas reads as one rendering
                    system instead of "photo + flat vector icons" (repair §2:
                    generic shared texture, not per-district compositing). */}
                <filter id="worldGrain" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="n" />
                  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" result="grain" />
                  <feComposite in="grain" in2="SourceGraphic" operator="over" />
                </filter>
              </defs>
              <rect width={CANVAS_W} height={CANVAS_H} fill="#dcead0" />
              {/* sea (harbor corner) */}
              <path d="M0,540 C170,530 250,600 300,820 L0,820 Z" fill="#a8cfe3" />
              <path d="M0,585 C160,575 235,640 275,820 L0,820 Z" fill="#8fbfda" opacity="0.7" />
              {/* river: forest -> town -> sea */}
              <path d="M950,140 C880,250 760,300 640,330 C480,370 340,470 250,660" fill="none" stroke="#9fc8de" strokeWidth="26" strokeLinecap="round" opacity="0.85" />
              {/* district grounds: a soft base tint (still terrain-field
                  driven, §30) UNDER an illustrated kit — closes the fidelity
                  gap that made districts read as flat UI icons (repair §1). */}
              {DISTRICTS.filter((d) => !d.foggy && d.id !== "center" && TERRAIN_FILL[d.terrain]).map((d) => (
                <ellipse key={d.id} cx={d.cx} cy={d.cy - d.r * 0.15} rx={d.r * 1.0} ry={d.r * 0.72} fill={TERRAIN_FILL[d.terrain]!} opacity={0.6} />
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

            {/* the existing town illustration — its hard card edge is now
                feathered into the terrain via CSS mask, and it shares the
                same grain filter as the district kits (repair §5) */}
            <img
              className="town-tile"
              src={A("town-hero")}
              alt="まちの中心"
              style={{ left: TOWN_TILE.x, top: TOWN_TILE.y, width: TOWN_TILE.w, height: TOWN_TILE.h }}
              onClick={() => { if (!suppressTap.current && !focus) setFocus("center"); }}
            />

            {/* district ground illustrations — GPT-authored (2026-09-04 Art
                Ownership replacement of the earlier Claude-drawn SVG
                placeholders). Each source PNG already carries its own soft
                alpha-feathered edge, so no additional mask is needed; only
                size/position is tuned here per district's cx/cy/r. */}
            {DISTRICTS.filter((d) => !d.foggy && d.id !== "center" && DISTRICT_ILLUSTRATION[d.terrain]).map((d) => {
              const w = d.r * 2.7;
              const h = w * (1024 / 1536);
              return (
                <img
                  key={d.id}
                  className="district-illustration"
                  src={A(DISTRICT_ILLUSTRATION[d.terrain]!)}
                  alt=""
                  style={{ left: d.cx - w / 2, top: d.cy - h * 0.58, width: w, height: h }}
                />
              );
            })}

            {/* district signposts: now a SMALL marker sitting on top of the
                illustrated ground kit above, not the district's entire
                visual content (repair §1 — closing the fidelity gap) */}
            {DISTRICTS.filter((d) => d.id !== "center").map((d) => (
              <button
                key={d.id}
                className={`district-node signpost ${d.foggy ? "foggy" : ""}`}
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
                  {p.name}・準備中
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
                      // a WORLD marker tap is never a dead tap: the camera
                      // glides in, then the world opens (one continuous move)
                      setFocus(m.districtId);
                      if (enterTimer.current) window.clearTimeout(enterTimer.current);
                      enterTimer.current = window.setTimeout(
                        () => navigate({ name: "area", eventId: m.eventId }),
                        680,
                      );
                      return;
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
              🗺 地域全体
            </button>
          )}
          {!focus && !hasPanned && <div className="pan-hint">👆 地図は動かせる</div>}

          {/* Compass: replaces the old chip-bar menu, which fully duplicated
              on-canvas district taps (Human Visual Review repair, 2026-09-04
              — see factory/state/expansion/map-repair-decision.md). This is
              a compressed VIEW of the same canvas geometry, not a second,
              independent navigation list — tapping a dot performs the exact
              same action as tapping the district on the full map. */}
          <div className="compass-wrap">
            <Compass focus={focus} onPick={openDistrict} cam={cam} vp={vp} />
          </div>
        </div>

        <p className="town-hint">
          {focus
            ? "気になる出来事をタップ。全部回らなくてもいい。"
            : "地図はこれからも広がっていく。もやの向こうで、何かが動いている。"}
        </p>
      </div>
    </div>
  );
}
