// Pure rules for the 給食 WORLD「こんだてを考える」PLAY (Ver.2 benchmark game).
// No React. Driven by LunchMenuPlay.tsx and factory/harness/gameplay-qa-v2-lunch-menu.mjs.
//
// FACT → DESIGN TRANSLATION → GAME RULE (Human decision 2026-09-20 §1).
// Facts: factory/projects/v2-lunch-menu/facts/research.md (V-A1..A9, primary sources).
//   V-A1  完全給食 = 主食 + ミルク + おかず（法令定義）; 実務の献立形 = 主食・主菜・副菜・汁物・牛乳
//         → 牛乳は固定スロット、子どもは 4 枠（主食/主菜/副菜/汁物）を組む。
//   V-A2  三色食品群は学校の食育で実際に使う枠組み → 子どもに見せる「バランス」は赤・黄・緑。
//         学校給食摂取基準（10〜11歳）: 食塩 2g 未満、脂質 20〜30%E → 「塩分・脂の上限」。
//   V-A3  「揚げ物は週◯回」「和洋の組合せ規則」は公的文書に存在しない → そのような規則は置かない。
//         愛知県「同一食品が主菜・副菜・汁物にも使用される…偏った使用にならないよう」、
//         宮城県/長野県「調理形態のバランスと組合せを工夫」 → 1 トレイ内の「食材のかぶり」「調理法のかぶり」。
//   V-A4  嗜好・残食は考慮するが「嗜好のみに左右され、栄養面の配慮が軽視されることのないように」
//         → Lv1 のスコアは栄養・構成のみ。嗜好/残食は Lv2 候補（この表には入れない）。
//   V-A5  食材が届かない時: 栄養教諭等が代替案 → 校長（場長）が決定 → 教育委員会へ報告。業者は決めない。
//         → EVENT は「ある食材が届かない」（その食材を使う料理がすべて使えなくなる）。
//         CLEAR = 子どもが献立を校長先生に見せて決めてもらう操作（見せ方は DESIGN_NEEDED）。
//   V-A8/9 予算・アレルギーは Lv1 で扱わない。
// Every rule declares the dish attributes it reads; ALL of them must be in
// VISIBLE_ATTRIBUTES (drawn on the dish itself) — no hidden answer. The
// harness checks this mechanically. Penalty VALUES remain PROVISIONAL
// (tuning), the rule SET is fact-grounded.

export type Role = "staple" | "main" | "side" | "soup" | "extra" | "milk";
export type Group = "red" | "yellow" | "green";
export type Method = "none" | "fried" | "grilled" | "simmered" | "dressed" | "soup" | "fresh";
export type Level = 0 | 1 | 2;

export interface Dish {
  id: string;
  role: Role;
  /** 三色食品群 marks (0–2 each) — V-A2 */
  groups: Record<Group, number>;
  /** 調理形態 — V-A3 */
  method: Method;
  /** 主材料 — V-A3 (愛知県「同一食品」) */
  ingredient: string;
  /** 食塩の目安 0–2 — V-A2 (2g未満) */
  salt: Level;
  /** 脂の目安 0–2 — V-A2 (脂質 20–30%E) */
  fat: Level;
}

/** Attributes the board must show on every dish (DN-03 decides HOW). */
export const VISIBLE_ATTRIBUTES = ["role", "groups", "method", "ingredient", "salt", "fat"] as const;
export type VisibleAttribute = (typeof VISIBLE_ATTRIBUTES)[number];

const D = (id: string, role: Role, r: number, y: number, g: number, method: Method, ingredient: string, salt: Level, fat: Level): Dish =>
  ({ id, role, groups: { red: r, yellow: y, green: g }, method, ingredient, salt, fat });

