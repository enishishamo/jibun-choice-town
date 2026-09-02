#!/usr/bin/env node
// /game-lab orchestrator (Stage 5). NOT a framework designed up front — this is
// the working Stage 1-4 pipeline (research delegation, batch audits, review
// loops) extracted into one entry point. Codex does bulk reading/review
// (token-saving routing); Claude does design, synthesis and repairs in-session.
//
// Usage:
//   node factory/harness/game-lab.mjs research "<Title (one-line angle)>" [...more titles]
//       Delegate structure-decomposition research for the given games to Codex,
//       then MERGE the result into factory/lab/research/games.json yourself
//       (curation is a Claude/human step by design).
//   node factory/harness/game-lab.mjs audit-all [--wave-size 4]
//       Re-audit every registered Q1 with critic v2 (batches of 5 -> waves),
//       merge results, regenerate audit-summary.md.
//   node factory/harness/game-lab.mjs improve <gameType>
//       Scaffold an improvement project (audit excerpt + proposal/review
//       templates + loop run) for one game. Design/implementation then follow
//       the documented workflow (see printed next steps).
//   node factory/harness/game-lab.mjs status
//       Stage status + recent runs.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: "inherit", ...opts });
const runCap = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });

const RESEARCH_HEADER = `You are a game researcher for JIBUN CHOICE, an educational career-experience web game for Japanese elementary-school children. We study famous existing games to extract REUSABLE MECHANICS (not to copy titles). Work from your own knowledge of these well-documented games; be factually careful and mark anything uncertain as "uncertain: <why>".

For EACH game listed below, produce one JSON object with fields: title, genre, target_player, goal, core_action, information, constraints[], decisions[], feedback, failure, retry_motivation, mastery, variation, progression, reward, reusable_mechanics[] (snake_case, title-independent), core_loop_statement, mastery_statement, replay_statement, kid_translation_note.

Your ENTIRE final message must be a single JSON array of these objects, no prose, no code fences.

Games:
`;

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case "research": {
    if (!rest.length) {
      console.error("usage: game-lab research \"Title (angle)\" [...]");
      process.exit(2);
    }
    const dir = join(ROOT, "factory", "lab", "research");
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const promptFile = join(dir, `request-${stamp}.prompt.txt`);
    writeFileSync(promptFile, RESEARCH_HEADER + rest.map((t, i) => `${i + 1}. ${t}`).join("\n"));
    const out = join(dir, `request-${stamp}.result.json`);
    const r = run("node", [join(HARNESS, "codex-task.mjs"), "--prompt-file", promptFile, "--timeout-sec", "900", "--expect-json", "--label", "game-lab-research", "--out", out]);
    if (r.status === 0) {
      console.log(`\nresult: ${out}`);
      console.log("NEXT (Claude/human curation step): verify entries, then merge into games.json,");
      console.log("re-run the mechanics normalization against mechanics-library.json, and update evidence_games.");
    }
    process.exit(r.status ?? 1);
  }

  case "audit-all": {
    const wi = rest.indexOf("--wave-size");
    const waveSize = wi >= 0 ? Number(rest[wi + 1]) : 4;
    const plan = runCap("node", [join(HARNESS, "audit-q1.mjs"), "plan"]);
    const batches = plan.stdout.trim().split("\n").length;
    console.log(plan.stdout.trim());
    for (let start = 0; start < batches; start += waveSize) {
      const wave = [];
      for (let n = start; n < Math.min(start + waveSize, batches); n++) wave.push(n);
      console.log(`\n--- wave: batches ${wave.join(", ")}`);
      const procs = wave.map((n) => {
        runCap("node", [join(HARNESS, "audit-q1.mjs"), "prompt", String(n)]);
        return { n };
      });
      // run the wave sequentially-in-parallel via shell &/wait to keep this script dependency-free
      const script = wave
        .map((n) => `node ${join(HARNESS, "codex-task.mjs")} --prompt-file factory/state/audits/batch-${n}.prompt.md --timeout-sec 900 --expect-json --label audit-batch-${n} --out factory/state/audits/batch-${n}.result.json &`)
        .join("\n") + "\nwait";
      run("bash", ["-c", script]);
      void procs;
    }
    run("node", [join(HARNESS, "audit-q1.mjs"), "merge"]);
    run("node", [join(HARNESS, "summarize-audit.mjs")]);
    break;
  }

  case "improve": {
    const gameType = rest[0];
    if (!gameType) {
      console.error("usage: game-lab improve <gameType>");
      process.exit(2);
    }
    const auditFile = join(ROOT, "factory", "state", "audits", "q1-audit.json");
    const audit = existsSync(auditFile) ? JSON.parse(readFileSync(auditFile, "utf8")).games.find((g) => g.gameType === gameType) : null;
    const dir = join(ROOT, "factory", "projects", `q1-improve-${gameType.replace(/_/g, "-")}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "audit-excerpt.json"), JSON.stringify(audit || { note: "no audit found — run audit-all first" }, null, 1));
    if (!existsSync(join(dir, "redesign-proposals.md"))) {
      writeFileSync(
        join(dir, "redesign-proposals.md"),
        `# ${gameType} 再設計 — 提案書\n\n## 1. Job reality 再確認\n（一次情報で職業の実務を書く）\n\n## 2. Job-specific difficulties\n（factory/lab/job-difficulty-taxonomy.md の id で 2〜4 個）\n\n## 3. Mechanic 候補\n（factory/taxonomy/job-mechanics-map.json から。mechanic先行は禁止）\n\n## 4. 設計案（2〜4案）\n\n## 5. 比較・選択（Claude 評価）\n\n## 6. 最終決定（Claude synthesis × Codex 独立審査）\n（proposal-review-prompt を codex-task で流し、突き合わせて決める）\n`,
      );
    }
    const tpl = readFileSync(join(ROOT, "factory", "projects", "q1-improve-xray", "final-review-prompt.md"), "utf8");
    writeFileSync(join(dir, "final-review-prompt.md"), tpl.replace(/XrayGame/g, gameType).replace(/src\/q1\/XrayGame\.tsx/g, `src/q1/<Component>.tsx  # FIXME set component path`));
    const start = runCap("node", [join(HARNESS, "loop.mjs"), "start", "--task", `improve ${gameType}`, "--artifact", `src/q1/${gameType}`, "--max-iterations", "3"]);
    const runId = start.stdout.trim();
    console.log(`project: ${dir}`);
    console.log(`loop run: ${runId}`);
    console.log(`WORKFLOW: 1) fill redesign-proposals.md (job reality -> difficulties -> mechanics -> 2-4 proposals)`);
    console.log(`          2) codex-task the proposal review, synthesize, implement (extract pure logic for QA)`);
    console.log(`          3) write a gameplay-qa script; verify.mjs; loop produce-done/review with final-review-prompt.md`);
    console.log(`          4) update taxonomy/component-reviews.json (new hash) + update-factory-db.mjs`);
    break;
  }

  case "status": {
    run("node", [join(HARNESS, "stage-manager.mjs"), "status"]);
    const runsDir = join(ROOT, "factory", "state", "runs");
    const runs = readdirSync(runsDir).filter((f) => f.endsWith(".json") && !f.includes("review") && !f.includes("verify"));
    console.log(`\nruns: ${runs.length} (factory/state/runs/)`);
    for (const f of runs.slice(-5)) {
      const r = JSON.parse(readFileSync(join(runsDir, f), "utf8"));
      console.log(`  ${r.run_id}  ${r.phase}  ${r.verdict ?? "-"}  ${r.stop_reason ?? ""}  ${r.task.slice(0, 60)}`);
    }
    break;
  }

  default:
    console.error("commands: research | audit-all | improve <gameType> | status");
    process.exit(2);
}
