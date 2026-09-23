#!/usr/bin/env node
// Factory task state machine — 2026-09-07 (factory-architecture-audit-
// 2026-09-06.md §15/§16: "Auto Repair max 1" and "release gate" existed
// only as text a Claude session had to remember to obey). This is the
// minimal mechanical version: one JSON ledger (factory/state/tasks.json)
// + this CLI to read/mutate it. No framework, no database, no server —
// consistent with the rest of factory/harness/.
//
// States: READY | IN_PROGRESS | REVIEW | REPAIR | QA | READY_FOR_RELEASE
//       | RELEASED | READY_FOR_USER_TESTING | BLOCKED | DESIGN_BLOCKED
//       | HUMAN_DECISION_REQUIRED | SUPERSEDED
//
// 2026-09-21 mechanical-enforcement pass (R1-R7). What changed and why:
//   R1 DESIGN_NEEDED no longer stalls unrelated work: a design gap is an
//      ENTRY on the task (`design-needed --add`), which does NOT change its
//      status. Only an explicit `block --design-needed` parks a task in
//      DESIGN_BLOCKED, and DESIGN_BLOCKED is NOT generic BLOCKED for WIP
//      purposes (see `list --open`).
//   R2 A terminal status (RELEASED / READY_FOR_USER_TESTING) now runs the
//      SAME gate as can-deploy (deployBlockers) — previously set-status was
//      a free-text write and could skip every check. review_required now
//      defaults to TRUE, and QA evidence must be machine-checkable.
//   R3 Review independence is derived from the evidence file's own
//      provenance stamp (codex-review.mjs), never from a caller flag.
//   R7 Product Identity heuristic backstop on the task's own diff.
//
// Usage:
//   node factory/harness/task-state.mjs create <task_id> --type <type> [--identity-impact NONE|POSSIBLE|YES]
//        [--producer <name>] [--no-review-required --reason "..."]
//   node factory/harness/task-state.mjs status [<task_id>]
//   node factory/harness/task-state.mjs list [--status <STATUS>[,<STATUS>...]] [--open] [--markdown]
//   node factory/harness/task-state.mjs set-status <task_id> <STATUS> [--note "..."] [--skip-marker-scan]
//   node factory/harness/task-state.mjs request-repair <task_id>            # fails if repair_count already >= 1
//   node factory/harness/task-state.mjs reset-iteration <task_id> --reason "<human decision>"
//   node factory/harness/task-state.mjs set-review <task_id> <PASS|FAIL> --evidence <path> [--allow-legacy-evidence]
//   node factory/harness/task-state.mjs set-qa <task_id> <PASS|FAIL> (--evidence <path.json> | --evidence-note "...")
//   node factory/harness/task-state.mjs design-needed <task_id> --add <DN-id> --where <file:line> [--note "..."]
//   node factory/harness/task-state.mjs design-needed <task_id> --resolve <DN-id> [--approval <path>]
//   node factory/harness/task-state.mjs design-needed <task_id> --list
//   node factory/harness/task-state.mjs set-identity-impact <task_id> <NONE|POSSIBLE|YES>
//   node factory/harness/task-state.mjs approve-identity-impact <task_id> --note "<human approval text>"
//   node factory/harness/task-state.mjs block <task_id> --reason "..." [--human-decision | --design-needed]
//   node factory/harness/task-state.mjs set-upstream <task_id> --job <job_id> [--game-design <v>] [--design <v>]\n//   node factory/harness/task-state.mjs set-release-commit <task_id> <sha>
//   node factory/harness/task-state.mjs can-deploy <task_id>               # exit 0 = allowed, prints reason either way
//
// Env: JC_TASKS_PATH overrides the ledger path (used by
//      factory/harness/factory-self-test.mjs so a self-test can never write
//      to the real factory/state/tasks.json). JC_ROLE sets the default
//      --producer.
//
// Exit codes: 0 = success/allowed, 1 = refused/blocked (by design, not error), 2 = usage error.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateReviewEvidenceFile, validateQaEvidenceFile } from "./review-evidence.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
// JC_TASKS_PATH exists so the self-test can exercise every refusal path
// against a scratch ledger. Default = the real ledger.
const STATE_PATH = process.env.JC_TASKS_PATH
  ? resolvePath(process.env.JC_TASKS_PATH)
  : join(ROOT, "factory", "state", "tasks.json");

const STATUSES = [
  "READY", "IN_PROGRESS", "REVIEW", "REPAIR", "QA", "READY_FOR_RELEASE",
  "RELEASED", "READY_FOR_USER_TESTING", "BLOCKED", "DESIGN_BLOCKED",
  "HUMAN_DECISION_REQUIRED", "SUPERSEDED",
];
// Terminal = the work is finished or abandoned; it no longer occupies a WIP
// slot and `list --open` does not return it. Everything else (including
// BLOCKED and DESIGN_BLOCKED) is still open work.
const TERMINAL_STATUSES = ["RELEASED", "READY_FOR_USER_TESTING", "SUPERSEDED"];
// Statuses that mean "this shipped / is in front of a user" — reaching one
// must pass the full release gate (R2b).
const GATED_STATUSES = ["RELEASED", "READY_FOR_USER_TESTING"];
// Statuses that in themselves forbid deploying. DESIGN_BLOCKED is here
// because the missing thing is an approved design (never auto-decidable),
// but it is deliberately NOT treated as generic BLOCKED anywhere else.
const DEPLOY_BLOCKING_STATUSES = ["BLOCKED", "HUMAN_DECISION_REQUIRED", "DESIGN_BLOCKED"];
const IDENTITY_IMPACTS = ["NONE", "POSSIBLE", "YES"];

