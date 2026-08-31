// Connects generated art to the implementation and verifies the wiring:
//   - which generated files are actually referenced from src/ (by filename)
//   - which references in src/ point at files that do not exist
//   - with --update: entries that are generated AND referenced -> status "placed"
//
//  node factory/scripts/art-check-links.mjs shop-opening [--update]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const world = args[0];
if (!world) { console.error("usage: art-check-links.mjs <world-id> [--update]"); process.exit(1); }
const update = args.includes("--update");
const manifestPath = path.join(ROOT, `factory/projects/${world}/art-manifest.json`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// all source text that could reference assets
const srcFiles = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f)) srcFiles.push(p);
  }
};
walk(path.join(ROOT, "src"));
const srcText = srcFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

// asset dir of this world (from output paths), e.g. public/assets/shop
const assetDirs = [...new Set(manifest.entries.map((e) => path.dirname(e.output_path)))];

let placed = 0, unref = 0, missing = 0;
for (const e of manifest.entries) {
  const file = path.join(ROOT, e.output_path);
  const name = path.basename(e.output_path, ".png");
  const referenced = srcText.includes(`"${name}"`) || srcText.includes(`${name}.png`) || srcText.includes(`("${name}")`);
  const exists = fs.existsSync(file);
  if (exists && referenced) {
    placed++;
    if (update && e.status === "generated") e.status = "placed";
  } else if (exists && !referenced) {
    unref++;
    console.log(`  unreferenced : ${e.id} (${e.output_path})`);
  } else if (!exists && referenced) {
    missing++;
    console.log(`  MISSING file : ${e.id} referenced from src but ${e.output_path} does not exist`);
  }
}

// stray references: src mentions the asset dir with names not in the manifest
for (const dir of assetDirs) {
  const webPrefix = dir.replace(/^public\//, "");
  const re = new RegExp(`${webPrefix.replace(/[/\\]/g, "[/\\\\]")}/([\\w-]+)\\.png`, "g");
  const known = new Set(manifest.entries.map((e) => path.basename(e.output_path, ".png")));
  for (const m of srcText.matchAll(re)) {
    if (!known.has(m[1])) { console.log(`  stray ref    : src references ${webPrefix}/${m[1]}.png (not in manifest)`); missing++; }
  }
}

if (update) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`art-check-links: ${placed} placed, ${unref} generated-but-unreferenced, ${missing} problem(s)${update ? " (statuses updated)" : ""}`);
process.exit(missing ? 1 : 0);
