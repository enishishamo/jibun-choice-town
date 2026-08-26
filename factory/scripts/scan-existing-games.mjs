// Factory scanner: extracts the current state of the app into factory/database/.
// Source of Truth is the app code itself (src/data/content/*.ts + src/q1/registry.ts);
// this scan is only an INDEX for search / duplicate detection / production history.
//
// How it works (no changes to app code, no extra dependencies):
//   1. read each content module, replace `import.meta.env.BASE_URL` with "/"
//      (Vite-only global that does not exist in Node),
//   2. strip types with the `typescript` package already in devDependencies,
//   3. dynamically import the resulting JS and read the real ContentModule object,
//   4. parse src/q1/registry.ts for mechanic ids + their comment descriptions.
// Anything that cannot be extracted is recorded as "unknown" — never invented.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT_DIR = path.join(ROOT, "src/data/content");
const REGISTRY_FILE = path.join(ROOT, "src/q1/registry.ts");
const DB_DIR = path.join(ROOT, "factory/database");
const CACHE_DIR = path.join(ROOT, "factory/.cache");
// Layer 2 input: human/agent-curated semantic reviews of each game component
// (mechanic taxonomy + C/D/retry judgements that cannot be extracted statically).
const REVIEWS_FILE = path.join(ROOT, "factory/taxonomy/component-reviews.json");

// ---------- registry.ts: mechanic ids, component names, comments ----------

function parseRegistry(sourceText) {
  const entries = [];
  let section = null;
  for (const raw of sourceText.split("\n")) {
    const line = raw.trim();
    const sectionMatch = line.match(/^\/\/\s*(\S+編.*)$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }
    const entryMatch = raw.match(/^\s{2}([A-Za-z_]\w*):\s*(\w+),\s*(?:\/\/\s*(.*))?$/);
    if (entryMatch) {
      const componentPath = `src/q1/${entryMatch[2]}.tsx`;
      entries.push({
        id: entryMatch[1],
        component: entryMatch[2],
        componentPath,
        componentExists: fs.existsSync(path.join(ROOT, componentPath)),
        description: entryMatch[3]?.trim() ?? "unknown",
        section: section ?? "unknown",
      });
    }
  }
  return entries;
}

// ---------- content modules: transpile TS and import the real objects ----------

function loadContentModule(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  // Vite-only value; only used to build asset paths, so "/" is a safe stand-in.
  source = source.replaceAll("import.meta.env.BASE_URL", '"/"');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const outFile = path.join(CACHE_DIR, path.basename(filePath).replace(/\.ts$/, ".mjs"));
  fs.writeFileSync(outFile, js);
  return import(pathToFileURL(outFile).href);
}

function extractFactCheckNotes(sourceText) {
  // Capture comment lines around explicit fact-check markers left in the code.
  const lines = sourceText.split("\n");
  const notes = [];
  lines.forEach((line, i) => {
    if (/FACT[ _]?CHECK/i.test(line)) {
      const block = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("//")) {
        block.push(lines[j].trim().replace(/^\/\/\s?/, ""));
        j++;
      }
      if (block.length) notes.push(block.join("\n"));
      else notes.push(line.trim());
    }
  });
  // Deduplicate blocks that share lines (markers inside one comment block).
  return [...new Set(notes)].filter((n, _, all) => !all.some((o) => o !== n && o.includes(n)));
}

// ---------- main ----------

