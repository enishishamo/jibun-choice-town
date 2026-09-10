You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the design review
of the Legacy Q1 REBUILD "legacy-move-try" (理学療法士・退院後の動作能力評価、gameType
move_try — existing experience wiring around the old `src/q1/MoveTryGame.tsx`, which is being
fully replaced by this rebuild).

The old implementation already had C_required=true and player_judgment_required=true per the
reverse audit (`factory/state/legacy/reverse-audits/move_try.json`) — the child DOES read real
per-movement symptom text and match it to a fix description. The ONLY flagged defect was
brute_force: a wrong fix pick showed an explanatory hint with zero cost, and the child could stay
on the same movement retrying every option (of 5) until one worked. This is a narrower-scope
rebuild than most of this Factory's recent legacy rebuilds — verify that the scope was appropriately
targeted (not under-fixed, but also not needlessly over-engineered beyond what the actual finding
required).

Read, in this order: `factory/rules/q1-autonomous-factory.md`, `factory/rules/principles.md`,
`factory/rules/game-critic-v2.md`; then `factory/projects/legacy-move-try/research.md` (full — the
sourced real-world facts everything below must stay grounded in, including its FACT_CHECK_REQUIRED
list); then the old `src/q1/MoveTryGame.tsx` (to understand exactly what's being replaced and
confirm the brute-force finding is real); then the full current design chain in order:
`design/fact_sheet_v1.json`, `design/scope_core_v1.json`, `design/ae_v1.json`,
`design/core_scope_check_v1.json`, `design/play_seeds_v1.json`, `design/reference_research_v1.json`,
`design/c_compression_v1.json`, `design/game_translations_v1.json` (read ALL 3 translations, not
just the adopted one), `design/first_5_seconds_v1.json`, `design/no_manual_exploit_check_v1.json`,
`design/core_back_check_v1.json`; then `design/design-sim.mjs` (READ THE FULL SOURCE) and RUN it
yourself (`node factory/projects/legacy-move-try/design/design-sim.mjs`) to verify the checks
actually pass and test what they claim to test.

Verify specifically, with file:line evidence:

A. **Brute-force fix**: does the redesign genuinely eliminate the flagged exploit? Trace through
   ae_v1.json's D/E and game_translations_v1.json's t1 to confirm each movement becomes a single,
   irreversible commit with no path back to re-attempt the SAME movement's fix selection within the
   same session. Also confirm the old game's per-wrong-answer explanatory hints (which let a child
   narrow down the answer for free across repeated attempts) are genuinely removed, not just
   the retry loop.
B. **Asymmetric axis design (situp vs standup/walk)**: `design-sim.mjs` deliberately keeps 起き上がり
   (situp) single-axis while making 立ち上がり(standup)/歩行(walk) two-axis, with the stated reason
   that research.md found no second real axis for situp specifically. (a) Verify this claim against
   research.md yourself — does research.md actually support treating situp as genuinely simpler/
   single-factor while standup/walk are genuinely two-factor, or is this an arbitrary/convenient
   split? (b) Is deliberately NOT forcing symmetry the right call here, or does situp's single-axis
   design make its own "？" disclosure decorative in a way that should be flagged (CORE_DATA_AXIS_
   NOT_REQUIRED-adjacent, even though it's a single movement rather than a set of interchangeable
   candidates)?
C. **The two-axis mapping's realism**: for standup, the design says when cause=support (支持点不足)
   the fix is always "rail" regardless of the environment axis (housing height-adjustability), and
   the environment axis only matters when cause=legs (下肢筋力不足). Is this asymmetric mapping
   defensible as a real clinical simplification, or does it make the environment axis "decorative"
   in the support-branch half the time (i.e., does a strategy that ignores the environment axis
   entirely and only reads the cause axis actually get away with more than the numbers suggest)?
   RUN design-sim.mjs yourself and check the `standup_cause_axis_only`/`walk_cause_axis_only`
   results (~75%) — is 75% single-axis-only success an acceptable bar for THIS game given its
   narrower brute-force-only scope, or does it need tightening to match this session's established
   precedent (legacy-layer-and-compare/legacy-allocate-and-forecast capped single-axis-only at
   ~50-60%)?
D. **Causal-realism / no fabricated statistics**: research.md explicitly found NO quantitative
   statistic linking mismatched-aid-selection to increased fall risk (FACT_CHECK_REQUIRED #1). Verify
   ae_v1.json's E and game_translations_v1.json's t1 E_consequence do NOT imply or state any such
   quantified causal claim, and instead use the honest "movement remains unsafe / not yet ready"
   framing without fabricated numbers.
E. **"PT doesn't decide alone" framing**: research.md finding #5 confirms welfare-equipment final
   decisions are made by a care manager (ケアマネジャー) through multidisciplinary team process, not
   by the PT alone — and explicitly flags (FACT_CHECK_REQUIRED #7) that the OLD game's implicit
   "PT solo decides" framing should be corrected. Verify ae_v1.json's E and the job_reveal framing
   in game_translations_v1.json's t1 actually reflect this (not just claim to in prose commentary,
   but in the actual described E/job_reveal_bridge content).
F. **No fabricated framework claims**: research.md explicitly found NO official named framework
   distinguishing "鍛える(train) vs 用具/環境調整(device/environment) vs 休憩(rest/pacing)"
   (FACT_CHECK_REQUIRED #2). Verify the design chain doesn't present its own axis-to-fix mapping as
   if it were a real clinical algorithm, and that fact_sheet_v1.json's uncertainties honestly
   disclose this is a game-design simplification of real sourced categories, not an official rule.
G. **Gate G / Gate H**: verify the post-failure reflection (triggered only if ≥1 of 3 movements
   failed) is genuinely non-scored, re-presents the 3 movements' original data (not just answer
   buttons — this was a real BLOCKER found in legacy-allocate-and-forecast's implementation review
   for exactly this omission, so check the DESIGN explicitly specifies data re-presentation, not just
   assumes it), and that Gate H's honest-outcome distinction (`onPartialComplete` vs `onComplete`) is
   specified.
H. **Any answer-leak risk**: do the movement names, fix names, or their fixed real-world sequencing
   (起き上がり→立ち上がり→歩行) leak anything beyond legitimate disclosure? Check
   no_manual_exploit_check_v1.json's analysis for hand-waviness vs genuine verification.

Severity calibration: BLOCKER = a genuine exploit design-sim.mjs's own checks don't actually catch,
an answer leak, a factual/causal-realism error (fabricated statistics or a claimed official
framework that doesn't exist), CORE not representative of the profession, a Gate G/Gate H violation,
or the brute-force finding not actually being fixed. HIGH = a real defect that must fix before
implementation. MEDIUM/LOW = polish, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_genuinely_fixed":true|false,
 "asymmetric_axis_design_justified":true|false,"single_axis_threshold_acceptable":true|false,
 "no_fabricated_statistics":true|false,"pt_not_solo_decider_framing_correct":true|false,
 "no_fabricated_framework_claim":true|false,"gate_g_data_represented":true|false,
 "gate_h_specified":true|false,"citation_chain_consistent":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
