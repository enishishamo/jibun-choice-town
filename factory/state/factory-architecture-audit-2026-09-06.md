# JIBUN CHOICE FACTORY — ARCHITECTURE AUDIT (2026-09-06)

**目的**: 現在実際に存在しているFactoryを監査し、Human向けArchitecture/Operating
Manual作成の土台とする。**本ドキュメント自体はarchitectureを変更しない**——
observation onlyの記録。

**方法**: `factory/rules/`全15ファイル、`factory/state/`全831ファイル、
`factory/harness/`全57+ファイル、`.claude/agents/`10件、`.claude/commands/`4件、
`package.json`、`.github/workflows/`、git hooks、GitHub branch protectionを
実際に読み・grep・APIで確認。推測・補完は行わず、確認できたことのみ記載。

**分類凡例**:
- **IMPLEMENTED** — 実際に動くコード/設定があり、確認できた
- **PARTIALLY IMPLEMENTED** — 一部は実コード、残りはprose/手動
- **DOCUMENTED BUT NOT ENFORCED** — rule.mdに書いてあるが、それを強制する仕組みが存在しない
- **CONVENTION ONLY** — 慣習として運用されているだけ（記述すらない場合も）
- **MISSING / UNCLEAR** — 存在しない、または存在するかどうか確認できない
- **CONTRADICTORY** — 複数の記録が矛盾している

---

## 0. 最重要の一次事実（全セクションの前提）

以下は直接確認した事実であり、これから先の全分類の根拠になる。

1. **このrepoにproject-level `CLAUDE.md`が存在しない。** `.claude/`配下は
   `agents/`と`commands/`と`launch.json`のみ。つまり**`factory/rules/`配下の
   どのファイルも、新しいClaude Codeセッションの起動時に自動で読み込まれる
   仕組みが一切ない。**
2. `.claude/settings.json` / `.claude/settings.local.json`は存在しない
   →hooksベースの自動化も存在しない。
3. `.git/hooks/`には`*.sample`のプレースホルダしかない（実行可能なhookは0件）。
4. GitHub `main`ブランチにbranch protectionは設定されていない
   （`gh api repos/.../branches/main/protection` → `404 Branch not protected`）。
5. `.github/workflows/deploy.yml`が唯一のCI/CDで、`push to main`時に
   `npm run build`→GitHub Pagesへdeployするのみ。**lintもtestも
   `factory/harness/`のQAスクリプトも一切実行しない**（yml本文で確認済み、
   `harness`/`.mjs`文字列は0件）。
6. `cron` / `scheduled` / `webhook` / `husky` / `pre-commit` / `pre-push` /
   「GitHub ActionsからAI/Codexを呼ぶ仕組み」——リポジトリ全体をgrepして
   **すべて0件**。
7. `factory/harness/`配下の約9000行の`.mjs`はどれ一つとして
   `package.json`・CI・git hook・cronから自動起動されない。人間かClaude
   セッションが`node factory/harness/X.mjs`と手で打つ以外に実行経路がない
   （script間の直接呼び出しは数件のみ確認——後述§14）。

**結論**: このFactoryの「ルール」「ゲート」「ループ」は、原則として
**その時点でその作業をしているClaude（またはHuman）が、そのルールを
読んでいて、かつ従うことを選んだ場合にのみ機能する**。これは以下の
全セクション、特に§15の判定に一貫して影響する。

---

## 1. Current Factory Architecture

物理構造は3層:

- **`factory/rules/`**（15ファイル）— 恒久的な方針文書。誰も強制的に読ませない。
- **`factory/state/`**（831ファイル）— 作業記録・backlog・QA結果・evidence。
  `src/`からは一切importされない、純粋なメタ情報（Claudeセッション間の
  「引き継ぎメモ」としてのみ機能）。
- **`factory/harness/` + `factory/scripts/` + `.claude/agents,commands/`**
  — 実行可能なコード・エージェント定義・slash command定義。

加えて2つの並行する「制作パイプライン」が存在する（互いに独立、
`visual-production-flow.md`が明記）:
- **`/new-world`パイプライン**（新worldのコンテンツ制作、MASTER.md）
- **Visual/UI production flow**（画面のvisual/UI制作、visual-production-flow.md）

**分類: PARTIALLY IMPLEMENTED**——ディレクトリ構造・命名規則は一貫して
実在し充実しているが（831ファイルは実データであり空のテンプレートではない）、
これらを結びつけて「1つのFactory」として動かしているのは、その都度の
Claudeセッションの手作業（bashコマンド・Agent tool呼び出し）である。

