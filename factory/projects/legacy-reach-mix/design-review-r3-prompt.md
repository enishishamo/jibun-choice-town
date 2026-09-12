You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 3 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報
担当・実行委員会メンバー, gameType reach_mix) -- design_iteration 2 (REDESIGN #1, translation
switched from t1-primary-audience-budget-tradeoff to t4-scenario-driven-reach),
repair_count 0/1 (fresh budget this iteration), redesign_count 1/2 (one redesign remains if
this FAILs).

**Rounds 1-2 history (both FAIL) -- read both result files in full before anything else:**
- r1 (FAIL 31): v1's session-randomized "which audience is primary" sat on top of FIXED
  reach/cost constants, reducing the game to 3 memorizable lookup answers
  (OBVIOUS_BINARY_CHOICE), plus unsupported hard-zero exclusions (EXCLUSIVITY_OVERCLAIM)
  and a success scene that overclaimed visitor attendance (CAUSAL_REALISM_ERROR).
- r2 (FAIL 38, repair budget exhausted): the r1 repair independently re-rolled every
  channel-audience reach value AND the budget every session -- but the reviewer found this
  created a NEW, deeper problem: **CORE_CAUSAL_MODEL_DISTORTED**. Direct quote: "Audience
  reach is independently randomized inside broad tiers without a modeled cause or
  observable real-world input... the player performs a generated knapsack calculation, but
  does not interpret why a medium is stronger this time. Player-facing copy calls these
  invented rolls '今回の実際の数字,' implying situational evidence the design never
  models." r2 also re-confirmed EXCLUSIVITY_OVERCLAIM (website/poster still hard-zeroed
  several pairs, contradicting the repair's own claim) and a softer but still-present
  CAUSAL_REALISM_ERROR (success text still implied audience recognition beyond what
  research.md supports). r2's own recommended_actions#1: "Route this iteration to
  REDESIGN_REQUIRED rather than another parameter repair" -- and proposed exactly the
  direction this REDESIGN takes: "Replace independently randomized reach scores with
  intelligible scenario evidence that causes performance to vary... so the child interprets
  professional context rather than arbitrary rolls" and "Grade... deterministically...
  press pickup... should not determine whether correct reasoning receives the main success
  recognition" and "Separate actions, exposure indicators... from... attendance."

**What this REDESIGN (t4-scenario-driven-reach) actually does (verify all of this against
the real files, this is the last repair-eligible round before this translation itself would
need to be abandoned for a 2nd redesign):**
- `design/design-sim.mjs` was rewritten around 3 NAMED, PLAYER-VISIBLE scenario facts,
  independently randomized per session and shown to the child BEFORE any channel card:
  `coopInstitutions` (1-3, "今回、配布・掲示に協力してくれる保育園・幼稚園・小学校の数"),
  `followerTier` (0-2, "今回のSNSアカウントのフォロワーの多さ"), `prepWeeks` (1-3, "今回、
  準備にかけられる期間"). EVERY channel's reach to EVERY audience is now a fixed,
  DETERMINISTIC function of these 3 facts (no more independent per-channel dice) -- e.g.
  `flyer.family = 2 + coopInstitutions`, `sns.young = 3 + followerTier`, `poster.older = 1 +
  prepWeeks`. RUN IT: `node factory/projects/legacy-reach-mix/design/design-sim.mjs` --
  expect 18/18 passing. Key numbers: `optimal_reasoning_full_win_rate≈0.85`,
  `certain_route_exists_rate` = family≈0.74/young≈0.89/older≈0.66,
  `fixed_combo_ignoring_session≈0.12` (single round) collapsing to `≈0.002` over 3 rounds
  vs `triple_optimal_reasoning≈0.63`.
- EXCLUSIVITY_OVERCLAIM fix: every channel except `school_board` now has SOME reach
  (possibly 0 in a specific session, but never a hard-coded impossible-to-reach 0 across all
  sessions) to every audience once `prepWeeks>=2` via a shared `secondary` trickle term.
  `school_board`'s reach to young/older remains a genuine, disclosed 0 -- justified as "a
  school/daycare bulletin board is physically visible only to people at that institution."
  Scrutinize whether this ONE remaining hard zero is actually more defensible than the ones
  r2 rejected, or whether it has the same underlying flaw.
- CAUSAL_REALISM_ERROR fix: `game_translations_v4.json`'s adopted `t4`'s `E_consequence`/
  `system_reaction` were rewritten to define success as "予定していた媒体で、必要な分の情報
  発信ができた" (the required volume of information distribution was actually executed as
  planned) -- a claim about the profession's OWN controllable output, never about audience
  awareness, recognition, or attendance. Verify this reframing is applied consistently
  (not just in one field) and that it still reads as a satisfying payoff for a 10-12 year
  old, not so abstract/hollow that success feels unrewarding.
- `media_relations` is no longer gated on/off by prep time (r2 didn't flag this, but the
  redesign removed an earlier internal on/off toggle in favor of continuous scaling) --
  it's always selectable; its potential reach (if coverage happens) scales with
  `prepWeeks`, and the 50/50 coverage probability is still disclosed to the player before
  they commit (unchanged from the r1 repair).
