You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 8 of the DESIGN-STAGE
review of the NEW Q1 game "leak-detective" (水道の漏水調査員), DESIGN ITERATION 3 (translation
t1c-night-listening-isolation).

**Why a round 8 exists.** Round 6 escalated (budgets exhausted); a human granted a ONE-TIME repair
budget extension `hd-1` scoped to the closed-segment silent state (see `human_decisions[hd-1]` and
`one_time_exception` in factory/projects/leak-detective/q1-pipeline.json). Round 7 (read
factory/projects/leak-detective/design/design-review-r7.result.json) FAILED 68 with two HIGH
findings INSIDE that scope: (1) a silent reading recorded while a segment was closed stayed cached
after reopen, so the point never returned to normal sound and could not be re-listened — hd-1
condition 3 unmet; (2) the silent state still rendered an empty waveform container. The human's
instruction attached to hd-1 says to re-escalate only for out-of-scope HIGH/BLOCKER, a Product
Identity issue, or a structural redesign, so this was handled as the FINAL repair under hd-1
(`one_time_exception.final_repair`, hard cap recorded). **If this round still finds a genuine
HIGH/BLOCKER — inside or outside the scope — the pipeline must ESCALATE.** Judge rigorously; do
not soften because of the history, and do not harden because of it either.

**Fixes claimed this round** (failure f-8 → REPAIR → repair-done):
- Rule (state_table.sound_reading.isolation_rule + silent_record_lifetime): a silent reading
  (level 0 / "silent") EXISTS ONLY WHILE ITS SEGMENT IS CLOSED. Reopening — the explicit free tap
  on the closed lid, or the implicit reopen when another valve is closed — DROPS the silent
  readings of that segment. Those points can then be listened to again; a new listen costs a
  listen (nothing is refunded). Reopening never recomputes a reading into sound by itself (the
  surveyor restores supply and listens again — no sound "starts" without a listen).
- Implementation (context): src/q1/leakLogic.ts `dropSilent` in `closeValve` (implicit reopen of
  the previously closed segment) and `openValve`; non-silent readings survive. Component:
  the silent branch renders ONLY the text 「静か（水が止まっている）」 — no strip element at all;
  the single `leak-wave` strip lives in the non-silent branch.
- design-sim v8: new verdict flag `silent_reading_exists_only_while_closed` (direct scripted
  check: close C → listen C5 = silent → reopen → C5 gone → listen C5 again = level 5 steady, two
  listens spent; implicit reopen variant too). All 8 flags true; legitimate flow_then_gradient
  600/600; 306/306 solvable (worst 4 listens / 2 valve ops); forgets-reopen 33.2%; valves-ignored
  gradient 23.0%; loudest-any/steady 26.2%; two-distinct-reports 34.7%; random 9.8%; think-again
  gate 200/200/200.
- gameplay-qa-leak.mjs 48/48: 3 new regressions (explicit reopen drops silent + re-listen gives
  the real level with listens=2; implicit reopen drops it; non-silent records survive), an
  invariant across every simulated play (a silent reading's segment == the currently closed
  segment, 0 violations), and a source check that the only waveform strip is in the non-silent
  branch. Build and lint clean. 375px live check: close → listen → text only (no `.leak-wave`
  element in the DOM) → reopen → the point shows as unheard again → listen → bars + waveform.
- Docs: game_translations_v10 (t1c system_reaction / information_gained / weaknesses / risk),
  first_5_seconds_v8, no_manual_exploit_check_v8 (adds `silent_as_information`: silence carries no
  information beyond what the flow meter already showed; a silent listen counts as a "new listen"
  for the think-again gate but costs a listen like any other), core_back_check_v8.
- Round-7 MEDIUM (label size / budget wording outside the strict 4-item list): recorded in the
  pipeline as part of the r6-identified prepared fix the human approved in the escalation text
  ("a larger label; one wording fix"); not reverted. Confirm or contest this reading.

**File version discipline:** read ONLY the exact files below (each artifact type has exactly ONE
current file; `factory/projects/leak-detective/q1-pipeline.json` `.artifacts.<type>.file` is the
source of truth and matches this list). Do NOT read lower-numbered versions.

