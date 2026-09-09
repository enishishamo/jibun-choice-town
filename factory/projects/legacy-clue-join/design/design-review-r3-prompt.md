You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 3 of the DESIGN-STAGE
review of the LEGACY REBUILD "legacy-clue-join" (医師, gameType `clue_join`), DESIGN ITERATION 2
(translation t1c-shuffled-commit-and-defend, after REDESIGN #1 of 2 allowed; repair budget 0/1
available in this new iteration). If this round finds a genuine HIGH/BLOCKER, the pipeline can
still repair once (iteration 2's own fresh repair budget) before a second redesign or escalation
would be needed. Judge rigorously; do not soften because of the repair/redesign history, and do
not harden because of it either.

**History**: Round 1 FAILED 52 (2 BLOCKERs: a content-blind category/position shortcut won the
evidence-selection-only mechanic 100%; the system revealed the diagnosis without the child ever
committing to one). The iteration-1 repair (1/1) added an explicit diagnosis-commit step, relabeled
evidence categories to 6 distinct names, mixed numeric/alarming-sounding patterns across required
and excluded cards, expanded diagnosis candidates 3→4, and flattened all wrong-attempt feedback —
but Round 2 FAILED 54 (2 NEW BLOCKERs): the reviewer found the correct diagnosis was STILL always
the first-displayed candidate and the correct evidence STILL always sat at fixed array positions
1,2,4,5 — a "pick candidate 1, pick positions 1,2,4,5" strategy won on try 1 with zero content
reading (factory/projects/legacy-clue-join/design/design-review-r2.result.json). Round 2 also found
2 HIGH: ae/play_seeds/c_compression still described 3 candidates and system-pointed contradictions
(inconsistent with the adopted translation); the asthma/pneumothorax sources were only described in
the review prompt text, never actually added to fact_sheet.json.

**This round's fix (REDESIGN #1, translation t1c-shuffled-commit-and-defend)**:
1. Diagnosis-card order and evidence-card order are now INDEPENDENTLY Fisher-Yates shuffled once
   per session (fixed within one night, re-shuffled only on a new case/restart) — mirrors the
   existing src/q1/clueBoardLogic.ts `shuffledVitals` precedent used for the exact same class of
   problem in the sibling ch1 chapter (already an approved pattern in this codebase).
2. fact_sheet_v3.json now actually contains all 4 candidate sources (日本呼吸器学会 成人肺炎診療
   ガイドライン2024, 日本心臓財団, 日本呼吸器学会 気管支喘息 citizen page, 日本呼吸器学会 気胸
   citizen page) AND a new `candidate_reference_cards` object with the EXACT, final wording and
   source for each of the 4 diagnosis candidate cards — this is now the single source of truth that
   game_translations/game_spec must reference verbatim (do not accept paraphrased or diverging card
   text at implementation time).
3. ae_v3/c_compression_v3/play_seeds_v4 updated to describe 4 candidates and flat feedback
   consistently (no more stale "3 candidates" / "system points at a specific contradiction" text).
4. design-sim.mjs rewritten again: models many independent per-session shuffles and re-runs the
   REVIEWER'S OWN r2 strategy (first-displayed diagnosis + evidence positions 1,2,4,5, both single-
   try and 2-try-cycled) against them — RE-RUN IT YOURSELF
   (`node factory/projects/legacy-clue-join/design/design-sim.mjs`) and check whether the measured
   rates actually match the claimed chance baselines (1/60 single-try, 1/30 cycled) rather than
   staying elevated. Also construct your OWN new adversarial strategy targeting the shuffle
   mechanism itself (e.g., does anything about HOW the shuffle is described allow predicting the
   post-shuffle position from pre-shuffle knowledge? Is a per-session shuffle exploitable if a
   determined player just restarts repeatedly hoping for an easy layout, since restart is free and
   unlimited before the first submit?).

