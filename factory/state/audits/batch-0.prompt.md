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
- drag_and_drop (MenuGame) — src/q1/MenuGame.tsx [給食編]
- inspect_and_measure (CookGame) — src/q1/CookGame.tsx [給食編]
- sow_and_grow (FarmGame) — src/q1/FarmGame.tsx [給食編]
- load_and_route (LogisticsGame) — src/q1/LogisticsGame.tsx [給食編]
- sort_out (RecycleGame) — src/q1/RecycleGame.tsx [給食編]

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