You are an INDEPENDENT UX architecture reviewer. You previously (in a separate
audit) found the current Home/World Map screen of a children's app (grades
5-9) FAILS: it reads as "a menu styled to look like a map" (scores:
VISUAL_WORLD_FEEL 38, MAP_SPATIAL_COHERENCE 29, NAVIGATION_LAYER_CLARITY 38,
WORLD_CONTINUITY 31 — all far below threshold). Root causes you and a
separate Claude audit both identified: (1) only the center is illustrated,
districts are flat color + one emoji + a label; (2) a bottom chip bar
duplicates on-canvas district taps; (3) fog districts render through the same
system as real districts, reading as disabled buttons; (4) the district
close-up view has large empty flat space and does not visually continue the
center's geography (no shared roads/water/style).

Score these THREE candidate repair options on their own merits — you have not
seen anyone else's scores. All three keep the already-validated architecture
core (one continuous canvas, camera-zoom with no screen cuts, two-tier
district→world hierarchy, generic per-district slot placement, signal-capped
discovery) — this is a REPAIR, not a from-scratch redesign, so do not
penalize an option merely for keeping that shared core.

---
OPTION 1 — Illustrated districts + compass (moderate repair)
- Every district gets real illustrated ground content via CSS/SVG
  composition (layered shapes: stylized rooftops/pier posts/treeline
  silhouettes per terrain class, reusing the existing color palette) — no new
  image generation.
- The bottom chip bar is REMOVED as a primary nav duplicate. Replaced by a
  small always-visible "compass" overlay (fixed corner) showing district
  positions as dots on a miniature of the SAME canvas geometry — tapping a
  dot pans/zooms exactly like tapping the district itself (a compressed VIEW
  of the map, not an independent list).
- Fog districts get per-district silhouette + drifting mist, dropped from the
  chip row entirely.
- The center image's hard drop-shadow card edge becomes a soft feathered
  blend into the terrain beneath it.

OPTION 2 — Single world surface, chips removed entirely (maximal spatial purity)
- Same illustrated-district treatment as Option 1.
- The chip bar is removed with NO replacement — navigation is 100% spatial
  (pan + tap only), plus a "back to region" button when zoomed.
- Small "recently visited" memory pins (2-3 max, quiet, zoomed-out only) near
  the back button soften the loss of fast-travel.

OPTION 3 — Explorable world with shared visual DNA (maximal continuity)
- Beyond Option 1's SVG dressing, small cropped/tinted slices of the EXISTING
  center illustration are composited (CSS clip-path/filters, still no new
  generation) into district "arrival corners" near the center, so center and
  districts share literal illustration texture, not just a similar palette.
- Same compass overlay as Option 1 for fast-travel.

---
Score each option 1-10 on: spatial_coherence, exploration_desire,
navigation_clarity, scalability_50_worlds, mobile_usability,
visual_continuity, implementation_complexity (LOWER is better — 1 = trivial,
10 = very complex), asset_compatibility (higher = less new art / less
per-district hand-tuning needed as the registry grows to 50 worlds).

Also state: given the SEVERITY of the baseline failure you found (especially
MAP_SPATIAL_COHERENCE 29 and WORLD_CONTINUITY 31), is Option 1 alone
sufficient, or does the severity argue for adopting Option 3's shared-texture
idea (or a hybrid) DESPITE its higher complexity and reintroduction of some
per-district work? Give your own recommendation with reasoning — do not just
average the scores.

Your ENTIRE final message must be a single JSON object, no prose, no fences:
{"option1":{"spatial_coherence":0,"exploration_desire":0,"navigation_clarity":0,
 "scalability_50_worlds":0,"mobile_usability":0,"visual_continuity":0,
 "implementation_complexity":0,"asset_compatibility":0},
 "option2":{...same keys...},
 "option3":{...same keys...},
 "severity_assessment":"OPTION_1_SUFFICIENT|NEEDS_OPTION_3_ELEMENTS|NEEDS_HYBRID",
 "reasoning":"...",
 "recommendation":"1|2|3|hybrid",
 "hybrid_description":"if recommendation is hybrid, describe which elements of which options combine, in 2-3 sentences; empty string otherwise"}
