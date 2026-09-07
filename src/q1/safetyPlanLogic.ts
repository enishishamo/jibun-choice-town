// Pure rules for the school-trip safety-lead Q1 (gameType: safety_plan).
// No React here, same pattern as labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair round 1 (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ48/CA47 -- "資料確認は必須だが、その内容を引率者の
// 選定や安全体制へ適用する仕事固有の判断が実装されていない"): opening the
// allergy/motion-sickness info cards used to be a pure click-tracking gate
// -- their CONTENT never affected which adult should hold which role.
//
// Round 1 fix required 花組(allergy)'s own adult to hold 救急用品, and
// 月組(motion-sickness)'s own adult to hold 最後尾 -- but independent
// review found the post-check issue text simply STATED that exact rule
// outright on the very first failed check, so a player could open both
// cards without reading them, fail once, and copy the literal answer
// straight out of the failure message -- Gate C was bypassed by the
// feedback text itself, not fixed by it. It also flagged 最後尾 as an
// unmotivated, invented pairing for motion-sickness (none of その資料's
// actual content -- window seat, frequent breaks, medicine -- has
// anything to do with walking position at the back).
//
// Round 2 (this revision):
// - tsuki's required role is now 先頭 (walks at the front), not 最後尾 --
//   the front-walker is the one who actually sets pace and calls rest
//   stops, which is what "こまめに休憩を" is actually about.
// - the not-yet-opened messages no longer name the risk type (no
//   "アレルギー"/"乗り物酔い"), only which band still has an unread doc.
// - the specific-link messages, at every attempt count, never state the
//   literal band->role rule. They only point back at the resource and at
//   comparing the band's own adult against the (always-visible) role
//   labels -- matching the bar set by bus_ops/timetable's own escalated
//   hints ("見てみよう", never "the answer is X").
export interface Adult {
  id: string;
  name: string;
  icon: string;
}

export const ADULTS: Adult[] = [
  { id: "homeroom", name: "担任の先生", icon: "🧑‍🏫" },
  { id: "vice", name: "副担任の先生", icon: "👩‍🏫" },
  { id: "head", name: "学年主任の先生", icon: "🧑‍💼" },
  { id: "nurse", name: "養護の先生", icon: "👨‍⚕️" },
  { id: "parent", name: "保護者代表", icon: "👵" },
];

export interface SafetyState {
  placed: Record<string, string>; // bandId -> adultId
  head: string | null;
  tail: string | null;
  medic: string | null;
  contact: string | null;
  openedDocs: string[];
}

export function computeIssues(bandIds: string[], s: SafetyState): string[] {
  const issues: string[] = [];
  const allAssigned = bandIds.every((b) => s.placed[b]);
  if (!allAssigned) issues.push("引率の大人がいない班があるよ。");
  if (!s.head) issues.push("先頭を歩く担当が決まっていないよ。");
  if (!s.tail) issues.push("最後尾を歩く担当が決まっていないよ。");
  if (s.head && s.tail && s.head === s.tail) issues.push("先頭と最後尾、同じ人になっているよ。別の人にしよう。");
  if (!s.medic) issues.push("救急用品の担当が決まっていないよ。");
  if (!s.contact) issues.push("緊急連絡先の担当が決まっていないよ。");

  if (!s.openedDocs.includes("hana")) {
    issues.push("🥜花組の資料を、まだ確認していないよ。");
  } else if (s.placed.hana && s.medic !== s.placed.hana) {
    issues.push("🥜花組を担当している人と、役割の名前を見比べてみよう。資料も、もう一度たしかめてみて。");
  }

  if (!s.openedDocs.includes("tsuki")) {
    issues.push("🚌月組の資料を、まだ確認していないよ。");
  } else if (s.placed.tsuki && s.head !== s.placed.tsuki) {
    issues.push("🚌月組を担当している人と、役割の名前を見比べてみよう。資料も、もう一度たしかめてみて。");
  }

  return issues;
}
