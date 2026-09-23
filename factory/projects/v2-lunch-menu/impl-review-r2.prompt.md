# Independent implementation review — Ver.2 給食 WORLD vertical slice (r2)

Round 1 (`impl-review-r1.result.json`, raw) found 2 blockers and 4 high: (1) EVENT timer could strand the child; (2) strings outside copy.ts; (3) hidden scoring attributes (fried/style); (4) double commit; (5) non-palette colours; (6) weak QA harness. All were addressed and the rule set was re-derived from primary-source facts (`factory/projects/v2-lunch-menu/facts/research.md`, `experience-design-proposal.md` §3'). Re-review the SAME scope adversarially and verify each fix; find anything new.

Scope: `src/v2/lunch/**`, `src/v2/state/progress.ts`, `src/v2/App.tsx`, `src/v2/copy.ts`, `src/v2/index.css`, `factory/harness/gameplay-qa-v2-lunch-menu.mjs`, `factory/harness/ver1-freeze-check.mjs`. Ver.1 (`src/screens`, `src/q1`, `src/state`) is frozen; `src/v2` must not import it.

Binding rules: `docs/jibun-choice-v2/PRODUCT_PRINCIPLES.md`, `GAME_DESIGN_RULES.md` §1, `DESIGN_OWNERSHIP.md` §2 (all user-visible strings incl. aria in `src/v2/lunch/copy.ts` / `src/v2/copy.ts`; placeholders marked TEMP_IMPLEMENTATION_ONLY; only palette v1 tokens `--v2-*` or `color-mix()` of them), `VISUAL_TONE.md` §3. Contract in `lunchMenuLogic.ts` header comment: milk fixed slot (V-A1), EVENT only after first result + ≥1 re-arrangement + full tray, CLEAR = child's commit with no score threshold, every rule reads only VISIBLE_ATTRIBUTES.

Axes (0–100 each): correctness (state machine, timers, StrictMode double-effects, stuck states, persistence isolation), design-rule compliance, QA coverage (does the harness now prove: visible attributes, exhaustive EVENT recovery over all 126 trays, cross-axis trade-off, improvement from every mediocre tray?). Try to construct concrete breaking sequences; cite file:line.

OUTPUT FORMAT (mandatory): your ENTIRE final message must be ONE JSON object, no prose, no code fences, exactly this shape:
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"blockers":[string],"high":[string],"medium":[string],"low":[string],"evidence":[string],"recommended_actions":[string]}
Each finding string: "<file>:<line> — <title> — <why> — <fix>". blockers/high non-empty ⇒ verdict FAIL.
