You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career
game, Japanese grades 4-9). Review the SHIPPED IMPLEMENTATION of the new world
「もりをきる、もりをまもる」 (3 Q1 games). This is the binding gate for the world.

READ ONLY THESE FILES (do not explore further; do not run anything):
- src/q1/forestLogic.ts          — all rules (single source of truth)
- src/q1/ThinningPickGame.tsx    — thinning_pick UI
- src/q1/FellDirectionGame.tsx   — fell_direction UI
- src/q1/PlantPlanGame.tsx       — plant_plan UI
- src/data/content/forest.ts     — world data
- factory/rules/game-critic-v2.md — rubric incl. v3 experience gate (BINDING)
- factory/rules/language-style.md — language rules (BINDING)

BINDING CALIBRATION (user ruling): a rule card × TODAY'S data deriving the
answer is the accepted series pattern; refusals may be terse world reactions.
Handing an impossible tree to the machine team is a CORRECT outcome by design
(justified restraint), not a fail state.

Trusted context (machine-checked, do not re-verify):
- gameplay sims 22/22 (factory/harness/gameplay-qa-forest.mjs): future tree
  protected; stem-counting traps caught (2-thin under floor, all-thin leaves
  damaged mids, all-thick blows the cap); signal-skipping stopped 100%;
  machine-spam wastes the day 100%; fence-everything always breaks the budget;
  fit/deer violations caught 100%; informed strategies 100% complete.
- Browser QA (mobile 375px): all 3 games completed by bots through wrapUp,
  zero console errors.
- Fact base: factory/projects/forest-care/research.result.json (材積率と本数率の
  違い, 受け口の法定深さ, 合図・退避の義務, 列状/定性間伐, 低密度植栽とシカ害,
  「切る=保全」は計画+適量+更新がそろう場合に限る).

Judge CAREER_AUTHENTICITY, GAME_QUALITY (v3: world feedback incl. the 5-year /
3-year previews, staged hints, no oracles, no answer leaks) and LANGUAGE
(language-style.md: selective ruby 間伐/選木/受け口/再造林/材積, short buttons,
sentence limits, middle-school fit, visual-first).
Also check safety framing: chainsaw work is adult-with-training; dangerous acts
are stopped BEFORE harm; failure never shows injury; "cutting=protecting" is
conditional (plan+replant), not absolute.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0,
 "career_authenticity_score":0,"game_quality_score":0,
 "language":{"LANGUAGE_AGE_FIT":0,"FURIGANA_SUPPORT":0,"TEXT_DENSITY":0,
  "BUTTON_CLARITY":0,"TECHNICAL_TERM_SUPPORT":0,"VISUAL_LANGUAGE_SUPPORT":0},
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min(career, game). FAIL if any blockers or high remain, or
LANGUAGE_AGE_FIT/BUTTON_CLARITY/TEXT_DENSITY < 80.

--- ITERATION 2 CONTEXT (repairs since iteration 1) ---
Verify these repairs; judge what remains:
- plant_plan preview is now HONEST: a species that does not fit the zone's
  moisture withers in the 3-years preview (「場所に合わず、枯れた…」),
  distinguished from deer damage; ok requires species AND speciesFit AND guard.
- Staged world reactions (where, never why): thinning — the senior WALKS TO the
  problem (👷 appears at the meter for rate problems, beside an unmarked damaged
  tree, or in the cut lane); plant — the senior crouches at ONE zone (orange
  highlight, findFaultZone); fell — a wrong-direction cut now shows the tree
  TILTING the chosen way and being yanked back upright by the wire (🪢⛓ CSS
  snap-back animation) before the whistle note.
- Ruby coverage: ｜伐《き》る added at first use per screen (areaLead, incident
  title, q2 body, mission, wrapUp); 材積/選木/受け口/再造林 already carried ruby.
- Gameplay sims 22/22 after changes; mobile browser flow passes end-to-end,
  zero console errors.

--- ITERATION 3 CONTEXT ---
Single remaining HIGH repaired: the machine-team refusal for a hand-fellable
tree no longer names the cause (now: 「機械班は道具を持ったまま、しばらく
こちらを見て、だまって戻っていった。」— a silent world reaction; the day meter
still ticks). Verify and finalize. Sims 22/22 re-run.

--- ITERATION 4 CONTEXT ---
Final HIGH repaired: a cut attempted BEFORE the signal now shows NO tree motion
at all — the chief stops it with engines off (crossed arms note only); the
tilt-and-wire-snap animation plays only when the saw legitimately started
(direction mistakes after a completed signal). Verify and finalize.