// Dish pool. Attribute VALUES are provisional teaching data (V-A2 notes the
// standard is applied "弾力的に"); names/appearance are DESIGN_NEEDED (DN-02).
export const MILK: Dish = D("milk", "milk", 1, 0, 0, "none", "milk", 0, 1);
export const DISHES: Dish[] = [
  D("rice", "staple", 0, 2, 0, "none", "rice", 0, 0),
  D("bread", "staple", 0, 2, 0, "none", "wheat", 1, 1),
  D("salmon", "main", 2, 0, 0, "grilled", "fish", 2, 1),
  D("karaage", "main", 2, 1, 0, "fried", "chicken", 1, 2),
  D("hamburg", "main", 2, 1, 0, "grilled", "meat", 1, 2),
  D("croquette", "main", 1, 2, 0, "fried", "potato", 1, 2),
  D("gomaae", "side", 0, 0, 2, "dressed", "spinach", 1, 0),
  D("potato_salad", "side", 0, 1, 1, "dressed", "potato", 1, 1),
  D("hijiki", "side", 1, 0, 1, "simmered", "seaweed", 1, 0),
  D("miso_soup", "soup", 1, 0, 1, "soup", "tofu", 1, 0),
  D("corn_soup", "soup", 0, 1, 1, "soup", "corn", 1, 1),
  D("kenchin", "soup", 1, 0, 2, "soup", "root_veg", 1, 1),
  D("mikan", "extra", 0, 0, 1, "fresh", "fruit", 0, 0),
];
export const DISH_BY_ID: Record<string, Dish> = Object.fromEntries([...DISHES, MILK].map((d) => [d.id, d]));

/** V-A1: milk is part of 完全給食 by definition → fixed, not a choice. */
export const MILK_FIXED = true;
export const FREE_SLOTS = 4;
/** PROVISIONAL (DN-02): which dishes a session shows. 9 = every role has ≥2 options. */
export const DEFAULT_CANDIDATES = ["rice", "bread", "salmon", "karaage", "croquette", "gomaae", "potato_salad", "miso_soup", "corn_soup"];

export type RuleId = "missing_role" | "duplicate_role" | "group_low" | "group_high" | "dup_ingredient" | "dup_method" | "salt_over" | "fat_over";

export interface Rule {
  id: RuleId;
  fact: string;
  uses: VisibleAttribute[];
  /** rule set is fact-grounded; the number is tuning */
  status: "FACT_GROUNDED_VALUE_PROVISIONAL";
  penalty: number;
}
const R = (id: RuleId, fact: string, uses: VisibleAttribute[], penalty: number): Rule =>
  ({ id, fact, uses, status: "FACT_GROUNDED_VALUE_PROVISIONAL", penalty });

export const RULES: Record<RuleId, Rule> = {
  missing_role: R("missing_role", "V-A1", ["role"], 8),
  duplicate_role: R("duplicate_role", "V-A1", ["role"], 6),
  group_low: R("group_low", "V-A2", ["groups"], 5),
  group_high: R("group_high", "V-A2", ["groups"], 2),
  dup_ingredient: R("dup_ingredient", "V-A3", ["ingredient"], 5),
  dup_method: R("dup_method", "V-A3", ["method"], 4),
  salt_over: R("salt_over", "V-A2", ["salt"], 4),
  fat_over: R("fat_over", "V-A2", ["fat"], 4),
};
export const GROUP_MIN = 2;
export const GROUP_MAX = 4;
export const SALT_MAX = 3;
export const FAT_MAX = 4;
const REQUIRED_ROLES: Role[] = ["staple", "main", "side", "soup"];
const SINGLE_ROLES: Role[] = ["staple", "main", "soup"];

export type Tray = (string | null)[];

export interface Hit {
  rule: RuleId;
  /** dishes on the tray that caused it — the board reacts on these, never with text */
  dishIds: string[];
  detail?: string;
  points: number;
}
export interface Evaluation { score: number; hits: Hit[]; filled: number; complete: boolean }

export function trayDishes(tray: Tray): Dish[] {
  const ds = tray.filter((d): d is string => !!d).map((id) => DISH_BY_ID[id]);
  return MILK_FIXED ? [...ds, MILK] : ds;
}

