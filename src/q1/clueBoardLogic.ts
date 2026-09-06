// Pure rules for the doctor Q1 (gameType: clue_board).
// No React here, same pattern as labCheckLogic.ts/xrayLogic.ts.
//
// 2026-09-06 (Continuous Product Loop, Autonomous Execution Mode): the
// original version's win condition was "collect any 5 of the 9 available
// clues" — content-blind (factory/state/audits/audit-summary.md: GQ31,
// "情報の内容を解釈せず有効な項目を5個押すだけで成功する"). Nothing
// required the player to actually read a value against its normal range;
// tapping through items and opening "これって？" a few times always won.
//
// Fix: keep ASK/EXAM as free-form context gathering (unchanged — no decoy
// content there, so there is nothing to "judge" among them), but gate
// completion on a genuine reading-comprehension step over the VITALS:
// after gathering enough context, the player must correctly say WHICH
// vitals are outside their own shown normal range — not memorized medical
// knowledge, just comparing the two numbers already on screen. Unlike
// lab_check's first (failed) attempt, nothing about a vital's LABEL
// ("体温", "SpO₂") reveals whether ITS OWN specific value is off — that
// requires actually reading value vs. normal range, so there is no
// label-only shortcut.
export interface Clue { id: string; text: string; from: string }

export const ASK: { id: string; q: string; a: string; clue?: Clue }[] = [
  { id: "when", q: "いつから？", a: "「3日くらい前から、熱っぽくてね」", clue: { id: "c1", text: "3日前から発熱", from: "話" } },
  { id: "how", q: "どんな感じ？", a: "「せきが出て、動くと息が苦しい」", clue: { id: "c2", text: "咳・動くと息苦しい", from: "話" } },
  { id: "eat", q: "ごはんは食べられてる？", a: "「あんまり食べられてないな…」", clue: { id: "c3", text: "食欲が落ちている", from: "話" } },
  { id: "usual", q: "いつもと違うことは？", a: "「ふだんは畑にも出てるんだけど、今日は起きるのもつらい」", clue: { id: "c4", text: "ふだんより動けない", from: "話" } },
  { id: "hurt", q: "どこか痛いところは？", a: "「痛みはとくにないよ」" },
];

export const EXAM: { id: string; label: string; result: string; clue?: Clue }[] = [
  { id: "chest-r", label: "胸の右側を聴く", result: "ゼーゼー、プツプツという音が聞こえる", clue: { id: "c5", text: "右の胸で、いつもと違う音", from: "診察" } },
  { id: "chest-l", label: "胸の左側を聴く", result: "こちらは、はっきりした異常な音はない" },
  { id: "face", label: "顔・くちびるを見る", result: "顔が赤い。少し息が速い", clue: { id: "c6", text: "顔が赤い・呼吸が速い", from: "診察" } },
  { id: "throat", label: "のどを見る", result: "赤くはれてはいない" },
];

// ※数値はプロトタイプ用の設定。基準は子ども向けに簡略化している。
// 2026-09-06 repair（独立Codexレビュー2周目で検出したHIGH是正）: 以前は
// クルー文自体に「（高い）」「（低い）」「速い」という評価語が入っており、
// review画面で数字とふつうの範囲を見比べる前に答えが分かってしまっていた。
// さらに血圧だけクルーが無かったため「クルーが出るかどうか」自体が
// off/normalの目印になっていた。全項目を「ラベル＋数値」だけの中立な
// クルー文にそろえ、血圧にもクルーを付けて、この差自体を消した。
export const VITALS = [
  { id: "temp", label: "体温", value: "38.6 ℃", normal: "だいたい 36〜37℃くらい", off: true, clue: { id: "c7", text: "体温 38.6℃", from: "バイタル" } },
  { id: "spo2", label: "SpO₂（血液に酸素がどれくらい入っているか）", value: "88 %", normal: "だいたい 96%以上", off: true, clue: { id: "c8", text: "SpO₂ 88%", from: "バイタル" } },
  { id: "rr", label: "呼吸数", value: "24 回/分", normal: "だいたい 12〜18回/分", off: true, clue: { id: "c9", text: "呼吸数 24回/分", from: "バイタル" } },
  { id: "bp", label: "血圧", value: "128 / 78", normal: "だいたい 120/80くらい", off: false, clue: { id: "c10", text: "血圧 128/78", from: "バイタル" } },
];

/** 2026-09-06 repair (2nd HIGH set): unlimited review-screen resubmission
 * let a player enumerate all 16 possible 4-row flag-sets for free. Capped
 * to 2 attempts (mirrors XrayGame's MISJUDGE_LIMIT precedent) — a real,
 * bounded cost for guessing without reading, while still letting a child
 * who got it wrong once try again with the SAME data in front of them. */
export const MAX_REVIEW_ATTEMPTS = 2;

export const MIN_CLUES = 5;
/** at least this many distinct tools (ask/exam/vital) must contribute a
 * clue — forces real multi-source investigation, not one tab alone. */
export const MIN_TOOLS = 2;

export const OFF_VITAL_IDS = VITALS.filter((v) => v.off).map((v) => v.id);

export function hasGatheredEnough(clueCount: number, toolsUsed: Set<string>): boolean {
  return clueCount >= MIN_CLUES && toolsUsed.size >= MIN_TOOLS;
}

/** The judgment gate: did the player correctly pick exactly the vitals that
 * are outside their OWN shown normal range — no more, no fewer? */
export function isCorrectVitalFlagSet(flagged: string[]): boolean {
  const set = new Set(flagged);
  if (set.size !== OFF_VITAL_IDS.length) return false;
  return OFF_VITAL_IDS.every((id) => set.has(id));
}
