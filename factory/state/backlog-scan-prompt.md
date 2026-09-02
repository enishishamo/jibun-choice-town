You are auditing the EXISTING Q1 game components of JIBUN CHOICE (React, Japanese
kids' career game) under the new Gameplay Experience Gate
(factory/rules/game-critic-v2.md, "Game Quality v3" section — read it first).

Scan ALL Q1 game components in src/q1/*.tsx EXCEPT these already-covered new ones:
BabyCareGame, ZooCheckupGame, FeedPrepGame, DebutPlanGame, CurbCheckGame,
PitCraneGame, GasWatchGame, LandfillOpsGame (and non-game helpers like InfoCards).

For each remaining game component, read the code and flag (true/false + one-line
evidence with file:line):
- TEXT_HEAVY_GAMEPLAY: the main loop is reading paragraphs rather than observing
  visual state (grids, meters, moving objects, state-styled elements).
- TEXT_ONLY_FAILURE: action -> explanatory text card ("〜になりました") -> retry,
  with no visual consequence (no state/meter/map/object change shown).
- WEAK_WORLD_FEEDBACK: consequences exist but are mostly narrated, the world's
  visual state barely changes in response to player actions.
- HINT_LEAKAGE: after a failure/mistake the game itself tells the player exactly
  which information (C) to consult or what the correct answer/rule was
  (e.g. 「○○の資料も見てみよう」「△△が正解」), every time, not staged.
- NO_REFERENCE_TRACEABILITY: assume true unless the game clearly embodies a known
  game-design principle (state which if false).

Do not propose full rewrites. This is a repair BACKLOG scan only.

Output: a single JSON object, no prose, no fences:
{"scanned": <n>, "backlog": [
  {"component":"<file>", "gameType":"<id if clear>",
   "flags":{"TEXT_HEAVY_GAMEPLAY":bool,"TEXT_ONLY_FAILURE":bool,
            "WEAK_WORLD_FEEDBACK":bool,"HINT_LEAKAGE":bool,
            "NO_REFERENCE_TRACEABILITY":bool},
   "evidence":["file:line — finding"],
   "repair_sketch":"one line"}
], "worst_offenders": ["<top 5 components by flag count>"]}
Include an entry for EVERY scanned component (even all-false ones).
