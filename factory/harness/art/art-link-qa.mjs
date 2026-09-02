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

// 6. duplicate content
for (const g of inv.duplicate_groups) warnings.push(`identical content: ${g.join(" , ")}`);

// 7. orphans — informational only (existing-asset protection: never auto-delete)
const orphans = inv.assets.filter((a) => a.quality_flags.includes("orphan"));

for (const e of errors) console.log(`ERROR  ${e}`);
for (const w of warnings) console.log(`WARN   ${w}`);
console.log(`orphans (protected, informational): ${orphans.length}`);
console.log(`${errors.length} errors, ${warnings.length} warnings, ${inv.totals.assets} assets checked`);
process.exit(errors.length ? 1 : 0);
