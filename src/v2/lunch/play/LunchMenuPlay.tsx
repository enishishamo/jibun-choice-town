// 給食 WORLD「こんだてを考える」PLAY — board component.
// Rules live in lunchMenuLogic.ts; this file is interaction + reaction plumbing.
//
// Experience spec (Human/GPT 2026-09-21): no total score for the child, no
// explanation up front; after the first full tray a minimal status layer
// shows how the combination stands — small colour grains fly from each dish
// into the three colour marks so the dish→colour relation is learnt by
// motion, not text; dishes related to a problem wobble gently (never all of
// them, never exactly one as "the answer"); EVENT after the child has seen a
// change they made; CLEAR = sending the finished lunch off to the school
// (the principal's check, V-A5, is a beat inside that moment, not a button).
// Dish art is a pure visual asset — game attributes live in the UI layer.
//
// TEMP_IMPLEMENTATION_ONLY where no approved art exists: placeholder shapes,
// motion curves and the status cues' form (DN-04) are placeholders. Strings
// come only from ../copy.ts. Approved art arrives via `assets`; a missing or
// broken file falls back to the placeholder at render time.
import { useEffect, useRef, useState } from "react";
import "./lunchMenuPlay.css";
import { COPY } from "../copy";
import {
  DISH_BY_ID, FREE_SLOTS, MILK, MILK_FIXED, RULES, canCommit, commit, evaluate, eventReady, fireEvent, newSession, place, relatedSet, remove,
  type Dish, type Evaluation, type Group, type RuleId, type Session, type Tray,
} from "./lunchMenuLogic";

export interface LunchMenuPlayProps {
  onCleared: (score: number) => void;
  assets?: { tray?: string; dish?: Record<string, string>; truck?: string; school?: string };
}

const EVENT_DELAY_MS = 1400;
const DELIVER_MS = 1600;
const COMMIT_SWIPE_PX = 56;
const GROUPS: Group[] = ["red", "yellow", "green"];

/** per-rule penalty totals — the unit the status layer reacts on */
function axes(ev: Evaluation): Partial<Record<RuleId, number>> {
  const m: Partial<Record<RuleId, number>> = {};
  for (const h of ev.hits) m[h.rule] = (m[h.rule] ?? 0) + h.points;
  return m;
}
type Delta = Partial<Record<RuleId | `group:${Group}`, "up" | "down">>;
function groupPenalty(ev: Evaluation, g: Group): number {
  return ev.hits.filter((h) => (h.rule === "group_low" || h.rule === "group_high") && h.detail === g).reduce((s, h) => s + h.points, 0);
}
function delta(prev: Evaluation | null, next: Evaluation): Delta {
  if (!prev || !prev.complete || !next.complete) return {};
  const a = axes(prev), b = axes(next), d: Delta = {};
  for (const k of Object.keys(RULES) as RuleId[]) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    if (y < x) d[k] = "up"; else if (y > x) d[k] = "down";
  }
  for (const g of GROUPS) {
    const x = groupPenalty(prev, g), y = groupPenalty(next, g);
    if (y < x) d[`group:${g}`] = "up"; else if (y > x) d[`group:${g}`] = "down";
  }
  return d;
}

interface Grain { id: number; g: Group; x0: number; y0: number; x1: number; y1: number; delay: number }

