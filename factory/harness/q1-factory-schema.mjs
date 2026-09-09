// Q1 Autonomous Game Factory — shared, mechanical definitions.
// 2026-09-08 (Human master request "Q1 AUTONOMOUS GAME FACTORY — END-TO-END
// IMPLEMENTATION"). This module is DATA + pure validators only: the stage
// order, the design state machine, the failure→return_to routing table,
// the artifact schemas (required fields), the GAME_DESIGN_READY checklist,
// the Human Decision domains, and the finite repair/redesign budgets.
// Every other q1-*.mjs script imports from here so the rules are encoded
// in exactly one place (same principle as review-evidence.mjs).
//
// Nothing here calls Claude/Codex or touches the filesystem.

// ---------------------------------------------------------------- stages
// Upstream design stages, in pipeline order. `artifact` is the artifact
// type each stage produces (see ARTIFACT_SCHEMAS). Stages without an
// artifact are pure gates/reviews.
export const DESIGN_STAGES = [
  { id: "PROFESSION_RESEARCH", artifact: "fact_sheet" },
  { id: "SCOPE_CORE", artifact: "scope_core" },
  { id: "AE", artifact: "ae" },
  { id: "CORE_SCOPE_CHECK", artifact: "core_scope_check" },
  { id: "PLAY_SEED", artifact: "play_seeds" },
  { id: "EXISTING_GAME_RESEARCH", artifact: "reference_research" },
  { id: "C_COMPRESSION", artifact: "c_compression" },
  { id: "GAME_TRANSLATION", artifact: "game_translations" },
  { id: "FIRST_PLAY_UX", artifact: "first_5_seconds" },
  { id: "NO_MANUAL_EXPLOIT_CHECK", artifact: "no_manual_exploit_check" },
  { id: "CORE_BACK_CHECK", artifact: "core_back_check" },
  { id: "INDEPENDENT_REVIEW", artifact: null },
];

// Downstream (post GAME_DESIGN_READY) stages. Reviews/QA are recorded as
// evidence on the pipeline; RELEASE delegates to task-state.mjs can-deploy.
export const DOWNSTREAM_STAGES = [
  { id: "GAME_SPEC", artifact: "game_spec" },
  { id: "ART_BRIEF", artifact: "art_brief" },
  { id: "ART_PRODUCTION", artifact: "art_production" },
  { id: "ART_REVIEW", artifact: null },
  { id: "IMPLEMENTATION", artifact: "implementation" },
  { id: "IMPLEMENTATION_QA", artifact: "implementation_qa" },
  { id: "INDEPENDENT_IMPL_REVIEW", artifact: null },
  { id: "RELEASE", artifact: null },
];

export const ALL_STAGE_IDS = [...DESIGN_STAGES, ...DOWNSTREAM_STAGES].map((s) => s.id);

// ----------------------------------------------------------- state machine
export const DESIGN_STATES = [
  "DRAFT", "RESEARCHING", "RESEARCHED", "CORE_READY", "AE_READY", "PLAY_SEEDS_READY",
  "TRANSLATING", "FIRST_PLAY_READY", "UNDER_REVIEW", "RETURNED", "REPAIRING",
  "REDESIGNING", "GAME_DESIGN_READY", "ESCALATED",
  // downstream
  "SPEC_READY", "ART_BRIEF_READY", "ART_PRODUCED", "ART_APPROVED", "IMPLEMENTED",
  "IMPL_QA_PASSED", "RELEASE_CANDIDATE", "RELEASED", "REAUDIT_REQUIRED",
];

// Which state an artifact submission moves the pipeline into (only if the
// pipeline is not currently RETURNED/REPAIRING/REDESIGNING/ESCALATED).
export const STATE_AFTER_ARTIFACT = {
  fact_sheet: "RESEARCHED",
  scope_core: "CORE_READY",
  ae: "AE_READY",
  core_scope_check: "AE_READY",
  play_seeds: "PLAY_SEEDS_READY",
  reference_research: "PLAY_SEEDS_READY",
  c_compression: "TRANSLATING",
  game_translations: "TRANSLATING",
  first_5_seconds: "FIRST_PLAY_READY",
  no_manual_exploit_check: "FIRST_PLAY_READY",
  core_back_check: "FIRST_PLAY_READY",
  game_spec: "SPEC_READY",
  art_brief: "ART_BRIEF_READY",
  art_production: "ART_PRODUCED",
  implementation: "IMPLEMENTED",
  implementation_qa: "IMPL_QA_PASSED",
};

// ------------------------------------------------------------ budgets
// repair_count semantics are identical to task-state.mjs (AUTO REPAIR max 1
// per design iteration). A REDESIGN starts a new iteration (different seed
// or translation) and resets repair_count. Redesigns themselves are finite.
export const REPAIR_MAX_PER_ITERATION = 1;
export const REDESIGN_MAX = 2;
// Anti-idle / WIP (autonomous-execution.md WIP LIMIT: close one before
// half-touching many). Mechanical default for concurrently ACTIVE pipelines.
export const WIP_MAX_ACTIVE_PIPELINES = 2;
export const ACTIVE_STATES = new Set([
  "RESEARCHING", "RESEARCHED", "CORE_READY", "AE_READY", "PLAY_SEEDS_READY", "TRANSLATING",
  "FIRST_PLAY_READY", "UNDER_REVIEW", "RETURNED", "REPAIRING", "REDESIGNING",
  "SPEC_READY", "ART_BRIEF_READY", "ART_PRODUCED", "ART_APPROVED", "IMPLEMENTED", "IMPL_QA_PASSED",
]);

