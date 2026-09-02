# JIBUN CHOICE — World Map Architecture Options (NEUTRAL, for independent evaluation)

Context (facts only, no preference):
- Kids' web app (React/CSS/SVG only, no game engine). Mobile 375px + desktop.
- Today: ONE town illustration (1536x1024) fills the home; 9 "worlds" (a world =
  a town place where a social event is happening, e.g. 動物園に赤ちゃん誕生,
  ごみのゆくえ, 救急外来) are speech balloons absolutely positioned on it.
  No pan, no zoom, no visited/new distinction except one hard-coded NEW badge.
- Presentation audits show 9 balloons already crowd mobile; target is 14 soon
  (adding 5 worlds) and 50 eventually.
- The product philosophy: kids meet JOBS through EVENTS in a world — the home
  must NOT read like a career catalog / textbook chapter list. Job categories
  (医療/IT/物流…) must not be the front-facing organizing principle.
- Existing assets: the town illustration is a known-good series asset (clay
  miniature style); an art pipeline can generate NEW same-style images but
  regenerating good existing assets pointlessly is forbidden.
- State model available: per-world UNSEEN / DISCOVERED / VISITED / IN_PROGRESS /
  COMPLETED / UPDATED.

Evaluate these candidate architectures (and propose ONE more of your own if a
clearly better structure exists):

## A. One huge continuous world, PAN only
The single town keeps growing horizontally/vertically as one big illustrated
surface; the camera pans (swipe/drag). All worlds are hotspots in one space.
No hierarchy. Off-screen content peeks from edges.

## B. World → District → Place (two-level navigation)
Home shows a compact district overview (5-8 illustrated districts); tapping a
district opens that district's own scene with its worlds as hotspots. Classic
hub → area → spot hierarchy with screen transitions.

## C. Archipelago growth
The map is a sea/landscape where ISLANDS (or detached regions) appear as world
clusters grow. New islands literally appear over time. Tap an island to enter
its close-up scene.

## D. Radial continuous town (center → outskirts), camera-move not screen-swap
The existing town stays the center; new districts attach CONTIGUOUSLY around it
(station side, seaside, hills, forest...). One continuous coordinate space,
navigated by 1-axis pan (mobile) with district "jump chips"; tapping a district
smoothly scrolls the camera there (no page transition, the world never "cuts").
Undiscovered districts sit at the edges as fog/silhouettes.

## E. Semantic zoom
One map with zoom levels: far = whole region (districts as shapes), mid =
district (places visible), near = place (event visible). Pinch/buttons change
level; content representation changes per level.

## F. Fog-of-war reveal
The map starts mostly hidden; only visited areas are drawn. New areas appear as
silhouettes when unlocked and fully render when visited. Strong
discovery/surprise emphasis; navigation happens on the partially-revealed map.

For EACH option (A-F + yours), score 0-10 with one-line reasons on:
exploration_fun / scalability_to_50 / discovery / surprise / mobile_usability /
cognitive_load_for_kids (10 = light) / implementation_cost_react_css (10 = cheap) /
compatibility_with_current_worlds / child_friendliness / job_encyclopedia_risk
(10 = no risk).

Then answer:
- WHY_DO_I_WANT_TO_TAP_THE_NEXT_PLACE for your top 2 options (concretely).
- Which single architecture (or explicit hybrid of at most 2-3 named elements)
  you recommend for growth 9 → 14 → 50 worlds, and why (do NOT choose on
  implementation ease alone).
- The biggest failure risk of your recommendation and how to mitigate it.

Output ONE JSON object, no prose, no fences:
{"scores":{"A":{...},"B":{...},...},"own_option":{"name":"...","desc":"...","scores":{...}} or null,
 "tap_desire":{"<opt>":"...","<opt>":"..."},
 "recommendation":{"architecture":"...","elements":[...],"why":"...","risks":"...","mitigations":"..."}}
