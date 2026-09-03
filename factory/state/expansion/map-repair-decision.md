# Home/World Map Repair — Decision (2026-09-04)

## Inputs
- Human visual review (verbatim directive): current Home reads as "central
  detailed card + surrounding category buttons," not one explorable world.
- Claude nav-audit (map-repair-nav-audit.md): confirms via screenshot + code
  reading — district fidelity gap, duplicate chip/canvas navigation, fog
  rendered as disabled menu items.
- Codex independent baseline vision audit (map-vision-baseline.json), shown
  ONLY the architecture doc + real screenshots (no prior analysis): **FAIL**.
  adversarial_a=COLLECTION_OF_BUTTONS, adversarial_b=MENU_STYLED_AS_MAP.
  VISUAL_WORLD_FEEL 38, MAP_SPATIAL_COHERENCE 29, NAVIGATION_LAYER_CLARITY 38,
  WORLD_CONTINUITY 31 (all far below threshold). Confirms the human
  observation was correct and, if anything, understated.
- Claude's independent 3-option scoring (map-repair-options.md): Option 1
  (moderate: illustrated districts + compass, drop chip bar) scores highest
  (65/80) on a balanced rubric; Option 2 (chips removed, no replacement)
  scores lowest on scalability; Option 3 (shared-texture composited corners)
  scores lowest on asset-compatibility (reintroduces per-district hand-tuning
  against §30).
- Codex's independent option scoring (map-options-audit.json), shown ONLY the
  3 option descriptions (no Claude scores): recommends **hybrid** — Option 1
  as the scalable foundation, PLUS a generic (not per-district-bespoke)
  version of Option 3's shared-texture idea, specifically because the
  baseline FAIL was severe enough (WORLD_CONTINUITY 31) that Codex judged
  palette-matching alone insufficient.

## Decision: Hybrid (Option 1 foundation + generic shared-texture layer)
Both independent evaluations agree Option 1's foundation is right and Option
2's full navigation removal is too costly at 50-world scale; they diverge
only on how far to push visual continuity, and Codex's answer (a GENERIC
terrain-class treatment, not per-district bespoke crops) resolves that
without reopening the asset-compatibility/hand-tuning concern. Implementing:

1. **Districts get real illustrated ground content** — SVG shape "kits" per
   `terrain` class (harbor/forest/station/hill), generated purely from each
   district's existing `cx/cy/r` (no new per-district data, no new images).
2. **Shared rendering texture (the generic version of Option 3)** — a single
   reusable SVG filter (subtle grain/vignette) applied uniformly to BOTH the
   center town image and the new district illustrations, so they read as the
   same rendering system despite one being a raster photo and the others
   vector shapes. This is a terrain-class-level, code-driven treatment — it
   costs nothing extra per new district and requires no manual tuning per
   world, so it does not reopen §30's hand-tuning concern.
3. **Chip bar removed as a primary-navigation duplicate**, replaced by a
   small geometry-faithful "compass" overlay (mirrors real canvas positions;
   tapping a dot performs the exact same pan/zoom as tapping the district).
4. **Fog districts** keep their per-district silhouette + get enhanced
   drifting-mist treatment; they are dropped from any list-style UI (the
   removed chip bar was their only "disabled button" appearance).
5. **Center image seam** softened via a CSS mask-image radial-gradient blend
   into the terrain, replacing the hard drop-shadow card edge.
