# Independent implementation review — Ver.2 栄養教諭 Job Vertical Slice (rebuilt)

This is a review of a REBUILT slice at commit HEAD of branch v2/lunch-vertical-slice. The earlier design (three 三色食品群 baskets, an 8-rule penalty score, a 校長 stamp, TEMP/DESIGN_NEEDED screens in the flow) has been removed entirely. Review what is there now, on its own terms.

NINE independent review rounds already ran (four agent reviews, then Codex r1..r5). Every one of them found holes in the QA HARNESS rather than in the game; the game's own findings have been clean since r2. Scores: 68, 72, 78, 80, 84. This is the fresh re-review after r5's repair. Do not assume any earlier repair holds — verify.

Closed and mutation-tested so far (M1..M19, `factory/state/qa/v2-lunch-mutation-log.md`): a rendered score; a right/wrong verdict; an aptitude verdict about the child; an auto-clear inside `place()`; an auto-send from a timer; a score visible only during the 380ms dish flight or the 900ms settle window; a score hidden in an `aria-label`; a pre-CLEAR job-name flash; `content: "100てん"` on a pseudo-element; a tap-stealing overlay; a container that swallows the tap meant for the control it wraps; a vacuous geometry check that ran on an empty page; a state-class-gated pseudo score; a reduced-motion journey that stopped early; a missing small-screen touch target; a lip drawn over the next channel's label; and a score shown as a form control's value.

SINCE r5 (FAIL 84, 0 blockers, 1 HIGH: form-control values were never collected):
- `record()` and `shot()` now collect `value` from input/textarea/select/output/contenteditable, `value` is in the observer's attributeFilter, and the board's text for the digit rule includes them. Mutation M19 (`<input readOnly value="100てん">` inside each groove) is caught by name.
- Separately, and NOT found by any review: opening 320x568 by hand showed the counting rack broken. Grooves were 22px tall on a 19.8px row pitch, each near lip ran 22px below its own centre and each hollow was 30px tall, so every channel was drawn across the next channel's name and three of four labels were unreadable. The rack is now derived rather than hand-tuned: `.lmp-groove` height IS the row pitch (21.5%, matching `GROOVE_Y`), the track/hollow/lip are fractions of that row, and the bead's sink/rise are shares of the bead (`translateY(19%)` / `-15%`) instead of pixels. The three breakpoint-specific groove heights are deleted. The viewport sweep now also asserts, at all five sizes, that no channel's parts touch another channel's name and that nothing is drawn outside the block (mutation M18).
Attack both of those. In particular: is the rack geometry now genuinely independent of the block height, or did it merely move the failure to a size nobody runs? Is there any other display channel the visible-text audit still cannot see (SVG `<text>`, `<title>`, `alt`, `::marker`, canvas, shadow DOM, `aria-valuetext`, a CSS `counter()`)? Name the concrete mutation for each one you claim.

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
