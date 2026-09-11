// Pure rules for the ward nurse observation Q1 (gameType: observe_care), rebuilt per
// factory/projects/legacy-observe-care (GAME_TRANSLATION_REBUILD, t1-mark-and-share-once, design
// review r2 PASS 86). Mirrors factory/projects/legacy-observe-care/design/design-sim.mjs exactly --
// EVIDENCE_ITEMS/newSession/sessionWin are structurally identical. Keep the two in sync.
//
// The only real judgment this game asks for: of 3 core evidence items (食事/meal, 水分/fluid,
// 排尿/urine intake -- the dehydration/malnutrition observation trio research.md documents), each
// independently and randomly shows a concerning or not-concerning finding this session. The child
// reads each item's actual observation and marks it accordingly, then always shares the reading with
// the team (sharing is never optional -- research.md: 経過観察を選ぶ場合も情報共有は必須). The game
// never asks for or certifies a named diagnosis, and never derives or certifies a "correct"
// escalate-vs-watch action -- design review r1 found the first version of this game invented an
// ungrounded "2 of 3 concerning -> report" threshold and certified it as professionally correct, a
// new form of the same overclaim family other legacy rebuilds this session hit (see r1's BLOCKER
// findings). What happens after sharing (report to the doctor, or continue observing) is left to the
// doctor/team's own narrated response -- never a claim the child's chosen action was validated.

export type EvidenceId = "meal" | "fluid" | "urine";
export const EVIDENCE_ITEMS: EvidenceId[] = ["meal", "fluid", "urine"];

export interface Session {
  evidence: Record<EvidenceId, boolean>; // true = concerning finding this session
}

export function newSession(rand: () => number = Math.random): Session {
  const evidence = {} as Record<EvidenceId, boolean>;
  for (const k of EVIDENCE_ITEMS) evidence[k] = rand() < 0.5;
  return { evidence };
}

// picks: per-item concern marks plus the mandatory share flag.
export function sessionWin(session: Session, flags: Partial<Record<EvidenceId, boolean>>, share: boolean): boolean {
  if (share !== true) return false;
  return EVIDENCE_ITEMS.every((k) => flags[k] === session.evidence[k]);
}

// Display data for the 3 scored evidence cards. Observation text is written per session from the
// underlying boolean, not stored as static copy, so it always matches session.evidence exactly.
export const EVIDENCE_LABELS: Record<EvidenceId, { name: string; icon: string }> = {
  meal: { name: "食事", icon: "🍚" },
  fluid: { name: "水分", icon: "💧" },
  urine: { name: "排尿", icon: "🚻" },
};

export const EVIDENCE_OBSERVATION: Record<EvidenceId, { concerning: string; stable: string }> = {
  meal: {
    concerning: "きのうも今日も、いつもの半分も食べられていない。",
    stable: "きのうも今日も、いつもどおり食べられている。",
  },
  fluid: {
    concerning: "お茶をひとくち飲むだけで、コップ1杯も飲めていない。",
    stable: "お茶やお水を、いつもどおり飲めている。",
  },
  urine: {
    concerning: "尿の回数も量も、いつもよりはっきり少ない。",
    stable: "尿の回数も量も、いつもと変わらない。",
  },
};

// The 4 unscored cards: an overall-impression trigger (always the same, prompting the check), 2
// exclusionary-but-non-conclusive vitals (always unchanged this scenario, per research.md's finding
// that these are relevant reference clues, not proof of anything), and 1 explicitly irrelevant
// distractor.
export const FIXED_CARDS = [
  { id: "face", icon: "😐", name: "顔色・様子", observation: "顔色はわるくない。でも、ぐったりしている。" },
  { id: "temp", icon: "🌡️", name: "体温", observation: "37.2℃。入院したときと比べて、特に変化はない。" },
  { id: "spo2", icon: "📈", name: "SpO₂", observation: "95%。きのうと大きな変化はない。" },
  { id: "sleep", icon: "😴", name: "睡眠", observation: "夜はよく眠れている。" },
] as const;
