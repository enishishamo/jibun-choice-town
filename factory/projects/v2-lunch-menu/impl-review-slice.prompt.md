# Independent implementation review — Ver.2 栄養教諭 Job Vertical Slice (rebuilt)

This is a review of a REBUILT slice at commit HEAD of branch v2/lunch-vertical-slice. The earlier design (three 三色食品群 baskets, an 8-rule penalty score, a 校長 stamp, TEMP/DESIGN_NEEDED screens in the flow) has been removed entirely. Review what is there now, on its own terms.

SIX independent reviews already ran (four agent reviews and one earlier round of this same Codex review, which returned FAIL 68 with 0 blockers and 3 HIGH, all of them holes in the QA harness itself). Their findings were repaired. This is the FRESH RE-REVIEW after that repair.

The most recent Codex round returned FAIL 72 with 0 blockers and 2 HIGH, both again holes in the QA harness, and both are now repaired and mutation-tested:
A. the tap-ownership check passed when elementFromPoint returned something outside its selector set or null, so a transparent overlay swallowing every tap would pass. It now requires each sampled point inside a live control to resolve to that control, something inside it, or a container that contains it; a sibling on top, or nothing at all, is a violation. Points are sampled at 25%/75%/centre rather than at the square corners of a rounded control. Verified by making .lmp-motion opaque to pointers: caught by name.
B. the visible-text audit never looked at CSS generated content, so `content: "100てん"` on a pseudo-element would show a score invisibly to every check. ::before/::after content is now recorded for every element on every mutation and run through the same digit and copy.ts allow-list rules. Verified by adding such a rule: caught.

The three HIGH findings of the round before that, and what the repair claims:
1. the touch-geometry assertion ran after the flow had left the PLAY board, so it checked an empty page and passed vacuously. It now runs while the board is mounted, in two states (empty tray, and tray full with the school offered), and fails itself if fewer than 10 controls were on screen.
2. the digit prohibition ignored accessible names, so a score could hide in an aria-label inside .lmp, and the aria allow-list stripped everything after 「：」. Board-scoped aria-labels are now included in the digit check, the allow-list is expanded from copy.ts's own values, and a composed label is accepted only as 「<allowed>（<allowed>）」 or 「<allowed>：<allowed>」.
3. a transient pre-CLEAR job-name flash was not detected. The observer now records everything rendered WHILE THE BOARD IS MOUNTED and fails if a job name appears in that set — it no longer depends on a flag the harness sets.
Verify all three, and re-run your own mutation test.

Four independent agent reviews already ran and their findings were repaired. Do not assume they were right and do not assume the repairs hold — verify. In particular they found, and the repair claims to have closed:
- the QA harness passed deliberately-wrong implementations (a rendered score, a right/wrong verdict, an aptitude verdict about the child, an auto-clear inside place(), an auto-send from a timer, a score that flashes only during the 380ms dish flight, a verdict shown only during the 900ms settle window). The harness now (a) drives place/remove/swap/fireEvent over all 126 trays asserting the cleared phase is unreachable, (b) sits idle for 3.5s on a sendable tray asserting the phase does not advance, and (c) accumulates every text node and aria-label ever rendered via a MutationObserver and asserts no digit appears inside .lmp and every string is present verbatim in src/v2/lunch/copy.ts. **Re-run the mutation test yourself** on a scratch copy (git worktree, /tmp) and report which wrong implementations the harness now catches and which it still misses.
- the school's touch area overlapped the tray dishes, so reaching for a dish could irreversibly send the lunch; tray recesses overlapped each other. The shots harness now asserts no two touch areas intersect and that every corner and centre of every control resolves to itself.
- a quick second tap on a full tray refused a legal dish with the same shake used for "this dish did not arrive".
- 完全給食 = 主食 + ミルク + おかず: a tray with no rice and no bread is now refused however well the four axes sit.

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
