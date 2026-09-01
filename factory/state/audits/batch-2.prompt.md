You are an INDEPENDENT game-quality auditor for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children, React+TS). Audit each game below by READING
ITS ACTUAL COMPONENT CODE — never guess from names.

First read the rules you must apply:
- factory/rules/game-critic-v2.md          (rubric + calibration; two-axis scoring)
- factory/harness/design-principles.md     (A->B->C<->D->E, calibrated conditions)

CALIBRATION (critical): C_required=true is DESIRABLE. Only flag as a defect when
C_alone_determines_answer=true, i.e. after reading the in-game documents no player judgment,
observation, timing, or comparison remains. Simple UI / few options are fine for children;
absence of real decisions is not.

Games to audit (read each component file, plus src/q1/gameTypes.ts once if needed):
- sourcing_mix (SourcingGame) — src/q1/SourcingGame.tsx [物価高編]
- recipe_balance (RecipeGame) — src/q1/RecipeGame.tsx [物価高編]
- package_design (PackageGame) — src/q1/PackageGame.tsx [物価高編]
- line_debug (FactoryLineGame) — src/q1/FactoryLineGame.tsx [物価高編]
- plan_mix (PlanEventGame) — src/q1/PlanEventGame.tsx [イベント編]

For EVERY game output one object with EXACTLY these fields:
{
  "gameType": "...",
  "event": "world/section name",
  "job": "the profession",
  "mechanic": "primary challenge structure in your own words",
  "C": "what job-specific info/tools/data the game provides",
  "D": "what judgments/operations the player performs with C",
  "C_required": true|false,
  "C_alone_determines_answer": true|false,
  "player_judgment_required": true|false,
  "action_changes_result": true|false,
  "failure": "does meaningful failure exist and what does it cost",
  "retry": "how retry works",
  "mastery": "what a skilled player does differently (or 'none')",
  "replay": "what differs on a second play (or 'none')",
  "variation": "what varies between sessions (or 'none')",
  "exploit": "cheapest way to win: button spam / select-all / brute force / memorize / none-found",
  "career_authenticity_score": 0-100,
  "game_quality_score": 0-100,
  "overall_risk": "low|medium|high — one-line why",
  "core_loop_statement": "...",
  "mastery_statement": "...",
  "replay_statement": "...",
  "novice_vs_expert": "...",
  "evidence": ["file:line — what you saw"]
}

Scoring guide: 75+ complete-candidate / 60-74 improvable / <60 needs repair.
career_authenticity_score judges whether the game captures the job's REAL specific judgments
and constraints; game_quality_score judges whether it works as a game (per the rubric).

Your ENTIRE final message must be a single JSON array with one object per game, no prose, no code fences.