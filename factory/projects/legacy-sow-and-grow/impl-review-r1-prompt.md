You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the implementation
review of the Legacy Q1 REBUILD "legacy-sow-and-grow" (農家・生産者、gameType sow_and_grow, 給食編
— existing experience id `farmer-lunch` in src/data/content/schoolLunch.ts, unchanged wiring, no
prerequisites, unlocks nothing downstream in that event but is a standalone hotspot). This game
already shipped a flawed implementation (old src/q1/FarmGame.tsx: fixed month/deadline/forecast
every playthrough — "今は7月", "11月に300kg", always-hot forecast — so the child could win by
memorizing "always plant あかね夏" without ever reading the season/deadline/forecast data; reverse
audit: exploit=memorize, player_judgment_required=false) which is being fully replaced end to end
(design + implementation) by this rebuild. The design chain passed design review r6 (PASS 70,
CA84/GQ70) under the adopted translation t1-season-deadline-match, after 6 adversarial rounds that
closed ANSWER_LEAK, C_NOT_NEEDED_FOR_D/CORE_DISTORTED_BY_GAME, BRUTE_FORCE_SUCCESS,
FAILURE_DISGUISED_AS_SUCCESS, FACTUAL_PROFESSION_ERROR, SIMULATION_REPRODUCIBILITY_FAILURE, and
ARTIFACT_CHAIN_INCONSISTENT findings — read factory/projects/legacy-sow-and-grow/design-review-r1
through r6 .result.json files' failure_codes fields for the full history if you want context on
what NOT to re-litigate (their fixes are design-stage and already reviewed; your job is the
IMPLEMENTATION only). Judge the implementation rigorously and adversarially; do not assume the
design review already checked the code.

Read, in this order: factory/rules/q1-first-play-standard.md; the CURRENT design files ONLY (check
factory/projects/legacy-sow-and-grow/q1-pipeline.json's artifacts.<type>.file for the exact current
path of each — do not guess by filename convention, several were resubmitted unchanged under new
filenames across the 6 design review rounds) — specifically game_spec, art_brief, game_translations
(adopted entry t1-season-deadline-match only), fact_sheet (candidate variety-grounding claims only),
design-sim.mjs and design-sim-result.json; then src/q1/farmLogic.ts; src/q1/FarmGame.tsx;
src/q1/registry.ts (sow_and_grow mapping); src/data/content/schoolLunch.ts (farmer-lunch entry
only); factory/harness/gameplay-qa-sow-grow.mjs — RUN IT
(`node factory/harness/gameplay-qa-sow-grow.mjs`, expect 18 passed, 0 failed); then
factory/projects/legacy-sow-and-grow/design/implementation_v1.json and implementation_qa_v1.json
(read implementation_qa_v1.json's "consequence" field carefully — it discloses a real bug found and
fixed during live testing: the honest-partial path initially called onComplete instead of
onPartialComplete). Run `npm run lint` and `npx tsc --noEmit -p .` (and `npm run build` if your
sandbox allows it — if not, say so and rely on tsc).

Verify specifically, with file:line evidence:
A. CORE preserved: the child must read the task-bar status (today's month/deadline/forecast) and
   each variety card's sowing-window/harvest-days/heat-tolerance, then EXPLICITLY commit via
   'これでまく' (never pre-filled or suggested). Confirm src/q1/farmLogic.ts's VARIETIES array
   (id/name/window/harvestDays/heatOk) is byte-for-byte the SAME data as
   factory/projects/legacy-sow-and-grow/design/design-sim.mjs's VARIETIES array — if the shipped
   module and the design-stage exploit simulation have drifted even slightly (a different
   harvestDays number, a different window, a different heatOk flag), every one of design-sim's
   verified exploit-resistance numbers is meaningless for what actually shipped.
B. Session generation: confirm src/q1/farmLogic.ts's newSession function performs the SAME
   rejection-sampling logic as design-sim.mjs's newSession (draw sowMonth once, resample
   deadlineOffsetMonths/forecastHot up to MAX_RESAMPLES=200 until a winner exists, deterministic
   fallback via a pre-enumerated STATE_SPACE, never throws). Confirm FarmGame.tsx calls
   `useState(() => newSession())` (mount-once, not recomputed on every render) and
   `useState(() => shuffledIds(VARIETY_IDS))` for card order (also mount-once, id-based shuffle,
   never position-based scoring).
