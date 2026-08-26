# JIBUN CHOICE Game Factory v0.1

新しいゲーム世界（イベント編）を半自動制作するための基盤。
全体像は [MASTER.md](MASTER.md)、思想は [rules/principles.md](rules/principles.md) を参照。

## クイックスタート

```bash
# DBを実コードと同期（content や registry を変えたら必ず実行）
node factory/scripts/update-factory-db.mjs
```

新しい世界を作るときは Claude Code で:

```
/new-world
```

または「次の世界を作って」と伝える。ユーザーの判断が必要なのは
GATE 1（出来事の選択）と GATE 2（職種構成の承認）の2箇所だけ。

## 次にやること（引き継ぎメモ）

1. **新世界を1本作る**: `/new-world` を実行 → GATE 1 で出来事を選ぶ
   → GATE 2 で職種を承認 → implementation-plan.md まで自動生成される
2. 計画を確認して「実装して」と指示すると src/ への実装に進む
   （既存編は変更しない。registry.ts / data/index.ts への追加行のみ）
3. 実装後は jc-final-qa による QA と DB 再スキャンが走る
4. 画像は art-manifest.json をもとに人間が生成し、
   `public/assets/<theme>/` に配置して manifest の status を更新する

## 制約（v0.1）

- 本番コード（src/）への自動実装は implementation-plan.md 承認後のみ
- 既存6編（給食・猛暑・物価高・イベント・医療・修学旅行）の変更禁止
- `database/*.json` は生成物。手で編集しない
- 画像生成APIは未接続（manifest作成まで）
- main へ直接 push しない

## 初回構築の検証記録

- 猛暑編によるFactoryテスト（A〜E・mechanic・retry の把握精度）: [projects/factory-test-extreme-heat.md](projects/factory-test-extreme-heat.md)
- Critic を猛暑編5ゲームへ実適用した採点（BLOCKER 1件検出）: [projects/factory-test-extreme-heat-critic.md](projects/factory-test-extreme-heat-critic.md)
- Factory v0.1 自己監査: [projects/factory-self-audit-v0.1.md](projects/factory-self-audit-v0.1.md)
