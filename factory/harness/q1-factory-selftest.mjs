#!/usr/bin/env node
// Q1 Autonomous Game Factory — mechanical self-test, scenarios A-W
// (master request §29 Phase 1 A-J, §40 Phase 3 K-W). Every scenario runs
// the REAL scripts against fixture pipelines (game ids prefixed
// "selftest-"), then cleans them up. Fixture review evidence is
// synthesized in codex-review.mjs SHAPE only to exercise the validators
// and is deleted afterwards — it is never a real review and is never
// written where a gate could later read it as one.
//
// Usage: node factory/harness/q1-factory-selftest.mjs [--keep]
// Evidence: factory/state/selftests/q1-factory-selftest-<date>.json (+ .md)

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { REDESIGN_MAX, WIP_MAX_ACTIVE_PIPELINES } from "./q1-factory-schema.mjs";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HARNESS, "..", "..");
const PIPE = join(HARNESS, "q1-pipeline.mjs");
const TRIG = join(HARNESS, "q1-trigger.mjs");
const LEGACY = join(HARNESS, "q1-legacy-audit.mjs");
const TASK = join(HARNESS, "task-state.mjs");
const FIX = join(ROOT, "factory", "state", "selftests", "fixtures");
const OUT_DIR = join(ROOT, "factory", "state", "selftests");
const KEEP = process.argv.includes("--keep");
const DATE = new Date().toLocaleDateString("sv-SE"); // local YYYY-MM-DD

mkdirSync(FIX, { recursive: true });
const results = [];
let failed = 0;
function record(id, name, ok, detail, mode = "mechanical") {
  results.push({ id, name, ok, mode, detail });
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${name}${detail ? "  — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 220) : ""}`);
}
function run(script, a) {
  const r = spawnSync("node", [script, ...a], { cwd: ROOT, encoding: "utf8" });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* */ }
  return { status: r.status, json, stdout: r.stdout, stderr: r.stderr };
}
function fx(name, obj) {
  const f = join(FIX, name);
  writeFileSync(f, JSON.stringify(obj, null, 2));
  return f;
}
function pipeline(id) {
  return JSON.parse(readFileSync(join(ROOT, "factory", "projects", id, "q1-pipeline.json"), "utf8"));
}

// ------------------------------------------------------------ fixtures
const seed = (n) => ({ seed_id: `s${n}`, authentic_causal_loop: `loop ${n}`, player_action: "a", system_reaction: "r", information_gained: "i", next_judgment_or_action: "j", C_used: "C", D_expressed: "D", E_reached: "E", risks: "risk" });
const tr = (n, seedId = "s1") => ({ translation_id: `t${n}`, play_seed: seedId, goal: "g", first_visible_state: "f", primary_action: "p", C_interaction: "c", system_reaction: "r", information_gained: "i", player_next_judgment: "j", D_externalization: "d", E_consequence: "e", retry_or_rethink: "rr", job_reveal_bridge: "jr", strengths: "s", weaknesses: "w", risk: "k", adoption_or_rejection_reason: "why" });
const ART = {
  fact_sheet: { profession: "テスト職", sources: [{ url: "https://example.gov/x", type: "official_institution" }], who_or_what_they_serve: "x", representative_duties: ["a"], expertise: ["e"], tools: ["t"], information_used: ["i"], decisions: ["d"], outputs_or_value: "o", adjacent_profession_boundaries: "b", uncertainties: ["u"] },
  scope_core: { core: "core", scope: "scope", scope_is_representative_because: "because", profession_name_hidden_test: "pass" },
  ae: { A: "場所", B: "困りごと", C: "専門性", D: "思考過程", E: "解決の瞬間" },
  core_scope_check: { core_consistent: true, scope_representative: true, profession_name_hidden_test_pass: true, notes: "ok" },
  play_seeds: { seeds: [seed(1), seed(2), seed(3)] },
  reference_research: { references: [{ reference: "Portal", relevant_mechanic: "m", borrowed_principle: "p", surface_elements_not_to_copy: "s" }] },
  c_compression: { original_C: "orig", compressed_C: "comp", removed_complexity: "rc", reason_for_removal: "rr", preserved_D: "pd", how_player_still_performs_D: "h", failure_risk: "fr" },
  game_translations: { translations: [tr(1), tr(2, "s2"), tr(3, "s3")], adopted_translation_id: "t1", adoption_rationale: "best" },
  first_5_seconds: { zero_to_two_seconds: "a", two_to_five_seconds: "b", first_expected_touch: "c", first_system_reaction: "d", next_expected_inference: "e", next_expected_action: "f" },
  no_manual_exploit_check: { no_manual_check: { operation_before_rules: true, contextual_cue_only: true, pass: true }, exploit_check: { select_all: false, tap_all: false, spam_submit: false, fixed_failure_pattern: false, color_leak: false, label_leak: false, position_leak: false, visual_hierarchy_leak: false, pass: true } },
  core_back_check: { core_still_intact: true, scope_still_representative: true, d_still_performed_by_child: true, notes: "ok", pass: true },
  game_spec: { goal: "g", initial_visual_state: "v", interactive_objects: ["o"], primary_action: "p", C: "c", D: "d", system_reactions: ["r"], state_transitions: ["s"], failure_behavior: "f", retry_behavior: "r", E: "e", job_reveal: "j", first_5_seconds: "f5", no_manual_requirements: "nm", mobile_constraints: "375px", asset_requirements: ["scene"] },
  art_brief: { no_art_required: false, asset_purpose: "scene", scene: "a workshop", required_objects: ["bench", "lamp"], interactive_object_visual_hierarchy: ["lamp", "bench"], what_must_be_visually_obvious: ["the lamp is touchable"], what_must_not_be_baked_into_image: ["buttons", "labels"], required_state_variations: ["on", "off"], success_state: "lamp lit", failure_state: "dark", mobile_composition: "portrait safe area", clay_style_requirements: "clay", existing_series_references: ["public/assets/zoo/scene-zoo.png"], prohibited_mascot_invention: true, text_UI_separation: true, touch_affordance_requirements: ["lamp reads as a switch"] },
  art_brief_none: { no_art_required: true },
  art_production: { assets: [{ asset_id: "x_scene", path: "public/assets/x/scene.png", producer: "codex_imagegen", request_file: "factory/projects/x/art-requests/scene.json" }] },
  implementation: (specVersion) => ({ component_files: ["src/q1/XGame.tsx"], logic_module: "src/q1/xLogic.ts", qa_harness: "factory/harness/gameplay-qa-x.mjs", spec_version: specVersion, art_version_or_none: "none", d_preserved_statement: "D unchanged" }),
  implementation_qa: { first_5_seconds: true, touch_targets: true, mobile_375: true, direct_manipulation: true, reaction_timing: true, c_to_d: true, consequence: true, retry: true, answer_leak: false, brute_force: false, visual_affordance: true, no_manual: true, job_reveal: true, pass: true, evidence: "fixture" },
};
const reviewFixture = (verdict, extra = {}) => ({
  _fixture: "SELFTEST — NOT A REAL REVIEW (codex-review.mjs shape only)", ok: true, status: "OK", label: "selftest",
  verdict: { verdict, score: verdict === "PASS" ? 82 : 40, career_authenticity_score: verdict === "PASS" ? 85 : 55, game_quality_score: verdict === "PASS" ? 82 : 40, blockers: verdict === "PASS" ? [] : ["fixture blocker"], high: [], medium: [], low: [], evidence: ["fixture"], recommended_actions: [], ...extra },
  elapsed_sec: 1,
});
const PROMPT = fx("review-prompt.md", { note: "fixture prompt" });

