You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 9 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報担当・
実行委員会メンバー, gameType reach_mix) -- design_iteration 3, translation
t5-compare-candidate-plans. No repair or redesign budget remains (repair_count 1/1,
redesign_count 2/2) -- but this round's changes were made under a direct Human Decision, not
an autonomous repair/redesign attempt, so budget exhaustion does not block this round.

**Context**: r5-r8 repeatedly found that the fixed tie-break ranking used to resolve tied
plans (flyer_plan > media_plan > sns_plan, disclosed to the player via a permanent "reference
card") could have its overclaimed evidentiary language deleted via narrowing corrections, but
after each deletion, no adequate positive justification for the ranking itself remained --
r7/r8's reviewers explicitly said this specific gap could not be closed by more narrowing and
needed a genuine Human Decision (accept as fiction / find better evidence / rebuild tie
handling). A Human Decision (2026-09-12) resolved this by directing:

1. **Remove the fixed tie-break entirely.** Do not invent any replacement ranking or
   "game-convenient optimal solution." When today's audience + scenario facts make multiple
   of the 3 plans equally valid, the game must accept ANY of them as correct (multiple correct
   answers). The child's D remains exactly: "look at today's priority audience and situation,
   compare the 3 candidate plans, judge which one(s) fit today" -- no finer-grained tie-break
   is to be added.
2. **Propagate this removal autonomously** through the entire design chain (not just
   game_translations/design-sim, but scope_core, ae, c_compression, play_seeds,
   reference_research, first_5_seconds, no_manual_exploit_check, core_scope_check,
   core_back_check).
3. **Separately** (explicitly NOT a Human Decision item): redesign the mobile (375px)
   comparison UI so the child can see today's conditions (priority audience + 3 scenario
   facts) and the 3 plans without scrolling back and forth, WITHOUT changing the existing
   Game Translation's core D/mechanic and WITHOUT adding any new Home/reward/growth systems.

**What changed (verify against the real current files -- check
`factory/projects/legacy-reach-mix/q1-pipeline.json` for exact current version numbers first,
these are all newly submitted this round via plain `submit`, not consistency-repair/
fact-correct, since this is a legitimate authorized design change, not a narrowing-only fix):**

