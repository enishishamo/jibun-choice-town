#!/usr/bin/env node
// Q1 Autonomous Game Factory — LEGACY Q1: reverse audit -> classification
// -> prioritized rebuild queue -> pipeline entry. 2026-09-08 (master request
// §23-24). Builds ON the existing independent Codex audit
// (factory/state/audits/q1-audit.json, 39 games, 2026-09-01) and the
// blocked-queue evidence -- it does not re-audit from scratch.
//
// Usage:
//   seed [--game-type <gameType>] [--overwrite]   # draft reverse audits from q1-audit.json + blocked-queue evidence
//   record --file <reverse-audit.json>            # validate + store a (confirmed) reverse audit
//   list                                          # all reverse audits with classification
//   queue                                         # rebuild factory/state/legacy/rebuild-queue.json (prioritized)
//   start <gameType> [--game-id <id>] [--backfill] # open a pipeline at the classification's entry stage (WIP-aware)
//
// Files: factory/state/legacy/reverse-audits/<gameType>.json, factory/state/legacy/rebuild-queue.json

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  validateReverseAudit, LEGACY_CLASSIFICATIONS, CLASSIFICATION_ENTRY_STAGE, PRIORITY_REASONS,
  WIP_MAX_ACTIVE_PIPELINES, ACTIVE_STATES,
} from "./q1-factory-schema.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const AUDIT = join(ROOT, "factory", "state", "audits", "q1-audit.json");
const DIR = join(ROOT, "factory", "state", "legacy", "reverse-audits");
const QUEUE = join(ROOT, "factory", "state", "legacy", "rebuild-queue.json");
const INDEX = join(ROOT, "factory", "state", "q1-pipeline-index.json");
const PIPELINE = join(HARNESS, "q1-pipeline.mjs");
const TASK_STATE = join(HARNESS, "task-state.mjs");

const args = process.argv.slice(2);
function flag(name, dflt) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
}
function hasFlag(n) {
  return args.includes(`--${n}`);
}
function fail(m) {
  console.error(m);
  process.exit(2);
}
function now() {
  return new Date().toISOString();
}
function run(script, a) {
  const r = spawnSync("node", [script, ...a], { cwd: ROOT, encoding: "utf8" });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* */ }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, json };
}

// Evidence already produced this session for the games that hit the
// AUTO REPAIR cap (factory/state/blocked-queue.md). The classification here
// is the one the independent reviews' residual findings imply; the
// evidence path is the raw review file so it can be re-derived.
const BLOCKED_EVIDENCE = {
  lab_check: { classification: "GAME_TRANSLATION_REBUILD", why: "選択肢名/ヒントのclinical registerが答えを漏らす（Gate E）が3回の形を変えて再発 — 選択肢設計そのものの再翻訳が必要", evidence: "factory/projects/q1-improve-lab-check/round4-review.result.json", reasons: ["answer_leak", "severe_c_d_failure"] },
  line_debug: { classification: "AE_REBUILD", why: "3つの調整候補を区別する観測情報がゲーム内に存在しない（C→Dの因果自体が欠落）— A-EのC/D定義から作り直す必要", evidence: "factory/projects/q1-improve-line-debug/round2-review.result.json", reasons: ["severe_c_d_failure", "brute_force_exploit"] },
  timetable: { classification: "GAME_TRANSLATION_REBUILD", why: "任意の1演目削除で必ず収まる（C不要）— 数値/構造の再翻訳", evidence: "factory/projects/q1-improve-timetable/round2-review.result.json", reasons: ["brute_force_exploit", "severe_c_d_failure"] },
  bus_ops: { classification: "GAME_TRANSLATION_REBUILD", why: "海沿い全選択＋先頭の出発時刻で資料なしに満点／3択総当たり — 選択構造の再翻訳", evidence: "factory/projects/q1-improve-bus-ops/round2-review.result.json", reasons: ["brute_force_exploit", "severe_c_d_failure"] },
  forecast_and_balance: { classification: "LOCAL_REPAIR", why: "コア搾取は解消済み。残りは表示の時間軸ラベルと最終時刻判定の整合（HONEST OUTCOME表示バグ）", evidence: "factory/projects/q1-improve-power/round2-review.result.json", reasons: ["serious_first_play_failure"] },
  safety_plan: { classification: "AE_REBUILD", why: "月組の配慮情報が既存4役のどれとも因果的に結びつかない — CとDの対応をA-Eから設計し直す必要", evidence: "factory/projects/q1-improve-safety-plan/round2-review.result.json", reasons: ["severe_c_d_failure", "answer_leak"] },
};