const DESIGN_ORDER = ["fact_sheet", "scope_core", "ae", "core_scope_check", "play_seeds", "reference_research", "c_compression", "game_translations", "first_5_seconds", "no_manual_exploit_check", "core_back_check"];
function submitAll(id, upto = DESIGN_ORDER.length, overrides = {}) {
  const out = [];
  for (const t of DESIGN_ORDER.slice(0, upto)) {
    const payload = overrides[t] ?? ART[t];
    const r = run(PIPE, ["submit", id, t, "--file", fx(`${id}-${t}.json`, payload)]);
    out.push({ t, accepted: r.json?.accepted ?? false, problems: r.json?.problems ?? null });
  }
  return out;
}
const created = [];
function init(id, extra = []) {
  rmSync(join(ROOT, "factory", "projects", id), { recursive: true, force: true });
  const r = run(PIPE, ["init", id, "--profession", "テスト職", ...extra]);
  created.push(id);
  return r;
}

// ================================================================ PHASE 1
// A: play_seeds = 2 -> gate FAIL
{
  init("selftest-a");
  const r = run(PIPE, ["submit", "selftest-a", "play_seeds", "--file", fx("a-seeds.json", { seeds: [seed(1), seed(2)] })]);
  const g = run(PIPE, ["gate", "selftest-a"]);
  record("A", "play_seeds = 2 → artifact refused AND gate FAIL", r.status === 1 && r.json?.problems?.some((p) => /minimum is 3/.test(p)) && g.status === 1 && g.json.reasons.some((x) => x.id === "play_seeds_gte_3"), { submit: r.json?.problems, gate: g.json?.reasons?.find((x) => x.id === "play_seeds_gte_3") });
}
// B: preserved_D missing -> FAIL
{
  const { preserved_D, ...bad } = ART.c_compression;
  void preserved_D;
  const r = run(PIPE, ["submit", "selftest-a", "c_compression", "--file", fx("b-cc.json", bad)]);
  record("B", "preserved_D missing → c_compression refused", r.status === 1 && r.json?.problems?.some((p) => /preserved_D/.test(p)), r.json?.problems);
}
// C: game_translation = 1 -> FAIL
{
  const r = run(PIPE, ["submit", "selftest-a", "game_translations", "--file", fx("c-gt.json", { translations: [tr(1)], adopted_translation_id: "t1", adoption_rationale: "x" })]);
  record("C", "game_translations = 1 → refused (minimum 3)", r.status === 1 && r.json?.problems?.some((p) => /minimum is 3/.test(p)), r.json?.problems);
}
// D: First 5 Seconds missing -> gate FAIL
{
  init("selftest-d");
  submitAll("selftest-d", 8); // everything up to game_translations
  const g = run(PIPE, ["gate", "selftest-d"]);
  record("D", "First 5 Seconds missing → GAME_DESIGN_READY refused", g.status === 1 && g.json.reasons.some((x) => x.id === "first_5_seconds_complete"), g.json?.reasons?.map((x) => x.id));
}
// E: Independent Review FAIL -> GAME_DESIGN_READY impossible; non-canonical evidence refused
{
  init("selftest-e");
  submitAll("selftest-e");
  const failEv = fx("e-review-fail.json", reviewFixture("FAIL"));
  const r = run(PIPE, ["review", "selftest-e", "--evidence", failEv, "--input", PROMPT]);
  const g = run(PIPE, ["gate", "selftest-e"]);
  const bogus = fx("e-codex-task-shape.json", { ok: true, status: "OK", output: "looks fine, PASS" });
  const rb = run(PIPE, ["review", "selftest-e", "--evidence", bogus, "--input", PROMPT]);
  const notIndep = fx("e-review-pass.json", reviewFixture("PASS"));
  const rn = run(PIPE, ["review", "selftest-e", "--evidence", notIndep, "--input", PROMPT, "--reviewer", "claude-code", "--creator", "claude-code"]);
  const gn = run(PIPE, ["gate", "selftest-e"]);
  record("E", "review FAIL → gate refused; codex-task-shaped evidence refused; creator==reviewer never satisfies the gate", r.json?.review?.verdict === "FAIL" && g.status === 1 && g.json.reasons.some((x) => x.id === "independent_review_pass") && rb.status === 1 && rn.json?.review?.independent === false && gn.status === 1, { fail_gate: g.json?.reasons?.find((x) => x.id === "independent_review_pass"), bogus: rb.json?.reason, not_independent: rn.json?.review?.independent });
}
// F: FIRST_ACTION_NOT_INFERABLE -> RETURN to FIRST_PLAY_UX
{
  const ev = fx("f-ev.json", reviewFixture("FAIL"));
  const r = run(PIPE, ["fail", "selftest-e", "--code", "FIRST_ACTION_NOT_INFERABLE", "--reason", "child could not find the first touch", "--evidence", ev]);
  const p = pipeline("selftest-e");
  record("F", "FIRST_ACTION_NOT_INFERABLE → return_to FIRST_PLAY_UX, state REPAIRING, repair_count 1", r.json?.failure?.return_to === "FIRST_PLAY_UX" && p.state === "REPAIRING" && p.current_stage === "FIRST_PLAY_UX" && p.repair_count === 1, r.json?.decision);
}
// G: PERIPHERAL_JOB_TASK -> RETURN to SCOPE/CORE
{
  init("selftest-g");
  submitAll("selftest-g", 3);
  const ev = fx("g-ev.json", reviewFixture("FAIL"));
  const r = run(PIPE, ["fail", "selftest-g", "--code", "PERIPHERAL_JOB_TASK", "--reason", "scope is a peripheral duty", "--evidence", ev]);
  const bad = run(PIPE, ["fail", "selftest-g", "--code", "PERIPHERAL_JOB_TASK", "--reason", "x", "--evidence", ev, "--return-to", "ART_BRIEF"]);
  record("G", "PERIPHERAL_JOB_TASK → return_to SCOPE_CORE; an off-table return_to is refused", r.json?.failure?.return_to === "SCOPE_CORE" && pipeline("selftest-g").current_stage === "SCOPE_CORE" && bad.status === 1, { route: r.json?.failure?.return_to, refused: bad.json?.reason });
}
// H: repair_count limit -> REDESIGN, not another local repair; redesign budget -> ESCALATED
{
  init("selftest-h");
  submitAll("selftest-h");
  const ev = fx("h-ev.json", reviewFixture("FAIL"));
  const f1 = run(PIPE, ["fail", "selftest-h", "--code", "BRUTE_FORCE_SUCCESS", "--reason", "select-all wins", "--evidence", ev]);
  run(PIPE, ["repair-done", "selftest-h", "--note", "patched"]);
  const f2 = run(PIPE, ["fail", "selftest-h", "--code", "BRUTE_FORCE_SUCCESS", "--reason", "still wins", "--evidence", ev]);
  const sameT = run(PIPE, ["redesign", "selftest-h", "--translation", "t1", "--reason", "retry same idea"]);
  const rd1 = run(PIPE, ["redesign", "selftest-h", "--translation", "t2", "--reason", "different translation"]);
  const p1 = pipeline("selftest-h");
  // exhaust the redesign budget
  let last = null;
  for (let i = p1.redesign_count; i < REDESIGN_MAX; i++) last = run(PIPE, ["redesign", "selftest-h", "--seed", "s3", "--reason", `redesign ${i + 2}`]);
  const over = run(PIPE, ["redesign", "selftest-h", "--seed", "s2", "--reason", "one too many"]);
  const p2 = pipeline("selftest-h");
  record("H", "repair 1 allowed; 2nd FAIL → REDESIGN_REQUIRED (no 2nd repair); same translation refused; different translation → iteration 2 / repair_count 0; redesign beyond budget → ESCALATED",
    f1.json?.decision?.action === "REPAIR" && f2.json?.decision?.action === "REDESIGN_REQUIRED" && sameT.status === 1 && rd1.json?.design_iteration === 2 && rd1.json?.repair_count === 0 && over.status === 1 && p2.state === "ESCALATED",
    { f2: f2.json?.decision?.action, same_translation: sameT.json?.reason, redesign_count: p2.redesign_count, final_state: p2.state, last_ok: last?.status });
}
// I: Legacy Q1 -> reverse audit -> classification -> rebuild queue
{
  const ra = fx("i-reverse-audit.json", {
    game_type: "selftest_legacy_game", current_profession: "テスト職", current_SCOPE: "s", current_CORE: "c", current_A: "a", current_B: "b", current_C: "c", current_D: "d", current_E: "e",
    actual_first_screen: "f", actual_player_actions: "p", actual_feedback: "fb", actual_next_decision: "n", actual_success_path: "sp", actual_failure_path: "fp",
    prerequisite_explanation: "none", answer_leak: true, brute_force: true, profession_reveal: "unconditional", classification: "GAME_TRANSLATION_REBUILD", priority_reasons: ["answer_leak", "brute_force_exploit"],
    audit_scores: { game_quality: 30, career_authenticity: 50 },
  });
  const rec = run(LEGACY, ["record", "--file", ra]);
  const q = run(LEGACY, ["queue"]);
  const queue = JSON.parse(readFileSync(join(ROOT, "factory", "state", "legacy", "rebuild-queue.json"), "utf8"));
  const item = queue.items.find((i) => i.game_type === "selftest_legacy_game");
  const badRa = run(LEGACY, ["record", "--file", fx("i-bad.json", { game_type: "x", classification: "NOT_A_CLASS" })]);
  record("I", "reverse audit recorded → classified → in prioritized queue with entry_stage; malformed audit refused", rec.json?.accepted === true && item && item.entry_stage === "GAME_TRANSLATION" && item.status === "queued" && badRa.status === 1, { item, refused: badRa.json?.problems?.slice(0, 3), queued_total: q.json?.total });
}
// J: Human Decision domain -> autonomous completion blocked
{
  init("selftest-j");
  submitAll("selftest-j");
  const okEv = fx("j-review-pass.json", reviewFixture("PASS"));
  run(PIPE, ["review", "selftest-j", "--evidence", okEv, "--input", PROMPT]);
  const g0 = run(PIPE, ["gate", "selftest-j"]);
  const hd = run(PIPE, ["human-decision", "selftest-j", "--domain", "mascot", "--note", "the translation needs a guide character"]);
  const g1 = run(PIPE, ["gate", "selftest-j"]);
  const blockedSubmit = run(PIPE, ["submit", "selftest-j", "first_5_seconds", "--file", fx("j-f5.json", ART.first_5_seconds)]);
  const res = run(PIPE, ["resolve-human-decision", "selftest-j", "--id", hd.json.human_decision.id, "--note", "Human: no mascot; use an existing tool object"]);
  const g2 = run(PIPE, ["gate", "selftest-j"]);
  record("J", "open Human Decision (mascot) blocks gate and submissions; resolving it re-enables the gate", g0.status === 0 && g1.status === 1 && g1.json.reasons.some((x) => x.id === "unresolved_human_decision_false") && blockedSubmit.status === 1 && res.json?.accepted && g2.status === 0, { before: g0.json?.allowed, during: g1.json?.reasons?.map((x) => x.id), after: g2.json?.allowed });
}

