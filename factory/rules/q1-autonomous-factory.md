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
- 下流stage（GAME_SPEC / ART / IMPLEMENTATION）に返る失敗は、同一iteration内で
  もう1回だけ局所修理できる（downstream repair）。それも尽きたら `ESCALATED`。
- ESCALATED からの復帰は Human だけ（下記「Human Decision と Limited Human
  Exception」）。Factory が自分で予算を戻すことはない。

## Mechanical Consistency Repair（design repairとの区別）

**Human Decision（2026-09-09、legacy-clue-join r6）。** 「設計を変える修理」と
「すでに決定済みの内容を artifact 間で機械的に同期する修理」は別物であり、
budget を消費してはいけない。後者を `q1-pipeline.mjs consistency-repair
<game_id> <artifact_type> --file <path> --reason "..."` として rules-as-code
化した（`q1-factory-schema.mjs` の `CONSISTENCY_REPAIR_EXCLUDED_TYPES` /
`CONSISTENCY_REPAIR_PROTECTED_FIELDS` / `checkConsistencyRepairEligible`）。

- 対象: upstream artifact のバージョン参照更新漏れ、stale wording の除去、
  provenance（`derived_from` 等）の同期、upstream で既に確定した内容の
  downstream への反映。
- 対象外（機械的に拒否）: CORE/SCOPE（`scope_core` の必須フィールド）、A-E
  （`ae` の必須フィールド）、**採用中**の Game Translation の機構フィールド
  （`game_translations` の adopted entry の goal/primary_action/
  system_reaction 等、および `adopted_translation_id` 自体）、
  pass/fail 系の verdict フィールド（`core_scope_check`/`core_back_check`/
  `no_manual_exploit_check` の boolean）、`play_seeds` の各シードの因果ループ
  本体（authentic_causal_loop/player_action/system_reaction/D_expressed/
  E_reached）。`fact_sheet`/`game_spec`/`art_brief`/`art_production`/
  `implementation`/`implementation_qa` は型ごと対象外（ほぼ全フィールドが
  mechanic/code そのものであり「安全なフィールド」が実質存在しない）。
- 判定は申告ではなく機械的diff（提出前後で保護フィールドが byte-identical か）
  で行う。1つでも保護フィールドが変われば `accepted:false` で拒否され、通常の
  `fail`/`repair-done`/`redesign` 経路へ戻る。
- **repair_count / redesign_count / design_iteration を一切変更しない**
  （回復も消費もしない）。ESCALATED 中でも呼べ、成功すると state は
  `RETURNED` へ戻る（`escalation.resolved_via: "consistency_repair"` を記録）。
  Open な Human Decision が Product Identity domain を持つ場合はこの経路自体
  を使えない。
- self-test BB-FF（2026-09-09）: stale reference 単独では escalate しない／
  upstream で削除済みの claim の downstream 残存は consistency repair へ通る
  ／CORE・A-E・採用 translation の機構・fact_sheet の変更は拒否される／
  budget を一切動かさない／Product Identity 系の open Human Decision は
  ブロックする、をそれぞれ機械テスト。
- **budget を緩める仕組みではない。** 意味・ルール・ゲーム挙動を変える必要が
  生じたら、その時点で通常の repair/redesign/escalation に戻す。

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
- **design review の staleness は設計stage artifact の新versionだけが起こす**
  （2026-09-09確定、self-test X）。game_spec / art / implementation は
  GAME_DESIGN_READY の**後**に作る成果物なので、その再提出で design review は
  stale にならない（implementation review は game_spec / implementation /
  game_translations / art_production の変更で stale）。
- `art-review --pass` は state が ART 系（ART_PRODUCED / ART_BRIEF_READY /
  SPEC_READY / GAME_DESIGN_READY / ART_APPROVED）のときだけ ART_APPROVED へ遷移
  する。実装修理中（REPAIRING）など無関係な state では verdict だけ記録し
  state は上書きしない（`state_kept: true`、self-test Y）。

## Human Decision と Limited Human Exception

### Human Decision（Product Identity）

`HUMAN_DECISION_DOMAINS`（mascot, core gameplay loop, points/currency/rewards/
streak, collection/growth, interest/aptitude classification, major Home
feature, world unlock, monetization, mission, target age, core philosophy）を
artifactの `human_decision_domains` か `human-decision` command で宣言すると
open Human Decision となり、`gate` / `release-ready` / `submit` が止まる。
解決は `resolve-human-decision --note "<human text>"` のみ（ESCALATED からの
復帰はここで repair / redesign 両方の budget をreset、履歴に残る）。

### Limited Human Exception（Product Identity ではない限定承認）

