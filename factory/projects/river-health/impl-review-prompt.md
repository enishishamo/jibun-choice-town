You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career
game, Japanese grades 4-9). Review the SHIPPED IMPLEMENTATION of the new world
「川に魚がもどった！」 (3 Q1 games). This is the binding gate for the world.

READ ONLY THESE FILES (do not explore further; do not run anything):
- src/q1/riverLogic.ts           — all rules (single source of truth)
- src/q1/WaterTraceGame.tsx      — water_trace UI
- src/q1/PlantOpsGame.tsx        — plant_ops UI
- src/q1/BankDesignGame.tsx      — bank_design UI
- src/data/content/river.ts      — world data
- factory/rules/game-critic-v2.md — rubric incl. v3 experience gate (BINDING)
- factory/rules/language-style.md — language rules (BINDING)

BINDING CALIBRATION (user ruling): a rule card × TODAY'S data deriving the
answer is the accepted series pattern; refusals may be terse world reactions;
staged hints point WHERE, never WHY.

Trusted context (machine-checked, do not re-verify):
- gameplay sims 19/19 (factory/harness/gameplay-qa-river.mjs): zero-sample and
  under-2-sample conclusions refused; budget enforced; comparison-reading play
  concludes correctly 100%; the stocking-poster shortcut loses when the river
  actually recovered; up/down/keep aeration spam all fail while load-matching
  passes 100%; concrete-everything never passes bank design while the
  minimum-protection plan always does; nature score rewards restraint (+3 avg).
- Browser QA (mobile 375px): all 3 games completed by bots through wrapUp,
  zero console errors.
- Fact base: factory/projects/river-health/research.result.json (B類型基準値,
  上下流比較の作法, 放流魚と回復の区別, 活性汚泥の過曝気リスク, 多自然川づくり
  基本指針=必要最小限の護岸, 魚道の個別設計).

Judge CAREER_AUTHENTICITY, GAME_QUALITY (v3: world feedback — river band with
flags, tank bubbles/microbe face/power meter, riverStrip + 3-year preview;
staged where-not-why reactions; no oracles; no answer leaks) and LANGUAGE
(selective ruby 溶存酸素/活性汚泥/瀬・淵/魚道; short buttons; sentence limits;
middle-school fit). Fairness framing: the game must never pin recovery on one
facility from one number, and never make solo river entry look like a win.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0,
 "career_authenticity_score":0,"game_quality_score":0,
 "language":{"LANGUAGE_AGE_FIT":0,"FURIGANA_SUPPORT":0,"TEXT_DENSITY":0,
  "BUTTON_CLARITY":0,"TECHNICAL_TERM_SUPPORT":0,"VISUAL_LANGUAGE_SUPPORT":0},
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min(career, game). FAIL if any blockers or high remain, or
LANGUAGE_AGE_FIT/BUTTON_CLARITY/TEXT_DENSITY < 80.

ITERATION 2 CONTEXT (fixes since your R1 FAIL — verify them, do not assume):
- water_trace wrong conclusions now bounce VISIBLY: the submitted card dims,
  gains a 📄↩ stamp and 「差し戻し」 text (WaterTraceGame.tsx bounced state).
- plant_ops done screen is honest: with troubles>0 the title and line change
  (「なんとか守りきった」＋ひやり回数); 「ぜんぶ基準内」 only when troubles===0.
- wrapUp no longer asserts recovery: new title 「「魚がもどった」を、たしかめ
  られる人がいる。」 and lines about verification/accumulation — consistent with
  a not_recovered playthrough.
- Ruby added: 護岸/堰/微生物/魚道 at first use (components + river.ts);
  lensSummary rows now render through withRuby (AreaScreen).
- Long q2 sentences split (designer what/himitsu bodies).
Machine re-checks after fixes: gameplay sims 19/19, flow bot all 3 games +
wrapUp, zero console errors, tsc clean.

ITERATION 3 CONTEXT (fixes since your R2 FAIL — verify, do not assume):
- Font sizes raised: global .game-line 16px, .choice-name 14.5px, .game-note
  14.5px, .task-now 15.5px (src/index.css). Decision-critical trace readings now
  ALSO appear in a 16px 野帳 (field notebook) readout under the river band;
  spot flags raised to 11.5px bold (compact map labels, full values in notebook).
  Note the calibration: small text on map flags/diagram annotations is allowed
  when the same data is available at body size — the notebook provides that.
- wrapUp no longer contradicts a not_recovered playthrough: trace done screen
  adds a bridge line (「まだ」の記録が再調査の出発点…) for not_recovered cases;
  wrapUp lines now include 「まだ」と記録された月もあった; afterLabel is
  「いま：再調査で確かめられた、魚のかげ」 — recovery is a later, re-verified
  state, not this playthrough's assertion.
Machine re-checks: sims 19/19, flow bot all 3 games + wrapUp, 0 console errors.

ITERATION 4 CONTEXT (fix since your R3 FAIL — verify in riverLogic.ts):
- bank_design now has REAL case variation (newBankCase): homes/bend/fields all
  randomize erosion/homesBehind. A SEVERE section (homesBehind AND erosion,
  「⚠水が家にせまる」 in the row) can ONLY be held by concrete — stone_root is
  refused as unsafe. fields can now erode (strong). The budget varies per case
  (minimal safe plan + 1 slack), so gratuitous concrete busts it.
- Consequence (machine-verified in gameplay-qa-river.mjs, 22/22): the R3 fixed
  answer (stone/stone/leave/fishway) now FAILS in >25% of cases; players must
  read each section's conditions. Rule card teaches the severe rule without
  leaking any per-case answer; the chief still taps only WHERE.
