You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game safety_plan
(a school-trip safety-lead/teacher, event "school-trip" chapter "100人の安全を守る") has just been
repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**
Key points: Q1's purpose is the FIRST-PLAY EXPERIENCE, not repeat-play mastery -- do not flag
memorization on a SECOND playthrough as HIGH/BLOCKER on its own. DO flag anything exploitable on
the very FIRST playthrough without reading/judging content: answer-leaking UI, a shortcut that
wins regardless of judgment, C not needed, D not affecting the outcome. Also apply the recent,
hard-won lesson from THIS SAME session's other Q1 repairs (line_debug, timetable, bus_ops, and
forecast_and_balance were ALL found, across their own repair rounds, to have left some form of
"win without genuinely needing the job-specific information" path open, in different shapes) --
specifically check whether safety_plan's repair has any residual defect from that same family.

**Why this task exists**: `factory/state/audits/audit-summary.md` (search "safety_plan") found
GQ48/CA47: "資料確認は必須だが、その内容を引率者の選定や安全体制へ適用する仕事固有の判断が実装さ
れていない" -- opening the 花組 (food-allergy) and 月組 (motion-sickness) info cards was mandatory
(tracked via `openedDocs`), but their CONTENT never affected any actual decision: any adult could
hold any of the 4 safety roles (先頭/最後尾/救急用品/緊急連絡先) as long as every card had been
clicked open once. The "must open" gate was pure ceremony.

**This repair's claims** (verify by reading the code AND doing the logic yourself -- do not trust
this summary or the producer's stated behavior):
- `src/q1/safetyPlanLogic.ts` (new, extracted pure logic matching the labCheckLogic.ts/
  clueBoardLogic.ts pattern): `computeIssues(bandIds, state)` now requires that (1) whichever adult
  was assigned (in the earlier "assign" step) to 花組 (the allergy band) is the SAME adult who holds
  the 救急用品 (medic-supplies) role, and (2) whichever adult was assigned to 月組 (the
  motion-sickness band) is the SAME adult who holds the 最後尾 (walks-at-the-back) role. Both checks
  are gated behind having opened the corresponding info card first (`openedDocs.includes(...)`) --
  if not yet opened, only a generic "you haven't checked this yet" message shows, never the specific
  required linkage; only once opened does the specific mismatch (if any) get named.
- `src/q1/SafetyPlanGame.tsx`: delegates to `computeIssues` instead of its own inline duplicate
  logic; otherwise unchanged (drag/tap-assign in step "assign", role buttons in step "roles", a
  "安全チェックをする" button that reveals `issues` only after being clicked once).
- `factory/harness/gameplay-qa-safety-plan.mjs` (new, 13 checks, all passing): verifies a correctly
  linked plan produces no complaint about it; verifies breaking either link (medic != hana's adult,
  or tail != tsuki's adult) after opening the doc IS flagged; verifies that WITHOUT opening a doc,
  the specific linkage is never named (only the generic "not checked" message) even when the actual
  assignment is wrong -- i.e. the post-check feedback can't substitute for reading the card; verifies
  all the pre-existing structural checks (every band assigned, head != tail, etc.) still work;
  verifies a fully correct plan has zero issues.
- Manually verified in-browser (Browser pane, dev server): assigned all 5 bands to 5 distinct
  adults, entered the roles step, deliberately picked the WRONG medic (not hana's adult) and the
  CORRECT tail (tsuki's own adult) after opening both cards -- confirmed only the hana/medic issue
  appeared, not a tsuki/tail one; fixed medic to hana's own adult -- confirmed the check then passed
  and Job Reveal showed the 🎉 full-success chip. No console errors.

Read the actual code:
- src/q1/SafetyPlanGame.tsx (full component)
- src/q1/safetyPlanLogic.ts (ADULTS, computeIssues)
- src/q1/tripBands.ts (BANDS, including hana's/tsuki's `note` fields)
- factory/harness/gameplay-qa-safety-plan.mjs
- factory/state/audits/audit-summary.md (search "safety_plan" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard)
- factory/state/blocked-queue.md (for the exact class of residual defect that blocked line_debug,
  timetable, bus_ops, and forecast_and_balance this same session -- confirm this repair's fix
  doesn't reopen that same class in a new shape)

Specifically verify:
1. Is there a content-independent, first-play-discoverable shortcut that still wins regardless of
   reading either card? Specifically: does assigning bands/adults in ANY fixed pattern (e.g. always
   put the same specific adult, say 養護の先生, on BOTH the 救急用品 AND 最後尾 roles, or always
   picking one particular band-to-role mapping) succeed regardless of which bands actually got which
   adults during the "assign" step, without the player ever needing to know band identities matter?
   Walk through what happens if a player just puts the SAME single adult in all 4 role slots (does
   the code allow that, and if so, does it accidentally always satisfy both linkage checks trivially
   for ANY band assignment, defeating the point)?
2. Does the specific-mismatch hint ever leak the correct linkage to a player who has NOT opened the
   relevant card -- i.e., is there any path (order of operations, stale state, checking multiple
   times) where the specific "花組の担当の先生が救急用品を持つように" text appears before `hana` is
   in `openedDocs`?
3. Is opening a card (a single click, no dwell-time or comprehension check) an appropriate bar for
   "C necessity" here, consistent with how every other Q1 game in this codebase gates its own info
   cards (cite one or two other games' identical `openedDocs`-style gates as precedent if you find
   them), or does this specific repair need a stronger bar than the codebase's existing baseline?
4. Any way the roles step's assignment could still succeed with genuinely ARBITRARY/unread band
   assignments from the "assign" step -- e.g., if a player assigns bands completely randomly (never
   caring which band is which), can they still trivially satisfy computeIssues by some fixed
   role-picking heuristic that doesn't require knowing WHICH band ended up with WHICH adult?
5. Any NEW defect: a crash, a stale `placed`/`openedDocs` value leaking across re-renders, or a QA
   harness check that doesn't verify what it claims (e.g. does the harness's baseline fixture
   actually represent a correctly-linked state, or does it have a bug in its own test data)?
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, evaluated fresh. Is safety_plan now release-ready?
7. Is the underlying teacher/safety-lead model (matching a specific at-risk group's own chaperone to
   a relevant safety role) authentic enough for the career depiction, or does it feel arbitrary/gamey?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
