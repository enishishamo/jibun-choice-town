// Pure rules for the hotel/ryokan group-reception Q1 (gameType: hotel_receive), rebuilt per
// factory/projects/legacy-hotel-receive (GAME_TRANSLATION_REBUILD, t1-check-in-per-group, design
// review r2 PASS 88). Mirrors factory/projects/legacy-hotel-receive/design/design-sim.mjs (v2)
// exactly -- GROUP_IDS/ROOM_TYPES/ROOM_CAPACITY/ALLERGENS/newSession/sessionWin are structurally
// identical. Keep the two in sync.
//
// Group ids/names are drawn from the shared tripBands.ts roster (used by the safety-plan and
// bus-ops school-trip games too, for narrative continuity across the 修学旅行編 world) rather than
// inventing new ones -- design-sim.mjs's generic "hana/tsuki/hoshi" placeholders are renamed here to
// real band ids "hana"/"tsuki"/"yuki" (花組/月組/雪組).
export type GroupId = "hana" | "tsuki" | "yuki";
export type RoomType = "triple" | "basic" | "special";
export type Allergen = "egg" | "milk" | "wheat" | "buckwheat" | "peanut" | "shrimp" | "crab";

export const GROUP_IDS: GroupId[] = ["hana", "tsuki", "yuki"];
export const ROOM_TYPES: RoomType[] = ["triple", "basic", "special"];
export const ROOM_CAPACITY: Record<RoomType, number> = { triple: 3, basic: 4, special: 6 };
export const ALLERGENS: Allergen[] = ["egg", "milk", "wheat", "buckwheat", "peanut", "shrimp", "crab"];

export interface GroupSession {
  size: number; // 3-6
  proposedRoom: RoomType;
  roomOk: boolean; // ROOM_CAPACITY[proposedRoom] >= size
  memberAllergens: Allergen[][]; // per member, index 0..size-1
  flaggedMembers: number[]; // indices of members with >=1 flagged allergen
}

function newGroup(rand: () => number): GroupSession {
  const size = 3 + Math.floor(rand() * 4); // 3,4,5,6
  const proposedRoom = ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)];
  const roomOk = ROOM_CAPACITY[proposedRoom] >= size;

  const memberAllergens: Allergen[][] = [];
  const flaggedMembers: number[] = [];
  for (let i = 0; i < size; i++) {
    const allergens = ALLERGENS.filter(() => rand() < 0.12);
    memberAllergens.push(allergens);
    if (allergens.length > 0) flaggedMembers.push(i);
  }
  return { size, proposedRoom, roomOk, memberAllergens, flaggedMembers };
}

export interface Session {
  groups: Record<GroupId, GroupSession>;
}

export function newSession(rand: () => number = Math.random): Session {
  const groups = {} as Record<GroupId, GroupSession>;
  for (const id of GROUP_IDS) groups[id] = newGroup(rand);
  return { groups };
}

export interface GroupPick {
  acceptRoom: boolean;
  specialMealMembers: number[];
}

export function groupWin(group: GroupSession, pick: GroupPick): boolean {
  if (pick.acceptRoom !== group.roomOk) return false;
  const selected = [...pick.specialMealMembers].sort((a, b) => a - b);
  const correct = [...group.flaggedMembers].sort((a, b) => a - b);
  return selected.length === correct.length && selected.every((v, idx) => v === correct[idx]);
}

export function sessionWin(session: Session, picks: Record<GroupId, GroupPick>): boolean {
  return GROUP_IDS.every((id) => groupWin(session.groups[id], picks[id]));
}

// Display data.
export const GROUP_LABELS: Record<GroupId, { name: string; icon: string }> = {
  hana: { name: "花組", icon: "🌸" },
  tsuki: { name: "月組", icon: "🌙" },
  yuki: { name: "雪組", icon: "❄️" },
};
export const ROOM_LABELS: Record<RoomType, string> = {
  triple: "トリプルルーム（定員3名）",
  basic: "基準室（定員4名）",
  special: "特別室（定員6名）",
};
export const ALLERGEN_LABELS: Record<Allergen, string> = {
  egg: "卵",
  milk: "牛乳",
  wheat: "小麦",
  buckwheat: "そば",
  peanut: "落花生",
  shrimp: "えび",
  crab: "かに",
};
export const MEMBER_LABELS = ["Aさん", "Bさん", "Cさん", "Dさん", "Eさん", "Fさん"];

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffledIds<T>(ids: T[], rand: () => number = Math.random): T[] {
  return shuffle(ids, rand);
}
