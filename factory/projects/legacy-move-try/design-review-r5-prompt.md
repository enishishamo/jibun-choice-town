You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 5 of the design review
of the Legacy Q1 REBUILD "legacy-move-try" (理学療法士・退院後の動作能力評価、gameType move_try).

**This is the final design review round with any repair/redesign budget remaining.** redesign_count
is now 2/2 (REDESIGN_MAX) and repair_count is 0/1 for this iteration. A FAIL here that requires a
REDESIGN would exceed budget and force ESCALATE (Human Decision Required) — a legitimate outcome if
the design genuinely doesn't hold up, so do not soften your judgment to avoid it. A FAIL that only
needs a REPAIR is still possible (1 repair attempt remains in this iteration) if the finding is
narrow. Review with your normal rigor; do not pass anything that doesn't hold up, but also do not
manufacture findings — three consecutive prior rounds (r2, r3, r4) found the SAME BLOCKER code
(CORE_CAUSAL_MODEL_DISTORTED) on three different attempted fixes, so scrutinize this round's fix
with that history in mind, but judge it on its own merits.

**Round-4 verdict** (factory/projects/legacy-move-try/design-review-r4.result.json): FAIL 38,
1 BLOCKER (CORE_CAUSAL_MODEL_DISTORTED — v4's "compensate" candidate and caregiver-dependent
rest/train switching were still invented per-cell mechanisms research.md doesn't document), 1 MEDIUM
(stale candidate list, not gating). Do not re-litigate anything r1-r4 already confirmed closed
(situp framing, Gate H, jointly-necessary mapping, threshold precedent, visual feedback third-state,
play_seeds s4 plausibility — r4 itself confirmed s4 is now plausible and consistent with the
disclosure gate).

**This round's fix is STRUCTURALLY different from r2/r3/r4's attempts**, not just a relabeling.
Verify this claim yourself — it is the crux of whether this round should pass:

r2/r3/r4 all tried to find a SPECIFIC, DIFFERENT correct technique for whichever cause+condition
cell lacked one, and each specific technique invented for that purpose (a repeated "rest" or "cane,"
then "compensate") was rejected as unsupported by research.md's actual level of detail — research.md
explicitly states "これは今すぐ用具が要る／これは時間をかけて鍛える／これは休憩・ペーシングで対応
する、を分ける明確な単一の判定ルール・フレームワーク名は、本調査で一次資料から直接は見つからな
かった" (no single documented decision rule was found; it is individual clinical judgment).

This round's fix (`design-sim.mjs`, see the file's header comment for the full v5 rationale) drops
the requirement to invent a DIFFERENT technique per cause entirely. Instead: when environment/
caregiver support is available, cause diagnosis directly and specifically determines which device
applies (this part research DOES support at cell-level: 下肢筋力不足→高さ調整, 支持点不足→手すり,
動的バランス不足→杖, 持久力不足→休憩・ペーシング — all individually, specifically grounded).
When environment/caregiver support is NOT available, BOTH causes converge on the SAME answer,
"train" (訓練) — not because training is claimed to specifically or cleverly address each different
cause, but because research.md documents 訓練 as a broad, general capacity-building category ("筋力・
耐久性トレーニングで時間をかけて能力そのものを上げる"), not limited to one named muscle or cause,
and because training is the one intervention that genuinely does not depend on environment or
caregiver support being available — a plain, unremarkable fact, not an invented mechanism.

This is a DELIBERATE trade: the condition axis (env-adjustable / caregiver-available) is no longer
symmetric with the cause axis in exploit-resistance terms. Verify:

1. RUN `node factory/projects/legacy-move-try/design/design-sim.mjs` yourself. Confirm all 9 checks
   pass. Specifically verify: `standup_cause_axis_only` and `walk_cause_axis_only` are genuinely
   close to 50% (the cause axis remains fully differentiated — this is the primary judgment burden,
   unchanged in kind from prior rounds and still well-grounded); `standup_env_axis_only` and
   `walk_caregiver_axis_only` land in the DISCLOSED ~0.70-0.80 band (NOT lower — that would suggest
   an inconsistency in the check itself — and not meaningfully higher, which would suggest a NEW,
   unintended leak); `single_axis_only_combined` and `single_axis_only_condition_combined` (the two
   worst-case SESSION-LEVEL exploits) both stay well below full reasoning.
2. Judge whether "train" as the universal, cause-agnostic fallback is HONEST given what research.md
   documents, or whether it is itself a disguised version of the same problem (i.e., is claiming
   "training addresses whichever capacity is deficient, generically" itself an unsupported causal
   claim, or is it a fair, plain reading of 筋力・耐久性トレーニング as a broad category)? Read
   research.md's actual D section and the "(3) 鍛える vs 用具/休息" section yourself and judge
   whether this specific claim (train works regardless of WHICH capacity — leg strength, or the
   balance/strength needed to compensate for a missing support point, or endurance, or dynamic
   balance — is deficient) is a defensible reading or still an overreach.
3. Judge whether disclosing and accepting a ~75% single-axis-only ceiling on the condition axis
   alone (while the cause axis and the full-session combined measures stay well below that) is an
   appropriate design response, given the established precedent this session set with
   legacy-allocate-and-forecast's ~75-83% floor for a 2-candidate household structure (accepted
   after being shown to be a genuine, unavoidable property of that domain, not fixable via
   reweighting). Is legacy-move-try's situation genuinely analogous (a real structural fact about
   the domain — training doesn't depend on environment/caregiver — rather than a design choice that
   could be avoided with more creativity)? Or is accepting this floor itself an unearned shortcut
   that should instead prompt further redesign?
4. Independently re-check the full chain for ANY remaining reference to the withdrawn "代償動作"
   (compensate) candidate or the withdrawn caregiver/environment-dependent rest-vs-train switching
   from v3/v4 as if it were still live design (historical mentions in revision_note fields describing
   what was tried and rejected are fine and expected — flag only places where withdrawn content is
   presented as the CURRENT design).
5. Re-verify play_seeds: s2 (legs+adjustable→height, unaffected by this redesign — still correct?),
   s3 (walk, now describes balance+caregiver_no→train, not the withdrawn compensate answer — is this
   consistent with the current design-sim.mjs?), s4 (legs+not_adjustable→train, confirmed correct
   and plausible in r4 — still consistent with the v5 mapping?).

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-move-try/research.md` in full (this round hinges on a careful, honest
reading of what research.md does and does not establish about 訓練's generality); then the full
CURRENT design chain (all `_v5.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-move-try/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE and RUN
it).

Severity calibration: BLOCKER = a prior round's finding is not actually closed, or a NEW genuine
exploit/answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix
before implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to
BLOCKER or HIGH, say so plainly — a genuine, clean PASS is the expected outcome if this round's
structural change holds up; do not manufacture findings. Equally, do not pass a defect just because
budget is nearly exhausted — if the "train is a universal fallback" claim or the "disclosed floor is
an acceptable trade" judgment genuinely doesn't hold up, say so clearly; ESCALATE (ending this
sub-loop and surfacing it for a human decision on the profession/mechanic) is a legitimate outcome,
not a failure to avoid.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round4_findings_confirmed_closed":{"train_universal_fallback_honestly_grounded":true|false,
 "no_invented_per_cell_mechanism_remains":true|false,"disclosed_floor_is_appropriate_response":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","cause_axis_still_50pct":true|false,
 "condition_axis_floor_in_expected_band":true|false,"combined_session_level_exploit_low":true|false,
 "no_withdrawn_content_presented_as_current":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
