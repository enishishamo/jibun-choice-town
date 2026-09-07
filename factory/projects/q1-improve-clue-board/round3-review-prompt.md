You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children, target age roughly 10-12). The game clue_board
(doctor, first half of the "er-patient" event, gameType: clue_board) has been repaired a third time.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical quality
standard for this review.** Its key points, so you evaluate correctly even if you cannot read the
file for some reason:
- Q1's purpose is the FIRST-PLAY EXPERIENCE (curiosity -> active play -> use C -> judge/act D ->
  consequence -> think again if wrong -> honest outcome -> Job Reveal), NOT repeat-play mastery.
- Do NOT flag "a returning player could memorize the fixed case/answer on a second playthrough" as
  a HIGH or BLOCKER on its own -- replayability/mastery is PLUS QUALITY only, per an explicit
  2026-09-07 Human Decision. `factory/rules/game-critic-v2.md`'s MASTERY STATEMENT / REPLAY
  STATEMENT / NOVICE VS EXPERT DIFFERENCE requirements are amended to PLUS QUALITY for this kind of
  task -- do not downgrade verdict for weak/absent statements on those three specifically.
- DO still flag anything exploitable on the very FIRST playthrough without reading/judging content:
  answer-leaking labels/UI, a shortcut that wins via position/pattern alone, submitting N times to
  force success regardless of content, or C not mattering to the outcome. These remain BLOCKER/HIGH
  as normal.

Two PRIOR rounds of this exact review (on this exact game) found:
- Round 1: unlimited-retry brute force; evaluative words in gather-phase clue text leaking which
  vitals were abnormal.
- Round 2 (after a repair): FIXED the leaking clue text and added a 2-attempt cap, but that repair
  introduced a genuine BLOCKER (exhausting 2 attempts called onComplete() regardless of
  correctness -- a guaranteed-win-by-submitting-twice shortcut) and left one FIRST-PLAY-relevant
  HIGH (the vitals were always shown in the SAME row order, so "flag the first three rows" won
  100% of the time without reading a single number).

This round (round 3) claims to have fixed BOTH: (a) exhausting the 2 attempts now goes to a
different, explicitly weaker "done-partial" ending instead of the success ending; (b) the four
vitals' display order is now shuffled once per playthrough (factory/harness/gameplay-qa-clue-board.mjs
verifies "always flag the first 3" now wins ~25% of the time by chance, not 100% deterministically).
Verify these claims yourself by reading the actual code -- do not take the producer's own claim at
face value.

Read the actual code:
- src/q1/ClueBoardGame.tsx
- src/q1/clueBoardLogic.ts
- factory/rules/q1-first-play-standard.md (primary standard for this review)
- factory/rules/game-critic-v2.md (as amended 2026-09-07 -- read the amendment notice at the top)
(Do NOT read factory/projects/q1-improve-clue-board/*.md notes about this rework -- judge the code.)

Specifically verify:
1. Does exhausting MAX_REVIEW_ATTEMPTS with an INCORRECT flag set ever reach the SAME ending
   (onComplete with the success framing) as a correct flag set? Trace the actual code path.
2. Is the vitals row order genuinely randomized per mount (not a fixed order, not seeded to always
   produce the same "random-looking" order)? Does the correctness check (isCorrectVitalFlagSet)
   depend on id, not on position/index?
3. Any NEW defect introduced by these two changes (e.g., does the shuffle ever crash, duplicate, or
   drop a vital; does the done-partial screen have its own reachability/dead-end bugs)?
4. Any remaining FIRST-PLAY-relevant answer leak or no-reading shortcut you can find (not
   replay/mastery-only concerns -- those are out of scope per the standard above).
5. Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE), Gate G (THINK AGAIN), Gate H (HONEST OUTCOME) from
   the standard specifically, given the round-3 changes.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
