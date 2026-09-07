You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE, continuing a review from an earlier
round. Read `factory/projects/real-user-feedback-onboarding-map-labels/review.result.json` first --
that is the round-1 verdict on this exact fix. It found 0 blockers but 1 HIGH: the 4th
initially-visible map-overview label ("イベントやるって！") clipped off the right edge of a 375px
viewport, because showing the label (round-1 change) had no edge-awareness.

This round (round 2) adds an edge-clamp: `src/screens/WorldMapScreen.tsx` now computes each
visible marker's SCREEN x position (`cam.tx + m.x * cam.s`, since markers live inside the
`.region-canvas` div that carries that transform) and, only when the label would overflow past
either viewport edge by more than ~80px (half the label's ~150px max-width plus a small margin),
sets a `--label-shift` CSS custom property equal to the exact overflow amount (plus an 8px margin)
in the needed direction. `src/index.css`'s existing `.marker-label` opacity/scale rule now also
applies `translateX(var(--label-shift, 0px))` -- 0px, i.e. no visual change at all, for every
label that already fit (which round-1 established was 3 of 4). Verify this yourself by reading the
code -- do not trust this summary.

Read the actual code:
- src/screens/WorldMapScreen.tsx (the `labelShift`/`screenX`/`overflowRight`/`overflowLeft`
  computation, right above the marker `<button>` it applies to)
- src/index.css (`.marker-label`, `.in-focus`, `.label-visible` rules)
- factory/projects/real-user-feedback-onboarding-map-labels/review.result.json (round-1 verdict,
  for the exact HIGH being addressed)

Specifically verify:
1. Does the 4th label ("イベントやるって！") now render with both edges inside [0, viewport width]
   at a 375px mobile viewport, on a fresh load (no localStorage), without any pan/tap/focus first?
   Do the OTHER 3 labels (which round 1 already showed fit) remain visually unchanged (shift ~0)?
2. Is the shift computed from values that are already correct for the CURRENT camera/viewport state
   (not stale, not hardcoded), so it stays correct if the initial camera framing or viewport size
   ever changes?
3. Any NEW defect from this change: does it affect click handling, marker position, the icon itself
   (vs. only the label), the pan/zoom/focus architecture, or any other screen? Does the shift ever
   push a label to overlap a DIFFERENT fixed UI element (compass, back button, "？？？" district
   chip) or another marker's label?
4. Does round 1's original concern (a first-time child can read what each of the up-to-4 overview
   markers is about, without tapping/hovering/panning first) still hold with this change applied?
5. Any remaining onboarding/affordance concern from round 1's MEDIUM/LOW findings that you believe
   should now be escalated to HIGH or blocker, or that remains reasonable to leave as backlog
   (round 1 flagged: no real child re-test has happened yet; general de-collision doesn't consider
   fixed UI/viewport edges beyond this specific label; initial labels shrink slightly with canvas
   zoom). Use your own judgment -- don't just defer to round 1's severity assignment if the evidence
   now warrants a different one.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
As in round 1: "career_authenticity_score" here means KIDS-UX / KID-FIRST-PLAY-CLARITY, and
"game_quality_score" means REGRESSION-SAFETY. score = min of the two. verdict must be FAIL if any
blockers or high remain.
