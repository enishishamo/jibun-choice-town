You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 4 of the design review
of the Legacy Q1 REBUILD "legacy-allocate-and-forecast" (渇水対策連絡協議会で水の分け方を調整する
仕事, gameType allocate_and_forecast).

**Round-3 verdict** (factory/projects/legacy-allocate-and-forecast/design-review-r3.result.json):
FAIL 42, CA42/GQ72, 2 BLOCKER, 0 HIGH, 2 MEDIUM, 1 LOW. Every finding from rounds 1-2 not listed
below was confirmed CLOSED in round 3 (threshold discipline, both-axes reflection, visual failure
feedback, reservoir-value consistency, clue-join citation) — do not re-litigate those unless you
find NEW evidence they've regressed.

Fixes claimed this round (verify EACH yourself against the actual current files, not just the claim):

1. **BLOCKER: CORE_CAUSAL_MODEL_DISTORTED** — round 3 accepted the SHAPE of the fix (decouple
   household's scoring axis from the real backup-source-protects-household fact) but rejected v3's
   specific replacement grounding: "this week's own baseline demand is naturally lower (a cooler week
   means less AC use)" — rejected as not water-specific (household AC isn't a material municipal-water
   demand driver) and not directionally valid (lower demand alone doesn't establish that cutting there
   is the RIGHT priority, only that less water would be saved). Claimed fix: `design-sim.mjs` v4's
   household CAPACITY axis is re-grounded as "today, discretionary/non-essential household water use
   (庭の水やり・洗車等 — garden watering, car washing) can be deferred without a health or safety
   impact" — framed as a real, commonly-documented FIRST-STAGE drought-response category (municipal
   water restrictions routinely target outdoor/non-essential use before indoor essential use).
   `fact_sheet_v4.json`'s expertise now includes this as a claimed general practice, explicitly flagged
   as NOT sourced from research.md's 6 specific citations (a generalization, not a specific claim).
   Verify: (a) is this actually a genuine, water-specific, directionally-valid real-world mechanism —
   does deferring garden watering/car washing plausibly save real, meaningful water, unlike AC? (b) is
   it honest that research.md doesn't specifically document this (check research.md yourself — do NOT
   just trust the fact_sheet's own claim that it's absent) — is flagging it as an unsourced
   generalization sufficient, or does citing it in `expertise` (implying documented professional
   knowledge) still overclaim despite the disclaimer? (c) is this consistent across
   `scope_core_v4.json`/`ae_v4.json`/`c_compression_v4.json`/`play_seeds_v4.json`/
   `game_translations_v4.json`/`reference_research_v4.json`?
2. **BLOCKER: ARTIFACT_CHAIN_INCONSISTENT (fact_sheet not swept)** — v3's fact_sheet still described
   allocation generically via "代替手段" including household backup sources as decision input,
   contradicting the model's actual separation. Claimed fix: `fact_sheet_v4.json`'s
   representative_duties/tools/information_used/decisions now distinguish each sector's own axis
   explicitly (agriculture: 番水・反復利用の余地, industrial: 応援給水協定, household: 不要不急の使い方
   〔庭の水やり・洗車等〕を後回しにできるか), with backup sources (地下水・海水淡水化) kept only in
   their protective role, separate from any sector's scoring axis. Verify by reading the FULL
   fact_sheet_v4.json (not just the previously-flagged lines) for any remaining generic "代替手段"
   language that still lumps household in with agriculture/industrial's alt-based axis.
3. **MEDIUM (non-blocking, but check for genuine resolution)**: (a) `c_compression_v3.json`'s
   ambiguous rate-of-decline disclosure ("removed" AND "integrated into 2 snapshot axes" simultaneously)
   — check `c_compression_v4.json` states plainly that the decline RATE is omitted entirely, not
   represented by the HIGH/LOW + SOON/FAR snapshot. (b) `reference_research_v3.json`'s first entry
   describing the mechanic uniformly via "代替手段" applied to all 3 sectors — check
   `reference_research_v4.json` now distinguishes household's axis from agriculture/industrial's.
4. Confirm design-sim.mjs's actual code (SECTORS, DEPTH_TABLE, NON_TARGET_PATTERNS, newSession,
   sessionWin, SINGLE_AXIS_PASS_BAR) is BYTE-IDENTICAL to the version verified in round 3 (this round's
   fix is claimed to be grounding-text-only, no math change) — run it yourself and confirm the numbers
   still match design-sim-result.json (~58.3% for the single-axis checks, 0.60 fixed threshold).
5. Re-verify `game_translations_v4.json`'s adopted `t5-brief-and-allocate-corrected` reads as a complete,
   internally consistent translation end-to-end with the new household grounding woven in naturally
   (not just patched in one place while other fields still imply the old "backup" or "demand" framing).

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-allocate-and-forecast/research.md` (to verify claim 1(b) yourself); then the
full CURRENT design chain (all `_v4.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-allocate-and-forecast/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE
and RUN it).

Severity calibration: BLOCKER = a round-1/2/3 finding is not actually closed, or a NEW genuine exploit/
answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix before
implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to BLOCKER or HIGH,
say so plainly — after 3 rounds and 2 repairs plus 1 redesign, a genuine, clean PASS is the expected
and desired outcome if the fixes actually hold up; do not manufacture findings to justify another round.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round3_findings_confirmed_closed":{"core_causal_model_distorted":true|false,"artifact_chain_inconsistent":true|false,
 "rate_of_decline_disclosure":true|false,"reference_research_household_axis":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","design_sim_math_unchanged_from_r3":true|false,
 "household_mechanism_genuinely_grounded":true|false,"fact_sheet_fully_swept":true|false,
 "translation_internally_consistent":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
