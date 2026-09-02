#!/usr/bin/env node
// Art Need Detector (Stage 6, §3): delegates a repo-wide semantic scan to
// Codex (TODO(art), emoji placeholders, per-world visual gaps classified
// ESSENTIAL/SUPPORTING/OPTIONAL), then reduces the need list against the
// existing-asset inventory (reuse first — new raster generation is the LAST
// resort). Output: factory/state/art/art-needs.json
//
// Usage: node factory/harness/art/art-need-detector.mjs [--skip-scan]

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ART = dirname(fileURLToPath(import.meta.url));
const HARNESS = dirname(ART);
const ROOT = join(HARNESS, "..", "..");
const STATE = join(ROOT, "factory", "state", "art");

const SCAN_PROMPT = `You are doing a repo-wide ART REQUIREMENT scan for JIBUN CHOICE (React+TS, educational game).
Read the actual code — src/ components, src/data/content/*.ts, src/index.css — and report:
1. todo_art: every TODO(art) / art-related TODO with file:line and what it asks for.
2. emoji_placeholders: emoji used as stand-ins for scene/object visuals (not ordinary UI emoji).
3. art_needs: for each WORLD, places where a genuinely MISSING visual hurts comprehension,
   classified ESSENTIAL (game understanding / before-after / state difference / scene
   observation / job-specific visual), SUPPORTING (people, town, atmosphere), OPTIONAL
   (decoration). Be conservative: if existing assets, CSS or emoji already communicate it,
   do NOT list it. Adding images is not a goal.
Output single JSON object only:
{"todo_art":[{"file":"","line":0,"ask":""}],"emoji_placeholders":[{"file":"","line":0,"represents":""}],
 "art_needs":[{"world":"","where":"","what":"","class":"ESSENTIAL|SUPPORTING|OPTIONAL","existing_candidate":"path or null"}]}`;

const skipScan = process.argv.includes("--skip-scan");
if (!skipScan) {
  const pf = join(STATE, ".need-scan-prompt.txt");
  writeFileSync(pf, SCAN_PROMPT);
  const r = spawnSync("node", [join(HARNESS, "codex-task.mjs"), "--prompt-file", pf, "--timeout-sec", "900", "--expect-json", "--label", "art-need-scan", "--out", join(STATE, "need-scan.result.json")], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("scan delegation failed — refusing to write art-needs from stale data");
    process.exit(1);
  }
}

// prefer the fresh scan; fall back to the Stage-6 initial scan
const scanFile = existsSync(join(STATE, "need-scan.result.json"))
  ? join(STATE, "need-scan.result.json")
  : join(STATE, "art-scan.result.json");
const scan = JSON.parse(readFileSync(scanFile, "utf8")).json;

// refresh inventory, then reduce needs against reusable existing assets
execFileSync("node", [join(ART, "asset-inventory.mjs")], { stdio: "pipe" });
const inv = JSON.parse(readFileSync(join(STATE, "asset-inventory.json"), "utf8"));

const needs = (scan.art_needs || []).map((n) => {
  const candidate = n.existing_candidate && inv.assets.find((a) => ("/" + a.path.replace(/^public\//, "")) === n.existing_candidate || a.path === n.existing_candidate.replace(/^\//, "public/"));
  return {
    ...n,
    resolution: candidate
      ? { strategy: "reuse", asset: candidate.path }
      : n.class === "OPTIONAL"
        ? { strategy: "skip", reason: "optional decoration — do not add images for their own sake" }
        : { strategy: "generate_or_compose", note: "no reusable asset — goes through the provider chain (css/svg/composition/codex_imagegen/human_boundary)" },
  };
});

const doc = {
  note: "Art needs after reuse-reduction (Stage 6). ESSENTIAL first; OPTIONAL is skipped by policy.",
  generated_at: new Date().toISOString(),
  todo_art: scan.todo_art || [],
  emoji_placeholders: scan.emoji_placeholders || [],
  needs,
  summary: {
    essential: needs.filter((n) => n.class === "ESSENTIAL").length,
    supporting: needs.filter((n) => n.class === "SUPPORTING").length,
    optional_skipped: needs.filter((n) => n.class === "OPTIONAL").length,
    resolved_by_reuse: needs.filter((n) => n.resolution.strategy === "reuse").length,
    require_generation: needs.filter((n) => n.resolution.strategy === "generate_or_compose").length,
  },
};
writeFileSync(join(STATE, "art-needs.json"), JSON.stringify(doc, null, 1) + "\n");
console.log(JSON.stringify(doc.summary));
