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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
function acquireLock() {
  if (existsSync(LOCK)) {
    console.error(`another art-loop run is active (${LOCK} exists) — run art loops SEQUENTIALLY. Delete the lock only if you are sure no run is alive.`);
    process.exit(2);
  }
  writeFileSync(LOCK, String(process.pid));
  process.on("exit", () => { try { rmSync(LOCK, { force: true }); } catch { /* ignore */ } });
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

const STYLE_BLOCK = `Rounded 3D clay / plasticine miniature diorama style, handcrafted soft texture,
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

function generateOnce(req, promptText, refs) {
  const pf = join(STATE, `.prompt-${req.asset_id}.txt`);
  writeFileSync(pf, promptText);
  const cargs = [join(ART, "art-provider.mjs"), "generate", "--provider", "codex_imagegen", "--prompt-file", pf, "--out", req.output_path, "--timeout-sec", "900"];
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
function runOne(req, extraRefs = [], pairPartner = null) {
  const m = loadManifest();
  let amendments = [];
  let last = null;
  for (let iter = 1; iter <= MAX_ITER; iter++) {
    const promptText = buildPrompt(req, amendments);
    console.log(`[${req.asset_id}] iteration ${iter}: generating...`);
    const gen = generateOnce(req, promptText, [...(req.reference_assets || []), ...extraRefs]);
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
      provider: "codex_imagegen",
      extra_cost_status: "subscription_included_confirmed",
      prompt: promptText,
      reference_assets: [...(req.reference_assets || []), ...extraRefs],
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
    amendments = (qa.issues || []).slice(0, 6);
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
      upsert(m, {
        asset_id: a.asset_id, filename: a.path.split("/").pop(), world: a.world,
        purpose: "(pre-Stage6 existing asset)", source_type: "existing", provider: "unknown_legacy",
        extra_cost_status: "subscription_included_confirmed", prompt: null, reference_assets: [],
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
    const r = runOne(req);
    process.exit(r.status === "qa_passed" ? 0 : 1);
  }
  case "run-pair": {
    acquireLock();
    const before = JSON.parse(readFileSync(argOf("--before"), "utf8"));
    const after = JSON.parse(readFileSync(argOf("--after"), "utf8"));
    const rb = runOne(before);
    if (rb.status !== "qa_passed") process.exit(1);
    // AFTER uses the accepted BEFORE as its consistency reference and is QA'd as a pair.
    const ra = runOne(after, [before.output_path], before.output_path);
    process.exit(ra.status === "qa_passed" ? 0 : 1);
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
