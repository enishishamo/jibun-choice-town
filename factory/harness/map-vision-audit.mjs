#!/usr/bin/env node
// Independent Codex vision audit for the Home/World Map Human Visual Review
// repair (2026-09-04). Sends REAL screenshots + the current architecture
// decision text to a fresh `codex exec` vision call — Codex has NOT seen
// Claude's own nav-audit or repair-option documents, so its read is independent.
//
// Usage:
//   node map-vision-audit.mjs baseline --out <result.json>
//   node map-vision-audit.mjs verify   --out <result.json>   (post-repair re-check)
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const mode = args[0]; // baseline | verify
const argOf = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const outFile = argOf("--out");
if (!outFile) { console.error("usage: map-vision-audit.mjs <baseline|verify> --out <file>"); process.exit(2); }

// SAFE_ENV: strip any API-key style env vars so this can NEVER silently use a
// paid provider — ChatGPT-subscription `codex` CLI only.
const SAFE_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !/OPENAI|AZURE_OPENAI|ANTHROPIC/i.test(k)),
);

const SHOTS_DIR = "factory/state/art/map-repair-shots";
const shots = mode === "baseline"
  ? [
      `${SHOTS_DIR}/mobile-01-initial.png`,
      `${SHOTS_DIR}/mobile-04-district-selected.png`,
      `${SHOTS_DIR}/desktop-01-initial.png`,
      `${SHOTS_DIR}/desktop-04-district-selected.png`,
    ]
  : [
      `${SHOTS_DIR}/mobile-01-initial-v2.png`,
      `${SHOTS_DIR}/mobile-04-district-selected-v2.png`,
      `${SHOTS_DIR}/desktop-01-initial-v2.png`,
      `${SHOTS_DIR}/desktop-04-district-selected-v2.png`,
    ];

const archDecision = readFileSync("factory/state/expansion/map-architecture-decision.md", "utf8");

const GATES = [
  "EXPLORATION_DESIRE", "MAP_CLARITY", "SCALABILITY", "DISCOVERY_QUALITY",
  "VISUAL_WORLD_FEEL", "MOBILE_USABILITY", "CONTENT_DENSITY", "RETURN_MOTIVATION",
  "LANGUAGE_AGE_FIT", "MAP_SPATIAL_COHERENCE", "NAVIGATION_LAYER_CLARITY", "WORLD_CONTINUITY",
];

const baselinePrompt = `You are an INDEPENDENT adversarial UX critic reviewing a children's app (JIBUN
CHOICE, grades 5-9) HOME / WORLD MAP screen. You have NOT seen any other
analysis of this screen — form your own judgment from the screenshots and the
architecture document below.

Attached screenshots (in order): (1) mobile initial map view, (2) mobile after
tapping into one district (zoomed), (3) desktop initial map view, (4) desktop
after tapping into one district (zoomed).

Here is the architecture that was DECIDED for this screen (the team chose this
over several alternatives specifically because it was supposed to deliver "the
feeling of looking inside one continuous world," not a menu):

---
${archDecision}
---

TASK 1 — TRACEABILITY: Does the actual screen in the screenshots genuinely
deliver the architecture described above, or does it merely contain the
technical pieces (a canvas, a camera transform) without delivering the felt
experience the architecture was chosen for? Be specific and cite what you see.

TASK 2 — ADVERSARIAL QUESTIONS (answer both, do not soften):
(a) "If all labels and explanatory text disappeared, would this still look
    and behave like one explorable world, or would it become a collection of
    UI buttons arranged around a central image?"
(b) "Is this genuinely a map, or a menu styled to look like a map?"

TASK 3 — NAVIGATION LAYER READ: Looking only at the screenshots (not the
code), list every distinct thing a child could tap to change what's on
screen, and say whether any two of them appear to do the same job.

TASK 4 — SCORE each gate 0-100 (be harsh; a gate below its threshold FAILS):
- EXPLORATION_DESIRE (>=80): does this make a child want to tap and look
  around?
- MAP_CLARITY (>=80): is it clear what is where and what state it's in?
- SCALABILITY (>=85): would this composition still work with 50 worlds?
- DISCOVERY_QUALITY: does finding something feel like a discovery or a menu
  lookup?
- VISUAL_WORLD_FEEL: does it look/feel like ONE illustrated world?
- MOBILE_USABILITY (>=80): usable at 375px?
- CONTENT_DENSITY: is information density appropriate (not empty, not
  cluttered)?
- RETURN_MOTIVATION: would a child want to come back and check the map again?
- LANGUAGE_AGE_FIT (>=80): text register appropriate for grades 5-9?
- MAP_SPATIAL_COHERENCE (>=80, NEW): do districts feel like they exist in the
  same continuous geography as the center, or like separate UI elements
  scattered on a background?
- NAVIGATION_LAYER_CLARITY (>=85, NEW): is there ONE clear primary way to
  navigate, with no redundant competing system?
- WORLD_CONTINUITY (>=80, NEW): does the visual language stay consistent
  across the whole screen, or does it shift between "illustrated place" and
  "flat UI" in different areas?

Your ENTIRE final message must be a single JSON object, no prose, no fences:
{"traceability_verdict":"REALIZED|PARTIALLY_REALIZED|NOT_REALIZED",
 "traceability_evidence":["..."],
 "adversarial_a":"...", "adversarial_a_verdict":"ONE_WORLD|COLLECTION_OF_BUTTONS",
 "adversarial_b":"...", "adversarial_b_verdict":"MAP|MENU_STYLED_AS_MAP",
 "navigation_layers_seen":["..."],
 "duplicate_navigation_found":true,
 "duplicate_navigation_detail":"...",
 "scores":{${GATES.map((g) => `"${g}":0`).join(",")}},
 "blockers":[],"high":[],"medium":[],"low":[],
 "overall_verdict":"PASS|FAIL"}
overall_verdict=FAIL if adversarial_a_verdict=COLLECTION_OF_BUTTONS, or
adversarial_b_verdict=MENU_STYLED_AS_MAP, or any >=80/85 threshold gate is
below its threshold, or any blocker/high remains.`;

