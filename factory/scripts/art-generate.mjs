// Factory art pipeline: art-manifest.json -> prompts -> OpenAI Image API ->
// public/assets/... -> manifest status update.
//
// SAFETY DEFAULTS
//  - Runs as DRY-RUN unless --confirm is passed: prints what it WOULD generate
//    and the estimated cost, calls no API, writes no file.
//  - Hard caps from factory/art/config.json (per-run images / per-run USD /
//    per-month USD from the ledger). Exceeding a cap aborts BEFORE any call.
//  - The API key is read from the environment or .env.local (gitignored via
//    the repo's `*.local` rule). It is never logged and never written.
//  - Already-generated images are skipped: only entries with status "pending"
//    or "needs_regeneration" run. Use --ids with --force to redo specific ones.
//
// Usage:
//   node factory/scripts/art-generate.mjs shop-opening                 # dry-run
//   node factory/scripts/art-generate.mjs shop-opening --confirm       # generate
//   node factory/scripts/art-generate.mjs shop-opening --ids a,b --force --confirm
//   flags: --limit N  --quality low|medium|high  --max-usd X  --no-refs
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "factory/art/config.json"), "utf8"));
const LEDGER = path.join(ROOT, "factory/art/generation-log.jsonl");

// ---------- args ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const worldArg = args.find((a) => !a.startsWith("--") && a !== opt("--ids") && a !== opt("--limit") && a !== opt("--quality") && a !== opt("--max-usd"));
if (!worldArg) {
  console.error("usage: node factory/scripts/art-generate.mjs <world-id|manifest-path> [--confirm] ...");
  process.exit(1);
}
const manifestPath = worldArg.endsWith(".json")
  ? path.resolve(worldArg)
  : path.join(ROOT, `factory/projects/${worldArg}/art-manifest.json`);
const confirm = flag("--confirm");
const force = flag("--force");
const useRefs = CONFIG.useReferenceImages && !flag("--no-refs");
const onlyIds = opt("--ids", "").split(",").filter(Boolean);
const limit = Number(opt("--limit", CONFIG.maxImagesPerRun));
const qualityOverride = opt("--quality", null);
const maxUsdRun = Math.min(Number(opt("--max-usd", CONFIG.maxUSDPerRun)), CONFIG.maxUSDPerRun);

// ---------- env (.env.local, gitignored) ----------
const envFile = path.join(ROOT, ".env.local");
if (!process.env.OPENAI_API_KEY && fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

// ---------- manifest / selection ----------
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const styleFallback = () => {
  const md = fs.readFileSync(path.join(ROOT, "factory/art/style-prompt.md"), "utf8");
  const m = md.split("## STYLE BLOCK")[1];
  return (m ? m.split("##")[0] : "").trim();
};
const styleBlock = (manifest.common_style ?? styleFallback()).trim();

const promptFor = (e) => {
  const parts = [
    `【シリーズ共通スタイル】${styleBlock}`,
    `【描くもの】${e.scene}`,
    `【構図】${e.composition}`,
  ];
  if (e.required_objects?.length) parts.push(`【必ず入れる】${e.required_objects.join("、")}`);
  const forbidden = [...(e.forbidden_objects ?? []), "読める文字・数字・ロゴ・透かし", "実在ブランド", "実在人物に似た顔"];
  parts.push(`【入れてはいけない】${[...new Set(forbidden)].join("、")}`);
  const sceneText = `${e.scene} ${e.composition} ${(e.required_objects ?? []).join(" ")}`;
  if (manifest.character_consistency_note && /ハルさん|char-haru/.test(sceneText + e.id)) {
    parts.push(`【人物の一貫性】${manifest.character_consistency_note}`);
  }
  if (manifest.before_after_consistency_note && /(ba-before|ba-after|board-street)/.test(e.id)) {
    parts.push(`【建物の一貫性】${manifest.before_after_consistency_note}`);
  }
  if (e.transparent_background) parts.push("【背景】完全な透過背景。地面の影は落とさない。");
  if (e.safe_margin) parts.push(`【余白】主役は中央に置き、外周に余白を残す（${e.safe_margin}）。`);
  return parts.join("\n");
};

const sizeFor = (e) => CONFIG.sizeByAspect[e.aspect_ratio] ?? "1024x1024";
const qualityFor = (e) => qualityOverride ?? CONFIG.qualityByUse[e.use] ?? CONFIG.defaultQuality;
const priceFor = (e) => CONFIG.priceTable[sizeFor(e)]?.[qualityFor(e)] ?? 0.25;
const hashOf = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);

