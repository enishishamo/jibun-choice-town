#!/usr/bin/env node
// Q1 Autonomous Game Factory — per-game pipeline ledger + gates.
// 2026-09-08 (Human master request). One JSON record per game at
// factory/projects/<game_id>/q1-pipeline.json plus a small index at
// factory/state/q1-pipeline-index.json. Same style as task-state.mjs:
// no framework, exit 0 = allowed, 1 = refused (by design), 2 = usage.
//
// Rules live in q1-factory-schema.mjs; this file only applies them.
//
// Usage:
//   init <game_id> --profession "<name>" [--trigger <TRIGGER>] [--legacy-game-type <gameType>] [--entry-stage <STAGE>] [--creator <id>]
//   submit <game_id> <artifact_type> --file <path.json> [--creator <id>] [--source <artifact_type>@<version> ...]
//   status <game_id> | list [--state <STATE>] | stale <game_id>
//   review <game_id> --evidence <codex-review-result.json> --input <prompt-file> [--reviewer codex-review] [--creator <id>] [--kind design|implementation]
//   fail <game_id> --code <FAILURE_CODE> --reason "..." --evidence <path> [--return-to <STAGE>] [--must-change "..."] [--preserve "..."]
//   repair-done <game_id> --note "..."           # local repair finished; back to UNDER_REVIEW
//   redesign <game_id> --seed <seed_id> | --translation <translation_id> --reason "..."
//   gate <game_id>                               # GAME_DESIGN_READY mechanical gate (exit 0/1)
//   human-decision <game_id> --domain <domain> --note "..."   # opens a Human Decision (blocks autonomy)
//   resolve-human-decision <game_id> --id <hd_id> --note "<human text>"
//   escalate <game_id> --reason "..."
//   art-review <game_id> --evidence <codex-review-result.json|art-qa.json> --reviewer <id> --producer <id> [--pass|--fail --code <FAILURE_CODE>]
//   link-task <game_id> <task_id>                # task-state.mjs task that carries release
//   release-ready <game_id>                      # end-to-end release gate (exit 0/1)
//   mark-reaudit <game_id> --reason "..." --trigger <TRIGGER>
//   set-version <game_id> <version>              # released version tag/sha for real-user evidence

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateReviewEvidenceFile } from "./review-evidence.mjs";
import {
  DESIGN_STAGES, DOWNSTREAM_STAGES, ALL_STAGE_IDS, DESIGN_STATES, STATE_AFTER_ARTIFACT,
  REPAIR_MAX_PER_ITERATION, REDESIGN_MAX, FAILURE_ROUTES, FAILURE_CODES, HUMAN_DECISION_DOMAINS,
  TRIGGERS, ARTIFACT_SCHEMAS, ARTIFACT_TYPES, transitiveDownstream, validateArtifact,
  gameDesignReadyReasons, CLASSIFICATION_ENTRY_STAGE,
} from "./q1-factory-schema.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HARNESS, "..", "..");
const INDEX_PATH = join(ROOT, "factory", "state", "q1-pipeline-index.json");
const TASK_STATE = join(HARNESS, "task-state.mjs");

const args = process.argv.slice(2);
function flag(name, dflt = undefined) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
}
function flags(name) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === `--${name}` && args[i + 1] !== undefined) out.push(args[i + 1]);
  return out;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}
function fail(msg) {
  console.error(msg);
  process.exit(2);
}
function refuse(obj) {
  console.log(JSON.stringify(obj, null, 2));
  process.exit(1);
}
function now() {
  return new Date().toISOString();
}

export function pipelinePath(gameId) {
  return join(ROOT, "factory", "projects", gameId, "q1-pipeline.json");
}
function loadIndex() {
  if (!existsSync(INDEX_PATH)) return { pipelines: {} };
  return JSON.parse(readFileSync(INDEX_PATH, "utf8"));
}
function saveIndex(idx) {
  mkdirSync(dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + "\n");
}
export function loadPipeline(gameId, { mustExist = true } = {}) {
  const p = pipelinePath(gameId);
  if (!existsSync(p)) {
    if (mustExist) fail(`no pipeline for ${gameId} (run 'init' first; expected ${p})`);
    return null;
  }
  return JSON.parse(readFileSync(p, "utf8"));
}
function savePipeline(p) {
  p.updated_at = now();
  const file = pipelinePath(p.game_id);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(p, null, 2) + "\n");
  const idx = loadIndex();
  idx.pipelines[p.game_id] = {
    game_id: p.game_id, profession: p.profession, state: p.state, trigger: p.trigger,
    legacy_game_type: p.legacy_game_type ?? null, task_id: p.task_id ?? null,
    repair_count: p.repair_count, redesign_count: p.redesign_count, updated_at: p.updated_at,
    depends_on: p.depends_on ?? [],
  };
  saveIndex(idx);
}
function log(p, event, detail = {}) {
  p.history ??= [];
  p.history.push({ at: now(), event, ...detail });
}
function setState(p, state, note) {
  if (!DESIGN_STATES.includes(state)) fail(`internal: bad state ${state}`);
  const from = p.state;
  p.state = state;
  log(p, "state_change", { from, to: state, note: note ?? null });
}
function stageOfArtifact(type) {
  return ARTIFACT_SCHEMAS[type]?.stage ?? null;
}
function isFrozen(p) {
  return ["ESCALATED"].includes(p.state) || (p.human_decisions ?? []).some((h) => h.status === "open");
}

