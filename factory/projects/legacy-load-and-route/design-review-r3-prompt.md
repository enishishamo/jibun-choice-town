You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 3 of the design review for the
Legacy Q1 REBUILD "legacy-load-and-route" (給食食材の配送員、gameType load_and_route, 給食編).

**IMPORTANT — exact current file paths.** Authoritative source:
`factory/projects/legacy-load-and-route/q1-pipeline.json`'s `artifacts.<type>.file`. CURRENT files:
- fact_sheet: design/fact_sheet_v3.json (pipeline version 4)
- scope_core: design/scope_core_v3.json (pipeline version 5)
- ae: design/ae_v3.json (pipeline version 5)
- core_scope_check: design/core_scope_check_v4.json (pipeline version 4)
- play_seeds: design/play_seeds_v3.json (pipeline version 4)
- reference_research: design/reference_research_v4.json (pipeline version 4)
- c_compression: design/c_compression_v3.json (pipeline version 4)
- game_translations: design/game_translations_v3.json (pipeline version 4)
- first_5_seconds: design/first_5_seconds_v3.json (pipeline version 4)
- no_manual_exploit_check: design/no_manual_exploit_check_v3.json (pipeline version 4)
- core_back_check: design/core_back_check_v3.json (pipeline version 4)
A revision_note describing what a PAST version was consistent with at the time it was written
(e.g. "v1: fact_sheet_v1.jsonの一次資料に基づき..." or "v2: ...design-sim.mjs v2の実測値に更新")
is legitimate history, not a stale live citation — only flag a version mention if it describes
CURRENT behavior/evidence as if that version were still current.

**Round-2 verdict** (factory/projects/legacy-load-and-route/design-review-r2.result.json): FAIL 62,
CA62/GQ78, 1 BLOCKER (CORE_DISTORTED_BY_GAME — round-1's fix was not actually closed), 0 HIGH,
0 MEDIUM, 2 LOW. Fix claimed this round (verify yourself, this is the only substantive change):

**The BLOCKER, precisely:** 厚生労働省's storage-temperature thresholds are all upper bounds
("◯℃以下" = "at or below ◯℃"). Round-1's repair split a single "cold" zone into cold5 (raw_fish)
and cold10 (raw_meat/milk), but then modeled the two as MUTUALLY EXCLUSIVE categories — the round-2
reviewer found that design-sim.mjs's `zoneWin` required an EXACT zone match per food, so placing
raw_meat/milk in cold5 (colder than their 10℃-or-below requirement, hence still safe) was scored as
a FAILURE. That contradicts the fact_sheet's own cited source table (10℃ is a ceiling, not a band)
and the reviewer's own evidence: `conflates_cold5_and_cold10=0.2142` was measuring a strategy that
places ALL cold items in cold5 (i.e. the safe, correct direction) as 78.6% wrong — an artifact of
the invented exclusivity rule, not a real necessity of C.

**The fix, implemented in design-sim.mjs v3 (and cascaded through the full design chain as v3/v4):**
1. Each food in `FOODS` now has a `validZones` array (every zone that satisfies its real threshold)
   instead of a single `zone`: raw_fish -> `["cold5"]` (5℃ is strictly tighter than 10℃, so cold10
   does NOT satisfy it); raw_meat/milk -> `["cold5", "cold10"]` (both satisfy "10℃以下"); frozen
   items -> `["frozen"]`; ambient items -> `["ambient"]`.
2. `zoneWin` now checks `f.validZones.includes(placement[f.id])` instead of exact equality.
3. The exploit-relevance check is redefined to what actually violates a real threshold:
   `treats_all_cold_items_as_cold10` (ignoring fish's stricter limit, placing fish/meat/milk all in
   cold10) — verify this fails whenever a session draws raw_fish (should be close to 50%, since
   P(draw includes raw_fish out of 4-of-8) = 1 - C(7,4)/C(8,4) = 0.5).
4. A new sanity check `treats_all_cold_items_as_cold5` (always picking the colder, safer zone for
   cold-appropriate items) is verified to be a LEGITIMATE strategy — it should win 100% of the time,
   proving the game no longer punishes a food-safety-correct "when in doubt, go colder" judgment.
5. Round-2's LOW finding (`route_zero_winner_rate` was a hand-typed literal `0`) is also fixed:
   design-sim.mjs now enumerates all 3 route archetypes × 2 mirror states (the only 6 possible
   sessions) and computes+asserts (throws if violated) that each has exactly one valid order.
6. Round-2's other LOW finding (game_translations' `information_gained` implied the correct
   placement/order is learned even on failure) is fixed: `information_gained` for t1 is now written
   as two explicit branches (success reveals nothing more than "it worked"; failure reveals nothing
   at all about which part was wrong).
