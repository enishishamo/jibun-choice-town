# Home/World Map Repair — 3 Options (2026-09-04)

Root causes identified in map-repair-nav-audit.md (not re-litigated here):
(R1) District fidelity gap: only the center is illustrated; districts are a flat
     color ellipse + one emoji + a text pill, so they read as UI icons, not places.
(R2) Redundant navigation layer: the bottom `.district-chips` bar is a 100%
     functional duplicate of the on-canvas `.district-node` taps, styled as an
     unrelated horizontal menu.
(R3) Fog districts render through the SAME two systems (node + chip) as real
     districts, just grayscale — reads as "disabled menu item," not "misty place."

All three options below KEEP the already-selected architecture's validated
core (one continuous canvas, camera-zoom with no screen cuts, two-tier
district→world hierarchy, signal-capped discovery, generic districtSlot
placement) — per the directive, a full re-architecture is not assumed to be
needed, and the existing map research (20 titles, §8-19) already concluded
this shape is right. What differs between options is HOW MUCH of the
navigation/visual surface is unified into that one canvas.

## Option 1 — Illustrated districts + compass (moderate repair)
- Give every district actual illustrated ground content via CSS/SVG
  composition (layered shapes: simple stylized rooftops/pier posts/treeline
  silhouettes per `terrain` class, using the existing palette) — no new image
  generation, reused/generated from code only (§10).
- Remove the bottom chip bar as a primary navigation duplicate. Replace it
  with a small, secondary "compass" overlay (fixed corner, always visible)
  that mirrors district positions as small dots on a miniature of the SAME
  canvas geometry — tapping a dot pans/zooms exactly like tapping the
  district itself. This is a compressed VIEW of the map, not an independent
  list, so it cannot compete with the canvas as a separate navigation system.
- Fog districts get a per-district silhouette treatment (already partially
  built via `silhouette` field) with drifting mist particles, dropped from the
  flat chip row so they read as "a misty place" rather than "a disabled
  button."
- Center `<img>` loses its hard drop-shadow card edge in favor of a soft
  feathered/vignette blend into the terrain SVG beneath it.

## Option 2 — Single world surface, chips removed entirely (maximal spatial purity)
- Same illustrated-district treatment as Option 1.
- The chip bar is removed with NO replacement — navigation is 100% spatial
  (pan + tap only), plus the existing "back to region" button when zoomed.
- To soften loss of fast-travel, add small "recently visited" memory pins
  (2-3 max, quiet, appear only when zoomed out) near the region-back button.

## Option 3 — Explorable world with shared visual DNA (maximal continuity)
- Beyond Option 1's SVG dressing, composite small cropped/tinted slices of
  the EXISTING town-hero illustration (via CSS `clip-path`/filters — still no
  new generation) into district "arrival corners" near the center, so center
  and districts share literal illustration texture, not just a similar
  palette.
- Same compass overlay as Option 1 for fast-travel.

## Comparison (Claude's own independent scoring, 1-10, before seeing Codex's)

| Criterion | Option 1 | Option 2 | Option 3 |
|---|---|---|---|
| Spatial coherence | 8 | 8 | 9 |
| Exploration desire | 8 | 9 | 8 |
| Navigation clarity | 9 | 7 | 8 |
| Scalability to 50 worlds | 9 | 5 | 6 |
| Mobile usability | 8 | 6 | 7 |
| Visual continuity | 7 | 7 | 9 |
| Implementation complexity (lower=better) | 7 | 8 | 4 |
| Compatibility with current assets (no new art, no per-district hand-tuning) | 9 | 9 | 5 |
| **Total** | **65** | **59** | **56** |

### Claude's reasoning
- **Option 2's spatial purity is real** (highest exploration-desire score) but
  directly reproduces the exact risk the ORIGINAL map research already
  flagged against pure-pan architectures ("1軸パンの総延長が50worldで限界" —
  Codex's own prior evaluation of a similar pan-only design, §11). Removing
  ALL fast-travel trades the map's return-usability for children who already
  know where they're going (RETURN_MOTIVATION, MOBILE_USABILITY) — a returning
  player having to re-pan a large 50-world canvas every session is a real
  regression versus today, even though today's version is over-corrected the
  other way (all fast-travel, no spatial cost).
- **Option 3's shared-texture idea scores highest on continuity** but
  reintroduces PER-DISTRICT hand-tuning (each new district needs a bespoke
  composited "arrival corner" to look right) — this works against §30's
  explicit goal of a fully generic, hand-tuning-free growth path to 50
  worlds, and is the highest-complexity, highest-risk option for a
  human-visual-review repair cycle that should stay scoped.
- **Option 1 is the best-balanced repair**: it removes the actual duplicate
  navigation layer (fixes R2/R3 directly), closes the fidelity gap enough
  that districts stop reading as "icons on a background" (fixes R1) via a
  fully generic, code-driven treatment that costs nothing extra as the
  registry grows, and it keeps a discoverable-but-secondary fast-travel path
  (the compass) that does not compete with the spatial canvas the way the
  current chip bar does. Claude's recommendation, pending Codex's independent
  score.

Codex is asked to score the SAME three options independently, from this
document alone (options only — the comparison table below the options was
written for the record but Codex's own analysis should be requested before
it sees Claude's scores, to keep the evaluation genuinely independent).