---

## 2. Team / Roles

`.claude/agents/`に10体、`tools`のみ指定（`model`指定なし）:

| agent | 役割 | tools |
|---|---|---|
| jc-planner | 新world候補出し・職種構成推奨 | Read, Grep, Glob |
| jc-researcher | 一次情報での職業調査 | Read, Write, WebSearch, WebFetch, Grep, Glob |
| jc-game-designer | A→B→C⇄D→E設計 | Read, Write, Grep, Glob |
| jc-critic | design.mdの独立採点・差し戻し | Read, Grep, Glob |
| jc-art-director | art-manifest.json作成 | Read, Write, Grep, Glob |
| jc-final-qa | 実装後13項目QA | Read, Bash, Grep, Glob |
| jc-interaction-engineer | gesture/animation実装 | Read, Edit, Write, Bash, Grep, Glob |
| jc-interaction-critic | gesture品質の独立検証 | Read, Bash, Grep, Glob |
| jc-visual-design-researcher | 実在ゲームの視覚言語調査 | Read, Write, WebSearch, WebFetch, Grep, Glob |
| jc-visual-director | 画面全体のvisual cohesion QA | Read, Bash, Grep, Glob |

**IMPLEMENTED（部分的に）**: agentがAgent/Task toolで実際に起動された場合、
そのagentの`tools`制限は**プラットフォーム自身によって機械的に強制される**
（これは本監査で唯一、「プロンプトではなくシステムが強制する」と言える境界）。

**DOCUMENTED BUT NOT ENFORCED（起動そのもの）**: しかし「このタスクには
jc-criticを使うべきだ」という判断自体を強制するものは何もない。repo全体を
grepしても、どのagent名も他のコードから**プログラム的に**呼び出されて
いない——呼び出すのは常に人間かClaudeの判断。10体のうち実際に
このセッションで使われたのは一部のみ（今回の監査でも3体のExplore
サブエージェントを使ったが、`jc-*`ではなく汎用`Explore`だった）。

---

## 3. Core Beliefs / Principles

`factory/rules/principles.md`が正本、「全Agent共通・変更不可」と明記。
A→B→C⇄D→E骨格、Critic BLOCKER禁止事項リスト、Source of Truth原則
（実コード＞DB）を定義。

**IMPLEMENTED**: Source of Truth原則を支える`node factory/scripts/
update-factory-db.mjs`は実在し動作する（確認済み）。

**DOCUMENTED BUT NOT ENFORCED**: BLOCKER禁止事項リスト（「Cを使わなくても
攻略できる」「職業名先出し」等）自体は、それを検出する自動lintは存在しない
——検出は`jc-critic`/Codexレビューが**コードを読んで**判定する、人間可読の
基準であり、静的解析ではない。

---

## 4. Authority Boundary（Product Identity Gate）

`product-identity-gate.md`——mascot/core gameplay/points・currency/
分類system/major nav変更/mission変更等は`HUMAN_PRODUCT_DECISION_REQUIRED`。
AIはRESEARCH/IDEATION/OPTIONS/PROS-CONSまで、SELECT/IMPLEMENT/
GENERATE PRODUCTION ASSET/MERGEは禁止。

**この仕組み自体が「越権があった」という実インシデントから生まれた**
（`factory/state/product-ideas/gate-log.md` entry-2026-09-04-01:
Claudeが自動でmascot用GPT_ASSET_REQUESTを発行→Humanが差し戻し
`REJECTED_NOT_APPROVED`）。

**DOCUMENTED BUT NOT ENFORCED**: このgateを技術的に強制するコードは
存在しない。禁止されている行為（例:GPT画像生成APIを直接叩く、
`src/`にmascotコンポーネントを追加する）を検出・ブロックするlint/hook/
CIチェックは一切ない。`factory/state/art/provider-status.json`で
**有料API自体は`art-provider.mjs`のコードレベルで`PAID_PROVIDERS`と
してハードブロックされている**（これは数少ない真のコード的ガード）が、
「新機能の是非」という判断自体はコードでは検出不可能な性質のもの——
これは構造的にコードでは強制しにくい領域であり、恒久的に
**「Claudeがgate-log.mdを見て自省する」ことに依存する**。

