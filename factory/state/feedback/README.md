# Real User Feedback (established 2026-09-04, for Stable Prototype v0)

This directory holds observations from ACTUAL children and parents using a
distributed `STABLE` build — as opposed to `factory/state/validation/` and
this session's Codex/Claude QA artifacts, which are all AI/automated
observations of the app.

## Files
- `real-user-feedback-schema.json` — the record schema (also embedded inline
  above each field for reference). No personally identifying information —
  no names, no contact details, no photos/video, no exact age or address.
- `real-user-feedback.jsonl` — one JSON object per line, append-only, created
  on first real observation (does not exist yet as of this writing — this is
  the schema/workflow setup only, per the 2026-09-04 directive; no synthetic
  or placeholder entries have been added).
- `backlog.md` — human-readable triage backlog, one line per feedback_id that
  reached severity HIGH or BLOCKER, with its routing decision and current
  status. Updated during triage, not by the observer.

## AI_VERIFIED vs REAL_USER_OBSERVED — these are NEVER the same status
A world, game, or the Home/map screen can be `AI_VERIFIED` (every automated
gate in this project passed, including adversarial Codex review) and STILL
have a REAL_USER_OBSERVED finding at severity HIGH or BLOCKER. When that
happens:
- The REAL_USER_OBSERVED finding is NEVER dismissed, downgraded, or explained
  away because "the AI QA already passed this." AI QA measures what this
  project's gates were designed to measure; a real child's confusion is
  ground truth about something those gates did not ask.
- The affected world/screen's status is NOT "still AI_VERIFIED" once a
  HIGH/BLOCKER real observation exists against it — record it as
  `AI_VERIFIED, REAL_USER_FINDING_PENDING` until the finding is triaged and
  either fixed-and-reverified or explicitly closed as `wont_fix` with
  reasoning (rare, and only for things outside this project's own stated
  goals — never to avoid the work).
- LOW/MEDIUM real findings accumulate in the backlog without blocking
  anything; they inform future `/game-lab improve` priorities.

## Triage flow (schema/workflow only — no auto-improvement yet)
```
Stable  →  Real Child/Parent  →  Observation  →  REAL_USER_FEEDBACK record
   →  triage (assign severity + candidate_factory_gate)
   →  [HIGH/BLOCKER] → DEVELOPMENT-stage repair
        (/game-lab improve <gameType>, or a targeted repair workflow if the
         finding implicates Home/map/language-UX rather than one game)
   →  AI QA (the SAME gates that world/screen originally passed, re-run)
   →  RELEASE_CANDIDATE (Public-Safety Smoke QA re-run)
   →  STABLE (new tag; human-triggered, see release-lifecycle.md)
```
Triage itself is a judgment call (reading the observation, deciding severity
and which gate should have caught it) — do it thoughtfully, prefer Codex or
a careful read over rubber-stamping severity from the observer's own guess
(an observer may mark something LOW that is actually a real BLOCKER for
other children, or vice versa).

As of 2026-09-04: the schema and this workflow exist; NO automatic
improvement loop runs yet. A human (or an explicitly-instructed agent
session) must read new feedback and decide whether/how to route it — this
was intentional per the setup directive ("今回は自動改善までは実行しない").
