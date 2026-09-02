You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children). The radiographer game XrayGame was rebuilt
(Stage 4). Try hard to find real defects — exploits, fake choices, memorization shortcuts,
authenticity failures. Read the actual code:

- src/q1/XrayGame.tsx          — the rebuilt component
- src/q1/xrayLogic.ts          — the pure rules (framing geometry, budget, timing, delivery)
- src/q1/BodyInsideView.tsx    — patient rendering (build scale, posture offset, frame, clip)
- factory/rules/game-critic-v2.md        — rubric + calibration you MUST apply
- factory/harness/design-principles.md   — A->B->C<->D->E conditions
- factory/harness/gameplay-qa-xray.mjs   — automated behavior tests that currently pass (verify their claims against the code)

CALIBRATION (binding): C_required=true is desirable. A defect exists only when
C_alone_determines_answer=true — i.e. reading the order sheet alone fixes every input without
any per-patient observation, timing skill, or visual judgment remaining. Note the order sheet
here teaches PRINCIPLES (lungs sit below the shoulders; bigger bodies image larger; shoot at
breath hold; wide frames cost double) while the correct framing depends on the randomized
patient (3 builds x 3 postures) that the player must LOOK at, the shutter depends on reading
the live breathing cycle, and delivery depends on visually judging the clipped image.
Simple UI / few options are fine for children; only absence of real judgment is a defect.

Evaluate BOTH axes and score each:
1. CAREER_AUTHENTICITY — does it capture the radiographer's real professional judgments
   (framing/collimation, exposure economy/ALARA, breath-hold timing, image adequacy
   self-check; the observation note correctly framed as assistance to the doctor, not
   diagnosis)?
2. GAME_QUALITY — per the rubric: meaningful choice, failure with cost, causality,
   exploitability (try: button spam, always-L strategy, select-everything, memorization
   across restarts given the case re-randomizes), mastery, replay, variation.

Also verify the four statements are satisfiable from code: CORE LOOP / MASTERY / REPLAY /
NOVICE VS EXPERT.

Output (STRICT — single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