// ---------------------------------------------------------- failure routing
// failure_code -> { return_to: stage id(s), preserve, must_change }.
// `return_to` is an ordered list: the first entry is the default; a
// structured failure may pick a later one with an explicit reason.
export const FAILURE_ROUTES = {
  FACTUAL_PROFESSION_ERROR: { return_to: ["PROFESSION_RESEARCH"], preserve: "nothing downstream of the wrong fact", must_change: "fact sheet with sources; everything derived from the wrong fact is STALE" },
  PERIPHERAL_JOB_TASK: { return_to: ["SCOPE_CORE"], preserve: "fact sheet", must_change: "SCOPE must be a representative part of CORE" },
  CORE_SCOPE_MISMATCH: { return_to: ["SCOPE_CORE"], preserve: "fact sheet", must_change: "CORE and/or SCOPE" },
  AE_NOT_REPRESENTATIVE: { return_to: ["AE"], preserve: "fact sheet, CORE, SCOPE", must_change: "A-E" },
  C_IS_ONLY_EXPLANATION: { return_to: ["C_COMPRESSION", "GAME_TRANSLATION"], preserve: "A-E, seeds", must_change: "C must be used, not read" },
  C_NOT_NEEDED_FOR_D: { return_to: ["AE", "GAME_TRANSLATION"], preserve: "fact sheet, CORE/SCOPE", must_change: "D must require C; if A-E themselves lack the causal link, fix A-E" },
  D_REPLACED_BY_TRIVIA: { return_to: ["GAME_TRANSLATION"], preserve: "A-E, seeds, C compression", must_change: "D as profession-specific judgment, not general knowledge" },
  D_PERFORMED_BY_SYSTEM: { return_to: ["GAME_TRANSLATION"], preserve: "A-E, seeds", must_change: "the child's own action must express the judgment" },
  FIRST_ACTION_NOT_INFERABLE: { return_to: ["FIRST_PLAY_UX"], preserve: "translation", must_change: "first_expected_touch must be inferable from the first visible state" },
  REACTION_DOES_NOT_TEACH_NEXT_ACTION: { return_to: ["GAME_TRANSLATION"], preserve: "seeds", must_change: "system_reaction must imply the next judgment" },
  ANSWER_LEAK: { return_to: ["GAME_TRANSLATION", "FIRST_PLAY_UX"], preserve: "A-E, seeds", must_change: "labels/colors/positions/hints/UI hierarchy must not reveal the answer" },
  BRUTE_FORCE_SUCCESS: { return_to: ["GAME_TRANSLATION"], preserve: "A-E, seeds", must_change: "select-all / tap-all / N-submit / fixed-pattern paths must not succeed" },
  NO_CONSEQUENCE: { return_to: ["GAME_TRANSLATION"], preserve: "A-E, seeds", must_change: "the world/state must change in response to the action" },
  FAILURE_DISGUISED_AS_SUCCESS: { return_to: ["GAME_TRANSLATION"], preserve: "A-E, seeds", must_change: "honest outcome: failure must not be processed as success" },
  CORE_DISTORTED_BY_GAME: { return_to: ["GAME_TRANSLATION", "SCOPE_CORE"], preserve: "fact sheet", must_change: "the game must not distort what the profession produces" },
  VISUAL_AFFORDANCE_FAILURE: { return_to: ["ART_BRIEF", "FIRST_PLAY_UX"], preserve: "translation, spec", must_change: "interactive objects must read as touchable in the art / first screen" },
  FACTUAL_VISUAL_ERROR: { return_to: ["PROFESSION_RESEARCH", "ART_BRIEF"], preserve: "translation", must_change: "art must match the profession's facts" },
  IMPLEMENTATION_CHANGED_D: { return_to: ["IMPLEMENTATION"], preserve: "design, spec, art", must_change: "implementation must restore the specified D" },
  GAME_SPEC_MISSING_STATE: { return_to: ["GAME_SPEC"], preserve: "design", must_change: "spec must enumerate every state the translation implies" },
  ART_ANSWER_LEAK: { return_to: ["ART_BRIEF", "GAME_TRANSLATION"], preserve: "spec", must_change: "art must not bake the answer into the image" },
  FIRST_PLAY_FAIL_DESPITE_CORRECT_IMPLEMENTATION: { return_to: ["FIRST_PLAY_UX", "GAME_TRANSLATION"], preserve: "implementation", must_change: "first-play design" },
  CORE_DISTORTION_FOUND_AFTER_ART: { return_to: ["GAME_TRANSLATION", "SCOPE_CORE"], preserve: "fact sheet", must_change: "translation and possibly scope" },
};

export const FAILURE_CODES = Object.keys(FAILURE_ROUTES);

// --------------------------------------------------------- human decision
// product-identity-gate.md / deploy-release-policy.md domains. An artifact
// or failure that declares one of these is HUMAN_DECISION_REQUIRED.
export const HUMAN_DECISION_DOMAINS = [
  "mascot", "brand_character", "core_gameplay_loop", "collection_system", "growth_system",
  "points", "currency", "rewards", "streak", "interest_classification", "aptitude_classification",
  "major_home_feature", "world_unlock", "monetization", "mission", "target_age", "core_philosophy",
];

// ---------------------------------------------------------------- triggers
export const TRIGGERS = [
  "NEW_Q1_REQUEST", "LEGACY_AUDIT_REQUIRED", "REAL_USER_FEEDBACK", "QA_FAILURE",
  "STANDARD_UPDATED", "SHARED_UI_CHANGED", "SHARED_ART_CHANGED", "DEPENDENCY_CHANGED",
];
export const REAUDIT_TRIGGERS = new Set(["STANDARD_UPDATED", "SHARED_UI_CHANGED", "SHARED_ART_CHANGED", "DEPENDENCY_CHANGED", "MAJOR_REAL_USER_EVIDENCE"]);

// --------------------------------------------------------- artifact schemas
// required: top-level required keys. list: {key, min, itemRequired} for
// array artifacts with a mechanical minimum count and per-item fields.
const PLAY_SEED_FIELDS = ["seed_id", "authentic_causal_loop", "player_action", "system_reaction", "information_gained", "next_judgment_or_action", "C_used", "D_expressed", "E_reached", "risks"];
const TRANSLATION_FIELDS = ["translation_id", "play_seed", "goal", "first_visible_state", "primary_action", "C_interaction", "system_reaction", "information_gained", "player_next_judgment", "D_externalization", "E_consequence", "retry_or_rethink", "job_reveal_bridge", "strengths", "weaknesses", "risk", "adoption_or_rejection_reason"];
const REFERENCE_FIELDS = ["reference", "relevant_mechanic", "borrowed_principle", "surface_elements_not_to_copy"];

