You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 2 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報
担当・実行委員会メンバー, gameType reach_mix) -- design_iteration 1, this iteration's LAST
repair (repair_count 1/1 now used). Redesign budget is fully available (redesign_count 0/2)
if this round FAILs.

**Round 1 verdict (FAIL, score 31): 3 BLOCKERs, 4 HIGH, 3 MEDIUM.** Read
`factory/projects/legacy-reach-mix/design-review-r1.result.json` in full before anything
else -- it is the ground truth for what this repair claims to have fixed. Summary:
- BLOCKER OBVIOUS_BINARY_CHOICE: v1 randomized WHICH audience was "primary" each session,
  but the reach/cost table itself was fixed constants -- reducing the whole task to 3
  memorizable lookup answers ("primary=family -> always pick combo X"). The reviewer's own
  words: "three memorizable buckets are quantitatively more than two but not substantively
  different from the prohibited lookup structure."
- BLOCKER EXCLUSIVITY_OVERCLAIM/CORE_CAUSAL_MODEL_DISTORTED: several channel/audience pairs
  were hard-coded to exactly 0 (e.g. flyer=0 for young/older, SNS=0 for family/older)
  beyond what research.md's actual findings establish.
- BLOCKER CAUSAL_REALISM_ERROR: meeting reach thresholds was shown as visitors
  deterministically arriving at the venue, when research.md explicitly separates
  dissemination/awareness/attendance and says attendance can't be attributed to media
  choice alone.
- HIGH UNDISCLOSED_GAME_PROBABILITY: the media_relations 50/50 coverage odds existed only
  in simulation code, never shown to the player before they commit.
- HIGH CORRECT_REASONING_RANDOM_FAILURE: older-primary structurally REQUIRED the
  media_relations gamble for full success in v1, making a "correct" choice fail ~50% of
  the time regardless of skill.
- HIGH PLAYER_FACING_SPEC_INCOMPLETE: no exact card copy/values were specified.
- HIGH FIRST_PLAY_LEGIBILITY: 7 closed cards + a disabled button with nothing forcing the
  audience card to be read first.
- MEDIUM x3: a stale play_seeds reference, a hard-coded (not exhaustively verified)
  minimum-cost claim, and a fact_sheet/c_compression traceability mismatch.

**What this repair actually changed (verify all of this against the real files -- this is
the last repair budget for this design_iteration, so scrutinize rigorously):**
- `design/design-sim.mjs` was substantially rewritten. The core structural change: EVERY
  channel's reach to EVERY audience, AND the session's budget itself, are now
  INDEPENDENTLY RE-ROLLED every session within a tier-appropriate range (`CHANNEL_TIERS`/
  `TIER_RANGE`), not fixed constants. There is no longer a hand-picked "correct answer per
  primary" table -- the file's own verification now uses EXHAUSTIVE subset search over all
  63 non-empty subsets of the 6 channels (`findCertainWin`/`findBestGamble`/`optimalPicks`)
  to determine, PER SESSION, whether a gamble-free win exists and what the best achievable
  outcome is. RUN IT: `node factory/projects/legacy-reach-mix/design/design-sim.mjs` --
  expect 17/17 passing. Key numbers: `optimal_reasoning_full_win_rate≈0.90` (exhaustive
  per-session search, not a lookup, wins ~90% of sessions), `certain_route_exists_rate` per
  primary = family≈0.92, young≈0.89, older≈0.70 (older-primary no longer structurally
  requires the gamble -- a certain path exists most of the time), `optimal_gamble_needed_
  rate≈0.13` (media_relations is now genuinely optional, needed in only ~13% of sessions
  overall), naive/fixed strategies stay well below (`fixed_combo_ignoring_session≈0.19`,
  `random_within_budget≈0.28`), and 3-round compounding widens the gap further
  (`triple_optimal_reasoning≈0.74` vs `triple_fixed≈0.007`).
- Most hard 0s were replaced with small non-zero "WEAK" trickle values (0-2 range),
  justified by specific research.md facts (flyer: ~2,000 of 12,000 in the real case went to
  "public facilities near the station and participating high schools", not exclusively
  schools; SNS: the 6.9%-informed figure is measured across the WHOLE survey population,
  not isolated to young respondents). ONE channel deliberately KEPT a true 0:
  `school_board`'s reach to young/older, justified as "a school/daycare bulletin board is
  physically visible only to people at that institution" -- verify this distinction (some
  zeroes grounded, some not) is actually applied consistently and the reasoning holds.
- `poster`'s reach tier to `older` was upgraded from WEAK to MODERATE, justified by
  research.md §4's suggestion that paper bulletin/circulation channels skew toward
  geographically-close, often older, existing residents -- this was the mechanism used to
  make older-primary's certain-route-exists rate go from (v1: effectively 0%, ALWAYS
  required the gamble) to ~70%. Scrutinize whether this upgrade is honestly justified or is
  itself a new, convenient invention to make the numbers work out.
- `game_translations_v2.json`'s adopted `t1`: `C_interaction` now specifies that the
  media_relations coverage probability ("ふたつにひとつ") is shown to the player BEFORE they
  commit to picking it. `E_consequence`/`system_reaction` now describe information reaching
  people (flyers being handed out, postings appearing, coverage airing) rather than
  visitors arriving at the venue. `first_visible_state`/`D_externalization` now specify a
  staged disclosure gate: the primary-audience card must be opened before the 6 media cards
  become tappable (addressing FIRST_PLAY_LEGIBILITY).
