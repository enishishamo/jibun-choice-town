You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 3 of the design review
of the Legacy Q1 REBUILD "legacy-allocate-and-forecast" (渇水対策連絡協議会で水の分け方を調整する
仕事, gameType allocate_and_forecast). This round follows a REDESIGN (design_iteration 1 -> 2,
translation t1 -> t5), not a repair — repair budget was already exhausted after round 1, and round
2's findings were judged a distinct defect class warranting a new translation.

**Round-2 verdict** (factory/projects/legacy-allocate-and-forecast/design-review-r2.result.json):
FAIL 46, CA46/GQ54, 3 BLOCKER, 2 HIGH, 3 MEDIUM, 2 LOW. Do not re-litigate anything not listed below
unless you find new evidence it's actually still broken. Note round 2 itself made a factual claim
worth double-checking rather than trusting at face value: it said legacy-layer-and-compare's actual
source code threshold for its bare single-axis-only checks is 0.7, not the 0.5/0.6 this project's r1/r2
prompts assumed — verify that claim yourself by reading `factory/projects/legacy-layer-and-compare/design/design-sim.mjs` directly, since round 3's threshold judgment (see fix #2 below) depends on which claim is actually true.

Fixes claimed this round (verify EACH yourself against the actual current files, not just the claim):

1. **BLOCKER: CORE_CAUSAL_MODEL_DISTORTED** — v2 used household's "backup water source available"
   signal to justify CUTTING household hardest, inverting the real fact (fact_sheet: backup sources
   PROTECT household from cuts, per research.md's Okinawa desalination case). Claimed fix: household's
   second axis in `design-sim.mjs` v3 is renamed `capacity` and re-grounded as "this week's own baseline
   demand is naturally lower" (a cooler week within the hot season → less AC/water use), structurally
   the same KIND of axis as agriculture's off-season slack and industrial's off-peak slack — i.e. a
   sector's own reduced need, not an external resource being weaponized against it. The real fact about
   backup sources protecting household is now unconditional background flavor (`fact_sheet_v3.json`'s
   uncertainties, `ae_v3.json`'s C), decoupled from the scoring rule. Verify: (a) does the new framing
   actually avoid the inversion — is "this week's demand is naturally lower" a defensible, non-contradictory
   real-world mechanism, not just a relabeling of the same backup-based logic? (b) is `play_seeds_v3.json`'s
   `s3-household-low-demand-correct` consistent with this (does it still accidentally invoke "代替水源"
   as the reason household is cuttable, or does it correctly treat backup as unrelated background)?
   (c) do `scope_core_v3.json`/`ae_v3.json`/`c_compression_v3.json` consistently use this framing?
2. **BLOCKER: C_NOT_NEEDED_FOR_D** — v2's threshold (0.65) was set just above its own measured single-axis
   result (~62%), which you correctly called circular. Claimed fix: `design-sim.mjs` v3 fixes
   `SINGLE_AXIS_PASS_BAR = 0.6` in the source BEFORE the simulation runs (stated as a design decision in
   a comment, not derived from the result), reduces `NON_TARGET_PATTERNS` to a clean 50/50 two-pattern
   split (down from v2's 45/45/10 three-pattern split), and the measured `capacity_only_smart`/
   `urgency_only_smart` now come out to ~58.3%. RUN `node factory/projects/legacy-allocate-and-forecast/design/design-sim.mjs`
   yourself. Verify: (a) is 58.3% actually below 60%, and is 60% itself now a defensible, independently-set
   bar (not just "slightly under whatever the code measures")? (b) the file's own comments claim ~58.3% is
   close to a mathematical FLOOR for this exact construction (3 real sectors, 2 independent binary axes,
   exactly 2 non-target draws per session) — verify this floor claim by deriving it yourself (hint: with a
   symmetric p/p split for the two non-target patterns and "tie-break among matches, else random among
   all 3" as the smartest single-axis strategy, the win rate is `1 - p + p²/3` for match-probability p;
   check what p=0.5 gives, and whether a smarter adversarial strategy you can think of beats this). If you
   find a strategy that beats ~60%, that's still a live BLOCKER regardless of what the code's own checks say.
3. **BLOCKER: THINK_AGAIN_INCOMPLETE** — v2's reflection only asked about the sector, so a depth-only
   failure had no way to reconsider the actual error. Claimed fix: `ae_v3.json`'s E and
   `game_translations_v3.json`'s t5 retry_or_rethink now specify TWO non-scored reflection questions —
   one about which sector, one about the restriction depth — both required before continuing, for every
   failure regardless of which decision was actually wrong. Verify this is genuinely present and would
   need to be implemented as two required selections (not one optional one).
4. **HIGH: VISUAL_FAILURE_CONSEQUENCE_INCOMPLETE** — success specified per-sector icon changes; failure
   only specified a meter effect. Claimed fix: `game_translations_v3.json`'s t5 system_reaction now
   specifies failure produces (a) the reservoir meter's decline merely slowing rather than stopping, AND
   (b) the chosen sector's icon staying unchanged (no state-change), without revealing which axis was
   wrong. Verify this is concrete enough to implement and doesn't leak individual correctness.
5. **HIGH: ARTIFACT_CHAIN_INCONSISTENT (reservoir value)** — v2's play_seeds s3 said "貯水率が中程度"
   (medium), a value the binary HIGH/LOW design-sim model doesn't have. Claimed fix:
   `play_seeds_v3.json`'s `s3-household-low-demand-correct` now says reservoir=HIGH + rain=FAR (which the
   DEPTH_TABLE maps to depth="medium"), narratively achieving "medium restriction" without inventing a
   third reservoir state. Verify this is consistent with `design-sim.mjs`'s actual DEPTH_TABLE.
6. **MEDIUM (rate-of-decline scope cut)** — round 2 found `c_compression_v2.json` claimed to preserve
   "貯水率が下がるスピード" while the actual compressed model never had it. Claimed fix:
   `c_compression_v3.json`'s `removed_complexity`/`reason_for_removal` now explicitly disclose this as a
   deliberate scope cut (folded into the binary HIGH/LOW + SOON/FAR snapshot) rather than silently
   dropping something claimed to be preserved. Verify the disclosure is honest and doesn't still imply
   the rate is somehow represented.
7. Re-verify `game_translations_v3.json`'s `t5-brief-and-allocate-corrected` (the new adopted translation)
   end-to-end is internally consistent — it should read as a complete, coherent translation on its own,
   not just a diff description of what changed from t1.

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then the
full CURRENT design chain (all `_v3.json`/`_v4.json` files per `q1-pipeline.json`'s
`artifacts.<type>.file`, in `factory/projects/legacy-allocate-and-forecast/design/`, plus `design-sim.mjs`
— READ THE FULL SOURCE and RUN it); then `factory/projects/legacy-layer-and-compare/design/design-sim.mjs`
for the threshold-comparison claim in fix #2.

Severity calibration: BLOCKER = a round-1 or round-2 finding is not actually closed, or a NEW genuine
exploit/answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix
before implementation. MEDIUM/LOW = polish, must NOT gate PASS.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round2_findings_confirmed_closed":{"core_causal_model_distorted":true|false,"c_not_needed_for_d":true|false,
 "think_again_incomplete":true|false,"visual_failure_consequence":true|false,"reservoir_value_consistent":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","layer_and_compare_threshold_claim_verified":"...",
 "threshold_0_60_defensible":true|false,"floor_derivation_correct":true|false,"sharper_exploit_found":true|false,
 "household_causal_model_sound":true|false,"reflection_covers_both_axes":true|false,
 "ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
