You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 5 of the design review for the
Legacy Q1 REBUILD "legacy-sow-and-grow" (農家・生産者、gameType sow_and_grow, 給食編). Judge
rigorously; do not soften because of the repair history, and do not harden because of it either.

**IMPORTANT — exact current file paths.** The authoritative source is
`factory/projects/legacy-sow-and-grow/q1-pipeline.json`'s `artifacts.<type>.file`. As of THIS
round, the CURRENT files are exactly:
- fact_sheet: design/fact_sheet_v4.json
- scope_core: design/scope_core_v4.json (pipeline version 7)
- ae: design/ae_v3.json (pipeline version 7)
- core_scope_check: design/core_scope_check_v3.json (pipeline version 6)
- play_seeds: design/play_seeds_v2.json (pipeline version 6)
- reference_research: design/reference_research_v5.json (pipeline version 6)
- c_compression: design/c_compression_v4.json (pipeline version 7)
- game_translations: design/game_translations_v5.json (pipeline version 7)
- first_5_seconds: design/first_5_seconds_v2.json (pipeline version 6)
- no_manual_exploit_check: design/no_manual_exploit_check_v5.json (pipeline version 6)
- core_back_check: design/core_back_check_v3.json (pipeline version 6)
Do not read any other version-numbered file for these types as current truth. A revision_note
field mentioning an OLDER version number (e.g. "design-sim.mjs v2の検証で...") is a legitimate
HISTORICAL record of what a past round found, not a live citation — only flag a version mention as
a problem if it is presented as describing CURRENT behavior/evidence, not history.

**Round-4 verdict** (factory/projects/legacy-sow-and-grow/design-review-r4.result.json): FAIL 64,
CA64/GQ70, 1 BLOCKER (ARTIFACT_CHAIN_INCONSISTENT), 0 HIGH, 1 MEDIUM (REACTION_DOES_NOT_TEACH_
NEXT_ACTION — already confirmed sound/non-blocking, carried forward unchanged, do not re-litigate
unless you find the earlier reasoning was actually wrong). Fixes claimed THIS round:
1. BLOCKER (ARTIFACT_CHAIN_INCONSISTENT) — r4 found two remaining problems: (a)
   fact_sheet_v3.json's expertise field said varieties differ in "収穫までの日数、暑さへの強さ"
   as if the cited Fukui source established this for all three, when the source only documents
   向陽二号's heat tolerance specifically. Fixed: fact_sheet_v4.json's expertise field now narrows
   the claim to say the source establishes only EARLY/LATE SOWING-TIMING differences among
   varieties, plus 向陽二号's heat tolerance specifically — and explicitly states 愛紅/夏播用彩誉's
   heat tolerance is NOT in the source. (b) several current files still contained live citations
   to superseded game_translations_v4.json / fact_sheet_v3.json instead of the new current v5/v4.
   Fixed: every live (non-historical) citation across the current 11-file chain now points to
   fact_sheet_v4.json and game_translations_v5.json — verify this yourself by grep'ing the current
   files for any remaining stale live citation (you are encouraged to actually run a search, not
   just spot-check a few files).

Read, in this order: factory/rules/principles.md; factory/rules/q1-first-play-standard.md;
factory/state/legacy/reverse-audits/sow_and_grow.json; the eleven CURRENT files listed above, in
pipeline order; design-sim.mjs and design-sim-result.json — RUN THE SCRIPT YOURSELF
(`node factory/projects/legacy-sow-and-grow/design/design-sim.mjs`) and diff its stdout against
the committed file (must be byte-identical).

Verify specifically, with file:line evidence:
A. Is fact_sheet_v4.json's expertise field now accurate and non-overreaching relative to its cited
   sources? Does it still support game_translations_v5.json's design (which needs SOME real-world
   grounding for the early/late sowing-timing trade-off, even though the specific day-counts and
   two of the three heat-tolerance assignments are explicitly fictional)?
B. Do a thorough live-citation sweep yourself across all eleven current files (and design-sim.mjs)
   for ANY remaining reference to a superseded artifact version presented as current fact/evidence
   — not just the two specific issues r4 named, but anything else of the same class you can find.
C. Re-verify everything from rounds 1-4 that was not flagged is still true, since this round
   touched fact_sheet content again: ANSWER_LEAK closed (variety names still season-neutral,
   nothing in the narrowed expertise text re-leaks anything), no_variety_dominates_any_multi_
   candidate_month still true, zero_winner_session_rate still 0, month_only_fixed_mapping still
   meaningfully below full reasoning, honest partial/failure framing, CORE/SCOPE
   representativeness, profession_name_hidden_test, the player-facing fictional-data disclaimer
   (now consolidated to one line) is still present and accurately worded given fact_sheet_v4's
   narrower claims.
D. Is this design chain now genuinely ready for GAME_DESIGN_READY / game_spec? If you find nothing
   rising to BLOCKER or HIGH, say so plainly — five rounds is a lot for a legacy rebuild and this
   should not become review-for-review's-sake; only raise MEDIUM/LOW for things that would
   genuinely help before implementation, and do not gate PASS on them.

Severity calibration: BLOCKER = a round-1/2/3/4 finding is not actually closed, or a new answer-
leak/brute-force/CORE-distortion/artifact-inconsistency exists. HIGH = a real defect that must fix
before GAME_DESIGN_READY. MEDIUM/LOW = polish, deferrable to implementation, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round4_findings_confirmed_closed":{"artifact_chain_consistent":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_byte_identical_to_committed_result":true|false,
 "full_citation_sweep_performed":true|false,"ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
