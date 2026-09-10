You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the design review of
the Legacy Q1 REBUILD "legacy-hotel-receive" (ホテル・旅館の団体受入担当、gameType hotel_receive).

**Round-1 verdict** (factory/projects/legacy-hotel-receive/design-review-r1.result.json): FAIL 58,
2 BLOCKER (both CORE_CAUSAL_MODEL_DISTORTED), 2 MEDIUM, 1 LOW. Do not re-litigate
`brute_force_closed` or `rest_need_datum_not_reintroduced` — round 1 already confirmed both closed.

Fixes claimed this round (verify each yourself against the actual CURRENT files, not just the
claim):

1. BLOCKER 1 (room assignment had no real grounding for "exact capacity match only") — r1 found v1
   scored ONLY the room type whose capacity exactly equaled the group's size as correct, and
   constructed group sizes to always exactly match one of the three room capacities specifically to
   avoid an obviously invented "prefer the smallest sufficient room" rule — but this just hid an
   equally unfounded "exact match required, a larger workable room is wrong" rule instead of removing
   it. Claimed fix: `design-sim.mjs` v2's `newGroup` now draws group size independently from {3,4,5,6}
   (no longer constrained to exactly match a room capacity) and the room judgment is now a
   VERIFICATION task — each group is shown a `proposedRoom` (as if tentatively assigned) and the
   child's job is to confirm `ROOM_CAPACITY[proposedRoom] >= size` (accept) or reject it as too small,
   never picking among multiple room types. Verify: (a) re-read research.md — does "実際に空いている
   客室へ当てはめる" genuinely support a sufficiency check without needing to invent a specific
   proposed-room-selection mechanism, i.e. is showing a "proposed room" for the child to verify a
   reasonable, undistorted way to operationalize the real front-desk task? (b) RUN
   `node factory/projects/legacy-hotel-receive/design/design-sim.mjs` yourself and verify
   `room_always_accept`/`room_always_reject` are both meaningfully below full reasoning, and that
   `legitimate_full_reasoning` is exactly 1.
2. BLOCKER 2 (allergy data compressed from per-student to per-group) — r1 found the real declaration
   form is per-STUDENT and the real D is "that specific student's meal is set aside," but v1 modeled
   one allergy flag and one meal choice per GROUP. Claimed fix: each group is now a small named
   roster (`MEMBER_LABELS`, "Aさん/Bさん/..."), each member independently may have a real allergen
   flagged, and the child must select the exact SET of members needing 個別対応食 — sessionWin
   requires an exact set match (neither missing someone who needs it nor over-including someone who
   doesn't). Verify: (a) re-read research.md's citation of the actual per-student form and confirm
   this now matches the real granularity; (b) RUN design-sim.mjs and specifically check
   `meal_ignored_selects_everyone` (selecting every member "just in case," the exact distortion
   BLOCKER 2 warned against) is a LOSING strategy, not an accidental winning one; (c) judge whether a
   9-year-old-relatable UI (checkboxes per named member) is a plausible, undistorted translation of
   the real per-student meal-handling task, not an over-complication.
3. MEDIUM (play_seeds s4 narrative/scoring mismatch) — claimed fix: s4 is now about the ROOM
   judgment specifically (a 6-person group shown a 3-capacity room, the child assumes "it's already
   proposed so it must be fine" and accepts without comparing numbers) rather than a room/meal
   cross-wiring narrative that didn't match what was actually scored. Verify the seed's stated error
   now actually produces the stated scored outcome.
4. MEDIUM (SIMULATOR_GENERATOR_BUG, double-independent-filter) — claimed fix: `newGroup` now filters
   each member's allergens with a single pass per member (not two independent draws). Verify by
   reading the actual generator code.

Also independently re-check the full chain for internal consistency now that the mechanic changed
shape substantially (room-type SELECTION became room-fit VERIFICATION; group-level meal choice
became per-member selection) — grep for any remaining reference to "3つの部屋タイプから選ぶ" or
"班全体の食事" as if it were still the current mechanic (historical mentions in revision_note fields
explaining what was fixed are fine and expected).

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-hotel-receive/research.md` in full; then the full CURRENT design chain (all
`_v2.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-hotel-receive/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE and
RUN it).

Severity calibration: BLOCKER = a round-1 finding is not actually closed, or a NEW genuine exploit/
answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix before
implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to BLOCKER or
HIGH, say so plainly — a genuine, clean PASS is the expected outcome if the fixes hold up; do not
manufacture findings to justify another round.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round1_findings_confirmed_closed":{"room_verification_grounded":true|false,
 "allergy_per_member_grounded":true|false,"play_seed_s4_coherent":true|false,
 "generator_bug_fixed":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","select_everyone_loses":true|false,
 "no_stale_mechanic_references":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
