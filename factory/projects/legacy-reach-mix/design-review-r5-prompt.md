You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 5 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報
担当・実行委員会メンバー, gameType reach_mix) -- design_iteration 3 (REDESIGN #2, FINAL:
translation switched from t4-scenario-driven-reach to t5-compare-candidate-plans),
repair_count 0/1 (fresh budget this iteration -- the only remaining automated budget of any
kind), redesign_count 2/2 (fully exhausted). **If this round FAILs on the same
CORE_CAUSAL_MODEL_DISTORTED axis and a repair genuinely cannot fix it, this pipeline routes
straight to ESCALATED (Human Decision Required) with no further automated attempts.**

**Rounds 1-4 (all FAIL) -- read all four result files in full before anything else.**
Compressed history: r1 (FAIL 31, OBVIOUS_BINARY_CHOICE: fixed lookup table) -> r2 (FAIL 38,
NEW BLOCKER CORE_CAUSAL_MODEL_DISTORTED: independently-rolled reach numbers had no
in-fiction cause) -> REDESIGN #1 (t1->t4) -> r3 (FAIL 40, same BLOCKER persisted: a single
shared "prepWeeks>=2" cutoff applied to every channel was itself an ungrounded mechanical
rule, and only covered one of each channel's two non-primary audiences, a real code bug) ->
r4 (FAIL 34, same BLOCKER persisted a 3rd time even with per-channel formulas -- the
reviewer explicitly declared this **structural to the mechanic itself**
(`checks.mechanic_structurally_capable_of_passing=false`): "precomputed audience points
plus budget thresholds will continue to make the child solve a synthetic knapsack,
regardless of whether the numbers are random, shared-formula, or per-channel-formula" --
and recommended the final redesign be "a genuinely different interaction... center the
redesign on concrete professional evidence and controllable actions... If the final
redesign still reduces professional judgment to synthetic score-threshold optimization,
route the profession to Human Decision rather than performing another numeric repair."

**This redesign's structural change (verify all of this against the real files -- this is
the decisive test of whether reach_mix's mechanic family can pass at all):**
- The child NO LONGER builds a channel combination against a budget. NO reach numbers, NO
  costs, NO budget, and NO thresholds are shown to the child anywhere in this translation.
  `design/design-sim.mjs` was rewritten around `PLANS` -- 3 fixed, already-composed
  candidate plans (`flyer_plan`={flyer,school_board}->family, `sns_plan`={sns,website}
  ->young, `media_plan`={poster,media_relations}->older) -- and a `planFit(planId,
  session)` function that returns a small ordinal score (0-3) used ONLY internally to
  determine the win condition, never surfaced to the child. RUN IT:
  `node factory/projects/legacy-reach-mix/design/design-sim.mjs` -- expect 18/18 passing.
  Key numbers: `legitimate_reasoning=1` (deterministic mastery, no luck anywhere in the win
  condition now -- the forced media_relations gamble r3/r4 flagged as unfair is GONE
  entirely), `name_match_only≈0.71` overall but `name_match_only_on_trap_sessions≈0.11` on
  the `trap_session_rate≈0.33` of sessions where today's scenario fact specifically weakens
  the audience-matching plan's core channel (proving the scenario facts are load-bearing,
  not decorative), `triple_name_match_only≈0.34` under 3-round compounding.
- `game_translations_v7.json`'s adopted `t5`'s `C_interaction` describes each plan card as
  showing its core channels and a plain-language description of which audience it generally
  suits -- explicitly "具体的な到達人数・点数は一切書かれていない" (no reach numbers or
  points are ever written on any card).
- The `E_consequence` was reframed around visible, concrete PRODUCTION-side consequences
  tied to the chosen plan's own weakness (e.g. picking the flyer-focused plan when very few
  institutions cooperated this session leads to a visible complication -- "flyers left over,
  undistributed" -- rather than a claim about audience awareness or attendance).