const verifyPrompt = `You are an INDEPENDENT adversarial UX critic re-checking a REPAIRED children's
app (JIBUN CHOICE, grades 5-9) HOME / WORLD MAP screen, after a prior round
found it read as "a menu styled to look like a map." You have not seen the
repair's design rationale — judge only what you see.

Attached screenshots (in order): (1) mobile initial map view, (2) mobile after
tapping into one district (zoomed), (3) desktop initial map view, (4) desktop
after tapping into one district (zoomed).

Answer the SAME adversarial questions as the original audit, honestly:
(a) "If all labels and explanatory text disappeared, would this still look
    and behave like one explorable world, or would it become a collection of
    UI buttons arranged around a central image?"
(b) "Is this genuinely a map, or a menu styled to look like a map?"

Then score the same 12 gates and report navigation layers seen, exactly as
before.

Your ENTIRE final message must be a single JSON object, no prose, no fences:
{"adversarial_a":"...", "adversarial_a_verdict":"ONE_WORLD|COLLECTION_OF_BUTTONS",
 "adversarial_b":"...", "adversarial_b_verdict":"MAP|MENU_STYLED_AS_MAP",
 "navigation_layers_seen":["..."],
 "duplicate_navigation_found":true,
 "duplicate_navigation_detail":"...",
 "scores":{${GATES.map((g) => `"${g}":0`).join(",")}},
 "blockers":[],"high":[],"medium":[],"low":[],
 "overall_verdict":"PASS|FAIL"}
overall_verdict=FAIL if adversarial_a_verdict=COLLECTION_OF_BUTTONS, or
adversarial_b_verdict=MENU_STYLED_AS_MAP, or any >=80/85 threshold gate is
below its threshold, or any blocker/high remains.`;

const prompt = mode === "baseline" ? baselinePrompt : verifyPrompt;
const replyFile = join(mkdtempSync(join(tmpdir(), "jc-mapaudit-")), "reply.txt");
const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
for (const f of shots) cargs.push("-i", resolve(ROOT, f));
cargs.push("-");

const t0 = Date.now();
const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: 600000, env: SAFE_ENV });
const elapsed = (Date.now() - t0) / 1000;

let result;
if (r.status !== 0) {
  result = { ok: false, status: "CODEX_ERROR", error: `codex exec exited ${r.status}: ${(r.stderr || "").slice(-800)}`, elapsed_sec: elapsed };
} else {
  let raw = "";
  try { raw = readFileSync(replyFile, "utf8"); } catch { /* none */ }
  const start = raw.indexOf("{");
  let parsed = null;
  if (start >= 0) {
    for (let end = raw.length; end > start; end--) {
      try { parsed = JSON.parse(raw.slice(start, end)); break; } catch { /* shrink */ }
    }
  }
  result = parsed
    ? { ok: true, status: "OK", verdict: parsed, elapsed_sec: elapsed }
    : { ok: false, status: "CODEX_MALFORMED", error: "no parsable JSON in reply", raw: raw.slice(0, 3000), elapsed_sec: elapsed };
}
writeFileSync(outFile, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ status: result.status, out: outFile, elapsed_sec: elapsed }));
process.exit(result.ok ? 0 : 1);
