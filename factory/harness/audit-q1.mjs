#!/usr/bin/env node
// Stage 3: batch audit runner. Splits the 39 registered Q1 games into batches,
// generates a Critic-v2 audit prompt per batch, and delegates each batch to
// Codex (token-saving routing: repo-reading + repetitive analysis go to Codex).
// Results land in factory/state/audits/batch-<n>.result.json; merge with
// `node factory/harness/audit-q1.mjs merge`.
//
// Usage:
//   node factory/harness/audit-q1.mjs plan              -> show batches
//   node factory/harness/audit-q1.mjs prompt <n>        -> write prompt file for batch n, print path
//   node factory/harness/audit-q1.mjs merge             -> merge batch results into q1-audit.json + ranking

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const AUDITS = join(ROOT, "factory", "state", "audits");
mkdirSync(AUDITS, { recursive: true });

const mech = JSON.parse(readFileSync(join(ROOT, "factory/database/mechanics.json"), "utf8"));
const games = (Array.isArray(mech) ? mech : mech.mechanics || Object.values(mech)).map((g) => ({
  id: g.id,
  label: g.label,
  componentPath: g.componentPath,
  section: g.section,
}));
const BATCH = 5;
const batches = [];
for (let i = 0; i < games.length; i += BATCH) batches.push(games.slice(i, i + BATCH));

const FIELDS = `{
  "gameType": "...",
  "event": "world/section name",
  "job": "the profession",
  "mechanic": "primary challenge structure in your own words",
  "C": "what job-specific info/tools/data the game provides",
  "D": "what judgments/operations the player performs with C",
  "C_required": true|false,
  "C_alone_determines_answer": true|false,
  "player_judgment_required": true|false,
  "action_changes_result": true|false,
  "failure": "does meaningful failure exist and what does it cost",
  "retry": "how retry works",
  "mastery": "what a skilled player does differently (or 'none')",
  "replay": "what differs on a second play (or 'none')",
  "variation": "what varies between sessions (or 'none')",
  "exploit": "cheapest way to win: button spam / select-all / brute force / memorize / none-found",
  "career_authenticity_score": 0-100,
  "game_quality_score": 0-100,
  "overall_risk": "low|medium|high — one-line why",
  "core_loop_statement": "...",
  "mastery_statement": "...",
  "replay_statement": "...",
  "novice_vs_expert": "...",
  "evidence": ["file:line — what you saw"]
}`;

const cmd = process.argv[2];
if (cmd === "plan") {
  batches.forEach((b, i) => console.log(`batch ${i}: ${b.map((g) => g.id).join(", ")}`));
} else if (cmd === "prompt") {
  const n = Number(process.argv[3]);
  const b = batches[n];
  if (!b) { console.error(`no batch ${n}`); process.exit(2); }
  const prompt = `You are an INDEPENDENT game-quality auditor for JIBUN CHOICE (educational career-experience
web game for Japanese elementary-school children, React+TS). Audit each game below by READING
ITS ACTUAL COMPONENT CODE — never guess from names.

First read the rules you must apply:
- factory/rules/game-critic-v2.md          (rubric + calibration; two-axis scoring)
- factory/harness/design-principles.md     (A->B->C<->D->E, calibrated conditions)

CALIBRATION (critical): C_required=true is DESIRABLE. Only flag as a defect when
C_alone_determines_answer=true, i.e. after reading the in-game documents no player judgment,
observation, timing, or comparison remains. Simple UI / few options are fine for children;
absence of real decisions is not.

Games to audit (read each component file, plus src/q1/gameTypes.ts once if needed):
${b.map((g) => `- ${g.id} (${g.label}) — ${g.componentPath} [${g.section}]`).join("\n")}

For EVERY game output one object with EXACTLY these fields:
${FIELDS}

Scoring guide: 75+ complete-candidate / 60-74 improvable / <60 needs repair.
career_authenticity_score judges whether the game captures the job's REAL specific judgments
and constraints; game_quality_score judges whether it works as a game (per the rubric).

Your ENTIRE final message must be a single JSON array with one object per game, no prose, no code fences.`;
  const file = join(AUDITS, `batch-${n}.prompt.md`);
  writeFileSync(file, prompt);
  console.log(file);
} else if (cmd === "merge") {
  const all = [];
  const missing = [];
  batches.forEach((b, i) => {
    const f = join(AUDITS, `batch-${i}.result.json`);
    if (!existsSync(f)) { missing.push(i); return; }
    const r = JSON.parse(readFileSync(f, "utf8"));
    const arr = r.json;
    if (!Array.isArray(arr)) { missing.push(i); return; }
    all.push(...arr);
  });
  if (missing.length) console.error(`WARNING: missing/invalid batches: ${missing.join(", ")}`);
  const expected = new Set(games.map((g) => g.id));
  const got = new Set(all.map((a) => a.gameType));
  const absent = [...expected].filter((id) => !got.has(id));
  if (absent.length) console.error(`WARNING: games not audited: ${absent.join(", ")}`);
  const doc = {
    note: "Stage 3 full Q1 audit. Auditor: Codex (independent). Merged by audit-q1.mjs.",
    audited_at: new Date().toISOString().slice(0, 10),
    auditor: "codex",
    rubric: "factory/rules/game-critic-v2.md",
    games: all.sort((a, b2) => (a.game_quality_score ?? 0) - (b2.game_quality_score ?? 0)),
  };
  writeFileSync(join(AUDITS, "q1-audit.json"), JSON.stringify(doc, null, 1) + "\n");
  console.log(`merged ${all.length}/${games.length} games -> factory/state/audits/q1-audit.json`);
} else {
  console.error("commands: plan | prompt <n> | merge");
  process.exit(2);
}