**File version discipline:** read ONLY the exact current files (each has exactly one CURRENT
version; `factory/projects/legacy-clue-join/q1-pipeline.json` `.artifacts.<type>.file` is the
source of truth):
- factory/projects/legacy-clue-join/design/fact_sheet_v3.json
- factory/projects/legacy-clue-join/design/scope_core_v2.json
- factory/projects/legacy-clue-join/design/ae_v3.json
- factory/projects/legacy-clue-join/design/core_scope_check_v2.json
- factory/projects/legacy-clue-join/design/play_seeds_v4.json
- factory/projects/legacy-clue-join/design/reference_research_v2.json
- factory/projects/legacy-clue-join/design/c_compression_v3.json
- factory/projects/legacy-clue-join/design/game_translations_v6.json (adopted:
  t1c-shuffled-commit-and-defend — read THAT entry in full, and the top-level adoption_rationale;
  the OLD t1b entry is kept in the array only as REJECTED history with an updated rejection reason
  — do not confuse it with the current design)
- factory/projects/legacy-clue-join/design/first_5_seconds_v4.json
- factory/projects/legacy-clue-join/design/no_manual_exploit_check_v4.json
- factory/projects/legacy-clue-join/design/core_back_check_v4.json
- factory/projects/legacy-clue-join/design/design-sim.mjs and design-sim-result.json (RE-RUN)
- factory/projects/legacy-clue-join/q1-pipeline.json (`failures` f-1, f-2, `redesign[0]`, `history`)
- factory/state/legacy/reverse-audits/clue_join.json (the reverse audit that classified this rebuild)
- Context only: src/q1/DiagnoseGame.tsx (current shipped implementation being replaced);
  src/q1/ClueBoardGame.tsx, src/q1/clueBoardLogic.ts (sibling ch1, the shuffledVitals precedent);
  src/data/content/medical.ts (med-doctor/med-lab/med-radio/med-diagnose entries)

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md`. Replayability/mastery is PLUS QUALITY only (§4 of the standard).

Verify specifically, with evidence:
1. Are BOTH round-2 BLOCKERs genuinely closed? Re-run the sim; try to construct your OWN
   position/order/timing-based strategy the sim didn't test. Is there any way the shuffle could be
   predictable or absent in some state (e.g., after a restart, after a partial outcome, on first
   load vs. subsequent loads)?
2. Are the round-2 HIGH findings closed: does fact_sheet_v3 actually contain all 4 sources with
   exact citable card text, and are the claims in candidate_reference_cards a fair, non-overstated
   reading of what those citizen-facing pages say? Are ae/c_compression/play_seeds now fully
   consistent with the adopted t1c translation (4 candidates, flat feedback, no stale 3-candidate
   language)?
3. Is the previously-flagged ~51% theoretical residual (evidence-exact-but-diagnosis-blind-cycled)
   still present and, now that the position leak is closed, is it still just a theoretical bound
   requiring the hard sub-problem to already be solved, or does it become practically reachable in
   some way you can construct?
4. Fresh full pass regardless of history: was this REDESIGN faithful to the GAME_TRANSLATION_REBUILD
   classification (did it stay within translation-stage changes, or drift into redesigning CORE/
   SCOPE/A-E beyond what this rebuild classification should touch — note ae/c_compression WERE
   edited this round, check whether those edits are legitimate consistency fixes or scope creep),
   Profession Name Hidden Test, C necessity, D authenticity, C→D causality, answer leaks, honest
   outcome, retry/think-again gate (§2 gate G), no instruction line, factual accuracy, consistency
   with ch1-3 values (src/q1/clueBoardLogic.ts), 375px legibility for 10 cards + submit button
   (still unverified pending implementation — is design-stage information about it sufficient to
   proceed to spec, or does layout ambiguity itself constitute a defect at this stage?), fun (§5).
5. For each defect, name the pipeline failure code and severity, and say explicitly whether it is
   a §3 RELEASE BLOCKER-class defect or a polish item.

Severity calibration: BLOCKER = would fail §3 no matter how implemented; HIGH = must fix before
spec; implementation-only concerns = MEDIUM/LOW.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","fixable_by_local_repair":true|false}],
 "round2_findings_confirmed_closed":{"position_leak_closed":true|false,"artifact_chain_consistent":true|false,"factual_grounding_adequate":true|false},
 "redesign_stayed_within_translation_scope":true|false,
 "sim_verification":{"reran":true|false,"position_strategies_match_chance_baseline":true|false,"own_adversarial_strategy":"...","notes":"..."},
 "gate_bypass_found":true|false,
 "e_closes_inside_own_authority":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
