You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the DESIGN-STAGE
review of the NEW Q1 game "weather-forecaster" (気象庁の予報官). Round 1
(factory/projects/weather-forecaster/design/design-review-r1.result.json) returned FAIL (55;
CA68/GQ55; 0 blockers, 5 HIGH). Under the Q1 Autonomous Game Factory rules
(factory/rules/q1-autonomous-factory.md) this is the ONE local repair allowed for design iteration
1: if a genuine HIGH/BLOCKER remains, the pipeline must REDESIGN (different seed/translation) or
ESCALATE — it may not patch again. Judge accordingly, but do not be lenient because of that.

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md` (A-E definitions; BLOCKER 禁止事項). Replayability/mastery is PLUS
QUALITY only.

**Round-1 HIGH findings and what the producer claims to have changed (VERIFY EACH):**
1. Warning-issuance authority was FACT_CHECK_REQUIRED yet the core action + Job Reveal asserted
   "予報官が単独で発表". → A targeted fact check was run:
   factory/projects/weather-forecaster/design/fact_check_r1.json and an updated fact sheet
   fact_sheet_v2.json (new official sources). Check that the v2 A-E / translation / Job Reveal
   wording now matches what the sources actually support (team/organizational issuance, 解除
   criteria, 市町村長's 避難情報 as a separate decision) and that no still-uncertain item is used as a
   core mechanic.
2. "山の町ほど赤線が低い" as a fixed profession rule + terrain icon leaking the threshold. → v2
   uses neutral, explicitly displayed per-town 基準 values with no terrain implication. Verify in
   ae_v2.json, c_compression (unchanged?), game_translations_v2.json, first_5_seconds_v2.json.
3. Warning ⇒ automatic evacuation (mayor's judgment skipped). → v2 inserts the municipality's
   避難情報 as its own world state one step after the warning (state_table.json warning_rule).
   Verify E and the translation describe the real chain 警報 → 市町村の判断 → 住民の行動 and that the
   child's action is framed as the 気象台's issuance decision, not as moving residents.
4. Fictional deterministic "空振り → next warning believed 1 step late" rule. → removed; replaced by
   the same-night outcome rule (空振り counted in the morning tally; success tiers) in
   state_table.json outcome_rule. Verify no fictional social mechanic remains.
5. No state table / undefined win logic, so exploit claims were unverifiable. → state_table.json
   (3 paths × 6 steps × 4 towns, thresholds, starts, meter rule, lead time, cancel semantics,
   outcome tiers) + design-sim.mjs + design-sim-result.json. RE-RUN THE SIM YOURSELF
   (`node factory/projects/weather-forecaster/design/design-sim.mjs`) and read the code: does it
   faithfully implement the rules in state_table.json? Are the strategies it tests the right
   adversarial ones (never / warn-all-step-1 / warn-all-then-cancel-dry / warn-where-raining-now /
   warn-all-step-3 / all 7^4 fixed schedules)? Construct at least two additional content-blind or
   content-light strategies of your own (e.g. "warn every town at step 2", "warn any town whose
   meter ≥ half its line", "warn the two towns rained on at step 1 and nothing else", "warn
   everything that was rained on in the previous step") and state whether they win on all three
   paths under the table. Confirm a 満点 solution exists on every path and that the legitimate
   judgment (meter + line + current rain + 2-step lead) wins everywhere.

Read ALL current artifacts (v2 where present; v1 otherwise):
- fact_sheet.json, fact_sheet_v2.json, fact_check_r1.json, research-notes.md
- scope_core.json (v1 or scope_core_v2.json if present), ae_v2.json, core_scope_check_v2.json
- play_seeds.json, reference_research.json, c_compression.json
- game_translations_v2.json (adopted t1-storm-night), state_table.json, design-sim.mjs,
  design-sim-result.json
- first_5_seconds_v2.json, no_manual_exploit_check_v2.json, core_back_check_v2.json
- the pipeline record factory/projects/weather-forecaster/q1-pipeline.json (history, failure f-1)

Then evaluate fresh: CORE integrity, SCOPE representativeness, Profession Name Hidden Test, A-E
integrity, C necessity, D authenticity, C→D causality, active play, consequence, think-again,
honest outcome, job reveal, first 5 seconds (is "warn now vs observe" inferable from the first
visible state, given the retuned table where nothing crosses before step 4?), no-manual, answer
leak (color/label/position/visual hierarchy — the red line is the visible rule, is that acceptable
C or a leak?), select-all / tap-all / spam / fixed-failure exploits, CORE back-check, factual
accuracy, fun. Severity calibration as in round 1: BLOCKER = would fail §3 no matter how
implemented; HIGH = must fix before spec; implementation-only concerns = MEDIUM/LOW.

For each defect, name the failure code (factory/harness/q1-factory-schema.mjs FAILURE_ROUTES).

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"..."}],
 "sim_verification":{"reran":true|false,"faithful_to_state_table":true|false,"extra_strategies_tested":[{"name":"...","wins_all_paths":true|false}]},
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
