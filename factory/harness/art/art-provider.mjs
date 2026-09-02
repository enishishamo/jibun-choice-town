#!/usr/bin/env node
// Art Provider Adapter (Stage 6). The Art Loop never talks to a provider
// directly — it calls this adapter, so providers can be swapped without
// touching the loop. Paid APIs are mechanically disabled here.
//
// Providers (priority order lives in the loop, not here):
//   reuse           — returns an existing asset path (no generation)
//   css / svg       — handled by Claude in-session (adapter records intent)
//   composition     — sips-based crop/resize of existing assets
//   codex_imagegen  — Codex CLI built-in image_gen.imagegen (ChatGPT OAuth,
//                     subscription-included; REAL-probed 2026-09-02)
//   human_boundary  — writes a ready-to-run request package instead of a file
//   openai_image_api — ALWAYS DISABLED (paid). Exists only to fail loudly.
//
// Usage (CLI):
//   node art-provider.mjs generate --provider codex_imagegen --prompt-file p.txt \
//     --out public/assets/shop/x.png [--ref a.png --ref b.png] [--size 1024x1024] [--timeout-sec 900]
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

switch (cmd) {
  case "generate": {
    const provider = argOf("--provider");
    if (PAID_PROVIDERS.has(provider)) {
      die({ ok: false, error: `provider "${provider}" is a paid API and is permanently disabled (paid_api.enabled=false). Use codex_imagegen or human_boundary.` });
    }
    if (provider !== "codex_imagegen") {
      die({ ok: false, error: `unknown/non-generating provider "${provider}" for generate` });
    }
    const promptFile = argOf("--prompt-file") || die({ ok: false, error: "--prompt-file required" });
    const outPath = argOf("--out") || die({ ok: false, error: "--out required" });
    const refs = argAll("--ref");
    const size = argOf("--size", null); // post-resize target, e.g. 1024x640
    const timeoutSec = Number(argOf("--timeout-sec", "900"));

    // preflight: OAuth session, never an API key
    const auth = spawnSync("codex", ["login", "status"], { encoding: "utf8" });
    if (auth.status !== 0) die({ ok: false, error: "codex not logged in (ChatGPT OAuth required; API keys are forbidden)" });

    const work = mkdtempSync(join(tmpdir(), "jc-artgen-"));
    const fname = basename(outPath);
    const prompt = readFileSync(promptFile, "utf8") +
      `\n\nUse ONLY your built-in image generation tool (image_gen.imagegen) — no external APIs, no API keys, no drawing code. Save the generated image in the current working directory as exactly: ${fname}\nThen reply with a single JSON object only: {"generated": true|false, "file": "${fname}", "error": null|"..."}`;
    const cargs = ["exec", "--sandbox", "workspace-write", "--cd", work, "--skip-git-repo-check", "--output-last-message", join(work, "reply.txt")];
    for (const r of refs) cargs.push("-i", resolve(ROOT, r));
    cargs.push("-");
    const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: timeoutSec * 1000 });
    const produced = join(work, fname);
    if (!existsSync(produced)) {
      const reply = existsSync(join(work, "reply.txt")) ? readFileSync(join(work, "reply.txt"), "utf8").slice(0, 500) : "";
      die({ ok: false, error: "generation produced no file", reply, stderr: (r.stderr || "").slice(-400) });
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
      execFileSync("sips", ["-c", String(cropH), String(cropW), produced]); // center crop
      execFileSync("sips", ["-Z", String(Math.max(w, h)), produced]); // fit box
    }
    mkdirSync(dirname(resolve(ROOT, outPath)), { recursive: true });
    copyFileSync(produced, resolve(ROOT, outPath));
    ok({ ok: true, provider: "codex_imagegen", out: outPath, refs, extra_cost_status: "subscription_included_confirmed" });
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