Machine re-checks: sims 22/22, flow bot (severity-aware) all 3 games + wrapUp,
0 console errors, tsc clean.

ITERATION 5 CONTEXT (fixes since your R4 FAIL — verify in code):
- necessary-minimum is now MACHINE-ENFORCED: bankValidate rejects concrete on
  ANY non-severe section as over_armored (even within budget). Concrete is
  valid ONLY where nothing else holds (severe = homes behind an eroding bank).
  QA: gratuitous concrete on a strong section rejected 100%; concrete-everything
  never passes; fixed-answer play still fails >25% of cases (22/22 sims).
- Ruby/labels: 稚魚 poster now ruby'd; bank preview 瀬（せ）と淵（ふち）;
  buttons shortened: 回復はまだ(5)・石積み(3)・魚道(2).
Machine re-checks: sims 22/22, flow bot passes, 0 console errors, tsc clean.

ITERATION 6 CONTEXT (fix since your R5 FAIL — verify in code):
- The WHERE hint can no longer drift from the validator: riverLogic now exports
  bankFaultSection(c, plan) that mirrors bankValidate's scan order exactly
  (severe-without-concrete, strong-with-leave, AND non-severe-with-concrete all
  return the offending section). BankDesignGame's manual fault loop is DELETED
  and replaced by this single source of truth; the chief's tap highlights the
  actual rejected section including over_armored strong sections.
- New sim (23/23): 2000 random case×plan combos — every non-budget rejection
  gets a WHERE hint naming a real offending section.

ITERATION 7 CONTEXT (fix since your R6 FAIL — verify in BankDesignGame.tsx):
- The selected section's decision-critical conditions now appear at BODY SIZE:
  a 16px .game-line readout under the 工法 title (「この区間のようす：うしろに家・
  けずられたあと🌊・⚠水が家にせまる区間」), updating with the selection. The
  13px row strip remains as the map overview; the same data is now readable at
  body size (same calibration as the trace 野帳).

ITERATION 8 CONTEXT (fix since your R7 FAIL — verify in WaterTraceGame.tsx):
- The conclusion cards' explanatory subs are DELETED (they mapped each
  conclusion to its observation pattern). Cards now carry only the label;
  the player must derive the pattern from the readings themselves. The
  bounced-card 差し戻し tag remains as world feedback.
Reminder of already-verified fixes (do not re-open): honest wrapUp/not_recovered
bridge, 16px 野帳 + bank section readout, necessary-minimum concrete rule with
bankFaultSection WHERE hints, shortened buttons, selective ruby (稚魚・護岸・堰・
瀬・淵・魚道・溶存酸素・活性汚泥・微生物). Sims 23/23, flow bot passes, tsc clean.

ITERATION 9 CONTEXT (fixes since your R8 FAIL — verify in code):
- 魚道の個別設計を実装: BankCase now carries fish (小さなウグイ・泳ぐ力よわい /
  大きなアユ・つよい, randomized). The weir offers TWO fishway designs
  (ゆるい魚道/急な魚道); the mismatch is rejected as wrong_fishway and the chief
  taps the weir (bankFaultSection). The fish note appears at body size when the
  weir is selected; the rule card states the general rule (泳ぐ力に合う形を選ぶ)
  without leaking the per-case answer. 3-year preview shows a mismatched
  fishway as 「…入り口で魚が止まる」.
- bank resolution no longer asserts creatures return: 「工事のあとも調査は続く。
  もどってくるかは、川と数字が教えてくれる。」 — consistent with the
  continued-verification framing.
Machine re-checks: sims 24/24 (incl. mismatched-fishway rejection 200/200),
flow bot reads the fish note and passes, tsc clean.

ITERATION 10 CONTEXT (fix since your R9 FAIL — verify in BankDesignGame.tsx):
- Rejections now show a WORLD consequence, not just a finger-point: the tapped
  (faultSec) section's row renders the engineer's trial run of THAT section —
  試算🐟：入り口で魚が止まる (mismatched fishway), 試算🌊：増水で家まで水が
  (severe under-protected), 試算🌊：岸がけずられていく (strong left bare),
  試算…：生きものの気配が消える (gratuitous concrete). Staged: only the tapped
  section is simulated, so no full-answer leak; the failure loop is now
  choice → visible consequence on the drawing → retry.
Machine re-checks: sims 24/24, flow bot passes, tsc clean.

ITERATION 11 CONTEXT (fix since your R10 FAIL — verify in PlantOpsGame.tsx):
- plant_ops action→world causality is now explicit: after each action a result
  line inside the tank ties the visible DO to the action that produced it —
  「朝の操作「💨 上げる」→ DO 2.4（みどりの帯の中 ✓ / 帯の外 ⚠）」 — while the
  task bar shows the NEXT slot and its inflow. The visible state is the tank
  the next slot starts from, and its provenance is now on screen.

ITERATION 12 CONTEXT (fix since your R11 FAIL — verify in BankDesignGame.tsx):
- The tapped section's trial run is now a VISUAL state change of the row, not a
  sentence: the row band itself floods (water gradient reaching the 🏠, icon
  🌊🌊🏠), erodes (bitten bank band, 🌊🕳), turns dead gray concrete (⬜🚫🐟),
  or shows the fish stopped at the weir (🐟↩⛔ / 🐟⤵🚧) — with only a tiny
  caption underneath. An observer who reads no text sees the flooded/gray/
  stopped-fish state on the drawing. Staged: only the tapped section simulates.
