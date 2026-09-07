# Q1 AUTONOMOUS GAME FACTORY — canonical operating rule

2026-09-08 制定（Human master request "Q1 AUTONOMOUS GAME FACTORY — END-TO-END
IMPLEMENTATION"）。この文書は**ポインタ**であり、ルールの正本は
`factory/harness/q1-factory-schema.mjs`（stage順・state machine・failure routing
表・artifact schema・GAME_DESIGN_READY checklist・budget・Human Decision domain）
と、それを適用する3つのCLI（下記）にある。文書とコードが食い違ったらコードが
正本で、この文書を直す。

既存ルールとの関係: `product-identity-gate.md`（常に最優先）、`principles.md`
（A-E不変）、`q1-first-play-standard.md`（Q1のprimary quality gate・BLOCKER
リスト）、`deploy-release-policy.md`（deploy可否の正本）、`autonomous-execution.md`
（USER LEARNING LOOP優先・WIP・anti-idle）を**置き換えない**。それらを機械的に
つなぐ層を追加しただけである。

## 入口と3つのCLI

| 役割 | script | 主なcommand |
|---|---|---|
| TRIGGER / 優先度 / WIP / reaudit / 実ユーザーevidence | `factory/harness/q1-trigger.mjs` | `fire <TRIGGER>`, `evidence --file`, `next`, `wip`, `dependency` |
| 1ゲームのdesign→spec→art→impl→release ledger と gate | `factory/harness/q1-pipeline.mjs` | `init`, `submit`, `review`, `fail`, `repair-done`, `redesign`, `gate`, `human-decision`, `art-request`, `art-review`, `link-task`, `release-ready`, `mark-reaudit` |
| LEGACY Q1: reverse audit → classification → queue → 着手 | `factory/harness/q1-legacy-audit.mjs` | `seed`, `record`, `list`, `queue`, `start` |

自己テスト: `node factory/harness/q1-factory-selftest.mjs`（A–W、evidenceは
`factory/state/selftests/`）。

State: `factory/projects/<game_id>/q1-pipeline.json`（正本）、
`factory/state/q1-pipeline-index.json`（索引）、`factory/state/legacy/`、
`factory/state/q1-trigger-log.jsonl`、`factory/state/feedback/real-user-evidence.jsonl`。
Release自体は従来どおり `task-state.mjs can-deploy` と CI の
`release-gate-check.mjs` が判定する（`release-ready` はその前段でdesign chainを
検査してから `can-deploy` へ委譲する）。

## Pipeline（正本: `DESIGN_STAGES` / `DOWNSTREAM_STAGES`）

```
TRIGGER → task + pipeline(init)
→ PROFESSION_RESEARCH(fact_sheet: sources必須)
→ SCOPE_CORE(core/scope/Profession Name Hidden Test)
→ AE(A=場所 B=対象・困りごと C=専門性・道具 D=思考過程 E=解決の瞬間) → CORE_SCOPE_CHECK
→ PLAY_SEED(seeds ≥ 3) → EXISTING_GAME_RESEARCH(reference研究)
→ C_COMPRESSION(original_C / compressed_C / preserved_D …)
→ GAME_TRANSLATION(translations ≥ 3 + adopted + rationale)
→ FIRST_PLAY_UX(first 5 seconds) → NO_MANUAL_EXPLOIT_CHECK → CORE_BACK_CHECK
→ INDEPENDENT_REVIEW(codex-review.mjs evidenceのみ) → gate → GAME_DESIGN_READY
→ GAME_SPEC → ART_BRIEF(or no_art_required) → art-request → ART_PRODUCTION(art-loop.mjs)
→ ART_REVIEW(reviewer ≠ producer) → IMPLEMENTATION → IMPLEMENTATION_QA
→ INDEPENDENT_IMPL_REVIEW → release-ready → task-state can-deploy → CI → deploy
→ REAL USER EVIDENCE(evidence --file) → 必要なら failure router で該当stageへRETURN
```

FAIL は必ず structured failure（`fail --code <FAILURE_CODE>`）にする。
`failure_code → return_to / preserve / must_change` は `FAILURE_ROUTES` が正本
（例: `C_NOT_NEEDED_FOR_D → AE または GAME_TRANSLATION`, `ANSWER_LEAK →
GAME_TRANSLATION / FIRST_PLAY_UX`, `VISUAL_AFFORDANCE_FAILURE → ART_BRIEF /
FIRST_PLAY_UX`, `IMPLEMENTATION_CHANGED_D → IMPLEMENTATION`）。