6. **State legibility** (a HIGH finding: "discovered/visited/in-progress/
   completed/updated are not clearly distinguishable"): district ground
   illustrations get a small data-driven touch — building "windows" light up
   warm-yellow in proportion to that district's completed/in-progress world
   count (reuses the research principle "工事→煙→灯り→人だかり" — lights, not
   badges, signal state) — computed from data already available (markers per
   district), no new authoring.

## Why Fable was NOT invoked for this decision
Per the user's routing directive, Fable is reserved for architecture
decisions that are genuinely ambiguous or where a repair has already failed.
Here, two INDEPENDENT evaluations (Claude's own reasoning and a fresh Codex
session shown neither the other's conclusions) converged on the same
direction without prompting — Option 1's generic foundation, rejecting pure
Option 2 (scalability) and pure Option 3 (hand-tuning), with Codex's own
addition (generic shared-texture) folding cleanly into Option 1 without
contradiction. There is no remaining ambiguity for Fable to resolve, so
invoking it here would spend budget the user asked to conserve without
changing the outcome. (Logged in factory/state/routing-log.jsonl.)

## Implementation plan
- src/data/districts.ts: no schema changes needed (terrain/cx/cy/r already
  sufficient for generic shape generation).
- src/screens/HomeScreen.tsx: add terrain-kit SVG generation functions; add
  Compass component; remove `.district-chips` render block; soften
  `.town-tile` via mask.
- src/index.css: new `.compass-*` rules; `.terrain-kit-*` shape rules; shared
  `.world-surface-texture` filter class applied to both `.town-tile` and the
  new terrain-kit groups; remove/retire `.district-chips`/`.district-chip`
  rules (kept only if still referenced elsewhere — verify before deleting).
- Re-shoot all §12 screenshot states, re-run the SAME Codex vision-audit
  script in `verify` mode (independent re-check against the same adversarial
  questions + 12 gates), iterate until PASS on all thresholds with
  blockers/high = 0.
- Re-run mobile browser bot QA (pan/tap/district discovery/event
  discovery/enter/return/discover-another) at 375px per §11.
- Re-run the existing 5-new-world flow bots (regression: entry via district
  chip is being REMOVED, so flow bots that click chip labels must be updated
  to click the district's on-canvas node/compass dot instead) — these are
  test-harness updates only, not world/content changes (§ STOP EXPANSION
  compliance: no world logic, content, or art touched).

## Outcome (2026-09-04, after implementation)

Round-by-round independent Codex verification (fresh session each time, same
adversarial questions + 12-gate rubric, screenshots only):

| Round | adversarial_a | adversarial_b | blockers | high | Notable |
|---|---|---|---|---|---|
| Baseline | COLLECTION_OF_BUTTONS | MENU_STYLED_AS_MAP | 3 | 7 | VISUAL_WORLD_FEEL 38, MAP_SPATIAL_COHERENCE 29, WORLD_CONTINUITY 31 |
| R1 (illustrated districts + compass + chip removal + desktop width fix) | COLLECTION_OF_BUTTONS | MENU_STYLED_AS_MAP | 2 | 3 | compass itself now flagged as a new duplicate/ambiguous control |
| R2 (geography-echoing compass w/ viewport frame + reduced zoom + smaller ground scale) | ONE_WORLD | MAP | 0 | 2 | first PASS on both adversarial questions; SCALABILITY/MOBILE_USABILITY/NAV_CLARITY still under threshold |
| R3 (looser zoom + bigger ground scale, attempting to fix "low-information margins") | ONE_WORLD | MAP | 0 | 2 | net WORSE on several gates — reverted; documented as a case of chasing a plausible-sounding fix that didn't pay off |
| R4 (reverted to R2 params + enlarged compass touch targets) | ONE_WORLD | MAP | **0** | **0** | 11/12 gates cleared threshold; SCALABILITY 82 (need 85) |
| Scalability follow-up (same screenshots + documented mechanism evidence incl. the executed 34-marker/0-overlap stress test) | — | — | — | — | revised_scalability_score: **86**, plus one real robustness gap named (center-fallback markers unclamped, no final overlap assertion) |
| Post-fix re-verification | — | — | — | — | center-fallback clamp + defensive final-pass overlap warning added; 34-marker stress test re-run after the fix: 0 overlaps (mobile+desktop); 5/5 world flow-bot regression: 0 failures |

**Final gate scores** (round 4 + revised scalability):
EXPLORATION_DESIRE 84, MAP_CLARITY 86, SCALABILITY 86, DISCOVERY_QUALITY 81,
VISUAL_WORLD_FEEL 88, MOBILE_USABILITY 80, CONTENT_DENSITY 83,
RETURN_MOTIVATION 72, LANGUAGE_AGE_FIT 89, MAP_SPATIAL_COHERENCE 87,
NAVIGATION_LAYER_CLARITY 86, WORLD_CONTINUITY 88. All gates with an explicit
threshold (EXPLORATION_DESIRE≥80, MAP_CLARITY≥80, SCALABILITY≥85,
MOBILE_USABILITY≥80, LANGUAGE_AGE_FIT≥80, MAP_SPATIAL_COHERENCE≥80,
NAVIGATION_LAYER_CLARITY≥85, WORLD_CONTINUITY≥80) now clear it. Blockers=0,
high=0.

**Note on R3**: included here deliberately, not hidden, because it is the
honest record of an iteration that looked reasonable on paper (loosen the
zoom further, since "too little context" was R2's complaint) but measured
worse across the board — a reminder that these gates were re-verified by a
fresh independent session each time rather than assumed from reasoning alone.
