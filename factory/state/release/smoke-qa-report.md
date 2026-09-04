# Public-Safety Smoke QA — Stable Prototype v0 (2026-09-04)

Scope: blocker-hunt only, not an improvement pass (per directive §3). Full
machine result: `smoke-qa-result.json`. Script: `factory/harness/public-safety-smoke-qa.mjs`.

## Home (mobile 375px + desktop)
| Check | Mobile | Desktop |
|---|---|---|
| Display | OK | OK |
| Broken images on load | 0 | 0 |
| Map pan | OK | OK |
| District tap (zoom) | OK | OK |
| Map return (back to region) | OK | OK |

## World entry — ALL 14 registered worlds
Every world was reached via genuine UI navigation (Home → district tap or
town-tile tap → world marker tap → area screen), at both viewports:

| # | eventId | Mobile | Desktop |
|---|---|---|---|
| 1 | lunch-late | ✅ | ✅ |
| 2 | heat-wave | ✅ | ✅ |
| 3 | ice-price | ✅ | ✅ |
| 4 | town-festival | ✅ | ✅ |
| 5 | er-patient | ✅ | ✅ |
| 6 | school-trip | ✅ | ✅ |
| 7 | waste-journey | ✅ | ✅ |
| 8 | shop-opening | ✅ | ✅ |
| 9 | zoo-baby | ✅ | ✅ |
| 10 | night-port | ✅ | ✅ |
| 11 | forest-care | ✅ | ✅ |
| 12 | river-health | ✅ | ✅ |
| 13 | game-studio | ✅ | ✅ |
| 14 | library-detective | ✅ | ✅ |

**14/14 at both viewports. Zero broken images on any area screen.**

## Representative full playthroughs (Q1 start → representative games → Job
Reveal → wrapUp)
Reused the 5 existing per-world flow bots (`factory/harness/flows/*-flow.mjs`)
rather than rebuilding new coverage — these already do a full correct-play
run through every Q1 game in that world, explicitly advance through the
profession "Job Reveal" screen (`.discovery-hero`/`.discovery-name-big` in
`Q1Screen.tsx`), and reach wrapUp:

| World | Games | Result |
|---|---|---|
| night-port | 4 | all 4 + wrapUp, 0 console errors |
| forest-care | 3 | all 3 + wrapUp, 0 console errors |
| river-health | 3 | all 3 + wrapUp, 0 console errors |
| game-studio | 3 | all 3 + wrapUp, 0 console errors |
| library-detective | 3 | all 3 + wrapUp, 0 console errors |

(Re-confirmed after the Home/Map repair commit, prior to this release-prep
task — see the flow-bot regression run referenced in
`factory/state/expansion/map-repair-decision.md`.)

## Broken links / 404s / console errors / fatal JS errors
Zero across the entire crawl (Home + 14 world entries × 2 viewports):
- `consoleErrors`: []
- `pageErrors` (fatal JS): []
- `failedRequests` (4xx/5xx): []
- `brokenImages`: []

## Verdict
**PUBLIC_SAFETY_SMOKE_QA = PASS.** No BLOCKER/HIGH findings — no repair was
needed or performed (per directive §3, this pass hunts for blockers only).