export const ARTIFACT_SCHEMAS = {
  fact_sheet: {
    stage: "PROFESSION_RESEARCH",
    required: ["profession", "sources", "who_or_what_they_serve", "representative_duties", "expertise", "tools", "information_used", "decisions", "outputs_or_value", "adjacent_profession_boundaries", "uncertainties"],
    list: { key: "sources", min: 1, itemRequired: ["url", "type"] },
  },
  scope_core: {
    stage: "SCOPE_CORE",
    required: ["core", "scope", "scope_is_representative_because", "profession_name_hidden_test"],
  },
  ae: {
    stage: "AE",
    required: ["A", "B", "C", "D", "E"],
  },
  core_scope_check: {
    stage: "CORE_SCOPE_CHECK",
    required: ["core_consistent", "scope_representative", "profession_name_hidden_test_pass", "notes"],
  },
  play_seeds: {
    stage: "PLAY_SEED",
    required: ["seeds"],
    list: { key: "seeds", min: 3, itemRequired: PLAY_SEED_FIELDS },
  },
  reference_research: {
    stage: "EXISTING_GAME_RESEARCH",
    required: ["references"],
    list: { key: "references", min: 1, itemRequired: REFERENCE_FIELDS },
  },
  c_compression: {
    stage: "C_COMPRESSION",
    required: ["original_C", "compressed_C", "removed_complexity", "reason_for_removal", "preserved_D", "how_player_still_performs_D", "failure_risk"],
  },
  game_translations: {
    stage: "GAME_TRANSLATION",
    required: ["translations", "adopted_translation_id", "adoption_rationale"],
    list: { key: "translations", min: 3, itemRequired: TRANSLATION_FIELDS },
  },
  first_5_seconds: {
    stage: "FIRST_PLAY_UX",
    required: ["zero_to_two_seconds", "two_to_five_seconds", "first_expected_touch", "first_system_reaction", "next_expected_inference", "next_expected_action"],
  },
  no_manual_exploit_check: {
    stage: "NO_MANUAL_EXPLOIT_CHECK",
    required: ["no_manual_check", "exploit_check"],
    nested: {
      no_manual_check: ["operation_before_rules", "contextual_cue_only", "pass"],
      exploit_check: ["select_all", "tap_all", "spam_submit", "fixed_failure_pattern", "color_leak", "label_leak", "position_leak", "visual_hierarchy_leak", "pass"],
    },
  },
  core_back_check: {
    stage: "CORE_BACK_CHECK",
    required: ["core_still_intact", "scope_still_representative", "d_still_performed_by_child", "notes", "pass"],
  },
  // downstream
  game_spec: {
    stage: "GAME_SPEC",
    required: ["goal", "initial_visual_state", "interactive_objects", "primary_action", "C", "D", "system_reactions", "state_transitions", "failure_behavior", "retry_behavior", "E", "job_reveal", "first_5_seconds", "no_manual_requirements", "mobile_constraints", "asset_requirements"],
  },
  art_brief: {
    stage: "ART_BRIEF",
    // `no_art_required: true` short-circuits the art stages (must still be submitted explicitly).
    required: ["no_art_required"],
    requiredUnless: { no_art_required: true, fields: ["asset_purpose", "scene", "required_objects", "interactive_object_visual_hierarchy", "what_must_be_visually_obvious", "what_must_not_be_baked_into_image", "required_state_variations", "success_state", "failure_state", "mobile_composition", "clay_style_requirements", "existing_series_references", "prohibited_mascot_invention", "text_UI_separation", "touch_affordance_requirements"] },
  },
  art_production: {
    stage: "ART_PRODUCTION",
    required: ["assets"],
    list: { key: "assets", min: 1, itemRequired: ["asset_id", "path", "producer", "request_file"] },
  },
  implementation: {
    stage: "IMPLEMENTATION",
    required: ["component_files", "logic_module", "qa_harness", "spec_version", "art_version_or_none", "d_preserved_statement"],
  },
  implementation_qa: {
    stage: "IMPLEMENTATION_QA",
    required: ["first_5_seconds", "touch_targets", "mobile_375", "direct_manipulation", "reaction_timing", "c_to_d", "consequence", "retry", "answer_leak", "brute_force", "visual_affordance", "no_manual", "job_reveal", "pass", "evidence"],
  },
};

export const ARTIFACT_TYPES = Object.keys(ARTIFACT_SCHEMAS);

// Upstream dependency map: submitting a NEW VERSION of a key invalidates
// (marks STALE) every artifact listed under it, transitively.
export const DOWNSTREAM_OF = {
  fact_sheet: ["scope_core"],
  scope_core: ["ae"],
  ae: ["core_scope_check", "play_seeds"],
  core_scope_check: [],
  play_seeds: ["reference_research", "c_compression", "game_translations"],
  reference_research: [],
  c_compression: ["game_translations"],
  game_translations: ["first_5_seconds", "no_manual_exploit_check", "core_back_check", "game_spec"],
  first_5_seconds: ["no_manual_exploit_check"],
  no_manual_exploit_check: [],
  core_back_check: [],
  game_spec: ["art_brief", "implementation"],
  art_brief: ["art_production"],
  art_production: ["implementation"],
  implementation: ["implementation_qa"],
  implementation_qa: [],
};

export function transitiveDownstream(type) {
  const out = new Set();
  const stack = [...(DOWNSTREAM_OF[type] ?? [])];
  while (stack.length) {
    const t = stack.pop();
    if (out.has(t)) continue;
    out.add(t);
    for (const d of DOWNSTREAM_OF[t] ?? []) stack.push(d);
  }
  return [...out];
}

// --------------------------------------------------------------- validators
function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true; // numbers/booleans count as present
}

