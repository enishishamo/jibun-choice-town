#!/usr/bin/env node
// Art Provider Adapter (Stage 6). The Art Loop never talks to a provider
// directly — it calls this adapter, so providers can be swapped without
// touching the loop. Paid APIs are mechanically disabled here.
//
// Generator selection is DATA-DRIVEN: `--provider auto` (default) picks the
// first provider that (a) has an implementation in GENERATORS below and
// (b) is recorded in factory/state/art/provider-status.json as can_generate +
// safe_for_automation + subscription_included_confirmed (REAL-probed).
// Adding a future no-cost provider = one GENERATORS entry + one status row.
//
// Usage (CLI):
//   node art-provider.mjs generate [--provider auto|<name>] --prompt-file p.txt \
//     --out public/assets/shop/x.png [--ref a.png ...] [--size 1200x900] [--timeout-sec 900]
//   node art-provider.mjs compose --src <path> --out <path> [--crop x,y,w,h] [--resize WxH]
//   node art-provider.mjs human-boundary --request-file req.json
//
// Exit 0 on success; non-zero with a JSON error line otherwise.

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = join(HARNESS, "..", "..");
const PAID_PROVIDERS = new Set(["openai_image_api", "anthropic", "gpt-image-1"]);

const args = process.argv.slice(2);
const cmd = args.shift();
function argAll(name) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === name && args[i + 1] !== undefined) out.push(args[i + 1]);
  return out;
}
function argOf(name, dflt) {
  const v = argAll(name);
  return v.length ? v[0] : dflt;
}
function die(obj) {
  console.error(JSON.stringify(obj));
  process.exit(1);
}
function ok(obj) {
  console.log(JSON.stringify(obj));
  process.exit(0);
}

// ---- shared post-processing -------------------------------------------------
function validateAndPlace(produced, outPath, size, replyRaw) {
  // integrity: reply JSON (if present) must not report failure; file must be a
  // real decodable image (magic bytes + sips can read its dimensions)
  const jstart = (replyRaw || "").indexOf("{");
  if (jstart >= 0) {
    try {
      const rep = JSON.parse(replyRaw.slice(jstart, replyRaw.lastIndexOf("}") + 1));
      if (rep.generated === false) die({ ok: false, error: `generator reported failure: ${rep.error}` });
    } catch { /* non-JSON reply tolerated if the file validates below */ }
  }
  const head = readFileSync(produced).subarray(0, 8);
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isJpg = head[0] === 0xff && head[1] === 0xd8;
  if (!isPng && !isJpg) die({ ok: false, error: "output is not a valid PNG/JPEG (magic bytes)" });
  try {
    execFileSync("sips", ["-g", "pixelWidth", produced], { stdio: "pipe" });
  } catch {
    die({ ok: false, error: "output image is not decodable (sips failed)" });
  }
  if (size) {
    // "WxH" is a target ASPECT + max box: center-crop to the aspect (no
    // distortion), then downscale so the longer side fits the box.
    const [w, h] = size.split("x").map(Number);
    const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", produced], { encoding: "utf8" });
    const cw = Number(info.match(/pixelWidth: (\d+)/)[1]);
    const ch = Number(info.match(/pixelHeight: (\d+)/)[1]);
    const targetAR = w / h;
    let cropW = cw, cropH = Math.round(cw / targetAR);
    if (cropH > ch) { cropH = ch; cropW = Math.round(ch * targetAR); }
    execFileSync("sips", ["-c", String(cropH), String(cropW), produced]);
    execFileSync("sips", ["-Z", String(Math.max(w, h)), produced]);
  }
  mkdirSync(dirname(resolve(ROOT, outPath)), { recursive: true });
  copyFileSync(produced, resolve(ROOT, outPath));
}

// ---- generator implementations ----------------------------------------------
// codex must run under ChatGPT OAuth only: strip any API-key style env vars so
// key-based auth is impossible even if the shell exports one.
const SAFE_ENV = { ...process.env };
for (const k of Object.keys(SAFE_ENV)) if (/^(OPENAI|AZURE_OPENAI|ANTHROPIC)_/i.test(k)) delete SAFE_ENV[k];

