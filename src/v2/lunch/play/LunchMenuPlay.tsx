// 給食 WORLD「こんだてを考える」PLAY — board component.
// Rules live in lunchMenuLogic.ts; this file is interaction + reaction plumbing.
//
// TEMP_IMPLEMENTATION_ONLY: every shape, colour placement and motion curve is
// a technical placeholder. Layout, dish/tray/truck art, the score's visual
// form, the reactions and the CLEAR moment ("校長先生に見せる", V-A5) are
// DESIGN_NEEDED. Strings come only from ../copy.ts. Approved art drops in via
// `assets` without logic changes.
import { useEffect, useRef, useState } from "react";
import "./lunchMenuPlay.css";
import { COPY } from "../copy";
import {
  DISH_BY_ID, FREE_SLOTS, MILK, MILK_FIXED, canCommit, commit, evaluate, eventReady, fireEvent, newSession, place, remove,
  type Dish, type Session,
} from "./lunchMenuLogic";

export interface LunchMenuPlayProps {
  onCleared: (score: number) => void;
  assets?: { tray?: string; dish?: Record<string, string>; truck?: string };
}

const EVENT_DELAY_MS = 900;
const CLEAR_DELAY_MS = 1100;
const COMMIT_SWIPE_PX = 56;

export default function LunchMenuPlay({ onCleared, assets }: LunchMenuPlayProps) {
  const [s, setS] = useState<Session>(() => newSession());
  const [shake, setShake] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const [truck, setTruck] = useState<"hidden" | "arrive" | "parked">("hidden");
  const [scoreBump, setScoreBump] = useState(0);
  const [cleared, setCleared] = useState(false);
  const eventTimer = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);
  const fxTimers = useRef<Set<number>>(new Set());
  const committedRef = useRef(false);
  const swipeStartY = useRef<number | null>(null);

  const ev = evaluate(s.tray);
  const shown = ev.complete ? ev.score : null;
  const hitDishes = new Set(ev.hits.flatMap((h) => h.dishIds));

  useEffect(() => { if (shown !== null) setScoreBump((n) => n + 1); }, [shown]);

  // EVENT: armed when the child re-completed the tray after a re-arrangement.
  // Re-validated at fire time (the child may have changed the tray during the
  // delay); if no longer ready, the timer is released so it can re-arm later.
  useEffect(() => {
    if (eventTimer.current !== null || !eventReady(s)) return;
    eventTimer.current = window.setTimeout(() => {
      eventTimer.current = null;
      setS((cur) => {
        const next = fireEvent(cur);
        if (next !== cur) setTruck("arrive");
        return next;
      });
    }, EVENT_DELAY_MS);
  }, [s]);
  useEffect(() => () => {
    if (eventTimer.current !== null) clearTimeout(eventTimer.current);
    if (clearTimer.current !== null) clearTimeout(clearTimer.current);
    for (const t of fxTimers.current) clearTimeout(t);
  }, []);
  const fx = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { fxTimers.current.delete(t); fn(); }, ms);
    fxTimers.current.add(t);
  };
  useEffect(() => {
    if (truck !== "arrive") return;
    const t = window.setTimeout(() => setTruck("parked"), 700);
    return () => clearTimeout(t);
  }, [truck]);

  const bump = (id: string) => {
    setShake(id);
    fx(() => setShake((cur) => (cur === id ? null : cur)), 420);
  };

  const tapCandidate = (id: string) => {
    if (committedRef.current) return;
    const r = place(s, id);
    if (!r.ok) {
      bump(id);
      if (r.reason === "unavailable") setTruck("arrive");
      return;
    }
    setS(r.session);
    setPop(r.slot);
    fx(() => setPop((cur) => (cur === r.slot ? null : cur)), 380);
  };

  const tapTrayDish = (id: string) => { if (!committedRef.current) setS(remove(s, id)); };

  const doCommit = () => {
    if (committedRef.current || !canCommit(s)) return;
    committedRef.current = true;
    const done = commit(s);
    setS(done);
    setCleared(true);
    clearTimer.current = window.setTimeout(() => onCleared(done.committedScore ?? 0), CLEAR_DELAY_MS);
  };

  const commitReady = !cleared && canCommit(s);
  const dishName = (id: string) => COPY.play.dish[id] ?? COPY.play.unknownDish;

  return (
    <section className={`lmp ${cleared ? "is-cleared" : ""} phase-${s.phase}`} aria-label={COPY.play.title}>
      <p className="lmp-temp">{COPY.dev.temp}</p>

      <div className={`lmp-truck st-${truck}`} aria-hidden="true">
        {assets?.truck ? <img src={assets.truck} alt="" /> : <span className="lmp-ph lmp-ph-truck">{COPY.dev.tag}</span>}
      </div>

      {/* tray — visual priority #1. Swipe up = commit (final in-world gesture: DESIGN_NEEDED). */}
      <div
        className={`lmp-tray ${commitReady ? "can-commit" : ""}`}
        onPointerDown={(e) => { if (commitReady) swipeStartY.current = e.clientY; }}
        onPointerUp={(e) => {
          if (swipeStartY.current !== null && swipeStartY.current - e.clientY > COMMIT_SWIPE_PX) doCommit();
          swipeStartY.current = null;
        }}
        onPointerCancel={() => { swipeStartY.current = null; }}
      >
        {assets?.tray && <img className="lmp-tray-art" src={assets.tray} alt="" />}
        <div className="lmp-slots">
          {Array.from({ length: FREE_SLOTS }).map((_, i) => {
            const id = s.tray[i];
            return (
              <button
                key={i}
                type="button"
                className={`lmp-slot ${id ? "filled" : "empty"} ${pop === i ? "pop" : ""} ${id && hitDishes.has(id) ? "hit" : ""}`}
                aria-label={id ? dishName(id) : COPY.play.slotEmpty(i + 1)}
                disabled={!id}
                onClick={() => id && tapTrayDish(id)}
              >
                {id && <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
              </button>
            );
          })}
          {MILK_FIXED && (
            <div className="lmp-slot filled fixed" role="img" aria-label={COPY.play.milkSlot}>
              <DishFace dish={MILK} src={assets?.dish?.milk} />
            </div>
          )}
        </div>
        <output className={`lmp-score ${shown === null ? "off" : ""}`} key={scoreBump} aria-live="polite">
          {shown ?? ""}
        </output>
        {commitReady && (
          <button type="button" className="lmp-commit lmp-ph" onClick={doCommit}>{COPY.dev.commitTemp}</button>
        )}
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

/** Every VISIBLE_ATTRIBUTE is drawn on every dish, with or without approved
 * art: role = shape, method = rim, ingredient = pattern (placeholder body) and,
 * always, groups = dots + salt/fat = bars (overlay). When approved art
 * arrives, the art replaces the body but the overlay stays until the Design
 * Owner supplies art that encodes the same cues (DN-03) — scoring must never
 * depend on something the child cannot see. */
export function DishFace({ dish, src }: { dish: Dish; src?: string }) {
  return (
    <span
      className={`lmp-dish role-${dish.role} method-${dish.method} ${src ? "has-art" : "lmp-ph"}`}
      data-ingredient={dish.ingredient}
      data-role={dish.role}
      data-method={dish.method}
      aria-hidden="true"
    >
      {src && <img className="lmp-dish-art" src={src} alt="" />}
      <span className="lmp-dots" data-attr="groups">
        {(["red", "yellow", "green"] as const).map((g) =>
          Array.from({ length: dish.groups[g] }).map((_, i) => <i key={g + i} className={`dot-${g}`} />),
        )}
      </span>
      <span className="lmp-levels">
        <span className="lmp-level salt" data-attr="salt">{Array.from({ length: dish.salt }).map((_, i) => <i key={i} />)}</span>
        <span className="lmp-level fat" data-attr="fat">{Array.from({ length: dish.fat }).map((_, i) => <i key={i} />)}</span>
      </span>
    </span>
  );
}