const [cmd, ...rest] = args;

switch (cmd) {
  case "init": {
    const gameId = rest[0];
    const profession = flag("profession");
    if (!gameId || !profession) fail('usage: init <game_id> --profession "<name>" [--trigger <TRIGGER>] [--legacy-game-type <gameType>] [--entry-stage <STAGE>] [--creator <id>]');
    if (existsSync(pipelinePath(gameId))) fail(`pipeline ${gameId} already exists (${pipelinePath(gameId)})`);
    const trigger = flag("trigger", "NEW_Q1_REQUEST");
    if (!TRIGGERS.includes(trigger)) fail(`bad --trigger ${trigger}; one of ${TRIGGERS.join(", ")}`);
    const entryStage = flag("entry-stage", "PROFESSION_RESEARCH");
    if (!ALL_STAGE_IDS.includes(entryStage)) fail(`bad --entry-stage ${entryStage}`);
    const p = {
      game_id: gameId,
      profession,
      trigger,
      legacy_game_type: flag("legacy-game-type") ?? null,
      creator: flag("creator", "claude-code"),
      state: "RESEARCHING",
      current_stage: entryStage,
      design_iteration: 1,
      repair_count: 0,
      redesign_count: 0,
      artifacts: {},          // type -> { version, status: CURRENT|STALE, file, payload, creator, source_artifacts, created_at, history:[versions] }
      independent_review: null, // { verdict, evidence, input, reviewer, creator, independent, iteration, stale }
      impl_review: null,
      art_review: null,
      failures: [],           // structured failures
      human_decisions: [],
      task_id: null,
      version: null,
      depends_on: [],         // shared dependencies (UI components, shared art) for reaudit routing
      created_at: now(),
      updated_at: now(),
      history: [],
    };
    log(p, "init", { trigger, entry_stage: entryStage, legacy_game_type: p.legacy_game_type });
    savePipeline(p);
    console.log(JSON.stringify(p, null, 2));
    break;
  }

  case "status": {
    const p = loadPipeline(rest[0] ?? fail("usage: status <game_id>"));
    const summary = {
      game_id: p.game_id, profession: p.profession, state: p.state, current_stage: p.current_stage,
      design_iteration: p.design_iteration, repair_count: p.repair_count, redesign_count: p.redesign_count,
      artifacts: Object.fromEntries(Object.entries(p.artifacts).map(([k, a]) => [k, { version: a.version, status: a.status, file: a.file }])),
      independent_review: p.independent_review ? { verdict: p.independent_review.verdict, independent: p.independent_review.independent, stale: p.independent_review.stale, iteration: p.independent_review.iteration } : null,
      art_review: p.art_review ? { verdict: p.art_review.verdict, independent: p.art_review.independent } : null,
      impl_review: p.impl_review ? { verdict: p.impl_review.verdict, independent: p.impl_review.independent, stale: p.impl_review.stale } : null,
      open_human_decisions: (p.human_decisions ?? []).filter((h) => h.status === "open").map((h) => h.id),
      failures: p.failures.length,
      task_id: p.task_id, version: p.version,
      game_design_ready_missing: gameDesignReadyReasons(p).map((r) => r.id),
    };
    console.log(JSON.stringify(hasFlag("full") ? p : summary, null, 2));
    break;
  }

  case "list": {
    const idx = loadIndex();
    const want = flag("state");
    console.log(JSON.stringify(Object.values(idx.pipelines).filter((x) => !want || x.state === want), null, 2));
    break;
  }

  case "stale": {
    const p = loadPipeline(rest[0] ?? fail("usage: stale <game_id>"));
    const stale = Object.entries(p.artifacts).filter(([, a]) => a.status === "STALE").map(([k, a]) => ({ type: k, version: a.version, stale_because: a.stale_because }));
    console.log(JSON.stringify({ game_id: p.game_id, stale, review_stale: p.independent_review?.stale ?? false }, null, 2));
    break;
  }

  // ---------------------------------------------------------------- submit
  case "submit": {
    const [gameId, type] = rest;
    const file = flag("file");
    if (!gameId || !type || !file) fail("usage: submit <game_id> <artifact_type> --file <path.json> [--creator <id>] [--source <type>@<version>]...");
    if (!ARTIFACT_TYPES.includes(type)) fail(`bad artifact_type ${type}; one of ${ARTIFACT_TYPES.join(", ")}`);
    const p = loadPipeline(gameId);
    if (isFrozen(p)) refuse({ accepted: false, reason: `pipeline is ${p.state} with open human decisions=${(p.human_decisions ?? []).filter((h) => h.status === "open").length} — resolve before submitting artifacts` });
    let payload;
    try { payload = JSON.parse(readFileSync(file, "utf8")); } catch (e) { fail(`could not read/parse ${file}: ${e.message}`); }
    const v = validateArtifact(type, payload);
    if (!v.ok) refuse({ accepted: false, artifact_type: type, problems: v.problems });
    // Human Decision domain declared inside an artifact => open a decision and refuse autonomous progress.
    const declared = payload.human_decision_domains ?? [];
    const badDomains = declared.filter((d) => !HUMAN_DECISION_DOMAINS.includes(d));
    if (badDomains.length) fail(`unknown human_decision_domains: ${badDomains.join(",")}; known: ${HUMAN_DECISION_DOMAINS.join(",")}`);
    // provenance
    const sources = flags("source").map((s) => {
      const [t, ver] = s.split("@");
      return { artifact_type: t, version: Number(ver) };
    });
    for (const s of sources) {
      const src = p.artifacts[s.artifact_type];
      if (!src) refuse({ accepted: false, reason: `--source ${s.artifact_type}@${s.version} does not exist on this pipeline` });
      if (src.version !== s.version) refuse({ accepted: false, reason: `--source ${s.artifact_type}@${s.version} is not the current version (current is v${src.version}) — refusing to build on a stale upstream` });
      if (src.status === "STALE") refuse({ accepted: false, reason: `--source ${s.artifact_type} is STALE (${src.stale_because}) — re-submit it first` });
    }
    const prev = p.artifacts[type];
    const version = prev ? prev.version + 1 : 1;
    const rec = {
      artifact_id: `${gameId}:${type}:v${version}`,
      artifact_type: type,
      version,
      status: "CURRENT",
      stale_because: null,
      file,
      payload,
      creator: flag("creator", p.creator),
      source_artifacts: sources.map((s) => `${gameId}:${s.artifact_type}:v${s.version}`),
      design_iteration: p.design_iteration,
      created_at: now(),
      versions: [...(prev?.versions ?? []), { version, file, created_at: now(), creator: flag("creator", p.creator) }],
    };
    p.artifacts[type] = rec;
    // staleness: a new version of an upstream artifact invalidates everything downstream of it
    const invalidated = [];
    if (prev) {
      for (const d of transitiveDownstream(type)) {
        if (p.artifacts[d] && p.artifacts[d].status !== "STALE") {
          p.artifacts[d].status = "STALE";
          p.artifacts[d].stale_because = `${type} changed v${prev.version}->v${version}`;
          invalidated.push(d);
        }
      }
      // the DESIGN review is staled only by a new version of a DESIGN-stage artifact; downstream artifacts
      // (game_spec, art, implementation) are produced AFTER the GAME_DESIGN_READY gate by design and must
      // not invalidate it (2026-09-09: leak-detective release-ready was wrongly refused after game_spec v1->v2)
      if (p.independent_review && !p.independent_review.stale && DESIGN_STAGES.some((s) => s.artifact === type)) {
        p.independent_review.stale = true;
        p.independent_review.stale_because = `${type} changed v${prev.version}->v${version}`;
        invalidated.push("independent_review");
      }
      if (p.impl_review && !p.impl_review.stale && ["game_spec", "implementation", "game_translations", "art_production"].includes(type)) {
        p.impl_review.stale = true;
        invalidated.push("impl_review");
      }
    }
    if (declared.length) {
      const hd = { id: `hd-${p.human_decisions.length + 1}`, domains: declared, opened_by_artifact: rec.artifact_id, note: payload.human_decision_note ?? null, status: "open", opened_at: now() };
      p.human_decisions.push(hd);
      log(p, "human_decision_opened", { id: hd.id, domains: declared });
    }
    p.current_stage = stageOfArtifact(type);
    if (!["RETURNED", "REPAIRING", "REDESIGNING", "ESCALATED"].includes(p.state) || true) {
      // artifact submission always reflects real progress; a returned pipeline
      // that re-submits the returned stage's artifact is back on track.
      const next = STATE_AFTER_ARTIFACT[type];
      if (p.state === "REPAIRING" || p.state === "REDESIGNING" || p.state === "RETURNED") {
        // stay in the repair/redesign state until repair-done/gate; just record progress
      } else if (next && p.state !== "GAME_DESIGN_READY" || (next && DOWNSTREAM_STAGES.some((s) => s.artifact === type))) {
        setState(p, next, `artifact ${type} v${version}`);
      }
    }
    log(p, "artifact_submitted", { artifact_id: rec.artifact_id, invalidated, sources: rec.source_artifacts });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, artifact_id: rec.artifact_id, version, invalidated, state: p.state, open_human_decisions: p.human_decisions.filter((h) => h.status === "open").map((h) => h.id) }, null, 2));
    break;
  }

  // ---------------------------------------------------------------- review
  case "review": {
    const gameId = rest[0];
    const evidence = flag("evidence");
    const input = flag("input");
    if (!gameId || !evidence || !input) fail("usage: review <game_id> --evidence <codex-review-result.json> --input <prompt-file> [--reviewer codex-review] [--creator <id>] [--kind design|implementation]");
    const p = loadPipeline(gameId);
    const kind = flag("kind", "design");
    const reviewer = flag("reviewer", "codex-review");
    const creator = flag("creator", p.creator);
    const check = validateReviewEvidenceFile(evidence);
    if (!check.ok) refuse({ accepted: false, reason: `evidence is not canonical independent-review evidence: ${check.reason}` });
    if (!existsSync(input)) refuse({ accepted: false, reason: `--input ${input} does not exist (the review input must be preserved as evidence)` });
    const independent = reviewer !== creator && reviewer === "codex-review";
    const rec = {
      kind, verdict: check.verdict, score: check.score, blockers: check.blockers.length, high: check.high.length,
      evidence, input, reviewer, creator, independent, review_mechanism: reviewer === "codex-review" ? "factory/harness/codex-review.mjs" : reviewer,
      iteration: p.design_iteration, repair_count_at_review: p.repair_count, stale: false, recorded_at: now(),
    };
    if (kind === "implementation") p.impl_review = rec; else p.independent_review = rec;
    log(p, "independent_review_recorded", { kind, verdict: rec.verdict, independent, evidence });
    if (!independent) {
      log(p, "review_not_independent", { reviewer, creator });
    }
    if (rec.verdict === "PASS" && independent) {
      if (kind === "design") setState(p, "UNDER_REVIEW", "design review PASS — run gate");
    } else if (rec.verdict === "HUMAN_REQUIRED") {
      const hd = { id: `hd-${p.human_decisions.length + 1}`, domains: [], opened_by_review: evidence, note: "reviewer returned HUMAN_REQUIRED", status: "open", opened_at: now() };
      p.human_decisions.push(hd);
      log(p, "human_decision_opened", { id: hd.id, source: "review" });
    }
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, review: rec, next: rec.verdict === "PASS" ? (kind === "design" ? "gate" : "release-ready") : "fail --code <FAILURE_CODE> (route the failure)" }, null, 2));
    break;
  }

  // ----------------------------------------------------------------- fail
  // Structured failure -> routing -> repair/redesign budget.
  case "fail": {
    const gameId = rest[0];
    const code = flag("code");
    const reason = flag("reason");
    const evidence = flag("evidence");
    if (!gameId || !code || !reason || !evidence) fail('usage: fail <game_id> --code <FAILURE_CODE> --reason "..." --evidence <path> [--return-to <STAGE>] [--must-change "..."] [--preserve "..."]');
    if (!FAILURE_CODES.includes(code)) fail(`unknown failure_code ${code}; one of ${FAILURE_CODES.join(", ")}`);
    const p = loadPipeline(gameId);
    const route = FAILURE_ROUTES[code];
    const returnTo = flag("return-to", route.return_to[0]);
    if (!route.return_to.includes(returnTo)) refuse({ accepted: false, reason: `--return-to ${returnTo} is not a valid destination for ${code} (allowed: ${route.return_to.join(", ")})` });
    const failure = {
      failure_id: `f-${p.failures.length + 1}`,
      failure_code: code, failure_reason: reason, evidence, return_to: returnTo,
      preserve: flag("preserve", route.preserve), must_change: flag("must-change", route.must_change),
      design_iteration: p.design_iteration, at: now(),
    };
    p.failures.push(failure);
    p.current_stage = returnTo;
    // Budget: same design iteration -> local repair, capped like task-state.mjs.
    // Design-level codes (anything routed to a design stage) count against
    // repair_count; when the cap is hit the pipeline must REDESIGN (new seed/
    // translation) rather than keep patching the same idea.
    const isDesignStage = DESIGN_STAGES.some((s) => s.id === returnTo);
    let decision;
    if (p.repair_count < REPAIR_MAX_PER_ITERATION) {
      p.repair_count += 1;
      setState(p, "REPAIRING", `${code} -> ${returnTo} (repair ${p.repair_count}/${REPAIR_MAX_PER_ITERATION})`);
      decision = { action: "REPAIR", repair_count: p.repair_count };
    } else if (isDesignStage && p.redesign_count < REDESIGN_MAX) {
      setState(p, "RETURNED", `${code} -> ${returnTo}; repair budget exhausted, REDESIGN required (redesign ${p.redesign_count}/${REDESIGN_MAX} used)`);
      decision = { action: "REDESIGN_REQUIRED", reason: `repair_count=${p.repair_count} >= ${REPAIR_MAX_PER_ITERATION}; run 'redesign' with a different seed/translation` };
    } else if (!isDesignStage && p.repair_count < REPAIR_MAX_PER_ITERATION + 1) {
      // downstream stages (spec/art/impl) get one extra local repair before escalation
      p.repair_count += 1;
      setState(p, "REPAIRING", `${code} -> ${returnTo} (downstream repair)`);
      decision = { action: "REPAIR", repair_count: p.repair_count };
    } else {
      setState(p, "ESCALATED", `${code} persists after repair_count=${p.repair_count}, redesign_count=${p.redesign_count}`);
      p.escalation = { reason: "same fundamental failure persists after finite repair+redesign budget", failure_code: code, at: now() };
      decision = { action: "ESCALATED", reason: p.escalation.reason };
    }
    log(p, "failure_routed", { failure_id: failure.failure_id, code, return_to: returnTo, decision });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, failure, decision, state: p.state }, null, 2));
    if (decision.action === "ESCALATED") process.exit(1);
    break;
  }

  case "repair-done": {
    const p = loadPipeline(rest[0] ?? fail('usage: repair-done <game_id> --note "..."'));
    if (p.state !== "REPAIRING") refuse({ accepted: false, reason: `state is ${p.state}, not REPAIRING` });
    setState(p, "UNDER_REVIEW", flag("note", "repair done"));
    log(p, "repair_done", { note: flag("note") ?? null });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, state: p.state, next: "review (new independent review evidence required)" }, null, 2));
    break;
  }

  // -------------------------------------------------------------- redesign
  case "redesign": {
    const gameId = rest[0];
    const seed = flag("seed");
    const translation = flag("translation");
    const reason = flag("reason");
    if (!gameId || (!seed && !translation) || !reason) fail('usage: redesign <game_id> (--seed <seed_id> | --translation <translation_id>) --reason "..."');
    const p = loadPipeline(gameId);
    if (p.redesign_count >= REDESIGN_MAX) {
      setState(p, "ESCALATED", `redesign budget exhausted (${p.redesign_count}/${REDESIGN_MAX})`);
      p.escalation = { reason: "redesign budget exhausted", at: now() };
      savePipeline(p);
      refuse({ accepted: false, reason: `redesign_count=${p.redesign_count} >= REDESIGN_MAX=${REDESIGN_MAX} — ESCALATED (Human Decision Required)`, state: p.state });
    }
    // must point at an existing alternative seed/translation, and it must differ from the adopted one
    const seeds = p.artifacts.play_seeds?.payload?.seeds ?? [];
    const trans = p.artifacts.game_translations?.payload;
    if (seed && !seeds.some((s) => s.seed_id === seed)) refuse({ accepted: false, reason: `seed ${seed} is not in play_seeds (${seeds.map((s) => s.seed_id).join(",")})` });
    if (translation && !(trans?.translations ?? []).some((t) => t.translation_id === translation)) refuse({ accepted: false, reason: `translation ${translation} is not in game_translations` });
    if (translation && trans?.adopted_translation_id === translation) refuse({ accepted: false, reason: `translation ${translation} is the one that just failed — a REDESIGN must adopt a DIFFERENT translation/seed` });
    const prevIter = p.design_iteration;
    p.redesign_count += 1;
    p.design_iteration += 1;
    p.repair_count = 0;
    // downstream of the design choice is stale by definition
    for (const d of ["game_translations", "first_5_seconds", "no_manual_exploit_check", "core_back_check", "game_spec", "art_brief", "art_production", "implementation", "implementation_qa"]) {
      if (p.artifacts[d] && p.artifacts[d].status !== "STALE") { p.artifacts[d].status = "STALE"; p.artifacts[d].stale_because = `redesign ${prevIter}->${p.design_iteration}`; }
    }
    if (p.independent_review) { p.independent_review.stale = true; p.independent_review.stale_because = "redesign"; }
    p.redesign = [...(p.redesign ?? []), { from_iteration: prevIter, to_iteration: p.design_iteration, seed: seed ?? null, translation: translation ?? null, reason, at: now() }];
    p.current_stage = "GAME_TRANSLATION";
    setState(p, "REDESIGNING", `iteration ${p.design_iteration}: ${seed ? "seed " + seed : "translation " + translation}`);
    log(p, "redesign_started", { seed: seed ?? null, translation: translation ?? null, reason, redesign_count: p.redesign_count });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, design_iteration: p.design_iteration, redesign_count: p.redesign_count, repair_count: 0, state: p.state }, null, 2));
    break;
  }

  // ------------------------------------------------------------------ gate
  case "gate": {
    const p = loadPipeline(rest[0] ?? fail("usage: gate <game_id>"));
    const reasons = gameDesignReadyReasons(p);
    const allowed = reasons.length === 0;
    if (allowed && p.state !== "GAME_DESIGN_READY") {
      setState(p, "GAME_DESIGN_READY", "all GAME_DESIGN_READY checks satisfied");
      log(p, "gate_passed", { gate: "GAME_DESIGN_READY" });
      savePipeline(p);
    } else if (!allowed) {
      log(p, "gate_refused", { gate: "GAME_DESIGN_READY", reasons: reasons.map((r) => r.id) });
      savePipeline(p);
    }
    console.log(JSON.stringify({ allowed, gate: "GAME_DESIGN_READY", game_id: p.game_id, state: p.state, reasons }, null, 2));
    process.exit(allowed ? 0 : 1);
  }

  // -------------------------------------------------------- human decision
  case "human-decision": {
    const p = loadPipeline(rest[0] ?? fail('usage: human-decision <game_id> --domain <domain> --note "..."'));
    const domain = flag("domain");
    const note = flag("note");
    if (!domain || !note) fail('usage: human-decision <game_id> --domain <domain> --note "..."');
    if (!HUMAN_DECISION_DOMAINS.includes(domain)) fail(`unknown domain ${domain}; one of ${HUMAN_DECISION_DOMAINS.join(", ")}`);
    const hd = { id: `hd-${p.human_decisions.length + 1}`, domains: [domain], note, status: "open", opened_at: now() };
    p.human_decisions.push(hd);
    log(p, "human_decision_opened", { id: hd.id, domains: [domain] });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, human_decision: hd, autonomous_progress_blocked: true }, null, 2));
    break;
  }
  case "resolve-human-decision": {
    const p = loadPipeline(rest[0] ?? fail('usage: resolve-human-decision <game_id> --id <hd_id> --note "<human decision text>"'));
    const id = flag("id");
    const note = flag("note");
    if (!id || !note) fail('usage: resolve-human-decision <game_id> --id <hd_id> --note "<human decision text>"');
    const hd = p.human_decisions.find((h) => h.id === id);
    if (!hd) fail(`no human decision ${id}`);
    hd.status = "resolved";
    hd.resolution = note;
    hd.resolved_at = now();
    log(p, "human_decision_resolved", { id, note });
    if (p.state === "ESCALATED") {
      p.repair_count = 0;
      p.redesign_count = 0;
      setState(p, "RETURNED", "human decision resolved — budgets reset for a new iteration");
      log(p, "iteration_reset", { reason: note });
    }
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, human_decision: hd, state: p.state }, null, 2));
    break;
  }
  case "escalate": {
    const p = loadPipeline(rest[0] ?? fail('usage: escalate <game_id> --reason "..."'));
    const reason = flag("reason") ?? fail("--reason required");
    p.escalation = { reason, at: now() };
    setState(p, "ESCALATED", reason);
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, state: p.state, escalation: p.escalation }, null, 2));
    break;
  }

  // ------------------------------------------------------------ art review
  case "art-review": {
    const p = loadPipeline(rest[0] ?? fail("usage: art-review <game_id> --evidence <file> --reviewer <id> --producer <id> (--pass | --fail --code <FAILURE_CODE>)"));
    const evidence = flag("evidence");
    const reviewer = flag("reviewer");
    const producer = flag("producer");
    if (!evidence || !reviewer || !producer) fail("usage: art-review <game_id> --evidence <file> --reviewer <id> --producer <id> (--pass | --fail --code <FAILURE_CODE>)");
    if (!existsSync(evidence)) refuse({ accepted: false, reason: `evidence ${evidence} does not exist` });
    if (p.artifacts.art_brief?.payload?.no_art_required === true) refuse({ accepted: false, reason: "art_brief declares no_art_required — nothing to review" });
    if (!p.artifacts.art_production || p.artifacts.art_production.status === "STALE") refuse({ accepted: false, reason: "no CURRENT art_production artifact to review" });
    const independent = reviewer !== producer;
    const pass = hasFlag("pass");
    const rec = { verdict: pass ? "PASS" : "FAIL", evidence, reviewer, producer, independent, review_mechanism: reviewer, recorded_at: now() };
    p.art_review = rec;
    log(p, "art_review_recorded", rec);
    if (pass && independent) {
      setState(p, "ART_APPROVED", "art review PASS (independent)");
    } else if (!pass) {
      const code = flag("code", "VISUAL_AFFORDANCE_FAILURE");
      if (!FAILURE_CODES.includes(code)) fail(`unknown failure code ${code}`);
      const route = FAILURE_ROUTES[code];
      const failure = { failure_id: `f-${p.failures.length + 1}`, failure_code: code, failure_reason: "art review FAIL", evidence, return_to: route.return_to[0], preserve: route.preserve, must_change: route.must_change, design_iteration: p.design_iteration, at: now() };
      p.failures.push(failure);
      p.current_stage = route.return_to[0];
      setState(p, "REPAIRING", `art review FAIL -> ${route.return_to[0]}`);
      log(p, "failure_routed", { failure_id: failure.failure_id, code, return_to: route.return_to[0] });
    }
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, art_review: rec, state: p.state, note: !independent ? "reviewer == producer: independent=false, cannot approve" : null }, null, 2));
    if (!pass || !independent) process.exit(1);
    break;
  }

  // ---------------------------------------------------------- art-request
  // Art Brief -> the per-asset request JSON that the EXISTING art producer
  // (factory/harness/art/art-loop.mjs run --request <file>) consumes. This
  // is the mechanical handoff: the producer receives the brief's interaction
  // requirements (touch affordance, visual hierarchy, what must NOT be baked
  // in) inside the very fields art-loop already turns into its prompt, so
  // nothing about the brief can be silently dropped between departments.
  case "art-request": {
    const p = loadPipeline(rest[0] ?? fail("usage: art-request <game_id> [--asset-id <id>] [--output-path <public/assets/...>] [--size WxH]"));
    const brief = p.artifacts.art_brief;
    if (!brief || brief.status === "STALE") refuse({ accepted: false, reason: "no CURRENT art_brief artifact" });
    const b = brief.payload;
    if (b.no_art_required === true) refuse({ accepted: false, reason: "art_brief declares no_art_required — nothing to request" });
    const spec = p.artifacts.game_spec;
    const assetId = flag("asset-id", `${p.game_id.replace(/-/g, "_")}_scene`);
    const filename = flag("filename", `${assetId.replace(/^.*?_/, "")}.png`);
    const outputPath = flag("output-path", `public/assets/${p.game_id}/${filename}`);
    const req = {
      asset_id: assetId,
      filename,
      world: p.game_id,
      use: b.use ?? "place",
      purpose: b.asset_purpose,
      scene: b.scene,
      composition: [b.mobile_composition, `Interactive object hierarchy: ${Array.isArray(b.interactive_object_visual_hierarchy) ? b.interactive_object_visual_hierarchy.join(" > ") : b.interactive_object_visual_hierarchy}`, `Must be visually obvious: ${Array.isArray(b.what_must_be_visually_obvious) ? b.what_must_be_visually_obvious.join("; ") : b.what_must_be_visually_obvious}`, `Touch affordance: ${Array.isArray(b.touch_affordance_requirements) ? b.touch_affordance_requirements.join("; ") : b.touch_affordance_requirements}`].join(" "),
      required_objects: b.required_objects,
      forbidden_objects: [...(Array.isArray(b.what_must_not_be_baked_into_image) ? b.what_must_not_be_baked_into_image : [b.what_must_not_be_baked_into_image]), "readable text", "UI buttons/badges/labels", "mascot or brand character (prohibited_mascot_invention)"],
      state_variations: b.required_state_variations,
      success_state: b.success_state,
      failure_state: b.failure_state,
      style: b.clay_style_requirements,
      reference_assets: b.existing_series_references,
      aspect_ratio: b.aspect_ratio ?? "3:2",
      size: flag("size", b.size ?? "1248x832"),
      output_path: outputPath,
      used_by: spec?.payload?.asset_requirements ? [`game_spec v${spec.version}`] : [],
      provenance: { art_brief: brief.artifact_id, game_spec: spec ? spec.artifact_id : null, generated_at: now() },
    };
    const dir = join(ROOT, "factory", "projects", p.game_id, "art-requests");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${filename.replace(/\.png$/, "")}.json`);
    writeFileSync(file, JSON.stringify(req, null, 2) + "\n");
    log(p, "art_request_written", { file: file.replace(ROOT + "/", ""), asset_id: assetId });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, file: file.replace(ROOT + "/", ""), producer_command: `node factory/harness/art/art-loop.mjs run --request ${file.replace(ROOT + "/", "")}`, then: `submit ${p.game_id} art_production --file <assets.json> ; art-review ${p.game_id} --evidence <art-qa result> --reviewer codex-vision-critic --producer codex_imagegen --pass|--fail` }, null, 2));
    break;
  }

  case "link-task": {
    const [gameId, taskId] = rest;
    if (!gameId || !taskId) fail("usage: link-task <game_id> <task_id>");
    const p = loadPipeline(gameId);
    const r = spawnSync("node", [TASK_STATE, "status", taskId], { cwd: ROOT, encoding: "utf8" });
    if (r.status !== 0) refuse({ accepted: false, reason: `task ${taskId} not found in factory/state/tasks.json` });
    p.task_id = taskId;
    log(p, "task_linked", { task_id: taskId });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, task_id: taskId }, null, 2));
    break;
  }

  case "set-version": {
    const [gameId, version] = rest;
    if (!gameId || !version) fail("usage: set-version <game_id> <version>");
    const p = loadPipeline(gameId);
    p.version = version;
    if (p.state === "RELEASE_CANDIDATE") setState(p, "RELEASED", `version ${version}`);
    log(p, "version_set", { version });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, version, state: p.state }, null, 2));
    break;
  }

  // --------------------------------------------------------- release-ready
  // End-to-end release gate. Delegates the QA/review/identity/deploy checks
  // to task-state.mjs can-deploy (the ONE canonical deploy gate) and adds
  // the design-chain conditions in front of it.
  case "release-ready": {
    const p = loadPipeline(rest[0] ?? fail("usage: release-ready <game_id>"));
    const reasons = [];
    const localRepair = p.legacy_release_mode === "local_repair";
    if (!localRepair) for (const r of gameDesignReadyReasons(p)) reasons.push(`design: ${r.reason}`);
    const spec = p.artifacts.game_spec;
    if (!localRepair && (!spec || spec.status === "STALE")) reasons.push("game_spec missing or STALE");
    const brief = p.artifacts.art_brief;
    if (!localRepair && (!brief || brief.status === "STALE")) reasons.push("art_brief missing or STALE (submit one with no_art_required:true if no art is needed)");
    else if (brief && brief.status !== "STALE" && brief.payload.no_art_required !== true) {
      if (!p.artifacts.art_production || p.artifacts.art_production.status === "STALE") reasons.push("art_production missing or STALE");
      if (!(p.art_review?.verdict === "PASS" && p.art_review?.independent)) reasons.push("art review must be an independent PASS");
    }
    const impl = p.artifacts.implementation;
    if (!impl || impl.status === "STALE") reasons.push("implementation artifact missing or STALE");
    else if (spec && impl.payload.spec_version !== spec.version) reasons.push(`implementation.spec_version=${impl.payload.spec_version} but game_spec is v${spec.version} — implementation is behind the spec`);
    const iq = p.artifacts.implementation_qa;
    if (!iq || iq.status === "STALE" || iq.payload.pass !== true) reasons.push("implementation_qa missing/STALE/failed");
    if (!(p.impl_review?.verdict === "PASS" && p.impl_review?.independent && !p.impl_review?.stale)) reasons.push("independent implementation review must be a non-stale PASS");
    if ((p.human_decisions ?? []).some((h) => h.status === "open")) reasons.push("open Human Decision");
    if (p.state === "ESCALATED") reasons.push("pipeline ESCALATED");
    if (p.state === "REAUDIT_REQUIRED") reasons.push("REAUDIT_REQUIRED — re-run the affected stage(s) before release");
    if (!p.task_id) reasons.push("no linked task-state task (link-task) — deploy policy is enforced there");
    else {
      const r = spawnSync("node", [TASK_STATE, "can-deploy", p.task_id], { cwd: ROOT, encoding: "utf8" });
      if (r.status !== 0) {
        try { reasons.push(...JSON.parse(r.stdout).reasons.map((x) => `task-state can-deploy: ${x}`)); } catch { reasons.push("task-state can-deploy refused"); }
      }
    }
    const allowed = reasons.length === 0;
    if (allowed && p.state !== "RELEASED") { setState(p, "RELEASE_CANDIDATE", "release-ready PASS"); log(p, "gate_passed", { gate: "RELEASE" }); }
    else if (!allowed) log(p, "gate_refused", { gate: "RELEASE", reasons });
    savePipeline(p);
    console.log(JSON.stringify({ allowed, gate: "RELEASE", game_id: p.game_id, state: p.state, reasons }, null, 2));
    process.exit(allowed ? 0 : 1);
  }

  case "mark-reaudit": {
    const p = loadPipeline(rest[0] ?? fail('usage: mark-reaudit <game_id> --reason "..." --trigger <TRIGGER>'));
    const reason = flag("reason") ?? fail("--reason required");
    const trigger = flag("trigger", "STANDARD_UPDATED");
    p.reaudit = [...(p.reaudit ?? []), { trigger, reason, at: now(), prior_state: p.state }];
    setState(p, "REAUDIT_REQUIRED", `${trigger}: ${reason}`);
    if (p.independent_review) { p.independent_review.stale = true; p.independent_review.stale_because = `${trigger}: ${reason}`; }
    if (p.impl_review) { p.impl_review.stale = true; }
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, state: p.state, trigger, reason }, null, 2));
    break;
  }

  case "set-legacy-mode": {
    const [gameId, mode] = rest;
    if (!gameId || mode !== "local_repair") fail('usage: set-legacy-mode <game_id> local_repair --reason "..."');
    const p = loadPipeline(gameId);
    if (!p.legacy_game_type) refuse({ accepted: false, reason: "legacy mode is only valid on a pipeline opened from a reverse audit (legacy_game_type set)" });
    p.legacy_release_mode = mode;
    p.legacy_release_reason = flag("reason", null);
    log(p, "legacy_release_mode_set", { mode, reason: p.legacy_release_reason });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, legacy_release_mode: mode }, null, 2));
    break;
  }

  case "set-entry-stage": {
    const [gameId, stage] = rest;
    if (!gameId || !stage || !ALL_STAGE_IDS.includes(stage)) fail(`usage: set-entry-stage <game_id> <STAGE>`);
    const p = loadPipeline(gameId);
    p.current_stage = stage;
    log(p, "entry_stage_set", { stage });
    savePipeline(p);
    console.log(JSON.stringify({ accepted: true, current_stage: stage }, null, 2));
    break;
  }

  default:
    console.error("commands: init | submit | status | list | stale | review | fail | repair-done | redesign | gate | human-decision | resolve-human-decision | escalate | art-review | link-task | set-version | release-ready | mark-reaudit | set-entry-stage");
    process.exit(2);
}

// referenced so the import is not dead if a command is added later
void CLASSIFICATION_ENTRY_STAGE;