export function evaluate(tray: Tray): Evaluation {
  const filled = tray.filter(Boolean).length;
  const complete = filled === FREE_SLOTS;
  const hits: Hit[] = [];
  if (complete) {
    const dishes = trayDishes(tray);
    const byRole = new Map<Role, string[]>();
    for (const d of dishes) byRole.set(d.role, [...(byRole.get(d.role) ?? []), d.id]);
    for (const r of REQUIRED_ROLES) if (!byRole.has(r)) hits.push({ rule: "missing_role", dishIds: [], detail: r, points: RULES.missing_role.penalty });
    for (const r of SINGLE_ROLES) {
      const ds = byRole.get(r) ?? [];
      if (ds.length > 1) hits.push({ rule: "duplicate_role", dishIds: ds, detail: r, points: RULES.duplicate_role.penalty });
    }
    for (const g of ["red", "yellow", "green"] as Group[]) {
      const total = dishes.reduce((s, d) => s + d.groups[g], 0);
      if (total < GROUP_MIN) hits.push({ rule: "group_low", dishIds: [], detail: g, points: RULES.group_low.penalty * (GROUP_MIN - total) });
      else if (total > GROUP_MAX) hits.push({ rule: "group_high", dishIds: dishes.filter((d) => d.groups[g] > 0 && d.role !== "milk").map((d) => d.id), detail: g, points: RULES.group_high.penalty * (total - GROUP_MAX) });
    }
    const byIng = new Map<string, string[]>();
    const byMethod = new Map<Method, string[]>();
    for (const d of dishes) {
      if (d.role === "milk") continue;
      byIng.set(d.ingredient, [...(byIng.get(d.ingredient) ?? []), d.id]);
      if (d.method !== "none") byMethod.set(d.method, [...(byMethod.get(d.method) ?? []), d.id]);
    }
    for (const [ing, ds] of byIng) if (ds.length > 1) hits.push({ rule: "dup_ingredient", dishIds: ds, detail: ing, points: RULES.dup_ingredient.penalty });
    for (const [m, ds] of byMethod) if (ds.length > 1) hits.push({ rule: "dup_method", dishIds: ds, detail: m, points: RULES.dup_method.penalty });
    const salt = dishes.reduce((s, d) => s + d.salt, 0);
    if (salt > SALT_MAX) hits.push({ rule: "salt_over", dishIds: dishes.filter((d) => d.salt >= 1 && d.role !== "milk").map((d) => d.id), points: RULES.salt_over.penalty * (salt - SALT_MAX) });
    const fat = dishes.reduce((s, d) => s + d.fat, 0);
    if (fat > FAT_MAX) hits.push({ rule: "fat_over", dishIds: dishes.filter((d) => d.fat >= 1 && d.role !== "milk").map((d) => d.id), points: RULES.fat_over.penalty * (fat - FAT_MAX) });
  }
  const score = complete ? Math.max(0, Math.min(100, 100 - hits.reduce((s, h) => s + h.points, 0))) : 0;
  return { score, hits, filled, complete };
}

// ---------------------------------------------------------------- session

export type Phase = "build" | "improve" | "rebuild" | "cleared";

export interface Session {
  candidates: string[];
  tray: Tray;
  /** false = the EVENT made this dish unavailable (its ingredient did not arrive) */
  available: Record<string, boolean>;
  phase: Phase;
  swapsAfterResult: number;
  firstScore: number | null;
  preEventScore: number | null;
  /** ingredient that failed to arrive (V-A5), null until the EVENT */
  eventIngredient: string | null;
  committedScore: number | null;
}

export function newSession(candidates: string[] = DEFAULT_CANDIDATES): Session {
  return {
    candidates: [...candidates],
    tray: Array(FREE_SLOTS).fill(null),
    available: Object.fromEntries(candidates.map((c) => [c, true])),
    phase: "build",
    swapsAfterResult: 0,
    firstScore: null,
    preEventScore: null,
    eventIngredient: null,
    committedScore: null,
  };
}

