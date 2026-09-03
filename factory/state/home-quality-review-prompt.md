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

ITERATION 2 CONTEXT (fixes since your R1 FAIL — verify in code):
- UPDATED is now REACHABLE: districts.ts exports WORLD_CONTENT_VERSION /
  contentVersion(); GameState.Progress gains seenVersion (recorded on area
  visit); worldState() returns UPDATED when a visited/completed world's
  content version moved past the seen version. CSS adds a distinct
  .st-updated style (purple pulse) and .st-discovered.
- Markers are state-driven: STATE_FACE renders ONE face per state
  (🔥 DISCOVERED / 📍 VISITED / 🔨 IN_PROGRESS / 🚩 COMPLETED / ✨ UPDATED) —
  the uniform 🔥 is gone.
- Generic terrain: district grounds are generated from the registry
  (TERRAIN_FILL × DISTRICTS), no hard-coded per-district ellipses.
- DISTRICT_CAPACITY is enforced with a loud console.warn, and a world missing
  from WORLD_DISTRICT warns instead of silently piling onto center.
- Fog districts render a distinct ghosted SILHOUETTE hint (📡 / 🛩, grayscale
  blur) inside the mist before any tap; the teaser toast remains on tap.
- District names use elementary kanji (港・森と川・駅前・丘の上) per the
  language guide's no-hiragana-flood rule.
- The canvas comment now matches the rendered 1200x820.
Machine re-checks: 14-world map zero overlaps (mobile/desktop), all 5 new-world
flow bots pass with the kanji chips, tsc clean.