async function main() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const scannedAt = new Date().toISOString();
  const registrySource = fs.readFileSync(REGISTRY_FILE, "utf8");
  const registryEntries = parseRegistry(registrySource);
  const issues = [];

  const moduleFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();

  const modules = [];
  for (const file of moduleFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    const sourceText = fs.readFileSync(filePath, "utf8");
    const imported = await loadContentModule(filePath);
    const [exportName, mod] =
      Object.entries(imported).find(
        ([, v]) => v && typeof v === "object" && v.events && v.professions && v.experiences,
      ) ?? [];
    if (!mod) {
      issues.push(`no ContentModule export found in ${file}`);
      continue;
    }
    modules.push({
      file: `src/data/content/${file}`,
      exportName,
      factCheckNotes: extractFactCheckNotes(sourceText),
      module: mod,
    });
  }

  // ----- registry-snapshot.json: near-raw extraction -----
  const snapshot = {
    scannedAt,
    sourceOfTruth: {
      registry: "src/q1/registry.ts",
      contentIndex: "src/data/index.ts",
      note: "The app code is the Source of Truth. This DB is an index only.",
    },
    registry: registryEntries,
    modules: modules.map(({ file, exportName, factCheckNotes, module: m }) => ({
      file,
      exportName,
      factCheckNotes,
      places: m.places.map((p) => ({ id: p.id, name: p.name, eventId: p.eventId ?? null })),
      events: m.events.map((e) => ({
        id: e.id,
        title: e.title,
        areaName: e.areaName,
        chapters: e.chapters?.map((c) => ({ id: c.id, title: c.title, incidentIds: c.incidentIds })) ?? null,
        incidents: e.incidents.map((i) => ({
          id: i.id,
          title: i.title,
          experienceId: i.experienceId,
          requires: i.requires ?? null,
        })),
        hasLensSummary: Boolean(e.lensSummary),
        hasWrapUp: Boolean(e.wrapUp),
      })),
      professions: m.professions.map((p) => ({
        id: p.id,
        name: p.name,
        catch: p.catch,
        discoveryLine: p.discoveryLine,
        q2CardCount: p.q2.length,
        related: p.related,
      })),
      experiences: m.experiences.map((x) => ({
        id: x.id,
        professionId: x.professionId,
        eventId: x.eventId,
        gameType: x.gameType,
        componentPath: registryEntries.find((r) => r.id === x.gameType)?.componentPath ?? "unknown",
        // A-E skeleton as stored in data. D (the interaction itself) lives in
        // the game component, so only its mechanic id is indexed here.
        A_place: x.place.name,
        B_mission: { title: x.mission.title, lines: x.mission.lines },
        C_tools: x.tools.map((t) => ({ id: t.id, name: t.name, desc: t.desc })),
        D_mechanic: x.gameType,
        E_resolution: { title: x.resolution.title, lines: x.resolution.lines },
        jobReveal_discoveryEcho: x.discoveryEcho,
        interestSeeds: x.seeds,
        // Retry behaviour is implemented inside each game component and cannot
        // be extracted reliably from data alone.
        retry: "unknown_lives_in_component",
      })),
    })),
    issues,
  };

  // ----- events.json -----
  const allExperiences = modules.flatMap((m) => m.module.experiences.map((x) => ({ ...x, file: m.file })));
  const events = modules.flatMap((m) =>
    m.module.events.map((e) => {
      const xs = allExperiences.filter((x) => x.eventId === e.id);
      return {
        id: e.id,
        title: e.title,
        status: "released",
        category: "unknown", // −→0 / 0→0 / 0→+ / +→++ is a planning hypothesis, not in code
        gameIds: xs.map((x) => x.id),
        jobIds: [...new Set(xs.map((x) => x.professionId))],
        mechanics: [...new Set(xs.map((x) => x.gameType))],
        sourceFiles: [m.file],
        lastScannedAt: scannedAt,
      };
    }),
  );

  // ----- jobs.json -----
  const jobs = modules.flatMap((m) =>
    m.module.professions.map((p) => {
      const xs = allExperiences.filter((x) => x.professionId === p.id);
      return {
        id: p.id,
        displayName: p.name,
        aliases: [],
        domain: "unknown",
        events: [...new Set(xs.map((x) => x.eventId))],
        appearanceCount: xs.length,
        cPatterns: [...new Set(xs.flatMap((x) => x.tools.map((t) => t.name)))],
        dPatterns: [...new Set(xs.map((x) => x.gameType))],
        mechanics: [...new Set(xs.map((x) => x.gameType))],
        factConfidence: m.factCheckNotes.length ? "needs_manual_review" : "not_assessed",
        sourceFiles: [m.file],
      };
    }),
  );

  // ----- mechanics.json (Layer 1 facts + Layer 2 semantic review join) -----
  // component-reviews.json is curated by Critic/Final QA agents who actually
  // read the component code. The scanner only JOINS it — it never invents
  // classifications. Missing review => "unclassified".
  let reviews = {};
  if (fs.existsSync(REVIEWS_FILE)) {
    reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8")).reviews ?? {};
  }
  for (const key of Object.keys(reviews)) {
    if (!registryEntries.some((r) => r.id === key)) {
      issues.push(`component-reviews.json has entry "${key}" not present in registry.ts`);
    }
  }
  const mechanics = registryEntries.map((r) => {
    const xs = allExperiences.filter((x) => x.gameType === r.id);
    const rev = reviews[r.id];
    // Staleness guard: a semantic review is only valid for the component
    // version it was written against. A hash mismatch means the component
    // changed since review => the review must be redone, not trusted.
    const componentHash = r.componentExists
      ? crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, r.componentPath))).digest("hex").slice(0, 12)
      : null;
    if (rev?.reviewedHash && rev.reviewedHash !== componentHash) {
      issues.push(
        `semantic review for "${r.id}" is STALE: ${r.componentPath} changed since review (${rev.reviewedHash} -> ${componentHash})`,
      );
    }
    return {
      componentHash,
      reviewStale: Boolean(rev?.reviewedHash && rev.reviewedHash !== componentHash),
      id: r.id,
      label: r.component,
      componentPath: r.componentPath,
      appearances: xs.length,
      recentEvents: [...new Set(xs.map((x) => x.eventId))],
      recentGames: xs.map((x) => x.id),
      description: r.description,
      section: r.section,
      // normalized interaction taxonomy (see factory/taxonomy/mechanics-taxonomy.md)
      primaryMechanic: rev?.primaryMechanic ?? "unclassified",
      secondaryMechanics: rev?.secondaryMechanics ?? [],
      interactionNotes: rev?.interactionNotes ?? "unclassified",
      semantic: rev?.semantic ?? null,
    };
  });
  for (const x of allExperiences) {
    if (!registryEntries.some((r) => r.id === x.gameType)) {
      issues.push(`experience ${x.id} uses gameType "${x.gameType}" not present in registry.ts`);
    }
  }
  // normalized categories per event, for bias detection across worlds
  for (const e of events) {
    e.mechanicCategories = [
      ...new Set(e.mechanics.map((g) => reviews[g]?.primaryMechanic ?? "unclassified")),
    ];
  }

  const write = (name, data) =>
    fs.writeFileSync(path.join(DB_DIR, name), JSON.stringify(data, null, 2) + "\n");
  write("registry-snapshot.json", snapshot);
  write("events.json", events);
  write("jobs.json", jobs);
  write("mechanics.json", mechanics);

  fs.rmSync(CACHE_DIR, { recursive: true, force: true });

  const jobDup = jobs.filter((j) => j.appearanceCount > 1).map((j) => `${j.displayName}(${j.appearanceCount})`);
  const mechDup = mechanics.filter((mc) => mc.appearances > 1).map((mc) => `${mc.id}(${mc.appearances})`);
  console.log(`scan complete @ ${scannedAt}`);
  console.log(`  content modules : ${modules.length}`);
  console.log(`  events          : ${events.length}`);
  console.log(`  Q1 experiences  : ${allExperiences.length}`);
  console.log(`  professions     : ${jobs.length}`);
  console.log(`  mechanics       : ${mechanics.length} (unused: ${mechanics.filter((mc) => mc.appearances === 0).length})`);
  console.log(`  fact-check flags: ${modules.filter((m) => m.factCheckNotes.length).map((m) => m.file).join(", ") || "none"}`);
  console.log(`  jobs in 2+ games: ${jobDup.join(", ") || "none"}`);
  console.log(`  mech in 2+ games: ${mechDup.join(", ") || "none"}`);
  const unclassified = mechanics.filter((mc) => mc.primaryMechanic === "unclassified");
  console.log(`  semantic reviews : ${mechanics.length - unclassified.length}/${mechanics.length} classified`);
  const dist = {};
  for (const mc of mechanics) dist[mc.primaryMechanic] = (dist[mc.primaryMechanic] ?? 0) + mc.appearances;
  console.log(
    `  primary mechanics: ${Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );
  if (issues.length) {
    console.log("  issues:");
    for (const i of issues) console.log(`   - ${i}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
