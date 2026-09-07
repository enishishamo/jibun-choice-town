# Blocked Queue — HUMAN_DECISION_REQUIRED task一覧

`factory/rules/autonomous-execution.md`のWIP LIMIT明確化（2026-09-06）に
基づく。ここに載る項目はHuman Decisionが下りるまで、Continuous Product
Loopから自動で再着手しない（重複したindependent reviewを繰り返さない）。
Human Decisionが出たら該当項目を削除し、通常のbacklog/実装フローへ戻す。

## Items

| id | 内容 | blocked理由 | 詳細 | blocked日 |
|---|---|---|---|---|
| q1-improve-lab-check | 臨床検査技師編（lab_check）。2026-09-07 Human Decision（Q1 First-Play Standard V1）によりrepair_countをリセットして新イテレーションとして再着手。パネル現実味・総当たりループの2件は解消し、TEXT_ONLY_CONSEQUENCEはclue_board同型の前例によりPLUS QUALITY backlog（非blocking）と確定。AUTO REPAIR 1回（このイテレーション内）を使い切っても、選択肢のヒントの臨床的specificityが3項目間で非対称（2件が「病気特異的」、distractorだけ「routine/general」に聞こえる）という同一クラスの答え漏れが3回連続で形を変えて再発（round1: name+hint両方が病気特異的vs無関係；round2: nameは揃えたがhintを循環的にしすぎてdistractorだけ臓器名で具体的；round4: name/hint purposeを揃えたがhintのclinical registerが依然非対称）。 | Q1 First-Play Standard V1 §3 BLOCKER項目5（UI/選択肢自体が答えを漏らす）に該当し続け、既定のAuto Repair上限（このイテレーション1回）を超過。ワーディング/ゲームデザインの人間判断が必要 | `factory/projects/q1-improve-lab-check/round4-review.result.json`（最新の独立レビュー）、`factory/projects/q1-improve-lab-check/redesign-proposals.md`（背景） | 2026-09-07 |

| q1-improve-line-debug | 工場ライン編（line_debug、物価高編「アイスが高くなってる！」④工場）。監査GQ39/CA57（赤い詰まり表示が答えを漏らし、調整内容に関係なく同じ結果になる）の改善。AUTO REPAIR 1回で赤いハイライト・select-all必勝・診断総当たり・固定停止位置・単一loss列だけでの特定の5点は解消。round2独立レビューはBLOCKER 0件まで到達したが、HIGH 2件が残存: (1) 画面上部のtask-bar集計値が診断前から正解工程（s5）自身の数値をそのまま表示しており、開いた工程とヘッダーの数値を照合するだけで特定できてしまう（stop/queueも単一列で一意）。(2) より根本的に、3つの調整候補（ガイド／速度／切替え）のどれが正しいかを示す観測データがゲーム内に一切なく、「guide」が正解というのはデータに基づく判断ではなく無根拠な固定値になっている。(1)は機械的な修正（ヘッダーをライン全体の集計値へ作り直す）で直せるが、(2)は3候補を区別できる新しい観測情報を発明する必要があり、ゲームデザイン判断が要る。 | Q1 First-Play Standard V1 Gate C/D/E（C不要・D非依存の疑い）に該当し続け、既定のAuto Repair上限（1回）を超過。観測データ設計の人間判断が必要 | `factory/projects/q1-improve-line-debug/round2-review.result.json`（最新の独立レビュー）、`review.result.json`（round1） | 2026-09-07 |

| q1-improve-timetable | イベント編（timetable、イベント編「なんかイベントをやることになった！」進行づくり）。監査GQ43/CA67（全演目を選択しても終演時刻に収まり、取捨選択・転換最適化が不要）の改善。AUTO REPAIR 1回で「全演目を足しても必ず溢れる」「開始状態を『既にオーバー』にしてmission文と整合」「初回オーバー時に戦略を即答しない段階的ヒント」の3点は解消。round2独立レビューはBLOCKER 0件まで到達したが、HIGH 1件が残存: 初期並び（未変更）から任意の1演目を×で消すだけで、転換ルールを読まず・並び替えず・ステージ作りの分類を理解せずに、必ず時間内に収まってしまう（5候補のどれを消しても成立）。Q1 First-Play Standard V1のBLOCKERリスト「C不要で攻略可能」に直接該当。演目5つ・作り2種類という少ない要素数の中で「全演目だと必ず溢れる」と「任意の1つを消すだけでは絶対に収まらない」を両立させる再調整、または並び替えを強制する構造変更が必要——いずれもゲームデザイン判断。 | Q1 First-Play Standard V1 §3 BLOCKER項目（C不要で攻略可能）に該当し続け、既定のAuto Repair上限（1回）を超過。数値バランス/構造のゲームデザイン人間判断が必要 | `factory/projects/q1-improve-timetable/round2-review.result.json`（最新の独立レビュー）、`review.result.json`（round1） | 2026-09-07 |

新しい項目を追加する際は同じ表形式に揃える。