// Mechanical seed classification from the 2026-09-01 audit fields. These
// are DRAFTS (classification_source: "seed") until a session confirms them
// with `record`; the rule is deliberately simple and written down here.
// A repair task that was RELEASED with a PASS independent review supersedes
// the older audit row for that game (the audit predates the repair).
function releasedRepair(gameType) {
  const tasksPath = join(ROOT, "factory", "state", "tasks.json");
  if (!existsSync(tasksPath)) return null;
  const tasks = JSON.parse(readFileSync(tasksPath, "utf8")).tasks ?? {};
  const t = tasks[`q1-improve-${gameType.replace(/_/g, "-")}`];
  if (t && t.status === "RELEASED" && t.review_status === "PASS") return t;
  return null;
}

function seedClassification(g) {
  const rel = releasedRepair(g.gameType);
  if (rel) return { classification: "PASS", why: `repair task ${rel.task_id} RELEASED with independent review PASS (${rel.review_evidence}) — supersedes the ${g.game_quality_score}/${g.career_authenticity_score} audit row`, evidence: rel.review_evidence, reasons: ["other"], source: "released_repair" };
  if (BLOCKED_EVIDENCE[g.gameType]) return { ...BLOCKED_EVIDENCE[g.gameType], source: "independent_review_residual" };
  const reasons = [];
  if (g.exploit && /select-all|brute/.test(g.exploit)) reasons.push("brute_force_exploit");
  if (g.C_required === false) reasons.push("severe_c_d_failure");
  if (g.player_judgment_required === false) reasons.push("severe_c_d_failure");
  if (g.C_alone_determines_answer === true) reasons.push("answer_leak");
  if (/fact|事実|誤/.test(g.overall_risk ?? "")) reasons.push("major_factual_problem");
  let classification = "PASS";
  if (g.game_quality_score < 60 || g.career_authenticity_score < 60 || reasons.length) {
    if (g.C_required === false && g.player_judgment_required === false) classification = "AE_REBUILD";
    else if (g.C_required === false || g.C_alone_determines_answer === true || /select-all|brute/.test(g.exploit ?? "")) classification = "GAME_TRANSLATION_REBUILD";
    else if (g.game_quality_score < 60 || g.career_authenticity_score < 60) classification = "GAME_TRANSLATION_REBUILD";
    else classification = "LOCAL_REPAIR";
  }
  return { classification, why: `seeded from q1-audit.json: C_required=${g.C_required}, judgment=${g.player_judgment_required}, exploit=${g.exploit}, GQ=${g.game_quality_score}, CA=${g.career_authenticity_score}`, evidence: "factory/state/audits/q1-audit.json", reasons: [...new Set(reasons.length ? reasons : ["other"])], source: "seed" };
}

function loadAudits() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
}

const [cmd, ...rest] = args;

