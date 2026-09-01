#!/usr/bin/env node
// Automated verification battery: build (tsc + vite), lint, factory data
// consistency. Results are appended to factory/state/runs/<run_id>.verify.jsonl
// when --run is given, and printed as a summary either way.
//
// Usage: node factory/harness/verify.mjs [--run <run_id>]

import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const runId = (() => {
  const i = process.argv.indexOf("--run");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const checks = [
  { name: "build", cmd: "npm", args: ["run", "build"] },
  { name: "lint", cmd: "npm", args: ["run", "lint"] },
  { name: "factory-data", cmd: "node", args: ["factory/scripts/validate-factory-data.mjs"] },
];

let failed = 0;
const results = [];
for (const c of checks) {
  const started = Date.now();
  const r = spawnSync(c.cmd, c.args, { cwd: ROOT, encoding: "utf8", timeout: 300000 });
  const ok = r.status === 0;
  if (!ok) failed++;
  const entry = {
    at: new Date().toISOString(),
    check: c.name,
    ok,
    elapsed_sec: (Date.now() - started) / 1000,
    tail: ok ? "" : ((r.stdout || "") + (r.stderr || "")).slice(-1200),
  };
  results.push(entry);
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}  (${entry.elapsed_sec.toFixed(1)}s)`);
  if (!ok) console.log(entry.tail);
}

if (runId) {
  const dir = join(HARNESS, "..", "state", "runs");
  mkdirSync(dir, { recursive: true });
  for (const e of results) appendFileSync(join(dir, `${runId}.verify.jsonl`), JSON.stringify(e) + "\n");
}
process.exit(failed ? 1 : 0);
