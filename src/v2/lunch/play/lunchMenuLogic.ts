// Pure rules for the 給食 WORLD「こんだてを考える」PLAY (Ver.2 benchmark game).
// No React. Driven by the UI (LunchMenuPlay.tsx) and by
// factory/harness/gameplay-qa-v2-lunch-menu.mjs.
//
// Design contract (factory/projects/v2-lunch-menu/experience-design-proposal.md,
// Human decision 2026-09-20): score is an improvement-type 0–100 number with
// many valid high solutions; dish attributes are VISIBLE on the board (never a
// hidden answer); the EVENT removes an ingredient as a CONSTRAINT, not a
// penalty; CLEAR is the child's own commit action, never a score threshold.
//
// FACT → DESIGN TRANSLATION → GAME RULE: every rule below carries a `fact`
// reference (V-A1..A9 in factory/projects/v2-lunch-menu/facts/research.md) and
// a `status`. PROVISIONAL rules/values are placeholders that must be retuned
// or removed once the fact check lands; none of them are approved.

export type Role = "staple" | "main" | "side" | "soup" | "extra";
export type Group = "red" | "yellow" | "green";

export interface Dish {
  id: string;
  /** NEEDS_VALIDATION V-A1: which slot of the standard meal this dish fills */
  role: Role;
  /** NEEDS_VALIDATION V-A2: 三色食品群 contribution (0–2 each, PROVISIONAL) */
  groups: Record<Group, number>;
  /** NEEDS_VALIDATION V-A3: cooking/style tags used by rules (PROVISIONAL) */
  tags: ("fried" | "japanese" | "western")[];
}

// PROVISIONAL dish pool. Names are NOT display copy (display is DESIGN_NEEDED);
// they exist so QA logs are readable. Final pool/composition: after V-A1..A4.
export const DISHES: Dish[] = [
  { id: "rice", role: "staple", groups: { red: 0, yellow: 2, green: 0 }, tags: ["japanese"] },
  { id: "bread", role: "staple", groups: { red: 0, yellow: 2, green: 0 }, tags: ["western"] },
  { id: "salmon", role: "main", groups: { red: 2, yellow: 0, green: 0 }, tags: ["japanese"] },
  { id: "karaage", role: "main", groups: { red: 2, yellow: 1, green: 0 }, tags: ["fried"] },
  { id: "hamburg", role: "main", groups: { red: 2, yellow: 1, green: 0 }, tags: ["western"] },
  { id: "gomaae", role: "side", groups: { red: 0, yellow: 0, green: 2 }, tags: ["japanese"] },
  { id: "potato_salad", role: "side", groups: { red: 0, yellow: 1, green: 1 }, tags: ["western"] },
  { id: "hijiki", role: "side", groups: { red: 1, yellow: 0, green: 1 }, tags: ["japanese"] },
  { id: "miso_soup", role: "soup", groups: { red: 1, yellow: 0, green: 1 }, tags: ["japanese"] },
  { id: "corn_soup", role: "soup", groups: { red: 0, yellow: 1, green: 1 }, tags: ["western"] },
  { id: "mikan", role: "extra", groups: { red: 0, yellow: 0, green: 1 }, tags: [] },
  { id: "pudding", role: "extra", groups: { red: 0, yellow: 1, green: 0 }, tags: ["western"] },
];
export const DISH_BY_ID: Record<string, Dish> = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const TRAY_SIZE = 5;
/** PROVISIONAL: which 8 of the pool a session shows (design decides the final set). */
export const DEFAULT_CANDIDATES = ["rice", "bread", "salmon", "karaage", "gomaae", "potato_salad", "miso_soup", "corn_soup"];

export type RuleId = "missing_role" | "duplicate_role" | "group_low" | "group_high" | "fried_stack" | "style_mismatch";

export interface Rule {
  id: RuleId;
  /** fact reference in factory/projects/v2-lunch-menu/facts/research.md */
  fact: string;
  status: "PROVISIONAL";
  penalty: number;
}