- media_relations' real coverage uncertainty (grounded in research.md) is now disclosed only
  as flavor text on the media_plan card ("取材してもらえるかどうかは相手が決める、確約はな
  い") and has ZERO effect on the win condition -- fully resolving r3/r4's
  CORRECT_REASONING_RANDOM_FAILURE HIGH (a disclosed-but-still-unfair forced 50/50 gate).
- `fact_sheet_v3.json`/`scope_core_v3.json`/`ae_v3.json` were rewritten this round (not
  reused stale) to describe the plan-comparison model from the start.

Verify critically -- this is the decisive, final test:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself, confirm
   18/18 passing and matching `design-sim-result.json`.
2. **The decisive, final CORE_CAUSAL_MODEL_DISTORTED question**: with no numbers ever shown
   to the child -- only a priority audience, 3 named scenario facts, and 3 plain-language
   plan descriptions -- does comparing and picking the best-suited plan now constitute
   genuine professional interpretation for a 10-12 year old, the way r4 demanded? Or does an
   internal ordinal scoring function (`planFit`) that a sufficiently attentive child could
   still infer/reverse-engineer from repeated play (audience match + one scenario-weakness
   check) still amount to the same "synthetic knapsack" dressed as a 3-way multiple choice?
   Give your fully independent, most rigorous verdict on whether this specific
   FORM -- compare 3 pre-built plans holistically against named scenario facts, no numbers
   shown -- clears principles.md's "明らかな正解だけの2択" bar and r4's specific objection,
   or whether it's still the same underlying problem. **If you conclude even THIS form
   cannot pass, state explicitly and specifically why -- and whether you believe this means
   the profession itself (not just any one mechanic for it) is incompatible with this
   Factory's standards, the way legacy-venue-layout's r6 reviewer ultimately concluded for
   its profession.**
3. Verify the "trap session" design genuinely works as intended: read `design-sim.mjs`'s
   `planFit`/`planIsWeakenedThisSession` functions and confirm the win condition really
   does require cross-referencing the scenario facts against each plan (not just matching
   plan-topic to audience-name), and that a 3-way multiple choice with a ~33% chance the
   "obvious" answer is wrong doesn't itself read as an unfairly disguised coin-flip trap
   rather than genuine interpretable evidence.
4. **CAUSAL_REALISM_ERROR re-check**: read `game_translations_v7.json`'s `t5`'s full
   `E_consequence`/`system_reaction`. Does it now genuinely avoid any claim about audience
   awareness/attendance in every branch? Does the "production complication" framing
   (flyers left over, post barely seen, weak press response) read as an honest, concrete,
   satisfying consequence for a 10-12 year old, or does r4's WORLD_FEEDBACK_QUALITY concern
   (no visible effect on another person or society) persist because this is still just the
   organizer's own internal production process?
5. Verify BRUTE_FORCE_SUCCESS remains closed and Gate G/Gate H remain properly specified.
6. Verify `fact_sheet_v3.json`/`scope_core_v3.json`/`ae_v3.json`/`core_scope_check_v4.json`
   are now internally consistent with `game_translations_v7.json`/`design-sim.mjs` (no
   remaining STALE_ARTIFACT_REFERENCE from the many prior rounds).
7. Re-verify `scope_core_v3.json`'s `profession_name_hidden_test` / no overlap with
   `legacy-crowd-flow`/`legacy-venue-layout`/`sound_check` still holds under this new D.
8. Assess `first_5_seconds_v5.json`'s first screen (3-stage disclosure gate, now with 3
   plan cards instead of 6 media cards) for legibility on a 375px screen for a 10-12 year
   old.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. All four prior result files (`design-review-r1.result.json` through
   `design-review-r4.result.json`) in full
3. `factory/projects/legacy-reach-mix/research.md` in full
4. The full CURRENT design chain: `fact_sheet_v3.json`, `scope_core_v3.json`, `ae_v3.json`,
   `core_scope_check_v4.json`, `play_seeds_v5.json`, `reference_research_v5.json`,
   `c_compression_v5.json`, `game_translations_v7.json` (all 5 translations, adopted=t5),
   `first_5_seconds_v5.json`, `no_manual_exploit_check_v5.json`, `core_back_check_v5.json`,
   plus `design/design-sim.mjs` (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem. HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. **This is design_iteration 3's only repair budget (0/1) and the
redesign budget is fully exhausted (2/2) -- if you FAIL this and conclude the defect is
fixable by a targeted repair (not a full mechanic change), say so specifically so the next
round can attempt it. If you conclude the same structural CORE_CAUSAL_MODEL_DISTORTED
defect persists and is NOT fixable by a repair-scale change, say so explicitly and as
precisely as possible -- this becomes the primary input for a Human Decision.** Give your
most honest, precise, independent verdict; this is likely the final automated check for
this game.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "no_invented_threshold":true|false,"obvious_binary_choice_resolved":true|false,
 "mechanic_structurally_capable_of_passing":true|false,"defect_fixable_by_repair":true|false,
 "trap_sessions_genuinely_require_scenario_reading":true|false,
 "causal_realism_honest":true|false,"world_feedback_adequate":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
