You are an INDEPENDENT reviewer for Stage 6 of the JIBUN CHOICE harness: the Art Harness /
Art Loop. Read the actual files and judge the CODE and ARTIFACTS, not aspirations:

Harness code:
- factory/harness/art/asset-inventory.mjs      — mechanical inventory (dims/hash/refs/orphans)
- factory/harness/art/art-need-detector.mjs    — semantic need scan + reuse reduction
- factory/harness/art/art-provider.mjs         — provider adapter (paid APIs must be blocked)
- factory/harness/art/art-loop.mjs             — generate->QA->regenerate loop (max 3, prompt amended)
- factory/harness/art/art-qa.mjs               — mechanical + vision QA (pair mode for before/after)
- factory/harness/art/art-link-qa.mjs          — asset link QA (fail-closed)
- factory/harness/art/style-contract.md        — style contract with reference assets
- factory/harness/art/README.md

State/artifacts (evidence the loop actually ran):
- factory/state/art/asset-inventory.json       — 155 assets
- factory/state/art/provider-status.json       — probe results
- factory/state/art/art-needs.json             — need detection output
- factory/state/art/manifest-v2.json           — provenance incl. 3 newly generated shop assets
- public/assets/shop/ba-before.png, ba-after.png, char-haru.png — generated results (view them with your image input if available)
- src/data/content/shopOpening.ts              — wiring (sceneMap / opening / wrapUp beforeAfter)

Acceptance criteria (§18 of the stage spec):
1. Asset inventory exists, is mechanical/regenerable, handles dynamic `prefix-${id}` references.
2. Art Style Contract exists with textual rules AND reference asset paths.
3. Art Need Detector classifies ESSENTIAL/SUPPORTING/OPTIONAL and reduces needs via reuse;
   it must not treat adding images as a goal (OPTIONAL skipped).
4-5. Provider probe was REAL (generation executed, file saved, verified) and recorded with
   extra_cost_status limited to subscription_included_confirmed | paid | unknown; unknown/paid unusable.
6. Paid APIs are mechanically blocked in the adapter (verify the code path rejects them).
7. Adapter is provider-agnostic (reuse/css/svg/composition/codex_imagegen/human_boundary),
   swap-able without changing the loop.
8. Manifest v2 records provenance per asset (prompt, provider, cost status, refs, dims, qa, hash,
   used_by) including registered existing assets.
9. Prompt generator injects style block, composition, constraints, mobile crop safety, no-text.
10-11. Art QA covers the required categories; regeneration loop caps at 3 and NEVER retries an
   unchanged prompt (QA issues feed the next prompt).
12-13. Browser visual QA was integrated in the practical run (trust the run notes) and link QA
   exists fail-closed.
14. The loop actually ran end-to-end on a real world (shop-opening): 3 assets generated, QA'd,
   wired into shopOpening.ts (check the wiring is real and correct, incl. before/after pair
   consistency requirements in the requests under factory/projects/shop-opening/art-requests/).
15-16. No pay-per-use API anywhere in the NEW art harness path; remaining human gates only
   where justified.

Also flag real defects: race conditions, fail-open paths, prompts that would produce
readable text, wiring errors, manifest inconsistencies.

Output (STRICT — single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"blockers":[],"high":[],"medium":[],"low":[],"evidence":["file:line — finding"],"recommended_actions":[]}
verdict must be FAIL if any blockers or high remain.
