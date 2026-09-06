// HOME: 「生きた町のアトラス」 (factory/state/expansion/map-architecture-decision.md)
// 2026-09-05 (Map V1 — Human-approved Continuous World Base Illustration):
// the region is now ONE single continuous illustration
// (public/assets/world/continuous-world.png), replacing the earlier
// town-tile + separate per-district raster composite (which Human Visual
// Review + independent Codex review — factory/state/expansion/
// map-a3-codex-review-2026-09-04.json — found could never read as one world
// no matter how the CSS blended the pieces, because the source images were
// generated at different camera angles/scales). See
// factory/state/expansion/map-v1-implementation-2026-09-05.md for the full
// before/after. The camera still ZOOMS (CSS transform, no screen cuts) from
// the region view into a district; worlds are tapped inside a district —
// this part of the architecture (already validated across the A2/A3
// prototypes: pan/tap separation, DOM-scoped markers, scalability) is
// unchanged and reused as-is, per instruction not to rebuild it.
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

/** Human-approved (factory/state/art/gpt-asset-requests.json,
 * continuous-world-base-illustration, status HUMAN_APPROVED_FOR_GPT_GENERATION)
 * single continuous world illustration — one camera angle/scale/light
 * source across the whole region. Rendered 1:1 at its native pixel size
 * (see CANVAS_W/H below, which match the file exactly) so it is never
 * stretched; the CSS transform on `.region-canvas` handles all zoom, not
 * object-fit or a resized <img>. No UI (badges/labels/markers) is baked
 * into this file — those are all separate DOM overlays, per the Human's
 * "no embedded UI" instruction. */
const WORLD_IMG = `${import.meta.env.BASE_URL}assets/world/continuous-world.png`;
const CANVAS_W = 1774;
const CANVAS_H = 887;
/** at most this many "something is happening" signals on the region view (§15)
 * — a freshness glow (pulsing crowd icon), unrelated to which markers are
 * visible at all (see MAX_INITIAL_OVERVIEW below). A marker can be signal,
 * overview-visible, both, or neither. */
const MAX_SIGNALS = 5;
/** 2026-09-05 (Human Review — Map V1 minimum repair #2, Progressive
 * Disclosure): the Continuous World Base Illustration made simultaneous
 * event markers read as too many at once on a 375px initial viewport. Caps
 * how many markers show at region overview BEFORE any pan/focus — capped
 * to the "center" district specifically (not a freshness pick like
 * MAX_SIGNALS), since "center" is what the default camera always frames;
 * picking by freshness alone could select markers in districts the initial
 * camera doesn't even show, leaving nothing visible at all. Every other
 * marker (including the rest of center's) reveals via the EXISTING
 * focus-reveal mechanism (`inFocus`) once its district is entered — no new
 * reveal mechanism, no marker architecture change. */
