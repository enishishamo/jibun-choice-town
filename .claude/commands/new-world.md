---
description: JIBUN CHOICE Game Factoryで新しい世界（イベント編）を1本制作する標準フロー
---

JIBUN CHOICE Game Factory の /new-world フローを開始してください。
ユーザーが自然言語で「次の世界を作って」と言った場合もこのフローに従います。

$ARGUMENTS がある場合はテーマの希望として扱う（例: /new-world 防災）。

## 標準フロー

**STEP 1｜DB更新**
`node factory/scripts/update-factory-db.mjs` を実行し、DBを実コードと同期する。
エラーが出たら先に解決する。

**STEP 2｜候補出し**
jc-planner エージェントを起動し、出来事候補20〜30 → TOP3 を作らせる。

**STEP 3｜GATE 1（ユーザー選択・必ず停止）**
TOP3をユーザーに提示し、どの出来事にするか選んでもらう。
Factoryがここで勝手に選んではいけない。

**STEP 4｜広域調査**
選ばれた出来事について jc-researcher エージェントを起動し、
関わる仕事を広く調べさせる（`factory/projects/<world-id>/research.md`）。
world-id はケバブケースで命名（例: `disaster-drill`）。

**STEP 5｜職種推奨**
jc-planner エージェントに research.md を渡し、4〜6職種の推奨を作らせる。

**STEP 6｜GATE 2（ユーザー確認・必ず停止）**
職種構成をユーザーに提示し、承認をもらう。

**STEP 7｜以降は原則止めない**
1. jc-researcher で採用職種の深掘り調査（research.md を更新）
2. jc-game-designer で design.md 作成
3. jc-critic で採点。基準未達なら Designer へ差し戻し（自動で最大2回。
   重大なファクト問題だけはユーザーへエスカレーション）
4. jc-art-director で art-manifest.json 作成
5. 実装計画を `factory/projects/<world-id>/implementation-plan.md` に作成
   （content モジュール新規ファイル、registry.ts / data/index.ts への追加行、必要画像一覧）

## v0.1 の安全弁

本番コード（src/）への自動実装はまだ行わない。STEP 7 の成果物は
implementation-plan.md まで。実装はユーザーが計画を確認してから
「実装して」と指示した時に着手する。実装時も:

- 既存の content モジュール・ゲームコンポーネント・共通画面は変更しない
  （registry.ts / data/index.ts への追加行のみ可）
- 実装後は jc-final-qa エージェントで QA を行い、
  `node factory/scripts/update-factory-db.mjs` でDBを更新する
- main へ直接 push しない