leak-detective の hd-1 / hd-2（2026-09-08〜09）で必要になった、**Product
Identity 判断ではない**が Factory 単独では越えられない停止（予算切れ後に、
既に特定・準備・検証済みの狭い修正を正式にレビュー工程へ通す等）のための
機構。`human-decision <game> --kind limited_exception --scope "<変えてよい
範囲>" [--repairs 1..3] --note "<human text>"` で open（open の間は submit /
gate / release-ready が止まる）→ `resolve-human-decision` で有効化。

- 有効化で戻るのは **repair budget だけ**（repair_count=0）。redesign_count は
  触らない。その exception が有効な間は **redesign も downstream extra repair も
  なく、`--repairs` の上限だけが予算**。上限を超えた FAIL は再び ESCALATED
  （self-test Z）。
- 記録は `limited_exceptions[]`（scope / repairs_max / repairs_used /
  precedent:false / status active→closed|exhausted）。design review PASS で
  closed。**一般ルールや repair/redesign budget 緩和の前例にはならない**。
- 承認範囲外の新しい HIGH/BLOCKER、CORE/SCOPE の再設計、Product Identity
  issue、別の Game Translation 構造変更が必要になったら再 ESCALATE する。
- レビューが `HUMAN_REQUIRED` を返した場合も同じ hd 機構で open される
  （kind は product_identity 扱いだが domains は空）。何が Human に必要かは
  escalation reason と blocked-queue.md に書く。

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
`queue` は blocked-queue.md の行（`q1-improve-<game>` / `q1-rebuild-<game>`）または
task-state が BLOCKED / HUMAN_DECISION_REQUIRED の legacy game を
`parked_human_decision` にし、`next` は提案せず `start` は `--force` でも拒否する
（2026-09-09、self-test AA。Human Decision を Factory が上書きすることはない）。

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

## 実証記録（2026-09-09時点）と役割

- **NEW Q1 の E2E 実証: leak-detective**（水道の漏水調査員、猛暑イベント6つ目、
  `leak_trace`）。research → CORE/SCOPE → A-E → seeds → C compression →
  translations → first-5-seconds → design review r1〜r9（r9 PASS 84）→
  GAME_DESIGN_READY → game_spec → art_brief → art-loop（Codex imagegen）→ 独立
  art QA PASS → implementation → gameplay QA harness → 375px 実機確認 → impl
  review r1〜r4（r4 PASS 84）→ release-ready → main ba77115 → CI 34270843759
  → GitHub Pages live 確認。途中 hd-1 / hd-2 の Limited Human Exception を2回
  使った（記録: `factory/projects/leak-detective/q1-pipeline.json`、
  `factory/state/release/current-release.json` routine_releases）。
- **Legacy Q1 の E2E 実証: forecast_and_balance**（LEGACY_AUDIT_REQUIRED →
  reverse audit → LOCAL_REPAIR → 独立 impl review PASS → main b6c9180 → CI
  34095091821）。
- **ESCALATED（Human Decision 待ち）: weather-forecaster**（他組織の裁量判断が
  E に入る構造。`factory/state/blocked-queue.md`）。Human Decision を仮定して
  再開しない。
- 役割: **Claude** = 設計 artifact・実装・UI/CSS/SVG・gameplay QA harness・
  pipeline 操作。**Codex** = 独立レビュー（`codex-review.mjs` のみが evidence）
  と illustration 生成（`art-loop.mjs`、OAuth・有料API不使用）。**Mechanical
  QA** = schema validation・staleness・budget・gate・`gameplay-qa-*.mjs`・
  build/lint/tsc・`release-gate-check.mjs`（CI）。**Human** = Product Identity
  Decision と Limited Human Exception のみ。
- Handoff: design PASS → `gate`（GAME_DESIGN_READY）→ game_spec → art_brief →
  `art-request` / `art-loop run` → `art-review`（producer≠reviewer）→
  implementation → implementation_qa（実機 evidence）→ `task-state set-qa` →
  impl review（`codex-review.mjs`）→ `task-state set-review` →
  `release-ready` → main（app files + project evidence + tasks.json）→
  `set-release-commit` → push → CI `release-gate-check` → live 確認 →
  `set-version`（RELEASED）→ current-release.json 追記。
- 構築フェーズは 2026-09-09 に完了（task `q1-factory-construction-2026-09-08`）。
  以後は通常運転: `q1-trigger.mjs next` / WIP / Anti-Idle に従い、Factory
  architecture の変更は「複数工程にまたがる構造的問題・繰り返す Redesign
  failure・architecture 自体の変更」が出たときの escalation 候補として記録する
  だけにする（モデル選択を停止理由にしない）。

## 今回追加しなかったもの（意図的）

新agent・新mascot・新reward/currency/streak/growth・core gameplay loop・
monetization・全Q1一斉rebuild・Factory全体の書き直し。
