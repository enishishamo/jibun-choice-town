You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 3 of the implementation
review of the NEW Q1 game "leak-detective" (水道の漏水調査員, gameType `leak_trace`).

**History, briefly.** Implementation review round 2 (factory/projects/leak-detective/impl-review-r2.result.json)
FAILED 68 with one HIGH: after the last charged valve close the player could not reopen it, so
the isolated leak segment still "sounded" and a successful dig still sprayed water — an
impossible causal sequence — and one MEDIUM: the design documents disagreed about reopening.
That was routed to DESIGN (not patched in code): redesign #2 adopted translation
t1c-night-listening-isolation (closed segment is silent; reopen is a free explicit tap), the
design went through reviews r5 (FAIL 72), r6 (HUMAN_REQUIRED 70, budgets exhausted), a
human-granted ONE-TIME repair extension scoped to a dedicated silent state
(`human_decisions[hd-1]`, `one_time_exception` in factory/projects/leak-detective/q1-pipeline.json),
and review r7 (factory/projects/leak-detective/design/design-review-r7.result.json — read its
verdict yourself). The GAME_DESIGN_READY gate then passed and game_spec_v2 / art_brief_v2 /
art_production_v2 (same asset, same independent art QA) were resubmitted. The implementation was
updated together with the design and is now submitted as implementation v3 / implementation_qa v3.

**What the implementation now claims** (verify each in code, with file:line evidence):
1. Valve model (src/q1/leakLogic.ts): `closeValve` is the only budgeted operation (BUDGETS.valve
   = 2 closes per night); closing another valve implicitly reopens the previous one (one closed
   valve at a time); `openValve` is an explicit FREE reopen (refused only when nothing is closed);
   tapping an already-closed lid is refused without cost (the reopen affordance is the lid's own
   「▲開ける（0回）」 label/tap in the component). Compare with design-sim.mjs semantics and
   state_table.json valve_model.
2. Isolation / silent state: `soundReading(c, seg, point, closed)` returns
   `{ level: 0, continuity: "silent" }` for EVERY point of the closed segment (leak point, house
   distractor point, others) and never for an open segment; the component renders level 0 /
   silent with NO bars, NO waveform strip, NO 「ずっと」/「とぎれる」 word, NO house-window blink —
   only 「静か（水が止まっている）」; after reopen the normal rendering returns.
3. Report / outcome: a report on the leak point while its segment is CLOSED — is it allowed, and
   if so does the outcome narrative still make physical sense (crew restores supply, then digs)?
   Check `report`, `reportBlocked`, the dawn/hit screens and extremeHeat.ts experience text.
4. Think-again gate: a second report is enabled only by a NEW listen (not by opening records, not
   by comparing); miss with no listens left → partial; `locked_after_miss` semantics.
5. Public-view boundary: LeakTraceGame.tsx renders only `publicView()`; never reads the private
   case (leak/house); `revealLeak` used exactly once (post-hit dawn). The QA harness asserts this
   at source level — confirm the regex is not vacuous.
6. Honest outcome / no answer leaks: discoveryEcho outcome-neutral; no automatic segment
   highlight; focus buttons, lid labels, gauge mark, report card, window blink and the new silent
   text must not reveal the leak segment or point (in particular: does the silent state ever leak
   information the flow meter did not already give?).
7. 375px legibility and touch targets: lid label 「▲開ける（0回）」 at SVG fontSize 14; hit
   circles r=28 (~44.7px) for points and lids; HTML focus buttons min-height 44; the implementer
   measured scrollHeight 812/812 at 375x812 (no page scroll) with the silent strip shown.
8. Hint gating: specific hint only after `failedNights >= 2` or two misses in one night.
9. Integration: registry key `leak_trace`, id uniqueness across extremeHeat.ts (incident
   leak-night, profession leak-detective, experience leak-heat, lensSummary row), hotspot
   position, asset path public/assets/heat/place-leak.png exists.

Read, in this order: factory/rules/q1-first-play-standard.md; the CURRENT design files ONLY
(factory/projects/leak-detective/design/state_table.json, game_translations_v9.json — adopted
entry t1c-night-listening-isolation —, game_spec_v2.json, design-review-r7.result.json);
src/q1/leakLogic.ts; src/q1/LeakTraceGame.tsx; src/q1/registry.ts; src/data/content/extremeHeat.ts
(leak-* entries); factory/harness/gameplay-qa-leak.mjs — RUN IT
(`node factory/harness/gameplay-qa-leak.mjs`, expect 44 passed);
factory/projects/leak-detective/design/implementation_v3.json and implementation_qa_v3.json;
run `npm run lint` (and `npm run build` if your sandbox allows writing node_modules/.tmp — if it
cannot, say so and rely on `npx tsc --noEmit -p tsconfig.app.json` instead). Do NOT read
lower-numbered design versions.

Also: any NEW defect introduced since round 2 (the reopen path, the silent rendering branch, the
records strip, restartSameCase, the timeline entries), and a fresh pass over first 5 seconds /
no manual / C→D causality as shipped.

Severity calibration: BLOCKER = a §3 item or the game cannot be played; HIGH = must fix before
release; MEDIUM/LOW = polish. Replayability/mastery is PLUS QUALITY only.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round2_findings_confirmed_closed":{"reopen_causality":true|false,"design_docs_consistent":true|false},
 "silent_state":{"logic_returns_level0_silent_on_closed_segment_only":true|false,"render_has_no_bars_waveform_word_blink":true|false,"reopen_restores_sound":true|false},
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...","public_view_only":true|false,"gate_bypass_found":true|false,"scroll_812_claim_plausible":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