- `core_scope_check_v2.json` was updated (v2 -- it was NOT touched in the r1 repair, which
  r2 flagged as STALE_ARTIFACT_REFERENCE citing v1's obsolete numbers) to reflect the
  current design-sim.mjs v3 numbers.

Verify critically -- this is the decisive question across all 3 rounds now:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself and confirm
   18/18 passing, matching `design-sim-result.json`.
2. **The decisive question**: does grounding every reach number in 3 named, visible
   scenario facts actually satisfy r2's CORE_CAUSAL_MODEL_DISTORTED complaint -- i.e., does
   a 10-12 year old now genuinely INTERPRET why a channel is stronger this session (reading
   "協力施設：2つ" and connecting it to why the flyer card shows a certain family-reach
   number), or does this just add a thin narrative wrapper around what is still, at bottom,
   3 independently-rolled numbers (coopInstitutions/followerTier/prepWeeks) that the child
   never really "interprets" so much as reads off a card and plugs into the same knapsack
   arithmetic as before? Is a DETERMINISTIC FORMULA from 3 visible inputs meaningfully
   different, in terms of genuine professional judgment, from what r2 rejected -- or is this
   still fundamentally the same generated-puzzle structure with better flavor text? Give
   your fully independent, rigorous verdict.
3. **EXCLUSIVITY_OVERCLAIM re-check**: are the SPECIFIC linear formulas (e.g. "family = 2 +
   coopInstitutions", exact constants) themselves a new form of overclaim -- implying a
   precision (a specific formula/slope) that research.md does not actually establish, even
   though the DIRECTION (more institutions -> more family reach) is grounded? Is this an
   acceptable level of game-side numeric abstraction (matching this Factory's established
   "preserve ordinal direction, disclose exact numbers as invented" pattern), or does
   embedding a specific arithmetic formula cross into a NEW, more precise-sounding overclaim
   than the tier-range system r2 rejected?
4. **CAUSAL_REALISM_ERROR re-check**: read `game_translations_v4.json`'s `t4`'s full
   `system_reaction`/`E_consequence`/`job_reveal_bridge`. Does "distribution executed as
   planned" genuinely avoid claiming audience-side awareness/attendance, while still
   delivering a concrete, satisfying success scene a 10-12 year old would find rewarding?
5. Verify BRUTE_FORCE_SUCCESS remains closed and Gate G/Gate H remain properly specified
   (`play_seeds_v3.json`'s `s4-misjudge-then-reflect`).
6. Check for STALE_ARTIFACT_REFERENCE or new internal inconsistencies (e.g. does
   `fact_sheet_v1.json`/`scope_core_v1.json`/`ae_v1.json`, untouched since the original
   submission, still accurately describe the CURRENT `design-sim.mjs`/`game_translations_v4.
   json`? Confirm `core_scope_check_v2.json`'s numbers now actually match a fresh
   `design-sim.mjs` run).
7. Assess `first_5_seconds_v3.json`'s 3-stage disclosure gate (primary audience card ->
   3 scenario-fact cards -> 6 media cards) -- is this legible for a 10-12 year old on a
   375px screen, or does stacking 3 sequential gates before any media card becomes tappable
   create an excessive first-play burden (this was a MEDIUM concern -- FIRST_PLAY_COGNITIVE_
   LOAD -- in r2; assess whether it has gotten better or worse)?
8. Re-assess the fairness question from r1/r2: with the gamble still optional (needed in
   ~19% of sessions per `design-sim-result.json`) and its odds disclosed, does this feel
   fair to a 10-12 year old, or is even an optional disclosed 50/50 element still
   inappropriate for this Factory's established deterministic-mastery pattern?

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `factory/projects/legacy-reach-mix/design-review-r1.result.json` and
   `design-review-r2.result.json` (both full prior verdicts) plus their prompts for context
3. `factory/projects/legacy-reach-mix/research.md` in full (still authoritative)
4. The full CURRENT design chain: `fact_sheet_v1.json` (v2 in pipeline, untouched since
   original), `scope_core_v1.json` (v2, untouched), `ae_v1.json` (v2, untouched),
   `core_scope_check_v2.json` (updated this round), `play_seeds_v3.json`,
   `reference_research_v3.json`, `c_compression_v3.json`, `game_translations_v4.json` (all
   4 translations, adopted=t4), `first_5_seconds_v3.json`, `no_manual_exploit_check_v3.json`,
   `core_back_check_v3.json`, plus `design/design-sim.mjs` (RUN it) and
   `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem. HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. **If this FAILs, one redesign budget remains (redesign_count 1/2) but
this is 3 full rounds now on the same underlying mechanic family (budget-constrained media
mix) -- if you conclude the fundamental structure (read some inputs, pick channels within a
budget to clear per-audience thresholds) cannot avoid OBVIOUS_BINARY_CHOICE or
EXCLUSIVITY_OVERCLAIM regardless of how the numbers are sourced, say so explicitly and
specifically, the way legacy-venue-layout's r6 reviewer did when recommending a
fundamentally different mechanic or scaling back the experience.** Give your most honest,
precise, independent verdict.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "no_invented_threshold":true|false,"obvious_binary_choice_resolved":true|false,
 "scenario_facts_genuinely_interpretable":true|false,"zero_values_honestly_grounded":true|false,
 "probability_disclosed_honestly":true|false,"gambling_element_feels_fair_not_punishing":true|false,
 "causal_realism_honest":true|false,"first_play_cognitive_load_acceptable":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
