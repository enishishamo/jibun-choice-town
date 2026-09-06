# clue_board 再設計 — 状態記録（2026-09-06、Continuous Product Loop）

Human Decision Required（Autonomous Execution ModeのESCALATION条件 #9:
「RepairしてもV1 release thresholdに届かない」）。**現状: Development
Track上に実装済みだが未release。** AUTO REPAIR RULE（最大1回）を使い切っても
独立Codexレビューが2回連続でFAIL（2回目はBLOCKER）を返したため、
3回目の自力設計はせずここで停止する。

## 1. 発端

`factory/state/audits/audit-summary.md`でclue_board（医師編前半、
救急外来）がGQ31/CA54——「情報の内容を解釈せず有効な項目を5個押すだけで
成功する」content-blindな勝利条件。

## 2. Round 1（実装→独立レビュー）

- 実装: 問診・診察（自由収集、判断不要）はそのまま、バイタル4項目に
  ついて「ふつうの範囲と見比べて気になるものを選ぶ」reviewステップを
  新設。5clue以上・2 tool以上集めてからreview画面へ進み、正しい3項目
  （体温・SpO2・呼吸数）を過不足なく選ばないと完了しない設計。
  gather phase中の`.vital-row.off`色分けは撤去（lab_checkでの反省を反映）。
- 独立レビュー結果（`final-review.result.json`）: **FAIL**、HIGH 3件
  1. gather phaseのクルー文自体に「（高い）」「（低い）」「速い」という
     評価語が入っており、review画面で数字を見比べる前に答えが分かる。
  2. 血圧だけクルーが無く、「クルーが出るかどうか」自体が
     off/normalの目印になっていた。
  3. 症例・並び順が固定で、1回プレイ後は「最初の3項目を選ぶ」という
     位置記憶で攻略できる。

## 3. Round 2（Auto Repair、1回のみ）

- 修正: 全バイタルのクルー文を「ラベル＋数値」のみの中立形式へ統一
  （評価語を削除）、血圧にもクルーを追加（クルー有無の差を解消）。
  review試行を2回までに制限（xray_shootのMISJUDGE_LIMIT前例を踏襲）。
- **ここで導入してしまった新しい欠陥**: 試行上限に達した際、
  正誤を問わず`onComplete()`を呼んでいた——つまり「気になる」を
  何も選ばず2回送信するだけで、正しく読み取った場合と**区別のつかない
  完了**に到達できてしまう。これは旧実装（5個タップで成功）より
  さらに攻略が簡単な、意図しない重大な後退。
- 独立レビュー結果（`repair-review.result.json`）: **FAIL（BLOCKER 1件）**
  - BLOCKER: 「2回誤答してもonComplete()が呼ばれるため、バイタルの
    内容を一切読まず・判断せずに良好な結末へ到達できる」
  - HIGH（未解決のまま残存）: 固定された行順（temp/spo2/rr/bpの並びが
    常に同じ）により「最初の3行を選ぶ」という無読解の必勝手順が
    成立する／収集した問診・診察内容が最終判断に一切影響しない
    （seedsとしては使われるが、review判定のロジックには無関係）。

## 4. なぜここで止めるか

BLOCKERは「2回目の誤答でも完了扱いにする」という私自身のRound2実装ミス
であり、単独では小さな修正で直せる（例: 試行上限到達時はonComplete()を
呼ばず、明確に異なる・弱い結末へ進める——lab_checkのdone-partialと同じ
パターン）。しかし、それを直しても残るHIGH2件（固定順による位置記憶
必勝法、問診/diagnosisが判定に無関係）は、`q1-improve-lab-check`の
Round2で直面したのと**同種の構造的な壁**——単一固定症例のQ1に対し、
Game Critic v3のMASTERY/REPLAY/真の統合判断という基準をcosmeticな
修正だけで満たすことはできない。

`factory/rules/autonomous-execution.md`のAUTO REPAIR RULE（最大1回）を
すでに使い切っている以上、3回目の自力設計はANTI-BUSYWORK RULE違反になる。
ここで停止し、Human Decisionを仰ぐ。

## 5. パターン所見（Humanへの参考情報）

`q1-improve-lab-check`（同日）と本taskは、いずれも:
- Round1実装→独立レビューFAIL（HIGH: 選択肢/クルー文自体が答えを漏らす）
- Round2 repair→評価語除去等で該当HIGHは解消したが、
  「固定単一症例につき、1回プレイ後は記憶で攻略できる」という
  **同一の構造的HIGH**が両taskで再発・残存した。

これは個別のtaskの実装ミスというより、**このFactoryのQ1アーキテクチャ
（1 world = 1固定症例・1固定正解）が、Game Critic v3の求める
MASTERY/REPLAY基準と本質的に緊張関係にある**可能性を示唆する。
既存の`factory/state/audits/audit-summary.md`のWeakest 10には
まだ8件（line_debug, rx_check, timetable, bus_ops, forecast_and_balance,
safety_plan, clue_join, sow_and_grow等）が残っており、同じ壁に
繰り返しぶつかる可能性が高い。次にHumanが決めるとよいこと（6節）。

## 6. Human Decision Needed

1. 本taskのBLOCKER（2回誤答でも完了扱い）だけを先に直して良いか
   （範囲の狭い、明確なbug fixとして——ただし残るHIGH2件は未解決のまま）。
2. 残るHIGH（固定順の位置記憶・問診診察が判定に無関係）まで含めて
   直すなら、Round3の設計方針（症例バリエーション導入／問診結果を
   判定へ組み込む等）をどちらで進めるか。
3. **より上位の問い**: 単一固定症例のQ1群に対し、今後もgame-lab改善を
   1本ずつ試すのか、それとも「fixed-single-case gameのGame Critic
   評価基準（特にMASTERY/REPLAY）自体を見直す」方向を先に検討すべきか
   ——現在2/2のGame Experience改善試行が同じ壁で止まっている。