- factory/projects/leak-detective/design/fact_sheet.json (v1)
- scope_core_v2.json, ae_v3.json, core_scope_check_v3.json, play_seeds_v3.json,
  reference_research_v3.json, c_compression_v3.json (unchanged since r4)
- factory/projects/leak-detective/design/game_translations_v10.json (adopted:
  t1c-night-listening-isolation — read THAT entry)
- factory/projects/leak-detective/design/state_table.json (EDITED: sound_reading.isolation_rule,
  sound_reading.silent_record_lifetime, continuity_feedback.silent, valve_model.reopen)
- factory/projects/leak-detective/design/design-sim.mjs and design-sim-result.json (EDITED v8 —
  RE-RUN IT YOURSELF: `node factory/projects/leak-detective/design/design-sim.mjs`; if the result
  write fails in your sandbox, run the same logic without the write and compare)
- factory/projects/leak-detective/design/first_5_seconds_v8.json
- factory/projects/leak-detective/design/no_manual_exploit_check_v8.json
- factory/projects/leak-detective/design/core_back_check_v8.json
- factory/projects/leak-detective/q1-pipeline.json (`failures` f-1..f-8, two `redesign`
  entries, `human_decisions[hd-1]`, `one_time_exception` incl. `final_repair`)
- Context only: src/q1/leakLogic.ts, src/q1/LeakTraceGame.tsx, factory/harness/gameplay-qa-leak.mjs
  (RUN IT: `node factory/harness/gameplay-qa-leak.mjs`, expect 48 passed)

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md`. Replayability/mastery is PLUS QUALITY only (§4).

Verify specifically, with evidence:
1. Are both round-7 HIGHs genuinely closed? (a) After an explicit reopen AND after an implicit
   reopen, is there any path by which a silent reading survives on an open segment (the QA
   invariant, the sim flag, the code)? Can the point be listened to again and does it then show
   the real reading? Is the "no refund" rule consistent with the budgets model? (b) Is the silent
   rendering free of any strip/bar/motion/continuity-word element? Any remaining physical
   contradiction a 10-12 year old could notice (e.g. what the records strip and timeline show
   after a reopen)?
2. Dropping the silent record instead of recomputing it: is that the physically honest choice
   (no sound without a listen) and does it create any new answer leak or exploit (e.g. does the
   disappearance of a record reveal anything about the leak? — the flow meter already told the
   child which segment was closed)? Construct your own adversarial strategy and state its win
   rate or reasoning.
3. Think-again gate: a silent listen counts as a "new listen" and unlocks the second report while
   costing a listen. Is that acceptable under §3 (evidence-only gate) or a defect? Say which and
   why, with the severity you would assign.
4. Confirm the repair stayed INSIDE the hd-1 scope (dedicated silent state, no sound elements on a
   closed segment, normal sound after reopen via re-listen, no change to C→D→E / adopted
   translation mechanics / control structure / Art / Product Identity). If anything outside that
   scope changed, report it as a defect and say whether it is structural.
5. Fresh full pass regardless of history: CORE/SCOPE representativeness, Profession Name Hidden
   Test, A-E integrity, C necessity, D authenticity, C->D causality, answer leaks (map, points,
   valves incl. the lid label, focus buttons, report card, gauge mark, house-window blink, the
   silent text, the disappearing record), honest outcome, no instruction line, factual accuracy
   against fact_sheet.json, 375px legibility (legibility_rules incl. the no-scroll target), fun (§5).
6. For each defect, name the pipeline failure code and severity, and say explicitly whether it is
   a §3 RELEASE BLOCKER-class defect or a polish item, and whether it is inside or outside the
   hd-1 scope.

Severity calibration: BLOCKER = would fail §3 no matter how implemented; HIGH = must fix before
spec; implementation-only concerns = MEDIUM/LOW.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","fixable_by_local_repair":true|false,"inside_hd1_scope":true|false}],
 "round7_findings_confirmed_closed":{"silent_reading_only_while_closed":true|false,"no_waveform_element_when_silent":true|false},
 "repair_stayed_inside_hd1_scope":true|false,
 "silent_listen_unlocks_gate_verdict":"acceptable|defect",
 "sim_verification":{"reran":true|false,"all_eight_flags_true":true|false,"own_adversarial_strategy":"...","notes":"..."},
 "e_closes_inside_own_authority":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