/** Validate an artifact payload against ARTIFACT_SCHEMAS. Returns {ok, problems[]}. */
export function validateArtifact(type, payload) {
  const schema = ARTIFACT_SCHEMAS[type];
  if (!schema) return { ok: false, problems: [`unknown artifact type: ${type}`] };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, problems: ["artifact payload must be a JSON object"] };
  const problems = [];
  for (const k of schema.required) if (!isNonEmpty(payload[k])) problems.push(`missing required field: ${k}`);
  if (schema.requiredUnless) {
    const { fields } = schema.requiredUnless;
    const skipKey = Object.keys(schema.requiredUnless).find((k) => k !== "fields");
    const skipVal = schema.requiredUnless[skipKey];
    if (payload[skipKey] !== skipVal) for (const k of fields) if (!isNonEmpty(payload[k])) problems.push(`missing required field: ${k} (required unless ${skipKey}=${JSON.stringify(skipVal)})`);
  }
  if (schema.list) {
    const arr = payload[schema.list.key];
    if (!Array.isArray(arr)) problems.push(`${schema.list.key} must be an array`);
    else {
      if (arr.length < schema.list.min) problems.push(`${schema.list.key} has ${arr.length} item(s); minimum is ${schema.list.min}`);
      arr.forEach((item, i) => {
        for (const k of schema.list.itemRequired) if (!item || !isNonEmpty(item[k])) problems.push(`${schema.list.key}[${i}] missing: ${k}`);
      });
    }
  }
  if (schema.nested) {
    for (const [k, fields] of Object.entries(schema.nested)) {
      const obj = payload[k];
      if (!obj || typeof obj !== "object") continue; // already reported by required
      for (const f of fields) if (!(f in obj)) problems.push(`${k}.${f} missing`);
    }
  }
  // Semantic invariants that are still mechanical:
  if (type === "game_translations" && Array.isArray(payload.translations) && payload.adopted_translation_id) {
    if (!payload.translations.some((t) => t.translation_id === payload.adopted_translation_id)) problems.push(`adopted_translation_id ${payload.adopted_translation_id} is not one of translations[].translation_id`);
  }
  if (type === "c_compression" && isNonEmpty(payload.original_C) && payload.original_C === payload.compressed_C) problems.push("compressed_C is identical to original_C — nothing was compressed");
  if (type === "no_manual_exploit_check") {
    if (payload.no_manual_check && payload.no_manual_check.pass !== true) problems.push("no_manual_check.pass is not true");
    if (payload.exploit_check && payload.exploit_check.pass !== true) problems.push("exploit_check.pass is not true");
  }
  if (type === "core_back_check" && payload.pass !== true) problems.push("core_back_check.pass is not true");
  if (type === "core_scope_check" && payload.profession_name_hidden_test_pass !== true) problems.push("profession_name_hidden_test_pass is not true");
  if (type === "implementation_qa" && payload.pass !== true) problems.push("implementation_qa.pass is not true");
  return { ok: problems.length === 0, problems };
}

// ------------------------------------------------- mechanical consistency repair
// 2026-09-09 (Human Decision, legacy-clue-join r6): a distinct, narrower category
// from REPAIR/REDESIGN. A "design repair" changes what was decided (CORE, SCOPE,
// A-E, the adopted Game Translation, C->D->E, a success/failure condition) and
// rightly costs repair_count/redesign_count. A MECHANICAL_CONSISTENCY_REPAIR
// changes nothing that was decided — it only brings an artifact's version
// references, stale wording, or provenance into sync with content ALREADY
// decided upstream (typically: an upstream artifact changed and a downstream
// one still cites the old version or repeats a claim the upstream artifact no
// longer makes). It must NEVER consume or reset REPAIR_MAX_PER_ITERATION /
// REDESIGN_MAX, and it must NEVER be usable to route around a genuine design
// defect — the mechanical check below is what keeps that true, not the
// operator's say-so: every field that actually DEFINES CORE/SCOPE/A-E/the
// adopted mechanic/a pass-fail verdict must stay byte-identical, or the
// submission is refused outright and must go through normal repair/redesign
// (or escalation) instead.
//
// Entire types are excluded because there is no "safe" field left in them:
// game_spec/implementation/implementation_qa/art_brief/art_production are
// downstream, mechanic- or code-defining artifacts (state_transitions,
// failure_behavior, d_preserved_statement, pass, etc. cover nearly every
// field), so a consistency-only change there is not meaningfully distinguishable
// from a real repair. fact_sheet is the root of the whole evidence chain, so
// even a "just fixing a citation" edit there is required to go through the
// normal path (its sourced claims are exactly what everything else must stay
// consistent WITH).
export const CONSISTENCY_REPAIR_EXCLUDED_TYPES = [
  "fact_sheet", "game_spec", "art_brief", "art_production", "implementation", "implementation_qa",
];

