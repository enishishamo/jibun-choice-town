You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the design review
of the Legacy Q1 REBUILD "legacy-move-try" (理学療法士・退院後の動作能力評価、gameType move_try).

**Round-1 verdict** (factory/projects/legacy-move-try/design-review-r1.result.json): FAIL 52,
CA52/GQ58, 3 BLOCKER, 2 HIGH, 0 MEDIUM, 1 LOW. Do not re-litigate `brute_force_genuinely_fixed`,
`no_fabricated_statistics`, `pt_not_solo_decider_framing_correct`, `no_fabricated_framework_claim`,
or `gate_g_data_represented` — round 1 already confirmed all of these closed.

Fixes claimed this round (verify each yourself against the actual current files, not just the claim):

1. BLOCKER (mapping not jointly-necessary) — v1's standup/walk cause x condition mappings had one
   branch (standup's "support" cause always -> rail; walk's "balance" cause always -> cane)
   independent of the second axis, letting cause-axis-only reading reach ~75%. Claimed fix:
   `design-sim.mjs` v2's `newStandup`/`newWalk` now use a full 2x2 assignment where the one
   necessarily-repeated fix (3 candidates over 4 cells) appears ONLY in the two cells that differ in
   BOTH axes (a diagonal-Latin-square pattern), specifically:
   - standup: (legs,adjustable)->height, (legs,not_adjustable)->train, (support,adjustable)->rail,
     (support,not_adjustable)->height
   - walk: (balance,caregiver_yes)->cane, (balance,caregiver_no)->train,
     (endurance,caregiver_yes)->rest, (endurance,caregiver_no)->cane
   RUN `node factory/projects/legacy-move-try/design/design-sim.mjs` yourself and verify
   `standup_cause_axis_only`/`standup_env_axis_only`/`walk_cause_axis_only`/
   `walk_caregiver_axis_only` all land at ~50% (not just that the checks pass, but that the numbers
   are genuinely close to 50%, not inflated by a loose bound). Also independently verify by hand (or
   by writing your own quick check) that NO row or column of either 2x2 table is constant — i.e. that
   reading only one axis never lets a smart (majority-predict) strategy exceed 50% in any single
   movement.
2. Also verify the realism of the two "off-diagonal repeat" cells specifically:
   `(support, not_adjustable) -> height` for standup, and `(endurance, caregiver_no) -> cane` for
   walk. The design's stated justification is that seat/bed height affects standing effort regardless
   of root cause, and that a cane reduces gait energy cost regardless of root cause (both framed as
   real biomechanical relationships, not fabricated statistics). Judge whether this justification is
   genuinely defensible or feels like a math-driven retrofit that strains plausibility for a
   10-12-year-old audience — if the latter, say so as a finding (severity per your judgment; this is a
   real tension between exploit-resistance and narrative naturalness worth flagging even if not a
   full BLOCKER).
3. BLOCKER (situp overclaim) — v1's fact_sheet/scope_core/ae stated research.md "confirmed" situp is
   single-factor. Claimed fix: reworded across `fact_sheet_v2.json` (new uncertainties entry),
   `scope_core_v2.json`, `ae_v2.json`, `c_compression_v2.json`, `reference_research_v2.json` to state
   research.md simply did not discuss a second factor for this movement, framing the single-axis
   design as a deliberate simplification for the first/opening movement. Verify this reframing is
   actually present and accurate (re-check research.md yourself for situp's coverage) — and that NO
   remaining live field still asserts the stronger "confirmed single-factor" claim (grep across the
   whole current chain, not just the files claimed to be fixed).
4. HIGH (loose self-set threshold) — fixed via item 1's structural rework; verify the design-sim.mjs
   check bars are now fixed BEFORE measurement (not tuned to fit a result) and are at or below 0.6,
   matching this session's precedent.
5. HIGH (TEXT_ONLY_CONSEQUENCE) — claimed fix: `ae_v2.json`'s E and `game_translations_v2.json`'s t1
   now specify per-movement icon state changes (success = icon changes to a "can do" state,
   failure = icon stays unchanged) as visual world feedback alongside the text result. Verify this is
   concrete enough to implement and covers both success and failure for all 3 movements.

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-move-try/research.md` (to verify claim 3 yourself); then the full CURRENT
design chain (all `_v2.json`/`_v3.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-move-try/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE and RUN it).

Severity calibration: BLOCKER = a round-1 finding is not actually closed, or a NEW genuine exploit/
answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix before
implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to BLOCKER or
HIGH, say so plainly — a genuine, clean PASS is the expected outcome if the fixes hold up; do not
manufacture findings to justify another round.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"gate_h_specified":true|false,"mapping_jointly_necessary":true|false,
 "situp_claim_accurate":true|false,"threshold_precedent_matched":true|false,"visual_feedback_added":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","no_axis_constant_branch":true|false,
 "off_diagonal_cells_defensible":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
