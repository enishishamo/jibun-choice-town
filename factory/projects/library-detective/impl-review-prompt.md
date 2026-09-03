You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career
game, Japanese grades 4-9). Review the SHIPPED IMPLEMENTATION of the new world
「100年前の写真のなぞ」 (3 Q1 games). This is the binding gate for the world.

READ ONLY THESE FILES (do not explore further; do not run anything):
- src/q1/libraryLogic.ts          — all rules (single source of truth)
- src/q1/PhotoCluesGame.tsx       — photo_clues UI
- src/q1/PaperRescueGame.tsx      — paper_rescue UI
- src/q1/DigiArchiveGame.tsx      — digi_archive UI
- src/data/content/library.ts     — world data
- factory/rules/game-critic-v2.md — rubric incl. v3 experience gate (BINDING)
- factory/rules/language-style.md — language rules (BINDING)

BINDING CALIBRATION (user ruling): a rule card × TODAY'S data deriving the
answer is the accepted series pattern; refusals may be terse world reactions;
staged hints point WHERE, never WHY. Small text on diagram/table annotations is
allowed when the same decision-critical data is available at body size.

Trusted context (machine-checked, do not re-verify):
- gameplay sims 23/23 (factory/harness/gameplay-qa-library.mjs): concluding with
  <2 lookups refused; lookup budget enforced; verify-all + rule-based certainty
  wins 100%; the lookalike decoy answered 確定 never succeeds; 確定 with only 2
  verified matches always bounces while the SAME evidence answered 推定 always
  passes; tape/laminate/peel are stopped by the world without consuming the
  item; brush-everything never completes; fine/old-taped items require
  record_only (restraint); jpeg-everything fails whenever a master exists;
  确定 label without 3 pieces of evidence bounces; publishing people-visible
  photos bounces.
- Browser QA (mobile 375px): all 3 games completed by bots through wrapUp,
  zero console errors.
- Fact base: factory/projects/library-detective/research.result.json
  (レファレンスの複数手掛かり照合・確定/推定/不明を分けて回答, 保存修復の
  テープ/ラミネート禁止・カビ隔離・台紙も来歴の証拠, デジタル化の保存用TIFF
  300-400dpi vs 閲覧用・撮影地不明の正直なラベル・人物写真の公開保留).

Judge CAREER_AUTHENTICITY, GAME_QUALITY (v3: world feedback — matching board
with pins/一致数, storage boxes filling with 🔒 quarantine, live archive shelf
with honest labels; staged where-not-why reactions; no oracles; no answer
leaks) and LANGUAGE (selective ruby 郷土資料/来歴/推定/メタデータ; short
buttons; sentence limits; middle-school fit; no fake dumbing-down).
Fairness framing: 推定 and 「わからない」 are correct professional answers, not
failures; the game must never teach that one lookalike clue confirms a place.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0,
 "career_authenticity_score":0,"game_quality_score":0,
 "language":{"LANGUAGE_AGE_FIT":0,"FURIGANA_SUPPORT":0,"TEXT_DENSITY":0,
  "BUTTON_CLARITY":0,"TECHNICAL_TERM_SUPPORT":0,"VISUAL_LANGUAGE_SUPPORT":0},
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min(career, game). FAIL if any blockers or high remain, or
LANGUAGE_AGE_FIT/BUTTON_CLARITY/TEXT_DENSITY < 80.

ITERATION 2 CONTEXT (fixes since your R1 FAIL — verify, do not assume):
- Visual consequences for wrong answers in ALL 3 games: photo_clues bounced
  answers dim the candidate card AND mark its board column 📄↩ (returned
  paper); paper_rescue wrong treatments pin a visible 🔖 sticky on the item
  which stays on the desk; digi_archive bounced registrations turn the current
  shelf slot into a red-bordered 📄↩ ticket.
- The archive resolution no longer asserts publication: 「3点の登録が、終わった」
  ＋公開ほりゅうは権利確認後に公開, consistent with the rights-hold mechanic.
- Sizes/labels: item/info panels at 15-16px (decision data at body size; the
  compact board/shelf keep the small-annotation calibration), match counts
  ALSO shown as a 16px line under the board; buttons shortened (刷毛（はけ）/
  包む/隔離（かくり）/TIFF/JPEG/確定/推定/ふめい/公開/ほりゅう) with sub-lines;
  ruby added: 照合/刷毛/中性紙/隔離 (plus existing 郷土資料/来歴/推定/メタデータ).
Machine re-checks: sims 23/23, flow bot all 3 games + wrapUp, 0 console errors,
tsc clean.

ITERATION 3 CONTEXT (fixes since your R2 FAIL — verify):
- The q2 self-contradiction is fixed: 「プロは「なんとなく」では答えません。
  分かったこと・推定・分からないことを、分けて答えます。」 — no longer denies
  推定 as a professional answer.
- The wrapUp no longer asserts 特定 unconditionally: afterLabel is
  「いま：根拠つきのラベルがついて、まちの記録になった」 — true for both the
  確定 and 推定 routes (the honest label IS the outcome).
- Buttons trimmed to 2-6 chars: 刷毛/包む/隔離/みなと橋 (readings moved to subs).

ITERATION 4 CONTEXT (fixes since your R3 FAIL — verify):
- The 1-match loophole is CLOSED in libraryLogic: correctCertainty for 推定 now
  requires EXACTLY 2 verified matches (v === 2). One lookalike match supports NO
  conclusion — even 推定 on the right place bounces (new sim, 24/24 total).
- First wrong answers are now visual-only: bounced photo answers/registrations
  and failed treatments show the 📄↩ column mark / red shelf ticket / 🔖 sticky
  with only a neutral terse line (「…だまって戻ってきた。」「…付せんが1枚、
  はられた。」) — no reason text. (The mistake limit is 2, so the second wrong
  answer is the mentor-takeover ending; no WHY hint ever appears.)
Machine re-checks: sims 24/24, flow bot passes, tsc clean.