**運用実績としては機能している**: gate-log.mdに2件の発火記録があり、
両方とも実際にHuman判断まで実装を止めた記録が残っている（性善説的
自己申告だが、記録は正直）。

---

## 5. Routing（AI Routing / Compute Steward）

`ai-routing.md`——Sonnet=実装、Codex=独立レビュー、Haiku=機械的作業、
Fable/Opus=本当に難しい場合のみ+ログ必須、というルーティング方針。

**CONVENTION ONLY**: どのタスクにどのモデルを割り当てるかを強制する
コードは存在しない。`routing-log.jsonl`（266行、2026-09-01〜09-06）は
**自己申告ログ**——Codex delegation 39件、art-qa/art-provider呼び出し
154件が記録されているが、これは「ルールに従った証拠」であって
「ルールを強制する仕組み」ではない。Fable/Opus使用時の
`WHY_HIGH_REASONING_MODEL_REQUIRED`記録義務も、書くかどうかは
その都度のセッション次第。

**IMPLEMENTED（部分的）**: `codex-task.mjs`/`codex-review.mjs`は
コードレベルで有料API keyを剥奪する（`SAFE_ENV`から`OPENAI_/
ANTHROPIC_/AZURE_OPENAI_`を機械的に削除）——これは実際にコードで
強制されている数少ない安全策の一つ。

---

## 6. Standard Operation（`/new-world`と`/game-lab`）

`.claude/commands/new-world.md`は17段階のパイプライン表を持つが、
**単一のオーケストレータスクリプトは存在しない**。各段階は別々の
既存スクリプト（`codex-task`, `art/art-need-detector.mjs`,
`art/art-loop.mjs`, `verify.mjs`, `gameplay-qa-<world>.mjs`,
`loop.mjs review`, `update-factory-db.mjs`）か、明示的に"Claude"
（設計・実装・commit）を指す。

**PARTIALLY IMPLEMENTED**: `/game-lab`は`factory/harness/game-lab.mjs`
という実在する単一スクリプトが`research`/`audit-all`/`improve`/`status`
の4サブコマンドを実装しており、これは「実体のあるコマンド」と言える
（他のslash commandより実装度が高い）。ただし`improve`内部の
「提案比較→決定→実装」はやはりClaudeへのprose指示のまま。

`/generate-art`・`/world-expansion`も同様のPARTIALLY IMPLEMENTED
——一部段階（dry-run/QA/link-check）は実スクリプト、承認ゲートと
視覚判断はClaudeの手作業。

**重要な自己証言**: `factory/state/factory-self-critique.json`
（score 22, verdict FAIL、日付は本監査以前）はこの点を既に指摘済み:
「`/new-world` is documentation, not an executable end-to-end
orchestrator... claimed zero-human-intervention evidence is
contradicted by recorded user calibration.」——**Factory自身が
過去に同じ結論に達している。**

---

## 7. User Learning Loop

`autonomous-execution.md`が定義: 実観測→構造化→severity→仮説→task→
repair→QA→release→次のtest、というloop。REAL_USER_FEEDBACKは
Continuous Product Loopより常に優先。

**MISSING / UNCLEAR（入力そのもの）**: `factory/state/feedback/
real-user-feedback.jsonl`は**まだ存在しない**（README自身が「今回は
自動改善までは実行しない、schema/workflowのみ」と明記）。
`backlog.md`・`successful-patterns.md`も見出し行のみ。
**このLoopを駆動する実データは現時点でゼロ**——スキーマ
（`real-user-feedback-schema.json`、draft-07、20フィールド）は
精緻に作られているが、「誰が・どうやって実際の子どもの観測を
このJSONLに書き込むのか」という取り込み経路（アプリ内フィードバック
UI、テレメトリ等）は**存在しない**。README自身が「triage は
judgment call」「a human (or an explicitly-instructed agent
session) must read new feedback」と明記——完全に人手依存。

**CONTRADICTORY（発見）**: `factory/state/validation/
child-observation-schema.json`という**別の**、より古い
（Stage 7/8 §18由来）子ども観測スキーマも存在し、
`feedback/real-user-feedback-schema.json`（2026-09-04由来）とは
形が異なる。両方とも実データはゼロ。統合されていない2つの
「同じ概念のスキーマ」が併存している。

---

## 8. Continuous Product Loop

今回のセッションで実際に3周動かした（lab_check改善→blocked、
clue_board改善→blocked、codex-review.mjsのbug fix→resolved）。

