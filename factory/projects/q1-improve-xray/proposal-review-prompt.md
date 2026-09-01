You are an INDEPENDENT game-design judge for JIBUN CHOICE (educational career game for
Japanese elementary-school children). Four redesign proposals exist for the radiographer game
XrayGame (current implementation scored 58/100). Evaluate them WITHOUT deferring to the
author's own comparison table — form your own ranking. Read:

- factory/projects/q1-improve-xray/redesign-proposals.md  (sections 1-4; IGNORE section 5, the author's own comparison)
- src/q1/XrayGame.tsx                                     (current implementation)
- factory/rules/game-critic-v2.md                         (rubric + calibration)
- factory/taxonomy/mechanics-library.json                 (mechanics definitions)
- factory/lab/job-difficulty-taxonomy.md

Judge each proposal (A/B/C/D) on:
1. Depth of player judgment (C_required=true while C_alone_determines_answer=false)
2. Career authenticity for 診療放射線技師 (real professional judgments translated, not decorated)
3. Feasibility as a SMALL-scope rework of one React component for children on smartphones
4. Replay/variation and mastery potential
5. Risk of anti-patterns (memorization, brute force, reflex-only play)
6. Consistency with the medical world's one-patient narrative structure

Output (STRICT — single JSON object, no prose):
{
  "ranking": ["best proposal letter", "...", "...", "worst"],
  "scores": {"A":0-100,"B":0-100,"C":0-100,"D":0-100},
  "per_proposal_notes": {"A":"...","B":"...","C":"...","D":"..."},
  "recommended": "letter",
  "modifications_to_recommended": ["concrete changes that would improve the winning proposal"],
  "risks_to_watch": ["..."]
}