function generateWithCodex({ promptFile, outPath, refs, size, timeoutSec }) {
  // preflight: session must be ChatGPT OAuth, mechanically verified from the
  // status output — an API-key login is rejected outright.
  const auth = spawnSync("codex", ["login", "status"], { encoding: "utf8", env: SAFE_ENV });
  if (auth.status !== 0) die({ ok: false, error: "codex not logged in (ChatGPT OAuth required; API keys are forbidden)" });
  const authText = `${auth.stdout || ""}${auth.stderr || ""}`;
  if (!/ChatGPT/i.test(authText) || /API key/i.test(authText)) {
    die({ ok: false, error: `codex session is not ChatGPT-OAuth (status says: ${authText.trim().slice(0, 120)}) — API-key auth is forbidden` });
  }
  const work = mkdtempSync(join(tmpdir(), "jc-artgen-"));
  const fname = basename(outPath);
  const prompt = readFileSync(promptFile, "utf8") +
    `\n\nUse ONLY your built-in image generation tool (image_gen.imagegen) — no external APIs, no API keys, no drawing code. Save the generated image in the current working directory as exactly: ${fname}\nThen reply with a single JSON object only: {"generated": true|false, "file": "${fname}", "error": null|"..."}`;
  const cargs = ["exec", "--sandbox", "workspace-write", "--cd", work, "--skip-git-repo-check", "--output-last-message", join(work, "reply.txt")];
  for (const r of refs) cargs.push("-i", resolve(ROOT, r));
  cargs.push("-");
  const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: timeoutSec * 1000, env: SAFE_ENV });
  const produced = join(work, fname);
  const replyRaw = existsSync(join(work, "reply.txt")) ? readFileSync(join(work, "reply.txt"), "utf8") : "";
  if (r.status !== 0 && !existsSync(produced)) {
    die({ ok: false, error: `codex exec exited ${r.status}`, reply: replyRaw.slice(0, 400), stderr: (r.stderr || "").slice(-400) });
  }
  if (!existsSync(produced)) {
    die({ ok: false, error: "generation produced no file", reply: replyRaw.slice(0, 500), stderr: (r.stderr || "").slice(-400) });
  }
  validateAndPlace(produced, outPath, size, replyRaw);
  return { ok: true, provider: "codex_imagegen", out: outPath, refs, extra_cost_status: "subscription_included_confirmed" };
}

// Adding a future no-cost provider = one entry here + a probed status row.
const GENERATORS = {
  codex_imagegen: generateWithCodex,
};

function resolveGenerator(requested) {
  const status = JSON.parse(readFileSync(join(ROOT, "factory/state/art/provider-status.json"), "utf8"));
  const usable = status.providers.filter(
    (p) => p.can_generate && p.safe_for_automation && p.extra_cost_status === "subscription_included_confirmed" && GENERATORS[p.provider],
  );
  if (requested && requested !== "auto") {
    if (PAID_PROVIDERS.has(requested)) die({ ok: false, error: `provider "${requested}" is a paid API and is permanently disabled (paid_api.enabled=false).` });
    const hit = usable.find((p) => p.provider === requested);
    if (!hit) die({ ok: false, error: `provider "${requested}" is not usable (not probed subscription-included / not implemented). Usable: ${usable.map((p) => p.provider).join(", ") || "none"}` });
    return hit.provider;
  }
  if (!usable.length) die({ ok: false, error: "no usable no-cost generating provider (see provider-status.json) — use human-boundary" });
  return usable[0].provider;
}