**PARTIALLY IMPLEMENTED**: loopの各ステップ自体（監査データを見る→
task選ぶ→実装→独立レビュー→repair→QA→backlog更新）は今回
**実際に人間の逐次介入なしで3周回った**——これは事実として観測された
実績である。しかしこれは「仕組みが自動で回した」のではなく、
**このセッションのClaudeが、その場でautonomous-execution.mdの
指示を読み、自分の判断で1つずつ手動実行した**結果であり、次に
別のセッションが同じ動きをする保証はゼロ（§0参照）。

**MISSING**: 「次のtaskを機械的に選ぶスケジューラ」は存在しない
——task選択は毎回Claudeの読み込みと判断。

---

## 9. Review / Repair / QA

これは本Factoryで**最もコードの実体が濃い**領域だが、粒度によって
評価が大きく変わる。

**IMPLEMENTED**:
- `codex-review.mjs`: 実際に`codex exec --sandbox read-only`を
  呼び、`{verdict,score,blockers[],high[],...}`をパースし、
  **blockers/highが非空ならverdictをFAILへ強制ダウングレードする
  コードが実在する**。`career_authenticity_score`/`game_quality_score`
  が両方揃えば`score = min(ca, gq)`とし、どちらかが60未満なら
  PASSをFAILへ強制ダウングレードする——これは**本監査で確認できた
  最も具体的な「機械的に強制されるゲート」**。CODEX_UNAVAILABLE/
  TIMEOUT/MALFORMEDでは絶対にPASSを返さない（fail-open禁止が
  コードで保証されている）。独立性を促す`INDEPENDENCE_PREAMBLE`
  も毎回自動でprependされる。
- `gameplay-qa-*.mjs`（10ファイル）: 決定的なpure-logicテスト。
  実行すれば本当に exploit を検出する（本セッションでも
  lab_check/clue_boardの欠陥を実際に検出した）。
- `art-loop.mjs`: PIDロックファイルで同時実行を防止する
  実コード的安全策。

**重要な自己発見（今回の監査で新規判明）**: 本セッション自身が今日
lab_check/clue_boardを独立レビューした際に使ったのは
**`codex-review.mjs`ではなく`codex-task.mjs`**
（汎用delegatorで、`INDEPENDENCE_PREAMBLE`も二軸強制ダウングレードも
持たない）だった。つまり**「二軸ゲートを機械的に強制する、より
厳格なスクリプトが存在するにもかかわらず、今日のセッションはそれを
使わず、verdict判定を自分の目で読んで手動で下した」**。これは
「ruleに書いてあること」と「実際に使われた経路」が一致しない具体例として、
このセッション自身の行動から確認された。

**DOCUMENTED BUT NOT ENFORCED**:
- `visual-production-flow.md`の「AUTO REVIEW TEAM」（5役独立レビュー）
  は、ファイル自身が「実務上は、実装を行ったセッション自身がこの
  5視点を明示的に切り替えて批判的に採点する...Codexを併用してよいが、
  必須ではない」と**自己申告している**——独立と称しているが、
  同一セッションのロールプレイであることをドキュメント自身が認めている。
- AUTO REPAIR「最大1回」ルール: これを数えるカウンタ・状態ファイルは
  存在しない。今回のlab_check/clue_boardで「1回で止めた」のは
  Claude自身がconversationの中で回数を記憶していただけ——別セッション
  が同じtaskを再開したら、`redesign-proposals.md`を読まない限り
  「もう1回試して良いか」は分からない。

---

## 10. Deploy

**IMPLEMENTED**: `.github/workflows/deploy.yml`は実在し、`push to main`
で`npm run build`→成功時のみ`actions/deploy-pages@v4`。これは
リポジトリ全体で最も確実に「本当に自動で動く」仕組み。

**CONTRADICTORY（重要）**: `factory/state/release/two-track-model.md`
（2026-09-04）は明確に:
> 「Stable tag作成・remote pushは、これまでどおり人間の明示指示があるまで行わない。」
> 「Stable tag作成は、REAL USER VALIDATION期間中は常に人間判断（STABLE_AUTO_PROMOTION = false）。」

一方`factory/rules/deploy-release-policy.md`（2026-09-06、**本セッション
内で新規作成**）は:
> 「...blockerなしの場合、Humanの個別承認を待たず、適宜、実配布中の
> 最新版（main → GitHub Pages）へ反映してよい。」

