You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the implementation
review of the Legacy Q1 REBUILD "legacy-delay-recover" (添乗員・旅程管理担当、gameType
delay_recover). ROUND 1 (`factory/projects/legacy-delay-recover/impl-review-r1.result.json`) FAILED
at score 82 with 1 HIGH and 1 MEDIUM (plus 1 non-blocking LOW). This round verifies the REPAIR, not
the whole implementation from scratch — but do not simply trust the repair notes; re-verify
adversarially as if this were the first time you had seen the code. Round 1 found ZERO blockers/high
against the game MECHANIC itself (batching-bug absence, position-leak closure, Gate G/H, brute-force
closure, and design-sim.mjs parity were all confirmed correct) — this round should focus mainly on
whether the CONTENT and QA-harness fixes are genuine, while still sanity-re-checking the mechanic
wasn't accidentally broken by this repair.

Round 1 findings and the claimed fix for each (verify each independently, do not take the claim at
face value):

1. **CONTENT_MECHANIC_MISMATCH (HIGH)**: `src/data/content/schoolTrip.ts`'s `trip-conductor`
   profession `what` body said the child "変更案を作って学校の確認を得たうえで" (creates a change
   proposal) — the rebuilt mechanic never has the child draft a separate proposal; contacting a party
   IS the proposal (this is grounded in `factory/projects/legacy-delay-recover/design/fact_sheet_v2.json`'s
   citation of 旅行業法第12条の10's 代替サービスの手配 = arranging alternative service through the
   contact itself). The `delay-trip` experience's `seeds` array also had `"変更案を考える"`, an
   action the child never actually performs (this project's rule: seeds must describe only actions
   actually played). Claimed fix: the profession's `what` body now reads "当日の運行状況を確認し、
   見学先・バス・宿へ連絡します。特に宿は連絡が遅れるほど対応が難しくなるため、優先して連絡します。
   学校の承認を得たうえで、関係先へ確定内容を共有します。" and the seeds array replaced
   `"変更案を考える"` with `"優先順位を考える"`. Verify: read both the FULL `trip-conductor`
   profession entry (around line 128-146) and the FULL `delay-trip` experience entry (around line
   193-200) in `schoolTrip.ts` yourself. Does every remaining piece of copy accurately describe ONLY
   actions the implemented `DelayRecoverGame.tsx` actually lets the child perform (confirm status,
   report to school, contact 3 parties prioritizing the hotel, get approval, share)? Is there any
   OTHER stale reference (to plan cards, free reordering, or a change-proposal-drafting step) still
   present anywhere in either entry that this repair missed?
2. **QA_REGRESSION_VACUOUS (MEDIUM)**: round 1 found the content regression check in
   `factory/harness/gameplay-qa-delay-recover.mjs` was scoped too narrowly (checked only for old
   free-reorder wording within an arbitrary 800-character slice, missing the change-proposal stale
   pattern entirely) and that several JSX regression checks used unbounded whole-file regex searches
   rather than binding to the actual card-rendering block. Claimed fix: content checks now slice the
   FULL `trip-conductor` and `delay-trip` entries using their adjacent-entry-id string boundaries
   (not an arbitrary character count), assert both absence of the stale change-proposal phrasing AND
   positive presence of the 3-party/hotel-priority description; the JSX disclosure/lock checks now
   extract the exact `session.displayOrder.map((id) => { ... })}` callback block via string
   boundaries before searching within it. RUN `node factory/harness/gameplay-qa-delay-recover.mjs`
   yourself (expect 24/24, up from round 1's 21/21) and read the new/changed checks critically — do
   they actually test what their names claim, and are the string-boundary slices correct (not
   accidentally empty or spanning the wrong region)? `implementation_qa_v2.json` claims the new
   content check was verified non-vacuous via a git-stash revert test (reverting schoolTrip.ts and
   confirming the check fails) — you cannot re-run this yourself, but check whether the check's logic
   makes that claim plausible (i.e., would reverting schoolTrip.ts to include "変更案を作って" or
   "変更案を考える" actually make the negative-assertion checks fail, given how they're written?).
3. **LOW (not fixed, left as-is)**: the disclosure buttons show "－" after opening even though
   `openContact`/`toggleReflect` are add-only (no actual collapse). `implementation_v2.json` argues
   this matches an already-shipped identical pattern in `HotelReceiveGame.tsx` (also add-only, also
   shows "－" with no collapse). Spot-check this claim by reading `HotelReceiveGame.tsx`'s
   `toggleCard` — is the precedent claim accurate? If so, leaving this unfixed is a reasonable,
   consistency-preserving choice, not a defect.

Additionally, re-verify everything round 1 confirmed as already correct (do not assume it's still
true after the repair, since this repair touched schoolTrip.ts and the QA harness, not
DelayRecoverGame.tsx/delayRecoverLogic.ts directly — but confirm those files are in fact unchanged
from round 1, and that the mechanic behavior is unaffected): logic-design parity, brute-force closure
(one-shot idempotent contact taps, no undo/reorder), the disclosure gate, the batching-bug absence
(functional updaters reading from `prev` in `contact`/`openContact`/`toggleReflect`), the randomized
`session.displayOrder` closing the position-leak, Gate H (`share()` computing win purely from
`contactOrderWins(contactedOrder)`), and Gate G (reflection re-presents all 3 contacts' real detail
text read-only, doesn't affect the outcome).

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `factory/projects/legacy-delay-recover/impl-review-r1.result.json` (what round 1 actually found)
3. `src/q1/delayRecoverLogic.ts`, `src/q1/DelayRecoverGame.tsx` (confirm unchanged from round 1's
   review, and re-verify against `design-sim.mjs`)
4. `factory/harness/gameplay-qa-delay-recover.mjs` — RUN IT YOURSELF (expect 24/24)
5. `factory/projects/legacy-delay-recover/design/implementation_v2.json` and
   `implementation_qa_v2.json` (the claimed repair + verification evidence — verify each claim)
6. `src/data/content/schoolTrip.ts` — the FULL `trip-conductor` profession entry and FULL
   `delay-trip` experience entry
7. `src/q1/registry.ts`'s comment for `delay_recover`

Severity calibration: BLOCKER = a genuine exploit, answer leak, brute-force path, Gate G/H violation,
a real state-loss bug, or a case where the implementation silently diverges from the approved design
(including a round-1 finding that was NOT actually fixed, or was fixed superficially without
addressing the underlying issue). HIGH = a real defect that should be fixed before release but
doesn't rise to BLOCKER. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to
BLOCKER or HIGH, say so plainly — do not manufacture findings.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"qa_harness_ran":true|false,"qa_harness_result":"...","logic_matches_design_sim":true|false,
 "brute_force_genuinely_closed":true|false,"disclosure_gate_genuinely_enforced":true|false,
 "batching_bug_absent":true|false,"position_leak_closed":true|false,
 "gate_h_correct":true|false,"gate_g_correct":true|false,
 "content_copy_accurate":true|false,"ready_for_release":true|false,
 "round1_content_mismatch_fixed":true|false,"round1_qa_vacuous_fixed":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