switch (cmd) {
  case "generate": {
    const provider = resolveGenerator(argOf("--provider", "auto"));
    const promptFile = argOf("--prompt-file") || die({ ok: false, error: "--prompt-file required" });
    const outPath = argOf("--out") || die({ ok: false, error: "--out required" });
    const refs = argAll("--ref");
    const size = argOf("--size", null);
    const timeoutSec = Number(argOf("--timeout-sec", "900"));
    ok(GENERATORS[provider]({ promptFile, outPath, refs, size, timeoutSec }));
    break;
  }

  case "compose": {
    const src = argOf("--src") || die({ ok: false, error: "--src required" });
    const outPath = argOf("--out") || die({ ok: false, error: "--out required" });
    const crop = argOf("--crop", null); // x,y,w,h
    const resize = argOf("--resize", null); // WxH
    const abs = resolve(ROOT, src);
    if (!existsSync(abs)) die({ ok: false, error: `missing src ${src}` });
    mkdirSync(dirname(resolve(ROOT, outPath)), { recursive: true });
    copyFileSync(abs, resolve(ROOT, outPath));
    const dst = resolve(ROOT, outPath);
    if (crop) {
      const [x, y, w, h] = crop.split(",").map(Number);
      execFileSync("sips", ["--cropOffset", String(y), String(x), "-c", String(h), String(w), dst]);
    }
    if (resize) {
      const [w, h] = resize.split("x").map(Number);
      execFileSync("sips", ["-z", String(h), String(w), dst]);
    }
    ok({ ok: true, provider: "composition", out: outPath, src });
    break;
  }

  case "reuse": {
    // Validate an existing asset and emit a full provenance entry for the
    // manifest — the loop only upserts what the adapter returns.
    const src = argOf("--src") || die({ ok: false, error: "--src required" });
    const abs = resolve(ROOT, src);
    if (!existsSync(abs)) die({ ok: false, error: `reuse target missing: ${src}` });
    const head = readFileSync(abs).subarray(0, 8);
    const okImg = (head[0] === 0x89 && head[1] === 0x50) || (head[0] === 0xff && head[1] === 0xd8);
    if (!okImg && !src.endsWith(".webp") && !src.endsWith(".svg")) die({ ok: false, error: "reuse target is not a valid image" });
    let w = null, h = null;
    try {
      const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", abs], { encoding: "utf8" });
      w = Number(info.match(/pixelWidth: (\d+)/)?.[1]); h = Number(info.match(/pixelHeight: (\d+)/)?.[1]);
    } catch { /* svg etc. */ }
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha1").update(readFileSync(abs)).digest("hex").slice(0, 12);
    ok({ ok: true, provider: "existing_asset_reuse", source_type: "reuse", extra_cost_status: "subscription_included_confirmed", out: src, prompt: null, dimensions: w && h ? `${w}x${h}` : null, aspect_ratio: w && h ? Number((w / h).toFixed(3)) : null, file_hash: hash, qa_note: "reuse of an in-use asset — QA inherited from series usage" });
    break;
  }

  case "in-session-task": {
    // css / svg visuals are authored by Claude directly in component code —
    // there is no artifact file to produce here, so the adapter's contract is
    // to emit the provenance entry and the verification obligations.
    const strategy = argOf("--strategy") || die({ ok: false, error: "--strategy css|svg required" });
    if (!["css", "svg"].includes(strategy)) die({ ok: false, error: "--strategy must be css or svg" });
    ok({ ok: true, provider: strategy, source_type: strategy, extra_cost_status: "subscription_included_confirmed", prompt: null, dimensions: null, aspect_ratio: null, file_hash: null, qa_note: "in-session Claude implementation; verified via code review + browser visual QA (no generated artifact file)" });
    break;
  }

  case "human-boundary": {
    // No automatable no-cost provider for this request: write a complete,
    // ready-to-execute package so a human (or a future provider) can run it
    // without any further design work. This is NOT a failure state.
    const reqFile = argOf("--request-file") || die({ ok: false, error: "--request-file required" });
    const req = JSON.parse(readFileSync(reqFile, "utf8"));
    const dir = join(ROOT, "factory", "state", "art", "human-boundary");
    mkdirSync(dir, { recursive: true });
    const out = join(dir, `${req.asset_id || "request"}.json`);
    writeFileSync(out, JSON.stringify({ status: "ART_GENERATION_HUMAN_BOUNDARY", ...req }, null, 1));
    ok({ ok: true, provider: "human_boundary", request: out });
    break;
  }

  default:
    die({ ok: false, error: "commands: generate | compose | human-boundary" });
}
