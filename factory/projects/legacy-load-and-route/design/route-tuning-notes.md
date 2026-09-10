# Route parameter tuning notes (part 2: school visit sequencing)

Model: two schools A/B, each with `travel` (depot→school minutes) and `dl`
(deadline, minutes after departure). Visiting A first: arriveA=travelA,
arriveB=travelA+between. Visiting B first: arriveB=travelB,
arriveA=travelB+between. An order is valid if both its arrivals are within
their own deadlines.

Goal: find discrete choice sets for (travel, between, deadline) such that:
- every session (after rejection sampling) has at least one valid order,
- neither "visit whichever has the smaller travel time first" (nearer-first)
  nor "visit whichever has the smaller deadline first" (tighter-deadline-first)
  is a reliable predictor of the correct order — otherwise a child could win
  by applying one single-glance rule without actually computing arrival times
  against each school's own deadline, exactly the class of exploit design
  review r2 found in legacy-sow-and-grow's first repair attempt (a variety/
  month mapping that won regardless of the session's real numbers).

Method: enumerated small discrete choice sets by hand first (2-4 values per
axis), computed both heuristics' overall win rate against the "always find a
valid order if one exists" baseline (100% by construction) over the full
20,000-sample rejection-sampled distribution used by design-sim.mjs, then
did a randomized search (300 trials, requiring >=50% of sessions to have
exactly one valid order so most sessions genuinely require the calculation)
over wider ranges to see how much further either heuristic's rate could be
pushed down. The random search found degenerate configs (heuristics at 0%)
only when one deadline choice was smaller than every travel choice, making
it permanently infeasible and effectively collapsed by resampling to a
single deadline value in practice — not a meaningful result, so those were
discarded.

Adopted config: TRAVEL_CHOICES=[10, 40], BETWEEN_CHOICES=[30, 50],
DEADLINE_CHOICES=[35, 55] (all minutes). Verified (N=20000,
factory/projects/legacy-load-and-route/design/design-sim-result.json):
- legitimate_full_reasoning = 100% (every session solvable by construction)
- tighter_deadline_first = 85.8% (14.2pp below full reasoning)
- nearer_first = 85.5% (14.5pp below full reasoning)
- neither heuristic exceeds 90% (route_tighter_deadline_heuristic_not_dominant
  / route_nearer_heuristic_not_dominant both true)

This margin is comparable in kind to legacy-sow-and-grow's final accepted
design (a fixed month-only mapping there won 79.2% vs 100% full reasoning,
independently PASSed by design review r6) — not identical in magnitude, but
the same qualitative property (every simple content-blind heuristic loses
meaningfully more often than genuine per-session calculation) that review
process accepted as sufficient. Disclosed transparently here rather than
claimed as a stronger guarantee than it is; the independent design reviewer
should make the final call on whether this margin is adequate.
