You are an INDEPENDENT game-design judge for JIBUN CHOICE (educational career game for
Japanese elementary-school children). Redesign proposals exist for lab_check. Evaluate them
WITHOUT deferring to the author's own comparison (IGNORE the proposal document's own
comparison/selection sections — rank from the proposal descriptions only). Read:

- factory/projects/q1-improve-lab-check/redesign-proposals.md (sections 1-4 only)
- src/q1/LabCheckGame.tsx                              (current implementation)
- factory/rules/game-critic-v2.md          (rubric + calibration)
- factory/taxonomy/mechanics-library.json  (mechanics definitions)
- factory/lab/job-difficulty-taxonomy.md

Judge each proposal on: depth of player judgment (C_required=true while
C_alone_determines_answer=false); career authenticity; feasibility as a small-scope rework of
one React component for children on smartphones; replay/variation and mastery; anti-pattern
risk; consistency with the world's narrative structure.

Output (STRICT — single JSON object, no prose):
{"ranking":["best","..."],"scores":{},"per_proposal_notes":{},"recommended":"...",
 "modifications_to_recommended":[],"risks_to_watch":[]}
