You are an INDEPENDENT, ADVERSARIAL reviewer. This is a FOCUSED verification of
THREE games only, against the Game Quality v3 experience axes
(factory/rules/game-critic-v2.md, v3 section — read it first). The other five
Stage-7/8 games already cleared the axes in the previous round; do not re-review them.

READ ONLY: factory/rules/game-critic-v2.md, src/q1/BabyCareGame.tsx,
src/q1/ZooCheckupGame.tsx, src/q1/DebutPlanGame.tsx, src/q1/zooLogic.ts.

Previous round's blockers, and the repairs you must verify in the code:
1. baby_care — "decisions do not change the depicted world; TOC=true; chart does not
   distinguish good from bad calls". Repairs: the growth chart is on every screen and
   each day's call is etched under its date WITH the mentor's ❗ flag on wrong calls;
   a cub mood card reacts to observable data (mood + one-line state); the mentor's
   silent nudge visually highlights chart+diary on a miss.
2. zoo_checkup — "world feedback mostly prose". Repairs: an observation window shows
   the cub with overlays derived only from findings the player has revealed (limp,
   stool, eggs), and its state line changes for done / failed / restraint-aborted;
   burden bar + suspect chips + findings stay visible on ALL screens.
3. debut_plan — "invalid stops return exact gating rules; failure removes the yard".
   Repairs: every refused stop now returns one terse in-world reaction
   (園長は首を横にふった…) with NO rule content; the failed screen keeps a yard
   panel (cub resting in the hide box, sign lamps, visitors leaving).

For each of the three games score WORLD_FEEDBACK_QUALITY and
VISUAL_GAMEPLAY_LEGIBILITY (0-100) and flag TEXT_ONLY_CONSEQUENCE / HINT_LEAKAGE
(booleans, with file:line evidence). PASS bar: both scores >= 70, both flags false.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL","score":0-100,
 "games":{"baby_care":{...},"zoo_checkup":{...},"debut_plan":{...}},
 "blockers":[],"high":[],"medium":[],"low":[],"evidence":[]}
score = min over the three games of min(WFQ, VGL). verdict=FAIL only if a game
misses the PASS bar.

--- ROUND 2 (verify these further repairs) ---
- baby_care: the mistake note is now terse with NO information-source naming
  (「…先輩は何も言わずに、首をかしげた。」); the ❗ etched on the chart is the
  visual consequence; the visual data-highlight was removed entirely.
- zoo_checkup: the attempted treatment plan is now recorded and the observation
  window changes NON-textually with the outcome — cub face 🦝→😸 (done) / 🙀
  (failed), and the tried plan's icon appears beside the cub with ✓ or ✗.
- debut_plan: the failed yard now DEPICTS visitors leaving (🚶🚶🚶 →) and the UI
  no longer double-wraps the refusal quotation.