// ================================================================ PHASE 3
// K: GAME_DESIGN_READY -> Game Spec
{
  init("selftest-k");
  submitAll("selftest-k");
  run(PIPE, ["review", "selftest-k", "--evidence", fx("k-pass.json", reviewFixture("PASS")), "--input", PROMPT]);
  const g = run(PIPE, ["gate", "selftest-k"]);
  const spec = run(PIPE, ["submit", "selftest-k", "game_spec", "--file", fx("k-spec.json", ART.game_spec), "--source", "game_translations@1"]);
  const p = pipeline("selftest-k");
  record("K", "GAME_DESIGN_READY → game_spec accepted with provenance to game_translations@1 → SPEC_READY", g.status === 0 && spec.json?.accepted && p.state === "SPEC_READY" && p.artifacts.game_spec.source_artifacts.includes("selftest-k:game_translations:v1"), { state: p.state, sources: p.artifacts.game_spec.source_artifacts });
}
// L: Game Spec -> Art Brief or no-art-required
{
  const noArt = run(PIPE, ["submit", "selftest-k", "art_brief", "--file", fx("l-noart.json", ART.art_brief_none)]);
  const rr = run(PIPE, ["release-ready", "selftest-k"]);
  const isArt = (x) => /art_brief|art_production|art review/.test(x);
  const artReasons = rr.json.reasons.filter(isArt);
  const brief = run(PIPE, ["submit", "selftest-k", "art_brief", "--file", fx("l-brief.json", ART.art_brief), "--source", "game_spec@1"]);
  const rr2 = run(PIPE, ["release-ready", "selftest-k"]);
  record("L", "no_art_required:true satisfies the art condition; a real brief then requires art_production + independent art review", noArt.json?.accepted && artReasons.length === 0 && brief.json?.accepted && rr2.json.reasons.some((x) => /art_production/.test(x)), { after_no_art: artReasons, after_brief: rr2.json.reasons.filter(isArt) });
}
// M: Art Brief -> producer receives interaction requirements
{
  const ar = run(PIPE, ["art-request", "selftest-k"]);
  const file = ar.json?.file ? JSON.parse(readFileSync(join(ROOT, ar.json.file), "utf8")) : null;
  const ok = file && /Touch affordance: lamp reads as a switch/.test(file.composition) && /hierarchy: lamp > bench/.test(file.composition) && file.forbidden_objects.includes("buttons") && file.output_path.endsWith("scene.png") && file.provenance.art_brief.endsWith(":art_brief:v2");
  record("M", "art_brief → art-requests/*.json in art-loop.mjs format carrying touch affordance, hierarchy, forbidden bake-ins, provenance", !!ok, { file: ar.json?.file, composition: file?.composition?.slice(0, 120), forbidden: file?.forbidden_objects });
}
// N: Art Review FAIL -> RETURN to ART
{
  run(PIPE, ["submit", "selftest-k", "art_production", "--file", fx("n-prod.json", ART.art_production), "--source", "art_brief@2"]);
  const selfPass = run(PIPE, ["art-review", "selftest-k", "--evidence", fx("n-ev.json", { fixture: true }), "--reviewer", "codex_imagegen", "--producer", "codex_imagegen", "--pass"]);
  const failRev = run(PIPE, ["art-review", "selftest-k", "--evidence", fx("n-ev2.json", { fixture: true, verdict: "FAIL" }), "--reviewer", "codex-vision-critic", "--producer", "codex_imagegen", "--fail", "--code", "ART_ANSWER_LEAK"]);
  const p = pipeline("selftest-k");
  record("N", "self-review (reviewer==producer) cannot approve art; art review FAIL routes back to ART_BRIEF", selfPass.status === 1 && selfPass.json?.art_review?.independent === false && failRev.json?.state === "REPAIRING" && p.current_stage === "ART_BRIEF", { self: selfPass.json?.note, fail_route: p.failures.at(-1)?.return_to });
}
// O: Implementation QA first-play FAIL -> routed by cause
{
  init("selftest-o");
  const ev = fx("o-ev.json", reviewFixture("FAIL"));
  const a = run(TRIG, ["fire", "QA_FAILURE", "--game-id", "selftest-o", "--code", "FIRST_PLAY_FAIL_DESPITE_CORRECT_IMPLEMENTATION", "--reason", "child stuck on first screen", "--evidence", ev]);
  const b = run(TRIG, ["fire", "QA_FAILURE", "--game-id", "selftest-o", "--code", "VISUAL_AFFORDANCE_FAILURE", "--reason", "lamp does not read as touchable", "--evidence", ev]);
  init("selftest-o2");
  const c = run(TRIG, ["fire", "QA_FAILURE", "--game-id", "selftest-o2", "--code", "IMPLEMENTATION_CHANGED_D", "--reason", "impl auto-solves", "--evidence", ev]);
  record("O", "QA_FAILURE routes by cause: FIRST_PLAY→FIRST_PLAY_UX, VISUAL_AFFORDANCE→ART_BRIEF, IMPLEMENTATION_CHANGED_D→IMPLEMENTATION", a.json?.failure?.return_to === "FIRST_PLAY_UX" && b.json?.failure?.return_to === "ART_BRIEF" && c.json?.failure?.return_to === "IMPLEMENTATION", { a: a.json?.failure?.return_to, b: b.json?.failure?.return_to, c: c.json?.failure?.return_to });
}
// P: Independent Review FAIL -> Release impossible
{
  const r = run(PIPE, ["review", "selftest-k", "--evidence", fx("p-fail.json", reviewFixture("FAIL")), "--input", PROMPT, "--kind", "implementation"]);
  const rr = run(PIPE, ["release-ready", "selftest-k"]);
  record("P", "implementation review FAIL → release-ready refused", r.json?.review?.verdict === "FAIL" && rr.status === 1 && rr.json.reasons.some((x) => /implementation review/.test(x)), rr.json?.reasons?.filter((x) => /review/.test(x)));
}
// Q: all gates PASS -> Release Candidate (delegating to task-state can-deploy)
let qTask = "selftest-q1-release";
{
  init("selftest-q");
  submitAll("selftest-q");
  run(PIPE, ["review", "selftest-q", "--evidence", fx("q-pass.json", reviewFixture("PASS")), "--input", PROMPT]);
  run(PIPE, ["gate", "selftest-q"]);
  run(PIPE, ["submit", "selftest-q", "game_spec", "--file", fx("q-spec.json", ART.game_spec), "--source", "game_translations@1"]);
  run(PIPE, ["submit", "selftest-q", "art_brief", "--file", fx("q-noart.json", ART.art_brief_none), "--source", "game_spec@1"]);
  run(PIPE, ["submit", "selftest-q", "implementation", "--file", fx("q-impl.json", ART.implementation(1)), "--source", "game_spec@1"]);
  run(PIPE, ["submit", "selftest-q", "implementation_qa", "--file", fx("q-iqa.json", ART.implementation_qa), "--source", "implementation@1"]);
  run(PIPE, ["review", "selftest-q", "--evidence", fx("q-impl-pass.json", reviewFixture("PASS")), "--input", PROMPT, "--kind", "implementation"]);
  const noTask = run(PIPE, ["release-ready", "selftest-q"]);
  run(TASK, ["create", qTask, "--type", "game-content", "--identity-impact", "NONE", "--review-required"]);
  run(TASK, ["set-qa", qTask, "PASS", "--evidence", "selftest fixture"]);
  run(TASK, ["set-review", qTask, "PASS", "--evidence", fx("q-task-review.json", reviewFixture("PASS"))]);
  run(PIPE, ["link-task", "selftest-q", qTask]);
  const rr = run(PIPE, ["release-ready", "selftest-q"]);
  const p = pipeline("selftest-q");
  record("Q", "all design+spec+art(none)+impl+QA+reviews PASS and linked task passes can-deploy → RELEASE_CANDIDATE; without a linked task it is refused", noTask.status === 1 && rr.status === 0 && p.state === "RELEASE_CANDIDATE", { without_task: noTask.json?.reasons?.slice(0, 2), with_task: rr.json?.allowed, state: p.state });
}
// R: Product Identity issue -> autonomous Deploy blocked
{
  run(TASK, ["set-identity-impact", qTask, "YES"]);
  const rr = run(PIPE, ["release-ready", "selftest-q"]);
  const blocked = rr.status === 1 && rr.json.reasons.some((x) => /product_identity_impact=YES/.test(x));
  run(TASK, ["approve-identity-impact", qTask, "--note", "SELFTEST fixture approval — not a real Human Decision"]);
  const rr2 = run(PIPE, ["release-ready", "selftest-q"]);
  record("R", "product_identity_impact=YES without approval blocks release-ready (via task-state can-deploy); an explicit approval record clears it", blocked && rr2.status === 0, { blocked_reason: rr.json?.reasons?.find((x) => /identity/.test(x)) });
}
// S: Legacy Q1 -> Audit -> Rebuild -> Game Design -> downstream handoff (backfill)
{
  // by now several fixture pipelines are ACTIVE, so the WIP limit must refuse a plain start...
  const wipRefused = run(LEGACY, ["start", "selftest_legacy_game", "--game-id", "selftest-s", "--backfill"]);
  // ...and --force (an explicit, logged override) opens it.
  const st = run(LEGACY, ["start", "selftest_legacy_game", "--game-id", "selftest-s", "--backfill", "--force"]);
  created.push("selftest-s");
  const p = existsSync(join(ROOT, "factory", "projects", "selftest-s", "q1-pipeline.json")) ? pipeline("selftest-s") : null;
  const ok = wipRefused.status === 1 && /WIP full/.test(wipRefused.json?.reason ?? "") && p && p.legacy_game_type === "selftest_legacy_game" && p.current_stage === "GAME_TRANSLATION" && p.artifacts.fact_sheet?.creator === "reverse-audit" && p.artifacts.ae?.version === 1 && !p.artifacts.game_translations && p.task_id === "q1-rebuild-selftest-legacy-game";
  record("S", "legacy start refused while WIP is full; forced start opens the pipeline at the classification's entry stage with upstream artifacts backfilled from the reverse audit (creator=reverse-audit), downstream left empty", !!ok, { wip_refusal: wipRefused.json?.reason, backfilled: st.json?.backfilled?.map((b) => `${b.type}:${b.accepted}`), current_stage: p?.current_stage, task: p?.task_id });
}
// T: Evidence chain reconstructable
{
  const p = pipeline("selftest-h");
  const chain = {
    why_scope: p.artifacts.scope_core?.payload?.scope_is_representative_because,
    core: p.artifacts.scope_core?.payload?.core,
    ae: p.artifacts.ae?.payload,
    seeds_considered: p.artifacts.play_seeds?.payload?.seeds?.map((s) => s.seed_id),
    translations_considered: p.artifacts.game_translations?.payload?.translations?.map((t) => t.translation_id),
    adopted: p.artifacts.game_translations?.payload?.adopted_translation_id,
    rejected_why: p.artifacts.game_translations?.payload?.translations?.filter((t) => t.translation_id !== p.artifacts.game_translations.payload.adopted_translation_id).map((t) => [t.translation_id, t.adoption_or_rejection_reason]),
    c_compression: { original: p.artifacts.c_compression?.payload?.original_C, compressed: p.artifacts.c_compression?.payload?.compressed_C, preserved_D: p.artifacts.c_compression?.payload?.preserved_D },
    creators: Object.fromEntries(Object.entries(p.artifacts).map(([k, a]) => [k, a.creator])),
    failures: p.failures.map((f) => [f.failure_code, f.return_to]),
    redesigns: (p.redesign ?? []).map((r) => [r.from_iteration, r.to_iteration, r.translation ?? r.seed]),
    events: p.history.map((h) => h.event),
  };
  const ok = chain.seeds_considered?.length === 3 && chain.translations_considered?.length === 3 && chain.adopted === "t1" && chain.failures.length === 2 && chain.redesigns.length >= 1 && chain.events.includes("failure_routed") && chain.events.includes("redesign_started") && Object.values(chain.creators).every(Boolean);
  record("T", "design rationale (scope why / core / A-E / seeds considered / adopted+rejected translations / C compression / creators / failures / redesigns) reconstructable from q1-pipeline.json alone", ok, { adopted: chain.adopted, failures: chain.failures, redesigns: chain.redesigns, events: [...new Set(chain.events)] });
}
// U: upstream artifact version bump -> downstream STALE
{
  init("selftest-u");
  submitAll("selftest-u");
  run(PIPE, ["review", "selftest-u", "--evidence", fx("u-pass.json", reviewFixture("PASS")), "--input", PROMPT]);
  const g0 = run(PIPE, ["gate", "selftest-u"]);
  const bump = run(PIPE, ["submit", "selftest-u", "scope_core", "--file", fx("u-core2.json", { ...ART.scope_core, core: "CORE v2" })]);
  const stale = run(PIPE, ["stale", "selftest-u"]);
  const g1 = run(PIPE, ["gate", "selftest-u"]);
  const staleTypes = stale.json.stale.map((s) => s.type);
  const onStale = run(PIPE, ["submit", "selftest-u", "game_translations", "--file", fx("u-gt.json", ART.game_translations), "--source", "play_seeds@1"]);
  record("U", "scope_core v1→v2 marks ae/play_seeds/…/game_translations STALE + review stale; gate refused; building on a STALE source is refused", g0.status === 0 && bump.json?.invalidated?.includes("game_translations") && staleTypes.includes("ae") && staleTypes.includes("game_translations") && stale.json.review_stale === true && g1.status === 1 && onStale.status === 1, { invalidated: bump.json?.invalidated, refused_on_stale: onStale.json?.reason });
}
// V: major Real User Evidence -> completed game RETURNS to the appropriate stage
{
  run(PIPE, ["set-version", "selftest-q", "stable-selftest-v1"]);
  const p0 = pipeline("selftest-q");
  const bad = run(TRIG, ["evidence", "--file", fx("v-bad.json", { evidence_id: "ev-selftest-0", game_id: "selftest-q", version: "stable-selftest-v1", observation: "same text", interpretation: "same text", severity: "HIGH", affected_stage: "FIRST_PLAY_UX", suggested_failure_code: "FIRST_ACTION_NOT_INFERABLE", source_context: "playtest_session", status: "new" })]);
  const low = run(TRIG, ["evidence", "--file", fx("v-low.json", { evidence_id: "ev-selftest-1", game_id: "selftest-q", version: "stable-selftest-v1", observation: "child asked what a word meant", interpretation: "one term may need furigana", severity: "LOW", affected_stage: "IMPLEMENTATION", suggested_failure_code: "IMPLEMENTATION_CHANGED_D", source_context: "home_with_parent", status: "new" })]);
  const high = run(TRIG, ["evidence", "--file", fx("v-high.json", { evidence_id: "ev-selftest-2", game_id: "selftest-q", version: "stable-selftest-v1", observation: "初見の子どもが20秒間操作を開始できなかった", interpretation: "first action is not inferable from the first visible state", severity: "HIGH", affected_stage: "FIRST_PLAY_UX", suggested_failure_code: "FIRST_ACTION_NOT_INFERABLE", source_context: "playtest_session", status: "new" })]);
  const p1 = pipeline("selftest-q");
  record("V", "evidence with observation==interpretation refused; LOW is logged only; HIGH on a RELEASED game returns it to FIRST_PLAY_UX (state REPAIRING)", p0.state === "RELEASED" && bad.status === 1 && low.json?.routing?.action === "LOGGED_ONLY" && high.json?.routing?.action === "RETURNED_TO_STAGE" && high.json.routing.return_to === "FIRST_PLAY_UX" && p1.state === "REPAIRING", { bad: bad.json?.problems?.[0], low: low.json?.routing?.action, high: high.json?.routing });
}
// W: actionable legacy task + WIP available -> not idle
{
  // free WIP: escalate/park the fixtures that are still active so the count is measurable
  const beforeWip = run(TRIG, ["wip"]).json;
  const nx = run(TRIG, ["next"]);
  const hasLegacy = nx.json?.candidates?.some((c) => c.kind === "start_legacy_rebuild" && c.game_type === "selftest_legacy_game") || nx.json?.candidates?.some((c) => c.kind === "resume_pipeline");
  record("W", "`next` never reports idle while a queued legacy item or a returned pipeline exists; WIP limit is reported and enforced at start", hasLegacy && nx.json?.idle === false && typeof beforeWip.limit === "number" && beforeWip.limit === WIP_MAX_ACTIVE_PIPELINES, { next: nx.json?.next, wip: beforeWip });
}

