#!/usr/bin/env node
// Asset link QA (Stage 6, §16): fails (exit 1) on broken references (explicit
// paths AND extension-less helper calls), casing mismatches, files outside
// expected dirs, and huge files (>4MB). WARNINGS (non-fatal by design):
// duplicate basenames across worlds (safe — helper references are scoped per
// directory), 1.5-4MB files, duplicate content. Informational: orphans
// (protected, never deleted).
//
// Usage: node factory/harness/art/art-link-qa.mjs

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
// Always regenerate the inventory first so this QA never reads stale data.
execFileSync("node", [join(ROOT, "factory/harness/art/asset-inventory.mjs")], { stdio: "pipe" });
const inv = JSON.parse(readFileSync(join(ROOT, "factory/state/art/asset-inventory.json"), "utf8"));

let errors = [];
let warnings = [];

// 1. referenced-but-absent (already computed, includes casing because the set is exact)
for (const m of inv.missing_references) errors.push(`missing reference: ${m.ref} (in ${m.in})`);

// 2. casing mismatch: a missing ref that matches an existing path case-insensitively
const lower = new Map(inv.assets.map((a) => ["/" + a.path.replace(/^public\//, "").toLowerCase(), a.path]));
for (const m of inv.missing_references) {
  const hit = lower.get(m.ref.toLowerCase());
  if (hit) errors.push(`casing mismatch: ${m.ref} vs ${hit}`);
}

// 3. duplicate basenames in different directories (ambiguous stem references)
const byName = {};
for (const a of inv.assets) {
  const n = a.path.split("/").pop();
  (byName[n] = byName[n] || []).push(a.path);
}
for (const [n, paths] of Object.entries(byName)) {
  if (paths.length > 1) warnings.push(`duplicate filename "${n}": ${paths.join(" , ")}`);
}

// 4. assets outside expected directories
for (const a of inv.assets) {
  if (!/^public\/(assets\/|.*\.(svg|png|ico)$)/.test(a.path)) errors.push(`unexpected location: ${a.path}`);
}

// 5. oversized: warn above 1.5MB, hard error above 4MB (accidental huge files)
for (const a of inv.assets) {
  if (a.file_size > 4_000_000) errors.push(`huge file: ${a.path} (${(a.file_size / 1e6).toFixed(1)}MB > 4MB)`);
  else if (a.quality_flags.includes("oversized")) warnings.push(`oversized: ${a.path} (${(a.file_size / 1e6).toFixed(1)}MB)`);
}

// 5b. extensionless helper references: const X = (n) => \`...assets/<dir>/${n}.<ext>\`
//     — every literal X("stem") call must resolve to an existing file.
import { readFileSync as rf, readdirSync as rd } from "node:fs";
import { join as pj } from "node:path";
function srcFiles(dir, acc = []) {
  for (const e of rd(pj(ROOT, dir), { withFileTypes: true })) {
    const rel = pj(dir, e.name);
    if (e.isDirectory()) srcFiles(rel, acc);
    else if (/\.(tsx?|ts)$/.test(e.name)) acc.push(rel);
  }
  return acc;
}
const assetSet = new Set(inv.assets.map((a) => a.path));
for (const f of srcFiles("src")) {
  const text = rf(pj(ROOT, f), "utf8");
  for (const def of text.matchAll(/const (\w+) = \((?:n|name)[^)]*\) =>\s*`\$\{import\.meta\.env\.BASE_URL\}(assets\/[a-z-]+\/)\$\{(?:n|name)\}\.(\w+)`/g)) {
    const [, helper, dir, ext] = def;
    for (const call of text.matchAll(new RegExp(`\\b${helper}\\((["'])([^"'\\)]+)\\1\\)`, "g"))) {
      const path = `public/${dir}${call[2]}.${ext}`;
      if (!assetSet.has(path)) errors.push(`broken helper reference: ${helper}(${call[1]}${call[2]}${call[1]}) -> ${path} (in ${f})`);
    }
  }
}

// 5c. PROVENANCE COVERAGE (2026-09-21, R6c) — every asset that src/ actually
// references must have a provenance entry in the manifest with a known
// source_type. Before this, an image could be committed, referenced and
// shipped with nobody able to say where it came from (generated? paid API?
// copied from the web?) — factory/rules/art-style.md requires provenance,
// but nothing checked it, so the rule only held while someone remembered.
// The join is by content hash first (exact), then by the manifest entry's
// `filename`, which may be world-relative ("baskets/red.png") — hence the
// path-suffix match. A file no longer referenced from src/ is NOT required
// to have an entry (existing-asset protection: orphans are never deleted,
// and back-filling provenance for dead files is busywork).
const MANIFEST_V2 = join(ROOT, "factory/state/art/manifest-v2.json");
const manifest = existsSync(MANIFEST_V2) ? JSON.parse(readFileSync(MANIFEST_V2, "utf8")) : { assets: [] };
const manifestByHash = new Map();
for (const e of manifest.assets ?? []) {
  if (e.file_hash && !manifestByHash.has(e.file_hash)) manifestByHash.set(e.file_hash, e);
}
function manifestEntriesFor(asset) {
  const byHash = manifestByHash.get(asset.hash);
  if (byHash) return [byHash];
  const hits = (manifest.assets ?? []).filter(
    (e) => e.filename && (asset.path === `public/assets/${e.filename}` || asset.path.endsWith(`/${e.filename}`)),
  );
  if (hits.length <= 1) return hits;
  // ambiguous basename (e.g. every world has its own "ba-before.png"):
  // disambiguate by world folder, then by the most specific filename, and
  // report whatever is still ambiguous as a warning, not an error.
  const byWorld = hits.filter((e) => e.world && asset.path.includes(`/${e.world}/`));
  const pool = byWorld.length > 0 ? byWorld : hits;
  const longest = Math.max(...pool.map((e) => e.filename.length));
  return pool.filter((e) => e.filename.length === longest);
}
const srcReferenced = inv.assets.filter((a) => (a.referenced_by ?? []).some((r) => r.startsWith("src/")));
let provenanceMissing = 0;
for (const a of srcReferenced) {
  const hits = manifestEntriesFor(a);
  if (hits.length === 0) {
    provenanceMissing++;
    errors.push(`provenance missing: ${a.path} is referenced from src/ (${a.referenced_by.filter((r) => r.startsWith("src/")).slice(0, 2).join(", ")}) but has NO entry in factory/state/art/manifest-v2.json — register it (factory/harness/art/art-loop.mjs register-existing) with a real source_type; never invent one`);
    continue;
  }
  if (hits.every((e) => !e.source_type || e.source_type === "unknown")) {
    provenanceMissing++;
    errors.push(`provenance unknown: ${a.path} -> manifest entry ${hits.map((e) => e.asset_id).join("/")} has source_type=${JSON.stringify(hits[0].source_type ?? null)} — a referenced asset must record where it actually came from`);
  }
  if (hits.length > 1) warnings.push(`ambiguous manifest join for ${a.path}: ${hits.map((e) => e.asset_id).join(" , ")}`);
}

// 6. duplicate content
for (const g of inv.duplicate_groups) warnings.push(`identical content: ${g.join(" , ")}`);

// 7. orphans — informational only (existing-asset protection: never auto-delete)
const orphans = inv.assets.filter((a) => a.quality_flags.includes("orphan"));

for (const e of errors) console.log(`ERROR  ${e}`);
for (const w of warnings) console.log(`WARN   ${w}`);
console.log(`orphans (protected, informational): ${orphans.length}`);
console.log(`provenance: ${srcReferenced.length - provenanceMissing}/${srcReferenced.length} src-referenced assets have a manifest entry with a known source_type`);
console.log(`${errors.length} errors, ${warnings.length} warnings, ${inv.totals.assets} assets checked`);
process.exit(errors.length ? 1 : 0);