export default function LunchMenuPlay({ onCleared, assets }: LunchMenuPlayProps) {
  const [s, setS] = useState<Session>(() => newSession());
  const [shake, setShake] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const [truck, setTruck] = useState<"hidden" | "arrive" | "parked">("hidden");
  const [delivering, setDelivering] = useState(false);
  const [changed, setChanged] = useState<Delta>({});
  const [grains, setGrains] = useState<Grain[]>([]);
  const [flying, setFlying] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const eventTimer = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);
  const fxTimers = useRef<Set<number>>(new Set());
  const committedRef = useRef(false);
  const swipeStartY = useRef<number | null>(null);
  const lastEval = useRef<Evaluation | null>(null);
  const grainSeq = useRef(0);
  const sessionRef = useRef<Session>(s);
  sessionRef.current = s;
  const [trayArtOk, setTrayArtOk] = useState(false);
  const [schoolArtOk, setSchoolArtOk] = useState(false);

  const ev = evaluate(s.tray);
  const related = relatedSet(ev.hits);
  const showStatus = s.firstScore !== null; // spec §3: only after the first full tray

  const fx = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { fxTimers.current.delete(t); fn(); }, ms);
    fxTimers.current.add(t);
  };

  // dish → colour grains: when the tray is (re)completed, grains leave each
  // dish and land in the matching colour mark (learning by motion, spec §3)
  const launchGrains = () => {
    const root = rootRef.current;
    if (!root) return;
    const rb = root.getBoundingClientRect();
    const out: Grain[] = [];
    const dishes = [...s.tray.filter((d): d is string => !!d), ...(MILK_FIXED ? [MILK.id] : [])];
    dishes.forEach((id, si) => {
      const slot = root.querySelector<HTMLElement>(`[data-slot-dish="${id}"]`);
      if (!slot) return;
      const sb = slot.getBoundingClientRect();
      for (const g of GROUPS) {
        const mark = root.querySelector<HTMLElement>(`[data-group="${g}"]`);
        if (!mark) continue;
        const mb = mark.getBoundingClientRect();
        for (let i = 0; i < DISH_BY_ID[id].groups[g]; i++) {
          out.push({
            id: ++grainSeq.current, g,
            x0: sb.left - rb.left + sb.width / 2 + (i - 0.5) * 8, y0: sb.top - rb.top + sb.height / 2,
            x1: mb.left - rb.left + mb.width / 2, y1: mb.top - rb.top + mb.height / 2,
            delay: si * 90 + i * 60,
          });
        }
      }
    });
    setGrains(out);
    setFlying(false);
    fx(() => setFlying(true), 40); // timer, not rAF: rAF is throttled in background tabs
    fx(() => { setGrains([]); setFlying(false); }, 1400);
  };

  // status-layer reaction: which cues improved / worsened since the last full tray
  useEffect(() => {
    if (ev.complete) {
      const d = delta(lastEval.current, ev);
      lastEval.current = ev;
      if (Object.keys(d).length) { setChanged(d); fx(() => setChanged({}), 900); }
      // grains fly after the status layer exists in the DOM (next frame)
      fx(launchGrains, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.tray.join("|")]);

  // EVENT: armed once the child re-completed the tray after a re-arrangement
  // (spec §4). Re-validated at fire time; released if no longer ready.
  useEffect(() => {
    if (eventTimer.current !== null || !eventReady(s)) return;
    eventTimer.current = window.setTimeout(() => {
      eventTimer.current = null;
      setS((cur) => { const next = fireEvent(cur); if (next !== cur) setTruck("arrive"); return next; });
    }, EVENT_DELAY_MS);
  }, [s]);
  useEffect(() => () => {
    if (eventTimer.current !== null) clearTimeout(eventTimer.current);
    if (clearTimer.current !== null) clearTimeout(clearTimer.current);
    for (const t of fxTimers.current) clearTimeout(t);
  }, []);
  useEffect(() => {
    if (truck !== "arrive") return;
    const t = window.setTimeout(() => setTruck("parked"), 700);
    return () => clearTimeout(t);
  }, [truck]);

  const bump = (id: string) => { setShake(id); fx(() => setShake((cur) => (cur === id ? null : cur)), 420); };

  const tapCandidate = (id: string) => {
    if (committedRef.current) return;
    const r = place(sessionRef.current, id);
    if (!r.ok) { bump(id); if (r.reason === "unavailable") setTruck("arrive"); return; }
    sessionRef.current = r.session;
    setS(r.session);
    setPop(r.slot);
    fx(() => setPop((cur) => (cur === r.slot ? null : cur)), 380);
  };
  const tapTrayDish = (id: string) => {
    if (committedRef.current) return;
    sessionRef.current = remove(sessionRef.current, id);
    setS(sessionRef.current);
  };

  // CLEAR = deliver: swipe the tray up to the school, or tap the school (a11y)
  const deliver = () => {
    if (committedRef.current || !canCommit(sessionRef.current)) return;
    committedRef.current = true;
    const done = commit(sessionRef.current);
    sessionRef.current = done;
    setS(done);
    setDelivering(true);
    clearTimer.current = window.setTimeout(() => onCleared(done.committedScore ?? 0), DELIVER_MS);
  };
  const commitReady = !delivering && canCommit(s);
  const dishName = (id: string) => COPY.play.dish[id] ?? COPY.play.unknownDish;

  return (
    <section ref={rootRef} className={`lmp ${delivering ? "is-delivering" : ""} phase-${s.phase}`} aria-label={COPY.play.title}>
      {!assets && <p className="lmp-temp">{COPY.dev.temp}</p>}

      {/* the school — appears as a destination once the lunch can be sent off */}
      <button
        type="button"
        className={`lmp-school ${commitReady ? "ready" : ""} ${delivering ? "stamped" : ""} ${schoolArtOk ? "has-art" : ""}`}
        aria-label={COPY.play.deliver}
        disabled={!commitReady}
        onClick={deliver}
      >
        <Art src={assets?.school} className="lmp-school-art" onState={setSchoolArtOk} fallback={<span className="lmp-ph lmp-ph-school">{COPY.dev.tag}</span>} />
        {delivering && <span className="lmp-stamp lmp-ph">{COPY.dev.stamp}</span>}
      </button>

      <div className={`lmp-truck st-${truck}`} aria-hidden="true">
        <Art src={assets?.truck} className="lmp-truck-art" fallback={<span className="lmp-ph lmp-ph-truck">{COPY.dev.tag}</span>} />
      </div>

      {/* tray — visual priority #1 */}
      <div
        className={`lmp-tray ${commitReady ? "can-deliver" : ""} ${trayArtOk ? "has-art" : ""}`}
        onPointerDown={(e) => { if (commitReady) swipeStartY.current = e.clientY; }}
        onPointerUp={(e) => {
          if (swipeStartY.current !== null && swipeStartY.current - e.clientY > COMMIT_SWIPE_PX) deliver();
          swipeStartY.current = null;
        }}
        onPointerCancel={() => { swipeStartY.current = null; }}
      >
        <Art src={assets?.tray} className="lmp-tray-art" onState={setTrayArtOk} />
        <div className="lmp-slots">
          {Array.from({ length: FREE_SLOTS }).map((_, i) => {
            const id = s.tray[i];
            return (
              <button
                key={i}
                type="button"
                className={`lmp-slot s${i} ${id ? "filled" : "empty"} ${pop === i ? "pop" : ""} ${showStatus && id && related.has(id) ? "related" : ""}`}
                aria-label={id ? dishName(id) : COPY.play.slotEmpty(i + 1)}
                data-slot-dish={id ?? undefined}
                disabled={!id}
                onClick={() => id && tapTrayDish(id)}
              >
                {id && <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
              </button>
            );
          })}
          {MILK_FIXED && (
            <div className="lmp-slot fixed filled" role="img" aria-label={COPY.play.milkSlot} data-slot-dish={MILK.id}>
              <DishFace dish={MILK} src={assets?.dish?.milk} />
            </div>
          )}
        </div>
      </div>

      {/* status layer — visual priority #3, only after the first full tray (spec §3) */}
      {showStatus && <StatusLayer ev={ev} tray={s.tray} changed={changed} />}

      {/* colour grains in flight (dish → colour mark) */}
      <div className="lmp-grains" aria-hidden="true">
        {grains.map((gr) => (
          <i
            key={gr.id}
            className={`lmp-grain ${gr.g} ${flying ? "go" : ""}`}
            style={{ left: gr.x0, top: gr.y0, transitionDelay: `${gr.delay}ms`, transform: flying ? `translate(${gr.x1 - gr.x0}px, ${gr.y1 - gr.y0}px) scale(0.6)` : "translate(0,0)" }}
          />
        ))}
      </div>

      {/* candidates — visual priority #2 */}
      <div className="lmp-cands">
        {s.candidates.map((id, i) => {
          const onTray = s.tray.includes(id);
          const unavailable = !s.available[id];
          return (
            <button
              key={id}
              type="button"
              className={`lmp-cand ${onTray ? "on-tray" : ""} ${unavailable ? "unavailable" : ""} ${shake === id ? "shake" : ""} ${i === 0 && ev.filled === 0 ? "invite" : ""}`}
              aria-label={unavailable ? COPY.play.dishUnavailable(dishName(id)) : dishName(id)}
              disabled={onTray}
              onClick={() => tapCandidate(id)}
            >
              <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />
              {unavailable && <span className="lmp-badge" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** <img> that falls back to `fallback` when the file is missing/broken. */
function Art({ src, className, fallback, onState }: { src?: string; className?: string; fallback?: React.ReactNode; onState?: (ok: boolean) => void }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); if (!src) onState?.(false); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!src || broken) return <>{fallback ?? null}</>;
  return (
    <img
      className={className}
      src={src}
      alt=""
      draggable={false}
      onLoad={() => onState?.(true)}
      onError={() => { setBroken(true); onState?.(false); }}
    />
  );
}

/** Dish = pure visual asset (spec: attributes are NOT baked into the art).
 * Placeholder: a role-shaped disc so dishes are tellable apart before art exists. */
export function DishFace({ dish, src }: { dish: Dish; src?: string }) {
  return (
    <Art
      src={src}
      className="lmp-dish-art"
      fallback={<span className={`lmp-ph lmp-dish role-${dish.role}`} data-dish={dish.id} aria-hidden="true" />}
    />
  );
}

/** The judgment cues, translated from the fact-based rules to a minimum
 * visual layer: three colour marks (三色食品群) that are filled / hollow /
 * overflowing, and small marks that appear only when a rule is hit
 * (かぶり・しお・あぶら・種類). Every RuleId has a cue (harness-checked);
 * `changed` pulses a cue that just improved or worsened. Form: DN-04. */
export function StatusLayer({ ev, tray, changed }: { ev: Evaluation; tray: Tray; changed: Delta }) {
  const groupState = (g: Group): "ok" | "low" | "high" => {
    if (ev.hits.some((h) => h.rule === "group_low" && h.detail === g)) return "low";
    if (ev.hits.some((h) => h.rule === "group_high" && h.detail === g)) return "high";
    return "ok";
  };
  const ruleHits = (["missing_role", "duplicate_role", "dup_ingredient", "dup_method", "salt_over", "fat_over"] as RuleId[])
    .map((r) => ({ r, hits: ev.hits.filter((h) => h.rule === r) }))
    .filter((x) => x.hits.length);
  const groupCue = (g: Group) => (groupState(g) === "ok" ? "" : groupState(g) === "low" ? "group_low" : "group_high");
  return (
    <div className={`lmp-status ${ev.complete ? "" : "pending"}`} role="group" aria-label={COPY.play.status.title} data-tray={tray.join(",")}>
      <span className="lmp-groups">
        {GROUPS.map((g) => (
          <i
            key={g}
            className={`lmp-group ${g} is-${groupState(g)} ${changed[`group:${g}`] ? `chg-${changed[`group:${g}`]}` : ""}`}
            data-cue={groupCue(g) || `group:${g}`}
            data-group={g}
            role="img"
            aria-label={`${COPY.play.status.group[g]} ${COPY.play.status.groupState[groupState(g)]}`}
          />
        ))}
      </span>
      <span className="lmp-marks">
        {ruleHits.map(({ r, hits }) => (
          <i
            key={r}
            className={`lmp-mark ${r} ${changed[r] ? `chg-${changed[r]}` : ""}`}
            data-cue={r}
            data-count={hits.length}
            role="img"
            aria-label={COPY.play.status.rule[r]}
          />
        ))}
      </span>
    </div>
  );
}