// ================================================================ 2026-09-09 regressions (leak-detective E2E gaps)
// X: downstream artifact versions never stale the DESIGN review; a design-stage artifact does
{
  init("selftest-x");
  submitAll("selftest-x");
  run(PIPE, ["review", "selftest-x", "--evidence", fx("x-pass.json", reviewFixture("PASS")), "--input", PROMPT]);
  const g = run(PIPE, ["gate", "selftest-x"]);
  run(PIPE, ["submit", "selftest-x", "game_spec", "--file", fx("x-spec1.json", ART.game_spec), "--source", "game_translations@1"]);
  const spec2 = run(PIPE, ["submit", "selftest-x", "game_spec", "--file", fx("x-spec2.json", { ...ART.game_spec, goal: "g2" }), "--source", "game_translations@1"]);
  const afterSpec = pipeline("selftest-x");
  const cbc2 = run(PIPE, ["submit", "selftest-x", "core_back_check", "--file", fx("x-cbc2.json", { ...ART.core_back_check, notes: "v2" }), "--source", "game_translations@1"]);
  const afterDesign = pipeline("selftest-x");
  record("X", "game_spec v1→v2 (downstream) keeps the design review non-stale; core_back_check v1→v2 (design stage) stales it", g.status === 0 && spec2.status === 0 && !spec2.json.invalidated.includes("independent_review") && afterSpec.independent_review.stale === false && cbc2.json?.invalidated?.includes("independent_review") && afterDesign.independent_review.stale === true, { spec2_invalidated: spec2.json?.invalidated, cbc2_invalidated: cbc2.json?.invalidated });
}
// Y: art-review --pass during an implementation repair records the verdict but does NOT overwrite the state
{
  init("selftest-y");
  submitAll("selftest-y");
  run(PIPE, ["review", "selftest-y", "--evidence", fx("y-pass.json", reviewFixture("PASS")), "--input", PROMPT]);
  run(PIPE, ["gate", "selftest-y"]);
  run(PIPE, ["submit", "selftest-y", "game_spec", "--file", fx("y-spec.json", ART.game_spec), "--source", "game_translations@1"]);
  run(PIPE, ["submit", "selftest-y", "art_brief", "--file", fx("y-brief.json", ART.art_brief), "--source", "game_spec@1"]);
  run(PIPE, ["submit", "selftest-y", "art_production", "--file", fx("y-prod.json", ART.art_production), "--source", "art_brief@1"]);
  const ok = run(PIPE, ["art-review", "selftest-y", "--evidence", fx("y-ev.json", { fixture: true }), "--reviewer", "art-qa", "--producer", "codex_imagegen", "--pass"]);
  run(PIPE, ["submit", "selftest-y", "implementation", "--file", fx("y-impl.json", ART.implementation(1)), "--source", "game_spec@1"]);
  const f = run(PIPE, ["fail", "selftest-y", "--code", "IMPLEMENTATION_CHANGED_D", "--reason", "fixture", "--evidence", fx("y-fail.json", { fixture: true })]);
  const again = run(PIPE, ["art-review", "selftest-y", "--evidence", fx("y-ev2.json", { fixture: true }), "--reviewer", "art-qa", "--producer", "codex_imagegen", "--pass"]);
  const p1 = pipeline("selftest-y");
  const rd = run(PIPE, ["repair-done", "selftest-y", "--note", "fixture repair"]);
  record("Y", "art-review PASS moves ART_PRODUCED→ART_APPROVED, but during REPAIRING it keeps the state (state_kept) so repair-done still works", ok.json?.state === "ART_APPROVED" && f.json?.state === "REPAIRING" && again.status === 0 && again.json?.state_kept === true && p1.state === "REPAIRING" && p1.art_review?.verdict === "PASS" && rd.status === 0 && rd.json?.state === "UNDER_REVIEW", { first: ok.json?.state, during_repair: again.json?.state, repair_done: rd.json?.state });
}
// Z: Limited Human Exception — non-PI, scoped, capped: resets repair budget only, cap enforced → ESCALATED, redesign untouched, no precedent
{
  init("selftest-z");
  submitAll("selftest-z");
  const noDomain = run(PIPE, ["human-decision", "selftest-z", "--note", "missing domain and kind"]);
  run(PIPE, ["escalate", "selftest-z", "--reason", "fixture: budgets exhausted"]);
  const before = pipeline("selftest-z");
  const open = run(PIPE, ["human-decision", "selftest-z", "--kind", "limited_exception", "--scope", "display-only silent state", "--repairs", "1", "--note", "human grants one scoped repair"]);
  const frozen = run(PIPE, ["submit", "selftest-z", "core_back_check", "--file", fx("z-cbc.json", { ...ART.core_back_check, notes: "v2" }), "--source", "game_translations@1"]);
  const res = run(PIPE, ["resolve-human-decision", "selftest-z", "--id", open.json?.human_decision?.id, "--note", "Human: granted, not a precedent"]);
  const p1 = pipeline("selftest-z");
  const f1 = run(PIPE, ["fail", "selftest-z", "--code", "FACTUAL_PROFESSION_ERROR", "--reason", "fixture", "--evidence", fx("z-f1.json", { fixture: true })]);
  run(PIPE, ["repair-done", "selftest-z", "--note", "fixture repair"]);
  const f2 = run(PIPE, ["fail", "selftest-z", "--code", "FACTUAL_PROFESSION_ERROR", "--reason", "fixture again", "--evidence", fx("z-f2.json", { fixture: true })]);
  const p2 = pipeline("selftest-z");
  record("Z", "limited_exception: needs --scope; blocks submit while open; resolve resets repair_count only (redesign_count unchanged); 1 scoped REPAIR then ESCALATED again (no redesign under the exception); recorded with precedent:false", noDomain.status === 2 && open.status === 0 && open.json?.human_decision?.kind === "limited_exception" && frozen.status === 1 && res.status === 0 && p1.state === "RETURNED" && p1.repair_count === 0 && p1.redesign_count === before.redesign_count && p1.limited_exceptions?.[0]?.precedent === false && f1.json?.decision?.action === "REPAIR" && f1.json?.decision?.limited_exception?.repairs_used === 1 && f2.status === 1 && f2.json?.decision?.action === "ESCALATED" && p2.state === "ESCALATED" && p2.limited_exceptions?.[0]?.status === "exhausted", { f1: f1.json?.decision, f2: f2.json?.decision, redesign: [before.redesign_count, p1.redesign_count] });
}

