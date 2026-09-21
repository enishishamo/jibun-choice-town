// 給食 WORLD「こんだてを考える」— the board.
// Rules live in lunchMenuLogic.ts; this file is interaction and reaction only.
//
// The scene, top to bottom: a band where the delivery truck and the school
// appear, the tray (the hero), the counting rack that the tray's dishes move,
// and the serving counter the dishes come from.
//
// PLAY FIRST: nothing is explained. The first dish floats slightly so it looks
// touchable; tapping it is the whole tutorial. Placing a dish sends small motes
// into the four grooves of the rack and the beads roll — that is how the child
// learns that dishes move the four things, without a word about nutrition.
// Each groove has a hollow carved in the middle: a bead that settles into the
// hollow has found its place, a bead out on the shallow part cannot rest. More
// is never better. Nothing shows a score, a percentage or a right/wrong mark.
//
// Sending the tray to the school is the child's own gesture and the only way to
// finish. The first send is intercepted by the delivery trouble; the second one
// actually arrives.
import { useEffect, useRef, useState } from "react";
import "./lunchMenuPlay.css";
import Art from "../Art";
import { COPY } from "../copy";
import { useScreenFocus } from "../useScreenFocus";
import {
  AXES, DISH_BY_ID, FREE_SLOTS, MILK, MILK_FIXED, bandOnTrack, canSend, evaluate, newSession, place, relatedSet, remove, send, swap,
  type Axis, type Band, type Dish, type Evaluation, type Session,
} from "./lunchMenuLogic";

export interface LunchMenuPlayProps {
  onCleared: () => void;
  assets?: { tray?: string; dish?: Record<string, string>; truck?: string; school?: string };
}

const FLY_MS = 380;
const MOTE_MS = 620;
const TRUCK_MS = 1500;
const DELIVER_MS = 1700;
const COMMIT_SWIPE_PX = 56;
/** serving order on the counter (主食 → 主菜 → 副菜 → 汁物) — layout only, never a rule */
const COURSES: Dish["course"][] = ["staple", "main", "side", "soup"];
/** recess centres as % of the tray box, measured from public/assets/v2/lunch/tray.png */
const SLOT_POS = [{ x: 22.5, y: 23 }, { x: 50, y: 23.5 }, { x: 21, y: 60 }, { x: 50, y: 61 }];
const MILK_POS = { x: 77, y: 43 };
/** each groove of the rack, as % of the rack box; the bead travels x0..x1.
 * Keep in step with .lmp-groove-track / .lmp-groove-hollow in the CSS. */
const GROOVE = { x0: 38, x1: 93 };
const GROOVE_Y: Record<Axis, number> = { energy: 17.5, protein: 39, fat: 60.5, salt: 82 };

interface Fly { seq: number; id: string; x0: number; y0: number; w0: number; x1: number; y1: number; w1: number }
interface Mote { id: number; a: Axis; x0: number; y0: number; x1: number; y1: number; delay: number }
interface Spark { id: number; x: number; y: number; a: number }

