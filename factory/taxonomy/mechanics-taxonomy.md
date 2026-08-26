# 操作パターン taxonomy v1

mechanics DB を「ゲーム固有名」ではなく再利用可能な操作パターンで正規化するための分類。
目的は**体験の偏り検出**（「最近ドラッグ割当ばかり」「分析系が少ない」等）。
gameType（例: `place_and_test`）はゲーム固有IDとしてそのまま残し、
各ゲームに `primaryMechanic`（1つ）と `secondaryMechanics`（0〜2つ）を付ける。

分類は `component-reviews.json` に記録し、スキャナが `database/mechanics.json` へ結合する。
**分類は必ずコンポーネントコードを読んで行い、根拠 file:line を残す**（推測禁止）。

## カテゴリ定義（16種）

| id | 定義 |
| --- | --- |
| drag_drop_assign | アイテムをスロット・領域へドラッグ（タップ代替含む）で割り当てる |
| tap_select | タップで選択・切替する（多肢選択、ON/OFF） |
| parameter_adjust | スライダー・段階トグル等で連続量・段階量を調整する |
| spatial_placement | 2D空間への配置で、**位置そのもの**が評価対象になる |
| sequencing | 順番・工程・時間割を並べる（順序が評価対象） |
| resource_allocation | 限られた資源（予算・供給力・水・手間）の配分を決める |
| measurement_inspection | 測る・検査する・帳票を照合する |
| document_check | 資料・帳票を**開いて確認する行為自体**が攻略要素になる |
| data_layer_compare | データやレイヤーを重ねて比較し、原因・差を探す |
| simulation_run | 時間を進める・テスト実行して結果を観察する |
| search_discovery | 自分で調べる対象を選び、手がかりを発見する |
| matching | 条件と対象を突き合わせる・正しい組を作る |
| trial_and_error_experiment | 試行→失敗理由→再試行のループ自体が主役 |
| composition_design | 複数要素を組み合わせて1つの企画・計画・設計を作る |
| prioritization | 優先順位づけ・トレードオフの判断が主役 |
| conversation_observation | 会話・聞き取り・観察 |

## 運用ルール

- primaryMechanic は「そのゲームの攻略の中心」を1つだけ選ぶ。
  操作手段（ドラッグ等）と攻略の意味（順序・配置・配分）が分かれる場合は**意味**を優先する
  （例: タイムラインへのドラッグ割当 → primary は sequencing、secondary に drag_drop_assign）
- 新カテゴリの追加は、既存16種のどれにも収まらないと根拠つきで示せた場合のみ。
  このファイルと component-reviews.json を同時に更新する
- 偏り検出は `mechanics.json` の primaryMechanic 分布と、
  `events.json` の `mechanicCategories` で行う。新イベント設計時、
  Planner / Designer は直近イベントと primary が3つ以上かぶらないことを目安にする
