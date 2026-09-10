You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 1 of the design review for the
Legacy Q1 REBUILD "legacy-layer-and-compare" (都市の暑さ分析・街づくりを考える仕事、gameType
layer_and_compare, 猛暑編).

**IMPORTANT — exact current file paths.** Authoritative source:
`factory/projects/legacy-layer-and-compare/q1-pipeline.json`'s `artifacts.<type>.file`. CURRENT
files (round 1 design; game_translations/first_5_seconds/no_manual_exploit_check/core_back_check
are already at "_v2" filenames because a design-sim.mjs check was added and cascaded through before
review even launched — there is no round-1 review result yet, so nothing here is a "fix" in the
review sense, just file hygiene):
- fact_sheet: design/fact_sheet_v1.json (pipeline version 2)
- scope_core: design/scope_core_v1.json (pipeline version 2)
- ae: design/ae_v1.json (pipeline version 2)
- core_scope_check: design/core_scope_check_v1.json (pipeline version 1)
- play_seeds: design/play_seeds_v1.json (pipeline version 1)
- reference_research: design/reference_research_v1.json (pipeline version 1)
- c_compression: design/c_compression_v1.json (pipeline version 1)
- game_translations: design/game_translations_v2.json (pipeline version 2)
- first_5_seconds: design/first_5_seconds_v2.json (pipeline version 2)
- no_manual_exploit_check: design/no_manual_exploit_check_v2.json (pipeline version 2)
- core_back_check: design/core_back_check_v2.json (pipeline version 2)

**Context.** This is a legacy rebuild. The OLD implementation (src/q1/UrbanHeatGame.tsx, being
fully replaced) had 3 hardcoded locations, one of which (B) was hardcoded `fixable: false` and
already had `heat: 0`, while the other two (A, C) were hardcoded `fixable: true` — applying the
single available countermeasure to A or C always worked, applying it to B never did, and a "別の
場所に置きなおす" button let the child retry in-place until they found a working location by
brute force. Reverse audit: `C_required: false`, `exploit: brute_force` (see
factory/state/legacy/reverse-audits/layer_and_compare.json).

The new design (translation t1-diagnose-and-fix) grounds itself in real 環境省/千代田区 sources
(read factory/projects/legacy-layer-and-compare/research.md — it is thorough, read it in full)
about actual heat-island causes (日射/舗装/風) and real countermeasures, each of which only
addresses a specific cause, with wind-blockage countermeasures being genuinely infeasible at a
single-point scale (city/district-scale only per 環境省's own technology datasheet). Each session
draws ONE of 2 archetypes (fix-sun: correct answer is the 日射-affected location + 街路樹・日除け;
fix-pavement: correct answer is the 舗装-affected location + 保水性・遮熱性舗装) plus two
always-present distractors (WIND — unfixable by any available tool — and FINE — nothing wrong).
The three roles are shuffled across three display slots each session. The child reads each
location's 日射/風/舗装 readings, picks ONE (location, countermeasure) pair, and commits once.

Read, in this order: factory/rules/principles.md; factory/rules/q1-first-play-standard.md;
factory/state/legacy/reverse-audits/layer_and_compare.json; factory/projects/legacy-layer-and-compare/
research.md (full); the eleven CURRENT files listed above, in pipeline order; design/design-sim.mjs
and design/design-sim-result.json — RUN THE SCRIPT YOURSELF
(`node factory/projects/legacy-layer-and-compare/design/design-sim.mjs`) and diff its stdout
against the committed design-sim-result.json (must match; the file write may fail harmlessly in a
read-only sandbox with a printed warning — compare stdout to the committed file directly in that
case).

Verify specifically, with file:line evidence:
A. Does design-sim.mjs's model genuinely require reading ALL THREE data axes (日射/風/舗装), not
   just one? Specifically scrutinize the claim that guaranteeing exactly ONE of {SUN, PAVEMENT} per
   session (never both) is what prevents a single-axis "always check 日射, apply shade" strategy
   from winning near 100% — re-derive this yourself. The check set now includes `fixed_slot*`,
   `random_pick`, `sun_axis_only_then_random`, `pavement_axis_only_then_random`,
   `avoids_wind_then_random`, `avoid_wind_then_fixed_shade`, `avoid_wind_then_fixed_water_pavement`,
   and `first_bad_looking_slot` — verify each of these actually tests a distinct, plausible
   low-effort strategy (not a strawman), and that none of them is silently capped by a bug rather
   than by the design (e.g. re-derive `avoid_wind_then_fixed_shade`'s ~25% by hand for at least one
   archetype). Is there STILL some OTHER single-axis or low-effort heuristic none of these cover,
   that could win suspiciously often?
B. Is the CORE (診断→対策選定) genuinely required, or does the model secretly reduce to something
   simpler (e.g., "just avoid the location whose reading looks different in TWO axes" — check
   whether WIND or FINE locations ever accidentally show 2+ "bad-looking" axes due to a data
   authoring mistake, which would let a naive "count anomalies" strategy stand out from genuine
   diagnosis)?
C. Answer leaks: does anything in game_translations_v1.json's `first_visible_state`/`C_interaction`
   or no_manual_exploit_check_v1.json risk leaking the answer through location naming, tool
   naming/iconography, or color/visual hierarchy? In particular, re-verify the
   no_manual_exploit_check's own caveat: if the "bad" reading on a fixable axis (日射=strong,
   舗装=asphalt) is shown with different visual emphasis than the "bad" reading on the unfixable
   axis (風=weak), a "just find the alarming-looking one" strategy could work even without matching
   cause to tool — does the current design commit to preventing this, and is it enforceable at
   spec/implementation time?