// Per remaining type, the fields that MUST NOT change (byte-identical, via
// JSON.stringify) for a submission to qualify. Every field NOT listed here is
// free to edit under this path (references, stale wording, notes, provenance).
// `scope_core` and `ae` are the CORE/SCOPE and A-E artifacts themselves: every
// one of their required fields is protected, i.e. this path can only ever
// touch their non-required metadata (derived_from, reverse_audit, ...).
export const CONSISTENCY_REPAIR_PROTECTED_FIELDS = {
  scope_core: ["core", "scope", "scope_is_representative_because", "profession_name_hidden_test"],
  ae: ["A", "B", "C", "D", "E"],
  core_scope_check: ["core_consistent", "scope_representative", "profession_name_hidden_test_pass"],
  // play_seeds / game_translations are checked per-item below (protectedListCheck), not here.
  play_seeds: [],
  reference_research: [],
  c_compression: ["original_C", "compressed_C", "preserved_D", "how_player_still_performs_D"],
  game_translations: ["adopted_translation_id"],
  // r7 fix (CONSISTENCY_REPAIR_GUARD_INCOMPLETE): first_5_seconds was left with ZERO protected
  // fields -- every one of its required fields describes actual first-play UX behavior (what is
  // shown, what the child is expected to infer/do next), i.e. it is exactly as meaning-bearing as
  // scope_core/ae. Protect the whole schema-required set; only non-required metadata
  // (revision_note etc.) stays free.
  first_5_seconds: ["zero_to_two_seconds", "two_to_five_seconds", "first_expected_touch", "first_system_reaction", "next_expected_inference", "next_expected_action"],
  no_manual_exploit_check: [],
  core_back_check: ["core_still_intact", "scope_still_representative", "d_still_performed_by_child", "pass"],
};
// Per-seed / per-translation-entry protected fields (only enforced for the
// entry that matters: every play_seed the way the mechanic is described, and
// for game_translations ONLY the currently-adopted entry — "adopted Game
// Translationを変更しない"; historical rejected entries may be edited freely).
// r7 fix (CONSISTENCY_REPAIR_GUARD_INCOMPLETE): information_gained/next_judgment_or_action/C_used
// were missing -- they describe what C is used and what the child learns/decides next, i.e. they
// are just as meaning-bearing as the causal-loop fields already protected. Only "risks" (a risk
// ASSESSMENT, not a behavior description) and "seed_id" stay free per seed.
const PLAY_SEED_PROTECTED_ITEM_FIELDS = ["authentic_causal_loop", "player_action", "system_reaction", "information_gained", "next_judgment_or_action", "C_used", "D_expressed", "E_reached"];
const TRANSLATION_PROTECTED_ITEM_FIELDS = ["goal", "first_visible_state", "primary_action", "C_interaction", "system_reaction", "information_gained", "player_next_judgment", "D_externalization", "E_consequence", "retry_or_rethink", "job_reveal_bridge"];
// no_manual_exploit_check's protected fields are nested (booleans = a verdict).
const NO_MANUAL_PROTECTED_NESTED = {
  no_manual_check: ["operation_before_rules", "contextual_cue_only", "pass"],
  exploit_check: ["select_all", "tap_all", "spam_submit", "fixed_failure_pattern", "color_leak", "label_leak", "position_leak", "visual_hierarchy_leak", "pass"],
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Returns {eligible:true} or {eligible:false, reason} — never throws. Pure/mechanical: no
 *  filesystem, no trust in the caller's own description of what changed. */
export function checkConsistencyRepairEligible(type, oldPayload, newPayload) {
  if (CONSISTENCY_REPAIR_EXCLUDED_TYPES.includes(type)) {
    return { eligible: false, reason: `${type} is excluded from mechanical consistency repair (every field in it is mechanic/code-defining or is the root fact_sheet) — use repair/redesign` };
  }
  if (!(type in CONSISTENCY_REPAIR_PROTECTED_FIELDS)) {
    return { eligible: false, reason: `${type} has no consistency-repair rule defined — use repair/redesign` };
  }
  if (!oldPayload) return { eligible: false, reason: "no existing (CURRENT) artifact to compare against — a first submission cannot be a consistency repair" };
  for (const f of CONSISTENCY_REPAIR_PROTECTED_FIELDS[type]) {
    if (!deepEqual(oldPayload[f], newPayload[f])) {
      return { eligible: false, reason: `field '${f}' changed — this defines CORE/SCOPE/A-E/the mechanic or a pass-fail verdict for ${type}; that is a design change, not a consistency repair` };
    }
  }
  if (type === "play_seeds") {
    const oldSeeds = Array.isArray(oldPayload.seeds) ? oldPayload.seeds : [];
    const newSeeds = Array.isArray(newPayload.seeds) ? newPayload.seeds : [];
    if (oldSeeds.length !== newSeeds.length || !deepEqual(oldSeeds.map((s) => s.seed_id).sort(), newSeeds.map((s) => s.seed_id).sort())) {
      return { eligible: false, reason: "play_seeds: seeds were added or removed — that changes the design's option space, not just its wording" };
    }
    for (const os of oldSeeds) {
      const ns = newSeeds.find((s) => s.seed_id === os.seed_id);
      for (const f of PLAY_SEED_PROTECTED_ITEM_FIELDS) {
        if (!deepEqual(os[f], ns?.[f])) return { eligible: false, reason: `play_seeds[${os.seed_id}].${f} changed — this describes the actual causal loop/behavior, not just wording or provenance` };
      }
    }
  }
  if (type === "game_translations") {
    const oldTr = Array.isArray(oldPayload.translations) ? oldPayload.translations : [];
    const newTr = Array.isArray(newPayload.translations) ? newPayload.translations : [];
    const adoptedId = oldPayload.adopted_translation_id; // already confirmed unchanged above
    if (oldTr.length !== newTr.length || !deepEqual(oldTr.map((t) => t.translation_id).sort(), newTr.map((t) => t.translation_id).sort())) {
      return { eligible: false, reason: "game_translations: translations were added or removed — that changes the design's option space, not just its wording" };
    }
    const oldAdopted = oldTr.find((t) => t.translation_id === adoptedId);
    const newAdopted = newTr.find((t) => t.translation_id === adoptedId);
    if (oldAdopted && newAdopted) {
      for (const f of TRANSLATION_PROTECTED_ITEM_FIELDS) {
        if (!deepEqual(oldAdopted[f], newAdopted[f])) return { eligible: false, reason: `the ADOPTED translation's '${f}' changed — that changes the mechanic itself ("adopted Game Translationを変更しない"), not just wording or provenance. Non-adopted (rejected) entries may be edited freely.` };
      }
    }
  }
  if (type === "no_manual_exploit_check") {
    for (const [group, fields] of Object.entries(NO_MANUAL_PROTECTED_NESTED)) {
      for (const f of fields) {
        if (!deepEqual(oldPayload[group]?.[f], newPayload[group]?.[f])) return { eligible: false, reason: `${group}.${f} changed — this is a mechanical pass/fail verdict, not wording or provenance` };
      }
    }
  }
  return { eligible: true };
}

// -------------------------------------------------- factual evidence correction
// 2026-09-09 (Human Decision, legacy-clue-join r7): a THIRD category, distinct from both design
// repair/redesign and MECHANICAL_CONSISTENCY_REPAIR. Consistency-repair exists for "artifacts fell
// out of sync with a decision already made"; this exists for "fact_sheet asserted something the
// cited source does not actually support" (independent review found the citation does not back
// the claim, the source changed, or a fact-check found the claim wrong outright). fact_sheet is
// EXCLUDED from consistency-repair on purpose (it is the root of the whole evidence chain, so any
// edit there is a real content change) — this path is the disciplined way to still fix a genuinely
// unsupported claim without spending a REPAIR/REDESIGN slot on "remove something that was never
// actually true", which is not a design judgment call at all.
//
// This is NOT a way around REPAIR_MAX_PER_ITERATION / REDESIGN_MAX. The line is drawn exactly at
// "does fixing this require someone to WEIGH competing, equally-valid design options" (a real
// judgment call — must use repair/redesign or escalate) vs. "does fixing this only require REMOVING
// or NARROWING what turned out to be unsupported" (never grows a claim, never introduces a new
// idea). The operator must self-declare which case this is (`core_ae_translation_impact`), and the
// declaration is checked, not merely trusted: for "none" every field of every affected
// CORE/A-E/adopted-translation artifact must stay byte-identical (exactly as strict as consistency
// repair); for "narrowing_only" those fields may change ONLY by getting no LONGER (a shrink/removal
// signal, checked per field by serialized length) — anything that grows, or anything the operator
// tags "requires_new_design_choice", is refused outright and must go through human-decision
// (Product Identity) or normal repair/redesign (a genuine multiple-valid-interpretations choice).
export const FACT_CORRECTION_EVIDENCE_REQUIRED = ["claim_removed", "cited_source", "source_does_not_support_because", "core_ae_translation_impact"];
export const FACT_CORRECTION_IMPACT_LEVELS = ["none", "narrowing_only", "requires_new_design_choice"];
// Artifact types this path may touch besides fact_sheet itself — exactly the three the Human named
// (CORE/SCOPE, A-E, the adopted Game Translation). Anything else that merely CITES a corrected
// claim (no_manual_exploit_check, play_seeds.risks, ...) is wording/provenance sync and belongs to
// the EXISTING consistency-repair path, not this one.
// r8 extension: play_seeds/c_compression sit structurally inside the design chain (between AE and
// Game Translation) and can equally echo a since-corrected claim in a field already protected by
// consistency-repair (e.g. play_seeds.information_gained, c_compression.compressed_C) — a field
// consistency-repair's exact-match rule cannot touch. The SAME strict containment check applies;
// this is not a wider loophole, just recognizing these two artifacts are design-content, not
// citation-only downstream artifacts.
export const FACT_CORRECTION_NARROWING_TYPES = ["scope_core", "ae", "play_seeds", "c_compression", "game_translations"];

/** Returns {ok, problems[]} — same shape/convention as validateArtifact / validateReviewEvidenceFile. */
export function validateFactCorrectionEvidence(payload) {
  const problems = [];
  if (!payload || typeof payload !== "object") return { ok: false, problems: ["fact-correction evidence must be a JSON object"] };
  for (const k of FACT_CORRECTION_EVIDENCE_REQUIRED) if (!isNonEmpty(payload[k])) problems.push(`missing required field: ${k}`);
  if (payload.core_ae_translation_impact && !FACT_CORRECTION_IMPACT_LEVELS.includes(payload.core_ae_translation_impact)) {
    problems.push(`core_ae_translation_impact must be one of ${FACT_CORRECTION_IMPACT_LEVELS.join(", ")}`);
  }
  return { ok: problems.length === 0, problems };
}

// r8 fix (FACT_CORRECTION_GUARD_INCOMPLETE, Human Decision 2026-09-09): a pure serialized-length
// comparison does not stop a same-or-shorter REPLACEMENT claim from passing as "narrowing" — it
// only checked size, never containment. A genuine narrowing can only ever REMOVE characters that
// were already there, never introduce different ones. isNarrowingOf() enforces that mechanically:
// a string only narrows another if it is a (order-preserving) SUBSEQUENCE of it -- i.e. obtainable
// by deleting characters, never by substituting or adding any. Arrays/objects narrow structurally
// (no new keys, no more items, each corresponding item must itself narrow). This also closes the
// second half of the same finding: fact_sheet itself now gets the identical containment check
// (previously it was unconditionally eligible with no comparison at all).
function isSubsequence(needle, haystack) {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) if (haystack[j] === needle[i]) i++;
  return i === needle.length;
}
function isNarrowingOf(newVal, oldVal) {
  if (deepEqual(newVal, oldVal)) return true;
  if (typeof newVal === "string" && typeof oldVal === "string") return isSubsequence(newVal, oldVal);
  if (Array.isArray(newVal) && Array.isArray(oldVal)) {
    if (newVal.length > oldVal.length) return false;
    return newVal.every((v, i) => isNarrowingOf(v, oldVal[i]));
  }
  if (newVal && oldVal && typeof newVal === "object" && typeof oldVal === "object" && !Array.isArray(newVal) && !Array.isArray(oldVal)) {
    const newKeys = Object.keys(newVal);
    if (newKeys.some((k) => !(k in oldVal))) return false; // no new keys introduced
    return newKeys.every((k) => isNarrowingOf(newVal[k], oldVal[k]));
  }
  return false; // type mismatch, or a non-string/array/object primitive that changed
}

