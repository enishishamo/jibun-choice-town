// Pure rules for the pharmacist Q1 (gameType: rx_check).
// No React here, same pattern as labCheckLogic.ts/clueBoardLogic.ts.
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ42/CA72 — "重要文書の確認が保証されず、答えを直接
// 述べた固定選択肢を無コストで試せる"): two real defects fixed.
// (1) reaching the "気になるところ" step only required opening ANY 3 of
// the 4 cards, so a player could skip the one card (検査の結果) that
// actually contains the information the whole judgment depends on, and
// still proceed — C was never actually required. Now all 4 cards must be
// opened. (2) both the concern and the action choice had only 3 options
// with unlimited free retries and no cost for a wrong pick, so blind
// button-mashing always eventually won for free. A small wrong-guess
// budget (MAX_WRONG_ATTEMPTS) now applies to each step; exceeding it ends
// the chapter via an honest, distinct partial outcome instead of an
// infinite-retry loop.
export type CardId = "rx" | "patient" | "lab" | "history";

export const CARDS: { id: CardId; icon: string; title: string; lines: string[] }[] = [
  { id: "rx", icon: "📄", title: "処方せん", lines: [
    "肺炎の治療につかう注射のくすり", "1日2回・7日分", "点滴でからだに入れる",
  ] },
  { id: "patient", icon: "🧑", title: "患者さんの情報", lines: [
    "70代前半・男性", "体重 52kg", "食事があまりとれていない",
  ] },
  { id: "lab", icon: "🔬", title: "検査の結果", lines: [
    "白血球・CRP：高い（炎症）", "腎臓のはたらきを示す値：ふつうより低め",
  ] },
  { id: "history", icon: "💊", title: "今までの薬・アレルギー", lines: [
    "血圧の薬を毎日のんでいる", "くすりのアレルギー：なし",
  ] },
];

export const CONCERNS = [
  { id: "kidney", label: "腎臓のはたらきが弱っているかも", ok: true,
    reply: "たしかに。腎臓のはたらきが弱いと、くすりがからだに残りやすくなることがある。" },
  { id: "allergy", label: "アレルギーがあるかも", ok: false,
    reply: "💊今までの薬・アレルギーのカードを見ると、アレルギーは「なし」と書いてある。" },
  { id: "double", label: "同じ薬が2つ出ているかも", ok: false,
    reply: "📄処方せんを見ると、出ているのは1種類だけ。" },
];

// 2026-09-07 repair round 2 (independent review HIGH: "自分の判断でやめる"
// -- stop unilaterally -- used to end with "まずは相談" ("consult first"),
// which semantically names the correct action ("医師に問い合わせる") even
// though it never quotes its label. Reworded to explain only the harm of
// stopping unilaterally, with no pointer toward what TO do instead.
export const ACTIONS = [
  { id: "asis", label: "このまま出す", ok: false,
    result: "気になることがあるまま出してしまうと、くすりがからだに残りすぎるかもしれない。" },
  { id: "ask", label: "医師に問い合わせる", ok: true,
    result: "「腎臓の値が低めですが、量はこのままでよいですか？」と確認した。" },
  { id: "stop", label: "自分の判断でやめる", ok: false,
    result: "薬剤師だけの判断でやめてしまうと、肺炎の治療そのものが始められなくなってしまう。" },
];

/** every card must be opened -- the judgment depends specifically on the
 * lab-results card, so "open any N of 4" would let a player skip exactly
 * the one card that matters. */
export function hasSeenEnough(seen: CardId[]): boolean {
  return CARDS.every((c) => seen.includes(c.id));
}

/** wrong picks allowed before the concern step ends without ever handing
 * over the answer -- closes the free, unlimited-retry brute force loop a
 * 3-option choice would otherwise have. The two wrong concerns are refuted
 * by specific card evidence (an actual content-dependent judgment), so one
 * retry stays reasonable here. */
export const MAX_CONCERN_WRONG_ATTEMPTS = 1;
/** 2026-09-07 repair round 2 (independent review HIGH: combined blind-guess
 * success across both steps, at 1 retry each, was still ~4/9 -- too high
 * given "医師に問い合わせる" also carries generic professional
 * face-validity independent of any data read ("escalate/ask when unsure"
 * is a content-blind meta-strategy). Zero retries here (a wrong pick ends
 * the chapter immediately) cuts blind success on this step from 2/3 to
 * 1/3, without touching the concern step's own, more genuinely
 * content-dependent budget. */
export const MAX_ACTION_WRONG_ATTEMPTS = 0;