## Budget（REPAIR vs REDESIGN）

- REPAIR = 同一design iteration内の局所修正。`REPAIR_MAX_PER_ITERATION = 1`
  （`task-state.mjs` の AUTO REPAIR 1回と同じ規律）。
- 2回目のFAILは `REDESIGN_REQUIRED`: `redesign --seed|--translation` で**別の**
  seed/translationを採用した新iteration（repair_count=0、下流artifactはSTALE）。
  失敗したのと同じtranslationは機械的に拒否。
- `REDESIGN_MAX = 2`。超えたら `ESCALATED`（Human Decision Required）。
  無限修正はしない。

## Independence / Evidence

- Independent review evidence は `factory/harness/codex-review.mjs` の出力のみ
  （`review-evidence.mjs` が形を検証）。creator == reviewer なら
  `independent = false` でgateは通らない。Codex不可時は evidence を捏造せず、
  gateをPASS扱いにしない。
- Art: producer（`codex_imagegen` via `art-loop.mjs`）≠ reviewer（`art-qa.mjs`
  vision critic）。`art-review` は reviewer==producer をPASSにしない。
- 各artifactは `version / source_artifacts / creator / created_at` を持ち、上流
  の新versionで下流は transitive に `STALE`（`DOWNSTREAM_OF`）。STALEな上流の
  上には積めない。

## Human Decision

`HUMAN_DECISION_DOMAINS`（mascot, core gameplay loop, points/currency/rewards/
streak, collection/growth, interest/aptitude classification, major Home
feature, world unlock, monetization, mission, target age, core philosophy）を
artifactの `human_decision_domains` か `human-decision` command で宣言すると
open Human Decision となり、`gate` / `release-ready` / `submit` が止まる。
解決は `resolve-human-decision --note "<human text>"` のみ（ESCALATED からの
復帰はここで budget をreset、履歴に残る）。

## Legacy Q1

`q1-legacy-audit.mjs seed` は既存の独立監査 `factory/state/audits/q1-audit.json`
と blocked-queue の独立レビュー残存所見からreverse audit（`current_*`,
`actual_*`, `answer_leak`, `brute_force`, `classification`）を機械的に下書きし、
RELEASED済み repair（review PASS）は PASS に上書きする。分類 →
`CLASSIFICATION_ENTRY_STAGE`（LOCAL_REPAIR→IMPLEMENTATION, GAME_TRANSLATION_
REBUILD→GAME_TRANSLATION, AE_REBUILD→AE, SCOPE_CORE_REBUILD→SCOPE_CORE,
FACTUAL_RESEARCH_REQUIRED→PROFESSION_RESEARCH）。`queue` は優先度順
（release_blocker > serious_first_play_failure > core_distortion > answer_leak >
brute_force_exploit > major_factual_problem > severe_c_d_failure > other、同点は
GQが低い順）。`start --backfill` は分類より上流のartifactをreverse auditから
v1として保存（creator=reverse-audit）し、entry stageから再開する。WIPは
`WIP_MAX_ACTIVE_PIPELINES`（`--force` は明示override、履歴に残る）。
「すでに作ったから残す」は分類理由にならない。

## Triggers / Reaudit / Real user evidence

`fire NEW_Q1_REQUEST | LEGACY_AUDIT_REQUIRED | QA_FAILURE | STANDARD_UPDATED |
SHARED_UI_CHANGED | SHARED_ART_CHANGED | DEPENDENCY_CHANGED`。reaudit系は
`--dependency <dep_id>` で `depends_on` に一致する released pipeline だけを
`REAUDIT_REQUIRED` にする（`--all` は STANDARD_UPDATED のみ）。
`evidence --file` は `observation` と `interpretation` を分離した record を要求し
（同一文は拒否）、HIGH/BLOCKER は `suggested_failure_code` の routing で該当
stageへ返す（USER LEARNING LOOP優先）。LOW/MEDIUM は蓄積のみ。既存の
`real-user-feedback.jsonl`（観察の一次記録）を置き換えない——これはその上の
routing record であり、`source_feedback_id` で参照する。
`next` はWIPと queue を見て「今やること」を返し、queueに着手可能なlegacy
taskがありWIPが空いていれば idle と言わない。

## 今回追加しなかったもの（意図的）

新agent・新mascot・新reward/currency/streak/growth・core gameplay loop・
monetization・全Q1一斉rebuild・Factory全体の書き直し。