const MAX_INITIAL_OVERVIEW = 4;

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
  const { navigate, worldState } = useGame();
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

  // Progressive Disclosure (Map V1 minimum repair #2): capped to "center"
  // specifically — the district the default camera always frames — so the
  // initial overview is never left with zero visible markers just because
  // the freshness-based `signalIds` happened to pick markers elsewhere.
  const overviewVisibleIds = useMemo(() => {
    const centerMarkers = markers.filter((m) => m.districtId === "center");
    return new Set(centerMarkers.slice(0, MAX_INITIAL_OVERVIEW).map((m) => m.eventId));
  }, [markers]);

  // ---- camera --------------------------------------------------------------
  // region mode fills the viewport height and is PANNABLE (the map is a place,
  // not a thumbnail); district mode zooms the camera onto the district.
  // 2026-09-05 (Map V1, Human Directive §3/§4/§19): mobile is the PRIMARY
  // target, sized so the town center reads as the main focus with adjacent
  // districts peeking at the edges — never the whole 1774x887 world shrunk
  // to fit (that reads as "a big list", not "a world you're standing in").
  // Fit by HEIGHT against a fixed reference (not a width breakpoint split)
  // so desktop does NOT get to see more of the world just because it has a
  // bigger viewport (§19 explicitly forbids "PC basis then shrink to
  // mobile" and the reverse — showing more world on a bigger screen). A
  // taller viewport (mobile portrait) naturally shows a bit more vertical
  // context than a short wide desktop window at the same reference height,
  // which is the desired "vertical exploration exists too" (§6) without a
  // separate code path.
  // Two independent constraints, both driven by the SAME formula regardless
  // of device (no separate mobile/desktop branch):
  // 1. height must be overscanned a bit past a bare fill (x1.15), or a tall
  //    portrait viewport exactly matches this image's short (887px) native
  //    height and vertical pan becomes mathematically impossible (§6
  //    requires up/down pan to actually work, not just be wired up).
  // 2. width must never reveal more than ~46% of the image at once — this
  //    image is much wider than any viewport is tall, so on a WIDE desktop
  //    window the height constraint alone would happily reveal most of the
  //    world in one glance (measured: ~80% at a typical desktop size),
  //    which is exactly what §19 forbids ("desktop shouldn't see more of
  //    the world just because it has more room"). Whichever constraint
  //    wants the tighter (larger) scale wins.
  const MAX_VISIBLE_WIDTH_FRACTION = 0.46;
  const heightFitScale = (vp.h * 1.15) / CANVAS_H;
  const widthCapScale = vp.w / (CANVAS_W * MAX_VISIBLE_WIDTH_FRACTION);
  const regionScale = Math.min(Math.max(Math.max(heightFitScale, widthCapScale), 0.35), 1.6);
  const clampPan = (tx: number, ty: number, s: number) => ({
    tx: Math.min(0, Math.max(vp.w - CANVAS_W * s, tx)),
    ty: Math.min(0, Math.max(vp.h - CANVAS_H * s, ty)),
  });
  // Region-mode camera anchor BEFORE any drag offset — shared by the
  // render-time camera (cam, below) and onPointerMove's pan clamping so the
  // two can never drift apart (2026-09-06, REAL_USER_OBSERVED pan blocker:
  // they used to duplicate this math informally through `pan`, and only
  // cam's OUTPUT was clamped — see onPointerMove for the actual bug).
  // §5/§7: don't center the camera exactly on the plaza/fountain — a
  // dead-center lock on the strongest landmark reads as "a finished plaza
  // screen", not "midway through a bigger world". Bias the focal point
  // up-and-left within the town so harbor (lower-left) and station/hill
  // (upper-right) both have more room to peek at the opposite edges.
  const regionBase = (s: number) => {
    const center = getDistrict("center")!;
    const focalX = center.cx - center.r * 0.22;
    const focalY = center.cy - center.r * 0.12;
    return { tx: vp.w / 2 - focalX * s, ty: vp.h / 2 - focalY * s };
  };
  const cam = useMemo(() => {
    if (!focus) {
      const s = regionScale;
      const rb = regionBase(s);
      const base = clampPan(rb.tx, rb.ty, s);
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
    // fill/cap scored best across two independent Codex verify rounds
    // — calibrated against the region-viewport's PRE-Mobile-Map-Simplification
    // fixed height (~560px). That height grew substantially (flex:1, fills
    // the screen) in the 2026-09-04 True Home / Mobile Map pass, so a
    // width-only fill fraction under-zoomed against the new taller portrait
    // viewport and left a large empty band below the district (Codex review,
    // true-home-map-codex-review-r2.json). Now fills against height too —
    // districts read as filling the frame instead of floating in it — while
    // the cap still leaves neighbouring roads/town visible at the edges.
    const s = Math.min(Math.max(
      (Math.min(vp.w, vp.h) * 0.78) / (d.r * 2),
      (vp.h * 0.54) / (d.r * 1.44),
      regionScale * 1.35,
    ), 2.0);
    return { s, tx: vp.w / 2 - d.cx * s, ty: vp.h / 2 - d.cy * s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, vp, regionScale, pan]);

  // Drag-to-pan (region mode only); a real drag suppresses the tap.
  // 2026-09-04 (Experience Design Harness — Interaction blocker repair):
  // Human Review on a real iPhone found that placing a finger near/on a
  // district while trying to pan could fire that district's tap and open a
  // world unintentionally, even though this file already tracked a "moved"
  // flag and functional (mouse, no-movement) QA passed. Two concrete gaps,
  // both textbook causes of exactly this class of bug in a canvas-with-
  // nested-hotspots + custom-pan implementation:
  // 1. No setPointerCapture — without it, a touch that starts on a nested
  //    <button> (district-node / world-marker) is not GUARANTEED to keep
  //    delivering pointermove/pointerup to this container on every engine;
  //    capturing to the container removes that ambiguity entirely.
  // 2. No onPointerCancel — if the browser ever cancels the gesture (a
  //    system gesture, an OS interruption) mid-drag, drag.current was never
  //    cleared, which could leave the arbitration state stale for the next
  //    touch.
  // The movement threshold also moved from a 6px Manhattan sum (~4px on a
  // single axis) to an 8px Euclidean distance — closer to the touch-slop
  // constants real platforms use (Android ~8dp, iOS ~10pt) — so a real
  // finger's natural first-frame jitter cannot itself register as "moved".
  const TOUCH_SLOP = 8;
  const onPointerDown = (e: React.PointerEvent) => {
    if (focus) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > TOUCH_SLOP) d.moved = true;
    if (d.moved) {
      // 2026-09-06 (REAL_USER_OBSERVED — Map pan blocker): `pan` used to be
      // an unbounded accumulator — only the DERIVED cam.tx/ty (via clampPan,
      // inside the `cam` useMemo) were clamped for rendering. Dragging far
      // enough to hit an edge let `pan` keep drifting past the point where
      // that render-time clamp saturates; the NEXT gesture then re-based its
      // delta on that still-unclamped `pan` (onPointerDown snapshots it
      // as `px`), so reversing direction produced zero visible movement
      // until the drag had "walked back" the entire invisible overshoot —
      // often more than a single real swipe covers. Clamping `pan` itself
      // here (using the SAME regionBase/clampPan the render path uses) keeps
      // it always in sync with what's actually on screen, so any reversal
      // moves immediately, from any edge, in either axis.
      const s = regionScale;
      const rb = regionBase(s);
      const clamped = clampPan(rb.tx + d.px + dx, rb.ty + d.py + dy, s);
      setPan({ x: clamped.tx - rb.tx, y: clamped.ty - rb.ty });
      setDragging(true);
    }
  };
  const endDrag = (e?: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d?.moved) suppressTap.current = true;
    window.setTimeout(() => (suppressTap.current = false), 80);
    if (e?.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => endDrag(e);
  const onPointerCancel = (e: React.PointerEvent) => endDrag(e);
  const suppressTap = useRef(false);
  const [dragging, setDragging] = useState(false);

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
        {!focus && (
          <header className="world-header">
            <button className="map-home-back" onClick={() => navigate({ name: "home" })}>
              ← ホーム
            </button>
          </header>
        )}

        {focused && <p className="world-lead">{focused.lead}</p>}
        {!focused && <p className="world-lead map-prompt">どこへ行く？</p>}

        <div
          className={`region-viewport ${focus ? "is-district" : "is-region"}`}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerUp}
        >
          <div
            className={`region-canvas ${dragging ? "no-anim" : ""}`}
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}
          >
            {/* Human-approved single continuous world illustration — one
                camera angle/scale/light source for the whole region.
                Rendered 1:1 at native pixel size (width/height match
                CANVAS_W/H exactly), never stretched — the .region-canvas
                transform above handles all zoom. Replaces the old town-tile
                + separate district-illustration composite entirely (see
                file header comment). No UI is drawn into the image itself;
                district-node/world-marker below are separate DOM overlays. */}
            <img
              className="world-illustration"
              src={WORLD_IMG}
              alt="JIBUN CHOICE WORLD"
              width={CANVAS_W}
              height={CANVAS_H}
              decoding="async"
            />

            {/* invisible tap zone over the plaza/town area — the old
                town-tile <img> carried its own onClick for entering the
                town; now that the whole region is one image, this
                recreates the same "tap the town to focus it" affordance
                without adding a visible signpost over the richest, most
                detailed part of the illustration (world-markers already
                sitting inside this area, painted after this in DOM order,
                take priority — a marker tap never falls through to this). */}
            <button
              className="town-hitzone"
              style={{ left: TOWN_TILE.x, top: TOWN_TILE.y, width: TOWN_TILE.w, height: TOWN_TILE.h }}
              onClick={() => { if (!suppressTap.current && !focus) setFocus("center"); }}
              aria-label="まちの中心"
            />

            {/* district signposts: a small tappable marker + label sitting
                on top of the illustration at each named place (repair §1 —
                the marker is a small hotspot, never the district's entire
                visual content). */}
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
                    // 2026-09-05 (Human Review — Map V1 minimum repair #2,
                    // Progressive Disclosure): at the region overview, only
                    // `overviewVisibleIds` stays visible — the rest are
                    // hidden via CSS (.region-viewport.is-region
                    // .world-marker.hidden-until-focus), not unmounted, so
                    // nothing about marker positions/click handling changes.
                    // Once a district is focused, `inFocus` is true for its
                    // own markers regardless of this class, so they always
                    // show in full — the existing focus mechanism IS the
                    // "reveal more" step, reused as-is.
                    !inFocus && !overviewVisibleIds.has(m.eventId) ? "hidden-until-focus" : "",
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

        {focus && <p className="town-hint">気になる出来事をタップ。全部回らなくてもいい。</p>}
      </div>
    </div>
  );
}
