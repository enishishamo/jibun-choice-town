# PRODUCT_IDENTITY_GATE

2026-09-04 制定。きっかけ: True Home の HOME_GAME_FEEL改善という
QA/実装タスクの中で、「キャラクターがいない → マスコットを作る」という
判断が、人間のProduct Decisionを経ずに`GPT_ASSET_REQUEST`へ自動的に
昇格した（`true-home-mascot-character`、現在REJECTED_NOT_APPROVED）。
これはAutonomy Boundary違反として記録し、以後禁止する。

## 適用対象

以下に該当する変更は、AIが自動決定・自動実装してはいけない。
**HUMAN_PRODUCT_DECISION_REQUIRED** とする。

- brand character / mascotの新設
- JIBUN CHOICEを象徴する人物・生物・存在の新設
- 新しいcore gameplay loop
- collection system / 育成system
- point / currency / reward economy
- streak / daily reward等のengagement system
- 子どもの興味・性格・適性等を分類するsystem
- Homeのmajor feature追加・削除
- 新しい主要navigation architecture
- 世界観・ブランドidentityの大きな変更
- Mission / target age / core philosophyの変更
- monetizationをproduct experienceへ組み込む変更

## AIができること／できないこと

該当する変更について、AIは以下までは行ってよい:

- RESEARCH
- IDEATION
- OPTIONS
- PROS / CONS
- PROTOTYPE PROPOSAL

以下は禁止。人間の明示承認を待つ:

- SELECT（複数案から一つに決定すること）
- IMPLEMENT
- GENERATE PRODUCTION ASSET（GPT_ASSET_REQUESTの発行を含む）
- MERGE INTO PRODUCT

## IMPROVEMENT ≠ PRODUCT DECISION

QA scoreを上げることを理由に、新しいProduct Featureを勝手に追加しない。

**禁止パターンの例**:
```
HOME_GAME_FEEL < 80
  → 「characterが必要」
  → mascot制作（GPT_ASSET_REQUEST発行・実装）
```

**正しい手順**:
```
QA score が閾値未達
  → 原因仮説を複数提示
  → 既存仕様内で改善可能なものを先に検討・実装
  → それでも新Product Featureが必要だと判断したら
    → PRODUCT_IDEAとして `factory/state/product-ideas/` に記録
    → HUMAN_PRODUCT_DECISION_REQUIRED = true として報告
    → 実装せず、次の独立タスクへ進む
```

QA Gateは Product Strategy より上位ではない。閾値未達を理由に
新しいブランド資産・機能を自動で生み出してよい根拠にはならない。

## PRODUCT IDEA BACKLOG

`factory/state/product-ideas/` に、Product Decisionが必要なアイデアを
通常のDevelopment Backlog（`factory/state/backlog/*.md`）とは別に記録する。
ここに置かれるアイデアは **採用決定ではない**。
`DESIGN_RESERVED` / `HUMAN_EXPLORATION_REQUIRED` として扱う。

AIが勝手に以下を決めることは禁止:
- キャラクターにする／生き物にする／植物にする、等の具体的な形態
- 色の意味
- 興味カテゴリの分類基準
- 成長・獲得ルール

## Continuous Developmentへの適用

Continuous Development（`feature/harness-bootstrap`）は継続してよい。
ただし各task開始時に次を判定する:

- 「これは既存仕様内の改善か？」
  - YES → autonomous development可
  - NO / UNCERTAIN → PRODUCT_IDENTITY_GATE発火。
    idea/proposalまで作成し、実装はせず次の独立taskへ進む。

Product Decision待ちを理由に Development Track全体を停止しない。

## LOG

Product Identity Gateが発火した場合、`factory/state/product-ideas/gate-log.md`
に以下を記録する:

- `proposed_change`
- `why_ai_considered_it`
- `affected_core_assumption`
- `options`
- `recommendation`
- `HUMAN_PRODUCT_DECISION_REQUIRED = true`