/** Returns {eligible:true} or {eligible:false, reason}. `impact` is the evidence's declared
 *  core_ae_translation_impact (already schema-validated by validateFactCorrectionEvidence). */
export function checkFactCorrectionEligible(type, oldPayload, newPayload, impact) {
  if (impact === "requires_new_design_choice") {
    return { eligible: false, reason: "declared core_ae_translation_impact=requires_new_design_choice — this needs someone to pick among multiple valid design options, which is a value judgment, not a factual correction. Use human-decision (if Product Identity) or normal repair/redesign (if a design-stage choice)." };
  }
  if (!oldPayload) return { eligible: false, reason: "no existing (CURRENT) artifact to compare against — fact-correct needs a baseline to narrow from" };
  if (type === "fact_sheet") {
    // fact_sheet is what this path exists to correct — but every SCHEMA-REQUIRED (substantive)
    // field must still be a genuine narrowing of what was there, never a replacement (r8 fix: this
    // used to be unconditional). Extra bookkeeping fields beyond the canonical schema
    // (candidate_reference_cards, revision_note, derived_from, reverse_audit, ...) are treated the
    // same way consistency-repair treats non-protected fields: free to edit, since they are
    // provenance/documentation about the correction itself, not a substantive claim about the
    // profession.
    for (const f of ARTIFACT_SCHEMAS.fact_sheet.required) {
      if (!(f in newPayload)) continue; // dropping a whole optional... required fields must stay present (validateArtifact enforces this separately)
      if (!isNarrowingOf(newPayload[f], oldPayload[f])) return { eligible: false, reason: `fact_sheet.${f} is not a narrowing of its previous content — it contains something that was not there before, which is more than removing an unsupported claim` };
    }
    return { eligible: true };
  }
  if (!FACT_CORRECTION_NARROWING_TYPES.includes(type)) {
    return { eligible: false, reason: `${type} is not eligible for fact-correct narrowing (only fact_sheet and ${FACT_CORRECTION_NARROWING_TYPES.join("/")} are) — an artifact that only CITES the corrected claim belongs on the consistency-repair path instead` };
  }
  if (impact === "none") {
    // exactly as strict as consistency-repair: this type must not need to change AT ALL
    if (!deepEqual(oldPayload, newPayload)) return { eligible: false, reason: `declared core_ae_translation_impact=none but ${type}'s content changed — either the impact declaration is wrong (use narrowing_only) or this isn't actually needed` };
    return { eligible: true };
  }
  // narrowing_only: protected fields may only narrow (never grow, never get replaced by different-
  // but-same-length content), and the option space (which seeds/translations exist, which one is
  // adopted) may never change.
  if (type === "scope_core") {
    for (const f of CONSISTENCY_REPAIR_PROTECTED_FIELDS.scope_core) {
      if (!isNarrowingOf(newPayload[f], oldPayload[f])) return { eligible: false, reason: `scope_core.${f} is not a narrowing of its previous content — narrowing_only may only remove content, never replace or add it` };
    }
  }
  if (type === "ae") {
    for (const f of CONSISTENCY_REPAIR_PROTECTED_FIELDS.ae) {
      if (!isNarrowingOf(newPayload[f], oldPayload[f])) return { eligible: false, reason: `ae.${f} is not a narrowing of its previous content — narrowing_only may only remove content, never replace or add it` };
    }
  }
  if (type === "c_compression") {
    for (const f of CONSISTENCY_REPAIR_PROTECTED_FIELDS.c_compression) {
      if (!isNarrowingOf(newPayload[f], oldPayload[f])) return { eligible: false, reason: `c_compression.${f} is not a narrowing of its previous content — narrowing_only may only remove content, never replace or add it` };
    }
  }
  if (type === "play_seeds") {
    const oldSeeds = Array.isArray(oldPayload.seeds) ? oldPayload.seeds : [];
    const newSeeds = Array.isArray(newPayload.seeds) ? newPayload.seeds : [];
    if (oldSeeds.length !== newSeeds.length || !deepEqual(oldSeeds.map((s) => s.seed_id).sort(), newSeeds.map((s) => s.seed_id).sort())) {
      return { eligible: false, reason: "play_seeds: seeds were added or removed — that changes the option space, not just a fact" };
    }
    for (const os of oldSeeds) {
      const ns = newSeeds.find((s) => s.seed_id === os.seed_id);
      for (const f of PLAY_SEED_PROTECTED_ITEM_FIELDS) {
        if (!isNarrowingOf(ns?.[f], os[f])) return { eligible: false, reason: `play_seeds[${os.seed_id}].${f} is not a narrowing of its previous content — narrowing_only may only remove content, never replace or add it` };
      }
    }
  }
  if (type === "game_translations") {
    const oldTr = Array.isArray(oldPayload.translations) ? oldPayload.translations : [];
    const newTr = Array.isArray(newPayload.translations) ? newPayload.translations : [];
    if (oldPayload.adopted_translation_id !== newPayload.adopted_translation_id) return { eligible: false, reason: "game_translations.adopted_translation_id changed — that is a redesign, not a factual correction" };
    if (oldTr.length !== newTr.length || !deepEqual(oldTr.map((t) => t.translation_id).sort(), newTr.map((t) => t.translation_id).sort())) {
      return { eligible: false, reason: "translations were added or removed — that changes the option space, not just a fact" };
    }
    const oldAdopted = oldTr.find((t) => t.translation_id === oldPayload.adopted_translation_id);
    const newAdopted = newTr.find((t) => t.translation_id === newPayload.adopted_translation_id);
    if (oldAdopted && newAdopted) {
      for (const f of TRANSLATION_PROTECTED_ITEM_FIELDS) {
        if (!isNarrowingOf(newAdopted[f], oldAdopted[f])) return { eligible: false, reason: `the adopted translation's '${f}' is not a narrowing of its previous content — narrowing_only may only remove content (e.g. drop a discriminating axis that turned out unsupported), never replace or add it` };
      }
    }
  }
  return { eligible: true };
}