C. Answer leaks: do the variety names (つぶたね/まんまる/ことね) or their card layout leak anything
   beyond what the '?' disclosure legitimately reveals? Is the learning-setting disclaimer
   ("※品種の数値はこのゲームの中だけの、学習用の設定です") purely informational and not itself an
   answer hint? Does anything render BEFORE the child commits that reveals which variety would win
   this session (check FarmGame.tsx's JSX top-to-bottom for any reference to the correct variety
   before the outcome branches)?
D. Honest outcome / Gate H: verify the FIX described in implementation_qa_v1.json is actually
   present in the current source — the partial branch's button must call
   `(onPartialComplete ?? onComplete)()`, not `onComplete` directly. Confirm gameplay-qa-sow-grow.mjs
   has a real regression check for this (not just a claim) and that it currently passes. This is
   exactly the class of defect ("wrong answer renders identically to right answer") that Q1
   First-Play Standard Gate H exists to prevent — treat any regression of it as a BLOCKER-class
   finding if you find the fix is incomplete or the regression check is weak/gameable.
E. No same-session retry (deliberate design choice, confirmed sound by design review r4/r5):
   confirm FarmGame.tsx genuinely has no in-place re-selection after a commit (the screen fully
   transitions to success/partial, and the ONLY way to play again is a fresh component mount via
   chapter replay). If you find a way to reach the picking UI again without a full remount within
   the same session, that reintroduces the brute-force risk design review r2/r3 specifically
   fixed (trying multiple seasonally-eligible varieties without reading deadline/heat) — flag as
   HIGH or BLOCKER depending on severity.
F. Mobile/375px legibility: 3 variety cards (single column) + task-bar + disclaimer line + no
   separate submit button (each card's own commit button finalizes) should easily fit at 375x812
   with room to spare (implementation_qa_v1.json claims this, live-measured) — sanity-check this is
   plausible from the CSS (.farm-grid, .dx-card, .dx-commit, .farm-disclaimer in src/index.css).
G. Touch targets: dx-commit (>=44px) and dx-more (38x38px circle) — confirm these are the SAME
   shared CSS classes already independently reviewed and accepted for legacy-clue-join's
   DiagnoseGame.tsx (i.e. not a new, unreviewed touch-target implementation).
H. Content accuracy against the current fact_sheet's candidate-grounding claims: does farmLogic.ts's
   VARIETIES data honestly match what the design chain says is real vs. fictional (only the early/
   late sowing-timing pattern and まんまる's heat tolerance are meant to be grounded; つぶたね/こと
   ねの耐暑性 are explicitly fictional per the design chain — does the CODE introduce any claim
   beyond what the design intends, e.g. a comment or string asserting more real-world grounding
   than the design chain supports)?
I. Integration safety: registry.ts still maps sow_and_grow -> the same component export, no id
   collisions, schoolLunch.ts's farmer-lunch wiring (place/mission/tools/resolution/discoveryEcho)
   is untouched, no new art asset was generated or referenced.
J. Any NEW exploit or regression the design-stage design-sim.mjs could not have caught because it
   only modeled the abstract rules, not the actual rendered component.

Severity calibration: BLOCKER = the game is unplayable, a §A/B/C/D/E finding is violated outright
(scoring drift from design-sim, answer leak, non-flat feedback, a wrong-answer path completing as
success, or a resurrected brute-force retry path). HIGH = must fix before release (e.g. a genuine
content-blind exploit found beyond what gameplay-qa-sow-grow.mjs already covers, a real
touch-target/legibility failure, factual overreach beyond the design chain). MEDIUM/LOW = polish.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...",
 "farmLogic_matches_design_sim_exactly":true|false,"session_generation_correct":true|false,
 "answer_leak_found":true|false,"gate_h_fix_verified":true|false,
 "no_session_retry_confirmed":true|false,"scroll_812_claim_plausible":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
