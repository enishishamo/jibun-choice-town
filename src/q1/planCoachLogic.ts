// Pure rules for the business-consultant (経営指導員) Q1 (gameType:
// plan_coach). No React here, same pattern as sourcingLogic.ts.
//
// 2026-09-13 (mechanical-verification follow-up to the manual UX/logic
// audit): extracted so gameplay-qa-plan-coach.mjs can drive the exact
// "面談で確かめていないことは指摘できない" gate and the advice-selection
// rules Node-side. Refactor-only — behavior unchanged from the inline
// version in PlanCoachGame.tsx.

export type FieldId = "naiyou" | "uriage" | "keihi" | "jikin" | "kariire" | "uri";

export interface Field {
  id: FieldId;
  label: string;
  value: string;
  weak: boolean;
  /** reply when the child asks about this field */
  answer: string;
  /** reply when the child (wrongly) flags a non-weak field */
  notWeak?: string;
}
export const FIELDS: Field[] = [
  { id: "naiyou", label: "お店の内容", value: "小さな定食屋（8席）", weak: false,
    answer: "カウンターごしに話せる、小さな定食屋にしたいんです。席は8席です。",
    notWeak: "お店の内容は、はっきりしている。ここは強みだ。" },
  { id: "uriage", label: "売上の見込み", value: "1日50人 × 700円", weak: true,
    answer: "1日50人くらいは来ると思うんです！" },
  { id: "keihi", label: "経費", value: "家賃 ＋ 材料費", weak: true,
    answer: "家賃と材料費は入れました。" },
  { id: "jikin", label: "自己資金", value: "150万円", weak: false,
    answer: "毎月コツコツ、3年かけて貯めました。",
    notWeak: "そこはだいじょうぶそう。毎月の貯金の記録があるからね。" },
  { id: "kariire", label: "借りたいお金", value: "250万円", weak: false,
    answer: "内装の工事に使う予定です。",
    notWeak: "使いみちははっきりしている。金額は、ほかの欄しだいかな。" },
  { id: "uri", label: "お店の売り", value: "出汁からとるみそ汁", weak: false,
    answer: "出汁からちゃんととる、みそ汁が自慢なんです。",
    notWeak: "いいね。ここは計画の弱点ではなさそうだ。" },
];

export const WEAK_FIELD_IDS: FieldId[] = FIELDS.filter((f) => f.weak).map((f) => f.id);

export interface AdviceOption { text: string; good?: true; bounce?: string }
export const ADVICE: Record<string, AdviceOption[]> = {
  uriage: [
    { text: "席の数と営業時間から、入れる人数を計算し直してみたら？", good: true },
    { text: "駅前の人通りを数えてみたら？",
      bounce: "人通りは参考になるけど、8席のお店に一度に入れる人数の答えにはならないみたいだ。" },
    { text: "値段を2倍にすれば？",
      bounce: "「お客さんが来なくなるかも…」とハルさんが心配そうだ。" },
  ],
  keihi: [
    { text: "アルバイト代と、自分の生活費も入れてみよう", good: true },
    { text: "材料費をうんと安いものにかえよう",
      bounce: "「出汁からとるみそ汁が売りなのに…」とハルさんが困っている。売りを削る直し方みたいだ。" },
    { text: "経費は少なく書いたほうが、計画がよく見えるよ",
      bounce: "その直し方だと、面談で「本当にこれだけ？」と聞かれたとき困りそうだ。" },
  ],
};

export type FlagOutcome =
  | "not_asked" // "面談で確かめていないことは、指摘できないよ。" — the core gate
  | "reopen_advice" // already found + not yet advised -> reopen advice dialog
  | "already_advised" // already found + already advised -> no-op
  | "not_weak" // a genuinely non-weak field was flagged
  | "new_weak_found"; // a genuinely weak field, newly flagged

/** Mirrors flag() exactly. */
export function evaluateFlag(fieldId: FieldId, asked: FieldId[], found: FieldId[], advised: FieldId[]): FlagOutcome {
  const f = FIELDS.find((x) => x.id === fieldId)!;
  if (!asked.includes(fieldId)) return "not_asked";
  if (found.includes(fieldId)) {
    return advised.includes(fieldId) ? "already_advised" : "reopen_advice";
  }
  if (!f.weak) return "not_weak";
  return "new_weak_found";
}

/** Mirrors advise(): true iff the chosen option index for this field is the
 * "good" (correct) one. */
export function isGoodAdvice(fieldId: FieldId, index: number): boolean {
  return !!ADVICE[fieldId]?.[index]?.good;
}

/** Mirrors `done = advised.length === 2`. */
export function isComplete(advised: FieldId[]): boolean {
  return advised.length === WEAK_FIELD_IDS.length && WEAK_FIELD_IDS.every((id) => advised.includes(id));
}
