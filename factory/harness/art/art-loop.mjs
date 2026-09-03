#!/usr/bin/env node
// Art Loop (Stage 6): need -> reuse -> provider -> prompt -> generate -> QA ->
// regenerate (max 3, prompt amended with QA issues) -> manifest v2 provenance.
//
// Manifest v2: factory/state/art/manifest-v2.json (global provenance registry).
// Requests carry the fields of factory/rules/art-style.md manifest format plus
// provider routing. Provider priority: reuse > css/svg (in-session) >
// composition > codex_imagegen > human_boundary. Paid APIs blocked in adapter.
//
// Usage:
//   node art-loop.mjs register-existing          — record existing referenced assets
//   node art-loop.mjs run --request <req.json>   — execute the loop for one asset
//   node art-loop.mjs run-pair --before <req.json> --after <req.json>
//       — before/after: generates BEFORE first, then AFTER with BEFORE as the
//         consistency reference, then pair-QA (same building/camera enforced)
//   node art-loop.mjs status                     — manifest summary

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ART = dirname(fileURLToPath(import.meta.url));
const HARNESS = dirname(ART);
const ROOT = join(HARNESS, "..", "..");
const STATE = join(ROOT, "factory", "state", "art");
const MANIFEST = join(STATE, "manifest-v2.json");
mkdirSync(STATE, { recursive: true });

const MAX_ITER = 3;

// The manifest is read-modify-write: two concurrent runs would clobber each
// other's entries (this actually happened in Stage 6). Simple lockfile guard.
const LOCK = join(STATE, ".art-loop.lock");
function lockHolderAlive() {
  try {
    const pid = Number(readFileSync(LOCK, "utf8"));
    if (!Number.isInteger(pid) || pid <= 0) return false;
    process.kill(pid, 0); // throws if the process no longer exists
    return true;
  } catch {
    return false;
  }
}
function acquireLock() {
  try {
    // atomic create-exclusive: two processes can never both acquire it
    writeFileSync(LOCK, String(process.pid), { flag: "wx" });
  } catch {
    if (lockHolderAlive()) {
      console.error(`another art-loop run is active (${LOCK} exists, holder alive) — run art loops SEQUENTIALLY.`);
      process.exit(2);
    }
    // Stale lock: recover via atomic rename — of N racers exactly ONE rename
    // succeeds (the file disappears for the rest), so only one may re-create.
    try {
      renameSync(LOCK, `${LOCK}.stale-${process.pid}`);
      rmSync(`${LOCK}.stale-${process.pid}`, { force: true });
    } catch {
      console.error("lock contended during stale recovery — another process won; retry later.");
      process.exit(2);
    }
    try {
      writeFileSync(LOCK, String(process.pid), { flag: "wx" });
      console.error("stale lock recovered (previous holder was gone).");
    } catch {
      console.error("lock contended after recovery — another process won; retry later.");
      process.exit(2);
    }
  }
  process.on("exit", () => { try { rmSync(LOCK, { force: true }); } catch { /* ignore */ } });
}

