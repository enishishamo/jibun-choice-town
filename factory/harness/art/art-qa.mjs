#!/usr/bin/env node
// Art QA (Stage 6): mechanical checks + Codex vision critic (subscription
// vision, REAL-probed). Emits a structured verdict; the regeneration loop
// consumes qa_issues to rewrite the next prompt (never retry the same prompt).
//
// Usage:
//   node art-qa.mjs asset --file <path> --purpose "<use/purpose>" [--expect-size WxH]
//   node art-qa.mjs pair --before <path> --after <path> --purpose "<what changes>"
//   node art-qa.mjs presentation --mobile <shot.png> [--desktop <shot.png>]
//       --context "<screen name / what is displayed>"
//       — IN-CONTEXT QA: judges how assets LOOK INSIDE THE APP (crop, badge
//         collision, container fit), from real browser screenshots. An asset
//         that passes file-QA can still FAIL here (ASSET_PRESENTATION_QUALITY).
//
// Output (stdout JSON): { ok, verdict: PASS|FAIL, scores{}, issues[], mechanical{} }

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = join(HARNESS, "..", "..");
const CONTRACT = readFileSync(join(ROOT, "factory/harness/art/style-contract.md"), "utf8");
// FIXED known-good reference set: every vision call compares the candidate
// against these actual images, never against the text contract alone.
const REFSET = JSON.parse(readFileSync(join(ROOT, "factory/harness/art/reference-set.json"), "utf8"));
const REF_FILES = REFSET.references.map((r) => r.path).filter((p) => existsSync(resolve(ROOT, p)));
if (REF_FILES.length !== REFSET.references.length) {
  // fail-closed: a shrunken reference set silently weakens the Series gate
  console.log(JSON.stringify({ ok: false, error: `reference set incomplete: ${REF_FILES.length}/${REFSET.references.length} files present` }));
  process.exit(1);
}

// Cost safety + observability: same mechanical boundary as every codex transport.
const SAFE_ENV = { ...process.env };
for (const k of Object.keys(SAFE_ENV)) if (/^(OPENAI|AZURE_OPENAI|ANTHROPIC)_/i.test(k)) delete SAFE_ENV[k];
// preflight: refuse non-ChatGPT (API-key) codex sessions — pay-per-use is forbidden
{
  const auth = spawnSync("codex", ["login", "status"], { encoding: "utf8", env: SAFE_ENV });
  const t = `${auth.stdout || ""}${auth.stderr || ""}`;
  if (auth.status !== 0 || /api\s*key/i.test(t) || !/ChatGPT/i.test(t)) {
    console.log(JSON.stringify({ ok: false, error: `codex session is not ChatGPT OAuth (${t.trim().slice(0, 60)}) — refused` }));
    process.exit(1);
  }
}
function logRouting(entry) {
  try {
    appendFileSync(join(ROOT, "factory/state/routing-log.jsonl"), JSON.stringify({ ts: new Date().toISOString(), tool: "art-qa", ...entry }) + "\n");
  } catch { /* logging must never break QA */ }
}