// ---------------------------------------------------------------------------
// R1d — placeholder markers that must never reach a child's screen.
// docs/jibun-choice-v2/DESIGN_OWNERSHIP.md:57 ("technical placeholder → mark
// TEMP_IMPLEMENTATION_ONLY, never PUBLIC") and OPEN_DECISIONS T-08.
// ---------------------------------------------------------------------------
const PLACEHOLDER_MARKERS = ["TEMP_IMPLEMENTATION_ONLY", "DESIGN_NEEDED"];

// ---------------------------------------------------------------------------
// R7 — Product Identity heuristic backstop (factory/rules/product-identity-
// gate.md §1). ONE list, deliberately broad and in exactly one place: a false
// positive costs one explicit `set-identity-impact` call, a false negative
// ships a mascot/economy/collection change with no Human Decision. Matched
// case-insensitively against the paths the task's own diff touches.
// ---------------------------------------------------------------------------
const IDENTITY_DOMAIN_PATTERNS = [
  { domain: "mascot/companion character", re: /(^|\/)(companion|mascot|aibou|character|char)[-_./]/i },
  { domain: "items / collection / growth system", re: /(^|\/)(collection|collections|items?|inventory|album|seeds?|interest-?seeds?)[-_./]/i },
  { domain: "reward / points / currency / streak", re: /(^|[^a-z])(reward|rewards|points?|coins?|currency|streak|badges?|xp|level-?up)([^a-z]|$)/i },
  { domain: "Home / nav architecture", re: /(^|\/)(home|top|nav|navbar|navigation|router|routes?|tabbar)[-_./]/i },
];

function loadState() {
  if (!existsSync(STATE_PATH)) return { tasks: {} };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}
function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}
function now() {
  return new Date().toISOString();
}
function fail(msg) {
  console.error(msg);
  process.exit(2);
}
function log(taskRec, event, detail) {
  taskRec.history ??= [];
  taskRec.history.push({ at: now(), event, ...detail });
}
function git(gitArgs) {
  return spawnSync("git", gitArgs, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

const args = process.argv.slice(2);
function flag(name, dflt = undefined) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const [cmd, ...rest] = args;
const state = loadState();

function getTask(id, { mustExist = true } = {}) {
  const t = state.tasks[id];
  if (!t && mustExist) fail(`no such task: ${id} (run 'create' first, or check ${STATE_PATH})`);
  return t;
}

// ---------------------------------------------------------------------------
// Placeholder-marker scan (R1d)
//
// HEURISTIC, documented on purpose: a marker in a COMMENT is how the Design
// Ownership rule asks engineers to annotate a gap — blocking on that would
// punish following the rule. A marker inside a STRING LITERAL is a value the
// program carries at runtime, i.e. something that can be rendered. So the
// scanner walks the file tracking quote/comment state and reports only
// markers found inside string literals (any of ' " `). For .css/.html there
// are no string literals in the same sense, so anything left after stripping
// /* */ and <!-- --> counts.
//
// Known limitation (accepted): bare JSX/HTML *text* (e.g. <p>DESIGN_NEEDED</p>)
// is not a string literal and is not caught. In this codebase every
// user-visible string goes through a copy.ts module as a string literal
// (src/v2/lunch/copy.ts), which this does catch.
// ---------------------------------------------------------------------------
const JS_LIKE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const MARKUP_LIKE = /\.(css|html)$/;

function markersInJsLike(text) {
  const hits = [];
  let i = 0;
  let line = 1;
  let quote = null;
  let buf = "";
  let bufLine = 1;
  let inBlockComment = false;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === "\n") line++;
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i += 2; continue; }
      i++; continue;
    }
    if (quote) {
      if (ch === "\\") { buf += text.slice(i, i + 2); i += 2; continue; }
      if (ch === quote) {
        for (const m of PLACEHOLDER_MARKERS) {
          if (buf.includes(m)) hits.push({ marker: m, line: bufLine, snippet: buf.trim().slice(0, 90) });
        }
        quote = null; buf = ""; i++; continue;
      }
      buf += ch; i++; continue;
    }
    if (ch === "/" && next === "/") { while (i < text.length && text[i] !== "\n") i++; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i += 2; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; buf = ""; bufLine = line; i++; continue; }
    i++;
  }
  return hits;
}

function markersInMarkup(text) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  const hits = [];
  stripped.split("\n").forEach((l, idx) => {
    for (const m of PLACEHOLDER_MARKERS) {
      if (l.includes(m)) hits.push({ marker: m, line: idx + 1, snippet: l.trim().slice(0, 90) });
    }
  });
  return hits;
}

function scanTextForMarkers(path, text) {
  if (JS_LIKE.test(path)) return markersInJsLike(text);
  if (MARKUP_LIKE.test(path)) return markersInMarkup(text);
  return []; // .md / .json / binary assets are documentation or data, not rendered code
}

