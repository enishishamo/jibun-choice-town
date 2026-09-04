# Art Ownership Audit — Home/World Map (2026-09-04)

Scope per directive §15: visuals added to Home/World Map after the switch to
Sonnet for the Human Visual Review repair (commit `073cd80`). Classification
per §14/§15 rubric: A=FUNCTIONAL_UI, B=FUNCTIONAL_SVG, C=EXISTING_JC_ASSET,
D=ILLUSTRATION_LIKE_BUT_SERIES_MATCH (keep candidate, evidence-based),
E=CLAUDE_ORIGINAL_ILLUSTRATION (GPT replacement candidate — do not self-redraw).

## Audited elements

| Element | Location | What it depicts | Class | Reasoning |
|---|---|---|---|---|
| Harbor building cluster (3 houses, pitched roofs, windows, boat) | `districtKit()`, `terrain==="harbor"`, HomeScreen.tsx:44-68 | A small harbor scene — buildings + a boat | **E** | This depicts a PLACE (a row of harbor buildings with a boat), not a function. Flat-vector style has no relationship to the app's established "clay diorama" illustration style — a genuine style mismatch, not just "simple." GPT replacement candidate. |
| Hill building (temple/library, pediment + columns + windows) | `districtKit()`, `terrain==="hill"`, HomeScreen.tsx:113-127 | A small building on a terraced hill, matching the 🏛 landmark | **E** | Same reasoning — a specific structure is being drawn (pediment, columns), not a functional indicator. GPT replacement candidate. |
| Station building cluster (2 buildings, windows) + rail line | `districtKit()`, `terrain==="station"`, HomeScreen.tsx:89-112 | A small train-station scene | **E** (buildings) / **D** (the rail line itself — two parallel lines + tick marks is closer to a diagrammatic railway symbol than an illustration) | Buildings again depict a specific structure; the rail line is abstract enough to be defensible as a functional/diagrammatic mark, but is included here for completeness since it's part of the same illustrative scene. |
| Forest tree cluster (6 circle-on-trunk shapes) | `districtKit()`, `terrain==="forest"`, HomeScreen.tsx:69-88 | A small forest | **D** | More abstract than the building clusters — a circle-on-a-line "tree" reads closer to an iconographic mark than a pictorial illustration, and uses only the app's existing palette. Kept as a keep-candidate, but flagged since the directive names "trees" explicitly as an item to check — a reasonable person could also call this E. Treat as backlog for GPT replacement rather than urgent. |
| Ground-tint ellipses (flat `TERRAIN_FILL` color wash under each district) | HomeScreen.tsx, region-terrain SVG | Nothing pictorial — a flat color region | **B** | Pure abstract color fill, no depicted subject. Functional (marks district extent), not illustration. |
| "worldGrain" SVG filter (feTurbulence texture) | HomeScreen.tsx defs, `#worldGrain` | A visual texture effect, not a depicted subject | **B** | A rendering effect applied to other elements, not an illustration in itself. |
| Compass/minimap (terrain-colored dots, viewport frame, 🏠 emoji) | `Compass()`, HomeScreen.tsx:140-192 | Navigation aid — a schematic, not a scene | **B** | Explicitly a functional wayfinding control (mirrors real canvas geometry, shows "you are here"). Dots are flat color, no pictorial content. The 🏠 is a system emoji glyph, not authored art. |
| `.town-tile` mask-image / grain-filter / softened shadow | index.css `.town-tile` | CSS treatment of the PRE-EXISTING `town-hero.png` asset | **C** | The underlying image is an existing, already-approved JC asset (not touched); only its CSS presentation (edge feather, shared grain) changed. No new illustration was authored. |
| District signpost (emoji + name pill) | HomeScreen.tsx `.district-node.signpost` | UI marker, not a scene | **A** | Unchanged in nature from before the repair — an icon + label button, functional navigation, not illustration. |
| Fog silhouette (📡/🛩 emoji + drifting mist ellipses) | HomeScreen.tsx, districts.ts `silhouette` field | Emoji glyph + abstract mist shapes | **A/B** | Emoji is a system glyph; the mist ellipses are flat abstract shapes (opacity-animated), not a depicted subject. |

## Items pre-dating this session's Sonnet work (noted for completeness, not in scope to fix now)
The region canvas's sea/river/road SVG paths (`region-terrain` — the two sea
`<path>` shapes, the river `<path>`, the dashed road `<path>` per district)
were authored BEFORE the 2026-09-04 Human Visual Review repair, as part of
the original "生きた町のアトラス" implementation earlier this session (prior
model attribution: Claude/"Fable" commits, not Sonnet). They are the SAME
category of concern (AI-drawn depiction of terrain features: coastline,
river, roads) — technically also **E**-eligible by the same rubric, just
outside the "after the switch to Sonnet" scope this audit was asked to
prioritize. Logging this now rather than staying silent about it: if Art
Ownership going forward means no Claude model draws JIBUN CHOICE-world
illustrations, these pre-existing paths should eventually get the same
GPT-asset-request treatment. Not filed as blocking — same backlog tier as
the forest tree cluster above.

## Revision: independent Codex audit overrides Claude's self-classification
Claude's self-audit above classified forest trees and the station rail line
as D (keep candidates) and treated all district illustration clusters as
POST_RELEASE_ART_BACKLOG (not blocking). Because self-review of one's own
work carries an obvious conflict of interest, an INDEPENDENT Codex vision
audit was run against the same screenshots
(`factory/state/art/art-ownership-codex-audit.json`), with no access to
Claude's own classification. Codex's verdict was stricter on both points:

- **forest_trees**: Codex classified this as **E**, not D — "depict a
  specific forest environment and read as newly authored flat vector
  scenery." Claude's softer D classification is superseded.
- **any_public_blocker: true** — Codex judged harbor/forest/station/hill all
  as public-blocking, not backlog, specifically because the Home screen is
  the app's primary first-impression surface, not a deep/secondary screen;
  a visible style mismatch there is not a minor decorative concern.

**This audit defers to the independent verdict.** Final classification:

| Element | Final class | Public blocker? |
|---|---|---|
| Harbor building cluster | E | **Yes** |
| Forest tree cluster | E (revised from D) | **Yes** |
| Station building cluster + rail | E | **Yes** |
| Hill building | E | **Yes** |
| Compass/minimap | A | No |
| Ground-tint ellipses | B | No |
| Fog silhouettes | B | No |
| Center town image | C | No |

## Summary counts
- A (functional UI): 3 elements — keep, no action.
- B (functional SVG): 5 elements — keep, no action.
- C (existing JC asset): 1 element — keep, no action.
- E (Claude-original illustration, GPT replacement candidate, **PUBLIC
  BLOCKER**): **4 elements** (harbor building cluster, forest tree cluster,
  hill building, station building cluster) — see
  `factory/state/art/gpt-asset-requests.json`. No image was generated or
  redrawn by Claude to resolve this; these requests are OPEN, pending GPT
  generation. **This is why Stable finalization must stay stopped for the
  Home/Map screen's art dimension, independent of the Career Path and
  Language UX work.**
- Additional non-blocking finding: pre-existing sea/river/road SVG paths
  (outside this audit's primary requested scope, authored before this
  session's Sonnet-era work) are the same category of concern — filed as
  low-priority backlog, not blocking.

`ART_AUTHORING_SOURCE` tracking for these inline (non-file) visual units is
recorded in `factory/state/art/authoring-source-ledger.json`.
