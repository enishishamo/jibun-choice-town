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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { events, places } from "../data";
import {
  DISTRICTS, TOWN_TILE, WORLD_DISTRICT, DISTRICT_CAPACITY, districtSlot, getDistrict,
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

// 2026-09-14 (Human Visual Review): the bottom-right circular minimap
// (formerly a `Compass` component here — a miniature painting of the canvas
// geography with a "you are here" viewport frame and its own district-tap
// hotspots) was removed outright. The Human's instruction was explicit: no
// replacement overview UI, no current-location pin, no compass — the map
// should just be the map, explored directly. Tapping a district/world
// marker on the full canvas (unchanged) remains the only way to navigate.

interface WorldMarker {
  eventId: string;
  label: string;
  districtId: string;
  x: number;
  y: number;
  state: WorldState;
}

// ONE face icon per world state — the map reads without labels (§13):
// unseen worlds burn (come look!), in-progress shows the tool, completed
// plants the flag, updated sparkles the call-back.
// 2026-09-13 (Map repair §3): VISITED used to show "📍" — a generic map-pin
// glyph that reads as a "you are here / current location" marker, out of
// place in a hand-made clay-diorama world (nothing else on the map uses a
// literal pin shape) and reported as looking wrong near the river/forest
// district. Removed outright, no replacement — the marker itself is
// untouched and still tappable; only the icon inside it is empty now, with
// the existing `.st-visited` border-color/desaturation CSS (index.css)
// still carrying the state distinction non-verbally. If a future "you are
// here" or "current area" indicator is wanted, it should be an area
// label / subtle highlight woven into the world, never a generic pin.
const STATE_FACE: Record<WorldState, string> = {
  DISCOVERED: "🔥",
  VISITED: "",
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
  // 2026-09-13 (Gesture Arbitration repair — see §1/§2 of the audit that
  // produced this pass): `pan` and `zoom` are no longer region-mode-only.
  // Both region AND district view now share ONE continuous camera model
  // (see `cam` below) — pinch-zooming or dragging works the same way in
  // either mode, and "zoomed in" no longer means "can't move anymore".
  const [pan, setPan] = useState({ x: 0, y: 0 }); // camera drag offset, current mode
  const [zoom, setZoom] = useState(1); // pinch-zoom multiplier ON TOP OF the mode's fitted scale
  const MIN_ZOOM = 1; // never pinch out past the tuned "fit" framing — the district-tap / 地域全体 back button already cover "zoom out"
  const MAX_ZOOM = 2; // how much further a pinch can push in from the fitted view
  // Multi-touch tracking: every currently-down pointer, keyed by pointerId —
  // this is what makes "a 2nd finger just touched down" detectable at all,
  // which single-pointer drag tracking (the pre-repair implementation) had
  // no way to see.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<
    | { mode: "pan"; startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean }
    | { mode: "pinch"; startDist: number; s0: number; canvasX: number; canvasY: number }
    | null
  >(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 375, h: 480 });
  // 2026-09-07 (REAL_USER_FEEDBACK onboarding fix, round-2 independent
  // review HIGH): the edge-clamp below needs each label's REAL rendered
  // width, not a guessed constant (a guess can under/over-correct, or shift
  // a label that already fit). `offsetWidth` is unaffected by the
  // `transform: translateX(...)` the clamp itself applies, so measuring it
  // here never feeds back into its own input.
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

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

  // 2026-09-07 (REAL_USER_FEEDBACK onboarding fix, round-2/round-3
  // independent review HIGHs): measure each currently-shown label's REAL
  // width via `offsetWidth`, deliberately NOT `getBoundingClientRect()` —
  // a first attempt at this used getBoundingClientRect() reasoning that it
  // already includes the ancestor `.region-canvas` scale, but it ALSO
  // includes the label's OWN opacity/scale REVEAL transition (this element
  // animates scale 0.8 -> 1 over 0.35s when it becomes visible), so a
  // measurement taken mid-transition silently locked in a too-small width.
  // `offsetWidth` is a pure layout value: unaffected by ANY transform, on
  // this element or any ancestor, so it can never catch a transition
  // mid-flight. It IS in the canvas's own (pre-`.region-canvas`-scale)
  // units though, so the render below explicitly multiplies it by `cam.s`
  // to reach the same screen-px space as `vp.w` / `cam.tx + m.x * cam.s`.
  useLayoutEffect(() => {
    setLabelWidths((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const m of markers) {
        const showLabel = focus === m.districtId || overviewVisibleIds.has(m.eventId);
        const el = labelRefs.current[m.eventId];
        if (!showLabel || !el) continue;
        const w = el.offsetWidth;
        if (w > 0 && next[m.eventId] !== w) { next[m.eventId] = w; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [markers, focus, overviewVisibleIds]);

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
  // world bounds: at ANY scale (region, district, or further pinched-in from
  // either), the canvas may never pan far enough to show empty space beyond
  // its own edge — this is what keeps "explore after zooming" from ever
  // scrolling the child off the edge of the world.
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
  // Extracted to a plain function (2026-09-13 Gesture Arbitration repair)
  // so it can be reused as the district mode's BASE scale — pinch-zoom then
  // multiplies further from this fitted baseline instead of replacing it.
  const districtBaseScale = (d: District) => Math.min(Math.max(
    (Math.min(vp.w, vp.h) * 0.78) / (d.r * 2),
    (vp.h * 0.54) / (d.r * 1.44),
    regionScale * 1.35,
  ), 2.0);
  // 2026-09-13 (Gesture Arbitration repair, §2 "zoom後も自由にパンできる"):
  // region and district view used to be two separate camera formulas, and
  // ONLY region mode accepted a pan offset at all — a district, once
  // focused, was a fixed, unpannable close-up. They're unified into one
  // formula now: `baseScaleNow` is whichever mode's tuned FIT scale applies
  // (unchanged math, just extracted), `zoom` is a pinch-driven multiplier on
  // top of it (1 = exactly the fitted view, up to MAX_ZOOM further in), and
  // `pan` is a screen-px offset from the mode's anchor point — honored in
  // BOTH modes now, not just region. Leaving a district always resets pan
  // and zoom back to 0/1 (see openDistrict / the region-back button below),
  // so "back to region" is never left mid-pinch from an unrelated district.
  const baseScaleNow = focus ? districtBaseScale(getDistrict(focus)!) : regionScale;
  const s = Math.min(Math.max(baseScaleNow * zoom, baseScaleNow * MIN_ZOOM), baseScaleNow * MAX_ZOOM);
  const anchorFor = (sc: number) => {
    if (focus) {
      const d = getDistrict(focus)!;
      return { tx: vp.w / 2 - d.cx * sc, ty: vp.h / 2 - d.cy * sc };
    }
    return regionBase(sc);
  };
  const cam = useMemo(() => {
    const anchor = anchorFor(s);
    const c = clampPan(anchor.tx + pan.x, anchor.ty + pan.y, s);
    return { s, tx: c.tx, ty: c.ty };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, vp, s, pan]);

  // Drag-to-pan AND pinch-to-zoom, in either region or district mode; a real
  // gesture always suppresses the tap it would otherwise leave behind.
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
  const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid2 = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) {
      gesture.current = { mode: "pan", startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y, moved: false };
    } else if (pointers.current.size === 2) {
      // 2026-09-13 (Gesture Arbitration repair, §1): a 2nd finger touching
      // down is NEVER part of a tap, even if the 1st finger hadn't moved
      // enough yet to count as a drag — suppress immediately, don't wait for
      // pinch movement to prove itself.
      suppressTap.current = true;
      const pts = Array.from(pointers.current.values());
      // The canvas-space point currently sitting under the pinch midpoint,
      // derived from the ALREADY-RENDERED camera (this render's cam.tx/ty/s)
      // — not re-derived from scratch, so it can never drift from what's
      // actually on screen when the gesture starts.
      const m = mid2(pts[0], pts[1]);
      gesture.current = {
        mode: "pinch",
        startDist: Math.max(1, dist2(pts[0], pts[1])),
        s0: cam.s,
        canvasX: (m.x - cam.tx) / cam.s,
        canvasY: (m.y - cam.ty) / cam.s,
      };
    }
    // a 3rd+ finger is ignored — the existing 2-finger pinch gesture continues undisturbed
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.mode === "pan" && pointers.current.size === 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (!g.moved && Math.hypot(dx, dy) > TOUCH_SLOP) g.moved = true;
      if (g.moved) {
        // 2026-09-06 (REAL_USER_OBSERVED — Map pan blocker): `pan` used to be
        // an unbounded accumulator — only the DERIVED cam.tx/ty (via clampPan,
        // inside the `cam` useMemo) were clamped for rendering. Dragging far
        // enough to hit an edge let `pan` keep drifting past the point where
        // that render-time clamp saturates; the NEXT gesture then re-based its
        // delta on that still-unclamped `pan` (onPointerDown snapshots it
        // as `startPanX`), so reversing direction produced zero visible
        // movement until the drag had "walked back" the entire invisible
        // overshoot. Clamping `pan` itself here (the SAME anchor/clampPan the
        // render path uses) keeps it always in sync with what's actually on
        // screen, so any reversal moves immediately, from any edge, in either
        // axis — and now in BOTH region and district mode.
        const anchor = anchorFor(s);
        const clamped = clampPan(anchor.tx + g.startPanX + dx, anchor.ty + g.startPanY + dy, s);
        setPan({ x: clamped.tx - anchor.tx, y: clamped.ty - anchor.ty });
        setGestureActive(true);
      }
    } else if (g.mode === "pinch" && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values());
      const d = Math.max(1, dist2(pts[0], pts[1]));
      const m = mid2(pts[0], pts[1]);
      const rawS = g.s0 * (d / g.startDist);
      const newS = Math.min(baseScaleNow * MAX_ZOOM, Math.max(baseScaleNow * MIN_ZOOM, rawS));
      // keep the canvas point captured at gesture-start fixed under the
      // (possibly drifting) pinch midpoint — this is what makes the zoom
      // feel anchored to the child's fingers instead of always the corner.
      const newTx = m.x - g.canvasX * newS;
      const newTy = m.y - g.canvasY * newS;
      const anchor = anchorFor(newS);
      const clamped = clampPan(newTx, newTy, newS);
      setZoom(newS / baseScaleNow);
      setPan({ x: clamped.tx - anchor.tx, y: clamped.ty - anchor.ty });
      setGestureActive(true);
    }
  };
  const endPointer = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (pointers.current.size === 0) {
      const g = gesture.current;
      gesture.current = null;
      setGestureActive(false);
      if (g && (g.mode === "pinch" || g.moved)) {
        suppressTap.current = true;
        window.setTimeout(() => (suppressTap.current = false), 80);
      }
    } else if (pointers.current.size === 1) {
      // dropped from a pinch (or a stray extra pointer) back to one finger —
      // re-anchor so the remaining finger keeps panning from exactly here,
      // with no jump, and treat the lift of THIS remaining finger as a
      // continuation of the same real gesture (never a fresh tap).
      const [[, pt]] = Array.from(pointers.current.entries());
      gesture.current = { mode: "pan", startX: pt.x, startY: pt.y, startPanX: pan.x, startPanY: pan.y, moved: true };
      suppressTap.current = true;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => endPointer(e);
  const onPointerCancel = (e: React.PointerEvent) => endPointer(e);
  const onPointerLeaveViewport = (e: React.PointerEvent) => endPointer(e);
  const suppressTap = useRef(false);
  const [gestureActive, setGestureActive] = useState(false);
  // 2026-09-13 (Gesture Arbitration repair, §1 "zoom / camera transition中は
  // marker の pointer eventsを無効化"): true for the ~700ms the camera is
  // ANIMATING toward a new focus (district-node tap, or the glide-then-enter
  // a world marker starts) — a window with no finger down at all, so
  // `gestureActive` (which only tracks live pointers) can't cover it. While
  // true, `.is-busy` (below) disables pointer-events on every marker/district
  // node, and `suppressTap` swallows anything that slips through.
  const [camBusy, setCamBusy] = useState(false);
  const camBusyTimer = useRef<number | null>(null);
  const setCamBusyFor = (ms: number) => {
    suppressTap.current = true;
    setCamBusy(true);
    if (camBusyTimer.current) window.clearTimeout(camBusyTimer.current);
    camBusyTimer.current = window.setTimeout(() => {
      suppressTap.current = false;
      setCamBusy(false);
    }, ms);
  };

  // first-visit sweep: the camera starts a little west and glides home,
  // showing that the map continues beyond the screen
  useEffect(() => {
    setPan({ x: 140, y: 30 });
    const t = window.setTimeout(() => setPan({ x: 0, y: 0 }), 450);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => () => {
    if (enterTimer.current) window.clearTimeout(enterTimer.current);
    if (camBusyTimer.current) window.clearTimeout(camBusyTimer.current);
  }, []);

  // camera transition duration (.region-canvas transition: transform 0.65s
  // in index.css) plus a small buffer — markers/districts stay inert for
  // exactly this long after a tap-driven focus change, per §1.
  const CAMERA_TRANSITION_MS = 700;

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
    // 2026-09-13 (Gesture Arbitration repair): reset pan/zoom on every focus
    // change — a district is always entered (and region is always returned
    // to) at its clean, tuned default framing, never mid-pinch from whatever
    // a PREVIOUS district was left at.
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setFocus(d.id);
    setCamBusyFor(CAMERA_TRANSITION_MS);
  };

  const backToRegion = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setFocus(null);
    setCamBusyFor(CAMERA_TRANSITION_MS);
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
          className={`region-viewport ${focus ? "is-district" : "is-region"} ${gestureActive || camBusy ? "is-busy" : ""}`}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeaveViewport}
        >
          <div
            className={`region-canvas ${gestureActive ? "no-anim" : ""}`}
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
              // 2026-09-07 (REAL_USER_FEEDBACK, first-play onboarding —
              // "子どもが、どうやって使ったらいいかわからない"): the label
              // used to stay invisible (opacity 0) for every marker until
              // its district was `inFocus`, INCLUDING the up-to-4 markers
              // Progressive Disclosure (2026-09-05) deliberately keeps
              // visible on the very first region view. A first-time child
              // landing on the map saw only bare, unlabeled flame icons —
              // nothing said what tapping one would do, so there was
              // nothing to look at and understand before tapping blind.
              // Showing the label for those SAME already-visible markers
              // (never for the still-hidden ones) closes that gap with a
              // one-line CSS/class change — no new marker, no new reveal
              // mechanism, no instruction text.
              const showLabel = inFocus || overviewVisibleIds.has(m.eventId);
              // 2026-09-07 (independent review of the label-visible fix
              // above, HIGH: the 4th overview label clipped off the right
              // edge of a 375px screen — showing the label is pointless if
              // it isn't actually readable). The label is centered on the
              // marker's SCREEN x (cam.tx + m.x * cam.s, since markers live
              // inside the transformed `.region-canvas`), which can put half
              // the label off either edge for a marker near the border.
              // Shift it back in by exactly the overflow amount via a CSS
              // custom property, additive to the existing opacity/scale
              // transition — 0px (no shift, no visual change) for every
              // marker that already fits.
              //
              // 2026-09-07 round-2 review HIGH (2 bugs in the first pass):
              // (1) a guessed half-width (80px) could shift a label that
              // already fit, or under/over-correct one that didn't — now
              // uses the label's REAL measured width (`labelWidths`, a
              // `useLayoutEffect` above); a label not yet measured (first
              // paint only) falls back to the CSS max-width as a safe
              // upper-bound estimate, corrected before the browser ever
              // paints the frame. (2) the correction was computed in SCREEN
              // px but applied as a CSS custom property INSIDE
              // `.region-canvas`, which itself is `scale(cam.s)`d — so the
              // actually-rendered shift was `labelShift * cam.s`, not
              // `labelShift`. Dividing by `cam.s` before handing it to CSS
              // makes the requested screen-px correction and the rendered
              // one the same value regardless of camera zoom.
              //
              // 2026-09-07 round-3 review HIGH: `labelWidths` (like the
              // 150px fallback) is in the canvas's own pre-scale px — both
              // are multiplied by `cam.s` here to reach the same screen-px
              // space as `vp.w` / `screenX` before they're compared.
              let labelShift = 0;
              if (showLabel) {
                const halfLabelScreenW = ((labelWidths[m.eventId] ?? 150) * cam.s) / 2 + 4;
                const screenX = cam.tx + m.x * cam.s;
                const overflowRight = screenX + halfLabelScreenW - vp.w;
                const overflowLeft = halfLabelScreenW - screenX;
                let screenShift = 0;
                if (overflowRight > 0) screenShift = -(overflowRight + 8);
                else if (overflowLeft > 0) screenShift = overflowLeft + 8;
                labelShift = cam.s ? screenShift / cam.s : 0;
              }
              return (
                <button
                  key={m.eventId}
                  className={[
                    "world-marker",
                    `st-${m.state.toLowerCase()}`,
                    inFocus ? "in-focus" : "far",
                    showLabel ? "label-visible" : "",
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
                  style={{ left: m.x, top: m.y, ...(labelShift ? { "--label-shift": `${labelShift}px` } as CSSProperties : {}) }}
                  onClick={() => {
                    if (suppressTap.current) return;
                    if (!inFocus) {
                      // a WORLD marker tap is never a dead tap: the camera
                      // glides in, then the world opens (one continuous move).
                      // 2026-09-13 (Gesture Arbitration repair §1): busy for
                      // the whole glide, so a second tap landing on another
                      // marker mid-flight can't also fire.
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                      setFocus(m.districtId);
                      setCamBusyFor(680);
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
                  <span
                    className="marker-label"
                    ref={(el) => { labelRefs.current[m.eventId] = el; }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* teaser toast for foggy districts */}
          {teaser && <div className="fog-teaser">{teaser}</div>}

          {focus && (
            <button className="region-back" onClick={backToRegion}>
              🗺 地域全体
            </button>
          )}
        </div>

        {focus && <p className="town-hint">気になる出来事をタップ。全部回らなくてもいい。</p>}
      </div>
    </div>
  );
}
