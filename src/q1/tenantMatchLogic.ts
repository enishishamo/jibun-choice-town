// Pure rules for the shopping-district vacant-shop-matching Q1
// (gameType: tenant_match). No React here, same pattern as
// sourcingLogic.ts/safetyPlanLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-tenant-match.mjs can drive the exact
// drop-validation and win-check rules Node-side. Refactor-only —
// behavior unchanged from the inline version in TenantMatchGame.tsx.

export type ShopId = "A" | "B" | "C";
export type GuestId = "haru" | "zakka" | "bread";
export type CardId = "term" | "rentup" | "keep";

export const GUESTS: { id: GuestId; emoji: string; name: string; want: string }[] = [
  { id: "haru", emoji: "🍚", name: "ハルさん（定食屋）", want: "厨房（水回り）が必要。家賃は月8万円まで" },
  { id: "zakka", emoji: "🪴", name: "雑貨屋を開きたい人", want: "水回りはいらない。商店街にない業種" },
  { id: "bread", emoji: "🥐", name: "パン屋を開きたい人", want: "商店街にすでに2軒ある業種" },
];

export interface Shop {
  id: ShopId;
  emoji: string;
  name: string;
  facts: string[];
  memo?: string;
}
export const SHOPS: Shop[] = [
  {
    id: "A",
    emoji: "👕",
    name: "元・洋品店",
    facts: ["せまい", "家賃 安い", "水回り なし", "所有者「どうぞ歓迎」"],
  },
  {
    id: "B",
    emoji: "🍜",
    name: "元・食堂",
    facts: ["給排水あり（厨房が作りやすい）", "家賃 ふつう"],
    memo:
      "大事にしてきた店だから、知らない人に「ずっと貸しっぱなし」になるのが不安。古い店だから、直してもらうのはかまわない。ただ、家賃を安くしすぎるのはいやだ。",
  },
  {
    id: "C",
    emoji: "👘",
    name: "元・呉服店",
    facts: ["広い", "所有者「代々の店。貸す気はない」"],
  },
];

export const STREET: { emoji: string; label: string; shopId?: ShopId }[] = [
  { emoji: "🥐", label: "パン屋" },
  { emoji: "🏚", label: "空き店舗A", shopId: "A" },
  { emoji: "🥬", label: "八百屋" },
  { emoji: "🏚", label: "空き店舗B", shopId: "B" },
  { emoji: "🥐", label: "パン屋" },
  { emoji: "🏚", label: "空き店舗C", shopId: "C" },
];

export const CARDS: { id: CardId; text: string }[] = [
  { id: "term", text: "期間を区切った契約にする（まずは3年。様子を見て更新）" },
  { id: "rentup", text: "家賃を少し上げるかわりに、改装は自由にしてもらう" },
  { id: "keep", text: "内装は大きく変えない約束にする" },
];

export type Assignment = Partial<Record<ShopId, GuestId>>;

/** Mirrors the drop() bounce rules BEFORE any assignment is written:
 * shop C's owner never rents (always bounces), and shop B only accepts
 * haru (anyone else bounces because they don't need the plumbing). */
export function canDrop(shop: ShopId, guest: GuestId): { ok: boolean; reason?: string } {
  if (shop === "C") {
    return { ok: false, reason: "owner_refuses" };
  }
  if (shop === "B" && guest !== "haru") {
    return { ok: false, reason: "wrong_guest_for_plumbing" };
  }
  return { ok: true };
}

export type EvalStatus =
  | "no_haru" // haru not placed anywhere yet
  | "haru_at_a" // haru placed in the shop without plumbing -- too expensive to renovate
  | "bad_card" // bCard === "keep" -- doesn't fix the owner's actual concern, and blocks the kitchen reno
  | "need_card" // haru is at B but no contract card chosen yet
  | "need_a" // haru+B+valid card are all set, but shop A still has no guest
  | "success";

/** Mirrors check() exactly: haru must end up at B (not A, not unplaced),
 * with a contract card that is neither unset nor "keep", AND shop A must
 * also have a guest assigned (whichever of zakka/bread the player put
 * there — the design allows either as a valid A-side tradeoff). */
export function evaluate(assign: Assignment, bCard: CardId | null): EvalStatus {
  const haruAt = (["A", "B"] as ShopId[]).find((s) => assign[s] === "haru");
  if (!haruAt) return "no_haru";
  if (haruAt === "A") return "haru_at_a";
  // haru is at B
  if (bCard === "keep") return "bad_card";
  if (!bCard) return "need_card";
  if (!assign.A) return "need_a";
  return "success";
}

export function isSuccess(assign: Assignment, bCard: CardId | null): boolean {
  return evaluate(assign, bCard) === "success";
}
