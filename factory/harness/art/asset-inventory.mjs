#!/usr/bin/env node
// Stage 6: mechanical asset inventory. Walks public/ image files, records
// dimensions (via macOS `sips`), hash, size, and code references (grep), and
// flags duplicates / orphans / oversized files. Output:
//   factory/state/art/asset-inventory.json
// Semantic fields (role, likely_reusable refinement) are merged from the Codex
// art-requirement scan by build-art-db.mjs.
//
// Usage: node factory/harness/art/asset-inventory.mjs

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT_DIR = join(ROOT, "factory", "state", "art");
mkdirSync(OUT_DIR, { recursive: true });

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (IMG_EXT.has(extname(e.name).toLowerCase())) acc.push(p);
  }
  return acc;
}

function dims(path) {
  if (extname(path).toLowerCase() === ".svg") {
    const s = readFileSync(path, "utf8");
    const vb = s.match(/viewBox=["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (vb) return { width: Number(vb[1]), height: Number(vb[2]) };
    const w = s.match(/width=["']([\d.]+)/), h = s.match(/height=["']([\d.]+)/);
    return { width: w ? Number(w[1]) : null, height: h ? Number(h[1]) : null };
  }
  try {
    const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], { encoding: "utf8" });
    const w = out.match(/pixelWidth: (\d+)/), h = out.match(/pixelHeight: (\d+)/);
    return { width: w ? Number(w[1]) : null, height: h ? Number(h[1]) : null };
  } catch {
    return { width: null, height: null };
  }
}

// Collect source text once for reference matching.
function collectSources(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") collectSources(p, acc);
    else if (/\.(tsx?|css|html|json|md)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const sourceFiles = [
  ...collectSources(join(ROOT, "src")),
  join(ROOT, "index.html"),
];
const sources = sourceFiles.map((f) => ({ f: relative(ROOT, f), text: readFileSync(f, "utf8") }));

// Dynamic references like H(`after-${best}`) — collect template-literal
// prefixes so files matching them are not misflagged as orphans.
const dynPrefixes = new Set();
for (const s of sources) {
  for (const m of s.text.matchAll(/`([a-z0-9_-]+?[-_])\$\{/g)) dynPrefixes.add(m[1]);
}

const files = walk(join(ROOT, "public"));
const worldOf = (rel) => {
  const m = rel.match(/assets\/([a-z-]+)\//);
  if (m) return m[1];
  return "shared";
};

const assets = files.map((abs) => {
  const rel = relative(ROOT, abs);
  const st = statSync(abs);
  const { width, height } = dims(abs);
  const hash = createHash("sha1").update(readFileSync(abs)).digest("hex").slice(0, 12);
  // Components reference assets by extension-less stem via helpers like
  // `K("bg-farm")` and data files use `image: "er_arrival"` — match the stem
  // as a quoted string (or a full filename for direct/CSS references).
  const name = basename(abs);
  const stem = name.replace(/\.[^.]+$/, "");
  const stemRe = new RegExp(`["'\`/]${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`.]`);
  const referenced_by = sources.filter((s) => s.text.includes(name) || stemRe.test(s.text)).map((s) => s.f);
  const dynamicRef = [...dynPrefixes].some((p) => stem.startsWith(p));
  const flags = [];
  if (st.size > 1_500_000) flags.push("oversized");
  if (!referenced_by.length && dynamicRef) flags.push("dynamic_ref_possible");
  else if (!referenced_by.length) flags.push("orphan");
  if (width && height && (width < 64 || height < 64)) flags.push("tiny");
  return {
    asset_id: rel.replace(/[^a-zA-Z0-9]+/g, "_"),
    path: rel,
    world: worldOf(rel),
    format: extname(abs).slice(1).toLowerCase(),
    width, height,
    aspect_ratio: width && height ? Number((width / height).toFixed(3)) : null,
    file_size: st.size,
    referenced_by,
    hash,
    likely_reusable: referenced_by.length > 0 || !flags.includes("orphan"),
    quality_flags: flags,
  };
});

// duplicate detection by content hash and by identical basename
const byHash = {};
for (const a of assets) (byHash[a.hash] = byHash[a.hash] || []).push(a.path);
const dupGroups = Object.values(byHash).filter((g) => g.length > 1);
for (const a of assets) if (byHash[a.hash].length > 1) a.quality_flags.push("duplicate_content");

// referenced-but-absent check: /assets/ paths in code that do not exist on disk
const existingRel = new Set(assets.map((a) => "/" + a.path.replace(/^public\//, "")));
const missingRefs = [];
for (const s of sources) {
  for (const m of s.text.matchAll(/["'`(](\/?assets\/[^"'`)\s]+\.(?:png|jpe?g|webp|svg|gif))["'`)]/g)) {
    const p = m[1].startsWith("/") ? m[1] : "/" + m[1];
    if (!existingRel.has(p)) missingRefs.push({ ref: p, in: s.f });
  }
}

const doc = {
  note: "Mechanical asset inventory (Stage 6). Regenerate: node factory/harness/art/asset-inventory.mjs",
  generated_at: new Date().toISOString(),
  totals: {
    assets: assets.length,
    orphans: assets.filter((a) => a.quality_flags.includes("orphan")).length,
    duplicates_groups: dupGroups.length,
    oversized: assets.filter((a) => a.quality_flags.includes("oversized")).length,
    total_bytes: assets.reduce((s, a) => s + a.file_size, 0),
  },
  duplicate_groups: dupGroups,
  missing_references: missingRefs,
  assets,
};
writeFileSync(join(OUT_DIR, "asset-inventory.json"), JSON.stringify(doc, null, 1) + "\n");
console.log(`assets:${doc.totals.assets} orphans:${doc.totals.orphans} dupGroups:${doc.totals.duplicates_groups} oversized:${doc.totals.oversized} missingRefs:${missingRefs.length}`);
console.log(`bytes total: ${(doc.totals.total_bytes / 1e6).toFixed(1)} MB`);
