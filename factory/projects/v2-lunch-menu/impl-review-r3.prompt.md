# Independent implementation review — Ver.2 給食 WORLD vertical slice (r3)

Round 2 (`impl-review-r2.result.json`, FAIL 64) findings were all addressed, and since then the experience spec changed (2026-09-21: no total score shown, status layer only after the first full tray, colour grains dish→mark, ≤2 related dishes wobble, CLEAR = send the tray to the school, real generated art via `assets` with placeholder fallback, slots pinned to the tray art). Verify: attribute cues now persist with real art (DishFace overlay), the harness records evaluate() reads via Proxy and SSR-renders DishFace with and without art, every ingredient has a pattern, aria/DN strings moved to copy.ts, non-playable map spots react (nudge), progress.ts strictly normalises, fx timers are cleared on unmount. Re-review the SAME scope adversarially, verify each fix, find anything new. Grade the harness (`gameplay-qa-v2-lunch-menu.mjs`, 23 checks) on whether it now independently proves the contract.

Scope: `src/v2/lunch/**`, `src/v2/state/progress.ts`, `src/v2/App.tsx`, `src/v2/copy.ts`, `src/v2/index.css`, `factory/harness/gameplay-qa-v2-lunch-menu.mjs`, `factory/harness/ver1-freeze-check.mjs`. Ver.1 (`src/screens`, `src/q1`, `src/state`) is frozen; `src/v2` must not import it.

Binding rules: `docs/jibun-choice-v2/PRODUCT_PRINCIPLES.md`, `GAME_DESIGN_RULES.md` §1, `DESIGN_OWNERSHIP.md` §2 (all user-visible strings incl. aria in `src/v2/lunch/copy.ts` / `src/v2/copy.ts`; placeholders marked TEMP_IMPLEMENTATION_ONLY; only palette v1 tokens `--v2-*` or `color-mix()` of them), `VISUAL_TONE.md` §3. Contract in `lunchMenuLogic.ts` header comment: milk fixed slot (V-A1), EVENT only after first result + ≥1 re-arrangement + full tray, CLEAR = child's commit with no score threshold, every rule reads only VISIBLE_ATTRIBUTES.

Axes (0–100 each): correctness (state machine, timers, StrictMode double-effects, stuck states, persistence isolation), design-rule compliance, QA coverage (does the harness now prove: visible attributes, exhaustive EVENT recovery over all 126 trays, cross-axis trade-off, improvement from every mediocre tray?). Try to construct concrete breaking sequences; cite file:line.

OUTPUT FORMAT (mandatory): your ENTIRE final message must be ONE JSON object, no prose, no code fences, exactly this shape:
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"blockers":[string],"high":[string],"medium":[string],"low":[string],"evidence":[string],"recommended_actions":[string]}
Each finding string: "<file>:<line> — <title> — <why> — <fix>". blockers/high non-empty ⇒ verdict FAIL.