// ----------------------------------------------- GAME_DESIGN_READY checklist
// Each entry: {id, check(pipeline) -> string|null (null = satisfied)}.
// `pipeline` is the per-game record maintained by q1-pipeline.mjs.
function art(p, type) {
  const a = p.artifacts?.[type];
  return a && a.status !== "STALE" ? a : null;
}
export const GAME_DESIGN_READY_CHECKS = [
  { id: "fact_sheet_exists", check: (p) => (art(p, "fact_sheet") ? null : "FACT SHEET missing or STALE") },
  { id: "sources_exist", check: (p) => ((art(p, "fact_sheet")?.payload?.sources?.length ?? 0) >= 1 ? null : "fact sheet has no sources") },
  { id: "scope_exists", check: (p) => (art(p, "scope_core")?.payload?.scope ? null : "SCOPE missing or STALE") },
  { id: "core_exists", check: (p) => (art(p, "scope_core")?.payload?.core ? null : "CORE missing or STALE") },
  ...["A", "B", "C", "D", "E"].map((k) => ({ id: `${k}_exists`, check: (p) => (art(p, "ae")?.payload?.[k] ? null : `${k} missing or STALE`) })),
  { id: "core_check_exists", check: (p) => (art(p, "core_scope_check") ? null : "CORE/SCOPE check missing or STALE") },
  { id: "play_seeds_gte_3", check: (p) => ((art(p, "play_seeds")?.payload?.seeds?.length ?? 0) >= 3 ? null : `play_seeds < 3 (have ${art(p, "play_seeds")?.payload?.seeds?.length ?? 0})`) },
  { id: "reference_research_exists", check: (p) => (art(p, "reference_research") ? null : "reference research missing or STALE") },
  { id: "c_compression_complete", check: (p) => (art(p, "c_compression") ? null : "C compression missing or STALE") },
  { id: "original_C_exists", check: (p) => (art(p, "c_compression")?.payload?.original_C ? null : "original_C missing") },
  { id: "compressed_C_exists", check: (p) => (art(p, "c_compression")?.payload?.compressed_C ? null : "compressed_C missing") },
  { id: "preserved_D_exists", check: (p) => (art(p, "c_compression")?.payload?.preserved_D ? null : "preserved_D missing") },
  { id: "game_translations_gte_3", check: (p) => ((art(p, "game_translations")?.payload?.translations?.length ?? 0) >= 3 ? null : `game_translations < 3 (have ${art(p, "game_translations")?.payload?.translations?.length ?? 0})`) },
  { id: "adoption_rationale_exists", check: (p) => (art(p, "game_translations")?.payload?.adoption_rationale ? null : "adoption rationale missing") },
  { id: "first_5_seconds_complete", check: (p) => (art(p, "first_5_seconds") ? null : "First 5 Seconds missing or STALE") },
  { id: "no_manual_check_complete", check: (p) => (art(p, "no_manual_exploit_check")?.payload?.no_manual_check?.pass === true ? null : "no-manual check missing/failed/STALE") },
  { id: "exploit_check_complete", check: (p) => (art(p, "no_manual_exploit_check")?.payload?.exploit_check?.pass === true ? null : "exploit check missing/failed/STALE") },
  { id: "core_back_check_complete", check: (p) => (art(p, "core_back_check")?.payload?.pass === true ? null : "CORE back-check missing/failed/STALE") },
  { id: "independent_review_pass", check: (p) => (p.independent_review?.verdict === "PASS" && p.independent_review?.independent === true && p.independent_review?.stale !== true ? null : `independent review is ${JSON.stringify(p.independent_review?.verdict ?? null)} (independent=${p.independent_review?.independent ?? false}, stale=${p.independent_review?.stale ?? false})`) },
  { id: "unresolved_human_decision_false", check: (p) => ((p.human_decisions ?? []).some((h) => h.status === "open") ? "an open Human Decision exists" : null) },
  { id: "not_escalated", check: (p) => (p.state === "ESCALATED" ? "pipeline is ESCALATED" : null) },
];