switch (cmd) {
  case "seed": {
    const only = flag("game-type");
    const audit = JSON.parse(readFileSync(AUDIT, "utf8"));
    mkdirSync(DIR, { recursive: true });
    const written = [];
    for (const g of audit.games) {
      if (only && g.gameType !== only) continue;
      const out = join(DIR, `${g.gameType}.json`);
      if (existsSync(out) && !hasFlag("overwrite")) continue;
      const c = seedClassification(g);
      const rec = {
        game_type: g.gameType,
        audited_from: { file: "factory/state/audits/q1-audit.json", audited_at: audit.audited_at, auditor: audit.auditor },
        current_profession: g.job,
        current_SCOPE: g.event,
        current_CORE: g.core_loop_statement ?? null,
        current_A: g.event,
        current_B: g.mechanic,
        current_C: g.C,
        current_D: g.D,
        current_E: g.retry ?? null,
        actual_first_screen: null,
        actual_player_actions: g.D,
        actual_feedback: g.failure,
        actual_next_decision: g.player_judgment_required ? "yes (per audit)" : "none (per audit: player_judgment_required=false)",
        actual_success_path: g.mechanic,
        actual_failure_path: g.failure,
        prerequisite_explanation: null,
        answer_leak: g.C_alone_determines_answer === true || (BLOCKED_EVIDENCE[g.gameType]?.reasons ?? []).includes("answer_leak"),
        brute_force: /select-all|brute|memorize/.test(g.exploit ?? ""),
        profession_reveal: "unconditional Job Reveal via Q1Screen (src/screens/Q1Screen.tsx)",
        audit_scores: { game_quality: g.game_quality_score, career_authenticity: g.career_authenticity_score, exploit: g.exploit, C_required: g.C_required, player_judgment_required: g.player_judgment_required, action_changes_result: g.action_changes_result },
        audit_evidence: g.evidence ?? [],
        classification: c.classification,
        classification_source: c.source,
        classification_reason: c.why,
        classification_evidence: c.evidence,
        priority_reasons: c.reasons,
        recorded_at: now(),
      };
      writeFileSync(out, JSON.stringify(rec, null, 2) + "\n");
      written.push({ game_type: g.gameType, classification: c.classification, source: c.source });
    }
    console.log(JSON.stringify({ seeded: written.length, written }, null, 2));
    break;
  }

  case "record": {
    const file = flag("file");
    if (!file) fail("usage: record --file <reverse-audit.json>");
    const a = JSON.parse(readFileSync(file, "utf8"));
    const v = validateReverseAudit(a);
    if (!v.ok) { console.log(JSON.stringify({ accepted: false, problems: v.problems }, null, 2)); process.exit(1); }
    mkdirSync(DIR, { recursive: true });
    a.recorded_at = now();
    a.classification_source = a.classification_source ?? "confirmed";
    writeFileSync(join(DIR, `${a.game_type}.json`), JSON.stringify(a, null, 2) + "\n");
    console.log(JSON.stringify({ accepted: true, game_type: a.game_type, classification: a.classification, entry_stage: CLASSIFICATION_ENTRY_STAGE[a.classification] }, null, 2));
    break;
  }

  case "list": {
    console.log(JSON.stringify(loadAudits().map((a) => ({ game_type: a.game_type, classification: a.classification, source: a.classification_source, GQ: a.audit_scores?.game_quality, CA: a.audit_scores?.career_authenticity, reasons: a.priority_reasons })), null, 2));
    break;
  }

  case "queue": {
    const audits = loadAudits();
    const idx = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : { pipelines: {} };
    const inPipeline = new Set(Object.values(idx.pipelines).map((p) => p.legacy_game_type).filter(Boolean));
    const prev = existsSync(QUEUE) ? JSON.parse(readFileSync(QUEUE, "utf8")) : { items: [] };
    const prevStatus = Object.fromEntries(prev.items.map((i) => [i.game_type, i.status]));
    const items = audits
      .filter((a) => a.classification !== "PASS")
      .map((a) => {
        const best = Math.min(...(a.priority_reasons ?? ["other"]).map((r) => PRIORITY_REASONS[r] ?? 9));
        const gq = a.audit_scores?.game_quality ?? 50;
        return {
          game_type: a.game_type,
          classification: a.classification,
          entry_stage: CLASSIFICATION_ENTRY_STAGE[a.classification],
          priority_reasons: a.priority_reasons,
          priority_score: Number((best + gq / 100).toFixed(2)), // lower = more urgent; ties broken by lower GQ
          evidence: a.classification_evidence,
          status: inPipeline.has(a.game_type) ? "in_progress" : (prevStatus[a.game_type] === "done" ? "done" : "queued"),
        };
      })
      .sort((x, y) => x.priority_score - y.priority_score);
    const q = { note: "Prioritized legacy rebuild queue — regenerate with `node factory/harness/q1-legacy-audit.mjs queue`. Order: release_blocker > serious_first_play_failure > core_distortion > answer_leak > brute_force_exploit > major_factual_problem > severe_c_d_failure > other; ties by lower audit GQ. WIP limit applies at `start`.", generated_at: now(), wip_limit: WIP_MAX_ACTIVE_PIPELINES, items };
    mkdirSync(dirname(QUEUE), { recursive: true });
    writeFileSync(QUEUE, JSON.stringify(q, null, 2) + "\n");
    console.log(JSON.stringify({ queued: items.filter((i) => i.status === "queued").length, in_progress: items.filter((i) => i.status === "in_progress").length, total: items.length, top5: items.slice(0, 5) }, null, 2));
    break;
  }

  case "start": {
    const gameType = rest[0];
    if (!gameType) fail("usage: start <gameType> [--game-id <id>] [--backfill]");
    const file = join(DIR, `${gameType}.json`);
    if (!existsSync(file)) fail(`no reverse audit for ${gameType} (run seed/record first)`);
    const a = JSON.parse(readFileSync(file, "utf8"));
    if (a.classification === "PASS") { console.log(JSON.stringify({ accepted: false, reason: "classification is PASS — nothing to rebuild" })); process.exit(1); }
    const idx = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : { pipelines: {} };
    const active = Object.values(idx.pipelines).filter((p) => ACTIVE_STATES.has(p.state)).length;
    if (active >= WIP_MAX_ACTIVE_PIPELINES && !hasFlag("force")) { console.log(JSON.stringify({ accepted: false, reason: `WIP full (${active}/${WIP_MAX_ACTIVE_PIPELINES})` }, null, 2)); process.exit(1); }
    const gameId = flag("game-id", `legacy-${gameType.replace(/_/g, "-")}`);
    const entry = CLASSIFICATION_ENTRY_STAGE[a.classification];
    const taskId = `q1-rebuild-${gameType.replace(/_/g, "-")}`;
    run(TASK_STATE, ["create", taskId, "--type", "game-content", "--identity-impact", "NONE", "--review-required"]);
    const p = run(PIPELINE, ["init", gameId, "--profession", a.current_profession, "--trigger", "LEGACY_AUDIT_REQUIRED", "--legacy-game-type", gameType, "--entry-stage", entry]);
    if (p.status !== 0) { console.error(p.stdout || p.stderr); process.exit(1); }
    run(PIPELINE, ["link-task", gameId, taskId]);
    const backfilled = [];
    if (hasFlag("backfill")) {
      // Preserve what the reverse audit says is currently true as v1 of the
      // upstream artifacts ABOVE the entry stage, so the rebuild can start at
      // the classification's stage without pretending those stages are new.
      // Everything from the entry stage downward is left empty on purpose.
      const tmpDir = join(ROOT, "factory", "projects", gameId, "backfill");
      mkdirSync(tmpDir, { recursive: true });
      const order = ["PROFESSION_RESEARCH", "SCOPE_CORE", "AE", "CORE_SCOPE_CHECK", "PLAY_SEED", "EXISTING_GAME_RESEARCH", "C_COMPRESSION", "GAME_TRANSLATION"];
      const upto = order.indexOf(entry);
      const put = (type, payload) => {
        const f = join(tmpDir, `${type}.json`);
        writeFileSync(f, JSON.stringify({ ...payload, derived_from: "reverse_audit", reverse_audit: `factory/state/legacy/reverse-audits/${gameType}.json` }, null, 2) + "\n");
        const r = run(PIPELINE, ["submit", gameId, type, "--file", f, "--creator", "reverse-audit"]);
        backfilled.push({ type, accepted: r.json?.accepted ?? false, problems: r.json?.problems ?? null });
      };
      if (upto > 0) put("fact_sheet", { profession: a.current_profession, sources: [{ url: "factory/state/audits/q1-audit.json", type: "internal_audit" }], who_or_what_they_serve: "(from current implementation — verify)", representative_duties: [a.current_B], expertise: [a.current_C], tools: [a.current_C], information_used: [a.current_C], decisions: [a.current_D], outputs_or_value: a.current_E ?? "(verify)", adjacent_profession_boundaries: "(verify)", uncertainties: ["seeded from implementation, not primary sources — FACT_CHECK_REQUIRED"] });
      if (upto > 1) put("scope_core", { core: a.current_CORE ?? "(verify)", scope: a.current_SCOPE, scope_is_representative_because: "(current implementation; verify)", profession_name_hidden_test: "(re-run)" });
      if (upto > 2) put("ae", { A: a.current_A, B: a.current_B, C: a.current_C, D: a.current_D, E: a.current_E ?? "(verify)" });
      // each submit moves current_stage to that artifact's stage; the rebuild
      // must resume at the classification's entry stage, not the last backfill
      run(PIPELINE, ["set-entry-stage", gameId, entry]);
    }
    // mark queue
    if (existsSync(QUEUE)) {
      const q = JSON.parse(readFileSync(QUEUE, "utf8"));
      const item = q.items.find((i) => i.game_type === gameType);
      if (item) { item.status = "in_progress"; item.game_id = gameId; item.started_at = now(); }
      writeFileSync(QUEUE, JSON.stringify(q, null, 2) + "\n");
    }
    console.log(JSON.stringify({ accepted: true, game_id: gameId, task_id: taskId, classification: a.classification, entry_stage: entry, backfilled }, null, 2));
    break;
  }

  default:
    console.error("commands: seed | record --file | list | queue | start <gameType>");
    console.error(`classifications: ${LEGACY_CLASSIFICATIONS.join(", ")}`);
    process.exit(2);
}
