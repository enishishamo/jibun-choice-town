You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the DESIGN-STAGE
review of the NEW Q1 game "leak-detective" (水道の漏水調査員 — a water utility's leak-detection
surveyor), design_iteration 1, under the Q1 Autonomous Game Factory
(factory/rules/q1-autonomous-factory.md). You are the only independent reviewer; the design
author (Claude) must not self-approve. Judge rigorously.

**File version discipline:** read ONLY the exact files listed below (each artifact type has exactly
one current file; `factory/projects/leak-detective/q1-pipeline.json` `.artifacts.<type>.file` is
the source of truth and already matches this list):

- factory/projects/leak-detective/selection.md (why this profession was chosen, and the specific
  failure mode of the previous NEW Q1 — weather-forecaster — that this design was built to avoid:
  an E that depends on another agency's discretionary judgment)
- factory/projects/leak-detective/design/fact_sheet.json (45 sources; note `uncertainties` — 14 FACT_CHECK_REQUIRED items)
- factory/projects/leak-detective/design/scope_core.json
- factory/projects/leak-detective/design/ae.json
- factory/projects/leak-detective/design/core_scope_check.json
- factory/projects/leak-detective/design/play_seeds.json (3 seeds)
- factory/projects/leak-detective/design/reference_research.json
- factory/projects/leak-detective/design/c_compression.json
- factory/projects/leak-detective/design/game_translations.json (adopted_translation_id: t1-night-listening)
- factory/projects/leak-detective/design/state_table.json (the numeric rules the implementation must reproduce)
- factory/projects/leak-detective/design/design-sim.mjs and design-sim-result.json — RE-RUN IT
  YOURSELF: `node factory/projects/leak-detective/design/design-sim.mjs` (it is read-only apart from
  rewriting its own result file; if writing fails in your sandbox, compare against the committed result)
- factory/projects/leak-detective/design/first_5_seconds.json
- factory/projects/leak-detective/design/no_manual_exploit_check.json
- factory/projects/leak-detective/design/core_back_check.json

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md` (A-E definitions; BLOCKER 禁止事項). Replayability/mastery is PLUS
QUALITY only (§4) — do not fail the design because a second play would remember the layout.

Verify specifically, with evidence:
1. CORE/SCOPE integrity and the Profession Name Hidden Test. Is the SCOPE (night road-surface
   listening + night-minimum-flow valve isolation -> decide where to dig) genuinely representative
   of the CORE per fact_sheet.json representative_duties 2-3 / decisions 2,4,6? Is anything in
   scope_core/ae a "peripheral job task" dressed up as the core?
2. FACTUAL ACCURACY against fact_sheet.json. In particular: (a) "the sound is loudest directly
   above the leak" (東京都水道局) vs "low tone only means the leak is farther" (a WaQuAC
   practitioner document citing a manual the researcher could not retrieve — see uncertainties #2):
   does the design treat the latter with appropriate caution, or does it present an unverified
   heuristic as fact to the child? (b) The valve simplification ("one valve isolates one street")
   vs real valve spacing — is it an honest simplification or a factual error? (c) Night-time
   surveying: some utilities survey day and night (uncertainties #9) — is the SCOPE wording
   honest? (d) The E claim: "the bureau's repair crew fixes it" — check adjacent_profession_boundaries
   and who_or_what_they_serve: is the dig→repair→leak-stops chain genuinely inside the water
   bureau's own authority for a road-side leak, with NO other organisation's discretionary
   judgment in between? This is the exact structure weather-forecaster failed on five times;
   scrutinise it hard. If the design overclaims what the surveyor personally does (e.g. digging),
   say so and give the failure code.
3. A-E integrity, C necessity, D authenticity, C->D causality: re-run design-sim.mjs and confirm
   `verdict.legitimate_strategy_wins_every_case`, `no_content_blind_strategy_wins_reliably`,
   `flow_without_listening_is_not_enough`, `every_case_solvable_within_budgets` are all true.
   Then construct your OWN adversarial strategy that the sim does not include (e.g. exploiting
   that the leak is always directly under a listening point; exploiting the traffic street's
   `level = max(level,3)` rule; exploiting the 1-decimal flow display; listening only at
   points 2 and 5 of every street with 6 listens then digging the loudest) and state its
   win rate or reasoning. Is `flow_then_random_dig` at 29.3% an acceptable "content-light"
   shortcut, or a §3 BLOCKER ("Cを使わなくても突破できる")?
4. ANSWER LEAKS on first play: map (no wet patch/leak mark), equal-looking points and valves,
   distractor points not visually distinguished, the report card wording, the "正常ならここ"
   gauge mark, the dig button. Anything that tells the child where to dig without using C?
5. CONSEQUENCE / HONEST OUTCOME / THINK AGAIN: is E a visible world-state change (puddle gone,
   needle back, water spraying from the crack) and is the miss outcome honestly different
   (partial, "next night")? Is there a real think-again step between dig 1 and dig 2?
6. FIRST 5 SECONDS / NO MANUAL (first_5_seconds.json): is the first touch inferable from
   contextual cues alone? Is the one-line cue acceptable or is it a rules explanation?
7. Complexity for age 10-12 on a 375px phone: 4 streets x 6 points + 4 valves + a gauge + 3
   sound fields per reading + 3 budgets — is this too much state to track on first play? If so,
   say precisely what to cut and whether it is HIGH or MEDIUM.
8. FUN (§5): does reading the gradient and catching the fake sound feel like play, or like an
   explanation problem?
9. For each defect, name the pipeline failure code (factory/harness/q1-factory-schema.mjs
   FAILURE_ROUTES) and state whether it is fixable by a single local repair (wording/numbers/UI)
   or needs a different Game Translation.

Severity calibration: BLOCKER = would fail §3 no matter how implemented; HIGH = must fix before
spec; implementation-only concerns = MEDIUM/LOW.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","fixable_by_local_repair":true|false}],
 "sim_verification":{"reran":true|false,"all_verdict_flags_true":true|false,"own_adversarial_strategy":"...","notes":"..."},
 "e_closes_inside_own_authority":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