let selected = manifest.entries.filter((e) => {
  if (onlyIds.length) return onlyIds.includes(e.id);
  return e.status === "pending" || e.status === "needs_regeneration";
});
if (onlyIds.length && !force) {
  selected = selected.filter((e) => e.status === "pending" || e.status === "needs_regeneration");
}
// never redo a finished file unless --force was given explicitly with --ids
selected = selected.filter((e) => {
  const out = path.join(ROOT, e.output_path);
  const done = e.status === "generated" || e.status === "placed";
  return force || !(done && fs.existsSync(out));
});
if (selected.length > limit) selected = selected.slice(0, limit);
// characters first: later entries can then use them as reference images
selected.sort((a, b) => (a.use === "character" ? 0 : 1) - (b.use === "character" ? 0 : 1));

// the series character sheet (reference for consistency)
const charEntry = manifest.entries.find((x) => x.use === "character" && /haru/i.test(x.id));
const charRefPath = charEntry ? path.join(ROOT, charEntry.output_path) : null;
const wantsRef = (e) =>
  useRefs && charEntry && e.id !== charEntry.id && /ハルさん|char-haru/.test(e.scene + e.id);

// prompt-change report for finished entries (never auto-regenerated)
const changed = manifest.entries.filter(
  (e) => e.generated?.promptHash && e.generated.promptHash !== hashOf(promptFor(e)) && !selected.includes(e),
);

// ---------- cost gate ----------
const estCost = selected.reduce((a, e) => a + priceFor(e), 0);
const monthSpent = fs.existsSync(LEDGER)
  ? fs.readFileSync(LEDGER, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
      .filter((r) => r.ts.slice(0, 7) === new Date().toISOString().slice(0, 7))
      .reduce((a, r) => a + (r.costUSD ?? 0), 0)
  : 0;

console.log(`art-generate: ${path.relative(ROOT, manifestPath)}`);
console.log(`  mode          : ${confirm ? "GENERATE" : "DRY-RUN (no API call, no writes)"}`);
console.log(`  selected      : ${selected.length} image(s)  (limit ${limit})`);
for (const e of selected) {
  console.log(`   - ${e.id.padEnd(24)} ${sizeFor(e).padEnd(9)} ${qualityFor(e).padEnd(6)} $${priceFor(e).toFixed(3)}${e.transparent_background ? " transparent" : ""}${wantsRef(e) ? " +ref(character)" : ""}`);
}
console.log(`  estimated cost: $${estCost.toFixed(2)} (cap/run $${maxUsdRun.toFixed(2)})`);
console.log(`  month so far  : $${monthSpent.toFixed(2)} (cap/month $${CONFIG.maxUSDPerMonth.toFixed(2)})`);
if (changed.length) {
  console.log(`  prompt changed since generation (NOT auto-regenerated): ${changed.map((e) => e.id).join(", ")}`);
  console.log(`    -> regenerate deliberately with: --ids <id> --force --confirm`);
}
if (!selected.length) { console.log("  nothing to do."); process.exit(0); }
if (estCost > maxUsdRun) { console.error(`  ABORT: estimate exceeds per-run cap.`); process.exit(2); }
if (monthSpent + estCost > CONFIG.maxUSDPerMonth) { console.error(`  ABORT: would exceed monthly cap.`); process.exit(2); }
if (!confirm) { console.log("  dry-run done. re-run with --confirm to generate."); process.exit(0); }
if (!process.env.OPENAI_API_KEY) {
  console.error("  ABORT: OPENAI_API_KEY not set. Put it in .env.local (gitignored):");
  console.error("    OPENAI_API_KEY=sk-...");
  process.exit(3);
}

// ---------- generation ----------
const saveManifest = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
const ledger = (rec) => fs.appendFileSync(LEDGER, JSON.stringify(rec) + "\n");

async function callApi(e, prompt) {
  const size = sizeFor(e);
  const quality = qualityFor(e);
  const base = { model: CONFIG.model, prompt, size, quality, n: 1 };
  const refPath = charRefPath;
  const wantRef = wantsRef(e) && refPath && fs.existsSync(refPath);
  let res;
  if (wantRef) {
    // images/edits with the character sheet as reference keeps the person consistent
    const form = new FormData();
    form.append("model", CONFIG.model);
    form.append("prompt", `${prompt}\n【参照画像】添付はハルさんの立ち絵。同一人物として描くこと。`);
    form.append("size", size);
    form.append("quality", quality);
    form.append("image[]", new Blob([fs.readFileSync(refPath)], { type: "image/png" }), "char-haru.png");
    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
  } else {
    if (e.transparent_background) base.background = "transparent";
    base.output_format = "png";
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(base),
    });
  }
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image data in response");
  return Buffer.from(b64, "base64");
}

