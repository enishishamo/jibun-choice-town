You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children, target age roughly 10-12). The game lab_check
(clinical lab technologist, second scene of the "er-patient" event, gameType: lab_check) has been
repaired a third time.

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
- Round 1 (independent review after the initial "limited sample, choose 2 of 3 tests" redesign):
  2 HIGH -- (a) two of the three tests competed for the same single-purpose tube in a way real labs
  don't (CBC panels are drawn together), and (b) unlimited in-place retry let a player brute-force
  all 3 possible pairs within one experience without ever reading the case.
- Round 2 (after a repair): fixed the panel-realism issue (swapped the second distractor test to a
  genuinely separate assay, kidney function/creatinine) and closed the in-place brute-force loop (a
  wrong pair now ends the experience via an honest, distinct "done-partial" outcome instead of an
  unlimited retry loop). Independent review still returned FAIL with one HIGH left unresolved:
  "患者文脈を使わない固定攻略が成立する" -- the pre-run test `name`/`hint` text itself named each
  test's diagnostic category ("ばい菌とたたかう係" for the white-cell count, "からだのどこかが
  「もえている」ときに増えるもの" for CRP) while the sole distractor's hint ("老廃物をうまく出せて
  いるか") read as obviously unrelated -- so a player could pick the correct pair by pattern-matching
  loaded words against the patient's own symptom vocabulary (fever/cough/breathlessness = "sounds
  infection-y") without ever reading a single test RESULT or connecting anything case-specific. This
  is the exact same class of defect as clue_board's round-1/2 "evaluative words leak which vitals are
  abnormal" finding, applied to test *selection* instead of vitals *interpretation*.
  (See factory/projects/q1-improve-lab-check/repair-review.result.json for the full round-2 verdict.)

This round (round 3) claims to have fixed the remaining HIGH by:
(a) Reworking the pre-run `name`/`hint` fields (src/q1/labCheckLogic.ts, TESTS array) so they
    describe only the literal, neutral thing being measured -- no diagnostic-category or
    case-matching words ("たたかう", "炎症", "もえ", or the case's own symptom words "熱"/"せき"/
    "息苦し"). The richer, category-revealing explanation still exists in `label`/`means`, but those
    are only shown AFTER a test has been run (post-selection), so the education is not lost, only
    moved past the point where it could leak the pre-selection answer.
(b) Adding brief in-scene patient-context restatement to this experience's own mission text
    (src/data/content/medical.ts, "med-lab" entry: "熱・せき・息苦しさがある人の血液。") since
    previously this SCENE showed zero case-specific information at all -- the "judge which test is
    relevant" decision had no in-scene information to be based on regardless of wording.
factory/harness/gameplay-qa-lab-check.mjs adds an automated check that no test's pre-run name/hint
contains a diagnostic-category or case-matching word. Verify these claims yourself by reading the
actual code -- do not take the producer's own claim at face value.

Read the actual code:
- src/q1/LabCheckGame.tsx
- src/q1/labCheckLogic.ts
- src/data/content/medical.ts (the "med-lab" experience entry specifically, and "med-doctor" right
  above it in the same file, to see what case context the player already saw earlier in this event)
- factory/rules/q1-first-play-standard.md (primary standard for this review)
- factory/rules/game-critic-v2.md (as amended 2026-09-07 -- read the amendment notice at the top)
(Do NOT read factory/projects/q1-improve-lab-check/*.md notes about this rework -- judge the code.)

Specifically verify:
1. Can a first-time player, using ONLY the text shown in-scene (this experience's own mission lines
   plus each test's pre-run name/hint), select the correct 2-of-3 test pair by pattern-matching
   words alone -- without needing to actually reason about which test would inform THIS patient's
   presentation? Or does selecting correctly now require genuine reasoning from the case context to
   the test's (still real, still honest) purpose?
2. Does any test's pre-run name/hint still leak its diagnostic category or off/normal status before
   it is run? Is the distractor (kidney) still distinguishable from the other two by asymmetric
   specificity or tone, rather than by actual case-relevance reasoning?
3. Is the post-run education (label/means) still intact and medically honest (nothing removed, only
   moved past the selection point)?
4. Any NEW defect introduced by these two changes (e.g., does the reworded mission text accidentally
   restate too much and answer the question outright; does anything become incoherent or
   inconsistent with med-doctor's earlier framing of the same patient)?
5. Any remaining FIRST-PLAY-relevant answer leak, brute-force path, or C-not-required shortcut you
   can find (not replay/mastery-only concerns -- those are out of scope per the standard above).
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK) from the standard
   specifically, given the round-3 changes.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
