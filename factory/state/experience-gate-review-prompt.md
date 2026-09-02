You are an INDEPENDENT, ADVERSARIAL reviewer. Judge ONLY the Game Quality v3
"Gameplay Experience / Game Reference Gate" axes (factory/rules/game-critic-v2.md,
the v3 section — read it first) for the 8 NEW Q1 games of Stage 7/8.

READ ONLY THESE FILES (do not run anything):
- factory/rules/game-critic-v2.md (v3 section = the rubric for THIS review)
- src/q1/CurbCheckGame.tsx, PitCraneGame.tsx, GasWatchGame.tsx, LandfillOpsGame.tsx
- src/q1/BabyCareGame.tsx, ZooCheckupGame.tsx, FeedPrepGame.tsx, DebutPlanGame.tsx
- src/q1/wasteLogic.ts, src/q1/zooLogic.ts (only to understand what the UI shows)
- factory/taxonomy/gameplay-references.json (the traceability record to verify)

For EACH of the 8 games score 0-100:
- WORLD_FEEDBACK_QUALITY: are consequences shown as world changes (meters, grids,
  moving objects, state-styled elements, visual refusals) rather than only narrated?
- VISUAL_GAMEPLAY_LEGIBILITY (observer test): could someone watching the screen,
  not reading paragraphs, roughly tell what the player is doing / what failed /
  what changed?
And flag booleans with evidence:
- TEXT_ONLY_CONSEQUENCE: main loop is action -> explanatory text card -> retry.
- HINT_LEAKAGE: after a mistake the game immediately tells the exact rule or which
  C to consult, unstaged. (A mentor silently pointing, highlighted data, or a
  generic nudge is NOT leakage. A takeover/failure screen teaching general method
  after the run ends is acceptable staged teaching.)
Verify GAMEPLAY_REFERENCE: does gameplay-references.json have a non-empty,
principle-level (not skin-copy) entry for the game, and does the implemented loop
actually embody the claimed principle (traceability)?
Answer the GAME-LIKENESS question per game: with the career content removed, does
the interaction loop retain game-like fun/mastery? (If inseparable, say why.)

PASS bar per game: WORLD_FEEDBACK_QUALITY >= 70, VISUAL_GAMEPLAY_LEGIBILITY >= 70,
TEXT_ONLY_CONSEQUENCE=false, HINT_LEAKAGE=false, reference entry valid, and the
game-likeness answer is YES (or convincingly inseparable).

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL","score":0-100,
 "games":{"<gameType>":{"WORLD_FEEDBACK_QUALITY":0,"VISUAL_GAMEPLAY_LEGIBILITY":0,
  "TEXT_ONLY_CONSEQUENCE":false,"HINT_LEAKAGE":false,"reference_valid":true,
  "game_likeness":"YES|NO|INSEPARABLE — one line why"}},
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
verdict=FAIL if any game misses the PASS bar. score = min over games of
min(WORLD_FEEDBACK_QUALITY, VISUAL_GAMEPLAY_LEGIBILITY).