// AA (2026-09-09): a legacy game parked behind a Human Decision (BLOCKED task) is never proposed by `next` nor started
{
  run(TASK, ["create", "q1-improve-selftest-legacy-game", "--type", "game-content", "--identity-impact", "NONE"]);
  run(TASK, ["set-status", "q1-improve-selftest-legacy-game", "BLOCKED", "--note", "fixture: Human Decision pending"]);
  run(LEGACY, ["queue"]);
  const q = JSON.parse(readFileSync(join(ROOT, "factory", "state", "legacy", "rebuild-queue.json"), "utf8"));
  const item = q.items.find((i) => i.game_type === "selftest_legacy_game");
  const nx = run(TRIG, ["next"]);
  const proposed = nx.json?.candidates?.some((c) => c.game_type === "selftest_legacy_game");
  const st = run(LEGACY, ["start", "selftest_legacy_game", "--game-id", "selftest-parked", "--force"]);
  run(TASK, ["set-status", "q1-improve-selftest-legacy-game", "SUPERSEDED", "--note", "q1-factory self-test fixture, not real work"]);
  run(LEGACY, ["queue"]);
  record("AA", "legacy item with a BLOCKED (Human Decision) task is parked_human_decision in the queue, not proposed by next, and start refuses it even with --force", item?.status === "parked_human_decision" && proposed === false && st.status === 1 && /parked pending a Human Decision/.test(st.json?.reason ?? ""), { item_status: item?.status, parked_reason: item?.parked_reason, start: st.json?.reason });
}

