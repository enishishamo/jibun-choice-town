You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 2 of the design review for the
Legacy Q1 REBUILD "legacy-sow-and-grow" (農家・生産者、gameType sow_and_grow, 給食編), a
GAME_TRANSLATION_REBUILD after the OLD implementation was found memorize/brute-forceable
(factory/state/legacy/reverse-audits/sow_and_grow.json). Judge rigorously; do not soften because
of the repair history, and do not harden because of it either.

**Round-1 verdict** (factory/projects/legacy-sow-and-grow/design-review-r1.result.json): FAIL 38,
CA58/GQ38, 3 BLOCKERs, 2 HIGH, 2 MEDIUM, 1 LOW. Fixes claimed this round (verify each in code/data):
1. BLOCKER (ANSWER_LEAK) — the 3 varieties were renamed from あかね夏/ふゆみね/はるひな (which
   literally spell summer/winter/spring, directly revealing the answer once combined with
   non-overlapping season windows) to season-neutral fictional names つぶたね/まんまる/ことね
   (factory/projects/legacy-sow-and-grow/design/design-sim.mjs, game_translations_v3.json,
   no_manual_exploit_check_v4.json).
2. BLOCKER (C_NOT_NEEDED_FOR_D / CORE_DISTORTED_BY_GAME) — v2's three varieties covered three
   DIFFERENT non-overlapping seasons, so "today's month" alone always determined the single
   eligible variety (deadline/heat never actually changed the answer). v3 redesigns all 3 as
   summer-sowing (June-September) candidates with OVERLAPPING sub-windows (つぶたね window=[6,7],
   まんまる window=[6,7,8], ことね window=[8,9]) plus diversified harvest_days (90/125/135) and
   heat_ok (true/true/false), matching the real fukui-prefecture trial's actual comparison of
   愛紅/向陽二号/夏播用彩誉 (see reference_research_v3.json) — design-sim.mjs v3 reports
   at_least_two_varieties_seasonally_eligible_rate=75.11%, and season_only_heuristic (76.4%) now
   measurably underperforms legitimate_full_reasoning (100%, +23.6pt), proving deadline/heat
   genuinely decide the outcome in most sessions, not just confirm the season pick.
3. HIGH (FAILURE_DISGUISED_AS_SUCCESS, zero_winner_session_rate=39.32%) — design-sim.mjs v3 uses
   rejection sampling (deadlineOffsetMonths and forecastHot are redrawn, sowMonth kept fixed,
   until a winning variety exists) to guarantee zero_winner_session_rate=0 (verdict field
   rejection_sampling_never_exhausted=true across N=20000 sessions, max 200 resamples each).
4. HIGH (FACTUAL_PROFESSION_ERROR, invented per-variety numbers not traceable to sources, and a
   missing reference_research_v2.json) — fact_sheet_v3.json's uncertainties field now explicitly
   discloses that the 3 fictional varieties' specific day-counts/heat-tolerance are NOT
   individually sourced, only the qualitative PATTERN (early-vigor / standard-wide / late-
   specialist) is grounded in the real fukui trial's comparison of 愛紅/向陽二号/夏播用彩誉.
   reference_research_v3.json now exists and cites this explicitly.
5. MEDIUM (REACTION_DOES_NOT_TEACH_NEXT_ACTION, no in-session learning) — NOT changed this round
   (still single-shot commit, flat failure, no in-session retry) — the r1 reviewer flagged this as
   MEDIUM only, not a blocker to fix immediately; verify it is still only MEDIUM-severity given
   everything else that changed, not elevated by the other fixes.
6. MEDIUM (design-sim notes said "~34%" vs the actual 39.32%) — moot now since zero_winner_rate is
   exactly 0 and design-sim.mjs's own notes field states the true measured numbers verbatim; check
   there is no other now-stale rounded approximation left uncorrected.

