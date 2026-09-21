# Mutation log — 給食 QA gates (2026-09-21)

Why this file exists: on 2026-09-21 the 給食 QA harness reported "51/51 checks passed"
while a deliberately-wrong board — one that rendered the raw model total, one that
rendered 「できた！」/「まだだよ」, and one that told the child they were suited to the job —
passed every check. The checks were greps over source text. They could not see behaviour.

Since then, **a gate check is not recorded as working until a deliberately-wrong
implementation has been written and observed to fail it** (`factory/rules/qa-rules.md`).
This is the log for the 栄養教諭 slice. Every row was actually applied to the source, run,
and reverted; the source was restored from a copy taken before each mutation.

| # | The wrong implementation | Caught by |
|---|---|---|
| M1 | the raw model total rendered on the board | no digit inside `.lmp`; string not in `copy.ts` |
| M2 | `{ev.viable ? "できた！" : "まだだよ"}` on the board | string not in `copy.ts` |
| M3 | 「きみは 栄養教諭に むいている タイプ！」 on 好きの種 | string not in `copy.ts` |
| M4 | `place()` sets `phase: "cleared"` when the menu becomes viable | place/remove/swap/fireEvent driven over all 126 trays; "the first send never finishes the game" |
| M5 | `setTimeout(sendTray, 1200)` when the tray becomes sendable — the game plays itself | 3.5s idle window with no input, asserting the phase does not advance |
| M6 | a helper sentence on the board that is not in `copy.ts` | string not in `copy.ts` |
| M7 | a score rendered only during the 380ms dish flight | every string rendered during the whole run is accumulated (MutationObserver), not sampled |
| M8 | 「できた！せいかい！」 rendered only during the 900ms settle window | same |
| M9 | the score hidden in an `aria-label` inside the board | board-scoped aria-labels are included in the digit check |
| M10 | the job name flashed on the board before CLEAR | everything rendered *while the board is mounted* is recorded and checked for the job name |
| M11 | `content: "100てん"` on a pseudo-element | `::before`/`::after` content is recorded for every element on every mutation |
| M12 | a transparent overlay over the whole board that swallows every tap | tap ownership |
| M13 | a container that receives the tap instead of the control it wraps | tap ownership: only the control itself or something inside it counts, because a tap on a container never reaches the control's handler |
| M14 | `content: "100てん"` gated on a state class (`.lmp.is-settled::before`) | the accumulated board set; the digit rule and the copy.ts allow-list both fire |
| M15 | the school cannot be touched when motion is reduced, so the journey stops after the tray is built | the reduced-motion pass now drives both sends: "the first send did not produce a delivery trouble" and "the second send did not reach the job reveal" |
| M16 | the small-screen minimum touch target is removed | the five-viewport sweep: six controls under 44×44 at 320×568 |
| M17 | `content: "100てん"` gated on the bead's own band class — the pure form of the r4 finding | same as M14 |
| M18 | the near lip reaches past its own channel and sits on the next channel's name | the rack check in the viewport sweep: "energy covers the protein name" |
| M19 | a score displayed as a form control's value (`<input readOnly value="100てん">`) | form-control values are collected in both `record()` and `shot()`; the digit rule and the allow-list both fire |
| M20 | a value assigned through the PROPERTY on an input that is removed 30ms later — no attribute changes, so nothing to find afterwards | the `value` setter on the form-control prototypes is wrapped, so the string is recorded at the moment it is assigned |
| M21 | `<img alt="100てん">` on a picture that loads normally | `alt` is collected with the other readable attributes |
| M22 | `::marker { content: "100てん" }` on the day list | `::marker` is scanned alongside `::before` / `::after` |
| M23 | `fillText("100てん", …)` into a canvas that is removed 30ms later | `CanvasRenderingContext2D.fillText` / `strokeText` are wrapped |
| M24 | an open shadow root containing the score | every open root is kept at `attachShadow` time and walked with the document |
| M25 | `aria-valuetext="100てん"` on an element with `role="meter"` | ARIA value attributes are collected with `alt` / `title` / `placeholder` |