**この2つは直接矛盾しており、古い方（two-track-model.md /
release-lifecycle.md）は一切更新されていない。** さらに実際の
git履歴で、本セッションは2026-09-06に複数回、個別承認を待たず
mainへpush・本番反映した（`current-release.json`の
`routine_releases`に自己記録済み）——つまり**新しい方針が実際に
実行された事実がある一方、矛盾する古い方針文書は放置されたまま**。
Human向けマニュアルではこの矛盾を明示し、どちらが現行方針かを
確定させる必要がある。

**MISSING**: 「QAがPASSしたことを機械的に確認してからでないと
`git push`できない」仕組みは存在しない（branch protectionなし、
pre-pushフックなし）。Deploy Policyの「blockerなし」判定は
100% Claude自身の申告に依存する。

---

## 11. State Machine

`release-lifecycle.md`: `DEVELOPMENT → AI_VERIFIED → RELEASE_CANDIDATE
→ STABLE`。`factory/state/release/current-release.json`が現在の
Stable snapshotを記録（`stable-prototype-v0.1`、14 worlds）。

**PARTIALLY IMPLEMENTED**: 状態遷移の**判定基準**（validate-pipeline.mjs
実行、smoke QA実行等）は実スクリプトが存在し実際に使われた記録が
`current-release.json`にある。しかし**状態そのものを保持・遷移させる
コードは存在しない**——「今どのcommitがAI_VERIFIEDか」は`current-
release.json`という**手動更新のJSONファイル**が唯一の記録であり、
これを自動更新する仕組みはない（今回の私自身のroutine_releases追記も
手動editだった）。

`factory/state/stages.json`は珍しく「`factory/harness/stage-manager.mjs`
— edit via CLI, not by hand」と明記——CLIツールは実在するが、
このファイル自体がロックされている/直接編集を防ぐ仕組みは無い
（本監査では実際に直接editされていないか事後確認まではしていない）。

`blocked-queue.md`という新しい状態（本セッションで新設、
HUMAN_DECISION_REQUIRED）も、上記4段階のstate machineには
組み込まれていない別軸の状態——今回新設されたばかりで、
release-lifecycle.mdへの正式な統合はまだ行われていない。

---

## 12. Human Escalation

`visual-production-flow.md`のHUMAN ESCALATION RULE（10項目）を
「正本」とし、`autonomous-execution.md`と`deploy-release-policy.md`が
「同一集合」と明記して参照している。

**DOCUMENTED BUT NOT ENFORCED**: これも純粋にClaude自身の自己判定
依存。「AI Team内で重要な判断が割れた」等の条件を検知する仕組みは
無い——今回のlab_check/clue_boardの停止も、Claude自身が
「これはescalation条件#9に当てはまる」と判断して`blocked-queue.md`
に書いた、という一点のみで成立している。

**唯一の半機械的な例外**: `codex-review.mjs`のCODEX_UNAVAILABLE/
CODEX_TIMEOUT/CODEX_UNAUTHENTICATEDは、スクリプトが実際に
非ゼロ終了コードを返す——これは「Codexが使えない」という
技術的escalationのみ機械的に検出される数少ない例。

---

## 13. Observability / Evidence

**IMPLEMENTED（記録の実在という意味で）**: `factory/state/`は831ファイル
の実データを持ち、スクリーンショット・JSON verdict・backlog表が
一貫した命名規則で大量に残っている。`routing-log.jsonl`も266行の
実ログ。これは「証跡を残す文化」が実際に機能していることの強い証拠。

**CONVENTION ONLY（保存方法の一貫性）**: しかし保存先・形式に
統一されたスキーマはない——`.result.json`、`-review-N.json`、
`*.md`のnarrativeログが並存し、どれも手書きのファイル名慣習
（`<topic>-YYYY-MM-DD.md`等）に依存する。これを検証・インデックス
する自動ツールは無い（`factory/database/`は`update-factory-db.mjs`で
再生成されるが、これは`src/`のコンテンツDBであり、`factory/state/`の
evidenceファイル群そのものをインデックスするものではない）。

**MISSING**: `factory/state/runs/`（Stage 0/1の最初期9件のみ）と
それ以降の`*-impl-review-N.json`散在ファイルの間に統一的な
参照インデックスは無い——どの評価が「最新かつ有効」かは、
ファイル名の日付とbacklogの記述を人間/Claudeが読んで判断するしかない。

