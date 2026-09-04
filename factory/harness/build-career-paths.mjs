#!/usr/bin/env node
// Transforms factory/state/career-path/career-path-research-merged.json (62
// fact-checked profession entries) into src/data/careerPaths.ts — the
// runtime lookup ProfessionScreen uses for the "どうやってなるの？" section.
//
// Ruby (furigana) is applied via a curated term dictionary (RUBY_TERMS
// below) rather than per-string hand-authoring, given the scale (62
// professions). This is a best-effort automated pass — verified afterward
// via real browser screenshots + independent Codex in-context QA (§12 of
// the 2026-09-04 directive), not assumed correct from this script alone.
import { readFileSync, writeFileSync } from "node:fs";

const research = JSON.parse(readFileSync("factory/state/career-path/career-path-research-merged.json", "utf8"));

// Longest-match-first so e.g. "医師国家試験" doesn't get partially matched by
// a shorter "医師" entry first and break the compound reading.
const RUBY_TERMS = [
  ["医師国家試験", "いしこっかしけん"], ["医師免許", "いしめんきょ"],
  ["臨床検査技師", "りんしょうけんさぎし"], ["診療放射線技師", "しんりょうほうしゃせんぎし"],
  ["管理栄養士", "かんりえいようし"], ["理学療法士", "りがくりょうほうし"],
  ["作業療法士", "さぎょうりょうほうし"], ["言語聴覚士", "げんごちょうかくし"],
  ["社会福祉士", "しゃかいふくしし"], ["薬剤師", "やくざいし"],
  ["看護師", "かんごし"], ["准看護師", "じゅんかんごし"],
  ["業務独占資格", "ぎょうむどくせんしかく"], ["名称独占資格", "めいしょうどくせんしかく"],
  ["国家試験", "こっかしけん"], ["国家資格", "こっかしかく"],
  ["養成課程", "ようせいかてい"], ["養成校", "ようせいこう"], ["養成施設", "ようせいしせつ"],
  ["実務経験", "じつむけいけん"], ["臨床研修", "りんしょうけんしゅう"],
  ["運転士免許", "うんてんしめんきょ"],
  ["特別教育", "とくべつきょういく"], ["技能講習", "ぎのうこうしゅう"],
  ["公害防止管理者", "こうがいぼうしかんりしゃ"],
  ["廃棄物処理施設技術管理者", "はいきぶつしょりしせつぎじゅつかんりしゃ"],
  ["教員免許状", "きょういんめんきょじょう"], ["教員免許", "きょういんめんきょ"],
  ["旅程管理主任者", "りょていかんりしゅにんしゃ"],
  ["旅行業務取扱管理者", "りょこうぎょうむとりあつかいかんりしゃ"],
  ["栄養教諭", "えいようきょうゆ"], ["学校栄養職員", "がっこうえいようしょくいん"],
  ["獣医師免許", "じゅういしめんきょ"], ["獣医師", "じゅういし"],
  ["運行管理者", "うんこうかんりしゃ"],
  ["食品衛生監視員", "しょくひんえいせいかんしいん"], ["任用資格", "にんようしかく"],
  ["技術士", "ぎじゅつし"], ["電気主任技術者", "でんきしゅにんぎじゅつしゃ"],
  ["造園施工管理技士", "ぞうえんせこうかんりぎし"],
  ["土木施工管理技士", "どぼくせこうかんりぎし"], ["建築施工管理技士", "けんちくせこうかんりぎし"],
  ["管理主任技術者", "かんりしゅにんぎじゅつしゃ"],
  ["水道技術管理者", "すいどうぎじゅつかんりしゃ"],
  ["司書講習", "ししょこうしゅう"], ["司書", "ししょ"],
  ["中小企業診断士", "ちゅうしょうきぎょうしんだんし"],
  ["雑踏警備業務検定", "ざっとうけいびぎょうむけんてい"],
  ["警備業法", "けいびぎょうほう"],
  ["都道府県知事免許", "とどうふけんちじめんきょ"],
];

// Sort longest-first so "医師国家試験" is matched whole before the shorter
// "国家試験" can match the substring inside it (a naive sequential
// term-by-term replace corrupts nested matches into garbled double-ruby).
const SORTED_TERMS = [...RUBY_TERMS].sort((a, b) => b[0].length - a[0].length);

function applyRuby(text) {
  if (!text) return text;
  let out = "";
  let i = 0;
  while (i < text.length) {
    const hit = SORTED_TERMS.find(([term]) => text.startsWith(term, i));
    if (hit) {
      out += `｜${hit[0]}《${hit[1]}》`;
      i += hit[0].length;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

const careerPaths = {};
for (const e of research) {
  careerPaths[e.profession_id] = {
    qualificationRequired: e.qualification_required,
    qualificationName: e.qualification_name ? applyRuby(e.qualification_name) : null,
    pathSummary: applyRuby(e.path_summary),
    routes: e.routes.map((r) => ({
      routeName: r.route_name,
      routeType: r.route_type,
      steps: r.steps.map((s) => ({
        stage: applyRuby(s.stage),
        requirementType: s.requirement_type === "national_exam" ? "exam" : s.requirement_type,
        required: s.required,
        description: applyRuby(s.child_friendly_description || s.description),
      })),
    })),
    alternatives: e.alternatives ? applyRuby(e.alternatives) : null,
    canStartLater: e.can_start_later,
    importantNotes: e.important_notes ? applyRuby(e.important_notes) : null,
    factSources: e.fact_sources || [],
    lastVerified: e.last_verified,
  };
}

const out = `// AUTO-GENERATED from factory/state/career-path/career-path-research-merged.json
// by factory/harness/build-career-paths.mjs — do not hand-edit past this
// header without also updating the research JSON, or the two will drift.
//
// "どうやってなるの？" career-path data for Job Reveal (2026-09-04 directive).
// Fact-checked against Japanese public/authoritative sources per profession
// (see factSources on each entry, and factory/state/career-path/research-*.json
// for the full per-batch research notes). Kept OUT of src/data/content/*.ts
// to avoid bloating 14 files with a large nested object per profession —
// looked up by profession id from ProfessionScreen instead.
import type { CareerPath } from "./types";

export const CAREER_PATHS: Record<string, CareerPath> = ${JSON.stringify(careerPaths, null, 2)};

export const getCareerPath = (professionId: string): CareerPath | undefined => CAREER_PATHS[professionId];
`;
writeFileSync("src/data/careerPaths.ts", out);
console.log(`Wrote src/data/careerPaths.ts with ${Object.keys(careerPaths).length} professions.`);
