You are an INDEPENDENT, ADVERSARIAL auditor of the "JIBUN CHOICE AI Game Factory"
itself (not of a single game). The factory claims: /new-world runs research → design →
art → implementation → QA → repair → completion with ZERO human intervention, under a
strict no-extra-cost policy (subscription-only Codex; paid APIs mechanically blocked).

Audit the FACTORY by reading (read-only; do not run anything):
- .claude/commands/new-world.md            — the claimed pipeline
- factory/harness/loop.mjs, codex-review.mjs, codex-task.mjs — review/delegation transport
- factory/harness/art/ (art-loop.mjs, art-qa.mjs, art-provider.mjs, style-contract.md,
  reference-set.json, present-shots.mjs)   — art pipeline + 3 new gates
- factory/rules/game-critic-v2.md          — two-axis rubric + v3 experience gate
- factory/projects/waste/pipeline.json, factory/projects/zoo/pipeline.json — the two
  worlds built end-to-end (Stage 7 / Stage 8)
- factory/projects/zoo/design.md, factory/projects/waste/design.md
- factory/taxonomy/gameplay-references.json, factory/taxonomy/component-reviews.json
- factory/state/stages.json, factory/state/routing-log.jsonl (sample a few lines)
- factory/state/experience-backlog.json

Judge these dimensions adversarially; look for concrete evidence in the files:
1. AUTONOMY — could /new-world really run without a human? Find steps that silently
   assume a human (undocumented judgment calls, hand-tuned constants presented as
   pipeline output, "Claude decides" steps with no recorded criteria).
2. HIDDEN MANUAL WORK — artifacts that claim automation but read as hand-crafted
   one-offs (world-specific scripts, prompts naming one world, non-reusable globs).
3. WORLD-SPECIFIC HACKS — anything in the waste/zoo pipeline that would not transfer
   to a third world without editing harness code.
4. REVIEWER INDEPENDENCE — can the producer influence the reviewer? (prompt wording
   that presupposes PASS, trusted-context blocks that overreach, calibration notes
   that muzzle legitimate findings.)
5. FAILURE HANDLING — what happens on CODEX_TIMEOUT / malformed JSON / QA crash?
   Fail-closed or fail-open? Any path where a failure silently counts as success?
6. COST SAFETY — could any code path reach a paid API or require an API key?
7. ART CONSISTENCY — do the Series Style Gate and Asset Presentation Gate actually
   bind (fail-closed), or can a high overall score bypass them?
8. REPRODUCIBILITY — same inputs, same pipeline: what varies between waste and zoo
   runs, and is that variance recorded honestly (pipeline.json metrics)?
9. OBSERVABILITY — is every delegation/review logged (routing-log)? could a step
   happen with no trace?
10. MAINTAINABILITY — duplicated logic between harness scripts, drift risks
   (e.g. thresholds defined in 2 places), stale docs.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL","score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],
 "recommended_actions":[]}
FAIL if any blockers or high remain. Do not award PASS for effort; award it only if
the factory as evidenced would truly run a third world autonomously and safely.

--- ITERATION 2 CONTEXT (repairs since iteration 1) ---
The previous audit's findings were triaged. Verify these specific repairs and judge
what REMAINS (do not re-raise items that are now fixed or explicitly documented as
architecture with rationale):
- Binding-gate definition, orchestrator-is-Claude architecture, and the
  human-intervention definition are now written down in factory/rules/game-critic-v2.md
  (bottom sections). Judge whether the documentation is honest and internally
  consistent, not whether Claude-as-orchestrator is itself a flaw (that is the
  factory's declared architecture: machine-enforced gates + Claude-driven glue,
  with evidence trails).
- SAFE_ENV API-key stripping is now in codex-review.mjs, codex-task.mjs and
  art-qa.mjs (was: only art-provider).
- art-qa.mjs logs every codex call to routing-log.jsonl; the reference set now
  fails closed when incomplete.
- art-loop.mjs: reuse entries are recorded as "reused_existing" (not "qa_passed");
  provider probe evidence older than 14 days fails closed to human_boundary.
- present-shots.mjs: world-agnostic balloon walker for all worlds (per-world deep
  bots remain by design, like gameplay-qa-<world>.mjs which mirrors each world's
  rules); flow milestones are asserted; console/page errors fail the run (exit 1).
- pipeline.json records fixed (zoo commit=done, metrics source_note added).
- Known-and-accepted remainders you should list as documented limitations rather
  than blockers IF they are properly recorded: legacy-UI presentation backlog
  (factory/state/presentation-backlog.json), existing-39 experience backlog
  (factory/state/experience-backlog.json), per-world QA scripts by design.
