# Independent implementation review — Ver.2 栄養教諭 Job Vertical Slice (rebuilt)

This is a fresh review of a REBUILT slice, not an iteration on the previous one. The earlier design (three 三色食品群 baskets, an 8-rule penalty score, a 校長 stamp, TEMP/DESIGN_NEEDED screens in the flow) has been removed entirely. Review what is there now, on its own terms.

## What the slice is

`MAP → こんだて PLAY → EVENT → CLEAR → JOB REVEAL → KNOW THE JOB → (CAREER PATH, optional) → 好きの種 → MAP RETURN`, mounted by `src/v2/lunch/LunchWorldApp.tsx`.

The game: a school lunch tray with 4 free slots and a fixed milk slot, 9 candidate dishes. Every dish moves four axes — energy / protein / fat / salt. Each axis has a GOOD BAND with a "hollow" in the middle of a visible groove; a bead rolls along the groove and can only settle inside the hollow. More is never better. The child never sees a number, a score, a percentage or a right/wrong mark. When all four beads are settled, the school appears and the child sends the tray by swiping it up (tapping the school is the accessible equivalent). The FIRST send is intercepted by a delivery trouble that removes one dish; the child rebuilds and sends again, and the second send delivers.

## Scope

`src/v2/**` (all of it), `factory/harness/gameplay-qa-v2-lunch-menu.mjs`, `factory/harness/v2-lunch-shots.mjs`, `factory/harness/ver1-freeze-check.mjs`. Ver.1 (`src/screens`, `src/q1`, `src/state`) is frozen and `src/v2` must not import it.

## Binding rules

- `docs/jibun-choice-v2/PRODUCT_PRINCIPLES.md` (PLAY FIRST), `GAME_DESIGN_RULES.md` §1, `VISUAL_TONE.md` §3 (palette v1 tokens `--v2-*` only, or `color-mix()` of them).
- Every user-visible string, including aria-labels, lives in `src/v2/lunch/copy.ts` and nowhere else.
- **No developer marker (`TEMP_IMPLEMENTATION_ONLY`, `DESIGN_NEEDED`, `DN-nn`) may be reachable by a child.** Comments are fine; rendered strings are not.
- No job name before PLAY. No aptitude verdict about the child anywhere ("you are suited to…" is forbidden). 好きの種 records an ACTION, never a job.
- The per-dish numbers are GAME COEFFICIENTS and must be documented as not being official nutrition data.

## What to attack

1. **Correctness under real use.** Construct concrete breaking sequences: rapid taps during the 380ms dish flight; removing or swapping the dish that is currently in the air; the delivery trouble firing while a flight or a mote burst is running; double-send (swipe + school tap); React StrictMode double effects; unmount mid-animation (every timer goes through one `fxTimers` set — verify nothing escapes it); remount/refresh mid-play; a malformed or hand-edited `localStorage["jibun-choice:v2:progress"]`.
2. **The game model.** Read `lunchMenuLogic.ts` and check the claims the harness makes are the claims that matter. Is there a degenerate strategy? Can a child reach a state they cannot get out of? Is `pickEventDish` guaranteed to pick a dish that is on the tray and leaves `MIN_RECOVERIES` menus, for every viable menu? Is `send()` really the only path to `cleared`?
3. **PLAY FIRST / product rules.** Anything that reads as a score, a grade, a tick, a right/wrong signal, or a verdict about the child. Any text that explains what a picture already says. Any place a job name leaks before CLEAR.
4. **The harnesses.** Does `gameplay-qa-v2-lunch-menu.mjs` actually prove the contract, or does it prove tautologies? Name any check that would still pass if the implementation were wrong. Does `v2-lunch-shots.mjs` verify anything, or only take pictures?
5. **Accessibility and mobile.** 375×812: tap targets, focus order, the swipe-only affordance (is the school button genuinely reachable?), `aria-hidden` correctness, `prefers-reduced-motion` coverage, safe-area insets.
6. **Ver.1 isolation.** `src/v2` importing Ver.1, or writing Ver.1's storage key.

Be adversarial and concrete. Cite `file:line`. Do not propose redesigns of approved product decisions (the four axes, the two-send structure, the counting rack, the absence of a score) — review whether they are implemented correctly and whether they break.

OUTPUT FORMAT (mandatory): your ENTIRE final message must be ONE JSON object, no prose, no code fences, exactly this shape:
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"blockers":[string],"high":[string],"medium":[string],"low":[string],"evidence":[string],"recommended_actions":[string]}
Each finding string: "<file>:<line> — <title> — <why it is wrong> — <fix>". blockers/high non-empty ⇒ verdict FAIL.
