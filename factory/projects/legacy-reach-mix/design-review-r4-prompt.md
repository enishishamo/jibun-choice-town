You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 4 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報
担当・実行委員会メンバー, gameType reach_mix) -- design_iteration 2 (still translation
t4-scenario-driven-reach), this iteration's LAST repair now used (repair_count 1/1),
redesign_count 1/2 (one redesign remains if this FAILs, after which the next failure
routes straight to ESCALATED with no further automated attempts).

**Rounds 1-3 (all FAIL) -- read all three result files in full before anything else.**
Compressed history:
- r1 (FAIL 31): v1's per-session "which audience is primary" randomization sat on top of
  FIXED reach/cost constants -> 3 memorizable lookup answers (OBVIOUS_BINARY_CHOICE), plus
  unsupported hard-zero exclusions and an attendance-overclaiming success scene.
- r2 (FAIL 38, repair budget exhausted): the r1 repair independently re-rolled every
  reach value with NO in-fiction cause -> "the player performs a generated knapsack
  calculation... [without] a modeled cause or observable real-world input"
  (CORE_CAUSAL_MODEL_DISTORTED, a NEW and deeper BLOCKER than r1's). Re-confirmed
  EXCLUSIVITY_OVERCLAIM and a softer CAUSAL_REALISM_ERROR. -> REDESIGN #1 (t1 -> t4).
- r3 (FAIL 40, repair budget exhausted again): t4's 3 named scenario facts
  (coopInstitutions/followerTier/prepWeeks) improved interpretability in the reviewer's own
  words, but a SINGLE SHARED "prepWeeks>=2 ? 1 : 0" trickle variable, applied identically to
  every channel, was itself flagged as "a universal prepWeeks cutoff [that] manufactures
  audience effects the research does not establish" -- AND that same shared variable only
  ever applied to ONE of each channel's two non-primary audiences (a real code bug), so
  website/poster stayed hard-zero for several pairs despite the design's own claim
  otherwise (EXCLUSIVITY_OVERCLAIM re-confirmed as a genuine implementation bug, not just a
  design gap). CAUSAL_REALISM_ERROR persisted in softer form (partial-outcome text still
  said insured audiences "continue to receive information").

**This repair's fix (verify all of this against the real files -- this is the last chance
for translation t4 before it must be abandoned for a 2nd, final redesign):**
- `design/design-sim.mjs` removed the single shared trickle variable ENTIRELY. Every
  channel except `school_board` now computes an INDEPENDENT, non-zero-capable formula for
  BOTH of its non-primary audiences, each tied to THAT CHANNEL's own governing scenario
  fact (not a fact borrowed from a different channel's logic): flyer's young/older trickle
  scales with `coopInstitutions` (its own primary driver, same as its family reach); sns's
  family/older trickle scales with `followerTier`; website's family/older trickle scales
  with `followerTier`; poster's/media_relations' family/young trickle scales with
  `prepWeeks`. RUN IT: `node factory/projects/legacy-reach-mix/design/design-sim.mjs` --
  expect 18/18 passing. Key numbers: `optimal_reasoning_full_win_rate≈0.88`,
  `certain_route_exists_rate` = family≈0.88/young≈0.93/older≈0.68,
  `fixed_combo_ignoring_session≈0.16` collapsing to `≈0.005` over 3 rounds vs
  `triple_optimal_reasoning≈0.69`.
- `game_translations_v5.json`'s adopted `t4`'s `E_consequence` partial-outcome wording was
  tightened: even the backup/insured channels are now described only as having their
  planned distribution action completed, never as having "reached" an audience.
- `fact_sheet_v2.json`/`scope_core_v2.json`/`ae_v2.json` (untouched since the ORIGINAL
  submission across r1-r3, which r3 flagged as materially stale -- they still described
  attendance-based outcomes and omitted the scenario facts) were rewritten this round to
  accurately describe the current scenario-driven model, and `fact_sheet_v2.json`'s
  `uncertainties` now explicitly discloses the reach formulas, channel costs, budget range,
  and success thresholds as game-balance abstractions, not measured values (r3's
  SOURCE_TRACEABILITY_MISMATCH).

Verify critically -- these are the exact things that have sunk this design 3 times running,
so scrutinize hard whether the pattern has genuinely broken or just moved again:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself, confirm
   18/18 passing and matching `design-sim-result.json`. Specifically verify with your OWN
   reading of the code (not just the comments) that EVERY channel except `school_board`
   really does produce non-zero reach to BOTH of its non-primary audiences in at least some
   sessions, and that no single shared variable is applied identically across multiple
   channels' formulas anymore.
2. **EXCLUSIVITY_OVERCLAIM, 4th check**: are the per-channel formulas now honestly
   presented, or does tying each channel's trickle to "its own" governing fact just relocate
   the same problem -- i.e., is `flyer.older = floor((coopInstitutions-1)/2)` any more
   evidenced than the old shared variable was, or is this still an invented precise formula
   dressed in per-channel packaging? Also re-verify `school_board`'s remaining hard zero is
   still the most defensible one in the set (r3 raised, but did not sustain as a BLOCKER, a
   concern about pupils/staff/visitors/high-schoolers technically belonging to the "young"
   or "older" categories too -- form your own view on whether that concern should now be
   sustained).
3. **CORE_CAUSAL_MODEL_DISTORTED, 4th check -- the central, unresolved question across all
   3 prior rounds**: with formulas now genuinely differentiated per channel (not one shared
   mechanical rule), does the game finally ask for something a 10-12 year old would
   recognize as INTERPRETING evidence about a specific professional scenario, or is this
   fundamentally still, at bottom, "read some numbers off cards, solve a knapsack" no matter
   how the numbers are sourced? If you conclude the underlying interaction structure
   (budget-constrained multi-channel threshold-clearing) cannot escape this critique
   regardless of how reach values are computed, say so explicitly and specifically -- this
   would mean the problem is the MECHANIC ITSELF, not any particular numbers, the same
   conclusion legacy-venue-layout's reviewer reached in its round 6 after 4 different
   mechanics all failed for the same underlying reason.
4. **CAUSAL_REALISM_ERROR, 4th check**: read `game_translations_v5.json`'s `t4`'s full
   `E_consequence` (including the partial-outcome half). Does it now genuinely avoid ANY
   claim about audience-side reach/awareness in every branch (full success AND partial),
   while still landing as a satisfying, concrete payoff for a 10-12 year old?
5. Verify `fact_sheet_v2.json`/`scope_core_v2.json`/`ae_v2.json` now accurately and
   consistently describe the CURRENT t4 model (scenario facts, per-channel formulas,
   output-only success definition) with no remaining internal contradiction against
   `game_translations_v5.json`/`design-sim.mjs`.
6. Verify BRUTE_FORCE_SUCCESS remains closed and Gate G/Gate H remain properly specified.
7. Re-assess `first_5_seconds_v4.json`'s 3-stage disclosure gate and the fairness of the
   ~11% media_relations gamble rate, one more time, now that the underlying numbers have
   shifted slightly.

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `design-review-r1.result.json`, `design-review-r2.result.json`, `design-review-r3.result.json`
   (all three full prior verdicts)
3. `factory/projects/legacy-reach-mix/research.md` in full
4. The full CURRENT design chain: `fact_sheet_v2.json`, `scope_core_v2.json`, `ae_v2.json`,
   `core_scope_check_v3.json`, `play_seeds_v4.json`, `reference_research_v4.json`,
   `c_compression_v4.json`, `game_translations_v5.json` (all 4 translations, adopted=t4),
   `first_5_seconds_v4.json`, `no_manual_exploit_check_v4.json`, `core_back_check_v4.json`,
   plus `design/design-sim.mjs` (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem. HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. **This is the last repair budget for design_iteration 2 -- if this
FAILs on the SAME 3-round-recurring axis (CORE_CAUSAL_MODEL_DISTORTED specifically), state
explicitly and precisely whether you believe the underlying mechanic (not just its numbers)
is structurally incapable of clearing principles.md's bar, the way legacy-venue-layout's r6
reviewer did -- this will directly inform whether the final redesign attempt should be a
completely different interaction or whether this profession should escalate to a Human
Decision.** Give your most honest, precise, independent verdict.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "no_invented_threshold":true|false,"obvious_binary_choice_resolved":true|false,
 "mechanic_structurally_capable_of_passing":true|false,
 "zero_values_honestly_grounded":true|false,"probability_disclosed_honestly":true|false,
 "gambling_element_feels_fair_not_punishing":true|false,"causal_realism_honest":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
