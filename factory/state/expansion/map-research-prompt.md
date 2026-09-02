You are a game-structure researcher. From your knowledge of real, shipped games,
study how games make LARGE amounts of content explorable — the goal is to learn
STRUCTURES (not to copy UI skins) for a kids' web app (React/CSS/SVG, mobile
375px + desktop) that will grow from 9 to 50 "worlds" (each world = a town place
where a social event is happening and jobs can be experienced).

Study AT LEAST 16 titles, spread across genres — do not cluster on one genre:
open world (Zelda BotW), overworld/stage maps (Super Mario World, NSMB, Mario
Wonder), monster/collection RPG (Pokémon region maps), life sim (Animal Crossing),
city/sim (SimCity, Cities: Skylines), strategy fog-of-war (Civilization), minimal
transit (Mini Metro), sandbox (Minecraft/LEGO games), progression paths (Duolingo,
Candy Crush world map), kids' exploration (Yo-kai Watch town, Splatoon hub,
Kirby stage select, Professor Layton scene exploration), mobile idle/town builders
you actually know.

For EACH title emit:
{"title","map_structure","discovery_method","movement_model","zoom_model",
"progression_model","new_content_signaling","visited_state","locked_state",
"event_refresh","exploration_motivation","collection_motivation","scale_strategy",
"mobile_applicability","useful_principles":["..."],
"why_do_i_want_to_tap_the_next_place":"1-3 sentences, concrete"}

Then output cross-title syntheses:
- "scale_patterns": the real structural options games use when content count
  grows 5x-10x (districts/regions, chapter maps, fog reveal, zoom levels,
  archipelago growth, hub-and-spoke...), each with: which titles, strengths,
  costs, mobile fit, and at what content count each pattern starts to shine
- "new_content_signaling_patterns": alternatives to a NEW badge that real games
  use (map changes, NPC callouts, smoke/lights/crowds, silhouettes, sparkle,
  incomplete map edges), with when each works
- "return_motivation_patterns": why players re-enter old areas in real games
  (events refresh, world reacts to your past actions, collections, growth),
  excluding daily-streak style pressure
- "kids_specific": what map structures kids navigate WITHOUT reading text
  (evidence from kids' titles)
- "anti_catalog": structures that prevent a content list from feeling like a
  textbook table of contents

Output ONE JSON object, no prose, no fences:
{"titles":[...16+...],"scale_patterns":[...],
 "new_content_signaling_patterns":[...],"return_motivation_patterns":[...],
 "kids_specific":[...],"anti_catalog":[...],
 "principles_for_jibun_choice":["concrete, structural"]}
Mark uncertain fields with "(推定)".
