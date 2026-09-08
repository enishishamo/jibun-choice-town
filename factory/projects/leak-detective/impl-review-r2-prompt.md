You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the implementation
review of the NEW Q1 game "leak-detective" (水道の漏水調査員, gameType `leak_trace`), after the ONE
implementation-stage repair the Q1 Autonomous Game Factory allows. If genuine HIGH/BLOCKER issues
remain, the pipeline cannot repair again at this stage (it must route back to design or
escalate). Judge rigorously; do not soften because of the history.

**Round-1 verdict** (factory/projects/leak-detective/impl-review-r1.result.json): FAIL 72,
CA88/GQ72, 0 blockers, 3 HIGH, 4 MEDIUM. Fixes claimed this round (verify each in code):
1. HIGH IMPLEMENTATION_CHANGED_D — `openValve` (free reopen) REMOVED from src/q1/leakLogic.ts;
   the only scored operation is a close; closing another valve implicitly reopens the previous
   one (one valve at a time), exactly like design-sim.mjs; tapping the already-closed lid only
   shows a note. QA: "closing another valve implicitly reopens…", "tapping the already-closed
   valve is refused and costs nothing", "no openValve action exists".
2. HIGH HONEST_OUTCOME_MISMATCH — discoveryEcho in src/data/content/extremeHeat.ts is now
   outcome-neutral (「漏水点はどこか」を考えたよね …) so a partial run is never told it identified
   the leak.
3. HIGH TOUCH_TARGET_TOO_SMALL — valve hit circles are r=28 (44.7px at 375px, DOM-measured); the
   segment-focus controls moved out of the SVG into HTML buttons with min-height 44px under the
   map; listening points r=28 with 56-unit spacing.
4. MEDIUM PUBLIC_VIEW_BOUNDARY — new leakLogic helpers `readingAt(view, seg, point)` and
   `restartSameCase(s)`; LeakTraceGame.tsx no longer calls heard(s) or reads s.c; the QA harness
   asserts this at SOURCE level (regex over the component file) and that revealLeak is used
   exactly once (post-hit dawn screen).
5. MEDIUM QA_CHECK_VACUOUS — replaced with a deep-equality check: the public view after closing
   the leak segment vs another segment must be identical except the meter number (flow / the log
   line carrying it / which valve the child tapped are stripped).
6. MEDIUM QA_MIRROR_DIVERGENCE — added the loudest-STEADY random-listening mirror; the flow-only
   two-distinct-reports strategy is kept as a documented adaptation (the shipped game can only
   report a HEARD point, so "flow-only" = listen once at a random point of the isolated segment
   and report it without reading the level, then another distinct one).
7. MEDIUM FAILURE_HINT_LEAKAGE — the specific hint is gated on `failedNights >= 2` (terminal
   partial nights) or two misses in one night, never on the replay attempt number.

Read, in this order: factory/rules/q1-first-play-standard.md; the current design files
(factory/projects/leak-detective/design/state_table.json, game_translations_v5.json, game_spec.json);
src/q1/leakLogic.ts; src/q1/LeakTraceGame.tsx; src/data/content/extremeHeat.ts (leak-* entries);
factory/harness/gameplay-qa-leak.mjs — RUN IT (`node factory/harness/gameplay-qa-leak.mjs`, expect
38 passed); factory/projects/leak-detective/design/implementation.json and implementation_qa.json;
run `npm run lint` (and `npm run build` if your sandbox allows writing node_modules/.tmp — if it
cannot, say so and rely on `npx tsc --noEmit -p tsconfig.app.json` instead).

Verify specifically, with file:line evidence:
A. Each of the 7 round-1 findings is genuinely closed (not merely reworded). For #1 also confirm
   game_spec.json's valve budget wording ("閉める操作ごとに1、開け直しは無料") is consistent with
   "no explicit reopen; switching valves is one close" and that design-sim.mjs's close semantics
   match leakLogic.closeValve.
B. Any NEW defect introduced by the repair: e.g. the note shown when tapping a closed lid; the
   segment letters now drawn under the valves in the SVG; the HTML focus buttons (do they leak
   anything, do they push the layout past 812px on 375px — the implementer measured
   scrollHeight 812/812); `restartSameCase` preserving the same case; hint gating logic.
C. Answer leaks, honest outcome, think-again gate, first 5 seconds / no manual — a fresh pass
   over the component as shipped.
D. Content accuracy against factory/projects/leak-detective/design/fact_sheet.json.
E. Integration safety (registry key, id uniqueness, hotspot position, lensSummary) and build.

Severity calibration: BLOCKER = a §3 item or the game cannot be played; HIGH = must fix before
release; MEDIUM/LOW = polish. Replayability/mastery is PLUS QUALITY only.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"valve_ops":true|false,"discovery_echo":true|false,"touch_targets":true|false,"public_view_boundary":true|false,"qa_valve_check":true|false,"qa_mirror":true|false,"hint_gating":true|false},
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...","public_view_only":true|false,"gate_bypass_found":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
