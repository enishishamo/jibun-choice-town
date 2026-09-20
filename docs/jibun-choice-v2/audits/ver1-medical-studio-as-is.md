# Ver.1 医療編・ゲームスタジオ編 AS-IS 監査（要約）— 2026-09-20

全文（17 項目×全ゲームの比較表）は 2026-09-20 のセッションで報告済み。ここには Ver.2 設計に
必要な構造的事実のみを残す。参照コミット: `78ada73`。

## 医療編（`er-patient`、1 人の患者を 9 章で追う）

| ID | gameType / component | 失敗の扱い | retry | ランダム性 | InfoCards |
|---|---|---|---|---|---|
| med-doctor | `clue_board` / ClueBoardGame | review 誤答 2 回で done-partial → `onPartialComplete` | review 内 1 回のみ | 表示順のみ | 不使用 |
| med-lab | `lab_check` / LabCheckGame | 失敗なし（3 検査を全部タップするだけ） | — | なし | 不使用 |
| med-radio | `xray_shoot` / XrayGame | 誤配達 3 回で内部 failed → 新患者で restart（partial には到達しない） | あり（とりなおす／新患者） | **内容ランダム**（体格・位置・かすみ） | 使用（依頼票、開封必須） |
| med-diagnose | `clue_join` / DiagnoseGame | 誤答 2 回で partial。partial 画面に「もう一度考える」あり | あり | 表示順のみ | 不使用 |
| med-pharm | `rx_check` / RxCheckGame | 懸念 誤答 1 回まで、対応 誤答 0 回で done-partial | なし | なし | 独自 doc-stack（4 枚開封必須） |
| med-nurse | `observe_care` / NurseObserveGame | 不一致は reflecting（非機能）→ partial | なし | **内容ランダム**（3 項目独立） | 不使用（7 カード開封必須） |
| med-diet | `meal_fit` / MealFitGame | 失敗なし（成立まで調整） | — | なし | 使用（任意） |
| med-pt | `move_try` / MoveTryGame | 失敗なし（誤答は note のみ） | — | なし | 使用（任意） |
| med-msw | `life_plan` / LifePlanGame | 失敗なし（plan⇄react 往復） | — | なし | 不使用（困りごと 6 件開封必須） |

- 9 ゲーム / 8 職業（医師が 2 回）/ スコア 0 / `onPartialComplete` を呼ぶのは 4（doctor・diagnose・pharm・nurse）
- **`event.chapters`（前半 ch1-5 / 後半 ch6-9 のタブ）は全コンテンツ中この編のみ**。`incidents[].requires` による厳密な順序ロック
- コンポーネント内の他 incident 参照（`hasCompleted`）はなし
- `PATIENT` 定数は `medical.ts` に export されているが未使用
- seeds は全 9 ゲーム 5 択で `"特にない"`（漢字）
- ファイル冒頭に「TODO: 要ファクトチェック」（検査値・薬・退院支援は学習用簡略モデル）

## ゲームスタジオ編（`game-studio`、発売まであと 3 日）

| ID | gameType / component | 失敗の扱い | ランダム性 |
|---|---|---|---|
| studio-repro | `bug_repro` / BugReproGame | 誤票 2 回で failed → 新規ランダム不具合で restart | 条件ペア抽選 |
| studio-tune | `difficulty_tune` / DifficultyTuneGame | 誤答 2 回で failed → 新規ログで restart | 原因・クリア率抽選 |
| studio-ui | `ui_clarity` / UiClarityGame | 誤答 2 回で failed → 新規報告セットで restart | 報告 3/5 抽選 |

- 3 ゲーム / 3 職業 / スコア 0 / 3 本とも `onPartialComplete` 不使用（必ず成功で終わる）
- 3 本の判定ロジックが `studioLogic.ts` 1 ファイルに集約
- `mission.deadline` が 3 本に設定されているが `Q1Screen` は描画しない（未表示フィールド）
- 職業画像は静的ファイルではなく `hero()` が生成するインライン SVG data URI
- seeds は 3 択のみで opt-out 選択肢なし
- ch1→ch2→ch3 の一直線 `requires`。`chapters` は不使用
