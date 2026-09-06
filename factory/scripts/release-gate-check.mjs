#!/usr/bin/env node
// CI-side release gate — 2026-09-07 (factory-architecture-audit-2026-09-06.md
// §16#1/#6: CI ran build+deploy only, with zero QA/review/identity check
// before publishing to real users). This script runs as a step in
// .github/workflows/deploy.yml BEFORE the build/deploy jobs: it fails the
// workflow (so nothing deploys) unless every commit touching `src/` or
// `public/` in this push is covered by a task in factory/state/tasks.json
// that passes the SAME can-deploy gate a local Claude session would have
// to pass (factory/harness/task-state.mjs can-deploy). It does not run
// Codex or a browser (neither is available in the CI runner) — it trusts
// evidence already committed alongside the code, the same way any other
// code-review gate trusts a diff that was already written.
//
// Usage: node factory/scripts/release-gate-check.mjs --base <sha> --head <sha>
//   --base/--head default to HEAD~1/HEAD if omitted or unresolvable
//   (a missing/zero base, e.g. first-ever push or a squash, is NOT treated
//   as "skip the gate" — see NO_BASE handling below; fail-closed by design).

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const TASK_STATE = join(ROOT, "factory", "harness", "task-state.mjs");
const TASKS_JSON = join(ROOT, "factory", "state", "tasks.json");

const args = process.argv.slice(2);
function flag(name, dflt) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}

function run(cmd, cmdArgs) {
  return spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8" });
}

function resolvesToCommit(sha) {
  if (!sha || /^0+$/.test(sha)) return false; // GitHub's "before" is all-zeros on a branch's first push
  const r = run("git", ["cat-file", "-e", `${sha}^{commit}`]);
  return r.status === 0;
}

const headArg = flag("head", "HEAD");
const head = run("git", ["rev-parse", headArg]).stdout.trim();
if (!head) {
  console.error(`FAIL: could not resolve --head ${headArg}`);
  process.exit(1);
}

let base = flag("base");
if (!resolvesToCommit(base)) {
  // Fall back to the immediate parent. If THAT doesn't resolve either
  // (shallow clone with fetch-depth:1, or this is the repo's first
  // commit), we cannot compute a diff -- fail closed rather than assume
  // "no app changes".
  const parent = run("git", ["rev-parse", `${head}~1`]).stdout.trim();
  if (resolvesToCommit(parent)) {
    base = parent;
  } else {
    console.error(`FAIL: no usable --base and ${head}~1 does not resolve (shallow clone? first commit?) — cannot compute a diff, refusing to guess. Ensure the checkout step uses fetch-depth: 2 or more.`);
    process.exit(1);
  }
}

const diff = run("git", ["diff", "--name-only", base, head]);
if (diff.status !== 0) {
  console.error(`FAIL: git diff --name-only ${base} ${head} failed:\n${diff.stderr}`);
  process.exit(1);
}
const changedFiles = diff.stdout.split("\n").filter(Boolean);
const appChanged = changedFiles.some((f) => f.startsWith("src/") || f.startsWith("public/"));

console.log(`release-gate-check: base=${base} head=${head}`);
console.log(`changed files: ${changedFiles.length}`);
if (!appChanged) {
  console.log("PASS: no changes under src/ or public/ in this push — release gate does not apply (docs/factory-only change).");
  process.exit(0);
}

console.log("This push changes src/ and/or public/ — a gated task record is required.");
if (!existsSync(TASKS_JSON)) {
  console.error(`FAIL: ${TASKS_JSON} does not exist. An app-code change must be recorded against a task in the ledger (factory/harness/task-state.mjs create ...) before it can deploy.`);
  process.exit(1);
}

const tasks = JSON.parse(readFileSync(TASKS_JSON, "utf8")).tasks ?? {};
// A task's release_commit cannot literally equal the commit that RECORDS
// it (the sha isn't known until after that commit is made — recording it
// requires a follow-up commit, e.g. "set release_commit" bookkeeping).
// So this accepts release_commit == head OR release_commit being an
// ANCESTOR of head — i.e. the gated commit is somewhere in what's being
// pushed, not necessarily the exact tip. Still fail-closed: an
// unreferenced app change anywhere in the range is refused.
function isAncestorOrSelf(candidate, of) {
  if (candidate === of) return true;
  if (!resolvesToCommit(candidate)) return false;
  return run("git", ["merge-base", "--is-ancestor", candidate, of]).status === 0;
}
const matches = Object.values(tasks).filter((t) => t.release_commit && isAncestorOrSelf(t.release_commit, head));
if (matches.length === 0) {
  console.error(`FAIL: no task in ${TASKS_JSON} has a release_commit that is ${head} or an ancestor of it. Record the release (factory/harness/task-state.mjs set-release-commit <task_id> <sha>) after the gate passes locally, and commit the updated tasks.json in the SAME push.`);
  process.exit(1);
}

let allOk = true;
for (const t of matches) {
  const r = run("node", [TASK_STATE, "can-deploy", t.task_id]);
  console.log(`--- can-deploy ${t.task_id} ---`);
  console.log(r.stdout.trim());
  if (r.status !== 0) allOk = false;
}

if (!allOk) {
  console.error("FAIL: at least one task referencing this commit does not pass can-deploy. Blocking deploy.");
  process.exit(1);
}
console.log(`PASS: ${matches.length} task(s) referencing ${head} all pass can-deploy.`);
process.exit(0);
