# Home/World Map Human Visual Review — Navigation Layer Audit
2026-09-04. Scope: Home/Map repair only. No new worlds, no content/art pipeline changes.

## 0. Traceability: Research → Selected Architecture → Implementation → Screenshot

| Stage | Source | Claim |
|---|---|---|
| Researched principle | factory/state/expansion/map-research.json (20 titles) | "5-7 districts × 5-10 points, two-tier"; "districts distinguishable by giant landmarks, no text needed"; "NEW badge replaced by a signal sequence (construction→smoke→light→crowd→new road)"; "unopened = silhouette in fog, not a gray disabled card"; "results flow back to the plaza (visible change)" |
| Selected architecture | factory/state/expansion/map-architecture-decision.md (§11) | "ONE continuous region canvas... camera ZOOMS (CSS transform, no screen cuts)... 『世界の中を見ている』感覚" (the feeling of looking inside a world) is listed as one of only 3 selection criteria, explicitly weighted over ease of implementation |
| Implemented UI | src/screens/HomeScreen.tsx + src/data/districts.ts + src/index.css `.region-*`/`.district-*` rules | ONE canvas exists technically (SVG terrain + absolutely-positioned children, camera transform). But: districts render as a flat colored ellipse + ONE 58px emoji + a text pill — no illustrated content of their own. The center town keeps its original detailed illustration inside a drop-shadowed, rounded-corner `<img>` card. |
| Current screenshot | factory/state/art/map-repair-shots/{mobile,desktop}-01-initial.png, -04-district-selected.png | Confirms the human observation exactly: a photographic "hero card" in the middle, pale flat blobs with icon+label pins around it, and a duplicate horizontal chip bar below. See §1. |

**Finding**: The *selected* architecture (one continuous canvas, camera zoom, no screen cuts) is technically present in the code (there is genuinely one `<div class="region-canvas">`, one coordinate space, a CSS transform camera). But the criterion the architecture was chosen FOR — "the feeling of looking inside a world" — is **not achieved**, because:
1. Only the center district has real illustrated content; every other district is a schematic placeholder (flat ellipse + emoji + label). The visual language is not uniform across the one canvas, so it reads as two different things (a picture + a diagram) sharing a background, not one place.
2. A second, fully redundant navigation system (the bottom chip bar) duplicates the exact function of the on-canvas district nodes, which contradicts "one continuous canvas is how you move" — there are in fact two independent ways to change what you're looking at, one spatial and one list-based, and they don't agree in visual language either.

This is a **fidelity-of-implementation gap against the selected architecture**, not evidence that the selected architecture itself was wrong. That distinguishes this repair from a full re-architecture.

## 1. Navigation Layer Audit

| # | Layer | Purpose | Info represented | Interaction | Duplicated elsewhere? | Necessary? |
|---|---|---|---|---|---|---|
| 1 | Central town `<img>` card | Entry point into the "center" district (7 slice-of-life worlds) | The town, photorealistically illustrated | Tap anywhere on the image → focus "center" | **No** functional duplicate, but visually it is the ONLY district rendered as a photo; every other district is a flat shape. This asymmetry is itself the core problem (see §2). | Yes — but its *treatment* must stop being unique |
| 2 | Outer district nodes (`.district-node`) | Entry point into 4 open + 2 foggy districts | One 58px emoji + a text-pill label, floating at a fixed point over a flat colored ellipse | Tap → camera zooms in (or foggy teaser toast) | **Yes** — 100% functional overlap with layer 3 (bottom chips) for every non-foggy district | The *spatial* affordance is necessary; the icon+label duplicate is not |
| 3 | Bottom district chips (`.district-chips`) | Jump directly to any district, always visible | Same landmark emoji + same name, in a horizontal scrollable pill row | Tap → same `setFocus`/`openDistrict` as layer 2 | **Yes** — see above | Marginal: useful as an always-reachable "never lost" escape hatch, but as currently built it is a second, unrelated-looking menu, not a lightweight aid |
| 4 | World/event markers (`.world-marker`) | Enter a specific Q1 experience | Small circular badge with a state-face icon (🔥/📍/🔨/🚩/✨) + label (label only visible when in-focus) | Tap (out of focus): camera glides to district, then auto-navigates after 680ms. Tap (in focus): navigates immediately | No duplicate | **Yes** — this is the actual "go play something" affordance and the only layer with zero redundancy |
| 5 | Fog districts ("???") | Tease future districts | Ghosted silhouette emoji + rotating hint toast on tap | Tap → toast with a new hint each time (up to 3 unique hints, then repeats) | Rendered via the SAME two systems as real districts (node + chip), just with a "foggy" class | The *concept* (a mystery you can visit for a clue) is good and matches research; the *visual class* (identical circle-with-label shape, just grayscale) makes it read as "a disabled menu item," not "a misty unknown place" |
| 6 | Pan interaction | Signal that the world extends beyond the viewport | Drag-to-scroll the canvas within clamped bounds; one-time intro sweep | Pointer drag (region mode only) | No duplicate | Yes, but its value is undercut by #2/#3 duplication: since every district is ALSO one tap away via the always-visible chip row, there is little incentive to ever pan and discover something by moving through space — the chip row is a shortcut that bypasses the very thing panning is supposed to teach |
| 7 | Region-back button (🗺 地域全体) | Return from district zoom to full region view | Text button, top-left, appears only when focused | Tap → `setFocus(null)` | Functionally close to "tap the active chip again" (chips toggle off) and to panning back out — a third way to reach the same state | Yes, but should be the ONE canonical "zoom out" action; the chip-toggle escape hatch should not exist in parallel |

### Primary interaction test (§3 of the directive)
**"What single action does a child use to decide where to go next?"** — Currently there is no single answer: a child can (a) drag/pan and tap a landmark pin, (b) tap a bottom chip that does the identical thing, or (c) tap directly on a world marker if one happens to be visible. Three entry points for the same two decisions ("which district" / "which world") is exactly the "competing navigation layers" the directive asks to check for.

## 2. Visual Coherence Gap (§10)
- Center: a 1536×1024 photographic illustration, rounded corners, drop shadow, `object-fit: cover` — reads as a "featured card."
- Outer districts: a flat single-color ellipse (`TERRAIN_FILL`), one 58px emoji, one text pill — reads as "map UI iconography," not "a place."
- These two visual languages sit directly next to each other with a hard edge (the town tile's drop-shadow border against the flat terrain), which is the single strongest driver of the "central photo + surrounding buttons" read.
- The `district-chips` row uses a third visual language again (rounded pill buttons on a plain background, no relationship to the canvas at all) — reinforcing "menu," not "map."

## 3. Adversarial self-test (§5, done honestly before handing to Codex)
- *"If all labels and explanatory text disappeared, would this still look like one explorable world?"* — **No.** Without the "港"/"森と川" text labels, the outer shapes are unlabeled pale blobs with a single emoji; nothing about their rendering says "place" (no buildings, no paths worn into them, no texture). The only illustrated "place" is the center card. This fails the test as currently implemented.
- *"Is this genuinely a map, or a menu styled to look like a map?"* — **It is closer to a menu today.** The chip row proves it: it is a literal `<button>` list with icons and names, laid out exactly like a category tab bar, and it fully substitutes for the spatial canvas. A user could complete 100% of navigation using only the chip row and never touch the canvas.

These are logged here so Codex's independent answers (requested below) are not primed by seeing this file first — Codex will be asked before being shown this document.