const args = process.argv.slice(2);
const mode = args.shift();
function argOf(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
function die(msg) {
  console.log(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
}

function mechanical(file) {
  const abs = resolve(ROOT, file);
  if (!existsSync(abs)) die(`missing file: ${file}`);
  const st = statSync(abs);
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", "-g", "format", abs], { encoding: "utf8" });
  const w = Number(out.match(/pixelWidth: (\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight: (\d+)/)?.[1]);
  const issues = [];
  if (st.size > 2_000_000) issues.push(`file too large: ${(st.size / 1e6).toFixed(1)}MB (>2MB)`);
  if (w < 256 || h < 256) issues.push(`too small: ${w}x${h}`);
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extname(abs).toLowerCase())) issues.push("invalid format");
  return { width: w, height: h, bytes: st.size, issues };
}

function visionCritic(files, ask) {
  const nRef = REF_FILES.length;
  const prompt = `You are the JIBUN CHOICE visual art critic. The FIRST ${nRef} attached images are the
FIXED REFERENCE SET: known-good existing JIBUN CHOICE series assets (${REFSET.references
    .map((r, i) => `ref${i + 1}=${r.role.split(":")[0]}`)
    .join(", ")}). The image(s) AFTER those are the CANDIDATE(S) under review.

Judge the candidate against this Art Style Contract (summary):
${CONTRACT.slice(0, 2600)}

${ask}

MOST IMPORTANT: "is this a beautiful image?" is NOT the question. The question is:
"placed next to the reference set, does the candidate look like the SAME WORK, the SAME
WORLD, by the same hands?" Judge SERIES_STYLE_MATCH by comparing the candidate to the
reference IMAGES (not to the text): clay material, handmade miniature feeling, character
proportions (2.5-3 heads), face design, eye style (small dot eyes), nose/mouth
simplification, hair material (solid clay, not strands), skin material (matte clay, not
smooth human skin), clothing material, lighting, saturation, depth/rendering, background
treatment, camera feeling, overall toy/diorama feeling.
If the candidate contains people, also judge CHARACTER_SERIES_MATCH: FAIL-level (<80) if
the figures drift toward Pixar/Disney/generic 3D animation, realistic CG, social-game
characters, taller head-count than the references, oversized eyes, too-smooth human skin,
realistic strand hair, an over-detailed face, fabric-realistic clothing, or anything that
reads as a 3D animation character instead of a clay figurine.

Score each 0-100 and list concrete issues. Your ENTIRE final message must be a single JSON
object, no prose, no code fences:
{"scores":{"STYLE_CONSISTENCY":0,"COMPOSITION":0,"CROP_SAFETY":0,"READABILITY":0,
"OBJECT_COMPLETENESS":0,"CHARACTER_ANATOMY":0,"SERIES_CONSISTENCY":0,
"BEFORE_AFTER_CONSISTENCY":0,"JOB_ACCURACY":0,"MOBILE_USABILITY":0,
"SERIES_STYLE_MATCH":0,"CHARACTER_SERIES_MATCH":0},
"series_diffs":["CONCRETE visual difference vs the reference set (e.g. 'face too detailed',
'eyes 2x larger than refs', 'skin smooth like CG, refs are matte clay', 'background is a
studio portrait, refs are dioramas') — empty if none"],
"issues":["concrete problem — why it matters"],"verdict":"PASS|FAIL"}
Scoring: use 100 for categories that do not apply (e.g. CHARACTER_ANATOMY and
CHARACTER_SERIES_MATCH with no people, BEFORE_AFTER_CONSISTENCY for a single image).
verdict=FAIL if any applicable category < 70, if SERIES_STYLE_MATCH or
CHARACTER_SERIES_MATCH < 80, or a contract MUST is violated (readable text/logos,
photorealism, cut-off heads/hands, old-fashioned or babyish style, wrong job tools).
A high-quality image that does not match the series is a FAIL, never a PASS.`;
  // fresh reply file per invocation — a stale reply from a previous run can
  // never be mistaken for this one's result, and a failed codex run is an error
  const replyFile = join(mkdtempSync(join(tmpdir(), "jc-artqa-")), "reply.txt");
  const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
  for (const f of REF_FILES) cargs.push("-i", resolve(ROOT, f)); // reference set first
  for (const f of files) cargs.push("-i", resolve(ROOT, f)); // then candidates
  cargs.push("-");
  const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: 600000, env: SAFE_ENV });
  logRouting({ mode: "vision-critic", files, exit: r.status });
  if (r.status !== 0) return { error: `vision critic codex exec exited ${r.status}` };
  let raw = "";
  try { raw = readFileSync(replyFile, "utf8"); } catch { /* none */ }
  const start = raw.indexOf("{");
  if (start < 0) return { error: `vision critic produced no JSON (exit ${r.status})` };
  for (let end = raw.length; end > start; end--) {
    try { return JSON.parse(raw.slice(start, end)); } catch { /* shrink */ }
  }
  return { error: "vision critic JSON unparsable" };
}

const CATEGORIES = ["STYLE_CONSISTENCY","COMPOSITION","CROP_SAFETY","READABILITY","OBJECT_COMPLETENESS","CHARACTER_ANATOMY","SERIES_CONSISTENCY","BEFORE_AFTER_CONSISTENCY","JOB_ACCURACY","MOBILE_USABILITY"];
// Series Style Gate (fail-closed, independent of overall quality): a candidate
// must read as the SAME SERIES next to the reference images. Thresholds are
// stricter (80) than the per-category quality bar (70), and a high total can
// never rescue a series mismatch.
const SERIES_GATES = ["SERIES_STYLE_MATCH", "CHARACTER_SERIES_MATCH"];
// Fail-closed: the harness computes the verdict from the scores itself.
// Missing or non-numeric scores are a FAIL, regardless of the critic's own verdict.
function enforceVerdict(vis, mechIssues) {
  const problems = [];
  if (!vis.scores || typeof vis.scores !== "object") return { verdict: "FAIL", problems: ["vision critic returned no scores"] };
  // Bidirectional fail-closed: a critic FAIL (e.g. a style-contract MUST
  // violation that numeric scores do not capture) can never be overridden.
  if (vis.verdict !== "PASS") problems.push(`vision critic verdict: ${vis.verdict} (MUST violation or unstated failure)`);
  for (const c of CATEGORIES) {
    const v = vis.scores[c];
    if (typeof v !== "number" || v < 0 || v > 100) problems.push(`invalid score for ${c}: ${v}`);
    else if (v < 70) problems.push(`${c} below threshold: ${v}`);
  }
  for (const c of SERIES_GATES) {
    const v = vis.scores[c];
    if (typeof v !== "number" || v < 0 || v > 100) problems.push(`invalid score for ${c}: ${v} (series gate is mandatory)`);
    else if (v < 80) problems.push(`${c} below SERIES gate (80): ${v}`);
  }
  if (mechIssues.length) problems.push(...mechIssues);
  return { verdict: problems.length ? "FAIL" : "PASS", problems };
}

