#!/usr/bin/env node
// Integration self-test for the RESEARCH → GAME DESIGN → DESIGN HANDOFF
// pipeline added on 2026-09-23 (factory/rules/game-production-pipeline.md).
//
// Same contract as factory-self-test.mjs: it runs against SCRATCH state only
// (JC_PIPELINE_ROOT + JC_TASKS_PATH), never reads or writes the real ledgers,
// and every sub-test asserts a REFUSAL rather than a happy path, because a
// gate that has never been seen to refuse has not been seen to work.
//
// Sub-tests (the directive's §30 A–H):
//   A  WORK_RESEARCH missing  -> the design gate refuses
//   B  FACT GATE failing      -> no game concept can be submitted
//   C  FINAL_GAME_DESIGN missing -> a production build is refused
//   D  DESIGN_PACKAGE missing -> design-INDEPENDENT work still continues
//   E  DESIGN_PACKAGE missing -> the visual side cannot be called done
//   F  a build standing on an old game design version is detected
//   G  GAME_CONCEPT_REJECTED can return to research, without spending budget
//   H  a QA finding routes to its owner (a design-owner gap never becomes a build task's to fix)
//
// Usage: node factory/harness/pipeline-self-test.mjs
// Exit 0 = all passed.

import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const PIPELINE = join(HARNESS, "q1-pipeline.mjs");
const TASK_STATE = join(HARNESS, "task-state.mjs");
const EVIDENCE_OUT = join(ROOT, "factory", "state", "self-test", "pipeline-self-test-2026-09-23.json");

const scratch = mkdtempSync(join(tmpdir(), "jc-pipeline-selftest-"));
const LEDGER = join(scratch, "tasks.json");
const env = { JC_PIPELINE_ROOT: scratch, JC_TASKS_PATH: LEDGER };

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 32 * 1024 * 1024 });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}
const pipe = (argv) => run("node", [PIPELINE, ...argv]);
const ts = (argv) => run("node", [TASK_STATE, ...argv]);

