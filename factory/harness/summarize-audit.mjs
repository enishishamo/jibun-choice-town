#!/usr/bin/env node
// Stage 3: build audit-summary.md (rankings + heatmap table) from q1-audit.json.
// Usage: node factory/harness/summarize-audit.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AUDITS = join(dirname(fileURLToPath(import.meta.url)), "..", "state", "audits");
const audit = JSON.parse(readFileSync(join(AUDITS, "q1-audit.json"), "utf8"));
const games = audit.games;

const cell = (s) => (s >= 75 ? `🟢${s}` : s >= 60 ? `🟡${s}` : `🔴${s}`);
const flag = (b) => (b ? "⚠" : "✓");
const byQuality = [...games].sort((a, b) => a.game_quality_score - b.game_quality_score);
const byAuth = [...games].sort((a, b) => a.career_authenticity_score - b.career_authenticity_score);
const combined = (g) => g.game_quality_score + g.career_authenticity_score;

const dup = {};
for (const g of games) {
  const key = (g.mechanic || "").toLowerCase().split(/[、。,.]/)[0].slice(0, 30);
  (dup[key] = dup[key] || []).push(g.gameType);
}

const fake = games.filter((g) => g.C_alone_determines_answer === true || g.player_judgment_required === false);
const quizzy = games.filter((g) => /memoriz|quiz|説明|読んで|instructions/i.test(g.exploit || "") || g.player_judgment_required === false);
const fixed = games.filter((g) => /fixed|固定|一本道/i.test(g.overall_risk || "") || /fixed/i.test(g.exploit || ""));
const exploitable = games.filter((g) => g.exploit && !/none/i.test(g.exploit));

let md = `# 全Q1監査サマリー（Stage 3・${audit.audited_at}）

auditor: Codex（独立）/ rubric: game-critic-v2.md / 詳細: q1-audit.json
🟢 75+（完成候補） 🟡 60-74（改善余地） 🔴 <60（要改修）

## ヒートマップ（GQ=game_quality / CA=career_authenticity 昇順）

| game | 世界 | GQ | CA | C要 | C単独× | 判断 | 因果 | risk | exploit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;
for (const g of byQuality) {
  md += `| ${g.gameType} | ${g.event || ""} | ${cell(g.game_quality_score)} | ${cell(g.career_authenticity_score)} | ${flag(!g.C_required)} | ${flag(g.C_alone_determines_answer)} | ${flag(!g.player_judgment_required)} | ${flag(!g.action_changes_result)} | ${g.overall_risk?.split("—")[0].trim() || ""} | ${(g.exploit || "").slice(0, 40)} |\n`;
}

md += `\n## Weakest 10 (game_quality)\n\n`;
byQuality.slice(0, 10).forEach((g, i) => (md += `${i + 1}. **${g.gameType}** GQ${g.game_quality_score}/CA${g.career_authenticity_score} — ${(g.overall_risk || "").slice(0, 90)}\n`));

md += `\n## Strongest 5 (GQ+CA合計)\n\n`;
[...games].sort((a, b) => combined(b) - combined(a)).slice(0, 5).forEach((g, i) => (md += `${i + 1}. **${g.gameType}** GQ${g.game_quality_score}/CA${g.career_authenticity_score}\n`));

md += `\n## High-priority repair queue（GQ<60 または C単独で答え確定 または 判断不在）\n\n`;
games.filter((g) => g.game_quality_score < 60 || g.C_alone_determines_answer || !g.player_judgment_required)
  .sort((a, b) => a.game_quality_score - b.game_quality_score)
  .forEach((g) => (md += `- ${g.gameType} (GQ${g.game_quality_score}) — ${(g.recommended_fix || g.overall_risk || "").slice(0, 100)}\n`));

md += `\n## カテゴリ別リスト\n\n`;
md += `- fake-choice疑い（C単独確定 or 判断不在）: ${fake.map((g) => g.gameType).join(", ") || "なし"}\n`;
md += `- quiz化疑い: ${quizzy.map((g) => g.gameType).join(", ") || "なし"}\n`;
md += `- 固定進行疑い: ${fixed.map((g) => g.gameType).join(", ") || "なし"}\n`;
md += `- exploit報告あり: ${exploitable.map((g) => `${g.gameType}(${(g.exploit || "").slice(0, 25)})`).join(", ") || "なし"}\n`;

md += `\n## 構造重複（mechanic先頭句が同じもの）\n\n`;
for (const [k, ids] of Object.entries(dup)) if (ids.length > 1) md += `- ${ids.join(" / ")} — 「${k}…」\n`;

writeFileSync(join(AUDITS, "audit-summary.md"), md);
const avg = (k) => Math.round(games.reduce((s, g) => s + (g[k] || 0), 0) / games.length);
console.log(`summary written. games:${games.length} avgGQ:${avg("game_quality_score")} avgCA:${avg("career_authenticity_score")}`);