// Every value here is a placeholder awaiting V-A1..A4. Keep the table small
// and flat so the Design Owner / fact check can retune without touching code.
export const RULES: Record<RuleId, Rule> = {
  missing_role: { id: "missing_role", fact: "V-A1", status: "PROVISIONAL", penalty: 8 },
  duplicate_role: { id: "duplicate_role", fact: "V-A1", status: "PROVISIONAL", penalty: 6 },
  group_low: { id: "group_low", fact: "V-A2", status: "PROVISIONAL", penalty: 5 },
  group_high: { id: "group_high", fact: "V-A2", status: "PROVISIONAL", penalty: 2 },
  fried_stack: { id: "fried_stack", fact: "V-A3", status: "PROVISIONAL", penalty: 4 },
  style_mismatch: { id: "style_mismatch", fact: "V-A3", status: "PROVISIONAL", penalty: 3 },
};
/** PROVISIONAL (V-A2): each colour group wants at least this many marks... */
export const GROUP_MIN = 2;
/** ...and more than this is "too much of one thing". */
export const GROUP_MAX = 4;
const REQUIRED_ROLES: Role[] = ["staple", "main", "side", "soup"];

export type Tray = (string | null)[];

export interface Hit {
  rule: RuleId;
  /** dishes on the tray that caused it (for the board to react to — never text) */
  dishIds: string[];
  /** extra detail (missing role / group name) for QA logs */
  detail?: string;
  points: number;
}

export interface Evaluation {
  score: number;
  hits: Hit[];
  filled: number;
  complete: boolean;
}

export function evaluate(tray: Tray): Evaluation {
  const ids = tray.filter((d): d is string => !!d);
  const dishes = ids.map((id) => DISH_BY_ID[id]);
  const hits: Hit[] = [];
  const complete = ids.length === TRAY_SIZE;

  if (complete) {
    const byRole = new Map<Role, string[]>();
    for (const d of dishes) byRole.set(d.role, [...(byRole.get(d.role) ?? []), d.id]);
    for (const r of REQUIRED_ROLES) {
      if (!byRole.has(r)) hits.push({ rule: "missing_role", dishIds: [], detail: r, points: RULES.missing_role.penalty });
    }
    for (const [r, ds] of byRole) {
      if (r !== "side" && r !== "extra" && ds.length > 1) {
        hits.push({ rule: "duplicate_role", dishIds: ds, detail: r, points: RULES.duplicate_role.penalty });
      }
    }
    for (const g of ["red", "yellow", "green"] as Group[]) {
      const total = dishes.reduce((s, d) => s + d.groups[g], 0);
      if (total < GROUP_MIN) {
        hits.push({ rule: "group_low", dishIds: [], detail: g, points: RULES.group_low.penalty * (GROUP_MIN - total) });
      } else if (total > GROUP_MAX) {
        hits.push({ rule: "group_high", dishIds: dishes.filter((d) => d.groups[g] > 0).map((d) => d.id), detail: g, points: RULES.group_high.penalty * (total - GROUP_MAX) });
      }
    }
    const fried = dishes.filter((d) => d.tags.includes("fried")).map((d) => d.id);
    if (fried.length > 1) hits.push({ rule: "fried_stack", dishIds: fried, points: RULES.fried_stack.penalty });
    const staple = dishes.find((d) => d.role === "staple");
    const soup = dishes.find((d) => d.role === "soup");
    if (staple && soup) {
      const s1 = staple.tags.find((t) => t === "japanese" || t === "western");
      const s2 = soup.tags.find((t) => t === "japanese" || t === "western");
      if (s1 && s2 && s1 !== s2) hits.push({ rule: "style_mismatch", dishIds: [staple.id, soup.id], points: RULES.style_mismatch.penalty });
    }
  }

  const score = complete ? Math.max(0, Math.min(100, 100 - hits.reduce((s, h) => s + h.points, 0))) : 0;
  return { score, hits, filled: ids.length, complete };
}

// ---------------------------------------------------------------- session

export type Phase = "build" | "improve" | "event" | "rebuild" | "cleared";

export interface Session {
  candidates: string[];
  tray: Tray;
  /** false = the EVENT made this ingredient unavailable (constraint, not penalty) */
  available: Record<string, boolean>;
  phase: Phase;
  /** how many swaps the child made after first seeing a complete tray */
  swapsAfterResult: number;
  /** score of the first complete tray (for the QA "improvement exists" check) */
  firstScore: number | null;
  /** score right before the EVENT fired */
  preEventScore: number | null;
  /** dish removed by the EVENT (null until it fires) */
  eventDish: string | null;
  committedScore: number | null;
}

