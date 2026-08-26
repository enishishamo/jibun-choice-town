# ゲームデザイン規約（JC GAME DESIGNER / JC CRITIC用）

## Designer の入力と制約

- 入力は **Researcher の調査結果のみ**。勝手に仕事内容を追加しない
- 各職業を A / B / C / D / E へ翻訳する（`factory/rules/principles.md` 参照）
- 出力は `factory/projects/<world-id>/design.md`（実装前の仕様書）

### 必須要件

- 最低1つの能動操作（ドラッグ・調整・選択の連続など。読むだけは不可）
- Cに攻略上の意味がある（Cを見ずに解けたらNG）
- 操作→結果が変化する（固定クリア禁止）
- 必要なら再試行できる
- 最後に Job Reveal（`discoveryEcho`: 「さっきしたこと」→「実際の仕事」の橋渡し）
- interestSeeds（実際にプレイした行為のみ。適職判定禁止）

### メカニクスの重複回避

新しい gameType を設計する前に `factory/database/mechanics.json` を確認し、

- 既存メカニクスの再利用で成立するなら再利用する（registry.ts の設計思想）
- 新規に作るなら既存34種と体験がかぶらないようにする
- 同一イベント内で同じメカニクスを2回使わない

## Critic の採点（100点満点の目安）

| 観点 | 配点 |
| --- | --- |
| 実務一致（Researcherの事実と矛盾しない） | 20 |
| C専門性（その仕事特有の情報・道具か） | 15 |
| D専門性（その仕事特有の判断・操作か） | 15 |
| C→D必然性（Cを使わないと解けないか） | 15 |
| 能動性（読むだけになっていないか） | 10 |
| 操作→結果の反映 | 10 |
| 再試行・発見の余地 | 5 |
| 他ゲームとの差別化 | 5 |
| 小4〜6適合（語彙・操作量・1〜3分） | 5 |

- 80点以上: 通過
- 60〜79点: Designerへ修正指示（自動差し戻しは最大2回）
- BLOCKER検出（principles.md の禁止事項）: 点数に関わらず差し戻し
- 重大なファクト問題のみ人間へエスカレーション

Critic は Designer の成果を **独立して** 評価する。Designer の意図説明を鵜呑みにせず、
「Cを隠してもクリアできるか?」を必ず思考実験すること。

## 二層評価（Layer 1 / Layer 2）

Factory の評価は二層で行う。**DBが `unknown` だから評価不能、としない。**

- **Layer 1（Static Scan）**: `factory/database/` にある機械的事実
  （event / Q1 / job / componentPath / gameType / データ層フィールド /
  discoveryEcho / seeds / FACT CHECK TODO）。スキャナが自動生成する。
- **Layer 2（Semantic Code Review）**: Critic / Final QA が対象ゲームの
  **コンポーネントコード（mechanics.json の `componentPath`）を実際に読んで**判定する:
  - `C_in_component`: コンポーネントUIに出る仕事特有の情報・道具は何か
  - `C_required`: yes / partial / no — Cを見ずにクリアできるか
  - `action_changes_result`: 操作内容が結果（途中経過と**最終E画面の両方**）に反映されるか
  - `retry`: 失敗判定→再試行のループが成立するか
  - `fixed_progression`: 説明→次へだけの固定進行になっていないか
  - `obvious_binary_choice`: 明らかな正解だけの2択になっていないか
  - `evidence`: 判定根拠の file:line を必ず残す

  判定結果は `factory/taxonomy/component-reviews.json` に記録する
  （スキャナが mechanics.json へ結合する）。コードから判定できない項目は
  推測せず理由付きで `unknown` とする。

## メカニクスの正規化

gameType はゲーム固有IDのまま残し、操作パターンとしての分類は
`factory/taxonomy/mechanics-taxonomy.md` の taxonomy に従って
`primaryMechanic` / `secondaryMechanics` / `interactionNotes` を付ける。
偏り検出（「最近ドラッグ割当ばかり」等）はこの正規化IDで行う。
新作ゲームの設計時、Designer は design.md に primaryMechanic を明記し、
既存分布（mechanics.json）との偏りを確認すること。