/** Files the task's own change touches. Used by the marker scan AND by the
 *  Product Identity heuristic so both look at exactly the same diff. */
function changedFilesFor(task) {
  if (task.release_commit) {
    let r = git(["diff", "--name-only", `${task.release_commit}^`, task.release_commit]);
    if (r.status !== 0) {
      // root commit (no parent): everything it introduces is "changed"
      r = git(["show", "--name-only", "--format=", task.release_commit]);
    }
    if (r.status !== 0) return { error: `could not diff ${task.release_commit}: ${(r.stderr || "").trim()}`, files: [] };
    return { files: r.stdout.split("\n").filter(Boolean), from: "release_commit" };
  }
  // No release commit yet: the honest stand-in is the working tree vs HEAD.
  const r = git(["diff", "--name-only", "HEAD"]);
  if (r.status !== 0) return { error: `could not diff working tree: ${(r.stderr || "").trim()}`, files: [] };
  return { files: r.stdout.split("\n").filter(Boolean), from: "working_tree" };
}

function readFileAtTask(task, path) {
  if (task.release_commit) {
    const r = git(["show", `${task.release_commit}:${path}`]);
    return r.status === 0 ? r.stdout : null; // deleted/renamed away → nothing to scan
  }
  const abs = join(ROOT, path);
  return existsSync(abs) ? readFileSync(abs, "utf8") : null;
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** @returns {string[]} human-readable blockers, empty = clean */
function placeholderMarkerBlockers(task) {
  const reasons = [];
  if (task.release_commit) {
    const { files, error } = changedFilesFor(task);
    if (error) return [`placeholder-marker scan could not run (${error}) — refusing rather than assuming clean`];
    const appFiles = files.filter((f) => f.startsWith("src/") || f.startsWith("public/"));
    for (const f of appFiles) {
      const text = readFileAtTask(task, f);
      if (text === null) continue;
      for (const h of scanTextForMarkers(f, text)) {
        reasons.push(`${f}:${h.line} still carries the placeholder marker ${h.marker} in a string literal (can reach the DOM): "${h.snippet}" — DESIGN_OWNERSHIP.md:57 forbids shipping a TEMP/placeholder to PUBLIC`);
      }
    }
  } else {
    // No release_commit recorded yet: scan the Ver.2 working tree, which is
    // the code such a task would ship.
    for (const abs of walkFiles(join(ROOT, "src", "v2"))) {
      const rel = abs.slice(ROOT.length + 1);
      if (!JS_LIKE.test(rel) && !MARKUP_LIKE.test(rel)) continue;
      for (const h of scanTextForMarkers(rel, readFileSync(abs, "utf8"))) {
        reasons.push(`${rel}:${h.line} still carries the placeholder marker ${h.marker} in a string literal (can reach the DOM): "${h.snippet}" — DESIGN_OWNERSHIP.md:57 forbids shipping a TEMP/placeholder to PUBLIC`);
      }
    }
  }
  // Collapse noise: a long list of identical findings helps nobody.
  if (reasons.length > 8) {
    const extra = reasons.length - 8;
    return [...reasons.slice(0, 8), `...and ${extra} more placeholder-marker hit(s) — fix them or record the design approval before releasing`];
  }
  return reasons;
}

/** R7 — identity-domain paths touched while product_identity_impact=NONE. */
function identityHeuristicBlockers(task) {
  if (task.product_identity_impact !== "NONE") return []; // already classified; §1 handles it
  const { files, error } = changedFilesFor(task);
  if (error) return []; // the marker scan already refuses loudly on a broken diff
  const hits = [];
  for (const f of files) {
    if (!f.startsWith("src/") && !f.startsWith("public/")) continue;
    for (const { domain, re } of IDENTITY_DOMAIN_PATTERNS) {
      if (re.test(f)) { hits.push(`${f} (${domain})`); break; }
    }
  }
  if (hits.length === 0) return [];
  return [`product_identity_impact=NONE but this task's diff touches Product Identity domain path(s): ${hits.slice(0, 6).join(", ")}${hits.length > 6 ? ` (+${hits.length - 6} more)` : ""}. factory/rules/product-identity-gate.md §1 requires an explicit classification — run 'set-identity-impact ${task.task_id} POSSIBLE|YES' (and approve-identity-impact) or, if this really is not an identity change, re-run 'set-identity-impact ${task.task_id} NONE' after moving the change out of those paths.`];
}

// ---------------------------------------------------------------------------
// THE canonical release gate (R2a). can-deploy AND set-status both call this,
// so there is exactly one encoding of "may this reach a user".
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 2026-09-23 — upstream design provenance (game-production-pipeline.md §29).
// A build task may record WHICH game design version it was built from. If it
// does, the release gate re-reads that pipeline and refuses when the build is
// standing on an artifact that has since been superseded or invalidated.
// Recording nothing is allowed (most tasks are not game builds); recording a
// version and then drifting from it is not.
// ---------------------------------------------------------------------------
function upstreamDesignBlockers(task) {
  const up = task.upstream;
  if (!up || !up.job_id) return [];
  // JC_PIPELINE_ROOT mirrors JC_TASKS_PATH: the self-test points both at a
  // scratch tree so this refusal can be exercised for real.
  const pipeRoot = process.env.JC_PIPELINE_ROOT ? resolvePath(process.env.JC_PIPELINE_ROOT) : ROOT;
  const file = join(pipeRoot, "factory", "projects", up.job_id, "q1-pipeline.json");
  if (!existsSync(file)) return [`upstream.job_id=${up.job_id} but no pipeline ledger at ${file}`];
  let p;
  try { p = JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { return [`upstream pipeline ${up.job_id} is unreadable: ${e.message}`]; }
  const reasons = [];
  for (const [field, type, label] of [
    ["game_design_version", "final_game_design", "FINAL_GAME_DESIGN"],
    ["design_version", "design_package", "DESIGN_PACKAGE"],
  ]) {
    const want = up[field];
    if (want === undefined || want === null) continue;
    const a = p.artifacts?.[type];
    if (!a) { reasons.push(`upstream ${label} v${want} is recorded on this task but ${up.job_id} has no ${type} artifact`); continue; }
    if (a.status === "STALE") reasons.push(`upstream ${label} is STALE (${a.stale_because ?? "an upstream artifact changed"}) — this build is standing on a superseded design`);
    if (a.version !== want) reasons.push(`this build records ${label} v${want} but ${up.job_id} is now at v${a.version} — stale build, re-derive or re-record`);
  }
  return reasons;
}

function deployBlockers(task, opts = {}) {
  const reasons = [];
  if (DEPLOY_BLOCKING_STATUSES.includes(task.status)) {
    reasons.push(`task status is ${task.status} (blocked_reason: ${task.blocked_reason ?? "none recorded"})`);
  }
  if (task.product_identity_impact !== "NONE" && !task.identity_impact_approved) {
    reasons.push(`product_identity_impact=${task.product_identity_impact} requires an explicit approve-identity-impact record, which is missing — QA passing alone can never clear this`);
  }
  if (task.qa_status !== "PASS") {
    reasons.push(`qa_status is ${JSON.stringify(task.qa_status)}, must be PASS`);
  } else if (task.qa_evidence_kind !== "file") {
    // R2d: a free-text note is a human memo, not evidence a check ran.
    reasons.push(`qa_status=PASS but qa_evidence_kind is ${JSON.stringify(task.qa_evidence_kind ?? null)} — a PASS must be backed by a machine-checkable QA evidence file (set-qa <id> PASS --evidence <path.json>); a --evidence-note is never sufficient for release`);
  }
  if (task.review_required) {
    if (task.review_status !== "PASS") {
      reasons.push(`review_required=true but review_status is ${JSON.stringify(task.review_status)}, must be PASS with valid canonical evidence (see set-review)`);
    }
    if (task.review_independent !== true) {
      reasons.push(`review_required=true but review_independent is ${JSON.stringify(task.review_independent ?? null)} — the recorded evidence does not prove an INDEPENDENT review (it must come from factory/harness/codex-review.mjs and its reviewer must differ from the producer ${JSON.stringify(task.producer ?? null)})`);
    }
  }
  const unresolvedDn = (task.design_needed ?? []).filter((d) => !d.resolved_at);
  if (unresolvedDn.length > 0) {
    reasons.push(`${unresolvedDn.length} unresolved design_needed entr(ies): ${unresolvedDn.map((d) => `${d.id}@${d.where}`).join(", ")} — an approved design is a Human/Design-Owner decision, so it can never be cleared by QA`);
  }
  reasons.push(...upstreamDesignBlockers(task));
  // The placeholder-marker scan is the only check that can be skipped, and
  // only for unit-testing this script (the skip is logged by the caller).
  if (!opts.skipMarkerScan) reasons.push(...placeholderMarkerBlockers(task));
  reasons.push(...identityHeuristicBlockers(task));
  return reasons;
}

switch (cmd) {
  case "create": {
    const id = rest[0];
    if (!id) fail('usage: create <task_id> --type <type> [--identity-impact NONE|POSSIBLE|YES] [--producer <name>] [--no-review-required --reason "..."]');
    if (state.tasks[id]) fail(`task ${id} already exists — use set-status/reset-iteration instead of re-creating`);
    const type = flag("type", "unspecified");
    const identityImpact = flag("identity-impact", "NONE");
    if (!IDENTITY_IMPACTS.includes(identityImpact)) fail(`bad --identity-impact: ${identityImpact}`);
    // R2c: independent review is the DEFAULT. Opting out is a decision that
    // must be stated and is kept in the record forever.
    let reviewRequired = true;
    let noReviewReason = null;
    if (hasFlag("no-review-required")) {
      noReviewReason = flag("reason");
      if (!noReviewReason) fail('refused: --no-review-required requires --reason "<why this task needs no independent review>"');
      reviewRequired = false;
    }
    // R3a: who is producing this task — the counterpart the reviewer must differ from.
    const producer = flag("producer", process.env.JC_ROLE || "claude-code");
    const rec = {
      task_id: id,
      task_type: type,
      status: "READY",
      producer,
      repair_count: 0,
      review_status: null,
      review_evidence: null,
      review_required: reviewRequired,
      review_required_waiver_reason: noReviewReason,
      reviewer: null,
      review_independent: null,
      qa_status: null,
      qa_evidence: null,
      qa_evidence_kind: null,
      design_needed: [],
      deploy_status: null,
      release_commit: null,
      blocked_reason: null,
      human_decision_required: false,
      product_identity_impact: identityImpact,
      identity_impact_approved: false,
      identity_impact_approval_note: null,
      created_at: now(),
      updated_at: now(),
      history: [],
    };
    log(rec, "created", { type, identityImpact, producer, review_required: reviewRequired, no_review_reason: noReviewReason });
    state.tasks[id] = rec;
    saveState(state);
    console.log(JSON.stringify(rec, null, 2));
    break;
  }

  case "status": {
    const id = rest[0];
    if (id) {
      console.log(JSON.stringify(getTask(id), null, 2));
    } else {
      console.log(JSON.stringify(state.tasks, null, 2));
    }
    break;
  }

  case "list": {
    const wantStatus = flag("status");
    const wanted = wantStatus ? wantStatus.split(",").map((s) => s.trim()).filter(Boolean) : null;
    if (wanted) for (const s of wanted) if (!STATUSES.includes(s)) fail(`bad --status: ${s}. Must be one of ${STATUSES.join(", ")}`);
    const openOnly = hasFlag("open");
    const out = Object.values(state.tasks).filter((t) => {
      if (wanted && !wanted.includes(t.status)) return false;
      // R1c: --open = any NON-TERMINAL status, which includes DESIGN_BLOCKED.
      // A design gap is open work waiting on the Design Owner, not a dead task.
      if (openOnly && TERMINAL_STATUSES.includes(t.status)) return false;
      return true;
    });
    if (hasFlag("markdown")) {
      const cmdLine = `node factory/harness/task-state.mjs list${wantStatus ? ` --status ${wantStatus}` : ""}${openOnly ? " --open" : ""} --markdown`;
      const lines = [];
      lines.push("<!-- GENERATED FILE — DO NOT EDIT BY HAND. -->");
      lines.push(`<!-- Regenerate with: ${cmdLine} > factory/state/blocked-queue.md -->`);
      lines.push("");
      lines.push("# Blocked Queue（自動生成）");
      lines.push("");
      lines.push("このファイルは `factory/state/tasks.json`（唯一の task 台帳）から機械的に");
      lines.push("生成される。手で編集しても次の生成で消える。内容を変えたいときは台帳側を");
      lines.push("変える（`block` / `set-status` / `reset-iteration`）。");
      lines.push("");
      lines.push("```");
      lines.push(cmdLine + " > factory/state/blocked-queue.md");
      lines.push("```");
      lines.push("");
      lines.push(`生成時刻: ${now()} / 対象 ${out.length} 件`);
      lines.push("");
      lines.push("`BLOCKED` / `HUMAN_DECISION_REQUIRED` は Human Decision が下りるまで");
      lines.push("Continuous Product Loop から自動で再着手しない。`DESIGN_BLOCKED` は");
      lines.push("**Design Owner（GPT）の設計待ち**であって generic BLOCKED ではない —");
      lines.push("同じ task の他の作業や、他 task の進行を止める理由にはならない");
      lines.push("（`factory/rules/autonomous-execution.md` WIP LIMIT / R1）。");
      lines.push("");
      lines.push("| id | status | type | 理由 | 未解決 DESIGN_NEEDED | 更新 |");
      lines.push("|---|---|---|---|---|---|");
      for (const t of out.sort((a, b) => (a.status + a.task_id).localeCompare(b.status + b.task_id))) {
        const dn = (t.design_needed ?? []).filter((d) => !d.resolved_at).map((d) => d.id).join(", ") || "-";
        const reason = (t.blocked_reason ?? "-").replace(/\|/g, "\\|").replace(/\n/g, " ");
        lines.push(`| ${t.task_id} | ${t.status} | ${t.task_type} | ${reason} | ${dn} | ${(t.updated_at ?? "").slice(0, 10)} |`);
      }
      lines.push("");
      console.log(lines.join("\n"));
    } else {
      console.log(JSON.stringify(out, null, 2));
    }
    break;
  }

  case "set-status": {
    const [id, status] = rest;
    if (!id || !status) fail("usage: set-status <task_id> <STATUS>");
    if (!STATUSES.includes(status)) fail(`bad status: ${status}. Must be one of ${STATUSES.join(", ")}`);
    const t = getTask(id);
    // R2b: a terminal/shipped status is a release. It runs the same gate
    // can-deploy runs — previously this command could write "RELEASED" over
    // a failed review with no check at all.
    if (GATED_STATUSES.includes(status)) {
      const skipMarkerScan = hasFlag("skip-marker-scan");
      if (skipMarkerScan) log(t, "marker_scan_skipped", { command: "set-status", target: status });
      const reasons = deployBlockers(t, { skipMarkerScan });
      if (reasons.length > 0) {
        log(t, "status_change_refused", { from: t.status, to: status, reasons });
        saveState(state);
        console.log(JSON.stringify({ accepted: false, task_id: id, to: status, reasons }, null, 2));
        process.exit(1);
      }
    }
    const from = t.status;
    t.status = status;
    t.updated_at = now();
    log(t, "status_change", { from, to: status, note: flag("note") ?? null });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // The mechanical heart of "Auto Repair max 1" (audit §16#... / autonomous-execution.md).
  case "request-repair": {
    const id = rest[0];
    if (!id) fail("usage: request-repair <task_id>");
    const t = getTask(id);
    if (t.repair_count >= 1) {
      log(t, "repair_refused", { repair_count: t.repair_count });
      saveState(state);
      console.log(JSON.stringify({ allowed: false, reason: `repair_count is already ${t.repair_count} — AUTO REPAIR RULE caps automatic repair at 1 attempt per task. Use 'reset-iteration --reason' if a Human Decision authorizes a new iteration, or move to BLOCKED/HUMAN_DECISION_REQUIRED.`, task: t }, null, 2));
      process.exit(1);
    }
    t.repair_count += 1;
    t.status = "REPAIR";
    t.updated_at = now();
    log(t, "repair_granted", { repair_count: t.repair_count });
    saveState(state);
    console.log(JSON.stringify({ allowed: true, repair_count: t.repair_count, task: t }, null, 2));
    break;
  }

  case "reset-iteration": {
    const id = rest[0];
    const reason = flag("reason");
    if (!id || !reason) fail('usage: reset-iteration <task_id> --reason "<human decision text>"');
    const t = getTask(id);
    const priorCount = t.repair_count;
    t.repair_count = 0;
    t.status = "READY";
    t.updated_at = now();
    log(t, "iteration_reset", { reason, prior_repair_count: priorCount });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // The mechanical heart of "Mandatory Independent Review" (audit §16#6):
  // evidence MUST validate as codex-review.mjs-shaped AND carry that script's
  // own provenance stamp — a codex-task.mjs (or hand-written) result cannot
  // satisfy this.
  case "set-review": {
    const [id, verdict] = rest;
    if (!id || !["PASS", "FAIL"].includes(verdict)) fail("usage: set-review <task_id> <PASS|FAIL> --evidence <path> [--allow-legacy-evidence]");
    const evidencePath = flag("evidence");
    if (!evidencePath) fail("--evidence <path-to-codex-review.mjs-result.json> is required");
    const allowLegacy = hasFlag("allow-legacy-evidence");
    const check = validateReviewEvidenceFile(evidencePath, { allowLegacy });
    if (!check.ok) {
      console.log(JSON.stringify({ accepted: false, reason: check.reason }, null, 2));
      process.exit(1);
    }
    // 2026-09-07 (Human Decision — Q1 Game Quality Standard V1 §6: "GQ
    // score等は比較・優先順位付けの参考値。単一総合点だけでReleaseを決め
    // ない。Primary Quality GateとBLOCKER条件を優先する"): a reviewer FAIL
    // driven only by non-empty `high` (never `blockers` — that stays an
    // absolute, non-overridable requirement) may be recorded as PASS
    // ONLY with an explicit --override-note explaining why, per
    // factory/rules/q1-first-play-standard.md, none of the remaining
    // `high` items correspond to that file's §3 BLOCKER list. This is
    // NOT silently reinterpreting the evidence — the raw file (still
    // genuinely codex-review.mjs-shaped, still fully validated above) and
    // the override note are BOTH preserved in history, so the ledger
    // stays honest about what the reviewer actually said.
    const overrideNote = flag("override-note");
    let effectiveVerdict = check.verdict;
    let overridden = false;
    if (verdict === "PASS" && check.verdict === "FAIL") {
      if (check.blockers.length > 0) fail(`refused: evidence has ${check.blockers.length} blocker(s) — blockers can never be overridden to PASS, regardless of --override-note`);
      if (check.high.length === 0) fail(`unexpected: verdict is FAIL but blockers=[] and high=[] — this should not be reachable; investigate the evidence file`);
      if (!overrideNote) fail(`evidence verdict is FAIL (${check.high.length} HIGH, 0 blockers) — to record this as PASS under the Q1 First-Play Standard, pass --override-note "<why none of these HIGH items are on the standard's BLOCKER list>"`);
      effectiveVerdict = "PASS";
      overridden = true;
    } else if (check.verdict !== verdict) {
      console.log(JSON.stringify({ accepted: false, reason: `--evidence file's own verdict.verdict is "${check.verdict}", which does not match the claimed "${verdict}"` }, null, 2));
      process.exit(1);
    }
    const t = getTask(id);
    // R3b: independence is DERIVED, never claimed. The reviewer identity and
    // the mechanism both come out of the evidence file itself.
    const producer = t.producer ?? null;
    const reviewer = check.reviewer ?? null;
    if (reviewer && producer && reviewer === producer) {
      log(t, "review_refused_not_independent", { reviewer, producer, evidencePath });
      saveState(state);
      console.log(JSON.stringify({
        accepted: false,
        reason: `refused: the evidence's reviewer (${reviewer}) is the same identity as this task's producer (${producer}). A producer can never review its own work (factory/rules/ai-routing.md / audit §16#6). Have a different reviewer run factory/harness/codex-review.mjs.`,
      }, null, 2));
      process.exit(1);
    }
    const independent = Boolean(reviewer && producer && reviewer !== producer && check.review_mechanism);
    t.review_status = effectiveVerdict;
    t.review_evidence = evidencePath;
    t.reviewer = reviewer;
    t.review_independent = independent;
    t.review_mechanism = check.review_mechanism ?? null;
    t.updated_at = now();
    log(t, overridden ? "review_recorded_with_override" : "review_recorded", {
      verdict: effectiveVerdict, raw_reviewer_verdict: check.verdict, evidencePath, score: check.score,
      high_count: check.high.length, override_note: overrideNote ?? null,
      reviewer, producer, review_independent: independent,
      review_mechanism: check.review_mechanism ?? null, prompt_sha256: check.prompt_sha256 ?? null,
      legacy_evidence_allowed: allowLegacy && check.legacy ? true : undefined,
    });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "set-qa": {
    const [id, verdict] = rest;
    if (!id || !["PASS", "FAIL"].includes(verdict)) fail('usage: set-qa <task_id> <PASS|FAIL> (--evidence <path.json> | --evidence-note "...")');
    const t = getTask(id);
    const evidencePath = flag("evidence");
    const evidenceNote = flag("evidence-note");
    if (!evidencePath && !evidenceNote) {
      fail('refused: set-qa requires evidence — either --evidence <path-to-qa-evidence.json> (machine-checkable: {ran_at, commit, checks:[{script, exit_code, summary}]}) or, for a human-only observation, --evidence-note "...". A note is recorded but can NEVER satisfy can-deploy for a PASS.');
    }
    if (evidencePath && evidenceNote) fail("refused: pass either --evidence or --evidence-note, not both");
    // R2d: a PASS is a claim that checks RAN. A free-text note is a human
    // observation, not a record of a run, so it can never carry a PASS —
    // refused here, and (defence in depth, for ledger rows written before
    // this rule) refused again by deployBlockers via qa_evidence_kind.
    if (verdict === "PASS" && evidenceNote) {
      log(t, "qa_refused", { verdict, reason: "note-only evidence for a PASS", note: evidenceNote });
      saveState(state);
      console.log(JSON.stringify({
        accepted: false,
        reason: 'refused: a QA PASS needs a machine-checkable evidence file (--evidence <path.json> with {ran_at, commit, checks:[{script, exit_code, summary}]}, every exit_code 0). --evidence-note is a human note and can only accompany a FAIL or an informational record — it can never be the basis of a PASS.',
      }, null, 2));
      process.exit(1);
    }
    let kind;
    if (evidencePath) {
      const check = validateQaEvidenceFile(evidencePath, { requirePass: verdict === "PASS" });
      if (!check.ok) {
        console.log(JSON.stringify({ accepted: false, reason: check.reason }, null, 2));
        process.exit(1);
      }
      kind = "file";
      t.qa_evidence = evidencePath;
      log(t, "qa_recorded", { verdict, evidence: evidencePath, kind, checks: check.checks, all_zero: check.all_zero, commit: check.commit });
    } else {
      kind = "note";
      t.qa_evidence = evidenceNote;
      log(t, "qa_recorded", { verdict, evidence: evidenceNote, kind, note: "free-text note — not release-gate evidence" });
    }
    t.qa_status = verdict;
    t.qa_evidence_kind = kind;
    t.updated_at = now();
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // R1 — a design gap is DATA on the task, not a status. Adding one never
  // changes the status, so the rest of the task (and every other task) keeps
  // moving; it only blocks DEPLOY, which is where a missing approved design
  // actually matters.
  case "design-needed": {
    const id = rest[0];
    if (!id) fail('usage: design-needed <task_id> (--add <DN-id> --where <file:line> [--note "..."] | --resolve <DN-id> [--approval <path>] | --list)');
    const t = getTask(id);
    t.design_needed ??= [];
    const addId = flag("add");
    const resolveId = flag("resolve");
    if (addId && resolveId) fail("refused: pass either --add or --resolve, not both");
    if (!addId && !resolveId) {
      // --list (also the default when neither is given)
      console.log(JSON.stringify({
        task_id: id,
        status: t.status,
        note: "adding a DESIGN_NEEDED entry deliberately does NOT change task status — only 'block --design-needed' does",
        design_needed: t.design_needed,
        unresolved: t.design_needed.filter((d) => !d.resolved_at).length,
      }, null, 2));
      break;
    }
    if (addId) {
      const where = flag("where");
      if (!where) fail('usage: design-needed <task_id> --add <DN-id> --where <file:line> [--note "..."]');
      if (t.design_needed.some((d) => d.id === addId && !d.resolved_at)) {
        fail(`refused: ${addId} is already recorded and unresolved on ${id}`);
      }
      const entry = { id: addId, where, note: flag("note") ?? null, added_at: now(), resolved_at: null, approval: null };
      t.design_needed.push(entry);
      t.updated_at = now();
      // NOTE: status is intentionally untouched here (R1b).
      log(t, "design_needed_added", { ...entry, status_unchanged: t.status });
      saveState(state);
      console.log(JSON.stringify({ added: entry, task_status: t.status, unresolved: t.design_needed.filter((d) => !d.resolved_at).length, task: t }, null, 2));
      break;
    }
    const entry = t.design_needed.find((d) => d.id === resolveId && !d.resolved_at);
    if (!entry) fail(`refused: no unresolved design_needed entry ${resolveId} on ${id}`);
    entry.resolved_at = now();
    entry.approval = flag("approval") ?? null;
    t.updated_at = now();
    log(t, "design_needed_resolved", { id: resolveId, approval: entry.approval });
    saveState(state);
    console.log(JSON.stringify({ resolved: entry, unresolved: t.design_needed.filter((d) => !d.resolved_at).length, task: t }, null, 2));
    break;
  }

  case "set-identity-impact": {
    const [id, impact] = rest;
    if (!id || !IDENTITY_IMPACTS.includes(impact)) fail(`usage: set-identity-impact <task_id> <${IDENTITY_IMPACTS.join("|")}>`);
    const t = getTask(id);
    t.product_identity_impact = impact;
    // changing the impact classification invalidates any prior approval —
    // never let a stale approval silently cover a newly-escalated impact.
    t.identity_impact_approved = false;
    t.identity_impact_approval_note = null;
    t.updated_at = now();
    log(t, "identity_impact_set", { impact });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "approve-identity-impact": {
    const id = rest[0];
    const note = flag("note");
    if (!id || !note) fail('usage: approve-identity-impact <task_id> --note "<human approval text>"');
    const t = getTask(id);
    if (t.product_identity_impact === "NONE") fail(`task ${id} has product_identity_impact=NONE — nothing to approve`);
    t.identity_impact_approved = true;
    t.identity_impact_approval_note = note;
    t.updated_at = now();
    log(t, "identity_impact_approved", { note });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "block": {
    const id = rest[0];
    const reason = flag("reason");
    if (!id || !reason) fail('usage: block <task_id> --reason "..." [--human-decision | --design-needed]');
    const t = getTask(id);
    if (hasFlag("human-decision") && hasFlag("design-needed")) fail("refused: pass either --human-decision or --design-needed, not both");
    // R1b: DESIGN_BLOCKED is the ONLY way a design gap becomes a status, and
    // it takes an explicit human/agent decision to park the task here.
    t.status = hasFlag("human-decision") ? "HUMAN_DECISION_REQUIRED" : hasFlag("design-needed") ? "DESIGN_BLOCKED" : "BLOCKED";
    t.blocked_reason = reason;
    t.human_decision_required = hasFlag("human-decision");
    t.updated_at = now();
    log(t, "blocked", { reason, human_decision: hasFlag("human-decision"), design_needed: hasFlag("design-needed"), status: t.status });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  case "set-upstream": {
    const [id] = rest;
    if (!id) fail('usage: set-upstream <task_id> --job <job_id> [--game-design <version>] [--design <version>]');
    const t = getTask(id);
    const jobId = flag("job");
    if (!jobId) fail("set-upstream requires --job <job_id>");
    const num = (name) => { const v = flag(name); if (v === undefined) return undefined; const n = Number(v); if (!Number.isInteger(n) || n < 1) fail(`--${name} must be a positive integer version`); return n; };
    t.upstream = {
      job_id: jobId,
      game_design_version: num("game-design") ?? t.upstream?.game_design_version ?? null,
      design_version: num("design") ?? t.upstream?.design_version ?? null,
      recorded_at: now(),
    };
    t.updated_at = now();
    log(t, "upstream_recorded", t.upstream);
    saveState(state);
    console.log(JSON.stringify({ task_id: id, upstream: t.upstream, blockers_now: upstreamDesignBlockers(t) }, null, 2));
    break;
  }

  case "set-release-commit": {
    const [id, shaArg] = rest;
    if (!id || !shaArg) fail("usage: set-release-commit <task_id> <sha>");
    // 2026-09-07 self-test finding: a short sha ("59f43a1") stored as-is
    // never string-matches the full 40-char sha release-gate-check.mjs
    // reads from `git rev-parse HEAD` in CI — always normalize to the
    // full sha at write time so the two sides can never silently drift.
    const resolved = spawnSync("git", ["rev-parse", shaArg], { cwd: ROOT, encoding: "utf8" });
    if (resolved.status !== 0) fail(`could not resolve ${shaArg} as a git commit: ${resolved.stderr}`);
    const sha = resolved.stdout.trim();
    const t = getTask(id);
    t.release_commit = sha;
    t.updated_at = now();
    log(t, "release_commit_set", { sha, given: shaArg });
    saveState(state);
    console.log(JSON.stringify(t, null, 2));
    break;
  }

  // THE canonical release gate. Both a Claude session and CI
  // (factory/scripts/release-gate-check.mjs) call this same logic so
  // there is exactly one place the rule is encoded.
  case "can-deploy": {
    const id = rest[0];
    if (!id) fail("usage: can-deploy <task_id>");
    const t = getTask(id);
    // --skip-marker-scan exists ONLY so factory-self-test.mjs can unit-test
    // the other blockers in isolation. Its use is written into the task
    // history so a release that used it is never indistinguishable from one
    // that did not.
    const skipMarkerScan = hasFlag("skip-marker-scan");
    if (skipMarkerScan) {
      log(t, "marker_scan_skipped", { command: "can-deploy" });
      saveState(state);
    }
    const reasons = deployBlockers(t, { skipMarkerScan });
    const allowed = reasons.length === 0;
    console.log(JSON.stringify({ allowed, task_id: id, reasons: allowed ? [] : reasons, marker_scan_skipped: skipMarkerScan || undefined, task: t }, null, 2));
    process.exit(allowed ? 0 : 1);
  }

  default:
    console.error("commands: create | status | list | set-status | request-repair | reset-iteration | set-review | set-qa | design-needed | set-identity-impact | approve-identity-impact | block | set-upstream | set-release-commit | can-deploy");
    process.exit(2);
}
