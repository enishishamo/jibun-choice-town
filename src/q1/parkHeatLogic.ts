// Pure rules for the park-heat-countermeasure Q1 (gameType: place_and_test,
// ParkHeatGame.tsx). No React here, same pattern as sourcingLogic.ts/busOpsLogic.ts.
//
// 2026-09-13 audit fix (carried over from the component's own header
// comment): GOAL used to be 3 of 4 spots. Since "tree" alone is a correct
// countermeasure for play/bench/path (3 of the 4 spots), a child could win
// by dropping the same part everywhere without ever reasoning about the
// one spot (plaza) that needs different treatment. Raising GOAL to require
// all 4 spots closed that shortcut. This file is the mechanical-
// verification follow-up: extracting SPOTS/PARTS/GOAL and the win check
// out of the component so factory/harness/gameplay-qa-park-heat.mjs can
// assert GOAL really is 4 (not silently regressed to 3) and that no single
// repeated part can satisfy all 4 spots (the exact bug the fix closed).
export type SpotId = "play" | "bench" | "plaza" | "path";
export type PartId = "tree" | "shade" | "pavement" | "mist";

export interface Spot {
  id: SpotId;
  name: string;
  pos: { left: string; top: string };
  sun: string;
  surface: string;
  wind: string;
  /** countermeasures that actually cool this spot */
  good: PartId[];
  weak: Partial<Record<PartId, string>>;
}

export const SPOTS: Spot[] = [
  {
    id: "play",
    name: "遊具",
    pos: { left: "21%", top: "43%" },
    sun: "一日中 日なた",
    surface: "すべり台 58℃",
    wind: "風はふつう",
    good: ["tree", "shade"],
    weak: {
      pavement: "地面はすずしくなったけど、すべり台はまだ熱いまま…",
      mist: "少しすずしい。でも直射日光はそのまま…",
    },
  },
  {
    id: "bench",
    name: "ベンチ",
    pos: { left: "61%", top: "42%" },
    sun: "午後だけ 日なた",
    surface: "ベンチ 52℃",
    wind: "風がとおる",
    good: ["tree", "shade"],
    weak: {
      pavement: "すわる面は日なたのまま…",
      mist: "ベンチがぬれてしまった…",
    },
  },
  {
    id: "plaza",
    name: "広場",
    pos: { left: "47%", top: "58%" },
    sun: "さえぎるものなし",
    surface: "土・砂 62℃！",
    wind: "風はよくとおる",
    good: ["pavement", "mist"],
    weak: {
      tree: "広すぎて、木の日陰だけでは足りない…",
      shade: "広場ぜんぶは屋根でおおえない…",
    },
  },
  {
    id: "path",
    name: "通路",
    pos: { left: "70%", top: "76%" },
    sun: "ほぼ 日なた",
    surface: "石だたみ 57℃",
    wind: "風はよわい",
    good: ["tree", "pavement"],
    weak: {
      shade: "細長い通路には屋根がつけにくい…",
      mist: "通りぬけるだけなので、あまり効かない…",
    },
  },
];

export const PARTS: { id: PartId; name: string }[] = [
  { id: "tree", name: "樹木" },
  { id: "shade", name: "日よけ" },
  { id: "pavement", name: "遮熱・保水の地面" },
  { id: "mist", name: "ミスト" },
];

export const GOAL = 4;

export type Placed = Partial<Record<SpotId, PartId>>;
export type Result = Partial<Record<SpotId, boolean>>;

/** does the part placed at this spot actually cool it? */
export function cooledSpot(spot: Spot, part: PartId | undefined): boolean {
  return !!part && spot.good.includes(part);
}

export function computeResult(placed: Placed): Result {
  const r: Result = {};
  SPOTS.forEach((s) => (r[s.id] = cooledSpot(s, placed[s.id])));
  return r;
}

export function countOk(result: Result | null): number {
  if (!result) return 0;
  return SPOTS.filter((s) => result[s.id]).length;
}

export function isGoalReached(result: Result | null): boolean {
  return countOk(result) >= GOAL;
}
