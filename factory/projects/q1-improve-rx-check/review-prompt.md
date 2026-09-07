You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game rx_check
(a pharmacist checking a prescription, event "er-patient" chapter "⑤ この薬、この人に使って大丈
夫？") has just been repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical quality
standard for this review.** Key points: Q1's purpose is the FIRST-PLAY EXPERIENCE, not repeat-play
mastery -- do not flag memorization on a SECOND playthrough as HIGH/BLOCKER on its own. DO flag
anything exploitable on the very FIRST playthrough without reading/judging content: answer-leaking
UI, brute force, C not needed, D not affecting the outcome.

**Why this task exists**: `factory/state/audits/audit-summary.md` (search "rx_check") found GQ42/
CA72 with two real defects: (1) the player only had to open ANY 3 of 4 information cards before
proceeding, so the ONE card that actually matters (検査の結果 -- lab results, showing the low
kidney-function value the whole judgment depends on) could be skipped entirely and the chapter
still completed; (2) both the "which concern?" step (3 options) and the "what do you do?" step (3
options) allowed unlimited free wrong guesses with no cost, so a player could click every option in
turn and always eventually win without reading anything.

**This repair's claims** (verify by reading the code -- do not trust this summary):
- `src/q1/rxCheckLogic.ts` (new, extracted pure logic, matching the labCheckLogic.ts/
  clueBoardLogic.ts/factoryLineLogic.ts pattern): `hasSeenEnough` now requires ALL 4 cards opened
  (not just 3 of 4), closing the "skip the one that matters" gap entirely regardless of which 3 a
  player happens to pick.
- A new `MAX_WRONG_ATTEMPTS` (1) caps wrong guesses independently in BOTH the concern step and the
  action step; exceeding the budget in either one ends the chapter via a new, honest, distinct
  "done-partial" outcome (progress continues -- Job Reveal still happens -- but the outcome is
  visibly, textually different from a full correct solve, and the message differs depending on
  whether the concern was never correctly identified vs. identified-but-wrong-action-taken).
- `factory/harness/gameplay-qa-rx-check.mjs` (new) checks: all 4 cards required (not just 3, not
  just "lab" alone); exactly one correct concern/action each with at least 2 real wrong options;
  the wrong-guess budget is below the number of wrong options; no wrong reply leaks the correct
  answer's own label. 13 checks, all passing.

Read the actual code:
- src/q1/RxCheckGame.tsx (full component -- card-opening gate, concern step, action step, both
  done/done-partial endings)
- src/q1/rxCheckLogic.ts (CARDS, CONCERNS, ACTIONS, hasSeenEnough, MAX_WRONG_ATTEMPTS)
- factory/harness/gameplay-qa-rx-check.mjs
- factory/state/audits/audit-summary.md (search "rx_check" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard for this review)

Specifically verify:
1. Is there truly no way to reach the "気になるところは、どこ？" step without having opened ALL 4
   cards (not just the lab-results one, not just any 3)? Trace `hasSeenEnough`'s actual call site.
2. Does a wrong guess in the concern step, or the action step, actually cost budget correctly (not
   miscounted, not resettable by re-entering a step, not bypassable by rapid clicking)? Does
   exceeding the budget in EITHER step correctly route to done-partial with the right message for
   which step failed?
3. Do any of the wrong-answer reply texts (in either step) leak, directly or by strong implication,
   which OTHER option is correct -- beyond the minimal "here's why this specific guess is wrong"
   explanation already reviewed as acceptable?
4. Is the remaining chance of blind/uninformed success (guessing without ever reading the cards)
   low enough to not be "win by submitting N times regardless of content" in spirit, given only 3
   options and a 1-wrong-guess budget per step (2 independent steps compound the odds down further)?
5. Any remaining or NEW defect: a phase that can get stuck, the "done" ending reachable without
   ever passing through a correct concern AND a correct action, crash, console errors, or a
   mismatch between what the QA harness checks and what the actual React component does.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, evaluated fresh against this repair.
7. Is the underlying pharmacist-safety-check model (cross-referencing a prescription against
   patient/lab/history data, catching a kidney-function-vs-dosage concern, escalating to the
   prescriber rather than unilaterally acting) authentic enough for a pharmacist career depiction?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