7. fact_sheet_v3.json's `expertise`/`decisions`/`uncertainties` were rewritten to state the
   upper-bound-compliance rule explicitly (colder is always safe; fish's limit is strictly tighter
   than meat/milk's) instead of the round-1 wording that asserted an exclusive "2つの別の荷室として
   扱う" simplification.

Read, in this order: factory/rules/principles.md; factory/rules/q1-first-play-standard.md;
factory/state/legacy/reverse-audits/load_and_route.json; factory/projects/legacy-load-and-route/
research.md; the eleven CURRENT files listed above, in pipeline order; design-sim.mjs,
design-sim-result.json, and route-tuning-notes.md — RUN THE SCRIPT YOURSELF
(`node factory/projects/legacy-load-and-route/design/design-sim.mjs`) and diff its stdout against
the committed design-sim-result.json (must match; the file write may fail harmlessly in a
read-only sandbox with a printed warning — compare stdout to the committed file directly in that
case).

Verify specifically, with file:line evidence:
A. Is the BLOCKER genuinely closed? In particular: (a) does `validZones` correctly encode the real
   thresholds (re-derive from research.md/fact_sheet_v3.json: raw_fish 5℃以下, raw_meat/milk 10℃
   以下, frozen -15℃以下, ambient room-temp)? (b) does `zoneWin`'s `.includes()` check actually
   accept meat/milk in EITHER cold5 or cold10, and reject fish in cold10? (c) is
   `treats_all_cold_items_as_cold10` a meaningful, real-threshold-violating exploit check (not
   another invented rule)? (d) is `treats_all_cold_items_as_cold5` correctly verified as 100%
   legitimate, not accidentally still penalized somewhere in the design docs' prose?
B. Does this fix reintroduce a DIFFERENT problem — e.g. does allowing meat/milk in either zone make
   the zone-assignment puzzle so lenient that C becomes decorative again (C_NOT_NEEDED_FOR_D)? Is
   there still a genuine judgment required (distinguishing frozen vs ambient vs cold-with-a-fish-
   exception) that a content-blind or single-rule strategy cannot pass? Check `always_place_all_in_*`
   and `random_zone_per_item` results are still near-zero.
C. Re-verify the round-1 route fix (3 balanced archetypes, guaranteed 66.7% heuristic ceiling) is
   untouched and still correct — it was not the target of this round's change, but re-confirm
   route_zero_winner_rate's new computed-not-hardcoded value is still 0 and the assertion in the
   script would actually catch a broken archetype (spot-check the throw logic).
D. Do your OWN independent citation sweep across all eleven current files plus design-sim.mjs for
   any stale live reference to a superseded artifact version.
E. Re-verify everything from rounds 1-2 that was NOT flagged is still true: memorization exploit
   closed, single-shot-commit justification sound, profession_name_hidden_test,
   honest partial/failure framing, 検収 correctly attributed to the school side.
F. Any NEW defect introduced specifically by this round's fix.
G. Is this design chain now genuinely ready for GAME_DESIGN_READY / game_spec? If you find nothing
   rising to BLOCKER or HIGH, say so plainly. Only raise MEDIUM/LOW for things that would
   genuinely help before implementation, and do not gate PASS on them.

Severity calibration: BLOCKER = the round-2 finding is not actually closed, or a new answer-leak/
brute-force/CORE-distortion/artifact-inconsistency exists. HIGH = a real defect that must fix
before GAME_DESIGN_READY. MEDIUM/LOW = polish, deferrable to implementation, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round2_blocker_confirmed_closed":true|false,
 "checks":{"design_sim_ran":true|false,"design_sim_matches_committed_result":true|false,
 "zone_validzones_model_verified":true|false,"citation_sweep_clean":true|false,"ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