D. Single-shot-commit / no-retry justification: confirm play_seeds_v1's rejected s2 (matching the
   OLD implementation's retry loop) is correctly identified as the BRUTE_FORCE_SUCCESS risk, and
   that t1's design doesn't quietly reintroduce a retry path anywhere (check `retry_or_rethink` and
   the mission flow described in game_translations/first_5_seconds).
E. Profession/CORE authenticity: does the "個人の一手では直せない風" framing genuinely match
   research.md's cited source (環境省データシート表3.2, 風の道 as city/district-scale only), or is
   it an invented dramatic device not supported by the research? Does the SCOPE (街・猛暑) remain
   representative given how much of the real job (data collection, budget/条例手続き, multi-agency
   coordination) is necessarily out of scope for a 10-12-year-old's single mechanic?
F. Do your OWN citation sweep across all eleven current files plus design-sim.mjs for any stale or
   inconsistent cross-reference (this is round 1, so there should be none yet, but verify the
   `_v1`/pipeline-version numbers cited inside files, e.g. ae_v1.json's revision_note, actually
   match what q1-pipeline.json says is current).
G. Any other genuine defect: FACTUAL_PROFESSION_ERROR, CORE_DISTORTED_BY_GAME/PROSE, ANSWER_LEAK,
   BRUTE_FORCE_SUCCESS, ARTIFACT_CHAIN_INCONSISTENT, or anything else that would let this game ship
   with a defect a real reviewer should catch.
H. Is this design chain ready for GAME_DESIGN_READY / game_spec? If you find nothing rising to
   BLOCKER or HIGH, say so plainly — but this is a brand-new mechanic (not yet implemented or
   live-tested), so hold it to the same bar as legacy-load-and-route's round 1 (which correctly
   found 2 genuine HIGH-severity defects on a first pass); do not rubber-stamp a first draft.

Severity calibration: BLOCKER = a genuine answer-leak, brute-force path, or CORE distortion that
makes the game unplayable-as-intended. HIGH = a real defect that must fix before GAME_DESIGN_READY
(e.g. a strategy that wins suspiciously close to 100% without genuine diagnosis, per §A).
MEDIUM/LOW = polish, deferrable to implementation, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_matches_committed_result":true|false,
 "single_axis_exploit_genuinely_capped":true|false,"citation_sweep_clean":true|false,
 "ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
