# XrayGame 自律改修ループ報告（Bootstrap PoC）

- 日付: 2026-09-02
- Builder/Repairer: Claude（このセッション）
- Independent Reviewer: Codex CLI（`codex exec --sandbox read-only`、ChatGPT 契約 OAuth）
- レビューは全て repo の実コードを Codex が直接読んで実施（Claude の自己評価は渡していない）

## 実行された run（factory/state/runs/ に全ログ）

### run-2026-09-01T21-57-11-s9cr（初回監査→修理）

| iteration | 内容 | 結果 |
| --- | --- | --- |
| 1 review | 改修前 XrayGame を独立監査 | **FAIL score 22**（BLOCKER 4 / HIGH 4）— Claude の一次監査（audit.md）と一致 |
| 1 repair | C=依頼票・撮影タイミングD・撮り直しループ・所見提出・症例ランダム化 | build/lint/factory-data 全 PASS |
| 2 review | 再監査 | **CODEX_TIMEOUT**（reviewer 側停止）→ ループは fail-open せず `reviewer_failure:CODEX_TIMEOUT` で明示停止 |

adapter の子プロセス kill が孫プロセスに届かない不具合を発見・修正（process group kill + hard resolve）。

### run-2026-09-01T22-57-16-xws3（再監査→2回修理→明示停止）

| iteration | 内容 | 結果 |
| --- | --- | --- |
| 1 review | 改修版を再監査 | **FAIL score 54**（誘導文の残存・所見ノートが答えを明言・部位選択が結果なしゲート） |
| 2 repair | 誘導文全廃・誤部位も実撮影→医師差し戻し・所見は目視判定へ | verify PASS |
| 2 review | 再監査 | **FAIL score 58**（所見総当たり可能・失敗に実害なし） |
| 3 repair | X線5回予算制（超過で症例失敗）・誤所見2回で症例失敗・失敗後は新ランダム症例・「どちらもきれい」症例追加 | verify PASS |
| 3 review | 最終監査 | **FAIL score 58** → **max_iterations_reached で明示停止（auto-PASS なし）** |

レビュー後、機械的に正しい2指摘（6回目被ばくの off-by-one・依頼票開封の症例間持ち越し）は追加修正済み（verify PASS）。

## 結果の評価

- ゲームは実質的に改善: score 22 → 58。改修前の「4画面紙芝居」から、
  被ばく予算・タイミング操作・3値ランダム症例・実害のある失敗を持つループになった
- **残 BLOCKER は品質バーの解釈問題**: Codex は「依頼票を読めば正解が書いてある」を
  『説明を読んで正解ボタン』anti-pattern と判定。しかし JIBUN CHOICE の設計思想では
  C（仕事の資料）を読んで適用すること自体が体験の核であり、既存 39 ゲームの大半も
  C_required "partial" で運用されている。この基準の裁定は人間判断が必要
- → §14 の「max loop でも BLOCKER 解消不能」に該当するため **HUMAN_REQUIRED** として停止

## HUMAN_REQUIRED（人間への質問）

Codex reviewer の要求水準（C は開くだけでなく「適用の検証」が必要・資料に答えを
書いてはならない）を JIBUN CHOICE の合格基準として採用するか？

- 採用する場合: 既存ゲームの多く（C_required=partial）も同水準で再監査・改修が必要になる
- 採用しない場合: review-prompt に「C を読めば手順が分かることは減点しない
  （小学生向け設計原則）」の較正を追加して再レビューする

## 3 ステートメント（改修後・Claude 記述）

- **CORE LOOP**: 依頼票を読み、患者の呼吸を読んでシャッターを切り、写りを自分の目で
  良否判定して届けるか撮り直すか決め、最後は左右を見比べて所見を決める。考えどころは
  「いつ押すか」「この写りで足りるか」「モヤはどちらか（無いか）」の3判断
- **MASTERY**: 上手いプレイヤーは X線1回・見立て一発で終える（E 画面に回数が出る）。
  下手だと予算超過や誤所見で症例失敗し、新しい症例からやり直しになる
- **REPLAY**: 症例が3値ランダム（右/左/きれい）なので2回目は違う画像を読むことになる。
  「わざとブレさせて息止めの意味を確かめる」実験も可能
