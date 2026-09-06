# lab_check 再設計 — 状態記録（2026-09-06、Continuous Product Loop）

Human Decision Required（Autonomous Execution Modeのescalation条件 #9:
「RepairしてもV1 release thresholdに届かない」）。**現状: Development
Track上に実装済みだが未release。** `factory/rules/autonomous-execution.md`
のAUTO REPAIR RULE（最大1回）を使い切っても独立Codexレビューが2回連続で
FAILを返したため、3回目の自力設計はせずここで停止する。

## 1. 発端

`factory/state/audits/q1-audit.json`（2026-09-01、独立Codex監査）で
lab_checkが全ポートフォリオ中GQ最下位（GQ18/CA41）と判定。
「検査を全選択すれば必ず成功する」select-all exploit、C（検査データ）を
実質使わなくても攻略できる状態だった。

## 2. Round 1（実装→独立レビュー）

- 実装: 検体を1本に限定し、3検査中2つしか選べない制約を導入
  （`src/q1/labCheckLogic.ts`, `LabCheckGame.tsx`）。関連する2検査
  （白血球・CRP）を選べば成功、無関係な1検査（当初はヘモグロビン）を
  混ぜると医師から「まだ分からない」と言われ、無制限に選び直せる設計。
- 独立レビュー結果（`final-review.result.json`）: **FAIL**、HIGH 2件
  1. 無制限retryにより、組み合わせが3通りしかないため症例を読まず
     総当たりすれば必ず成功する（select-all exploitの縮小版）。
  2. 白血球とヘモグロビンは実務上ほぼ同じ血算パネルで同時に得られる
     検査であり、「限られた検体を奪い合う別々の検査」という設定は
     医学的に不正確。

## 3. Round 2（Auto Repair、1回のみ）

- 修正: ヘモグロビンを腎機能（クレアチニン）へ差し替え（実務上も別の
  独立した検査、感染・炎症の判断には使わない、という設定は正確）。
  無制限retryを廃止し、外した場合は「情報不足のまま結果を送った」という
  別の結末（`done-partial`）へ進む一本勝負に変更（進行はブロックしない）。
- 独立レビュー結果（`repair-review.result.json`）: **FAIL**（再FAIL）、
  スコアは改善（45→57、CA 55→72）したが、HIGH 2件が新たに残った
  1. **選択肢の名前・説明文自体が答えを漏らしている。**
     「ばい菌とたたかう係」「炎症のしるし」は感染症例向けであることを
     テキストがそのまま示しており、「腎臓」だけが明白な仲間外れになる
     ——症状（発熱・せき・息苦しさ）を一切覚えていなくても、選択肢の
     名前だけで正解ペアが分かってしまう。文脈（C）が実質不要なまま。
  2. 症例・数値が固定で、再プレイ時の熟達差や別戦略の余地がなく、
     失敗結果も主にテキストで、視覚的な世界の変化に乏しい
     （rubric v3のMASTERY/REPLAY/TEXT_ONLY_CONSEQUENCE基準）。

## 4. なぜここで止めるか

HIGH #1は表面的なコピー修正では直せない——医学的に正確で子どもにも
分かりやすい検査名（「白血球」「炎症」等）を使う限り、その名前自体が
用途を説明してしまうという構造的な緊張がある。本当に解決するには:

- 症例を複数用意し、同じ検査名パターンが状況によって正解にも不要にも
  なるようにする（固定ペア暗記を無効化）——設計・実装コストが大きい、または
- 選択の軸を「検査名を選ぶ」以外へ根本的に変える——architecture-levelの
  再設計になる

いずれも「軽微なrepair」の範囲を超え、`factory/rules/autonomous-
execution.md`のANTI-BUSYWORK RULE（「点数を95→96にするためだけの
repairをしない」）とAUTO REPAIR RULE（最大1回）の両方に照らして、
3回目の自力設計をここで打ち切るのが正しい判断と考える。

## 5. 現在の状態

- **Development Track（`feature/harness-bootstrap`）にのみ実装済み。
  Stableへは未反映。**
- 副次的に見つかった軽微な不整合（`src/q1/registry.ts`の
  lab_checkコメントが「疑わしい値を測り直す」のままだった——実装方針
  （再検査判断は扱わない）と矛盾）は、独立した安全な修正として反映済み。
- 旧実装（select-all可能・GQ18）と現在のDevelopment実装（select-all
  不可・医学的により正確・GQ57）のどちらもrelease gate未達である以上、
  **どちらを実ユーザーへ見せるかはHuman判断が必要。** 個人の見解としては
  現行のDevelopment版の方が「露骨なexploit」も「医学的誤り」もない分
  現状維持よりは安全だが、これはHumanのProduct Tasteの範囲の判断。

## 6. Human Decision Needed

1. 現在のDevelopment実装（Round 2、GQ57・FAIL）を、両HIGHが残ったまま
   一旦Stableへ出すか、それとも現状のまま（旧実装のまま）待つか。
2. 出す場合、Round 3の設計方針（症例バリエーション追加 vs. 選択軸の
   根本再設計）についてどちらを優先すべきか、あるいは優先度を下げて
   他のworldへ回すか。