export function newSession(candidates: string[] = DEFAULT_CANDIDATES): Session {
  return {
    candidates: [...candidates],
    tray: Array(TRAY_SIZE).fill(null),
    available: Object.fromEntries(candidates.map((c) => [c, true])),
    phase: "build",
    swapsAfterResult: 0,
    firstScore: null,
    preEventScore: null,
    eventDish: null,
    committedScore: null,
  };
}

export type PlaceResult = { ok: true; session: Session; slot: number } | { ok: false; reason: "unavailable" | "full" | "not_candidate" | "on_tray" };

export function place(s: Session, dishId: string): PlaceResult {
  if (!s.candidates.includes(dishId)) return { ok: false, reason: "not_candidate" };
  if (!s.available[dishId]) return { ok: false, reason: "unavailable" };
  if (s.tray.includes(dishId)) return { ok: false, reason: "on_tray" };
  const slot = s.tray.indexOf(null);
  if (slot < 0) return { ok: false, reason: "full" };
  const tray = [...s.tray];
  tray[slot] = dishId;
  return { ok: true, session: afterTrayChange({ ...s, tray }), slot };
}

export function remove(s: Session, dishId: string): Session {
  const slot = s.tray.indexOf(dishId);
  if (slot < 0) return s;
  const tray = [...s.tray];
  tray[slot] = null;
  const next = { ...s, tray };
  // a removal after the first result counts as the child "組み替えた"
  if (s.firstScore !== null) next.swapsAfterResult = s.swapsAfterResult + 1;
  return next;
}

function afterTrayChange(s: Session): Session {
  const ev = evaluate(s.tray);
  const next = { ...s };
  if (ev.complete && next.firstScore === null) {
    next.firstScore = ev.score;
    next.phase = "improve";
  }
  return next;
}

/** Human decision 2026-09-20 §2: the EVENT fires only after the child built a
 * first full tray, saw the result, and re-arranged at least once. The UI asks
 * this after every change and fires the event at its own (designed) moment. */
export function eventReady(s: Session): boolean {
  return s.phase === "improve" && s.swapsAfterResult >= 1 && evaluate(s.tray).complete;
}

/** Which dish the EVENT takes away: PROVISIONAL = the main dish currently on
 * the tray (a delivery problem with the protein is the most plausible
 * V-A5 scenario; final choice after the fact check). Deterministic on purpose
 * for the first prototype; randomisation is a later AGAIN lever. */
export function pickEventDish(s: Session): string | null {
  const onTray = s.tray.filter((d): d is string => !!d).map((id) => DISH_BY_ID[id]);
  const main = onTray.find((d) => d.role === "main");
  return main?.id ?? onTray[0]?.id ?? null;
}

export function fireEvent(s: Session, dishId: string | null = pickEventDish(s)): Session {
  if (!dishId || s.phase !== "improve") return s;
  const tray = s.tray.map((d) => (d === dishId ? null : d));
  return {
    ...s,
    tray,
    available: { ...s.available, [dishId]: false },
    phase: "rebuild",
    preEventScore: evaluate(s.tray).score,
    eventDish: dishId,
  };
}

/** The child may commit ("これでいく") once the EVENT has happened and the tray
 * is full of available dishes. No score threshold, by Human decision §3. */
export function canCommit(s: Session): boolean {
  if (s.phase !== "rebuild") return false;
  const ev = evaluate(s.tray);
  return ev.complete && s.tray.every((d) => d && s.available[d]);
}

export function commit(s: Session): Session {
  if (!canCommit(s)) return s;
  return { ...s, phase: "cleared", committedScore: evaluate(s.tray).score };
}

// ---------------------------------------------------------------- analysis (QA)

/** All full trays from a candidate list, with scores. Used by the harness to
 * prove "many valid high solutions" and "no single dominant answer". */
export function enumerateTrays(candidates: string[]): { tray: string[]; score: number }[] {
  const out: { tray: string[]; score: number }[] = [];
  const n = candidates.length;
  const pick = (start: number, acc: string[]) => {
    if (acc.length === TRAY_SIZE) {
      out.push({ tray: [...acc], score: evaluate(acc).score });
      return;
    }
    for (let i = start; i < n; i++) pick(i + 1, [...acc, candidates[i]]);
  };
  pick(0, []);
  return out;
}
