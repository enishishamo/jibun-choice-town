You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 13 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報担当・
実行委員会メンバー, gameType reach_mix) -- design_iteration 3, translation
t5-compare-candidate-plans. No repair or redesign budget remains (repair_count 1/1,
redesign_count 2/2) -- but r9-r12 and this round's changes were made under a direct Human
Decision (2026-09-12) plus straightforward implementation-level fixes of prior rounds'
findings, not autonomous repair/redesign attempts, so budget exhaustion does not block this
round.

**Context**: r12 (score 70, NO blockers) confirmed every substantive design/mechanic property
was correctly implemented (multi-answer model, mobile UI, outcome-differentiated feedback,
first-play gate, CAUSAL_REALISM_ERROR fully resolved including strengths). It found only 2
remaining HIGH propagation gaps (both SOURCE_TRACEABILITY_MISMATCH) and 1 MEDIUM
self-inflicted regression, all fixed this round:

1. **SOURCE_TRACEABILITY_MISMATCH (HIGH)**: `scope_core_v8.json` and `reference_research_v8.json`
   still described Takeuchi 2023's data as "竹内2023の実測順位" (a measured reach ranking) even
   after `fact_sheet` had already been corrected to describe it as self-reported
   information-source survey counts. Fixed to say "竹内2023の来場者アンケートにおける情報源とし
   ての回答数の順位" consistently in `scope_core_v9.json` and `reference_research_v9.json`.
2. **SOURCE_TRACEABILITY_MISMATCH (HIGH)**: `fact_sheet`'s `expertise[0]` and the adopted
   translation's Plan A card copy conflated the actual SURVEYED category ("チラシ", the only
   thing the N=334 survey measured) with the game's own composite plan name ("チラシ・掲示",
   which bundles flyer distribution with physical bulletin-board posting at schools/daycares).
   Fixed in `fact_sheet_v8.json` and `game_translations_v17.json` to explicitly separate: the
   survey measured only "チラシ" as an information source; the school/daycare
   distribution-and-posting practice is a separately-documented fact (not part of the survey's
   measured category), and the game's plan bundles both as a design simplification.
3. **STALE_ARTIFACT_REFERENCE (MEDIUM, self-inflicted)**: `core_back_check_v14.json`'s r11 fix
   had declared "we will stop hardcoding version numbers" and then, two sentences later,
   hardcoded one anyway ("scope_core.json（v8）"). Removed in `core_back_check_v15.json`.

**Given this game_id's history (recurring propagation gaps have needed r6, r7, r8, r9->r10,
r10->r11, r11->r12 -- six consecutive rounds of "fix in one place, miss a sibling") --
be exhaustive.** Specifically check:

1. Grep the ENTIRE current chain (fact_sheet, scope_core, ae, core_scope_check, play_seeds,
   reference_research, c_compression, game_translations including EVERY field of the adopted
   t5 entry, first_5_seconds, no_manual_exploit_check, core_back_check) for:
   a. Any remaining "実測順位"/"実測到達数"/"実測済みの経路" (or equivalent) describing
      Takeuchi 2023 as a direct reach measurement rather than a self-reported survey result.
   b. Any remaining place where "チラシ" (the measured survey category) and "チラシ・掲示" (the
      game's composite plan name) are used interchangeably as if both were directly measured.
   c. Any other hardcoded upstream version number in a "notes"/current-state field that could
      go stale on the next resubmission (not just the one instance fixed this round -- check
      ALL "notes" fields in core_scope_check, core_back_check, and anywhere else version
      numbers appear outside of revision_note/adoption_rationale changelogs, which are
      supposed to cite specific historical versions and are fine as-is).
   d. Any reintroduced fixed tie-break, ranking, or standalone reference-card UI element.
   e. Any remaining audience-side reaction/engagement claim tied to plan correctness
      (CAUSAL_REALISM_ERROR class).
2. Read `research.md` §2/§3 yourself and confirm the corrected framing in `fact_sheet_v8.json`
   (chirashi as the measured survey category; school/daycare distribution as a separate
   documented fact) is actually accurate to what research.md itself states -- don't just trust
   the artifact's self-description.
3. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself -- confirm still
   20/20 PASS, results IDENTICAL to all prior rounds since r9 (design-sim.mjs has not been
   touched). Compare against `design-sim-result.json`.
4. Re-verify BRUTE_FORCE_SUCCESS closed, Gate G/H (play_seeds s4) specified,
   profession_name_hidden_test passes, WORLD_FEEDBACK_QUALITY outcome-differentiated,
   FIRST_PLAY_INTERACTION_CONTRADICTION resolved, multi-answer model correctly implemented,
   mobile UI is layout-only.
5. Confirm the DAG is fully consistent -- read
   `factory/projects/legacy-reach-mix/q1-pipeline.json` and confirm every artifact is CURRENT
   (no STALE) with sensible source_artifacts provenance.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `design-review-r5.result.json` through `design-review-r12.result.json` in full (most
   relevant recent history; r1-r4 available if needed for deeper context)
3. `factory/projects/legacy-reach-mix/research.md` in full
4. The full CURRENT design chain (check `factory/projects/legacy-reach-mix/q1-pipeline.json`
   for exact current version numbers of each artifact type, then read the corresponding local
   file), plus `design/design-sim.mjs` (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, a re-introduced arbitrary tie-break, or a genuine, substantively obvious/trivial-
choice problem. HIGH = a real defect that must fix before implementation. MEDIUM/LOW = polish.
If this design is genuinely ready (no blockers, no highs, the recurring propagation-gap
pattern has actually terminated), say so plainly -- this game_id does not need to chase
diminishing polish items forever, and a clean PASS is the expected outcome once the
substantive issues (all now resolved per r12) and their propagation (addressed this round)
are verified complete.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"...","fixable_by_narrowing":true|false}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","design_sim_numbers_unchanged":true|false,
 "brute_force_closed":true|false,"propagation_gaps_closed":true|false,
 "no_arbitrary_tie_break_reintroduced":true|false,"multi_answer_acceptance_correctly_implemented":true|false,
 "mobile_ui_is_layout_only":true|false,"world_feedback_outcome_differentiated":true|false,
 "first_play_gate_contradiction_resolved":true|false,"causal_realism_honest":true|false,
 "source_traceability_honest":true|false,"reference_card_description_consistent":true|false,
 "no_stale_version_references_remain":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
