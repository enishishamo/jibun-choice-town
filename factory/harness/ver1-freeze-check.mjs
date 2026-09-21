#!/usr/bin/env node
// Ver.1 freeze guard (2026-09-20, Ver.2 migration — docs/jibun-choice-v2/MIGRATION_PLAN.md).
// Ver.2 is built inside the same repository under src/v2/ (T-01 = plan A),
// so "Ver.1 is untouched" must be a mechanical check, not a promise:
//   1. src/ and public/ (excluding src/v2/ and public/assets/v2/) are byte-identical to the
//      ver1-archive-2026-09-20 tag
//   2. nothing under src/v2/ imports Ver.1 UI/state code (screens, q1,
//      state, App, main, index.css). Read-only use of src/data and src/lib
//      is allowed.
// Exit 1 on any violation. Usage: npm run check:ver1-freeze
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const TAG = process.env.VER1_TAG || "ver1-archive-2026-09-20";
const V2_DIR = join(ROOT, "src", "v2");
// Ver.1 code = anything under src/ that is not src/v2. Imports are resolved
// relative to the importing file, so src/v2/state/* (Ver.2's own state) is
// allowed while src/state/* (Ver.1) is not. src/data and src/lib stay
// importable read-only.
const VER1_FORBIDDEN_DIRS = ["screens", "q1", "state"];
const VER1_FORBIDDEN_FILES = ["App.tsx", "App", "main.tsx", "main", "index.css"];
const IMPORT_RE = /(?:from\s+|import\s+)["']([^"']+)["']/g;
function forbiddenTarget(file, spec) {
  let abs;
  if (spec.startsWith("/src/")) abs = join(ROOT, spec);
  else if (spec.startsWith(".")) abs = resolve(dirname(file), spec);
  else return null; // package import
  const rel = relative(join(ROOT, "src"), abs);
  if (rel.startsWith("v2/") || rel.startsWith("..")) return null;
  const top = rel.split("/")[0];
  if (VER1_FORBIDDEN_DIRS.includes(top)) return rel;
  if (VER1_FORBIDDEN_FILES.includes(rel)) return rel;
  return null;
}

let failed = false;

// 1. Ver.1 files unchanged vs the archive tag
let changed = "";
try {
  changed = execFileSync(
    "git",
    ["diff", "--name-only", TAG, "--", "src", "public", ":(exclude)src/v2", ":(exclude)public/assets/v2"],
    { cwd: ROOT, encoding: "utf8" },
  ).trim();
} catch (e) {
  console.error(`FAIL: could not diff against ${TAG} (does the tag exist?)\n${e.message}`);
  process.exit(1);
}
if (changed) {
  failed = true;
  console.error(`FAIL: Ver.1 files differ from ${TAG}:\n${changed.split("\n").map((f) => "  - " + f).join("\n")}`);
} else {
  console.log(`PASS: src/ and public/ (excluding src/v2/, public/assets/v2/) are identical to ${TAG}`);
}

// 2. src/v2 does not import Ver.1 UI/state
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}
let v2Files = [];
try {
  v2Files = walk(V2_DIR);
} catch {
  console.log("PASS: src/v2/ does not exist yet — nothing to check");
}
const violations = [];
for (const file of v2Files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(IMPORT_RE)) {
      const hit = forbiddenTarget(file, m[1]);
      if (hit) violations.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}  → src/${hit}`);
    }
  });
}
if (violations.length) {
  failed = true;
  console.error(`FAIL: src/v2 imports Ver.1 UI/state code:\n${violations.map((v) => "  - " + v).join("\n")}`);
} else if (v2Files.length) {
  console.log(`PASS: ${v2Files.length} file(s) under src/v2/ import no Ver.1 screens/q1/state/App`);
}

process.exit(failed ? 1 : 0);
