You are an INDEPENDENT reviewer for the JIBUN CHOICE Mechanics Library (Stage 2 deliverable).
Read the actual files yourself (read-only repo access):

- factory/taxonomy/mechanics-library.json   — challenge-level reusable mechanics library
- factory/taxonomy/job-mechanics-map.json   — job-difficulty -> mechanics mapping
- factory/lab/job-difficulty-taxonomy.md    — the difficulty taxonomy the map keys refer to
- factory/lab/research/games.json           — research corpus the library must be grounded in
- factory/taxonomy/mechanics-taxonomy.md    — existing 16 interaction patterns (operation layer, kept as seed)

Acceptance criteria to judge:

1. Every library entry has: mechanic_id, description, player_action, skill_expression,
   failure_mode, replay_value, suitable_job_difficulties, unsuitable_cases, age_complexity,
   example_patterns, and a `layer` field. The library is INTENTIONALLY three-layered
   (this is the project owner's specification, do not flag it):
   - layer=challenge — in-session sources of difficulty/fun; must be genuine challenge
     structures, not operations, rewards, or genre labels
   - layer=modifier — solution-space / session-variety shapers (e.g. variable conditions,
     multiple valid solutions, escalating difficulty)
   - layer=motivation — long-term drive (e.g. score optimization, collection, persistent
     learning); the library must make clear these never substitute for a challenge mechanic
   Judge each entry against ITS OWN layer's definition. Definitions are title-independent;
   an `evidence_games` provenance field is expected and is not title-dependence — but flag
   provenance that misrepresents what the cited game actually exhibits per games.json.
2. The library is grounded: the mechanics collectively cover the dominant structures found in
   the 15-game research corpus (limited attempts, time pressure, partial information, dynamic
   state, tradeoffs, sequencing, spatial optimization, risk/reward, delayed feedback,
   uncertainty, combination search, prioritization, escalating difficulty, variable conditions,
   multiple valid solutions, score optimization, collection, persistent learning — or justified
   equivalents). Flag important recurring structures from games.json that the library misses.
3. No duplicated/overlapping entries that should be merged; ids are snake_case.
4. suitable_job_difficulties values all exist in job-difficulty-taxonomy.md; the map in
   job-mechanics-map.json is consistent with the library (spot-check several).
5. The old 16-category interaction taxonomy is preserved as the operation layer, not deleted.
6. games.json entries have normalized_mechanics referencing only existing library ids.

Output format (STRICT): your ENTIRE final message must be a single JSON object:
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"blockers":[],"high":[],"medium":[],"low":[],"evidence":["file — finding"],"recommended_actions":[]}
verdict must be FAIL if any blockers or high remain.