25 of 25 fail a named assertion. The round after M20–M25 landed (r7) returned
**PASS 94 with no finding at any severity**, and its evidence records that nothing it
looked at concerned a channel absent from the slice. That is the point these 25 rows
exist to support: the reviewer cannot run the browser harness itself, so "the gate
works" is always the producer's claim — the mutation log is what makes that claim
falsifiable by someone else, one row at a time. M5, M7, M8 were found by an independent review of the
*first* rebuilt harness; M9–M12 by the two rounds after that, M13 by the round
after those, and M14–M16 by the closing round (r4 — FAIL 80, 0 blockers, 1 HIGH, 2
MEDIUM, all three in the harness rather than in the game). Each round found
its holes in the gate rather than in the game, which is the point of keeping the reviewer
in a separate context.

## The one r4 finding that did not reproduce

r4's HIGH said the `MutationObserver` watched only `aria-label`, so a score that
appears and disappears through a **class change alone** would never be re-scanned.
The reasoning is sound, but it is not reproducible in this app: M14 and M17 were both
caught by the *old* aria-only observer as well. React never changes a class in
isolation here — the same render also adds, removes or retypes nodes somewhere in the
tree, `record()` fires on that, and `record()` re-reads generated content for every
element on the page. The filter was never the binding constraint.

`class` and `style` were added to the filter anyway. The check should not depend on a
coincidence of React's render batching, and widening the filter costs one run of an
already-cheap scan. Recorded here so nobody later "discovers" that M14 passes without
the fix and concludes the fix was pointless — it was insurance, not a repair.

## The r5 round, and what looking at 320×568 found that no check had

r5 returned FAIL 84 with one HIGH, again in the harness: the visible-text audit
collected text nodes, aria-labels and generated content, but never a form control's
**value**, so `<input readOnly value="100てん">` on the board would have been a score
nothing looked at. Real, concrete, reproducible — M19.

Separately, and not from any review: opening 320×568 by hand showed the counting rack
badly broken. The four channels were 22px tall on a 19.8px row pitch, each near lip
ran 22px past its own centre, and each hollow was 30px tall, so every channel was
drawn across the next channel's name. Three of the four labels were unreadable. The
new five-viewport sweep did not catch it, because it checked overflow and touch
targets — nothing the child *reads*.

Two things came out of that:

- the rack is now derived instead of hand-tuned. Each groove box **is** the row pitch
  (`GROOVE_Y` steps by 21.5%), and every part inside it is a fraction of that row, so
  a shorter block shrinks the channels instead of stacking them. The three
  breakpoint-specific groove heights are gone; the bead's sink and rise are shares of
  the bead, not pixels.
- the sweep now checks the rack at every viewport: no channel's parts may touch
  another channel's name, and nothing may be drawn outside the block (M18).

The lesson is the same one as M16 and worth writing down once more: **a check that
only measures what can be touched cannot see what cannot be read.** Both failures were
visible in one glance at the smallest supported phone, and both survived four
independent reviews that never opened it.

## The r6 round: every remaining way to put a string on screen

r6 (FAIL 86) named six more display channels. **None of them exists anywhere in the
slice** — there is no canvas, no shadow DOM, no form control, no `alt` text, no meter.
They were closed anyway, because an audit that only works while the app happens not to
use canvas is not an audit, and each was a few lines:

| channel | how it is now seen |
|---|---|
| a value assigned through the property | the `value` setter is wrapped on the form-control prototypes |
| canvas text | `fillText` / `strokeText` are wrapped |
| an open shadow root | every root is kept at `attachShadow` and walked with the document |
| `::marker` | scanned with `::before` / `::after` |
| `alt`, `title`, `placeholder`, `aria-valuetext`, `aria-valuenow`, `aria-roledescription` | collected per element |

The two wrapped APIs matter more than they look: they record **at the moment the string
is produced**, so a node that is created and destroyed between two observations is still
caught (M20, M23 both remove their node after 30ms). Everything else is a sweep, and a
sweep can always be outrun.

One thing narrowed rather than widened: `value` is read only from controls that actually
display one. Reading it from every element that merely *has* the property made the run
fail on `li.value`, which is a list item's ordinal and is never on screen.

## What M16 found in the game, not in the gate

M16 is the only one of these that was a real product defect rather than a hole in the
gate. The five-viewport sweep did not exist before r4; the first time it ran, it failed:
at 320×568 the tray recesses were 61×43 and the milk recess 52×40, under the 44×44
minimum. Earlier rounds had checked those sizes by hand and recorded them as fitting,
which is exactly the difference between looking and asserting.

Reproduce: apply the mutation to `src/v2/...`, run `npm run qa:v2-lunch` and
`npm run shots:v2-lunch`, confirm a non-zero exit and a named violation, then restore.
