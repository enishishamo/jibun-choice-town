You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 6 of the design review
of the Legacy Q1 REBUILD "legacy-move-try" (理学療法士・退院後の動作能力評価、gameType move_try).

**This is the absolute final design review round with any budget remaining.** repair_count is now
1/1 (REPAIR_MAX_PER_ITERATION) and redesign_count is 2/2 (REDESIGN_MAX). A FAIL here — of ANY
severity that would require another repair or redesign — will force the pipeline into ESCALATED
(Human Decision Required) per q1-factory-schema.mjs, since no budget remains for either. This is a
legitimate, acceptable outcome if the design genuinely doesn't hold up — do not soften your judgment
to avoid it, and do not pass anything that doesn't hold up. Equally, do not manufacture findings:
four consecutive prior rounds (r2, r3, r4, r5) found the SAME BLOCKER code
(CORE_CAUSAL_MODEL_DISTORTED); judge this round's fix on its own merits, informed by but not
prejudiced by that history.

**Round-5 verdict** (factory/projects/legacy-move-try/design-review-r5.result.json): FAIL 38,
1 BLOCKER (CORE_CAUSAL_MODEL_DISTORTED — even v5's "caregiver present" branch for walk, which
gated cane-introduction and pacing-safety on caregiver availability, was unsupported by research.md).
Do not re-litigate anything r1-r5 already confirmed closed (situp framing, Gate H, standup's
env-adjustable axis and mapping — NEVER once the target of a BLOCKER across 5 rounds, threshold
precedent, visual feedback third-state, play_seeds s4 plausibility).

**This round's fix is a STRUCTURAL simplification, not another relabeling.** Verify this yourself —
it is the crux of whether this round should pass:

`design-sim.mjs` v6 (see the file's header comment for full rationale) removes walk's caregiver axis
ENTIRELY. Walk becomes single-axis (cause only), structurally identical to situp:
`CANDIDATES.walk = ["cane", "rest"]`, `newWalk`: balance→cane, endurance→rest. No condition, no
gate, no invented mechanism anywhere in walk. standup is COMPLETELY UNCHANGED from v5 (its
environment-adjustable axis: legs+adjustable→height, legs+not_adjustable→train,
support+adjustable→rail, support+not_adjustable→train — this exact structure has been reviewed and
never flagged across all 5 prior rounds).

Verify:

1. RUN `node factory/projects/legacy-move-try/design/design-sim.mjs` yourself. Confirm all 6 checks
   pass. Confirm `standup_cause_axis_only`≈0.50 and `standup_env_axis_only`≈0.75 (unchanged from
   every prior round, never disputed). Confirm the new `single_axis_only_combined`≈0.75 makes sense
   given walk and situp are now both fully single-axis (no longer independently exploitable —
   reading a single-axis movement's one card IS full legitimate reasoning for that movement, so the
   only remaining single-card-omission exploit in the whole session is skipping standup's
   environment card specifically).
2. Judge whether balance→cane and endurance→rest, as DIRECT, UNCONDITIONAL mappings (no caregiver
   gate, no condition of any kind), are honestly grounded in research.md. This is a much lower bar
   than prior rounds' claims — verify research.md's C section documents 歩行補助つえ (canes/walking
   aids) as a device category for gait/balance support, and research.md's D section directly,
   explicitly ties ペーシング＝休憩を挟む to 持久力/心肺機能 (endurance/cardiopulmonary capacity) —
   with NO conditional claim layered on top (no claim about who can safely introduce a cane, no
   claim about whether pacing needs supervision). If these two direct mappings hold up on their own
   terms, the round's core objection should be closed.
3. Confirm the elimination of walk's caregiver axis doesn't leave any residue: no remaining live
   design field (not just revision_note history, which is fine) treats caregiver availability as
   affecting walk's fix selection, and no remaining field claims training is "self-directed" or
   "doesn't need supervision" (that specific unsupported claim from v5 should be gone, not just
   relocated).
4. Judge whether reducing walk to a 2-candidate single-axis movement (matching situp's structure)
   is an acceptable simplification given the profession's actual documented complexity, or whether
   it under-represents the job to the point of concern (CORE_DISTORTED_BY_GAME in the other
   direction — oversimplifying a job that's actually richer than this). Note that standup still
   carries the game's one genuinely multi-axis judgment, so the overall game is not entirely
   single-axis.
5. Re-verify play_seeds: s1 (situp, unaffected), s2 (standup, unaffected — confirm no accidental
   changes), s3 (rewritten for walk's new single-axis structure — is it now internally consistent
   and plausible, matching situp's s1 in structure?), s4 (standup misjudgment seed, confirmed
   plausible in r4/r5 — still consistent with the unchanged standup mapping?).

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-move-try/research.md` in full; then the full CURRENT design chain (all
`_v6.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-move-try/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE and RUN
it).

Severity calibration: BLOCKER = a prior round's finding is not actually closed, or a NEW genuine
exploit/answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix
before implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to
BLOCKER or HIGH, say so plainly — this round's fix is deliberately the most conservative, minimal-
claim version possible (two direct, unconditional, individually-grounded mappings, no invented
gates or techniques anywhere), so a clean PASS is the expected and appropriate outcome if it holds
up. Do not manufacture findings to avoid a PASS, and do not pass a genuine defect to avoid
triggering ESCALATE — both would be a disservice to the actual goal (an honest, exploit-resistant,
career-authentic game for children).

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round5_findings_confirmed_closed":{"walk_caregiver_gate_removed":true|false,
 "walk_direct_mappings_honestly_grounded":true|false,"no_residual_unsupported_claims":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","standup_unchanged_and_sound":true|false,
 "walk_single_axis_mappings_grounded":true|false,"no_withdrawn_content_presented_as_current":true|false,
 "ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