---

## 14. What is actually automated（実際に自動化されているものだけを列挙）

本監査を通じて確認できた、**真に人手を介さず動く**ものは以下のみ:

1. `push to main` → `npm run build`が成功すれば → GitHub Pagesへdeploy
   （`.github/workflows/deploy.yml`）。buildが失敗すればdeployされない
   ——これはbuild breakageに対する本物のfail-closedゲート。
2. `codex-review.mjs`使用時: blockers/high非空 → 強制FAIL、
   Codex呼び出し失敗系 → 常に非PASS。ただしこのスクリプトを
   使うかどうか自体は毎回の判断。
3. `art-provider.mjs`: 有料プロバイダの選択がコードレベルでブロックされる。
4. `codex-task.mjs`/`codex-review.mjs`: 環境変数からAPI keyパターンを
   機械的に剥奪（`SAFE_ENV`）。
5. `art-loop.mjs`のPIDロックファイルによる同時実行防止。
6. 各`gameplay-qa-*.mjs`: 実行されれば決定的にexploitを検出する
   （実行トリガー自体は手動）。
7. .claude/agentsの`tools`制限: agentが実際に起動されればプラットフォーム
   が強制する。

**それ以外の「自動化されている」という記述は、すべて「Claudeが
そのルールを読んでいれば、その通りに動く」という条件付きの記述である。**

---

## 15. What still depends on Claude voluntarily following instructions
### （最も厳しく監査すべき項目）

以下は**全て**、コード・CI・hook・schedulerによる強制が一切なく、
**その場のClaudeセッションが該当ルールファイルを読んでおり、かつ
従うことを選んだ場合にのみ**機能する。§0の一次事実がその根拠。

1. **factory/rules/配下15ファイル全て** — project-level CLAUDE.mdが
   存在しないため、新しいセッションはこれらの存在すら自動的には
   知らない。読ませるにはHumanが明示的に指示するか、そのセッション
   自身が`factory/rules/`をgrepしようと思う必要がある。
2. **Product Identity Gate** — mascot/課金/分類system等を
   実装しないという規律は、100% self-policing。技術的に阻止する
   コードは無い（過去に実際に一度破られ、事後にHumanが差し戻した
   実績がgate-log.mdにある——つまり**過去に実際に機能しなかった
   前例がある**）。
3. **AI Routing（モデル選択方針）** — Sonnet/Codex/Haiku/Fableの
   使い分けは完全に自己申告。
4. **Autonomous Execution Modeの全メカニズム**
   （Two Parallel Loops / WIP Limit / Auto Repair max 1回 /
   Anti-Idle / Anti-Busywork / blocked queue） —
   カウンタもスケジューラも存在しない。今回のセッションが3周
   loopを回せたのは、たまたま同一の長い会話が継続していたため
   Claude自身が文脈を保持していたからであり、セッションが切れれば
   この「継続性」は失われる。
5. **Deploy Policyの「blockerなし」判定** — QAスクリプトを実際に
   実行したかどうか、その結果を正直に読んだかどうかは、
   git push自体を止める仕組みが無い以上、完全にClaudeの申告に依存する。
6. **AUTO REVIEW TEAMの「5役独立評価」** — ドキュメント自身が
   「実際は同一セッションのロールプレイ」と認めている。
7. **Two-Track Model / Release Lifecycleの人間ゲート** — 現に
   deploy-release-policy.mdによって部分的に上書きされているが、
   その上書きの正当性・範囲の判断もClaude自身が行っている
   （§10のCONTRADICTORY参照）。
8. **Evidence保存の一貫性** — ファイルをどこに・どの形式で残すかは
   慣習のみ。
9. **どのレビュースクリプトを使うか**（codex-review.mjs vs
   codex-task.mjs） — 今回のセッション自身が、より厳格な
   `codex-review.mjs`ではなく`codex-task.mjs`を使った実例が
   すでにある（§9参照）。これは「ルールに二軸ゲートスクリプトの
   存在が書いてある」ことと「実際にそれが使われる」ことが
   同一視できないことの、本セッション自身による実証。
