// 給食 WORLD「こんだてを考える」PLAY — board component.
// Rules live in lunchMenuLogic.ts; this file is interaction + reaction plumbing.
//
// Experience spec (Human/GPT 2026-09-21) + GPT Visual Review (2026-09-21):
// no total score for the child, no explanation up front. Choosing a dish is
// itself the play: tap → the dish lifts off the counter, flies onto the tray,
// lands with a pop and a small burst. After the first full tray the status
// layer appears as things in the world, not as a dashboard: three baskets on
// the table that the placed dishes fill with bits (bits fly from each dish
// into its basket, so the dish→basket relation is learnt by watching, not by
// knowing 三色食品群), and rule cues that happen ON the tray (salt sprinkling,
// an oily sheen, a bit hopping between two dishes that double up, a ghost
// ring for a missing kind). Dishes related to a problem wobble gently (never
// all, never exactly one as "the answer"). EVENT after the child has seen a
// change they made; CLEAR = sending the finished lunch off to the school.
// Dish art is a pure visual asset — game attributes live in the UI layer.
// A dish already on the tray is shown on the counter as a used spot (ring +
// small check), a visual language distinct from EVENT-unavailable (grey +
// coral badge + shake).
//
// TEMP_IMPLEMENTATION_ONLY where no approved art exists: placeholder shapes,
// motion curves and the exact cue forms (DN-04) await the Design Owner.
// Strings come only from ../copy.ts. Approved art arrives via `assets`; a
// missing or broken file falls back to the placeholder at render time.
import { useEffect, useRef, useState } from "react";
import "./lunchMenuPlay.css";
import { COPY } from "../copy";
import {
  DISH_BY_ID, FREE_SLOTS, GROUP_MAX, GROUP_MIN, MILK, MILK_FIXED, RULES, canCommit, commit, evaluate, eventReady, fireEvent, newSession, place, relatedDishes, relatedSet, remove, trayDishes,
  type Dish, type Evaluation, type Group, type Hit, type Role, type RuleId, type Session, type Tray,
} from "./lunchMenuLogic";

export interface LunchMenuPlayProps {
  onCleared: (score: number) => void;
  assets?: { tray?: string; dish?: Record<string, string>; truck?: string; school?: string; basket?: Partial<Record<Group, string>> };
}

const EVENT_DELAY_MS = 1400;
const DELIVER_MS = 1600;
const COMMIT_SWIPE_PX = 56;
const FLY_MS = 380;
const GROUPS: Group[] = ["red", "yellow", "green"];
/** counter order = real serving order (主食 → 主菜 → 副菜 → 汁物), V-A1 */
const COUNTER_ROLES: Role[] = ["staple", "main", "side", "soup"];
/** slot centres in % of the tray box (measured from the tray art recesses);
 * shared by the slots and the on-tray cue layer so cues sit on the dishes */
const SLOT_POS: { x: number; y: number }[] = [{ x: 22.5, y: 23 }, { x: 50, y: 23.5 }, { x: 21, y: 60 }, { x: 50, y: 61 }];
const MILK_POS = { x: 77, y: 43 };
/** free tray surface (below the milk cup) where a "something is missing" ghost can sit */
const GHOST_POS = { x: 77, y: 80 };
/** salt specks fall in a scattered order, not left-to-right */
const SALT_DELAYS = [0.9, 0.2, 1.25, 0.5, 1.05, 0];
/** where bits rest inside a basket (% of the basket box); index ≥ GROUP_MAX spills over the rim */
const BASKET_SPOTS: { x: number; y: number }[] = [
  { x: 30, y: 70 }, { x: 54, y: 74 }, { x: 72, y: 66 }, { x: 44, y: 54 }, // inside the basket
  { x: 60, y: 22 }, { x: 34, y: 16 }, { x: 78, y: 12 }, { x: 50, y: 2 }, { x: 20, y: -2 }, { x: 86, y: -6 }, // spilling over the rim
];

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
/** bits per basket for a tray (milk included, as in evaluate()) */
function groupCounts(tray: Tray): Record<Group, number> {
  const c: Record<Group, number> = { red: 0, yellow: 0, green: 0 };
  for (const d of trayDishes(tray)) for (const g of GROUPS) c[g] += d.groups[g];
  return c;
}

interface Grain { id: number; g: Group; x0: number; y0: number; x1: number; y1: number; delay: number }
interface Fly { seq: number; id: string; x0: number; y0: number; w0: number; x1: number; y1: number; w1: number }
interface Spark { id: number; x: number; y: number; a: number }