export default function LunchMenuPlay({ onCleared, assets }: LunchMenuPlayProps) {
  const [s, setS] = useState<Session>(() => newSession());
  const [shake, setShake] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const [arriving, setArriving] = useState<number | null>(null);
  const [leavingSlot, setLeavingSlot] = useState<number | null>(null);
  /** touching an empty recess calls the counter's attention rather than doing nothing */
  const [calling, setCalling] = useState(false);
  const [fly, setFly] = useState<Fly | null>(null);
  const [flyGo, setFlyGo] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [motes, setMotes] = useState<Mote[]>([]);
  /** which beads were just struck by a mote — every axis reacts visibly, even
   * when the dish moves it only a little, so "this dish moved those four" is
   * never conveyed by a 2px slide alone */
  const [struck, setStruck] = useState<Set<Axis>>(() => new Set());
  const [motesGo, setMotesGo] = useState(false);
  const [truck, setTruck] = useState<"away" | "arriving" | "parked">("away");
  /** the trouble is announced once and then gets out of the way */
  const [troubleShown, setTroubleShown] = useState(false);
  const [sending, setSending] = useState(false);
  const [settled, setSettled] = useState(false);
  /** bead positions actually drawn — they lag the model until the motes land */
  const [shown, setShown] = useState<Record<Axis, number>>(() => beadPositions(evaluate([null, null, null, null])));
  const rootRef = useScreenFocus<HTMLElement>();
  const fxTimers = useRef<Set<number>>(new Set());
  const seq = useRef(0);
  const flightSeq = useRef(0);
  const sentRef = useRef(false);
  const swipeStartY = useRef<number | null>(null);
  const sessionRef = useRef<Session>(s);
  sessionRef.current = s;
  const prevViable = useRef(false);
  const [trayArtOk, setTrayArtOk] = useState(false);
  const [schoolArtOk, setSchoolArtOk] = useState(false);

  const ev = evaluate(s.tray);
  // a menu that is not finished yet cannot be wrong, so nothing is judged and
  // nothing is pointed at until the tray is full
  const related = ev.complete ? relatedSet(s.tray, ev) : new Set<string>();
  // The verdict is read off the beads WHERE THEY ARE DRAWN, never off the model
  // directly: the picture and the rule can then never disagree, and the school
  // cannot appear before the beads have finished rolling into their hollows.
  const drawn = Object.fromEntries(AXES.map((a) => {
    const [b0, b1] = bandOnTrack(a);
    const at = shown[a];
    return [a, at < b0 ? "low" : at > b1 ? "high" : "good"];
  })) as Record<Axis, Band>;
  const beadsSettled = ev.complete && ev.hasStaple && AXES.every((a) => drawn[a] === "good");
  // nothing is offered while a dish or its motes are still in the air: the
  // picture must have finished settling before the world reacts to it
  const sendable = !sending && !fly && motes.length === 0 && beadsSettled && canSend(s);
  const dishName = (id: string) => COPY.play.dish[id] ?? COPY.play.dish.unknown;

  const fx = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { fxTimers.current.delete(t); fn(); }, ms);
    fxTimers.current.add(t);
  };
  useEffect(() => () => { for (const t of fxTimers.current) clearTimeout(t); }, []);

  /** motes leave the dish that just landed and fall into the four grooves */
  const launchMotes = (dishId: string, slotIndex: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rb = root.getBoundingClientRect();
    const from = root.querySelector<HTMLElement>(`[data-slot-index="${slotIndex}"]`) ?? root.querySelector<HTMLElement>(`[data-slot-dish="${dishId}"]`);
    if (!from) { setShown(beadPositions(evaluate(sessionRef.current.tray))); return; }
    const fb = from.getBoundingClientRect();
    const out: Mote[] = [];
    AXES.forEach((a, i) => {
      const bead = root.querySelector<HTMLElement>(`[data-bead="${a}"]`);
      if (!bead) return;
      const bb = bead.getBoundingClientRect();
      out.push({
        id: ++seq.current, a,
        x0: fb.left - rb.left + fb.width / 2, y0: fb.top - rb.top + fb.height / 2,
        x1: bb.left - rb.left + bb.width / 2, y1: bb.top - rb.top + bb.height / 2,
        delay: i * 70,
      });
    });
    setMotes(out);
    setMotesGo(false);
    fx(() => setMotesGo(true), 30); // a timer, not rAF: rAF is throttled in a hidden tab
    // the beads move when the motes reach them, never before
    AXES.forEach((a, i) => fx(() => {
      setShown((cur) => ({ ...cur, [a]: beadPositions(evaluate(sessionRef.current.tray))[a] }));
      setStruck((cur) => new Set(cur).add(a));
      fx(() => setStruck((cur) => { const n = new Set(cur); n.delete(a); return n; }), 420);
    }, 30 + i * 70 + MOTE_MS * 0.75));
    fx(() => { setMotes([]); setMotesGo(false); }, 30 + AXES.length * 70 + MOTE_MS + 120);
  };
  /** no dish to fly from (a removal): the beads simply roll back */
  const rollBeads = () => setShown(beadPositions(evaluate(sessionRef.current.tray)));

  // the menu just came together: the tray settles. No score, no "correct".
  useEffect(() => {
    const isViable = ev.viable;
    if (isViable && !prevViable.current) {
      fx(() => {
        if (!evaluate(sessionRef.current.tray).viable) return; // it was broken again while we waited
        setSettled(true);
        fx(() => setSettled(false), 900);
      }, MOTE_MS);
    }
    prevViable.current = isViable;
  }, [ev.viable]); // eslint-disable-line react-hooks/exhaustive-deps

  const bump = (id: string) => { setShake(id); fx(() => setShake((cur) => (cur === id ? null : cur)), 420); };
  const callDishes = () => { setCalling(true); fx(() => setCalling(false), 2200); };

  const flyDish = (id: string, slot: number, fromEl: HTMLElement) => {
    const root = rootRef.current;
    const rb = root?.getBoundingClientRect();
    const from = (fromEl.querySelector(".lmp-dish-art, .lmp-dish") ?? fromEl).getBoundingClientRect();
    const to = root?.querySelector<HTMLElement>(`[data-slot-index="${slot}"]`)?.getBoundingClientRect();
    if (!rb || !to) { rollBeads(); return; }
    const mine = ++seq.current;
    flightSeq.current = mine;
    setFly({ seq: mine, id, x0: from.left - rb.left, y0: from.top - rb.top, w0: from.width, x1: to.left - rb.left, y1: to.top - rb.top, w1: to.width });
    setFlyGo(false);
    setArriving(slot);
    fx(() => { if (flightSeq.current === mine) setFlyGo(true); }, 20);
    fx(() => {
      if (flightSeq.current !== mine) return;
      setFly(null);
      setArriving(null);
      if (sessionRef.current.tray[slot] !== id) return; // it left again while in the air
      setPop(slot);
      const cx = to.left - rb.left + to.width / 2, cy = to.top - rb.top + to.height / 2;
      setSparks(Array.from({ length: 7 }, (_, i) => ({ id: ++seq.current, x: cx, y: cy, a: (i / 7) * 360 + 15 })));
      fx(() => setSparks([]), 600);
      fx(() => setPop((cur) => (cur === slot ? null : cur)), 380);
      launchMotes(id, slot);
    }, FLY_MS);
  };

  const tapCandidate = (id: string, el: HTMLElement) => {
    if (sentRef.current || sending) return;
    const cur = sessionRef.current;
    if (!cur.available[id]) { bump(id); return; }
    if (cur.tray.includes(id)) { bump(id); return; }
    clearTrouble();
    const free = cur.tray.indexOf(null);
    if (free >= 0) {
      const r = place(cur, id);
      if (!r.ok) { bump(id); return; }
      sessionRef.current = r.session;
      setS(r.session);
      flyDish(id, r.slot, el);
      return;
    }
    // the tray is full: replace the one dish of the same course, if there is exactly one
    const course = DISH_BY_ID[id].course;
    const same = cur.tray.filter((d): d is string => !!d && DISH_BY_ID[d].course === course);
    if (same.length !== 1) { bump(id); return; }
    // the dish that is making way lifts out first, so the exchange is visible
    setLeavingSlot(cur.tray.indexOf(same[0]));
    fx(() => {
      setLeavingSlot(null);
      // recompute against the tray as it is NOW: a second quick tap must not be
      // rejected just because the first one had not finished lifting out
      const now = sessionRef.current;
      if (now.tray.includes(id) || !now.available[id]) return;
      const free = now.tray.indexOf(null);
      if (free >= 0) {
        const r = place(now, id);
        if (!r.ok) return;
        sessionRef.current = r.session; setS(r.session); flyDish(id, r.slot, el);
        return;
      }
      const out = now.tray.filter((d): d is string => !!d && DISH_BY_ID[d].course === DISH_BY_ID[id].course)[0];
      if (!out) return; // nothing legal to replace — say nothing rather than refuse a good dish
      const r = swap(now, out, id);
      if (!r.ok) return;
      sessionRef.current = r.session; setS(r.session); flyDish(id, r.slot, el);
    }, 260);
  };

  /** the trouble has been dealt with: let the world move on */
  const clearTrouble = () => {
    setTroubleShown(false);
    setTruck((cur) => (cur === "parked" ? "away" : cur));
  };

  const tapTrayDish = (id: string) => {
    if (sentRef.current || sending) return;
    sessionRef.current = remove(sessionRef.current, id);
    setS(sessionRef.current);
    rollBeads();
  };

  // the child's own commit — never a timer, never automatic
  const sendTray = () => {
    if (sentRef.current || sending || !canSend(sessionRef.current)) return;
    const r = send(sessionRef.current);
    if (!r.ok) return;
    setSending(true);
    if (r.outcome === "intercepted") {
      // the truck cuts in before the tray gets away
      fx(() => setTruck("arriving"), 250);
      fx(() => setTruck("parked"), 250 + 700);
      fx(() => {
        sessionRef.current = r.session;
        setS(r.session);
        setSending(false);
        setTroubleShown(true);
        rollBeads();
      }, TRUCK_MS);

      return;
    }
    sentRef.current = true;
    sessionRef.current = r.session;
    setS(r.session);
    fx(() => onCleared(), DELIVER_MS);
  };

  const shelves = COURSES.map((c) => ({ course: c, ids: s.candidates.filter((id) => DISH_BY_ID[id].course === c) })).filter((x) => x.ids.length);
  const lostName = s.eventDish ? dishName(s.eventDish) : "";

  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      className={`lmp ${sending && sentRef.current ? "is-delivering" : ""} ${settled ? "is-settled" : ""} phase-${s.phase}`}
      aria-label={COPY.play.title}
    >
      {/* the school: the place the lunch goes, visible only once the menu works */}
      <button
        type="button"
        className={`lmp-school ${sendable ? "ready" : ""} ${schoolArtOk ? "has-art" : ""}`}
        aria-label={COPY.play.send}
        aria-hidden={!sendable}
        tabIndex={sendable ? 0 : -1}
        disabled={!sendable}
        onClick={sendTray}
      >
        <Art src={assets?.school} className="lmp-school-art" onState={setSchoolArtOk} fallback={<span className="lmp-school-ph" />} />
      </button>

      {/* the delivery trouble */}
      <div className={`lmp-truck st-${truck}`} aria-hidden="true">
        <Art src={assets?.truck} className="lmp-truck-art" fallback={<span className="lmp-truck-ph" />} />
      </div>
      <p className={`lmp-trouble ${troubleShown && s.eventDish ? "in" : ""}`} role="status" aria-live="polite">
        {troubleShown && s.eventDish ? COPY.play.notDelivered(lostName) : ""}
      </p>
      {/* spoken only: what touching an empty recess just did */}
      <p className="lmp-sr" role="status" aria-live="polite">{calling ? COPY.play.calling : ""}</p>

      <div className="lmp-table">
        <div
          className={`lmp-tray ${sendable ? "can-send" : ""} ${trayArtOk ? "has-art" : ""}`}
          onPointerDown={(e) => { if (sendable) swipeStartY.current = e.clientY; }}
          onPointerUp={(e) => {
            if (swipeStartY.current !== null && swipeStartY.current - e.clientY > COMMIT_SWIPE_PX) sendTray();
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
                  className={`lmp-slot s${i} ${id ? "filled" : "empty"} ${pop === i ? "pop" : ""} ${arriving === i ? "arriving" : ""} ${leavingSlot === i ? "leaving" : ""} ${id && related.has(id) ? "related" : ""}`}
                  style={{ left: `${SLOT_POS[i].x}%`, top: `${SLOT_POS[i].y}%` }}
                  aria-label={id ? COPY.play.onTray(dishName(id)) : COPY.play.emptySlot(i + 1)}
                  data-slot-dish={id ?? undefined}
                  data-slot-index={i}
                  disabled={arriving === i}
                  onClick={() => (id ? tapTrayDish(id) : callDishes())}
                >
                  {id && <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
                </button>
              );
            })}
            {MILK_FIXED && (
              <div className="lmp-slot fixed filled" style={{ left: `${MILK_POS.x}%`, top: `${MILK_POS.y}%` }} role="img" aria-label={COPY.play.milk} data-slot-dish={MILK.id}>
                <DishFace dish={MILK} src={assets?.dish?.milk} />
              </div>
            )}
          </div>
        </div>

        <GaugeRack ev={ev} shown={shown} drawn={drawn} struck={struck} />
      </div>

      {/* motion layer: the flying dish, its landing burst, and the motes going into the grooves */}
      <div className="lmp-motion" aria-hidden="true">
        {fly && (
          <div
            className={`lmp-fly ${flyGo ? "go" : ""}`}
            style={{ left: fly.x0, top: fly.y0, width: fly.w0, height: fly.w0, transform: flyGo ? `translate(${fly.x1 - fly.x0}px, ${fly.y1 - fly.y0}px) scale(${fly.w1 / fly.w0})` : "translate(0,0) scale(1.08)" }}
          >
            <DishFace dish={DISH_BY_ID[fly.id]} src={assets?.dish?.[fly.id]} />
          </div>
        )}
        {sparks.map((sp) => (
          <i key={sp.id} className="lmp-spark" style={{ left: sp.x, top: sp.y, ["--a" as string]: `${sp.a}deg` }} />
        ))}
        {motes.map((m) => (
          <i
            key={m.id}
            className={`lmp-mote ${motesGo ? "go" : ""}`}
            style={{ left: m.x0, top: m.y0, transitionDelay: `${m.delay}ms`, transform: motesGo ? `translate(${m.x1 - m.x0}px, ${m.y1 - m.y0}px) scale(0.7)` : "translate(0,0)" }}
          />
        ))}
      </div>

      {/* the serving counter: one pan per kind of dish, in serving order */}
      <div className="lmp-counter">
        {shelves.map(({ course, ids }) => (
          <div key={course} className={`lmp-shelf course-${course} ${course === "staple" && ev.complete && !ev.hasStaple ? "wanted" : ""}`}>
            {ids.map((id) => {
              const onTray = s.tray.includes(id);
              const gone = !s.available[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`lmp-cand ${onTray ? "on-tray" : ""} ${gone ? "gone" : ""} ${shake === id ? "shake" : ""} ${(calling && !onTray && !gone) || (id === s.candidates[0] && ev.filled === 0) ? "invite" : ""}`}
                  aria-label={gone ? COPY.play.dishGone(dishName(id)) : dishName(id)}
                  aria-pressed={onTray}
                  onClick={(e) => tapCandidate(id, e.currentTarget)}
                >
                  {onTray ? <span className="lmp-empty-spot" aria-hidden="true" /> : <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

/** 0..1 bead position per axis. */
function beadPositions(ev: Evaluation): Record<Axis, number> {
  return Object.fromEntries(AXES.map((a) => [a, ev.readings[a].pos])) as Record<Axis, number>;
}

/** The counting rack: four grooves carved into one wooden block, each with a
 * hollow in the middle. A bead that reaches the hollow settles into it; a bead
 * out on the shallow part keeps rocking. Nothing here is a bar or a percentage.
 * Exported for the QA harness. */
export function GaugeRack({ ev, shown, drawn, struck }: {
  ev: Evaluation; shown: Record<Axis, number>; drawn: Record<Axis, Band>; struck?: Set<Axis>;
}) {
  // while the tray is still being filled the beads only MOVE; nothing is judged,
  // so a child's first dish can never look like a mistake
  const judging = ev.complete;
  const ready = ev.filled > 0;
  return (
    <div className={`lmp-rack ${ready ? "ready" : ""}`} role="group" aria-label={COPY.play.rack}>
      {AXES.map((a) => {
        const pos = shown[a] ?? ev.readings[a].pos;
        return (
          <div
            key={a}
            className={`lmp-groove ${a}`}
            style={{
              top: `${GROOVE_Y[a]}%`,
              // the hollow is the band, mapped onto the bead's travel — never hand-typed
              ["--hollow-left" as string]: `${GROOVE.x0 + (GROOVE.x1 - GROOVE.x0) * bandOnTrack(a)[0]}%`,
              ["--hollow-width" as string]: `${(GROOVE.x1 - GROOVE.x0) * (bandOnTrack(a)[1] - bandOnTrack(a)[0])}%`,
            }}
          >
            <span className="lmp-groove-name" aria-hidden="true">{COPY.play.axis[a]}</span>
            <span className="lmp-groove-track" />
            <span className="lmp-groove-hollow" />
            <span className="lmp-groove-lip" />
            <i
              className={`lmp-bead band-${!ready ? "idle" : judging ? drawn[a] : "filling"} ${struck?.has(a) ? "struck" : ""}`}
              data-bead={a}
              style={{ left: `${GROOVE.x0 + (GROOVE.x1 - GROOVE.x0) * pos}%` }}
              role="img"
              aria-label={`${COPY.play.axis[a]}：${judging ? COPY.play.band[drawn[a]] : COPY.play.band.idle}`}
            />
          </div>
        );
      })}
    </div>
  );
}

/** A dish is a pure picture. Nothing about the rules is drawn on it. */
export function DishFace({ dish, src }: { dish: Dish; src?: string }) {
  return <Art src={src} className="lmp-dish-art" fallback={<span className={`lmp-dish course-${dish.course}`} data-dish={dish.id} aria-hidden="true" />} />;
}