export type PlaceResult =
  | { ok: true; session: Session; slot: number }
  | { ok: false; reason: "unavailable" | "full" | "not_candidate" | "on_tray" | "cleared" };

export function place(s: Session, dishId: string): PlaceResult {
  if (s.phase === "cleared") return { ok: false, reason: "cleared" };
  if (!s.candidates.includes(dishId)) return { ok: false, reason: "not_candidate" };
  if (!s.available[dishId]) return { ok: false, reason: "unavailable" };
  if (s.tray.includes(dishId)) return { ok: false, reason: "on_tray" };
  const slot = s.tray.indexOf(null);
  if (slot < 0) return { ok: false, reason: "full" };
  const tray = [...s.tray];
  tray[slot] = dishId;
  const next: Session = { ...s, tray };
  if (evaluate(tray).complete && next.firstScore === null) {
    next.firstScore = evaluate(tray).score;
    next.phase = "improve";
  }
  return { ok: true, session: next, slot };
}

export function remove(s: Session, dishId: string): Session {
  if (s.phase === "cleared") return s;
  const slot = s.tray.indexOf(dishId);
  if (slot < 0) return s;
  const tray = [...s.tray];
  tray[slot] = null;
  return { ...s, tray, swapsAfterResult: s.firstScore !== null ? s.swapsAfterResult + 1 : 0 };
}

/** Human decision §2: EVENT only after the first full tray was seen AND the
 * child re-arranged at least once AND the tray is full again. */
export function eventReady(s: Session): boolean {
  return s.phase === "improve" && s.swapsAfterResult >= 1 && evaluate(s.tray).complete;
}

/** V-A5: an ingredient fails to arrive. Deterministic for the first prototype:
 * the main dish's ingredient (the most plausible delivery problem). Every
 * candidate using that ingredient becomes unavailable. */
export function pickEventIngredient(s: Session): string | null {
  const onTray = s.tray.filter((d): d is string => !!d).map((id) => DISH_BY_ID[id]);
  const main = onTray.find((d) => d.role === "main");
  return main?.ingredient ?? onTray[0]?.ingredient ?? null;
}

export function fireEvent(s: Session, ingredient: string | null = pickEventIngredient(s)): Session {
  if (!ingredient || !eventReady(s)) return s;
  const affected = s.candidates.filter((c) => DISH_BY_ID[c].ingredient === ingredient);
  if (!affected.some((c) => s.tray.includes(c))) return s; // must remove something in use
  const tray = s.tray.map((d) => (d && affected.includes(d) ? null : d));
  const available = { ...s.available };
  for (const c of affected) available[c] = false;
  return { ...s, tray, available, phase: "rebuild", preEventScore: evaluate(s.tray).score, eventIngredient: ingredient };
}

/** Human decision §3: CLEAR is the child's own commit (shown to the principal,
 * V-A5). Allowed once the EVENT happened and the tray is full of available
 * dishes. No score threshold. */
export function canCommit(s: Session): boolean {
  if (s.phase !== "rebuild") return false;
  return evaluate(s.tray).complete && s.tray.every((d) => d && s.available[d]);
}

export function commit(s: Session): Session {
  if (!canCommit(s)) return s;
  return { ...s, phase: "cleared", committedScore: evaluate(s.tray).score };
}

// ---------------------------------------------------------------- analysis (QA)

export function enumerateTrays(candidates: string[]): { tray: string[]; score: number }[] {
  const out: { tray: string[]; score: number }[] = [];
  const pick = (start: number, acc: string[]) => {
    if (acc.length === FREE_SLOTS) { out.push({ tray: [...acc], score: evaluate(acc).score }); return; }
    for (let i = start; i < candidates.length; i++) pick(i + 1, [...acc, candidates[i]]);
  };
  pick(0, []);
  return out;
}
