You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children, target age roughly 10-12). The game lab_check
(clinical lab technologist, second scene of the "er-patient" event, gameType: lab_check) has been
repaired a fourth time.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical quality
standard for this review.** Key points, so you evaluate correctly even without reading the file:
- Q1's purpose is the FIRST-PLAY EXPERIENCE (curiosity -> active play -> use C -> judge/act D ->
  consequence -> think again if wrong -> honest outcome -> Job Reveal), NOT repeat-play mastery.
- Do NOT flag "a returning player could memorize the fixed case/answer on a second playthrough" as
  a HIGH or BLOCKER on its own -- replayability/mastery is PLUS QUALITY only, per an explicit
  2026-09-07 Human Decision. `factory/rules/game-critic-v2.md`'s MASTERY/REPLAY/NOVICE-VS-EXPERT
  requirements are amended to PLUS QUALITY for this kind of task.
- DO still flag anything exploitable on the very FIRST playthrough without reading/judging content:
  answer-leaking labels/UI, a shortcut that wins via position/pattern/asymmetric-specificity alone,
  submitting N times to force success regardless of content, or C not mattering to the outcome.

This exact game has been reviewed 3 times before this round:
- Round 1 (`factory/projects/q1-improve-lab-check/final-review.result.json` and
  `repair-review.result.json`): found (a) a panel-realism issue in test choice (fixed by swapping
  the 2nd distractor to a genuinely separate assay, kidney/creatinine), (b) an unlimited in-place
  retry that let a player brute-force all 3 possible pairs within one experience (fixed by ending a
  wrong pair via an honest, distinct "done-partial" outcome instead), and left ONE HIGH unresolved:
  "患者文脈を使わない固定攻略が成立する" -- the pre-run test `name`/`hint` text spelled out each
  test's diagnostic category with words that directly matched the patient's own symptom vocabulary
  (fever/cough/breathlessness = "sounds infection-y"), so a player could win by keyword-matching
  without reading a single test RESULT or connecting anything case-specific.
- Round 2 (`factory/projects/q1-improve-lab-check/round3-review.result.json` -- despite the
  filename, this was actually this task's SECOND review round): a repair reworded the two relevant
  tests' pre-run text to be fully circular/vague ("ある物質", "ある種類の細胞") while leaving the
  distractor specifically organ-named ("腎臓のはたらき"). Review found THREE HIGH: (1) this
  over-correction created the SAME shortcut in the opposite direction -- "the one that names a real
  organ = probably not it" -- so Gate C/D/E still weren't satisfied; (2) a completely separate,
  previously-unnoticed leak: after running the FIRST of the two allowed tests, its diagnostic
  `label` and `off`-derived red/normal color appeared immediately in the SAME selection screen,
  before the second pick was locked in, letting a player use that color/label to decide the second
  pick without ever reasoning about the patient; (3) TEXT_ONLY_CONSEQUENCE / WORLD_FEEDBACK_QUALITY
  (success/partial outcomes shown mostly via static emoji + text, no visible doctor/lab-process
  state change) -- this third one mirrors clue_board's already-established, Human-approved
  PLUS-QUALITY/backlog precedent for the identical finding type and is NOT expected to block this
  review on its own.

This round (round 3 of repairs / round 4 of review) claims to fix BOTH real, unresolved HIGH
findings from round 2:
(a) `src/q1/labCheckLogic.ts`'s TESTS array: all three tests now use an EQUALLY specific, real
    test name (白血球 / CRP / クレアチニン -- terms a 10-12 year old likely doesn't already know,
    so none is a free giveaway by itself) with a hint that describes real PURPOSE/function (needed
    for genuine Gate C reasoning -- a fully circular hint gives the player nothing to connect to the
    patient's symptoms with) without stating off/normal status. The distractor (creatinine/kidney)
    is deliberately framed as "a routine, general-purpose check" (medically honest -- it IS a common
    baseline test) rather than "obviously unrelated to breathing", so eliminating it requires
    actually recognizing it doesn't specifically address a respiratory/infection presentation, not
    just noticing it "sounds different" from the other two.
(b) `src/q1/LabCheckGame.tsx`'s "run" step (the selection screen showing gathered results so far):
    now displays each already-run test using its neutral, selection-time `name` and raw `value`
    ONLY -- no diagnostic `label`, no `off`-derived color class -- so a player choosing their SECOND
    test cannot use the first test's revealed diagnostic status as a shortcut. The richer
    diagnostic label/color still appears, unchanged, in the "result" step AFTER both tests are
    locked in.
`factory/harness/gameplay-qa-lab-check.mjs` was updated with two new automated checks: no pre-run
name/hint restates the case's own symptom words or states an off/normal status word, and no test's
pre-run name uses a generic circular placeholder instead of a real, comparably-specific term.

Verify all of this yourself by reading the actual code -- do not take the producer's claims (or this
summary) at face value; adversarially look for a shortcut this round's fix might still allow, or a
new one it might introduce.

Read the actual code:
- src/q1/LabCheckGame.tsx (the "run" step's `lab-screen` preview block specifically, and the
  "result" step further down for comparison)
- src/q1/labCheckLogic.ts (the TESTS array and its comments)
- src/data/content/medical.ts (the "med-doctor" and "med-lab" experience entries, for what case
  context the player has actually seen by the time they reach this choice)
- factory/harness/gameplay-qa-lab-check.mjs (the automated checks, to judge whether they actually
  catch what they claim to)
- factory/rules/q1-first-play-standard.md (primary standard for this review)
- Prior round result JSON files named above, for exact context on what was already tried and why it
  wasn't enough

Specifically verify:
1. Can a first-time player, using ONLY what's shown in-scene (mission text plus each test's pre-run
   name/hint), select the correct 2-of-3 pair by pattern-matching alone -- without connecting the
   test's real purpose to the patient's specific presentation? Or does it now require genuine
   reasoning?
2. Is any test's pre-run name/hint still asymmetric in a way that lets a player win by noticing
   "this one is phrased differently" rather than by reasoning about relevance? Is the distractor's
   new framing ("routine baseline check") actually less trivially eliminable than before, or does it
   introduce a new, different tell?
3. Does the "run" step (selection screen) genuinely no longer reveal ANY diagnostic status (label,
   color, or otherwise) for an already-run test before the second pick is locked in? Trace the
   actual render code, don't just check the one code path the producer describes.
4. Does the "result" step still show the full, richer diagnostic information (label/off-color)
   correctly, unchanged, for both tests once locked in -- i.e. was education actually preserved,
   just moved past the decision point, rather than lost?
5. Any NEW defect introduced by this round: crash, a test becoming unselectable, the done-partial /
   success branching breaking, a mismatch between `rows` and `TESTS` after the render changes.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK) from the standard,
   specifically re-evaluated against this round's changes.
7. Do the two new automated checks in gameplay-qa-lab-check.mjs actually verify what they claim, or
   could they pass while a real leak of this same class still exists?
8. With this round's changes plus the already-fixed panel-realism and brute-force-loop issues from
   round 1, does lab_check now meet the Primary Quality Gate well enough to release? The
   TEXT_ONLY_CONSEQUENCE/WORLD_FEEDBACK_QUALITY finding from round 2 is expected to remain
   non-blocking per clue_board's established precedent -- confirm that precedent genuinely applies
   here too (same finding TYPE, same reasoning), or say so if you believe this instance is actually
   worse/different enough to warrant blocking.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