export function gameDesignReadyReasons(pipeline) {
  return GAME_DESIGN_READY_CHECKS.map((c) => ({ id: c.id, reason: c.check(pipeline) })).filter((r) => r.reason);
}

// ----------------------------------------------------- real user evidence
export const REAL_USER_EVIDENCE_REQUIRED = ["evidence_id", "game_id", "version", "observation", "interpretation", "severity", "affected_stage", "suggested_failure_code", "source_context", "status"];
export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "BLOCKER"];

export function validateRealUserEvidence(e) {
  const problems = [];
  for (const k of REAL_USER_EVIDENCE_REQUIRED) if (!isNonEmpty(e?.[k])) problems.push(`missing: ${k}`);
  if (e?.severity && !SEVERITIES.includes(e.severity)) problems.push(`bad severity: ${e.severity}`);
  if (e?.affected_stage && !ALL_STAGE_IDS.includes(e.affected_stage)) problems.push(`bad affected_stage: ${e.affected_stage}`);
  if (e?.suggested_failure_code && !FAILURE_CODES.includes(e.suggested_failure_code)) problems.push(`bad suggested_failure_code: ${e.suggested_failure_code}`);
  if (e?.observation && e?.interpretation && e.observation === e.interpretation) problems.push("observation and interpretation are identical — they must be separated");
  return { ok: problems.length === 0, problems };
}

// ------------------------------------------------------- legacy audit
export const LEGACY_CLASSIFICATIONS = ["PASS", "LOCAL_REPAIR", "GAME_TRANSLATION_REBUILD", "AE_REBUILD", "SCOPE_CORE_REBUILD", "FACTUAL_RESEARCH_REQUIRED"];
export const REVERSE_AUDIT_REQUIRED = [
  "game_type", "current_profession", "current_SCOPE", "current_CORE", "current_A", "current_B", "current_C", "current_D", "current_E",
  "actual_first_screen", "actual_player_actions", "actual_feedback", "actual_next_decision", "actual_success_path", "actual_failure_path",
  "prerequisite_explanation", "answer_leak", "brute_force", "profession_reveal", "classification", "priority_reasons",
];
// classification -> which pipeline stage a rebuild re-enters at
export const CLASSIFICATION_ENTRY_STAGE = {
  PASS: null,
  LOCAL_REPAIR: "IMPLEMENTATION",
  GAME_TRANSLATION_REBUILD: "GAME_TRANSLATION",
  AE_REBUILD: "AE",
  SCOPE_CORE_REBUILD: "SCOPE_CORE",
  FACTUAL_RESEARCH_REQUIRED: "PROFESSION_RESEARCH",
};
// priority: lower number = more urgent (autonomous-execution.md ordering + §24 of the master request)
export const PRIORITY_REASONS = {
  release_blocker: 0, serious_first_play_failure: 1, core_distortion: 2, answer_leak: 3,
  brute_force_exploit: 4, major_factual_problem: 5, severe_c_d_failure: 6, other: 9,
};
export function validateReverseAudit(a) {
  const problems = [];
  for (const k of REVERSE_AUDIT_REQUIRED) if (!(k in (a ?? {}))) problems.push(`missing: ${k}`);
  if (a?.classification && !LEGACY_CLASSIFICATIONS.includes(a.classification)) problems.push(`bad classification: ${a.classification}`);
  if (a?.priority_reasons && (!Array.isArray(a.priority_reasons) || a.priority_reasons.some((r) => !(r in PRIORITY_REASONS)))) problems.push(`priority_reasons must be from ${Object.keys(PRIORITY_REASONS).join(",")}`);
  return { ok: problems.length === 0, problems };
}
