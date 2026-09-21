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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const TASK_STATE = join(ROOT, "factory", "harness", "task-state.mjs");
// JC_TASKS_PATH mirrors task-state.mjs's own override so
// factory/harness/factory-self-test.mjs can exercise this gate against a
// scratch ledger instead of the real one. CI never sets it.
const TASKS_JSON = process.env.JC_TASKS_PATH
  ? resolve(process.env.JC_TASKS_PATH)
  : join(ROOT, "factory", "state", "tasks.json");

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
    // 2026-09-07 (found by this session's own first real CI run, 34066700565):
    // this fallback only checks the single last commit, not the whole
    // push -- a multi-commit push whose base doesn't resolve (e.g. a
    // shallow clone) can silently under-check earlier commits' app
    // changes. Loud on purpose so it's never a silent narrowing.
    console.warn(`WARNING: --base did not resolve; falling back to ${head}~1 = ${parent}. This checks ONLY the most recent commit, not the full push range. If this push landed multiple commits, earlier ones' src/public changes may not have been checked. Prefer fetch-depth: 0 in the checkout step so --base (github.event.before) always resolves.`);
    base = parent;
  } else {
    console.error(`FAIL: no usable --base and ${head}~1 does not resolve (shallow clone? first commit?) — cannot compute a diff, refusing to guess. Ensure the checkout step uses fetch-depth: 2 or more.`);
    process.exit(1);
  }
}

// 2026-09-21 (R4 — the fail-open this script still had): the previous rule
// accepted ANY task whose release_commit was an ANCESTOR of head. In a repo
// with a long history that is almost always satisfiable by some old released
// task, so a brand-new, ungated src/ commit rode in under a gate that had
// been passed for an unrelated commit months earlier. The rule is now
// per-commit: every commit in base..head that touches src/ or public/ must
// have its OWN task whose release_commit is EXACTLY that sha and which
// passes can-deploy.
//
// Workflow this implies (and it is a normal one): commit the app change
// (sha X) -> run the gate locally -> `set-release-commit <task> X` -> commit
// the ledger update. That second commit touches only factory/, so it needs
// no gate of its own, and X is covered by an exact match.
const revList = run("git", ["rev-list", "--reverse", `${base}..${head}`]);
if (revList.status !== 0) {
  console.error(`FAIL: git rev-list ${base}..${head} failed:\n${revList.stderr}`);
  process.exit(1);
}
const commits = revList.stdout.split("\n").filter(Boolean);

console.log(`release-gate-check: base=${base} head=${head}`);
console.log(`commits in range: ${commits.length}`);

// Which commits actually touch app code? (`git show --name-only` on a merge
// commit prints nothing by default; -m --first-parent makes merges report
// the files they bring in, so a merge cannot smuggle an unchecked change.)
const appCommits = [];
for (const c of commits) {
  const r = run("git", ["show", "--name-only", "--format=", "-m", "--first-parent", c]);
  if (r.status !== 0) {
    console.error(`FAIL: could not list files of ${c}:\n${r.stderr}`);
    process.exit(1);
  }
  const files = [...new Set(r.stdout.split("\n").filter(Boolean))];
  if (files.some((f) => f.startsWith("src/") || f.startsWith("public/"))) {
    appCommits.push({ sha: c, files: files.filter((f) => f.startsWith("src/") || f.startsWith("public/")) });
  }
}

if (appCommits.length === 0) {
  console.log("PASS: no commit in this range touches src/ or public/ — release gate does not apply (docs/factory-only change).");
  process.exit(0);
}

console.log(`${appCommits.length} commit(s) change src/ and/or public/ — each needs its own gated task record.`);
if (!existsSync(TASKS_JSON)) {
  console.error(`FAIL: ${TASKS_JSON} does not exist. An app-code change must be recorded against a task in the ledger (factory/harness/task-state.mjs create ...) before it can deploy.`);
  process.exit(1);
}

const tasks = JSON.parse(readFileSync(TASKS_JSON, "utf8")).tasks ?? {};
const uncovered = [];
const failedGate = [];
const checked = new Set();
for (const { sha, files } of appCommits) {
  const owners = Object.values(tasks).filter((t) => t.release_commit === sha);
  if (owners.length === 0) {
    uncovered.push({ sha, files });
    continue;
  }
  for (const t of owners) {
    if (checked.has(t.task_id)) continue;
    checked.add(t.task_id);
    const r = run("node", [TASK_STATE, "can-deploy", t.task_id]);
    console.log(`--- can-deploy ${t.task_id} (release_commit ${sha.slice(0, 8)}) ---`);
    console.log(r.stdout.trim());
    if (r.status !== 0) failedGate.push({ sha, task_id: t.task_id });
  }
}

if (uncovered.length > 0) {
  console.error(`FAIL: ${uncovered.length} commit(s) touch src/ or public/ with NO task in ${TASKS_JSON} whose release_commit is exactly that sha:`);
  for (const u of uncovered) {
    console.error(`  - ${u.sha}  (${u.files.slice(0, 5).join(", ")}${u.files.length > 5 ? `, +${u.files.length - 5} more` : ""})`);
  }
  console.error("Record each one: node factory/harness/task-state.mjs set-release-commit <task_id> <sha>, then commit the updated tasks.json (a factory-only commit, so it needs no gate itself).");
}
if (failedGate.length > 0) {
  console.error(`FAIL: ${failedGate.length} commit(s) have a task record that does NOT pass can-deploy:`);
  for (const f of failedGate) console.error(`  - ${f.sha} -> ${f.task_id}`);
}
if (uncovered.length > 0 || failedGate.length > 0) process.exit(1);

console.log(`PASS: all ${appCommits.length} app-touching commit(s) in ${base}..${head} are covered by a task that passes can-deploy.`);
process.exit(0);