// ================================================================ cleanup
if (!KEEP) {
  for (const id of new Set(created)) rmSync(join(ROOT, "factory", "projects", id), { recursive: true, force: true });
  const idxPath = join(ROOT, "factory", "state", "q1-pipeline-index.json");
  if (existsSync(idxPath)) {
    const idx = JSON.parse(readFileSync(idxPath, "utf8"));
    for (const k of Object.keys(idx.pipelines)) if (k.startsWith("selftest-")) delete idx.pipelines[k];
    writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n");
  }
  // legacy fixture: remove the reverse audit and rebuild the queue
  rmSync(join(ROOT, "factory", "state", "legacy", "reverse-audits", "selftest_legacy_game.json"), { force: true });
  run(LEGACY, ["queue"]);
  // tasks: mark fixtures SUPERSEDED (same convention as enforcement-foundation self-test)
  const tasks = JSON.parse(readFileSync(join(ROOT, "factory", "state", "tasks.json"), "utf8")).tasks;
  for (const id of Object.keys(tasks)) {
    if (id.startsWith("selftest-q1-") || id === "q1-rebuild-selftest-legacy-game" || id === "q1-improve-selftest-legacy-game" || id.startsWith("q1-new-selftest-")) {
      if (tasks[id].status !== "SUPERSEDED") run(TASK, ["set-status", id, "SUPERSEDED", "--note", `q1-factory self-test fixture ${DATE}, not real work`]);
    }
  }
  // evidence log: strip selftest evidence lines
  const evLog = join(ROOT, "factory", "state", "feedback", "real-user-evidence.jsonl");
  if (existsSync(evLog)) writeFileSync(evLog, readFileSync(evLog, "utf8").split("\n").filter((l) => l && !/ev-selftest-/.test(l)).map((l) => l + "\n").join(""));
  const trLog = join(ROOT, "factory", "state", "q1-trigger-log.jsonl");
  if (existsSync(trLog)) writeFileSync(trLog, readFileSync(trLog, "utf8").split("\n").filter((l) => l && !/selftest/.test(l)).map((l) => l + "\n").join(""));
  rmSync(FIX, { recursive: true, force: true });
}