export default function LunchMenuPlay({ onCleared, assets }: LunchMenuPlayProps) {
  const [s, setS] = useState<Session>(() => newSession());
  const [shake, setShake] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const [arriving, setArriving] = useState<number | null>(null);
  const [fly, setFly] = useState<Fly | null>(null);
  const [flyGo, setFlyGo] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
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
  const prevTray = useRef<Tray>(s.tray);
  const basketsShown = useRef(false);
  const seq = useRef(0);
  const sessionRef = useRef<Session>(s);
  sessionRef.current = s;
  const [trayArtOk, setTrayArtOk] = useState(false);
  const [schoolArtOk, setSchoolArtOk] = useState(false);

  const ev = evaluate(s.tray);
  const related = relatedSet(ev.hits);
  const showStatus = s.firstScore !== null; // spec §3: only after the first full tray
  const missingRoles = new Set(ev.hits.filter((h) => h.rule === "missing_role").map((h) => h.detail as Role));

  const fx = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { fxTimers.current.delete(t); fn(); }, ms);
    fxTimers.current.add(t);
  };
  const rootRect = () => rootRef.current?.getBoundingClientRect();

  // dish → basket bits: bits leave the given dishes and land in their baskets
  // (learning by motion, spec §3). Called for every dish on the first full
  // tray, then for each dish the child adds.
  const launchGrains = (dishIds: string[]) => {
    const root = rootRef.current, rb = rootRect();
    if (!root || !rb) return;
    const out: Grain[] = [];
    dishIds.forEach((id, si) => {
      const slot = root.querySelector<HTMLElement>(`[data-slot-dish="${id}"]`);
      if (!slot) return;
      const sb = slot.getBoundingClientRect();
      for (const g of GROUPS) {
        const basket = root.querySelector<HTMLElement>(`[data-group="${g}"]`);
        if (!basket) continue;
        const mb = basket.getBoundingClientRect();
        for (let i = 0; i < DISH_BY_ID[id].groups[g]; i++) {
          out.push({
            id: ++seq.current, g,
            x0: sb.left - rb.left + sb.width / 2 + (i - 0.5) * 10, y0: sb.top - rb.top + sb.height / 2,
            x1: mb.left - rb.left + mb.width * 0.5 + (i - 0.5) * 8, y1: mb.top - rb.top + mb.height * 0.55,
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

  // status-layer reaction: which cues improved / worsened since the last full
  // tray, and which dish just arrived (its bits fly into the baskets)
  useEffect(() => {
    const before = prevTray.current;
    prevTray.current = s.tray;
    const added = s.tray.filter((d): d is string => !!d && !before.includes(d));
    if (ev.complete) {
      const d = delta(lastEval.current, ev);
      lastEval.current = ev;
      if (Object.keys(d).length) { setChanged(d); fx(() => setChanged({}), 900); }
    }
    if (!showStatus) return;
    if (!basketsShown.current) {
      basketsShown.current = true;
      // first full tray: the baskets slide in first (their entrance moves them), then every dish sends its bits
      fx(() => launchGrains([...s.tray.filter((d): d is string => !!d), ...(MILK_FIXED ? [MILK.id] : [])]), FLY_MS + 360);
    } else if (added.length) {
      fx(() => launchGrains(added), FLY_MS + 40); // after the flying dish has landed
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

  // the micro loop: pick-up → fly to the tray → pop → small burst
  const tapCandidate = (id: string, el: HTMLElement) => {
    if (committedRef.current) return;
    const r = place(sessionRef.current, id);
    if (!r.ok) { bump(id); if (r.reason === "unavailable") setTruck("arrive"); return; }
    sessionRef.current = r.session;
    setS(r.session);
    const rb = rootRect();
    const from = (el.querySelector(".lmp-dish-art, .lmp-dish") ?? el).getBoundingClientRect();
    const to = rootRef.current?.querySelector<HTMLElement>(`[data-slot-index="${r.slot}"]`)?.getBoundingClientRect();
    if (rb && to) {
      const mine = ++seq.current; // a later tap replaces the clone; only the latest flight clears it
      setFly({ seq: mine, id, x0: from.left - rb.left, y0: from.top - rb.top, w0: from.width, x1: to.left - rb.left, y1: to.top - rb.top, w1: to.width });
      setFlyGo(false);
      setArriving(r.slot);
      fx(() => setFlyGo(true), 20);
      fx(() => {
        setFly((cur) => (cur && cur.seq === mine ? null : cur));
        setArriving((cur) => (cur === r.slot ? null : cur));
        setPop(r.slot);
        const cx = to.left - rb.left + to.width / 2, cy = to.top - rb.top + to.height / 2;
        setSparks(Array.from({ length: 7 }, (_, i) => ({ id: ++seq.current, x: cx, y: cy, a: (i / 7) * 360 + 15 })));
        fx(() => setSparks([]), 600);
        fx(() => setPop((cur) => (cur === r.slot ? null : cur)), 380);
      }, FLY_MS);
    } else {
      setPop(r.slot);
      fx(() => setPop((cur) => (cur === r.slot ? null : cur)), 380);
    }
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
  const shelves = COUNTER_ROLES.map((role) => ({ role, ids: s.candidates.filter((id) => DISH_BY_ID[id].role === role) })).filter((x) => x.ids.length);

  return (
    <section ref={rootRef} className={`lmp ${delivering ? "is-delivering" : ""} phase-${s.phase} ${showStatus ? "has-status" : ""}`} aria-label={COPY.play.title}>
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

      {/* the table: tray (visual priority #1) with the baskets in front of it */}
      <div className="lmp-table">
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
          {/* status layer — only after the first full tray (spec §3): cues on the tray (some under the
              dishes, some over them) + the baskets on the table. Rendered before the slots so the
              layer can stack around them. */}
          {showStatus && <StatusLayer ev={ev} tray={s.tray} changed={changed} basketArt={assets?.basket} />}
          <div className="lmp-slots">
            {Array.from({ length: FREE_SLOTS }).map((_, i) => {
              const id = s.tray[i];
              return (
                <button
                  key={i}
                  type="button"
                  className={`lmp-slot s${i} ${id ? "filled" : "empty"} ${pop === i ? "pop" : ""} ${arriving === i ? "arriving" : ""} ${showStatus && id && related.has(id) ? "related" : ""}`}
                  style={{ left: `${SLOT_POS[i].x}%`, top: `${SLOT_POS[i].y}%` }}
                  aria-label={id ? dishName(id) : COPY.play.slotEmpty(i + 1)}
                  data-slot-dish={id ?? undefined}
                  data-slot-index={i}
                  disabled={!id}
                  onClick={() => id && tapTrayDish(id)}
                >
                  {id && <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
                </button>
              );
            })}
            {MILK_FIXED && (
              <div className="lmp-slot fixed filled" style={{ left: `${MILK_POS.x}%`, top: `${MILK_POS.y}%` }} role="img" aria-label={COPY.play.milkSlot} data-slot-dish={MILK.id}>
                <DishFace dish={MILK} src={assets?.dish?.milk} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* transient motion: the flying dish, bits in flight, landing sparks */}
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
        {grains.map((gr) => (
          <i
            key={gr.id}
            className={`lmp-grain ${gr.g} ${flying ? "go" : ""}`}
            style={{ left: gr.x0, top: gr.y0, transitionDelay: `${gr.delay}ms`, transform: flying ? `translate(${gr.x1 - gr.x0}px, ${gr.y1 - gr.y0}px) scale(0.85)` : "translate(0,0)" }}
          />
        ))}
      </div>

      {/* the counter — dishes in serving order, scrolls sideways (visual priority #2) */}
      <div className="lmp-counter">
        {shelves.map(({ role, ids }) => (
          <div key={role} className={`lmp-shelf role-${role} ${showStatus && missingRoles.has(role) ? "wanted" : ""}`} data-role={role}>
            {ids.map((id) => {
              const onTray = s.tray.includes(id);
              const unavailable = !s.available[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`lmp-cand ${onTray ? "on-tray" : ""} ${unavailable ? "unavailable" : ""} ${shake === id ? "shake" : ""} ${id === s.candidates[0] && ev.filled === 0 ? "invite" : ""}`}
                  aria-label={unavailable ? COPY.play.dishUnavailable(dishName(id)) : dishName(id)}
                  aria-pressed={onTray}
                  disabled={onTray}
                  onClick={(e) => tapCandidate(id, e.currentTarget)}
                >
                  {onTray ? <span className="lmp-used" aria-hidden="true"><i className="lmp-used-ring" /><i className="lmp-used-check" /></span> : <DishFace dish={DISH_BY_ID[id]} src={assets?.dish?.[id]} />}
                  {unavailable && <span className="lmp-badge" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
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

const slotPos = (tray: Tray, id: string) => {
  const i = tray.indexOf(id);
  return i >= 0 ? SLOT_POS[i] : id === MILK.id ? MILK_POS : GHOST_POS;
};

/** The judgment cues, translated from the fact-based rules into things in the
 * world: three baskets on the table that fill with the bits the dishes send
 * (sparse = たりない, spilling over = おおすぎ) and cues that happen on the tray
 * itself — salt sprinkling on the salty dishes, an oily sheen under the fatty
 * ones, a bit hopping between two dishes that double up (same ingredient /
 * same cooking / same kind), a ghost ring where a kind is missing. Every
 * RuleId has a cue (harness-checked); `changed` pulses a cue that just
 * improved or worsened. Form: DN-04 (TEMP until the Design Owner overrides). */
export function StatusLayer({ ev, tray, changed, basketArt }: { ev: Evaluation; tray: Tray; changed: Delta; basketArt?: Partial<Record<Group, string>> }) {
  const counts = groupCounts(tray);
  const groupState = (g: Group): "ok" | "low" | "high" => {
    if (ev.hits.some((h) => h.rule === "group_low" && h.detail === g)) return "low";
    if (ev.hits.some((h) => h.rule === "group_high" && h.detail === g)) return "high";
    return "ok";
  };
  const groupCue = (g: Group) => (groupState(g) === "ok" ? "" : groupState(g) === "low" ? "group_low" : "group_high");
  const trayHits: Hit[] = ev.hits.filter((h) => h.rule !== "group_low" && h.rule !== "group_high");
  return (
    <div className={`lmp-status ${ev.complete ? "" : "pending"}`} role="group" aria-label={COPY.play.status.title} data-tray={tray.join(",")}>
      {/* cues that happen on the tray, at the dishes they concern */}
      <div className="lmp-fx">
        {/* under the dishes: the oil puddle leaking from under the fatty dish's plate */}
        {trayHits.filter((h) => h.rule === "fat_over").map((h, i) => {
          const p = relatedDishes(h)[0] ? slotPos(tray, relatedDishes(h)[0]) : GHOST_POS;
          return <b key={`puddle-${i}`} className="lmp-puddle" aria-hidden="true" style={{ left: `${p.x}%`, top: `${p.y}%` }} />;
        })}
        {trayHits.map((h, i) => {
          const ids = relatedDishes(h);
          const a = ids[0] ? slotPos(tray, ids[0]) : GHOST_POS;
          const b = ids[1] ? slotPos(tray, ids[1]) : a;
          const pair = h.rule === "dup_ingredient" || h.rule === "dup_method" || h.rule === "duplicate_role";
          return (
            <i
              key={`${h.rule}-${h.detail ?? ""}-${i}`}
              className={`lmp-mark ${h.rule} ${pair && ids.length > 1 ? "hop" : ""} ${changed[h.rule] ? `chg-${changed[h.rule]}` : ""}`}
              data-cue={h.rule}
              style={{ left: `${a.x}%`, top: `${a.y}%`, ["--x0" as string]: `${a.x}%`, ["--y0" as string]: `${a.y}%`, ["--x1" as string]: `${b.x}%`, ["--y1" as string]: `${b.y}%` }}
              role="img"
              aria-label={COPY.play.status.rule[h.rule]}
            >
              {h.rule === "salt_over" && SALT_DELAYS.map((d, k) => <b key={k} className="lmp-salt" style={{ ["--k" as string]: k, ["--d" as string]: `${d}s` }} />)}
              {h.rule === "fat_over" && Array.from({ length: 2 }, (_, k) => <b key={k} className="lmp-drip" style={{ ["--k" as string]: k }} />)}
            </i>
          );
        })}
      </div>
      {/* the baskets on the table (三色食品群 without the words: what flew where) */}
      <div className="lmp-baskets">
        {GROUPS.map((g) => {
          const st = groupState(g);
          const n = counts[g];
          return (
            <i
              key={g}
              className={`lmp-basket ${g} is-${st} ${changed[`group:${g}`] ? `chg-${changed[`group:${g}`]}` : ""}`}
              data-cue={groupCue(g) || `group:${g}`}
              data-group={g}
              data-count={n}
              role="img"
              aria-label={`${COPY.play.status.group[g]} ${COPY.play.status.groupState[st]}`}
            >
              <Art src={basketArt?.[g]} className="lmp-basket-art" fallback={<b className="lmp-ph lmp-basket-ph" />} />
              <b className="lmp-bits">
                {Array.from({ length: Math.min(n, BASKET_SPOTS.length) }, (_, k) => (
                  <b key={k} className={`lmp-bit ${k >= GROUP_MAX ? "over" : ""}`} style={{ left: `${BASKET_SPOTS[k].x}%`, top: `${BASKET_SPOTS[k].y}%` }} />
                ))}
              </b>
              {n < GROUP_MIN && ev.complete && <b className="lmp-basket-echo" />}
            </i>
          );
        })}
      </div>
    </div>
  );
}
