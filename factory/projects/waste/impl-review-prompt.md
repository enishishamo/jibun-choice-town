You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career game,
Japanese grades 4-6). Review the SHIPPED IMPLEMENTATION of the new world 「ごみのゆくえ」
(4 Q1 games). This is the binding two-axis gate for the world.

READ ONLY THESE FILES (do not explore further; do not run anything):
- src/q1/wasteLogic.ts            — all rules (the single source of truth)
- src/q1/CurbCheckGame.tsx        — curb_check UI
- src/q1/PitCraneGame.tsx         — pit_crane UI
- src/q1/GasWatchGame.tsx         — gas_watch UI
- src/q1/LandfillOpsGame.tsx      — landfill_ops UI
- src/data/content/waste.ts       — world data (missions, professions, wrapUp)
- factory/rules/game-critic-v2.md — rubric + calibration (BINDING)

Trusted context you may rely on WITHOUT re-verifying (already machine-checked):
- gameplay sims (factory/harness/gameplay-qa-waste.mjs, 24/24 pass): blind load-all 0/500;
  pit no-action/dry-spam 0%, informed 100%; gas all-4-inspect impossible, panic never wins,
  2-check triage 500/500; landfill duty+concentration 100%, shirking <5%, 300/300 solvable.
- Browser QA: all 4 games completed on mobile 375px + desktop, wrapUp/JobReveal verified,
  no console errors. Design-phase critique ran 5 iterations; the fact base is
  factory/projects/waste/research.result.json (850C dioxin rule, truck-fire hazards,
  daily-cover duties, leachate treatment, 24.8-year national landfill figure).

Judge BOTH axes on the CODE as children will experience it:
1. CAREER_AUTHENTICITY — do the implemented rules and texts faithfully express each job's
   real judgments (curbside accept/reject with hazard isolation; crane mixing for fuel
   homogeneity with the 850C rationale; alert triage before requesting the right team;
   duty covering + typed intake + leachate)? Facility-specific simplifications must be
   labeled as such in-game (check the InfoCards texts).
2. GAME_QUALITY — per rubric: C_required without C-alone determinism, per-case judgment,
   causality, exploit resistance in the UI layer (e.g. does the UI leak answers? can
   disabled/enabled button states be used as an oracle? does any text reveal the correct
   choice before the player commits?), failure with cost, retry with re-randomization,
   mastery/replay, and within-world mechanic diversity.

Also check: safety texts for children (lithium battery guidance), and that the four
statements (CORE LOOP / MASTERY / REPLAY / NOVICE-VS-EXPERT) are satisfiable from code.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of axes. FAIL if any blockers or high remain.
