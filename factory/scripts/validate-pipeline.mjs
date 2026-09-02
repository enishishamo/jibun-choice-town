#!/usr/bin/env node
// Machine-checked pipeline completion (§16-H4): a world's pipeline.json can
// only claim completion if the ARTIFACTS actually exist and the binding review
// really says PASS with zero blockers/high. Self-attestation alone fails.
// Usage: node factory/scripts/validate-pipeline.mjs <world>
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

// artifacts per claimed-done phase
req(existsSync(P(`factory/projects/${world}/design.md`)), "design.md missing");
req(existsSync(P(`factory/projects/${world}/research.result.json`)) || existsSync(P(`factory/projects/${world}/research.md`)), "research artifact missing");
req(existsSync(P(`factory/harness/gameplay-qa-${world}.mjs`)), `gameplay-qa-${world}.mjs missing`);

// binding gate: find the recorded impl review evidence and RE-READ the verdict
const implCandidates = [
  P(`factory/state/${world}-impl-review-2.json`),
  P(`factory/state/${world}-impl-review-1.json`),
];
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
        return hay.includes(world) || hay.includes({ waste: "ごみ", zoo: "動物園" }[world] || "\u0000");
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
if (pipe.phases?.presentation_qa) {
  let anyPass = false, anyFail = false;
  if (existsSync(audits)) {
    for (const f of readdirSync(audits).filter((x) => x.endsWith(".json"))) {
      try {
        const d = JSON.parse(readFileSync(join(audits, f), "utf8"));
        if (f.startsWith(world) || f.startsWith("town-map")) {
          if (d.verdict === "PASS") anyPass = true; else anyFail = true;
        }
      } catch { /* skip */ }
    }
  }
  req(anyPass, "presentation_qa claimed but no PASS audit file found");
  req(!anyFail, "presentation_qa claimed but a FAIL audit file remains for this world");
}

// gameplay reference traceability (Game Reference Gate)
try {
  const refs = JSON.parse(readFileSync(P("factory/taxonomy/gameplay-references.json"), "utf8"));
  const pipeGames = Object.keys(refs.games || {});
  req(pipeGames.length > 0, "gameplay-references.json empty");
} catch { errs.push("gameplay-references.json unreadable"); }

if (errs.length) {
  console.log(JSON.stringify({ world, ok: false, errors: errs }, null, 1));
  process.exit(1);
}
console.log(JSON.stringify({ world, ok: true, binding_review: bindingWhere?.replace(ROOT + "/", "") }, null, 1));
