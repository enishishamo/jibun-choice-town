You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the implementation
review of the Legacy Q1 REBUILD "legacy-load-and-route" (給食食材の配送員、gameType load_and_route).

**Round-1 verdict** (factory/projects/legacy-load-and-route/impl-review-r1.result.json): FAIL 68,
CA70/GQ68, 1 BLOCKER, 1 HIGH — every other check (logisticsLogic_matches_design_sim_exactly,
session_generation_correct, gate_h_fix_verified, no_session_retry_confirmed,
cold5_for_meat_milk_accepted_as_correct, scroll_812_claim_plausible) already PASSED and does not
need re-litigating unless you find NEW evidence it's actually broken.

Fixes claimed this round (verify each yourself):
1. BLOCKER (ANSWER_LEAK) — the intro-scene image at src/data/content/schoolLunch.ts's
   `logistics-lunch` entry (`place.image`) was `K("delivery_center")`
   (public/assets/kyushoku/delivery_center.jpg), which bakes in visible text labels for a WRONG
   3-zone model (冷凍-18℃以下／冷蔵0〜10℃／常温10〜25℃) and visibly shows fish pre-sorted into the
   frozen compartment — contradicting the shipped 4-zone validZones model where raw_fish is
   cold5-only. Fixed: the entry now uses `K("delivery_check")`
   (public/assets/kyushoku/delivery_check.jpg), an already-existing asset with no baked-in
   temperature labels. View both images yourself (they are plain JPEG files you can read directly)
   and confirm: (a) delivery_check.jpg has no visible numeric temperature labels or an explicit
   zone-count that could contradict the shipped 4-zone model, (b) it is not itself a NEW answer leak
   of a different kind, (c) art_brief_v1.json's `no_art_required:true` scope already contemplated
   reusing this exact file (it lists both delivery_center.jpg and delivery_check.jpg), so no new art
   was generated for this fix.
2. HIGH (CORE_DISTORTED_BY_PROSE) — the `tools` array's `truck` entry description said
   "冷蔵室と常温室がある配送車" (omitting frozen and the 5℃/10℃ distinction). Fixed: now reads
   "冷凍室・冷蔵室（5℃と10℃の2段階）・常温室がある配送車". Separately, verify for yourself whether
   this `tools` array is actually rendered anywhere in the current Q1 shell for this gameType (grep
   the shell/screen components for how `experience.tools` is consumed) — if it's genuinely dead data
   never shown to a child, note that explicitly (it doesn't change whether the fix was correct to
   make, but it changes how much weight this finding should carry for a re-score).

Read, in this order: factory/rules/q1-first-play-standard.md; the CURRENT design files (per
factory/projects/legacy-load-and-route/q1-pipeline.json's artifacts.<type>.file); src/q1/
logisticsLogic.ts; src/q1/LogisticsGame.tsx; src/data/content/schoolLunch.ts (logistics-lunch entry
only, both the image swap and the tools/truck fix); the two image files themselves; then
factory/projects/legacy-load-and-route/design/implementation_v2.json and implementation_qa_v2.json.
Run factory/harness/gameplay-qa-load-route.mjs (expect 27 passed, 0 failed), `npx tsc --noEmit`,
`npx oxlint src/q1/LogisticsGame.tsx src/q1/logisticsLogic.ts src/data/content/schoolLunch.ts`, and
`npx vite build` if your sandbox allows it.

Verify specifically, with file:line evidence:
A. Is the BLOCKER genuinely closed — does delivery_check.jpg, on your own visual inspection, contain
   no text or iconography that contradicts or leaks the 4-zone validZones model?
B. Is the HIGH genuinely closed, and is your independent read on whether `tools` is rendered
   consistent or does it change the severity assessment?
C. Any NEW defect introduced specifically by swapping the image or editing the tools array (e.g. a
   broken image path, a build/type error, an unrelated field accidentally altered)?
D. Re-verify everything from round 1 that was NOT flagged is still true (spot-check at least the
   zone-model correctness in the shipped UI — meat/milk in cold5 accepted as correct — and the Gate H
   onPartialComplete fix, since those were the highest-stakes checks).
E. Is this implementation now genuinely ready for release? If you find nothing rising to BLOCKER or
   HIGH, say so plainly. Only raise MEDIUM/LOW for things that would genuinely help, and do not gate
   PASS on them.

Severity calibration: BLOCKER = the round-1 finding is not actually closed, or a new answer-leak/
brute-force/CORE-distortion/broken-build exists. HIGH = a real defect that must fix before release.
MEDIUM/LOW = polish, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"answer_leak_intro_art":true|false,"truck_description_accurate":true|false},
 "checks":{"qa_harness_ran":true|false,"qa_result":"...","build_or_tsc":"...","lint":"...",
 "delivery_check_jpg_free_of_contradicting_labels":true|false,"ready_for_release":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
