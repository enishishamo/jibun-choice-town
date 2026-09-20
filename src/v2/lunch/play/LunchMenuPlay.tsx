// 給食 WORLD「こんだてを考える」PLAY — board component.
// Rules live in lunchMenuLogic.ts; this file is interaction + reaction plumbing.
//
// TEMP_IMPLEMENTATION_ONLY: every shape, colour placement, motion curve and
// the two strings shown here are technical placeholders. Layout, dish art,
// tray art, the score's visual form, the reactions, the EVENT truck and the
// CLEAR moment are all DESIGN_NEEDED (GPT Screen Design). The component keeps
// asset slots (`assets`) so approved art drops in without logic changes.
import { useEffect, useRef, useState } from "react";
import "./lunchMenuPlay.css";
import {
  DISH_BY_ID, TRAY_SIZE, canCommit, commit, evaluate, eventReady, fireEvent, newSession, place, remove,
  type Session,
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
  const swipeStartY = useRef<number | null>(null);

  const ev = evaluate(s.tray);
  const shown = ev.complete ? ev.score : null;
  const hitDishes = new Set(ev.hits.flatMap((h) => h.dishIds));

  useEffect(() => {
    if (shown !== null) setScoreBump((n) => n + 1);
  }, [shown]);

  // EVENT: fires once, shortly after the child re-arranged and re-completed
  // the tray (Human decision §2). The delay lets the new score land first.
  useEffect(() => {
    if (s.phase !== "improve" || !eventReady(s) || eventTimer.current !== null) return;
    eventTimer.current = window.setTimeout(() => {
      setTruck("arrive");
      setS((cur) => fireEvent(cur));
    }, EVENT_DELAY_MS);
    return () => { /* keep the timer: the event must not be cancelled by a re-render */ };
  }, [s]);

  useEffect(() => {
    if (truck !== "arrive") return;
    const t = window.setTimeout(() => setTruck("parked"), 700);
    return () => clearTimeout(t);
  }, [truck]);

  const bump = (id: string) => {
    setShake(id);
    window.setTimeout(() => setShake((cur) => (cur === id ? null : cur)), 420);
  };

  const tapCandidate = (id: string) => {
    if (cleared) return;
    if (s.tray.includes(id)) return;
    const r = place(s, id);
    if (!r.ok) {
      bump(id);
      if (r.reason === "unavailable") setTruck("arrive");
      return;
    }
    setS(r.session);
    setPop(r.slot);
    window.setTimeout(() => setPop((cur) => (cur === r.slot ? null : cur)), 380);
  };

  const tapTrayDish = (id: string) => {
    if (cleared) return;
    setS(remove(s, id));
  };

  const doCommit = () => {
    if (cleared || !canCommit(s)) return;
    const done = commit(s);
    setS(done);
    setCleared(true);
    window.setTimeout(() => onCleared(done.committedScore ?? 0), CLEAR_DELAY_MS);
  };

  const commitReady = !cleared && canCommit(s);

  return (
    <section className={`lmp ${cleared ? "is-cleared" : ""} phase-${s.phase}`} aria-label="こんだてを考える">
      <p className="lmp-temp">TEMP_IMPLEMENTATION_ONLY</p>

      {/* EVENT truck (placeholder shape) */}
      <div className={`lmp-truck st-${truck}`} aria-hidden="true">
        {assets?.truck ? <img src={assets.truck} alt="" /> : <span className="lmp-ph lmp-ph-truck">TEMP</span>}
      </div>

      {/* tray — visual priority #1. Swipe up = commit (DESIGN_NEEDED: final in-world gesture). */}
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
          {Array.from({ length: TRAY_SIZE }).map((_, i) => {
            const id = s.tray[i];
            return (
              <button
                key={i}
                type="button"
                className={`lmp-slot ${id ? "filled" : "empty"} ${pop === i ? "pop" : ""} ${id && hitDishes.has(id) ? "hit" : ""}`}
                aria-label={id ? DISH_BY_ID[id].id : `slot ${i + 1}`}
                disabled={!id}
                onClick={() => id && tapTrayDish(id)}
              >
                {id && <DishFace id={id} src={assets?.dish?.[id]} />}
              </button>
            );
          })}
        </div>
        {/* score — visual priority #3 (its form is DESIGN_NEEDED) */}
        <output className={`lmp-score ${shown === null ? "off" : ""}`} key={scoreBump} aria-live="polite">
          {shown ?? ""}
        </output>
        {commitReady && (
          <button type="button" className="lmp-commit lmp-ph" onClick={doCommit}>
            TEMP commit ↑
          </button>
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
              aria-label={id}
              disabled={onTray}
              onClick={() => tapCandidate(id)}
            >
              <DishFace id={id} src={assets?.dish?.[id]} />
              {unavailable && <span className="lmp-badge" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DishFace({ id, src }: { id: string; src?: string }) {
  if (src) return <img className="lmp-dish-art" src={src} alt="" />;
  const d = DISH_BY_ID[id];
  // placeholder: role decides the shape, the three group dots are the visible
  // attribute (DESIGN_NEEDED-03 decides the real representation)
  return (
    <span className={`lmp-ph lmp-dish role-${d.role}`}>
      <span className="lmp-dots" aria-hidden="true">
        {(["red", "yellow", "green"] as const).map((g) =>
          Array.from({ length: d.groups[g] }).map((_, i) => <i key={g + i} className={`dot-${g}`} />),
        )}
      </span>
    </span>
  );
}
