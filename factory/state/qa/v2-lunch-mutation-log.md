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

17 of 17 fail a named assertion. M5, M7, M8 were found by an independent review of the
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

## What M16 found in the game, not in the gate

M16 is the only one of these that was a real product defect rather than a hole in the
gate. The five-viewport sweep did not exist before r4; the first time it ran, it failed:
at 320×568 the tray recesses were 61×43 and the milk recess 52×40, under the 44×44
minimum. Earlier rounds had checked those sizes by hand and recorded them as fitting,
which is exactly the difference between looking and asserting.

Reproduce: apply the mutation to `src/v2/...`, run `npm run qa:v2-lunch` and
`npm run shots:v2-lunch`, confirm a non-zero exit and a named violation, then restore.
