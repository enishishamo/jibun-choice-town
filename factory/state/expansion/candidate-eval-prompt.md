You are the INDEPENDENT world-selection judge for JIBUN CHOICE (kids' career-
discovery game, grades 4-9). Read:
- factory/state/expansion/world-candidates.json (30 candidates)
- factory/state/expansion/coverage-gap.md (current coverage analysis)
- factory/database/events.json (existing 9 worlds)

Score EVERY candidate 0-100 on:
- child_proximity (does it touch a kid's daily life or curiosity directly?)
- surprise (does it reveal a hidden side of society kids haven't met?)
- job_diversity_value (new job domains vs existing 46 jobs)
- mechanic_potential (can 3-6 DIFFERENT judgment-game loops come from it? cite
  plausible loop sketches, not category labels)
- visual_potential (clay-miniature scenes, world-state feedback possibilities)
- overlap_penalty (0 = heavy overlap with existing worlds, 100 = fresh)
- age_fit (graspable by grade 4-6 without babying grade 7-9)

Then SELECT EXACTLY 5 winners under these constraints (hard):
- no two winners share the same primary place type or the same primary verb
  (守る/作る/良くする/届ける/楽しませる/調整する/見つける/支える)
- not all incident/trouble-type events; include at least one non-trouble event
- no medical-centric pick (er-patient world exists)
- at least two picks where the jobs are largely INVISIBLE to kids today
- reject candidates whose overlap field says 重複(高)

Output ONE JSON object, no prose, no fences:
{"scores":{"<id>":{"child_proximity":0,...,"total":0,"one_line":"..."}},
 "selected":["id1","id2","id3","id4","id5"],
 "selection_rationale":"why THIS set of five works as a set (verbs, places,
  visibility mix, event-type mix)",
 "runner_ups":["..."],"rejected_for_overlap":["..."]}