const results = [];
function check(id, name, ok, detail) {
  results.push({ id, name, ok: Boolean(ok), detail: String(detail).slice(0, 700) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}. ${name}`);
  if (!ok) console.log(`      ${String(detail).slice(0, 700)}`);
}
let fileSeq = 0;
function artifact(payload) {
  const f = join(scratch, `artifact-${++fileSeq}.json`);
  writeFileSync(f, JSON.stringify(payload, null, 2));
  return f;
}
function pipelineOf(id) {
  const f = join(scratch, "factory", "projects", id, "q1-pipeline.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

// ---- payload fixtures ------------------------------------------------------
const legacyInventory = (id) => ({ job_id: id, searched: "x", gaps: "x", items: [{ path: "p", what: "w", decision: "KEEP", reason: "r" }] });
const claim = (conf, cls) => ({ claim: "c", actor: "配送員", source: "s", source_class: cls, confidence: conf });
const workResearch = (id) => ({ job_id: id, subject: "s", researcher_notes: "n", unconfirmed: ["u"], claims: [claim("HIGH", "municipal"), claim("HIGH", "municipal"), claim("MEDIUM", "government")] });
const row = (over = {}) => ({
  work_action: "a", actor: "配送員", trigger: "t", inputs: "i", constraints: "c", decision: "d",
  physical_or_digital_action: "p", outcome: "o", frequency: "f", variability: "v",
  source: "s", source_class: "municipal", confidence: "HIGH", gameability: "HIGH", distortion_risk: "LOW", ...over,
});
const decisionMap = (id, rows) => ({ job_id: id, rows });
const reference = (n) => ({ reference: `g${n}`, core_action: "a", player_decision: "d", feedback: "f", tension: "t", reward: "r", replay_hook: "h", what_to_borrow: "b", what_not_to_borrow: "nb", why_it_fits_this_job: "w" });
const refResearch = (id) => ({ job_id: id, why_these_references: "w", grammar_borrowed: "g", references: [reference(1), reference(2)] });
const concept = (cid, action) => ({
  concept_id: cid, job_reality: "jr", main_action: action, core_loop: "cl", player_decision: "pd", constraint: "c",
  feedback: "f", event: "e", fail_recovery: "fr", clear: "cr", replay: "rp", replay_reason: "rr",
  job_reveal_bridge: "jb", interest_seeds: "is", reference_games: "rg", distortion_risk: "LOW",
  cognitive_load: "low", decision_row_ids: "1",
});
const concepts = (id) => ({ job_id: id, comparison: "matrix", recommended_concept_id: "c1", recommendation_rationale: "r", concepts: [concept("c1", "かぞえる"), concept("c2", "つたえる"), concept("c3", "たもつ")] });
const finalDesign = (id) => ({
  job_id: id, adopted_concept_id: "c1", job_reality: "x", player_role: "x", main_action: "x", core_loop: "x",
  start_state: "x", player_input: "x", world_response: "x", player_decision: "x", event: "x", fail_near_miss: "x",
  recovery: "x", clear: "x", replay_hook: "x", job_reveal: "x", know_the_job_requirements: "x",
  career_path_requirements: "x", interest_seeds: "x", fact_boundaries: "x", forbidden_simplifications: "x",
  reference_game_grammar: "x", game_fit_confidence: "HIGH", rejected_concepts: [{ id: "c2", why: "w" }, { id: "c3", why: "w" }],
});
const handoff = (id, v) => ({
  job_id: id, game_design_version: v, game_intent: "x", player_action: "x", core_loop: "x", game_states: "x",
  what_must_be_visible: "x", what_must_not_require_text: "x", feedback_map: "x", replay_hook: "x",
  world_context: "x", spatial_continuity: "x", existing_assets: "x", new_asset_needs: "x",
  hard_product_rules: "x", design_freedom: "x", fact_boundaries: "x", forbidden_visual_misrepresentations: "x",
});

/** Drive a job up to (but not including) the named stage. */
function seed(id, upTo) {
  pipe(["init", id, "--profession", "p", "--track", "v2", "--creator", "producer"]);
  const steps = [
    ["legacy_inventory", legacyInventory(id), []],
    ["work_research", workResearch(id), ["legacy_inventory@1"]],
    ["work_decision_map", decisionMap(id, [row()]), ["work_research@1"]],
    ["game_reference_research", refResearch(id), ["work_decision_map@1"]],
    ["game_concepts", concepts(id), ["work_decision_map@1", "game_reference_research@1"]],
    ["final_game_design", finalDesign(id), ["game_concepts@1"]],
    ["design_handoff", handoff(id, 1), ["final_game_design@1"]],
  ];
  for (const [type, payload, sources] of steps) {
    if (type === upTo) return;
    const src = sources.flatMap((s) => ["--source", s]);
    pipe(["submit", id, type, "--file", artifact(payload), "--creator", "producer", ...src]);
  }
}

// --- A: no WORK_RESEARCH -> the design gate refuses -------------------------
{
  const id = "selftest-a";
  pipe(["init", id, "--profession", "p", "--track", "v2", "--creator", "producer"]);
  pipe(["submit", id, "legacy_inventory", "--file", artifact(legacyInventory(id)), "--creator", "producer"]);
  const g = pipe(["gate", id]);
  const named = /work research missing/.test(g.out);
  check("A", "without WORK_RESEARCH the design gate refuses and says so by name", g.status === 1 && named, `exit=${g.status} names_research=${named}`);
}

// --- B: a failing FACT GATE stops concepts being written --------------------
{
  const id = "selftest-b";
  pipe(["init", id, "--profession", "p", "--track", "v2", "--creator", "producer"]);
  pipe(["submit", id, "legacy_inventory", "--file", artifact(legacyInventory(id)), "--creator", "producer"]);
  pipe(["submit", id, "work_research", "--file", artifact(workResearch(id)), "--creator", "producer", "--source", "legacy_inventory@1"]);
  // every row is unattributable, or would misrepresent the job
  const bad = decisionMap(id, [row({ actor: "UNKNOWN" }), row({ distortion_risk: "HIGH" }), row({ confidence: "LOW", source_class: "secondary" })]);
  pipe(["submit", id, "work_decision_map", "--file", artifact(bad), "--creator", "producer", "--source", "work_research@1"]);
  const fg = pipe(["fact-gate", id]);
  const adv = pipe(["can-advance", id, "GAME_DESIGN"]);
  const g = pipe(["gate", id]);
  const gateNamed = /FACT GATE/.test(g.out);
  check("B", "a failing FACT GATE refuses, and the design gate refuses naming it — no concept may be written on it",
    fg.status === 1 && adv.status === 1 && g.status === 1 && gateNamed,
    `fact-gate=${fg.status} can-advance=${adv.status} gate=${g.status} named=${gateNamed}`);
}

// --- C: no FINAL_GAME_DESIGN -> a production build is refused ---------------
{
  const id = "selftest-c";
  seed(id, "final_game_design"); // everything up to, but not including, the design
  const adv = pipe(["can-advance", id, "BUILD"]);
  const named = /no FINAL_GAME_DESIGN/.test(adv.out);
  check("C", "without a FINAL_GAME_DESIGN the build transition is refused", adv.status === 1 && named, `exit=${adv.status} out=${adv.out.slice(0, 200)}`);
}

// --- D: no DESIGN_PACKAGE -> design-INDEPENDENT work still proceeds ---------
{
  const id = "selftest-d";
  seed(id, null); // through design_handoff, no design_package
  const build = pipe(["can-advance", id, "BUILD"]);
  const prod = pipe(["can-advance", id, "PRODUCTION_READY"]);
  const onlyPkg = /no DESIGN_PACKAGE/.test(prod.out);
  check("D", "with a handoff but no DESIGN_PACKAGE, design-independent build work is allowed to continue",
    build.status === 0 && prod.status === 1 && onlyPkg,
    `build=${build.status} production=${prod.status} names_package=${onlyPkg}`);
}

// --- E: the visual side cannot be declared done without a DESIGN_PACKAGE ----
{
  const id = "selftest-e";
  seed(id, null);
  const prod = pipe(["can-advance", id, "PRODUCTION_READY"]);
  const cannotSelfDeclare = /visual work cannot be marked done without one/.test(prod.out);
  check("E", "a builder cannot declare the final visual done while no DESIGN_PACKAGE exists", prod.status === 1 && cannotSelfDeclare, `exit=${prod.status} reason_present=${cannotSelfDeclare}`);
}

// --- F: a build standing on a superseded game design is detected ------------
{
  const id = "selftest-f";
  seed(id, null);
  const task = "selftest-f-build";
  ts(["create", task, "--type", "game-content", "--producer", "builder"]);
  ts(["set-upstream", task, "--job", id, "--game-design", "1"]);
  const before = ts(["can-deploy", task]);
  // a corrected fact arrives: work_decision_map v2 stales everything downstream
  pipe(["submit", id, "work_decision_map", "--file", artifact(decisionMap(id, [row(), row({ work_action: "b" })])), "--creator", "producer", "--source", "work_research@1"]);
  const after = ts(["can-deploy", task]);
  const staleNamed = /STALE|stale build/.test(after.out);
  check("F", "when an upstream fact changes, a build recorded against the old game design is flagged stale",
    !/STALE|stale build/.test(before.out) && staleNamed,
    `before_had_stale=${/STALE/.test(before.out)} after_named=${staleNamed}`);
}

// --- G: concepts can be rejected and returned, without spending budget ------
{
  const id = "selftest-g";
  seed(id, null);
  const was = pipelineOf(id);
  const rej = pipe(["reject-concepts", id, "--reason", "仕事固有の判断が弱い", "--return-to", "WORK_RESEARCH"]);
  const now = pipelineOf(id);
  const budgetUntouched = now.repair_count === was.repair_count && now.redesign_count === was.redesign_count;
  const staled = now.artifacts.game_concepts.status === "STALE" && now.artifacts.final_game_design.status === "STALE";
  const returned = now.state === "GAME_CONCEPT_REJECTED" && now.current_stage === "WORK_RESEARCH";
  check("G", "GAME_CONCEPT_REJECTED returns to research, stales the concepts, and spends no repair budget",
    rej.status === 0 && budgetUntouched && staled && returned,
    `state=${now.state} stage=${now.current_stage} repair=${now.repair_count}/${now.redesign_count} concepts=${now.artifacts.game_concepts.status}`);
}

// --- H: a finding routes to its owner, not to whoever is nearest ------------
// A missing approved design is recorded on the BUILD task as a design_needed
// entry: it blocks release, but it must NOT change the task's status, because
// the build team cannot fix it and must not be parked waiting for someone else.
{
  const task = "selftest-h-build";
  ts(["create", task, "--type", "game-content", "--producer", "builder"]);
  const before = ts(["status", task]);
  const statusBefore = JSON.parse(before.out).status;
  ts(["design-needed", task, "--add", "DN-1", "--where", "src/x.tsx:1", "--note", "画面設計は Design Owner"]);
  const after = JSON.parse(ts(["status", task]).out);
  const dep = ts(["can-deploy", task]);
  const blocks = /unresolved design_needed/.test(dep.out);
  check("H", "a design-owner gap blocks release but never changes the build task's status (it is not the builder's to fix)",
    after.status === statusBefore && blocks && after.design_needed.length === 1,
    `status ${statusBefore} -> ${after.status}, blocks_release=${blocks}`);
}

// --- evidence + summary -----------------------------------------------------
const overall = results.every((r) => r.ok) ? "PASS" : "FAIL";
mkdirSync(dirname(EVIDENCE_OUT), { recursive: true });
writeFileSync(EVIDENCE_OUT, JSON.stringify({
  ran_at: new Date().toISOString(),
  script: "factory/harness/pipeline-self-test.mjs",
  scope: "RESEARCH -> GAME DESIGN -> DESIGN HANDOFF pipeline (v2 track) and its join to the build ledger",
  ledger: "scratch (JC_PIPELINE_ROOT + JC_TASKS_PATH) — the real factory/projects and factory/state/tasks.json are never read or written",
  results,
  overall,
}, null, 2) + "\n");
rmSync(scratch, { recursive: true, force: true });

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} sub-tests passed — overall ${overall}`);
console.log(`evidence: ${EVIDENCE_OUT.replace(ROOT + "/", "")}`);
process.exit(overall === "PASS" ? 0 : 1);
