You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE, continuing a review chain (round 4).

Read, in order:
1. `factory/projects/real-user-feedback-onboarding-map-labels/review.result.json` (round 1)
2. `factory/projects/real-user-feedback-onboarding-map-labels/round2-review.result.json` (round 2)
3. `factory/projects/real-user-feedback-onboarding-map-labels/round3-review.result.json` (round 3:
   found the edge-clamp measured each label's width via `getBoundingClientRect()`, reasoning that
   it already includes the ancestor `.region-canvas` scale — but that measurement can be taken
   WHILE the label's own opacity/scale REVEAL transition (0.35s, scale 0.8 -> 1, triggered when the
   label newly becomes visible) is still in flight, silently locking in a too-small width for the
   rest of that label's lifetime since the measuring effect's dependencies don't include a
   "transition finished" signal.)

This round (round 4) reverts the measurement to `el.offsetWidth` (a pure layout value: unaffected
by ANY css transform, whether the label's own reveal-transition scale or the ancestor canvas's
scale, so it can never be caught mid-transition) and explicitly multiplies it by `cam.s` before
comparing it against already-screen-space values (`vp.w`, `cam.tx + m.x * cam.s`) — since
`offsetWidth` is in the canvas's own pre-scale units, same as before round 3's (reverted) attempt,
but this time with the `cam.s` conversion round 3 correctly identified as missing. The 150px
fallback (used only before the first measurement lands, which happens via `useLayoutEffect` before
paint) is likewise multiplied by `cam.s` for consistency.

Verify this yourself by reading the code — do not trust this summary, and do not assume "it must be
fine now because this is round 4" — check the actual reasoning as skeptically as round 1-3 did.

Read the actual code:
- src/screens/WorldMapScreen.tsx (the `labelRefs`/`labelWidths`/`useLayoutEffect` measurement block,
  and the `halfLabelScreenW`/`screenX`/`overflowRight`/`overflowLeft`/`screenShift`/`labelShift`
  computation in the `markers.map` render)
- src/index.css (`.marker-label`, `.in-focus`, `.label-visible` — specifically the
  `transition: opacity 0.35s, transform 0.35s` this round's fix reasons about)
- All three prior round result JSON files named above

Specifically verify:
1. Is `offsetWidth` truly immune to being measured mid-transition, for BOTH the label's own
   opacity/scale reveal AND the ancestor `.region-canvas`'s scale? Justify from CSS semantics
   (layout box vs. paint-time transform), not just by re-stating the code comment's claim.
2. Is the `cam.s` multiplication applied consistently and correctly this time — i.e., does
   `halfLabelScreenW` end up in the same coordinate space as `screenX` and `vp.w` before they're
   compared, and is the final `screenShift / cam.s` conversion (for handing the correction back to
   a CSS custom property inside the scaled `.region-canvas`) still mathematically sound?
3. Walk through the concrete "アイスが高くなってる！" example from round 2/3 (marker center around
   canvas x≈936, cam.s≈0.95 at the default 375px overview) and confirm whether it now correctly
   receives zero or a small, appropriate shift rather than being incorrectly flagged or missed.
4. Any remaining measurement timing issue: does the effect ever run BEFORE the label's text/DOM
   node exists, before fonts are loaded, or in a way that could still capture a wrong value that
   persists (check the dependency array and the update-only-on-change guard)?
5. Any NEW defect from this round's revert: click handling, marker position, other markers/screens,
   the pan/zoom/focus architecture.
6. With all three prior rounds' findings now addressed (label visibility, edge clipping, and two
   successive measurement/unit-conversion bugs), does the underlying REAL_USER_FEEDBACK concern (a
   first-time child can look at the map and understand there are things to tap, without reading any
   instructions) hold up well enough to ship? Use your own judgment on remaining MEDIUM/LOW items
   from earlier rounds (no real child re-test yet; general de-collision doesn't consider fixed UI
   beyond labels; labels shrink slightly with canvas zoom) — decide what's genuinely still worth a
   HIGH/blocker versus reasonable backlog at this point, rather than mechanically carrying forward
   every earlier note.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
As before: "career_authenticity_score" means KIDS-UX / KID-FIRST-PLAY-CLARITY, "game_quality_score"
means REGRESSION-SAFETY. score = min of the two. verdict must be FAIL if any blockers or high
remain.
