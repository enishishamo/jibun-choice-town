// Validates factory/database/*.json: schema basics + referential integrity
// against each other. Exits non-zero when a hard error is found so it can be
// used as a gate before committing new Factory data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../database");

const load = (name) => JSON.parse(fs.readFileSync(path.join(DB_DIR, name), "utf8"));

const errors = [];
const warnings = [];
const requireFields = (list, fields, label) => {
  list.forEach((item, i) => {
    for (const f of fields) {
      if (item[f] === undefined) errors.push(`${label}[${i}] (${item.id ?? "?"}): missing field "${f}"`);
    }
  });
};

let events, jobs, mechanics, snapshot;
try {
  events = load("events.json");
  jobs = load("jobs.json");
  mechanics = load("mechanics.json");
  snapshot = load("registry-snapshot.json");
} catch (err) {
  console.error(`DB not readable: ${err.message}`);
  console.error("run scan-existing-games.mjs first");
  process.exit(1);
}

requireFields(events, ["id", "title", "status", "category", "gameIds", "jobIds", "mechanics", "sourceFiles", "lastScannedAt"], "events");
requireFields(jobs, ["id", "displayName", "aliases", "domain", "events", "appearanceCount", "cPatterns", "dPatterns", "mechanics", "factConfidence", "sourceFiles"], "jobs");
requireFields(mechanics, ["id", "label", "componentPath", "appearances", "recentEvents", "recentGames", "description", "primaryMechanic", "secondaryMechanics", "interactionNotes"], "mechanics");

const dupes = (list, label) => {
  const seen = new Set();
  for (const { id } of list) {
    if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`);
    seen.add(id);
  }
  return seen;
};
const eventIds = dupes(events, "events");
const jobIds = dupes(jobs, "jobs");
const mechanicIds = dupes(mechanics, "mechanics");

for (const e of events) {
  for (const j of e.jobIds) if (!jobIds.has(j)) errors.push(`event ${e.id}: unknown jobId "${j}"`);
  for (const mc of e.mechanics) if (!mechanicIds.has(mc)) errors.push(`event ${e.id}: unknown mechanic "${mc}"`);
}
for (const j of jobs) {
  for (const e of j.events) if (!eventIds.has(e)) errors.push(`job ${j.id}: unknown event "${e}"`);
  for (const mc of j.mechanics) if (!mechanicIds.has(mc)) errors.push(`job ${j.id}: unknown mechanic "${mc}"`);
}
for (const mc of mechanics) {
  for (const e of mc.recentEvents) if (!eventIds.has(e)) errors.push(`mechanic ${mc.id}: unknown event "${e}"`);
  if (mc.appearances === 0) warnings.push(`mechanic ${mc.id}: registered but used by no experience`);
  if (mc.description === "unknown") warnings.push(`mechanic ${mc.id}: no description comment in registry.ts`);
  if (mc.primaryMechanic === "unclassified") warnings.push(`mechanic ${mc.id}: no semantic review in factory/taxonomy/component-reviews.json`);
  if (mc.semantic) {
    for (const f of ["C_in_component", "C_required", "action_changes_result", "retry", "fixed_progression", "obvious_binary_choice", "evidence"]) {
      if (mc.semantic[f] === undefined) errors.push(`mechanic ${mc.id}: semantic review missing field "${f}"`);
    }
  }
}

const allGameIds = new Set(events.flatMap((e) => e.gameIds));
const snapshotGameIds = new Set(
  snapshot.modules.flatMap((m) => m.experiences.map((x) => x.id)),
);
for (const id of allGameIds) if (!snapshotGameIds.has(id)) errors.push(`events.json gameId "${id}" missing from snapshot`);
for (const id of snapshotGameIds) if (!allGameIds.has(id)) errors.push(`snapshot experience "${id}" missing from events.json`);
if (snapshot.issues?.length) for (const i of snapshot.issues) warnings.push(`scan issue: ${i}`);

const unknownCount = JSON.stringify([events, jobs]).match(/"unknown"/g)?.length ?? 0;
console.log(`validate: ${events.length} events / ${jobs.length} jobs / ${mechanics.length} mechanics`);
console.log(`  unknown fields kept honest: ${unknownCount}`);
for (const w of warnings) console.log(`  warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ERROR: ${e}`);
  process.exit(1);
}
console.log("  OK: no referential errors");