- `play_seeds_v2.json`'s `s1` no longer references the stale 4-channel route; a new seed
  `s2-older-primary-optional-gamble` explicitly walks through a session where the certain
  route does NOT exist and the gamble (with backup) is the reasonable choice.

Verify critically -- this is the decisive question, unchanged in substance from r1:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself and confirm
   it actually passes 17/17, and that the numbers match `design-sim-result.json`.
2. **The decisive OBVIOUS_BINARY_CHOICE question**: with reach/cost/budget now re-rolled
   every session, is finding the right combination now genuine, non-trivial reasoning for a
   10-12 year old (reading 7 cards' worth of THIS session's actual numbers, checking a
   budget constraint, and searching for a combination that clears 3 simultaneous
   thresholds) -- or does it still reduce to something mechanically simple once you know
   "read whichever channel this session shows as strongest for your primary audience, and
   layer in whatever else fits the budget"? Is genuinely comparing multiple channels
   against a budget constraint under session-specific numbers enough to clear
   principles.md's "明らかな正解だけの2択" bar, or does this design still lack real
   professional judgment/trade-off/interpretation in your view? Give your fully
   independent, rigorous verdict -- this is the same core question r1 answered FAIL on,
   and the fix must be evaluated on whether it changed the actual decision structure, not
   just added surface variation.
3. **EXCLUSIVITY_OVERCLAIM re-check**: is the poster-tier upgrade (WEAK->MODERATE for
   older) an honest application of research.md's own findings, or an unprincipled tuning
   choice made to hit a target win-rate number? Are the remaining WEAK-tier trickle values
   (flyer/SNS's secondary-audience reach) still adequately grounded, or did loosening the
   zeroes introduce a DIFFERENT overclaim (implying these trickle effects are better-
   evidenced than they are)?
4. **CAUSAL_REALISM_ERROR re-check**: read `game_translations_v2.json`'s `t1` `system_
   reaction`/`E_consequence` in full. Does it now genuinely avoid claiming attendance as a
   deterministic consequence, while still giving a satisfying, concrete visual payoff for a
   10-12 year old (not so abstract that success feels unrewarding)?
5. Verify the media_relations probability disclosure and the "no longer forced" property
   are actually reflected consistently across `play_seeds_v2.json`, `game_translations_v2.
   json`, and `no_manual_exploit_check_v2.json` -- not just claimed in one place.
6. Check for remaining STALE_ARTIFACT_REFERENCE or new internal inconsistencies introduced
   by this repair (e.g. does `ae_v1.json`/`scope_core_v1.json`/`fact_sheet_v1.json`, none of
   which were touched this round, still accurately describe what the CURRENT
   `game_translations_v2.json`/`design-sim.mjs` actually do? The repair's failure code was
   `CORE_DISTORTED_BY_GAME` with `preserve: fact sheet` -- confirm fact_sheet's untouched
   content is still accurate and that c_compression_v2.json no longer falsely claims
   fact_sheet discloses the reach matrix/cost/budget/threshold values, per r1's
   SOURCE_TRACEABILITY_MISMATCH finding).
7. Verify BRUTE_FORCE_SUCCESS remains closed (single commit, no free re-toggle) and Gate G/
   Gate H remain properly specified (`play_seeds_v2.json`'s `s4-misjudge-then-reflect`).
8. Independently re-assess the fairness question from r1 item 8: with the gamble now
   genuinely optional (~13% of sessions) rather than forced, and its odds disclosed up
   front, does this now feel fair rather than punishing to a 10-12 year old? Or is even an
   optional, disclosed 50/50 gamble inappropriate for this Factory's established
   deterministic-mastery pattern?

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `factory/projects/legacy-reach-mix/design-review-r1.result.json` (the full r1 verdict)
   and `design-review-r1-prompt.md` (for the original context)
3. `factory/projects/legacy-reach-mix/research.md` in full (still authoritative)
4. The full CURRENT design chain: `fact_sheet_v1.json` (unchanged, v2 in pipeline),
   `scope_core_v1.json` (unchanged, v2 in pipeline), `ae_v1.json` (unchanged, v2 in
   pipeline), `core_scope_check_v1.json` (unchanged), `play_seeds_v2.json`,
   `reference_research_v2.json`, `c_compression_v2.json`, `game_translations_v2.json` (all
   3 translations, adopted=t1), `first_5_seconds_v2.json`, `no_manual_exploit_check_v2.json`,
   `core_back_check_v2.json`, plus `design/design-sim.mjs` (RUN it) and
   `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem. HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. **This is the last repair budget for design_iteration 1** -- if this
FAILs, the next failure routes to REDESIGN_REQUIRED (redesign_count 0/2, so budget remains,
but it means switching to a genuinely different translation/mechanic, not another patch of
this one). Give your most honest, precise, independent verdict.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "no_invented_threshold":true|false,"obvious_binary_choice_resolved":true|false,
 "zero_values_honestly_grounded":true|false,"probability_disclosed_honestly":true|false,
 "gambling_element_feels_fair_not_punishing":true|false,"causal_realism_honest":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
