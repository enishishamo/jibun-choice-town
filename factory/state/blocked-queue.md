# Blocked Queue — HUMAN_DECISION_REQUIRED task一覧

`factory/rules/autonomous-execution.md`のWIP LIMIT明確化（2026-09-06）に
基づく。ここに載る項目はHuman Decisionが下りるまで、Continuous Product
Loopから自動で再着手しない（重複したindependent reviewを繰り返さない）。
Human Decisionが出たら該当項目を削除し、通常のbacklog/実装フローへ戻す。

## Items

| id | 内容 | blocked理由 | 詳細 | blocked日 |
|---|---|---|---|---|
| q1-improve-lab-check | 臨床検査技師編（lab_check）。2026-09-07 Human Decision（Q1 First-Play Standard V1）によりrepair_countをリセットして新イテレーションとして再着手。パネル現実味・総当たりループの2件は解消し、TEXT_ONLY_CONSEQUENCEはclue_board同型の前例によりPLUS QUALITY backlog（非blocking）と確定。AUTO REPAIR 1回（このイテレーション内）を使い切っても、選択肢のヒントの臨床的specificityが3項目間で非対称（2件が「病気特異的」、distractorだけ「routine/general」に聞こえる）という同一クラスの答え漏れが3回連続で形を変えて再発（round1: name+hint両方が病気特異的vs無関係；round2: nameは揃えたがhintを循環的にしすぎてdistractorだけ臓器名で具体的；round4: name/hint purposeを揃えたがhintのclinical registerが依然非対称）。 | Q1 First-Play Standard V1 §3 BLOCKER項目5（UI/選択肢自体が答えを漏らす）に該当し続け、既定のAuto Repair上限（このイテレーション1回）を超過。ワーディング/ゲームデザインの人間判断が必要 | `factory/projects/q1-improve-lab-check/round4-review.result.json`（最新の独立レビュー）、`factory/projects/q1-improve-lab-check/redesign-proposals.md`（背景） | 2026-09-07 |

新しい項目を追加する際は同じ表形式に揃える。
