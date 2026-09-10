// Pure rules for the tour-conductor delay-recovery Q1 (gameType: delay_recover), rebuilt per
// factory/projects/legacy-delay-recover (GAME_TRANSLATION_REBUILD, t5-hedged-evidence-scope, design
// review r3 PASS 86). Mirrors factory/projects/legacy-delay-recover/design/design-sim.mjs exactly --
// CONTACTS/contactOrderWins/shuffle are structurally identical. Keep the two in sync.
//
// The only real judgment this game asks for: of the 3 affected parties (見学先/venue, バス/bus,
// 宿/hotel), research.md ties a concrete time cutoff (宿の夕食提供締切) specifically to the hotel --
// not because the other two are confirmed to have no real time constraints (see design-sim.mjs's
// header comment), but because that is the one relationship research specifically connected to this
// 30-minute delay. The child must contact the hotel before the other two. Everything else in the
// 5-stage flow (check -> report -> 3 contacts -> approve -> share) is a fixed structural sequence
// enforced by the component's disabled-button gating, not a judgment with multiple legitimate
// answers.

export type ContactId = "venue" | "bus" | "hotel";
export const CONTACTS: ContactId[] = ["venue", "bus", "hotel"]; // 見学先・バス・宿 (identity order)

export function contactOrderWins(order: ContactId[]): boolean {
  return order[0] === "hotel";
}

export function shuffled<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Session {
  displayOrder: ContactId[]; // on-screen card order, randomized per session, decoupled from identity
}

export function newSession(rand: () => number = Math.random): Session {
  return { displayOrder: shuffled(CONTACTS, rand) };
}

// Display data.
export const CONTACT_LABELS: Record<ContactId, { name: string; icon: string }> = {
  venue: { name: "見学先", icon: "⛩️" },
  bus: { name: "バス", icon: "🚌" },
  hotel: { name: "宿", icon: "🏮" },
};

export const CONTACT_DETAIL: Record<ContactId, string> = {
  venue: "予約していた見学の時間に間に合わなくなる見込みです。",
  bus: "駅での待ち時間が長くなる見込みです。",
  hotel: "夕食の提供には時間の締切があります。早く連絡するほど調整の余地が残りますが、連絡が遅れるほど、夕食の提供が難しくなっていきます。",
};
