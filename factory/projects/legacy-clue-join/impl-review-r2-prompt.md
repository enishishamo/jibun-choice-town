You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the implementation
review of the Legacy Q1 REBUILD "legacy-clue-join" (gameType `clue_join`, existing experience id
`med-diagnose` in src/data/content/medical.ts), after the ONE downstream implementation repair
the Q1 Autonomous Game Factory allows at this stage (repair 2/2 of design iteration 3 — this is
the LAST implementation-stage repair available; if genuine HIGH/BLOCKER issues remain, the
pipeline must escalate). Judge rigorously; do not soften because of the repair history, and do
not harden because of it either.

**Round-1 verdict** (factory/projects/legacy-clue-join/impl-review-r1.result.json): FAIL 74,
CA74/GQ78, 0 blockers, 2 HIGH. Fixes claimed this round (verify each in code):
1. HIGH (CLINICAL_MODEL_OVERSTATED) — src/q1/DiagnoseGame.tsx's success screen previously
   labeled each of the 3 alternative diagnoses with absolute exclusion ("○○ではない"),
   contradicting fact_sheet_v12's tendency-only/non-absolute-exclusion policy. It now shows a
   "○○との比較" heading, followed by that candidate's own fact_sheet.candidate_reference_cards
   tendency text unchanged, followed by one comparative sentence: "今回そろった所見は、これより
   も肺炎の典型像によく合う。" No absolute exclusion language should remain anywhere on the
   success screen.
2. HIGH (DISCLOSURE_TOUCH_TARGET_TOO_SMALL) — the diagnosis-candidate "?" disclosure toggle
   (src/index.css .dx-more) previously had padding:0 (inherited from the global button reset)
   and no min-height, an effective tap height of ~18px. It is now a dedicated 38x38px circular
   button (explicit width/height, border, background), moved into a single header row
   (.dx-head) alongside the diagnosis name instead of a separate full-width row below it, so
   overall card height did not grow. implementation_qa_v2.json claims a live remeasurement of
   getBoundingClientRect() = {height:38, width:38} and document.scrollHeight === innerHeight ===
   812 at 375x812 (0px overflow, down from 819/7px in round 1).

Read, in this order: factory/rules/q1-first-play-standard.md; the CURRENT design files ONLY —
factory/projects/legacy-clue-join/design/game_spec_v1.json, art_brief_v1.json,
game_translations_v12.json (adopted entry t1d-flexible-commit-and-defend only),
fact_sheet_v12.json (candidate_reference_cards only), design-sim.mjs/design-sim-result.json,
design-review-r10.result.json; then src/q1/clueJoinLogic.ts; src/q1/DiagnoseGame.tsx (the
CURRENT file — do not assume round-1's version); src/index.css (search for .dx-head, .dx-more,
.dx-card, .dx-commit, .join-main, .join-card, .join-grid); src/q1/registry.ts;
src/data/content/medical.ts (med-diagnose entry only); factory/harness/gameplay-qa-clue-join.mjs
— RUN IT (`node factory/harness/gameplay-qa-clue-join.mjs`, expect 31 passed, 0 failed); then
factory/projects/legacy-clue-join/design/implementation_v2.json and implementation_qa_v2.json.
Run `npm run lint` and `npx tsc --noEmit -p .` (and `npm run build` if your sandbox allows it —
if not, say so and rely on tsc). Do NOT read implementation_v1.json/implementation_qa_v1.json as
current truth — only their v2 successors and the revision_note inside them describing the diff.

Verify specifically, with file:line evidence:
A. Round-1 finding #1 is genuinely closed: search the ENTIRE success-screen render path (not
   just the obvious line) for any absolute-exclusion phrasing ("ではない", "絶対に", "ありえな
   い", or similar) applied to a diagnosis candidate. Confirm the replacement text still
   fulfills game_spec_v1.json's requirement to show "代替診断3つそれぞれとの対比" — i.e. it must
   still be a genuine, informative contrast, not so watered-down that it says nothing.
B. Round-1 finding #2 is genuinely closed: confirm .dx-more's actual computed box is >= 38x38px
   (not just a CSS declaration that could be overridden elsewhere — check for any conflicting
   later rule, any parent overflow:hidden clipping it, and that the click handler still toggles
   the SAME pattern-disclosure behavior as before). Confirm restructuring into .dx-head did not
   silently break anything else (e.g. does the diagnosis name still fit legibly at ~155px column
   width across all 4 candidate names, including the longest ones with reading kana in
   parentheses?).
C. Any NEW defect introduced by either repair (this is what round-1-style repairs most often get
   wrong): does the reworded comparison text accidentally leak which candidate IS correct beyond
   what's needed (e.g. by naming pneumonia inside every comparison line in a way that reads as
   "the answer is announced here" rather than after-the-fact contrast — note the success screen
   is ONLY shown after a correct submission, so naming pneumonia there is fine, but check it
   still doesn't pre-empt anything shown BEFORE commit); does the .dx-head flex layout cause any
   overlap or clipping at 375px for the longest candidate name (喘息発作（ぜんそくほっさ）); does
   moving the toggle into the header change tab/focus order in a way that breaks keyboard/screen
   reader use meaningfully worse than the rest of this app's convention (informational only,
   not a blocking criterion for this app if consistent with its existing sibling games).
D. Re-verify everything from round 1 that was NOT flagged, is still true in the current code:
   CORE preserved (explicit commit + explicit evidence selection, scored together only on
   submit), exactly 4 winning combinations out of 252, shuffle-lifecycle correctness (id-based,
   once per mount, reshuffle only on restart), fully flat failure feedback (one generic
   sentence, no hint), honest partial with both retry and proceed options, canon numbers reused
   (WBC 13,200/CRP 12.4/SpO2 88%/BP 128/78/right-lung opacity), registry/medical.ts wiring
   untouched, no new art asset.
E. Content accuracy: does the reworded comparison sentence for each of the 3 alternatives stay
   consistent with what that candidate's OWN pattern text actually says (i.e. does the
   comparison make sense given what's shown, not just generically appended)?

Severity calibration: BLOCKER = the game is unplayable, or a §A/B finding from round 1 is NOT
actually fixed, or a §D core invariant is now broken. HIGH = must fix before release (e.g. a
genuinely new defect from the repair itself). MEDIUM/LOW = polish. Replayability/mastery is PLUS
QUALITY only, never required. Do not invent a new HIGH out of stylistic preference for wording
that already satisfies fact_sheet's non-absolute policy — the bar is "no absolute exclusion
claim", not "the strongest possible hedge language."

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"clinical_model_overstated":true|false,"disclosure_touch_target":true|false},
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...",
 "dx_more_actual_size_plausible":true|false,"scroll_812_claim_plausible":true|false,
 "no_absolute_exclusion_language_remains":true|false,"core_still_preserved":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