// Provider availability: consult the REAL probe results; if the generating
// provider is not safe_for_automation, requests fall through to human_boundary
// (Stage-6 rule: the boundary is not a failure).
function generatorAvailable() {
  try {
    const st = JSON.parse(readFileSync(join(STATE, "provider-status.json"), "utf8"));
    const g = st.providers.find((x) => x.provider === "codex_imagegen");
    if (!(g && g.available && g.safe_for_automation && g.extra_cost_status === "subscription_included_confirmed")) return false;
    // freshness: a probe is only trusted for 14 days — after that the provider
    // must be RE-PROBED (per §21: status changes require re-probing; stale
    // evidence fails closed to human_boundary, never to a paid path).
    const probedAt = Date.parse(g.probed_at || st.probed_at || 0);
    if (!Number.isFinite(probedAt) || Date.now() - probedAt > 14 * 24 * 3600 * 1000) {
      console.error("provider probe evidence is stale (>14d) — re-run the Stage-6 probe before generating.");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function writeHumanBoundary(req, reason) {
  const dir = join(STATE, "human-boundary");
  mkdirSync(dir, { recursive: true });
  const pkg = {
    status: "ART_GENERATION_HUMAN_BOUNDARY",
    reason,
    prompt: buildPrompt(req),
    ...req,
  };
  writeFileSync(join(dir, `${req.asset_id}.json`), JSON.stringify(pkg, null, 1) + "\n");
  return join("factory", "state", "art", "human-boundary", `${req.asset_id}.json`);
}

const args = process.argv.slice(2);
const cmd = args.shift();
function argOf(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
function loadManifest() {
  if (!existsSync(MANIFEST)) return { note: "Art Manifest v2 — per-asset provenance (Stage 6).", assets: [] };
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}
function saveManifest(m) {
  writeFileSync(MANIFEST, JSON.stringify(m, null, 1) + "\n");
}
function upsert(m, entry) {
  const i = m.assets.findIndex((a) => a.asset_id === entry.asset_id);
  if (i >= 0) m.assets[i] = { ...m.assets[i], ...entry };
  else m.assets.push(entry);
}
function fileHash(p) {
  return createHash("sha1").update(readFileSync(resolve(ROOT, p))).digest("hex").slice(0, 12);
}
function dims(p) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", resolve(ROOT, p)], { encoding: "utf8" });
  return { w: Number(out.match(/pixelWidth: (\d+)/)?.[1]), h: Number(out.match(/pixelHeight: (\d+)/)?.[1]) };
}

// Series Style Gate: never describe the style by TEXT alone — a text-only
// "3D clay style" drifts toward generic Pixar-like renders. Every generation
// attaches the fixed known-good reference images and must match THEM.
const REFSET = JSON.parse(readFileSync(join(ART, "reference-set.json"), "utf8"));
const SERIES_REFS = (REFSET.generation_refs || []).filter((p) => existsSync(resolve(ROOT, p)));
if (SERIES_REFS.length !== (REFSET.generation_refs || []).length) {
  console.error(`generation reference set incomplete: ${SERIES_REFS.length}/${(REFSET.generation_refs || []).length} — fix reference-set.json before generating.`);
  process.exit(1);
}

const STYLE_BLOCK = `MATCH THE ATTACHED REFERENCE IMAGES EXACTLY — they are existing assets of this series
(JIBUN CHOICE). Same clay material, same handmade miniature feeling, same character
proportions and face/eye simplification, same lighting, saturation, depth and diorama
camera feeling. Do NOT drift toward generic 3D animation / Pixar-like / realistic CG.
Rounded 3D clay / plasticine miniature diorama style, handcrafted soft texture,
bright warm colors, soft diagonal lighting, modern and slightly stylish (for Japanese kids
aged 9-12 — NOT babyish, NOT old-fashioned), consistent claymation material for people,
buildings, tools and backgrounds. Figures around 2.5-3 heads tall with simplified hands.
NO readable text, NO numbers, NO letters, NO logos, NO watermark anywhere in the image.
NO photorealism, NO real-brand or real-person likeness, NO scary or dirty expression.
Keep every important element inside the central 70% (mobile crop safety).`;

function buildPrompt(req, amendments = []) {
  const lines = [
    STYLE_BLOCK,
    ``,
    `Scene: ${req.scene}`,
    `Role in game: ${req.purpose}`,
    req.composition ? `Camera / composition: ${req.composition}` : null,
    req.required_objects?.length ? `Must include: ${req.required_objects.join("; ")}` : null,
    req.forbidden_objects?.length ? `Must NOT include: ${req.forbidden_objects.join("; ")}` : null,
    req.character_constraints ? `Characters: ${req.character_constraints}` : null,
    `Aspect ratio: ${req.aspect_ratio || "1:1"} (compose for this frame).`,
    req.background ? `Background: ${req.background}` : null,
    req.focal ? `Focal object: ${req.focal}` : null,
  ].filter(Boolean);
  if (amendments.length) {
    lines.push(``, `PREVIOUS ATTEMPT FAILED QA. Fix these specific problems this time:`);
    for (const a of amendments) lines.push(`- ${a}`);
  }
  return lines.join("\n");
}

function runQA(mode, opts) {
  const a = ["run", join(ART, "art-qa.mjs"), mode];
  a.shift();
  const cargs = [join(ART, "art-qa.mjs"), mode];
  for (const [k, v] of Object.entries(opts)) cargs.push(`--${k}`, v);
  const r = spawnSync("node", cargs, { encoding: "utf8", cwd: ROOT, timeout: 900000 });
  try {
    return JSON.parse(r.stdout.trim());
  } catch {
    return { ok: false, verdict: "FAIL", issues: [`QA runner crashed: ${(r.stderr || "").slice(-300)}`] };
  }
}

// Provider is resolved by the adapter ("auto" = data-driven registry x probe
// status); the loop stays provider-agnostic.
function generateOnce(req, promptText, refs) {
  const pf = join(STATE, `.prompt-${req.asset_id}.txt`);
  writeFileSync(pf, promptText);
  const cargs = [join(ART, "art-provider.mjs"), "generate", "--provider", "auto", "--prompt-file", pf, "--out", req.output_path, "--timeout-sec", "900"];
  if (req.size) cargs.push("--size", req.size);
  for (const r of refs || []) cargs.push("--ref", r);
  const r = spawnSync("node", cargs, { encoding: "utf8", cwd: ROOT, timeout: 960000 });
  try {
    return JSON.parse((r.stdout || r.stderr).trim().split("\n").pop());
  } catch {
    return { ok: false, error: `provider crashed: ${(r.stderr || "").slice(-300)}` };
  }
}

// One full loop for a single request. Returns the final manifest entry.
// Strategy routing (provider-agnostic): req.strategy selects the provider —
//   reuse        -> verify + register the existing asset (no generation)
//   compose      -> art-provider compose (sips crop/resize of an existing asset)
//   css | svg    -> recorded as an in-session Claude implementation task
//   generate     -> codex_imagegen if available, else human_boundary package
//   (default: generate)
function runOne(req, extraRefs = [], pairPartner = null) {
  const m = loadManifest();
  const strategy = req.strategy || "generate";
  if (strategy === "reuse") {
    const r = spawnSync("node", [join(ART, "art-provider.mjs"), "reuse", "--src", req.reuse_asset], { encoding: "utf8", cwd: ROOT });
    let ad; try { ad = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { ad = null; }
    if (!ad?.ok) { console.error(`[${req.asset_id}] reuse failed: ${(r.stderr || r.stdout).slice(-200)}`); return { status: "reuse_target_missing" }; }
    const entry = { asset_id: req.asset_id, filename: req.reuse_asset.split("/").pop(), world: req.world, purpose: req.purpose, source_type: ad.source_type, provider: ad.provider, extra_cost_status: ad.extra_cost_status, prompt: ad.prompt, reference_assets: [], dimensions: ad.dimensions, aspect_ratio: ad.aspect_ratio, created_at: new Date().toISOString(), iteration: 0, qa_score: null, qa_scores: null, qa_issues: [ad.qa_note], file_hash: ad.file_hash, used_by: req.used_by || [], status: "reused_existing" }; // honesty: inherited QA, no fresh gate run
    upsert(m, entry); saveManifest(m);
    return entry;
  }
  if (strategy === "compose") {
    const cargs = [join(ART, "art-provider.mjs"), "compose", "--src", req.compose_src, "--out", req.output_path];
    if (req.compose_crop) cargs.push("--crop", req.compose_crop);
    if (req.compose_resize) cargs.push("--resize", req.compose_resize);
    const r = spawnSync("node", cargs, { encoding: "utf8", cwd: ROOT });
    if (r.status !== 0) { console.error(`[${req.asset_id}] compose failed: ${r.stderr}`); return { status: "compose_failed" }; }
    const qa = runQA("asset", { file: req.output_path, purpose: req.purpose });
    const cd = dims(req.output_path);
    const entry = { asset_id: req.asset_id, filename: req.filename, world: req.world, purpose: req.purpose, source_type: "composition", provider: "composition", extra_cost_status: "subscription_included_confirmed", prompt: null, reference_assets: [req.compose_src], dimensions: `${cd.w}x${cd.h}`, aspect_ratio: Number((cd.w / cd.h).toFixed(3)), created_at: new Date().toISOString(), iteration: 1, qa_score: qa.scores ? Math.min(...Object.values(qa.scores)) : null, qa_scores: qa.scores || null, qa_issues: qa.issues || [], file_hash: fileHash(req.output_path), used_by: req.used_by || [], status: qa.verdict === "PASS" ? "qa_passed" : "qa_failed" };
    upsert(m, entry); saveManifest(m);
    return entry;
  }
  if (strategy === "css" || strategy === "svg") {
    const r = spawnSync("node", [join(ART, "art-provider.mjs"), "in-session-task", "--strategy", strategy], { encoding: "utf8", cwd: ROOT });
    let ad; try { ad = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { ad = null; }
    if (!ad?.ok) { console.error(`[${req.asset_id}] in-session-task failed`); return { status: "adapter_failed" }; }
    const entry = { asset_id: req.asset_id, world: req.world, purpose: req.purpose, source_type: ad.source_type, provider: ad.provider, extra_cost_status: ad.extra_cost_status, prompt: null, reference_assets: [], dimensions: null, aspect_ratio: null, created_at: new Date().toISOString(), iteration: 0, qa_score: null, qa_scores: null, qa_issues: [ad.qa_note], file_hash: null, used_by: req.used_by || [], status: "in_session_task" };
    upsert(m, entry); saveManifest(m);
    return entry;
  }
  if (!generatorAvailable()) {
    const pkgPath = writeHumanBoundary(req, "no no-cost automatable generation provider available (see provider-status.json)");
    const entry = { asset_id: req.asset_id, filename: req.filename, world: req.world, purpose: req.purpose, source_type: "human_boundary", provider: "human_boundary", extra_cost_status: "subscription_included_confirmed", created_at: new Date().toISOString(), status: "ART_GENERATION_HUMAN_BOUNDARY", request_package: pkgPath, used_by: req.used_by || [] };
    upsert(m, entry); saveManifest(m);
    console.log(`[${req.asset_id}] GENERATION_PROVIDER_UNAVAILABLE -> human-boundary package: ${pkgPath}`);
    return entry;
  }
  let amendments = [];
  let last = null;
  for (let iter = 1; iter <= MAX_ITER; iter++) {
    const promptText = buildPrompt(req, amendments);
    console.log(`[${req.asset_id}] iteration ${iter}: generating...`);
    const gen = generateOnce(req, promptText, [...new Set([...SERIES_REFS, ...(req.reference_assets || []), ...extraRefs])]);
    const genProvider = gen.provider || "unknown";
    if (!gen.ok) {
      console.error(`[${req.asset_id}] generation failed: ${gen.error}`);
      upsert(m, { asset_id: req.asset_id, filename: req.filename, world: req.world, purpose: req.purpose, source_type: "codex_imagegen", provider: "codex_imagegen", extra_cost_status: "subscription_included_confirmed", status: "generation_failed", iteration: iter, qa_issues: [gen.error], created_at: new Date().toISOString() });
      saveManifest(m);
      return { status: "generation_failed" };
    }
    const qaOpts = pairPartner
      ? { before: pairPartner, after: req.output_path, purpose: req.pair_change || req.purpose }
      : { file: req.output_path, purpose: `${req.use || ""} — ${req.purpose}` };
    const qa = runQA(pairPartner ? "pair" : "asset", qaOpts);
    const d = dims(req.output_path);
    last = {
      asset_id: req.asset_id,
      filename: req.filename,
      world: req.world,
      purpose: req.purpose,
      source_type: "generated",
      provider: genProvider,
      extra_cost_status: "subscription_included_confirmed",
      prompt: promptText,
      reference_assets: [...new Set([...SERIES_REFS, ...(req.reference_assets || []), ...extraRefs])],
      dimensions: `${d.w}x${d.h}`,
      aspect_ratio: Number((d.w / d.h).toFixed(3)),
      created_at: new Date().toISOString(),
      iteration: iter,
      qa_score: qa.scores ? Math.min(...Object.values(qa.scores)) : null,
      qa_scores: qa.scores || null,
      qa_issues: qa.issues || [],
      file_hash: fileHash(req.output_path),
      used_by: req.used_by || [],
      status: qa.verdict === "PASS" ? "qa_passed" : "qa_failed",
    };
    upsert(m, last);
    saveManifest(m);
    if (qa.verdict === "PASS") {
      console.log(`[${req.asset_id}] QA PASS (iter ${iter})`);
      return last;
    }
    console.log(`[${req.asset_id}] QA FAIL (iter ${iter}): ${(qa.issues || []).slice(0, 3).join(" | ")}`);
    // Never retry the same prompt: feed the QA issues into the next attempt.
    // Series drift repairs must be CONCRETE reference diffs, never vague
    // "more clay" wording: prepend the critic's series_diffs verbatim.
    const drift = (qa.series_diffs || []).map((d) => `Fix vs reference set: ${d}`);
    amendments = [...drift, ...(qa.issues || [])].slice(0, 8);
  }
  console.error(`[${req.asset_id}] max_iterations_reached without QA pass`);
  return last;
}

switch (cmd) {
  case "register-existing": {
    const inv = JSON.parse(readFileSync(join(STATE, "asset-inventory.json"), "utf8"));
    const m = loadManifest();
    let n = 0;
    for (const a of inv.assets) {
      if (!a.referenced_by.length && !a.quality_flags.includes("dynamic_ref_possible")) continue;
      if (m.assets.some((x) => x.asset_id === a.asset_id)) continue;
      // an asset already tracked under another id (e.g. generated via the loop)
      if (m.assets.some((x) => x.file_hash === a.hash)) continue;
      upsert(m, {
        asset_id: a.asset_id, filename: a.path.split("/").pop(), world: a.world,
        purpose: "(pre-Stage6 existing asset)", source_type: "existing", provider: "unknown_legacy",
        extra_cost_status: "unknown",
        cost_note: "legacy asset created before Stage 6; provenance unknown, no future cost (record-only, never a generation path)",
        prompt: null, reference_assets: [],
        dimensions: a.width && a.height ? `${a.width}x${a.height}` : null, aspect_ratio: a.aspect_ratio,
        created_at: null, iteration: 0, qa_score: null, qa_issues: a.quality_flags,
        file_hash: a.hash, used_by: a.referenced_by, status: "in_use",
      });
      n++;
    }
    saveManifest(m);
    console.log(`registered ${n} existing assets (manifest total: ${loadManifest().assets.length})`);
    break;
  }
  case "run": {
    acquireLock();
    const req = JSON.parse(readFileSync(argOf("--request"), "utf8"));
  if (req.output_path && !req.output_path.endsWith("/" + req.filename)) {
    throw new Error(`request ${req.asset_id}: output_path mismatch (${req.output_path} vs filename ${req.filename}) — copied request?`);
  }
    const r = runOne(req);
    process.exit(r.status === "qa_passed" || r.status === "reused_existing" ? 0 : 1);
  }
  case "run-pair": {
    acquireLock();
    const before = JSON.parse(readFileSync(argOf("--before"), "utf8"));
    const after = JSON.parse(readFileSync(argOf("--after"), "utf8"));
    for (const rq of [before, after]) {
      if (rq.output_path && !rq.output_path.endsWith("/" + rq.filename)) {
        throw new Error(`request ${rq.asset_id}: output_path mismatch (${rq.output_path} vs filename ${rq.filename}) — copied request?`);
      }
    }
    const rb = runOne(before);
    if (rb.status !== "qa_passed" && rb.status !== "reused_existing") process.exit(1);
    // AFTER uses the accepted BEFORE as its consistency reference and is QA'd as a pair.
    const ra = runOne(after, [before.output_path], before.output_path);
    process.exit(ra.status === "qa_passed" || ra.status === "reused_existing" ? 0 : 1);
  }
  case "status": {
    const m = loadManifest();
    const by = {};
    for (const a of m.assets) by[a.status] = (by[a.status] || 0) + 1;
    console.log(`manifest v2: ${m.assets.length} assets`, JSON.stringify(by));
    break;
  }
  default:
    console.error("commands: register-existing | run | run-pair | status");
    process.exit(2);
}