1. `design-sim.mjs`: `bestPlan()` (single winner, used `OVERALL_STRENGTH_RANK` to break ties)
   replaced with `bestPlanSet(session)` (returns the array of ALL planIds tied at the
   session's max `planFit` score -- length 1, 2, or 3). `sessionWin(session, pick)` now checks
   `bestPlanSet(session).includes(pick)`. `independentPlayerStrategy(session)` (derives an
   answer using ONLY player-visible facts, never calling bestPlanSet/planFit internally) now
   returns the SET of acceptable answers; `sameSet()` verifies it matches `bestPlanSet` on
   every session. Re-run this file yourself: `node
   factory/projects/legacy-reach-mix/design/design-sim.mjs` -- expect 20/20 PASS (one new
   check vs r7/r8's 19: `multi_answer_session_rate`), with
   `independent_strategy_matches_internal_oracle=1` and `legitimate_reasoning=1` still holding
   after the mechanic change. Compare the full numeric output against
   `design/design-sim-result.json` (regenerated this round) -- they must match exactly.
2. `scope_core_v8.json` / `ae_v8.json`: removed the tie-break decision rule from
   core/D/E; added explicit multi-answer-acceptance language citing this Human Decision.
   `core_scope_check_v8.json` re-verifies CORE/SCOPE consistency against these.
3. `game_translations_v13.json` (adopted t5): the permanent reference-card paragraph in
   `C_interaction` (which stated the fixed strength ranking and that it was the deciding
   factor in ties) was deleted entirely -- not narrowed, deleted, since the mechanism no
   longer exists. `goal`/`first_visible_state`/`primary_action`/`system_reaction`/
   `E_consequence`/`player_next_judgment` wording changed from "choose the single best-fitting
   plan" to "choose a valid plan (today's conditions may make more than one equally valid)".
   `strengths`/`weaknesses`/`risk`/`adoption_or_rejection_reason`/`adoption_rationale`
   rewritten to reflect the new mechanic and r9 sim numbers. A new persistent "comparison
   summary bar" (today's audience + 3 scenario facts, always visible, no open/close gate) was
   added to `first_visible_state`/`primary_action`/`D_externalization` -- verify this is
   presented as a UI/layout change only, NOT a new gameplay mechanic, reward, or Home feature.
4. `c_compression_v10.json`, `play_seeds_v6.json`, `reference_research_v8.json`: propagated
   the removal (reference_research_v8's revision_note explains why NO content change was
   needed there -- verify this claim is actually true by reading the file: does any reference
   item ground the flyer>media>sns cross-plan ordering, or only single-plan target-fit facts?).
5. `first_5_seconds_v7.json`: the old always-visible reference card (tie-break ranking) was
   deleted from the layout. In its place, a persistent sticky comparison summary bar (today's
   audience + 3 scenario facts, no open/close interaction, pinned to the top of the 375px
   viewport even while scrolling the 3 plan cards below) was added. The old disclosure gate
   (open audience card -> open 3 situation cards -> plan cards unlock) was replaced with a
   simpler gate (open all 3 plan cards -> confirm button unlocks), since audience/situation
   are now always visible rather than needing to be tapped open.
6. `no_manual_exploit_check_v7.json`: rewrote `operation_before_rules`, `contextual_cue_only`,
   `tap_all`, `fixed_failure_pattern`, `color_leak`, `label_leak`, `visual_hierarchy_leak` to
   remove all reference-card/tie-break content and reflect the new gate structure and sim
   numbers -- this file's fields were previously mechanically protected under
   consistency-repair/fact-correct and could NOT be touched by either path; they are freely
   rewritable now only because this is a legitimate `submit`, not a correction.
7. `core_back_check_v11.json`: narrates the full r5-r9 history and this round's resolution.

Verify critically:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself. Confirm 20/20
   PASS and that the numbers match `design-sim-result.json` exactly.
2. **Multi-answer acceptance, not a new invented rule**: confirm that NOTHING in the current
   chain re-introduces any form of tie-break, priority ordering, "in case of a tie prefer X",
   or other mechanism that would make the win condition resolve to a single answer when
   `bestPlanSet` has more than one element. Grep-style check the ENTIRE current chain
   (fact_sheet, scope_core, ae, core_scope_check, play_seeds, reference_research,
   c_compression, game_translations including ALL fields of the adopted t5 entry,
   first_5_seconds, no_manual_exploit_check, core_back_check) for ANY remaining trace of
   `OVERALL_STRENGTH_RANK`, "一番強く、次に", "最後の決め手", "参考カード" (reference card),
   or "タイブレーク" (tie-break) that is NOT clearly framed as historical/removed in a
   revision_note or adoption_rationale narrating past rounds.
3. **The child's D is unchanged**: confirm scope_core.core / ae.D still read as "look at
   today's priority audience and situation, compare 3 candidate plans, judge which fits" with
   NO added fine-grained tie-break judgment, and that this matches what
   game_translations.json's adopted t5 D_externalization/primary_action actually implements.
4. **Mobile UI is UI-only**: confirm the persistent comparison summary bar in
   first_5_seconds_v7.json / game_translations_v13.json is purely a layout/always-visible-info
   change, does not alter the adopted translation's core D_externalization gameplay loop
   (still: read 3 plan cards, pick one, confirm once), and does not introduce any new Home
   screen feature, reward, currency, or growth system. Confirm it is genuinely usable at
   375px width (check the stated dimensions for a sticky bar + 3 plan cards + confirm button
   are plausible without excessive scrolling or overlap).
5. Re-verify BRUTE_FORCE_SUCCESS, Gate G/H (play_seeds s4), profession_name_hidden_test, and
   CAUSAL_REALISM_ERROR / WORLD_FEEDBACK_QUALITY concerns from r5/r6 remain resolved and were
   not disturbed by this round's changes.
6. Confirm the DAG is fully consistent -- read
   `factory/projects/legacy-reach-mix/q1-pipeline.json` and confirm every artifact is CURRENT
   (no STALE), and that source_artifacts provenance make sense for the new versions.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `design-review-r5.result.json` through `design-review-r8.result.json` in full (most
   relevant recent history; r1-r4 available if needed for deeper context)
3. `factory/projects/legacy-reach-mix/research.md` in full
4. The full CURRENT design chain (check `factory/projects/legacy-reach-mix/q1-pipeline.json`
   for exact current version numbers of each artifact type, then read the corresponding local
   file), plus `design/design-sim.mjs` (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, a re-introduced arbitrary tie-break, or a genuine, substantively obvious/trivial-
choice problem. HIGH = a real defect that must fix before implementation. MEDIUM/LOW = polish.
Be maximally precise about which findings (if any) are mechanically fixable via
narrowing/consistency-sync vs. plain submit vs. which genuinely require a NEW Human Decision
(name exactly what judgment is needed).

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"...","fixable_by_narrowing":true|false}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "propagation_gaps_closed":true|false,"no_arbitrary_tie_break_reintroduced":true|false,
 "multi_answer_acceptance_correctly_implemented":true|false,"mobile_ui_is_layout_only":true|false,
 "causal_realism_honest":true|false,"world_feedback_adequate":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
