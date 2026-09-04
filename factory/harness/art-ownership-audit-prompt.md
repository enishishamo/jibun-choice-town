You are an INDEPENDENT art-ownership auditor for JIBUN CHOICE. A new rule was
just adopted: illustrations depicting the game's world (people, buildings,
towns, backgrounds, job scenes, landmarks, decorative terrain) must be
authored by GPT going forward — Claude/Sonnet/Haiku may only build
FUNCTIONAL visuals (layout, CSS, masks, icons, charts, meters, functional
SVG, game-state visualization). Claude (Sonnet) recently added new visual
elements to the Home/World Map screen and has already self-audited them —
but self-review has an obvious conflict of interest, so you are being asked
to independently classify the SAME elements from the attached screenshots,
without being shown Claude's own classification first.

Attached screenshots: Home region view (mobile + desktop) showing all
districts, and a district-zoomed view (港/harbor).

For each of these visual elements visible in the screenshots, classify it:
- A = FUNCTIONAL_UI (icons, buttons, labels — not a depicted scene)
- B = FUNCTIONAL_SVG (abstract shapes, meters, effects — not a depicted subject)
- C = EXISTING_JC_ASSET (a pre-existing approved illustration, unmodified)
- D = ILLUSTRATION_LIKE_BUT_SERIES_MATCH (depicts a place/subject but is
  simple/abstract enough and stylistically compatible to keep for now)
- E = CLAUDE_ORIGINAL_ILLUSTRATION (depicts a place/subject in a way that
  reads as an authored illustration, stylistically mismatched from the
  series' clay-diorama look — should be replaced by a GPT-generated asset)

Elements to classify:
1. The center town image (the detailed miniature-town illustration)
2. The harbor district's building cluster (3 small houses with roofs + a boat)
3. The forest district's tree shapes (simple circle-on-trunk trees)
4. The station district's building cluster + rail line
5. The hill district's building (columns/pediment on a mound)
6. The small circular "compass" navigation control (dots + house icon + orange frame)
7. The flat color patches under each district (the pale green/tan ground tint)
8. The fog districts' ghosted silhouette shapes

For each, also answer: does this element, AS CURRENTLY RENDERED, look like it
belongs to the same illustrated series as the center town image, or does it
look like a visibly different (simpler/flatter/mismatched) art style bolted
on next to it?

Your ENTIRE final message must be a single JSON object, no prose, no fences:
{"classifications":[
  {"element":"center_town_image","class":"A|B|C|D|E","same_series_style":true|false,"reasoning":"..."},
  {"element":"harbor_buildings","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"forest_trees","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"station_buildings_and_rail","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"hill_building","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"compass","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"ground_tint_patches","class":"...","same_series_style":true|false,"reasoning":"..."},
  {"element":"fog_silhouettes","class":"...","same_series_style":true|false,"reasoning":"..."}
],
"any_public_blocker":true|false,
"public_blocker_reasoning":"..."}