if (mode === "asset") {
  const file = argOf("--file") || die("--file required");
  const purpose = argOf("--purpose", "");
  const expect = argOf("--expect-size", null);
  const mech = mechanical(file);
  if (expect) {
    const [w, h] = expect.split("x").map(Number);
    const ar = mech.width / mech.height, ear = w / h;
    if (Math.abs(ar - ear) > 0.12) mech.issues.push(`aspect ratio ${ar.toFixed(2)} differs from expected ${ear.toFixed(2)}`);
  }
  const vis = visionCritic([file], `Purpose of this asset: ${purpose}. Judge it as a JIBUN CHOICE game asset.`);
  if (vis.error) {
    console.log(JSON.stringify({ ok: false, verdict: "FAIL", mechanical: mech, issues: [...mech.issues, `VISION_QA_UNAVAILABLE: ${vis.error}`] }));
    process.exit(1);
  }
  const gate = enforceVerdict(vis, mech.issues);
  const issues = [...new Set([...(vis.issues || []), ...gate.problems])];
  console.log(JSON.stringify({ ok: true, verdict: gate.verdict, critic_verdict: vis.verdict, scores: vis.scores, series_diffs: vis.series_diffs || [], issues, mechanical: mech }, null, 1));
  process.exit(gate.verdict === "PASS" ? 0 : 1);
} else if (mode === "pair") {
  const before = argOf("--before") || die("--before required");
  const after = argOf("--after") || die("--after required");
  const purpose = argOf("--purpose", "");
  const mb = mechanical(before), ma = mechanical(after);
  const vis = visionCritic(
    [before, after],
    `These are a BEFORE (first image) / AFTER (second image) pair. Intended change: ${purpose}.
They MUST show the same building, same camera angle, same composition, same neighborhood and
the same visual identity — only the event's result may differ. Judge BEFORE_AFTER_CONSISTENCY
strictly, plus all other categories for both images.`,
  );
  if (vis.error) {
    console.log(JSON.stringify({ ok: false, verdict: "FAIL", issues: [`VISION_QA_UNAVAILABLE: ${vis.error}`] }));
    process.exit(1);
  }
  const gate = enforceVerdict(vis, [...mb.issues, ...ma.issues]);
  const issues = [...new Set([...(vis.issues || []), ...gate.problems])];
  console.log(JSON.stringify({ ok: true, verdict: gate.verdict, critic_verdict: vis.verdict, scores: vis.scores, series_diffs: vis.series_diffs || [], issues, mechanical: { before: mb, after: ma } }, null, 1));
  process.exit(gate.verdict === "PASS" ? 0 : 1);
} else if (mode === "presentation") {
  // IN-CONTEXT presentation QA from real browser screenshots. This is a
  // DIFFERENT question from asset QA: not "is the image good" but "is the
  // image PRESENTED well inside the app" (crop, occlusion, integration).
  const mobile = argOf("--mobile");
  const desktop = argOf("--desktop");
  const context = argOf("--context", "");
  if (!mobile && !desktop) die("--mobile and/or --desktop screenshot required");
  const shots = [mobile, desktop].filter(Boolean);
  const P_CATS = ["SUBJECT_CROP","SUBJECT_OCCLUSION","FOCAL_OBJECT_VISIBILITY","BADGE_OVERLAP","CONTAINER_FIT","BACKGROUND_EDGE_QUALITY","ASPECT_RATIO_FIT","VISUAL_INTEGRATION","MOBILE_CROP","DESKTOP_CROP"];
  const ask = `These are REAL BROWSER SCREENSHOTS of the running app (${mobile ? "first = mobile 375px" : ""}${mobile && desktop ? ", " : ""}${desktop ? (mobile ? "second = desktop" : "first = desktop") : ""}).
Screen under review: ${context}.

Judge the IN-CONTEXT PRESENTATION of every image asset visible in the screenshots —
NOT whether the artwork itself is pretty, but whether it is PRESENTED well:
- SUBJECT_CROP: are people/important objects cut off mid-body/mid-face by the container?
- SUBJECT_OCCLUSION: do badges (NEW), labels, buttons, sparkles or balloons cover faces,
  heads, hands, job tools, or objects needed for judgment? (subject > decoration)
- FOCAL_OBJECT_VISIBILITY: is the focal object of each image actually visible in-frame?
- BADGE_OVERLAP: NEW/label overlays must not sit on the subject's face/head/tools.
- CONTAINER_FIT: does each image fit its card/frame (no raw rectangle pasted onto a
  mismatched card background; borders/radius consistent)? An intentional photo/scene
  frame is acceptable — only flag "pasted rectangle" looks.
- BACKGROUND_EDGE_QUALITY: visible hard edges of the source image against the UI.
- ASPECT_RATIO_FIT: squashed/stretched or awkwardly letterboxed images.
- VISUAL_INTEGRATION: does the image feel composed into the UI (spacing, radius,
  shadows consistent with neighboring cards)?
- MOBILE_CROP / DESKTOP_CROP: per-viewport crop sanity (100 for a viewport not provided).

Also answer the UI POLISH ADVERSARIAL QUESTION: "does this look like a finished
commercial game UI, or like assets provisionally pasted into a prototype?" List the
concrete reasons if prototype-ish (raw rectangular crop, inconsistent framing, overlay
collision, weak spacing, arbitrary image sizes, mismatched corner radius, unbalanced
composition).

Your ENTIRE final message must be a single JSON object, no prose, no fences:
{"scores":{${P_CATS.map((c) => `"${c}":0`).join(",")},"ASSET_PRESENTATION_QUALITY":0},
"BADGE_COLLISION":false,
"prototype_feel_reasons":["..."],
"issues":["screen/element — concrete presentation problem — suggested fix (object-fit/position, badge move, radius, masking...)"],
"verdict":"PASS|FAIL"}
verdict=FAIL if ASSET_PRESENTATION_QUALITY < 80, if BADGE_COLLISION is true, or any
applicable category < 70.`;
  // presentation mode judges layout, not series style — no reference set attached
  const replyFile = join(mkdtempSync(join(tmpdir(), "jc-artqa-")), "reply.txt");
  const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
  for (const f of shots) cargs.push("-i", resolve(ROOT, f));
  cargs.push("-");
  const r = spawnSync("codex", cargs, { input: ask, encoding: "utf8", timeout: 600000, env: SAFE_ENV });
  logRouting({ mode: "presentation-critic", files: shots, exit: r.status });
  let vis = { error: `presentation critic codex exec exited ${r.status}` };
  if (r.status === 0) {
    let raw = "";
    try { raw = readFileSync(replyFile, "utf8"); } catch { /* none */ }
    const start = raw.indexOf("{");
    if (start >= 0) {
      vis = { error: "presentation critic JSON unparsable" };
      for (let end = raw.length; end > start; end--) {
        try { vis = JSON.parse(raw.slice(start, end)); break; } catch { /* shrink */ }
      }
    } else vis = { error: "presentation critic produced no JSON" };
  }
  if (vis.error) {
    console.log(JSON.stringify({ ok: false, verdict: "FAIL", issues: [`PRESENTATION_QA_UNAVAILABLE: ${vis.error}`] }));
    process.exit(1);
  }
  // fail-closed harness verdict
  const problems = [];
  if (!vis.scores || typeof vis.scores !== "object") { problems.push("no scores"); }
  else {
    for (const c1 of P_CATS) {
      const v = vis.scores[c1];
      if (typeof v !== "number" || v < 0 || v > 100) problems.push(`invalid score for ${c1}: ${v}`);
      else if (v < 70) problems.push(`${c1} below threshold: ${v}`);
    }
    const apq = vis.scores.ASSET_PRESENTATION_QUALITY;
    if (typeof apq !== "number") problems.push("ASSET_PRESENTATION_QUALITY missing");
    else if (apq < 80) problems.push(`ASSET_PRESENTATION_QUALITY below gate (80): ${apq}`);
  }
  if (vis.BADGE_COLLISION === true) problems.push("BADGE_COLLISION: overlay covers a subject's face/head/tools");
  if (vis.verdict !== "PASS") problems.push(`presentation critic verdict: ${vis.verdict}`);
  const verdict = problems.length ? "FAIL" : "PASS";
  const issues = [...new Set([...(vis.issues || []), ...problems])];
  console.log(JSON.stringify({ ok: true, verdict, critic_verdict: vis.verdict, scores: vis.scores, badge_collision: vis.BADGE_COLLISION === true, prototype_feel_reasons: vis.prototype_feel_reasons || [], issues }, null, 1));
  process.exit(verdict === "PASS" ? 0 : 1);
} else {
  die("modes: asset | pair | presentation");
}