10. **Codexレビューの独立性そのもの** — `codex-review.mjs`は
    `INDEPENDENCE_PREAMBLE`を自動prependするが、これも所詮は
    プロンプト工学であり、Codex（別のLLM）が実際に厳格に振る舞うか
    どうかを技術的に保証するものではない。事実、本セッションでは
    lab_check/clue_boardのレビューで2回とも初回はFAILを見逃さず
    検出できたが、これは「たまたま今回のCodexセッションが機能した」
    結果であり、再現性が保証されているわけではない
    （factory-harness-backlog.mdに実際に記録されている
    「Codex vision-review path-cachingバグ」「6round非収束だった
    career-path fact review」等、Codexレビュー自体が不安定だった
    実例が複数ある）。

**結論**: このFactoryの「自律性」「ゲート」「品質保証」は、
実装コードの量としては相当なもの（harnessだけで約9000行）が
存在するにもかかわらず、**それらを「いつ・どの順で・正直に」
使うかという接続部分は一貫してClaude（またはHuman）の自由裁量に
委ねられている**。これは`factory-self-critique.json`が既に
score 22/FAILで自己申告していた通りであり、本監査はそれを
独立に再確認した形になる。

---

## 16. Contradictions / Gaps（一覧）

| # | 内容 | 該当ファイル |
|---|---|---|
| 1 | Stable promotion/remote pushの人間ゲート要否が矛盾 | `two-track-model.md`/`release-lifecycle.md`（常に人間判断）vs `deploy-release-policy.md`（2026-09-06、条件付き自動可） |
| 2 | 「real child observation」スキーマが2種類、非統合、両方データ0件 | `factory/state/validation/child-observation-schema.json` vs `factory/state/feedback/real-user-feedback-schema.json` |
| 3 | `/new-world`の文書化された成果物（critic-review.md, art-manifest.json, implementation-plan.md）と実際に生成されたファイル（例: river-healthにはimpl-review-prompt.md, art-requests/はあるがcritic-review.mdなし）が一致しない | `factory/MASTER.md` vs `factory/projects/river-health/` |
| 4 | `game-critic-v2.md`が`qa-rules.md`のgame評価部分を「優先する」と一方的に宣言しているが、`qa-rules.md`側にその旨の記載はない | `game-critic-v2.md` / `qa-rules.md` |
| 5 | WIP LIMITの解釈が当初「Factory全体を1task直列」と誤読され、同日中にHuman訂正で「同一taskへの追加修正のみ」と明確化——rule文書自体が同日中に2回意味を変えた | `factory/rules/autonomous-execution.md` |
| 6 | より厳格な二軸強制ゲートを持つ`codex-review.mjs`が存在するにもかかわらず、本セッションの独立レビューは`codex-review.mjs`ではなく`codex-task.mjs`（二軸強制なし）を使用した | `factory/harness/codex-review.mjs` vs 本セッションの実際の呼び出し |
| 7 | `factory-self-critique.json`（score 22, FAIL）が過去に同種の指摘（zero-human-intervention主張と実際の人間介入記録の矛盾）を既に行っていたが、その後の`autonomous-execution.md`等の新ルールにこの自己批判が反映された形跡はない | `factory/state/factory-self-critique.json` |
| 8 | `expansion/coverage-gap.md`は`continuous-development-queue.md`自身が「要再スキャン」（stale）と認めている | `factory/state/expansion/coverage-gap.md` |
| 9 | Product Identity Gateは実際に一度破られた前例がある（mascot自動発行）——事後に是正されたが、再発を防ぐ技術的な仕組みはgate log以外に追加されていない | `factory/state/product-ideas/gate-log.md` entry-2026-09-04-01 |

---

## 総括

- 実装コードの絶対量は大きい（harness約9000行、831 stateファイル）。
- **真に自動（人手を介さない）** なのは、build+deployとPAID API遮断、
  一部スクリプト内の二軸ゲート計算など、ごく限定的な範囲。
- **ルール文書（rules/）は「Human向けの申し合わせ」であり、
  「システムの制約」ではない。** 新しいセッションが起動した瞬間、
  これらは全て「読まれるまで存在しないも同然」——project-level
  CLAUDE.mdが無いことがこの構造の根本原因。
- Factory自身が過去に一度（factory-self-critique.json）この構造的な
  ギャップを自己申告しており、本監査はそれを別の角度から再確認した。
- 矛盾（§16）のうち#1（Deploy Policy）と#6（レビュースクリプトの選択）は
  特に、「今まさに運用が変わりつつあるが、古い文書が追随していない」
  過渡期特有のものであり、Human Decisionで解消可能。

本ドキュメントはaudit onlyであり、上記のいずれのFactoryファイルも
変更していない。
