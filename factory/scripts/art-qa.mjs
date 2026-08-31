// Mechanical visual QA for generated art + flagging tool for semantic QA.
//
//  node factory/scripts/art-qa.mjs shop-opening
//    -> checks every "generated"/"placed" entry: file exists, valid PNG,
//       dimensions vs aspect_ratio (2% tolerance), alpha channel when
//       transparent_background, sane file size. Writes entry.qa.mechanical.
//
//  node factory/scripts/art-qa.mjs shop-opening --flag <id> "<reason>"
//    -> marks one entry needs_regeneration with a semantic reason
//       (used by Claude's visual review: 切れている/文字が入った/テイスト違い等).
//
// Semantic judgement itself (style, cropping, forbidden objects) is done by
// Claude reading the PNGs against the manifest — see .claude/commands/generate-art.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const world = args[0];
if (!world) { console.error("usage: art-qa.mjs <world-id> [--flag <id> <reason>]"); process.exit(1); }
const manifestPath = world.endsWith(".json")
  ? path.resolve(world)
  : path.join(ROOT, `factory/projects/${world}/art-manifest.json`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const save = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// ---- flag mode (semantic QA verdict from Claude/human) ----
const flagIdx = args.indexOf("--flag");
if (flagIdx >= 0) {
  const [id, ...reason] = args.slice(flagIdx + 1);
  const e = manifest.entries.find((x) => x.id === id);
  if (!e) { console.error(`unknown id: ${id}`); process.exit(1); }
  e.status = "needs_regeneration";
  e.qa = { ...(e.qa ?? {}), semantic: reason.join(" ") || "flagged", flaggedAt: new Date().toISOString() };
  save();
  console.log(`flagged ${id} -> needs_regeneration (${e.qa.semantic})`);
  process.exit(0);
}

// ---- mechanical checks ----
function pngInfo(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  // IHDR is the first chunk: width @16, height @20, colorType @25
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), colorType: buf[25], bytes: buf.length };
}

let pass = 0, fail = 0, skipped = 0;
for (const e of manifest.entries) {
  if (e.status !== "generated" && e.status !== "placed") { skipped++; continue; }
  const file = path.join(ROOT, e.output_path);
  const problems = [];
  if (!fs.existsSync(file)) problems.push("file missing");
  else {
    const info = pngInfo(file);
    if (!info) problems.push("not a valid PNG");
    else {
      const [aw, ah] = e.aspect_ratio.split(":").map(Number);
      const want = aw / ah, got = info.w / info.h;
      if (Math.abs(got - want) / want > 0.02)
        problems.push(`aspect ${info.w}x${info.h} (${got.toFixed(2)}) != ${e.aspect_ratio}`);
      if (e.transparent_background && info.colorType !== 6 && info.colorType !== 4)
        problems.push(`no alpha channel (colorType ${info.colorType}) but transparent_background=true`);
      if (info.bytes < 10_000) problems.push(`suspiciously small file (${info.bytes}B)`);
      if (info.w < 256 || info.h < 256) problems.push(`tiny image ${info.w}x${info.h}`);
    }
  }
  e.qa = { ...(e.qa ?? {}), mechanical: problems.length ? `fail: ${problems.join("; ")}` : "pass", mechanicalAt: new Date().toISOString() };
  if (problems.length) {
    fail++;
    console.log(`  FAIL ${e.id}: ${problems.join("; ")}`);
  } else pass++;
}
save();
console.log(`art-qa (mechanical): ${pass} pass, ${fail} fail, ${skipped} not generated yet`);
console.log("semantic QA (style/cropping/text-in-image) is Claude's visual pass — see generate-art command.");
process.exit(fail ? 1 : 0);
