You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 8 (final
confirmation round before a Human Decision) of the design review of the Legacy Q1 REBUILD
"legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報担当・実行委員会メンバー, gameType
reach_mix) -- design_iteration 3, translation t5-compare-candidate-plans. No repair or
redesign budget remains (repair_count 1/1, redesign_count 2/2).

**Context**: r7 (FAIL 35) found `corrections_stayed_within_narrowing_scope=true` (the
consistency-repair/fact-correct methodology from the prior Human Decision round was sound)
but caught 2 remaining propagation gaps (the same overclaim about the tie-break ranking
still present in `c_compression.json`'s compressed_C and `game_translations.json`'s adopted
t5 `job_reveal_bridge`, plus a stale `core_scope_check.json`) and raised ONE new finding:
once the overclaim about the tie-break's evidentiary basis is deleted, the fixed ordering
(flyer_plan > media_plan > sns_plan) that decides tied trap sessions has no remaining
stated justification -- r7's own reviewer explicitly said this needs a Human Decision
(accept as an explicit disclosed convention / find better evidence / redesign tie handling),
not another narrowing correction.

**This round's purpose**: confirm whether the 2 propagation gaps are now genuinely closed,
and confirm that the tie-break justification gap is the ONLY remaining substantive issue
(no other blocker/high survives) -- so the Human Decision the operator is about to request
is complete and accurate, not missing yet another finding.

**What changed since r7 (verify against the real files):**
1. `c_compression.json` (fact-correct, narrowing_only): compressed_C's "竹内2023の実測順位
   （チラシ＞テレビ・新聞＞SNS）をそのまま反映した" and "一般的な" were deleted.
2. `game_translations.json`'s adopted t5 `job_reveal_bridge` (fact-correct, narrowing_only):
   "という実在の確認業務を明示する" was deleted.
3. `core_scope_check.json` (consistency-repair, notes is unprotected): rewritten to
   reference the current file chain instead of stale v3/v5-era versions.
4. `design-sim.mjs` (free code edit): a second occurrence of the same overclaim in code
   comments (near `independentPlayerStrategy`) was corrected.
5. `core_back_check.json` (consistency-repair, notes is unprotected): rewritten to narrate
   r7's findings and this round's fixes accurately, including explicitly flagging the
   tie-break justification gap as pending Human Decision rather than claiming it's resolved.

Verify critically:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself -- confirm
   19/19 passing, identical numeric results to r7 (no logic changed, only comments).
2. Grep-style check: search the ENTIRE current chain (fact_sheet, scope_core, ae,
   core_scope_check, play_seeds, reference_research, c_compression, game_translations
   including ALL fields of the adopted t5 entry -- not just C_interaction/job_reveal_bridge
   -- first_5_seconds, no_manual_exploit_check, core_back_check) for ANY remaining claim
   that the flyer/media/SNS tie-break ordering was directly measured, general/universal, or
   otherwise more evidentially grounded than "an internal reference-card ranking, disclosed
   to the player, whose ordinal direction happens to track 竹内2023's single-event channel
   counts but whose application to these 3 composite plans is a game-side convention, not a
   documented measurement." Note: `no_manual_exploit_check.json` still contains the phrase
   "一般的な効果の強さの順位" in its protected fields (`contextual_cue_only`/
   `visual_hierarchy_leak`) -- this file's protected fields cannot be touched by EITHER
   consistency-repair (protected) NOR fact-correct (this artifact type is not in the eligible
   list at all) under the current mechanical rules. Assess whether this specific residual
   phrase is itself a genuine SOURCE_TRACEABILITY_MISMATCH-level problem (it only labels the
   card's general topic, unlike the other instances which asserted a specific measurement
   methodology) or acceptable as-is.
3. **Confirm (or refute) that the tie-break justification gap is now the ONLY substantive
   open issue**: read `design-sim.mjs`'s `OVERALL_STRENGTH_RANK` and its surrounding
   comments, and `game_translations.json`'s adopted t5 `C_interaction` reference-card text,
   one more time. Is there any way to characterize this fixed ordering that would NOT
   require a Human Decision -- e.g., is it already adequately covered by fact_sheet.json's
   `uncertainties` disclosure (which discloses that specific formulas/coefficients are
   game-side inventions preserving only ordinal direction)? Give your honest final judgment:
   does this specific instance (a decisive tie-break, not just flavor text) cross a
   materially different threshold than the general "numbers are disclosed abstractions"
   pattern already accepted elsewhere in this design, such that it specifically needs human
   judgment now?
4. Re-verify BRUTE_FORCE_SUCCESS, Gate G/H, profession_name_hidden_test, and
   first_5_seconds' mobile-layout concern (Plan C's copy length vs. the stated card-height
   budget, flagged HIGH in r6/r7) -- is this HIGH still open, and is it independent of the
   Human-Decision-bound tie-break question (i.e. could it in principle still be fixed
   mechanically, or does it also require new judgment)?
5. Verify CAUSAL_REALISM_ERROR and WORLD_FEEDBACK_QUALITY concerns from r5/r6 remain
   resolved and were not disturbed by this round's changes.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `design-review-r5.result.json`, `design-review-r6.result.json`, `design-review-r7.result.json`
   in full (most relevant recent history; r1-r4 available if needed for deeper context)
3. `factory/projects/legacy-reach-mix/research.md` in full
4. The full CURRENT design chain (all files at their current pipeline versions -- check
   `factory/projects/legacy-reach-mix/q1-pipeline.json` for exact current version numbers of
   each artifact type, then read the corresponding local file), plus `design/design-sim.mjs`
   (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem. HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. Be maximally precise about which findings (if any) are mechanically
fixable via narrowing/consistency-sync (name them, the operator will fix them immediately
and re-review) vs. which genuinely require a Human Decision (name exactly what judgment is
needed, since this becomes the primary input for that decision).

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"...","fixable_by_narrowing":true|false}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "propagation_gaps_closed":true|false,"tie_break_is_sole_remaining_issue":true|false,
 "causal_realism_honest":true|false,"world_feedback_adequate":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