function postProcess(file, e) {
  if (!CONFIG.postProcessCrop) return;
  const [aw, ah] = e.aspect_ratio.split(":").map(Number);
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file]).toString();
  const w = Number(dims.match(/pixelWidth: (\d+)/)?.[1]);
  const h = Number(dims.match(/pixelHeight: (\d+)/)?.[1]);
  if (!w || !h) return;
  // centre-crop to the exact manifest aspect ratio
  let tw = w, th = Math.round((w * ah) / aw);
  if (th > h) { th = h; tw = Math.round((h * aw) / ah); }
  if (Math.abs(tw - w) > 2 || Math.abs(th - h) > 2) {
    execFileSync("sips", ["-c", String(th), String(tw), file]);
  }
}

let ok = 0, failed = 0;
for (const e of selected) {
  const prompt = promptFor(e);
  const outFile = path.join(ROOT, e.output_path);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      process.stdout.write(`  [${ok + failed + 1}/${selected.length}] ${e.id} (attempt ${attempt}) ... `);
      const buf = await callApi(e, prompt);
      fs.writeFileSync(outFile, buf);
      try { postProcess(outFile, e); } catch { /* crop is best-effort */ }
      e.status = "generated";
      e.generated = {
        at: new Date().toISOString(),
        model: CONFIG.model,
        size: sizeFor(e),
        quality: qualityFor(e),
        promptHash: hashOf(prompt),
        costUSD: priceFor(e),
      };
      delete e.lastError;
      saveManifest(); // crash-safe: progress survives an interrupt
      ledger({ ts: new Date().toISOString(), id: e.id, world: manifest.world_id, costUSD: priceFor(e), attempt });
      console.log("ok");
      ok++;
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.log(`fail (${String(err.message).split("\n")[0].slice(0, 120)})`);
      // content-policy / bad-request: retrying the same prompt won't help
      if (err.status === 400) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, [2000, 8000, 20000][attempt - 1]));
    }
  }
  if (lastErr) {
    failed++;
    e.lastError = { at: new Date().toISOString(), message: String(lastErr.message).slice(0, 300) };
    saveManifest();
  }
}
console.log(`done: ${ok} generated, ${failed} failed${failed ? " (statuses left as-is; re-run to resume)" : ""}`);
process.exit(failed ? 1 : 0);
