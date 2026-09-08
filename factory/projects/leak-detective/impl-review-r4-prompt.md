You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 4 of the implementation
review of the NEW Q1 game "leak-detective" (水道の漏水調査員, gameType `leak_trace`), after the
ONE implementation-stage repair the Q1 Autonomous Game Factory allows for this iteration
(repair 2/2 of iteration 3 — if genuine HIGH/BLOCKER issues remain, the pipeline cannot repair
again at this stage and must escalate). Judge rigorously; do not soften because of the history,
and do not harden because of it either.

**Round-3 verdict** (factory/projects/leak-detective/impl-review-r3.result.json): FAIL 68,
CA68/GQ84, 0 blockers, 1 HIGH, 3 MEDIUM, 1 LOW. Fixes claimed this round (verify each in code):
1. HIGH (crew restores supply) — src/q1/leakLogic.ts `report()` now sets `closed: null` and drops
   that segment's silent records (`dropSilent`) for BOTH hit and miss, i.e. the repair crew
   opens the valve before digging (state_table.report_rule). src/q1/LeakTraceGame.tsx logs
   『📣 X を報告 → 🔧 修理班が弁◯を開けて水を戻した → 修理班が掘る』 when a valve was closed at
   report time, drops that segment's 『静か』 timeline lines (hd-2 item 3), shows every lid open
   during the dig (the state is open) and labels the dig 『修理班が水を戻して掘っている…』. QA:
   "a report while the segment is closed resolves by the point alone AND the crew restores
   supply first (closed → null, silent records gone) — hit and miss" + a source check for the
   announcement. Live at 375x812: valid record on a closed segment reported → lids 0 during the
   dig, timeline line present, silent record and its line gone.
2. MEDIUM (design doc contradiction) — game_spec v3 (file game_spec_v3.json, resubmitted;
   art_brief v3 / art_production v3 resubmitted unchanged, art review PASS re-recorded): the two
   leftover 「level 1 steady」 phrases now read level 0 / continuity silent; report_grounding_rule
   states the crew's reopen. The only remaining 'level 1 steady' string is in revision_note
   describing this fix.
3. MEDIUM (QA coverage) — see 1; the check verifies `closed === null`, the silent record gone,
   a non-silent record kept, for hit and miss.
4. MEDIUM (stale evidence) — the harness flow-only strategy now reopens before listening
   (parity with design-sim `flow_then_two_distinct_reports`): 32.5% in both; implementation v4 /
   implementation_qa v4 quote the harness run (52 passed; flow-only 0.325).
5. LOW (unreachable silent branch) — the reaction row condition is now
   `lastReading.continuity === "silent" || v.closed !== lastHeard.seg`, so a silent listen shows
   the row with only the text; a non-silent record's live reaction still stops while its segment
   is closed. Live-verified.
6. Layout — the miss note is one line and rendered compact; the records strip is 34px; the
   night screen measured 812/812 at 375x812 with the miss note AND the reaction row shown.

Read, in this order: factory/rules/q1-first-play-standard.md; the CURRENT design files ONLY
(factory/projects/leak-detective/design/state_table.json, game_translations_v11.json — adopted
entry t1c-night-listening-isolation —, game_spec_v3.json, design-review-r9.result.json);
src/q1/leakLogic.ts; src/q1/LeakTraceGame.tsx; src/q1/registry.ts; src/data/content/extremeHeat.ts
(leak-* entries); factory/harness/gameplay-qa-leak.mjs — RUN IT
(`node factory/harness/gameplay-qa-leak.mjs`, expect 52 passed);
factory/projects/leak-detective/design/implementation_v4.json and implementation_qa_v4.json;
run `npm run lint` (and `npm run build` if your sandbox allows writing node_modules/.tmp — if it
cannot, say so and rely on `npx tsc --noEmit -p tsconfig.app.json` instead). Do NOT read
lower-numbered design versions.

Verify specifically, with file:line evidence:
A. Each of the round-3 findings is genuinely closed (not merely reworded). For #1 also check
   the miss path: after a miss the valve is open, the child has fewer closes left (the crew's
   reopen is not a refund of anything), `unlocked` is false, and the next report needs a
   non-silent NEW listen. Is the timeline/selection/listened state consistent after the crew's
   reopen exactly as after the child's reopen?
B. Any NEW defect introduced by the repair: e.g. does report() reopening the valve create any
   answer leak or exploit (a free reopen through a wasted report?), does the digging screen
   contradict anything, does the compact note or the 34px records strip hurt legibility?
C. Gate G (hd-2): silent listens never unlock; only a non-silent new listen after the miss
   unlocks; a silent reading cannot be reported; a record heard while open stays reportable
   after closing. Silent-record lifetime: dropped on explicit / implicit / crew reopen, re-listen
   allowed, no refund.
D. Answer leaks, honest outcome, first 5 seconds / no manual, 375px legibility (no-scroll target
   incl. the miss-note state), public-view boundary — a fresh pass over the component as shipped.
E. Content accuracy against factory/projects/leak-detective/design/fact_sheet.json (incl. the
   crew restoring supply before digging).
F. Integration safety (registry key, id uniqueness, hotspot position, lensSummary, asset path)
   and build.

Severity calibration: BLOCKER = a §3 item or the game cannot be played; HIGH = must fix before
release; MEDIUM/LOW = polish. Replayability/mastery is PLUS QUALITY only.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round3_findings_confirmed_closed":{"crew_restores_supply":true|false,"design_docs_consistent":true|false,"qa_coverage":true|false,"evidence_parity":true|false,"silent_row_reachable":true|false},
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...","public_view_only":true|false,"gate_bypass_found":true|false,"scroll_812_claim_plausible":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
