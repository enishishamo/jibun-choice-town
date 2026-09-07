You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12, primary viewport
375px mobile). A REAL parent/child household reported, verbatim: 「子どもが、どうやって使ったら
いいかわからない」("the child doesn't know how to use it"). This is a REAL_USER_FEEDBACK
observation (factory/state/feedback/real-user-feedback.jsonl, feedback_id
e67d8587-189f-4c1d-8825-121a06e5e35d), recorded at severity BLOCKER as a candidate FIRST-PLAY /
onboarding-affordance blocker. Per `factory/rules/autonomous-execution.md`'s USER LEARNING LOOP,
a real user observation is never dismissed because AI QA already passed the same screen.

**The product's own explicit principle for this fix (do not violate it):** the child should not
need to read an instruction screen before playing. The intended flow is: look at the screen ->
see where to tap -> tap -> see a reaction -> understand what to do next. A fix that adds a long
"how to play" explanation screen, tutorial overlay, or wall of instructional text is NOT an
acceptable fix even if it would technically resolve the confusion -- flag such a fix as WRONG
APPROACH regardless of whether it "works."

**Investigation performed** (verify by reading the actual code, not by trusting this summary):
A fresh-state (cleared localStorage) walkthrough of Home -> Map -> event selection -> World entry
-> first in-game operation found that the AreaScreen (inside an event) and every world's first
interactive screen already have clear, always-visible captions attached to every tappable icon
(e.g. "来月の野菜が足りなくなりそう！" next to a vegetable icon) plus an explicit "ぜんぶ見なくても
OK" affordance hint -- these screens are NOT implicated.

The actual defect was on the region-overview MAP screen (`src/screens/WorldMapScreen.tsx`,
rendered via `.world-marker` in `src/index.css`): up to `MAX_INITIAL_OVERVIEW` (4) event markers
are deliberately kept visible on the very first map view (2026-09-05 Human Review, "Progressive
Disclosure" -- a marker-COUNT cap, not a text-hiding decision), but each marker's text label
(`.marker-label`, e.g. "病院に人が来た") was only shown (`opacity: 1`) when `.in-focus` -- a class
applied only once a child has already selected/entered that marker's district. Before that, a
first-time child saw only a small (~17-22px) circular icon with a flame emoji and NO text at all,
for every marker, including the four Progressive Disclosure meant to be genuinely visible and
inviting. There is no hover state on a touchscreen, so no existing mechanism ever revealed the
label pre-tap. This is the most plausible concrete mechanism behind "doesn't know how to use it":
a busy, richly-illustrated town scene with a handful of unlabeled tap targets and no other visual
invitation (no animation on these specific markers; the CSS `animation-name` computed on them was
literally `none`).

**The fix**: added a `label-visible` class, applied whenever a marker is either `in-focus` OR
already part of the `overviewVisibleIds` set (the same up-to-4 markers Progressive Disclosure
already decided should be visible) -- and extended the existing `.marker-label { opacity: 1 }`
CSS rule to also match `.label-visible`. No new marker, no new reveal mechanism, no instruction
text, no change to marker count/position/click handling/the pan-focus-zoom architecture. The
already-hidden (`hidden-until-focus`) markers are unaffected and remain label-less until their
district is entered, exactly as Progressive Disclosure intended.

Read the actual code:
- src/screens/WorldMapScreen.tsx (the `markers.map` block specifically, and the
  `overviewVisibleIds`/`MAX_INITIAL_OVERVIEW` definitions above it)
- src/index.css (search `.marker-label`, `.in-focus`, `.label-visible`, `.hidden-until-focus`,
  `.far`, `.signal`)
- src/screens/AreaScreen.tsx (or wherever the AreaScreen icons/captions this prompt describes as
  "already fine" actually live) -- confirm that claim rather than trusting it.
- factory/state/feedback/real-user-feedback.jsonl (the actual feedback record)
- factory/rules/q1-first-play-standard.md and factory/rules/autonomous-execution.md (for how a
  first-play/onboarding gate should be judged, and the USER LEARNING LOOP priority)

Specifically verify:
1. Does this fix actually make the 4 initially-visible markers show real, readable label text on
   the very first map view, on a fresh (no localStorage) load, at a 375px mobile viewport --
   without requiring any tap, hover, pan, or district selection first?
2. Does anything about the fix leak an answer, spoil a twist, or turn "what will I discover" into
   something less engaging? (The labels are dramatic teasers like "給食が間に合わない！", not
   answers to any game -- confirm they read that way, not as spoilers.)
3. Any layout regression: label text overlapping another label, overflowing the screen edge,
   colliding with the compass/district chips/back button, at both mobile (375px) and a wider
   viewport?
4. Does the fix touch anything it shouldn't -- marker click handling, marker positions, the
   pan/zoom camera, the `hidden-until-focus` markers, `MAX_SIGNALS`/`signal` pulsing crowd icons,
   or any other screen?
5. Is this actually likely to address the reported confusion, or is there a more fundamental /
   different onboarding dead-point this investigation missed (e.g. Home screen's own CTA framing,
   the "？？？" foggy-district chips' legibility, whether a child understands the map is
   pannable at all)? If you believe the true root cause lies elsewhere, say so explicitly --
   don't rubber-stamp just because this fix is plausible and low-risk.
6. Does the fix avoid the "long instruction screen" anti-pattern described above?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
Since this is a UI/affordance fix rather than a game-content fix, treat
"career_authenticity_score" as a KIDS-UX / KID-FIRST-PLAY-CLARITY score instead (same 0-100
meaning: how well a real first-time child would understand what to do), and
"game_quality_score" as a REGRESSION-SAFETY score (did the fix avoid breaking anything else).
score = min of the two. verdict must be FAIL if any blockers or high remain.