Read, in this order: factory/rules/principles.md (BLOCKER list); factory/rules/q1-first-play-
standard.md; factory/state/legacy/reverse-audits/sow_and_grow.json; the CURRENT design files ONLY
— fact_sheet_v3.json, scope_core_v4.json, ae_v4.json, core_scope_check_v3.json, play_seeds_v3.json,
reference_research_v3.json, c_compression_v3.json, game_translations_v3.json (adopted entry
t1-season-deadline-match — the other 2 rejected entries are unchanged from r1, read them too),
first_5_seconds_v2.json, no_manual_exploit_check_v4.json, core_back_check_v2.json, design-sim.mjs
and design-sim-result.json — RUN IT YOURSELF (`node factory/projects/legacy-sow-and-grow/design/design-sim.mjs`)
and compare your output to the committed design-sim-result.json (they must match exactly). Do NOT
read fact_sheet_v1/v2, scope_core_v1/v2/v3, ae_v1/v2/v3, core_scope_check_v1/v2,
no_manual_exploit_check_v1/v2/v3, core_back_check_v1, first_5_seconds_v1, game_translations_v1/v2,
c_compression_v1/v2, reference_research_v1/v2, or design-review-r1-prompt.md's own claims as
current truth — only the CURRENT versions cited above and this round's fixes matter.

Verify specifically, with file:line evidence:
A. Is ANSWER_LEAK genuinely closed? Do つぶたね/まんまる/ことね (or any other displayed text —
   window ranges, card ordering as currently unimplemented, etc.) leak which one is right, beyond
   the legitimate information the child is meant to read and compare?
B. Is C_NOT_NEEDED_FOR_D genuinely closed? Re-derive the season-eligibility-count distribution
   yourself from the VARIETIES array in design-sim.mjs — do you agree ~75% of sessions have 2+
   seasonally-eligible varieties, and that deadline/heat meaningfully discriminate among them
   (not just eliminate an already-unique pick)? Is the remaining ~25% of sessions (single-eligible
   month, i.e. months where windows don't overlap) a problem, or an acceptable minority case where
   season alone correctly does the full job (real farming: sometimes only one option is even
   possible)?
C. Is the zero-winner fix (rejection sampling) legitimate design, or does it introduce a NEW
   subtle exploit/inconsistency (e.g., does the distribution of deadline/forecast become skewed in
   a way a clever player could exploit — for instance, does rejection sampling make forecastHot
   correlate suspiciously with which variety wins, in a way a repeat player could learn as a
   pattern rather than reasoning from the displayed numbers each time)? Also check: is there any
   possibility MAX_RESAMPLES=200 is exhausted for some (month) value, silently producing a biased
   or crashed session in production (verify rejection_sampling_never_exhausted programmatically,
   don't just trust the field).
D. Is the fictionalized-numbers disclosure (fact_sheet_v3.json's uncertainties, reference_research_v3.json)
   sufficient, or does this Factory's own precedent (see factory/rules/q1-autonomous-factory.md and
   how legacy-clue-join's fact_sheet handled fact-correct disclosures) require something stronger,
   e.g. not presenting invented day-counts as if they were closely tied to the real trial's numbers
   at all in the game_translations text?
E. Re-verify everything from round 1 that was not flagged is still true: honest partial/failure
   framing, no_manual convention, CORE/SCOPE representativeness, profession_name_hidden_test.
F. Any NEW defect introduced specifically by this round's fixes.

Severity calibration: BLOCKER = an r1 BLOCKER is not actually closed, or a new answer-leak/
brute-force/CORE-distortion exists. HIGH = a real defect that must fix before GAME_DESIGN_READY.
MEDIUM/LOW = polish, deferrable to implementation.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"answer_leak":true|false,"c_not_needed_for_d":true|false,
 "failure_disguised_as_success":true|false,"factual_grounding":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_matches_committed_result":true|false,
 "rejection_sampling_sound":true|false,"ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
