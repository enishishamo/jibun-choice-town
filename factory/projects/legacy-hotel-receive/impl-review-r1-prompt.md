You are the INDEPENDENT, ADVERSARIAL IMPLEMENTATION REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the implementation
review of the Legacy Q1 REBUILD "legacy-hotel-receive" (ホテル・旅館の団体受入担当、gameType
hotel_receive). The design was independently reviewed and PASSED (design review r2, score 88 —
`factory/projects/legacy-hotel-receive/design-review-r2.result.json`). Your job is to verify the
IMPLEMENTATION actually matches that approved design — not to re-litigate the design itself unless
the implementation reveals a design-level gap the design review missed.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. The approved design chain: `factory/projects/legacy-hotel-receive/design/game_spec_v1.json`,
   `ae_v2.json`, `game_translations_v2.json` (t1-check-in-per-group is adopted),
   `no_manual_exploit_check_v2.json`, `design-sim.mjs` (the source of truth for exploit-resistance
   numbers)
3. The implementation: `src/q1/hotelReceiveLogic.ts` (pure logic, must mirror design-sim.mjs
   structurally), `src/q1/HotelReceiveGame.tsx` (the React component)
4. The shipped QA harness: `factory/harness/gameplay-qa-hotel-receive.mjs` — RUN IT YOURSELF:
   `node factory/harness/gameplay-qa-hotel-receive.mjs` (expect 29/29 passing) — and read it
   critically: are its regression checks actually testing what their names claim, or could any of
   them pass vacuously (e.g. matching an adjacent code branch instead of the intended one)?
5. `factory/projects/legacy-hotel-receive/design/implementation_v1.json` and
   `implementation_qa_v1.json` (the claimed verification evidence — verify each claim, don't take it
   at face value)
6. `src/data/content/schoolTrip.ts` — specifically the `trip-hotel` profession entry and the
   `hotel-trip` experience entry — verify the copy (mission/discoveryEcho/seeds/q2 body text)
   actually matches the NEW mechanic (room-fit verification + per-member allergy selection) and
   contains no stale references to the OLD mechanic (room-grid placement, bath-time scheduling, a
   single group-wide "rest need" positional concern)

Specific things to verify adversarially:

1. **Logic-design parity**: does `hotelReceiveLogic.ts`'s `newGroup`/`groupWin`/`sessionWin` produce
   the same win/lose behavior as `design-sim.mjs`'s equivalent functions? Check the room-capacity
   table, allergen list, group-size range (3-6), and per-member allergen probability match exactly.
2. **BRUTE_FORCE_SUCCESS**: is there truly no way to retry a single group's commit within the same
   session after a wrong answer? Check `HotelReceiveGame.tsx`'s `commit` function and state
   transitions carefully — could rapid re-clicking, browser back/forward, or any state path allow a
   second attempt at the SAME group before moving on?
3. **CORE_DATA_DISCLOSURE_NOT_REQUIRED**: can the room-verdict buttons or member checkboxes be
   activated before BOTH cards (`size`, `allergy`) are opened? Check the `disabled` wiring precisely,
   not just that a disabled attribute exists somewhere.
4. **ANSWER_LEAK**: do button/checkbox labels, colors, or DOM order leak the correct answer in any
   way not already accounted for by the randomization? Pay particular attention to whether member
   checkbox order could ever correlate with allergy status (it shouldn't, but confirm the code
   doesn't accidentally sort members by allergy status).
5. **Gate H (HONEST OUTCOME)**: confirm the "done" branch calls `onComplete` ONLY when
   `sessionWin` is genuinely true for all 3 groups (not just when the child reached the "done" state,
   which is reachable via `allWin` tracking during commit — verify `allWin` and the later
   `sessionWin`-based `finalWin` check are actually consistent, and investigate why the code computes
   `finalWin` a second time via `sessionWin` instead of just trusting `allWin` — is this redundant,
   or does it serve a real purpose, e.g. guarding against a state-tracking bug where `allWin` could
   drift from the true session state?).
6. **Gate G (THINK AGAIN)**: confirm the reflection screen actually re-presents all 3 groups' size,
   proposed room, AND full per-member allergen list (not a partial/summarized version), and that
   reflection picks never influence the actual outcome.
7. **REST_NEED_NOT_REINTRODUCED**: confirm no code path, data structure, or copy anywhere
   (component, logic module, OR `schoolTrip.ts` content) reintroduces a "band wants to rest, therefore
   X" mechanic or even flavor text implying it affects a decision.
8. **Content copy accuracy** (`schoolTrip.ts`): does every piece of copy describing this game to the
   child (mission, discoveryEcho, job-reveal seeds, profession q2 body) accurately reflect the
   ACTUAL implemented mechanic — 2 judgments (room-fit, individual allergy), no bath stage, no
   "入浴" mentions, no implication of dragging groups into a spatial grid?
9. **Mobile/375px**: `implementation_qa_v1.json` claims a 375px browser check with screenshot. Since
   you cannot open a browser, instead read the CSS classes used (`dx-card`, `dx-grid`, `route-grid`,
   `choice-row wrap`, `btn choice`) in the existing stylesheet the codebase already ships and confirm
   they are the SAME classes other already-shipped, previously-verified Q1 games use (e.g.
   `WaterGame.tsx`) rather than new, unverified CSS — if they're reused classes, treat the mobile
   claim as credible; if HotelReceiveGame.tsx introduces new unreviewed CSS, flag it as unverifiable
   from source alone.

Severity calibration: BLOCKER = a genuine exploit, answer leak, brute-force path, Gate G/H violation,
or a case where the implementation silently diverges from the approved design in a way that distorts
the profession. HIGH = a real defect that should be fixed before release but doesn't rise to BLOCKER.
MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to BLOCKER or HIGH, say so
plainly — do not manufacture findings.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"qa_harness_ran":true|false,"qa_harness_result":"...","logic_matches_design_sim":true|false,
 "brute_force_genuinely_closed":true|false,"disclosure_gate_genuinely_enforced":true|false,
 "gate_h_correct":true|false,"gate_g_correct":true|false,"rest_need_absent":true|false,
 "content_copy_accurate":true|false,"ready_for_release":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
