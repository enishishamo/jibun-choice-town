#!/usr/bin/env node
// Machine-checked pipeline completion (§16-H4): a world's pipeline.json can
// only claim completion if the ARTIFACTS actually exist and the binding review
// really says PASS with zero blockers/high. Self-attestation alone fails.
// Usage: node factory/scripts/validate-pipeline.mjs <world>
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const world = process.argv[2];
if (!world) { console.error("usage: validate-pipeline.mjs <world>"); process.exit(2); }
const P = (p) => join(ROOT, p);
const errs = [];
const req = (cond, msg) => { if (!cond) errs.push(msg); };

const pipePath = P(`factory/projects/${world}/pipeline.json`);
req(existsSync(pipePath), "pipeline.json missing");
const pipe = existsSync(pipePath) ? JSON.parse(readFileSync(pipePath, "utf8")) : { phases: {} };
// worlds may declare a short artifact alias (content module / QA suite / review
// file prefix) in pipeline.json: { "artifacts": { "alias": "port" } }
const alias = pipe.artifacts?.alias || world;

// every declared phase must be done (self-attested statuses are then cross-checked below)
for (const [ph, v] of Object.entries(pipe.phases || {})) {
  req(typeof v?.status === "string" && v.status.startsWith("done"), `phase ${ph} not done (${v?.status})`);
}

// artifacts per claimed-done phase
req(existsSync(P(`factory/projects/${world}/design.md`)), "design.md missing");
req(existsSync(P(`factory/projects/${world}/research.result.json`)) || existsSync(P(`factory/projects/${world}/research.md`)), "research artifact missing");
req(existsSync(P(`factory/harness/gameplay-qa-${alias}.mjs`)), `gameplay-qa-${alias}.mjs missing`);
if (existsSync(P(`factory/harness/gameplay-qa-${alias}.mjs`))) {
  // completion is not self-attested: the QA suite is EXECUTED here
  const qa = spawnSync("node", [P(`factory/harness/gameplay-qa-${alias}.mjs`)], { encoding: "utf8", timeout: 120000 });
  req(qa.status === 0, `gameplay QA suite FAILED when executed (exit ${qa.status})`);
}

// binding gate: find the recorded impl review evidence and RE-READ the verdict
// any iteration number counts — the LATEST PASS wins (reviews iterate)
const stateDir = P("factory/state");
const implCandidates = readdirSync(stateDir)
  .filter((f) => f.startsWith(`${alias}-impl-review-`) && f.endsWith(".json"))
  .sort((a, b) => Number(b.match(/-(\d+)\.json$/)?.[1] || 0) - Number(a.match(/-(\d+)\.json$/)?.[1] || 0))
  .map((f) => join(stateDir, f));
let bindingOk = false, bindingWhere = null;
for (const f of implCandidates) {
  if (!existsSync(f)) continue;
  try {
    const d = JSON.parse(readFileSync(f, "utf8"));
    const v = d.verdict && typeof d.verdict === "object" ? d.verdict : d;
    if (v.verdict === "PASS" && (v.blockers || []).length === 0 && (v.high || []).length === 0
        && typeof v.career_authenticity_score === "number" && typeof v.game_quality_score === "number"
        && v.career_authenticity_score >= 60 && v.game_quality_score >= 60) {
      bindingOk = true; bindingWhere = f; break;
    }
  } catch { /* unreadable = not evidence */ }
}
if (!bindingOk) {
  // fall back: search runs/ verdicts referenced by the adversarial_review phase
  const runsDir = P("factory/state/runs");
  if (existsSync(runsDir)) {
    // a run belongs to the world when its run record's task/artifact names it
    const runFiles = readdirSync(runsDir);
    const worldRuns = runFiles.filter((x) => x.endsWith(".json") && !x.includes("review")).filter((f) => {
      try {
        const d = JSON.parse(readFileSync(join(runsDir, f), "utf8"));
        const hay = `${d.task || ""} ${d.artifact || ""} ${JSON.stringify(d.files || "")}`;
        // attribution is path-anchored, not free-substring: the run must name this
        // world's logic module or content module
        return hay.includes(`src/q1/${alias}Logic`) || hay.includes(`content/${alias}`) || hay.includes(`${alias}Logic.ts`);
      } catch { return false; }
    }).map((f) => f.replace(/\.json$/, ""));
    outer: for (const runId of worldRuns) {
      for (const rf of runFiles.filter((x) => x.startsWith(runId + ".review-")).sort().reverse()) {
        try {
          const d = JSON.parse(readFileSync(join(runsDir, rf), "utf8"));
          const v = d.verdict && typeof d.verdict === "object" ? d.verdict : d;
          if (v.verdict === "PASS" && (v.blockers || []).length === 0 && (v.high || []).length === 0
              && typeof v.career_authenticity_score === "number" && typeof v.game_quality_score === "number"
              && v.career_authenticity_score >= 60 && v.game_quality_score >= 60) {
            bindingOk = true; bindingWhere = join("factory/state/runs", rf); break outer;
          }
        } catch { /* skip */ }
      }
    }
  }
}
req(bindingOk, "no machine-readable binding review PASS (blockers/high=0, both axes >= 60) found");

// presentation QA evidence (mandatory since the Asset Presentation Gate)
const audits = P("factory/state/art/presentation-audit");
req(Boolean(pipe.phases?.presentation_qa), "presentation_qa phase missing (Asset Presentation Gate is mandatory)");
{
  let anyPass = false, anyFail = false;
  if (existsSync(audits)) {
    for (const f of readdirSync(audits).filter((x) => x.endsWith(".json"))) {
      try {
        const d = JSON.parse(readFileSync(join(audits, f), "utf8"));
        if (f.startsWith(alias) || f.startsWith(world) || f.startsWith("town-map")) {
          if (d.verdict === "PASS") anyPass = true; else anyFail = true;
        }
      } catch { /* skip */ }
    }
  }
  req(anyPass, "presentation_qa claimed but no PASS audit file found");
  req(!anyFail, "presentation_qa claimed but a FAIL audit file remains for this world");
}

// gameplay reference traceability (Game Reference Gate) — WORLD-specific:
// every gameType this world's content module registers needs a non-empty entry
try {
  const refs = JSON.parse(readFileSync(P("factory/taxonomy/gameplay-references.json"), "utf8"));
  const content = readFileSync(P(`src/data/content/${alias}.ts`), "utf8");
  const gts = [...new Set([...content.matchAll(/gameType:\s*"([a-z_]+)"/g)].map((m) => m[1]))];
  req(gts.length > 0, `no gameTypes found in src/data/content/${alias}.ts`);
  for (const gt of gts) {
    const e = refs.games?.[gt];
    req(Boolean(e && Array.isArray(e.reference_games) && e.reference_games.length > 0 && e.trace), `gameplay reference missing/empty for ${gt}`);
  }
} catch (e) { errs.push(`gameplay-references check failed: ${e.message}`); }

if (errs.length) {
  console.log(JSON.stringify({ world, ok: false, errors: errs }, null, 1));
  process.exit(1);
}
console.log(JSON.stringify({ world, ok: true, binding_review: bindingWhere?.replace(ROOT + "/", "") }, null, 1));
