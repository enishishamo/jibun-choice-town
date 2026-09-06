# Blocked Queue — HUMAN_DECISION_REQUIRED task一覧

`factory/rules/autonomous-execution.md`のWIP LIMIT明確化（2026-09-06）に
基づく。ここに載る項目はHuman Decisionが下りるまで、Continuous Product
Loopから自動で再着手しない（重複したindependent reviewを繰り返さない）。
Human Decisionが出たら該当項目を削除し、通常のbacklog/実装フローへ戻す。

## Items

| id | 内容 | blocked理由 | 詳細 | blocked日 |
|---|---|---|---|---|
| q1-improve-lab-check | 臨床検査技師編（lab_check、GQ18→GQ57への改善試行）。AUTO REPAIR 1回を使い切っても独立Codexレビューが2回連続FAIL。残るHIGHは選択肢名自体が症例を読まずとも正解を教えてしまう構造的問題で、cosmeticな修正では直らない。 | ESCALATION条件#9（Repairしてもrelease threshold未達） | `factory/projects/q1-improve-lab-check/redesign-proposals.md` | 2026-09-06 |
| q1-improve-clue-board | 医師編前半（clue_board、GQ31スタート）。AUTO REPAIR 1回でクルー文の答え漏洩は解消したが、repair自体が新しいBLOCKER（2回誤答でも完了扱いになる）を導入し、独立レビューは2回目もFAIL（BLOCKER 1件+HIGH 2件）。残るHIGHはlab_checkと同型（固定単一症例による位置記憶必勝法）。 | ESCALATION条件#9（Repairしてもrelease threshold未達）。lab_checkと合わせ「fixed single-case Q1のMASTERY/REPLAY基準」という構造的パターンの可能性あり——6節参照 | `factory/projects/q1-improve-clue-board/redesign-proposals.md` | 2026-09-06 |

新しい項目を追加する際は同じ表形式に揃える。
