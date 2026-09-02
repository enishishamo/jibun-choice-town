You are an INDEPENDENT, ADVERSARIAL reviewer. FINAL focused check of ONE game,
debut_plan, against the Game Quality v3 experience axes
(factory/rules/game-critic-v2.md, v3 section). baby_care and zoo_checkup cleared
the bar in the previous round (73/76 and 82/84, both flags false) — do not
re-review them.

READ ONLY: factory/rules/game-critic-v2.md, src/q1/DebutPlanGame.tsx,
src/q1/zooLogic.ts (debut section).

Previous round's only remaining flag: HINT_LEAKAGE=true because the refused-stop
message stated the gating rationale. Verify the repair: refused stops now return
STAGED, RULE-FREE reactions — 1st refusal 「園長は、だまって首を横にふった。」,
later refusals 「園長は首を横にふった。（何かが、まだ足りないようだ）」
(src/q1/zooLogic.ts debutStep, stopRefusals counter). No rule content, no
information-source naming; the ladder lives only in the C card and the sign lamps.

Score WORLD_FEEDBACK_QUALITY and VISUAL_GAMEPLAY_LEGIBILITY (0-100), flag
TEXT_ONLY_CONSEQUENCE and HINT_LEAKAGE (booleans, file:line evidence).
PASS bar: both scores >= 70, both flags false.

Output (STRICT — single JSON object, no prose, no trailing text):
{"verdict":"PASS|FAIL","score":0,
 "games":{"debut_plan":{"WORLD_FEEDBACK_QUALITY":0,"VISUAL_GAMEPLAY_LEGIBILITY":0,
  "TEXT_ONLY_CONSEQUENCE":false,"HINT_LEAKAGE":false}},
 "blockers":[],"high":[],"medium":[],"low":[],"evidence":[]}