// ================================================================ evidence
mkdirSync(OUT_DIR, { recursive: true });
const summary = { ran_at: new Date().toISOString(), passed: results.filter((r) => r.ok).length, failed, total: results.length, results, cleanup: KEEP ? "kept (--keep)" : "fixtures removed; fixture tasks marked SUPERSEDED" };
writeFileSync(join(OUT_DIR, `q1-factory-selftest-${DATE}.json`), JSON.stringify(summary, null, 2) + "\n");
writeFileSync(join(OUT_DIR, `q1-factory-selftest-${DATE}.md`), [
  `# Q1 Factory self-test — ${DATE}`, "",
  `Scenarios A-W from the 2026-09-08 master request (§29, §40) plus X-Z, AA (2026-09-09 leak-detective E2E gap regressions: parked legacy items never auto-started, design-review staleness scope, art-review state protection, Limited Human Exception cap), run against the real scripts with fixture pipelines (game ids \`selftest-*\`, removed afterwards). Fixture review evidence is codex-review.mjs SHAPED ONLY (never a real review) and is deleted after the run.`, "",
  `Result: **${summary.passed}/${summary.total} PASS**${failed ? ` (${failed} FAIL)` : ""}`, "",
  "| id | scenario | result | mode |", "|---|---|---|---|",
  ...results.map((r) => `| ${r.id} | ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${r.mode} |`), "",
  "Mechanically executed: every scenario above invoked `q1-pipeline.mjs` / `q1-trigger.mjs` / `q1-legacy-audit.mjs` / `task-state.mjs` for real and asserted on their exit codes and JSON output. Not exercised here (dry-run by design): a real Codex review, real image generation, a real browser QA run, and a real `git push` — those are exercised by the NEW Q1 demonstration and the release path respectively.", "",
].join("\n"));
console.log(`\n${summary.passed}/${summary.total} passed; evidence: factory/state/selftests/q1-factory-selftest-${DATE}.json`);
process.exit(failed ? 1 : 0);
