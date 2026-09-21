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
| M12 | a transparent overlay over the whole board that swallows every tap | tap ownership: every sampled point inside a live control must resolve to it, something inside it, or a container around it |

| M13 | a container overlay that receives the tap instead of the control | tap ownership: only the control or something inside it counts |

13 of 13 fail a named assertion. M5, M7, M8 were found by an independent review of the
*first* rebuilt harness; M9–M12 by the two rounds after that, and M13 by the round
after those. Each round found
its holes in the gate rather than in the game, which is the point of keeping the reviewer
in a separate context.

Reproduce: apply the mutation to `src/v2/...`, run `npm run qa:v2-lunch` and
`npm run shots:v2-lunch`, confirm a non-zero exit and a named violation, then restore.
