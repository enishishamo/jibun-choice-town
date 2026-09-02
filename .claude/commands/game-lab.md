# /game-lab — Game Design Lab の運用コマンド

Stage 1〜4 で実証したパイプラインの入口。実体は `factory/harness/game-lab.mjs`。
思想の正本: `factory/harness/design-principles.md` / 評価規約: `factory/rules/game-critic-v2.md`

## サブコマンド

### /game-lab research
既存ゲームの構造分解研究を追加する。

```
node factory/harness/game-lab.mjs research "Title (one-line angle)" [...]
```

1. Codex に構造分解を委譲（goal / core_action / information / constraints / decisions /
   feedback / failure / retry_motivation / mastery / variation / progression / reward /
   reusable_mechanics + CORE LOOP / MASTERY / REPLAY statements）
2. **Claude が検収**して `factory/lab/research/games.json` へマージ
3. mechanics 正規化（mechanics-library.json への mapping + 新機構候補の審査）
4. `factory/taxonomy/mechanics-library.json` / `job-mechanics-map.json` を更新
5. Codex 独立レビュー（stage2-review-prompt.md 参照）

### /game-lab audit-all
全登録 Q1 を critic v2 で再監査する（5ゲーム×バッチ、4バッチ並行）。

```
node factory/harness/game-lab.mjs audit-all
```

結果: `factory/state/audits/q1-audit.json` + `audit-summary.md`（ランキング・ヒートマップ・修理キュー）

### /game-lab improve <gameType>
弱いゲーム1本の改善プロジェクトを立ち上げる。

```
node factory/harness/game-lab.mjs improve <gameType>
```

scaffold 後のワークフロー（XrayGame Stage 4 で実証済みの手順）:

1. `redesign-proposals.md` を埋める: job reality → difficulties（taxonomy id）→
   mechanic 候補（map から。**mechanic 先行は禁止**）→ 設計案 2〜4
2. 提案比較: Claude 評価 + Codex 独立審査（codex-task）→ synthesis で決定
3. 実装: ルールを純ロジック（`src/q1/<x>Logic.ts`）へ分離
4. 自動 gameplay QA: 連打 / C無視 / 全選択 / 常時最大 / 最短 / エッジ / 乱数横断
5. `verify.mjs`（build/lint/factory-data）+ ブラウザ実機スモーク（モバイル）
6. loop.mjs で Codex 二軸 adversarial レビュー → repair → PASS
7. `component-reviews.json` 更新（新ハッシュ）+ `update-factory-db.mjs`

### /game-lab status
Stage 進捗と直近 run の一覧。

## ルール

- 従量課金 API 禁止（Codex は ChatGPT 契約の CLI のみ）・remote push 禁止
- Reviewer independence: Claude が作った物は Codex がレビューする（自己レビュー禁止）
- BLOCKER / HIGH が残る PASS は harness が機械的に拒否
- 完成判定は二軸（CAREER_AUTHENTICITY × GAME_QUALITY）両方 PASS
