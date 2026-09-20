# JIBUN CHOICE Ver.2 — Product / Design Bible（索引）

制定日: 2026-09-20
起票者: Human（Product Owner）の指示を、コード変更なしで仕様として書き起こしたもの。
Ver.1 は `ver1-archive-2026-09-20` タグ / `archive/ver1` ブランチに凍結済み
（[`factory/state/release/ver1-archive.md`](../../factory/state/release/ver1-archive.md)）。

## この仕様書群の位置づけ

Ver.2 は **Mission を変えるものではなく、Mission への届け方を変えるもの**。
キーワードは **PLAY FIRST** —— 「仕事を知ってもらうためにゲームを使う」から
「ゲームとして遊んでいたら、知らない仕事・社会に出会っていた」へ。

既存の `factory/rules/*.md`（特に `principles.md` の A→B→C⇄D→E と禁止事項、
`product-identity-gate.md`）は Ver.2 でも有効。この仕様書群はそれらの上に
Ver.2 固有の決定を積むもので、矛盾する箇所は本仕様書群が **Human Decision
として** 優先する（記録: `factory/state/product-ideas/gate-log.md`
entry-2026-09-20-01）。

## 仕様の優先順位（HARD）

1. 本仕様書群の文章ルール（Product / Design Bible）
2. 明示的に **LOCKED** とマークされた仕様
3. Visual Reference（`design/v2/reference/`）
4. Claude / Codex による推測

上位と下位が矛盾した場合は必ず上位を優先する。

## 状態ラベルの読み方

| ラベル | 意味 |
|---|---|
| **LOCKED** | Human が決定済み。AI は変更・再解釈しない |
| **OPEN** | 未決定。AI は案出し・比較まで。決定は Human |
| **NEEDS_VALIDATION** | 事実確認（研究・専門家確認）が必要。推測で実装しない |

## ファイル一覧

| ファイル | 内容 |
|---|---|
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Mission・変えないこと・PLAY FIRST・ゲームループ・UI/TEXT RULE |
| [CHARACTER_BIBLE.md](CHARACTER_BIBLE.md) | 相棒キャラクターの HARD RULE（耳の左右・口なし 等） |
| [WORLD_DESIGN.md](WORLD_DESIGN.md) | 全体MAP・「パカッ」・給食WORLD MAP・進行表現・出来事状態 |
| [GAME_DESIGN_RULES.md](GAME_DESIGN_RULES.md) | Ver.2 ゲーム設計規約・アイテム・ぼうけんノート・最初の基準ゲーム |
| [ART_PIPELINE.md](ART_PIPELINE.md) | `design/v2/` の運用・Art Pipeline・Art QA HARD GATES |
| [MIGRATION_PLAN.md](MIGRATION_PLAN.md) | Ver.1 凍結・Ver.2 開発系統・既存ゲームの扱い・次の最小タスク |
| [OPEN_DECISIONS.md](OPEN_DECISIONS.md) | 未決定事項 / NEEDS_VALIDATION の台帳 |
| [audits/](audits/) | Ver.1 の AS-IS 監査（作り直しの入力資料） |

## 関連する既存ルール（引き続き有効）

- `factory/rules/principles.md` — A→B→C⇄D→E、BLOCKER 一覧
- `factory/rules/product-identity-gate.md` — Human Product Decision が必要な領域
- `factory/rules/deploy-release-policy.md` — 何が自動 deploy されうるか
- `factory/rules/language-style.md` — 語彙・ふりがな（Ver.2 の UI/TEXT RULE と併読）
- `factory/rules/art-style.md` / `visual-design-system.md` — 既存アート規約（Ver.2 で上書きされる箇所は各仕様書に明記）
