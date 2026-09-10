# Route parameter tuning notes (part 2: school visit sequencing)

## v1 (superseded)

Model: two schools A/B, each with `travel` (depot→school minutes) and `dl`
(deadline, minutes after departure). Visiting A first: arriveA=travelA,
arriveB=travelA+between. Visiting B first: arriveB=travelB,
arriveA=travelB+between. An order is valid if both arrivals are within
their own deadlines.

v1 used Cartesian rejection sampling over 2-value choice sets
(TRAVEL_CHOICES=[10,40], BETWEEN_CHOICES=[30,50], DEADLINE_CHOICES=[35,55]).
Design review r1 (FAIL 64) found this retained only 7 of the 32 raw
(travelA,travelB,between,dlA,dlB) tuples as solvable, and BOTH the
"nearer first" and "tighter deadline first" heuristics happened to be
correct on 6 of those 7 tuples (~85.7%) -- an accident of which few tuples
survived rejection, not a designed property (C_NOT_NEEDED_FOR_D, HIGH).

## v2 (adopted) -- reviewer-prescribed balanced scenario pool

The reviewer's exact recommendation: "Replace route generation with an
explicit balanced scenario pool stratified equally among (1) both
heuristics correct, (2) only nearer-first correct, and (3) only
tighter-deadline-first correct, with mirrored A/B variants and exactly one
valid order. Equal weighting makes each heuristic succeed in 2/3 of
sessions (66.7%), a 33.3pp reasoning margin."

Implemented exactly as specified. Three archetypes, each hand-verified to
have EXACTLY one valid visiting order (verified with a standalone script
before committing, and again via design-sim.mjs's exhaustive per-archetype
checks):

1. **both-agree**: slotA(travel=10, deadline=30), slotB(travel=40,
   deadline=90), between=30. Only order AB (slotA first) is valid
   (BA: arriveB=40<=90 ok, but arriveA=40+30=70<=30 fails). Both
   "nearer first" (10<40) and "tighter deadline first" (30<90) agree with
   the correct answer (slotA first).
2. **nearer-only-correct**: slotA(travel=15, deadline=50), slotB(travel=35,
   deadline=45), between=20. Only order AB (slotA first) is valid
   (BA: arriveB=35<=45 ok, but arriveA=35+20=55<=50 fails). "nearer first"
   (15<35) correctly picks slotA; "tighter deadline first" (45<50)
   incorrectly picks slotB — slotB's deadline LOOKS tighter in absolute
   terms, but slotA can't tolerate being visited second (55>50) while
   slotB can (35<=45), so slotA must go first despite its looser-looking
   deadline number.
3. **tighter-only-correct**: slotA(travel=15, deadline=50), slotB(travel=25,
   deadline=30), between=20. Only order BA (slotB first) is valid
   (AB: arriveA=15<=50 ok, but arriveB=15+20=35<=30 fails). "tighter
   deadline first" (30<50) correctly picks slotB; "nearer first" (15<25)
   incorrectly picks slotA — slotA is nearer, but its very loose deadline
   (50) means it tolerates being visited second (45<=50), while slotB's
   tight deadline (30) cannot tolerate the between-time added by going
   second (25+20=45>30), so slotB must go first despite being farther.

Each session draws one of the 3 archetypes uniformly at random, then
independently "mirrors" which slot is displayed as school A vs school B
(so display position never correlates with correctness — id/slot-based
scoring only, matching this Factory's per-session-shuffle convention).

Verified (N=20000, design-sim-result.json):
- legitimate_full_reasoning = 100% (every session solvable by construction)
- tighter_deadline_first = 66.63%, nearer_first = 66.94% — both land at the
  theoretically guaranteed 2/3 ceiling (correct on exactly 2 of 3
  archetypes), not an empirical accident
- archetype distribution: ~33.3% each (route_archetype_distribution_balanced
  = true), confirming the sampler is genuinely balanced
- margin over either heuristic: 33.06–33.37 percentage points — a
  GUARANTEED margin by construction, not a sampled estimate, and larger
  than legacy-sow-and-grow's accepted 20.8pp margin
