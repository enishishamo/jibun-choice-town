You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational
career game, Japanese grades 5-9). Review the HOME / WORLD MAP implementation
(「生きた町のアトラス」 region map). This is the binding Home Quality Gate
(§34) for World Expansion v1.

READ ONLY THESE FILES (do not run anything):
- src/screens/HomeScreen.tsx        — region map implementation
- src/data/districts.ts             — district registry + generic slot layout
- src/state/GameState.tsx           — world-state derivation (worldState())
- src/index.css                     — region map styles (.region-*, .world-marker, .district-*)
- factory/state/expansion/map-architecture-decision.md — the chosen architecture (§11)
- factory/rules/language-style.md   — language rules (labels/short words)

Trusted context (machine-checked, do not re-verify):
- 14 real worlds render on the map; a §31 stress test with 20 injected dummy
  worlds (34 markers total) showed ZERO overlapping markers on mobile 375px and
  desktop 1280px (deterministic label-width-aware de-collision pass); dummies
  were fully removed afterwards.
- Flow bots enter all 5 new worlds via district chip → world marker (2 taps)
  and recover home mid-flow; zero console errors.
- Screenshots exist: factory/state/art/shots/{mobile,desktop}-region-14worlds.png.

Judge these axes 0-100 (binding thresholds):
- EXPLORATION_DESIRE (>=80): does the map make a child WANT to tap somewhere
  (fog districts, living signals capped at 5, camera zoom, teaser toasts)?
- SCALABILITY (>=85): one-line world registration (WORLD_DISTRICT), generic
  districtSlot + de-collision, district capacity 8, fog districts as future
  space — will 50 worlds fit without redesign?
- MAP_CLARITY (>=80): world states (UNSEEN/DISCOVERED/VISITED/IN_PROGRESS/
  COMPLETED/UPDATED) visually distinct; not a textbook chapter list; no
  job-category front page.
- LANGUAGE_AGE_FIT (>=80): district names/leads/labels for grades 5-9.

Output (STRICT — single JSON object, no prose):
{"verdict":"PASS|FAIL","EXPLORATION_DESIRE":0,"SCALABILITY":0,"MAP_CLARITY":0,
 "LANGUAGE_AGE_FIT":0,"blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"]}
FAIL if any blocker/high, or any axis below its threshold.
