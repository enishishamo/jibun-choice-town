# Independent implementation review — Ver.2 給食 WORLD vertical slice (r1)

You are reviewing a NEW, isolated code path in this repository: `src/v2/lunch/**`, `src/v2/state/progress.ts`,
`src/v2/App.tsx` (hash switch), `factory/harness/gameplay-qa-v2-lunch-menu.mjs`, `factory/harness/ver1-freeze-check.mjs`.
Ver.1 (`src/screens`, `src/q1`, `src/state`) is frozen and must be untouched; `src/v2` must not import it.

Rules the code must satisfy (read them; they are binding):
- `docs/jibun-choice-v2/PRODUCT_PRINCIPLES.md` (PLAY FIRST, UI/TEXT RULE), `GAME_DESIGN_RULES.md` §1 (no hidden answer, multiple solutions, improvement-type score, failure shown by the world not text, job name only after CLEAR), `DESIGN_OWNERSHIP.md` §2 (Claude Code may not add copy/visuals; all strings must be in `src/v2/lunch/copy.ts` and every placeholder visual must be marked TEMP_IMPLEMENTATION_ONLY).
- The experience contract: `factory/projects/v2-lunch-menu/experience-design-proposal.md` plus the Human decisions recorded at the top of `src/v2/lunch/play/lunchMenuLogic.ts` (EVENT only after first result + ≥1 re-arrangement; CLEAR = the child's commit action, never a score threshold; rules are PROVISIONAL pending facts V-A1..A9).

Review axes (score each 0–100, then verdict):
1. CORRECTNESS: state machine (build → improve → event → rebuild → cleared), place/remove/event/commit invariants, progress persistence (`jibun-choice:v2:progress` only; never reads `jibun-choice-progress-v1`), worldView derivation. Look for race conditions (the EVENT timer in `LunchMenuPlay.tsx`), double-commit, stale closures, React StrictMode double effects, and any way the child can get stuck (e.g. tray full + all remaining candidates unavailable).
2. DESIGN-RULE COMPLIANCE: any string outside copy.ts? any job name visible before CLEAR? any text explaining failure? any hidden attribute needed to score well (attributes must be visible on the board)? any score threshold gating CLEAR? any emoji or non-palette colour in `src/v2`?
3. QA COVERAGE: does `gameplay-qa-v2-lunch-menu.mjs` actually prove multiple solutions / trade-off / recovery, or can a degenerate rule table pass it?

Blockers = anything that lets the child get stuck, breaks Ver.1 isolation, shows the job name early, or violates DESIGN LOCK. High = correctness bugs reachable in normal play. Be adversarial: try to construct concrete sequences that break invariants. Cite file:line.
