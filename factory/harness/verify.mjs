#!/usr/bin/env node
// Automated verification battery: build (tsc + vite), lint, Ver.1 freeze
// guard, factory data consistency. Results are appended to
// factory/state/runs/<run_id>.verify.jsonl when --run is given, and printed
// as a summary either way.
//
// Usage:
//   node factory/harness/verify.mjs [--run <run_id>]
//   node factory/harness/verify.mjs --suites '<glob>' [--run <run_id>]
//
// --suites turns this into a QA-suite runner instead of the build battery
// (this is what `npm run qa:all` calls). The glob is matched against file
// NAMES in factory/harness/ — only `*` is supported, which is all the
// pattern needs to be: `npm run qa:all` runs 'gameplay-qa-*.mjs'. Each
// matching script is run as `node factory/harness/<name>` and must exit 0.
// It lives here rather than in a new script because there was already
// exactly one place that means "run the checks and tell me pass/fail", and
// the audit's whole point was to stop growing second homes for one rule.
//
// Exit code: 0 = everything passed, 1 = at least one check failed.

import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const argv = process.argv.slice(2);
const argOf = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const runId = argOf("--run");
const suiteGlob = argOf("--suites");

function globToRegExp(glob) {
  return new RegExp("^" + glob.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
}

let checks;
if (suiteGlob) {
  const re = globToRegExp(suiteGlob);
  const names = readdirSync(HARNESS).filter((f) => re.test(f) && f.endsWith(".mjs")).sort();
  if (names.length === 0) {
    console.error(`FAIL: --suites '${suiteGlob}' matched no file in factory/harness/ — refusing to report PASS for zero checks.`);
    process.exit(1);
  }
  console.log(`running ${names.length} suite(s) matching '${suiteGlob}'`);
  checks = names.map((n) => ({ name: n.replace(/\.mjs$/, ""), cmd: "node", args: [join("factory", "harness", n)] }));
} else {
  checks = [
    { name: "build", cmd: "npm", args: ["run", "build"] },
    { name: "lint", cmd: "npm", args: ["run", "lint"] },
    // 2026-09-21 (R5a): the Ver.1 freeze guard existed (npm run
    // check:ver1-freeze) but nothing unattended ran it, so "Ver.1 is
    // frozen" depended on a session remembering. It is a check like any
    // other now — here and in .github/workflows/deploy.yml.
    { name: "ver1-freeze", cmd: "npm", args: ["run", "check:ver1-freeze"] },
    { name: "factory-data", cmd: "node", args: ["factory/scripts/validate-factory-data.mjs"] },
  ];
}

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
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
