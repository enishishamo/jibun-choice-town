# Factory / Harness 改善 backlog（Track B）

2026-09-04 制定。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| codex-review-malformed-truncation | `factory/harness/codex-review.mjs` の `CODEX_MALFORMED` 分岐が `raw` を固定長でslice（約3000〜4000文字）して保存するため、実際には有効なJSONが返っていても後から `raw` を読んでも復元できないことがある（2026-09-04 のcareer-path fact review r6で発生）。`--output-last-message` の一時ファイルパスをresult jsonにも記録し、完全な生出力を失わないようにする。 | このセッションでの実運用中に発見 | MEDIUM | **resolved**（2026-09-06、Continuous Product Loop。`raw`を切り詰めずに全文保存し、`raw_output_file`として`--output-last-message`の一時ファイルパス（意図的に未削除）もresult jsonへ追加。OK pathとCODEX_MALFORMED path双方を実際に`codex exec`で発火させて動作確認済み） |
| fact-review-needs-websearch-path | 62職業のようなfactual datasetに対する「インターネット再検証なしのCodex plausibility review」は非収束になりやすいことを実測（6round実施しても新しい指摘が出続けた）。WebSearch付きAgentによる実地検証を使うworkflowを、都度アドホックに組むのではなく `factory/harness/fact-verify.mjs` のような再利用可能なharnessスクリプトとして整備する（プロンプトに検証対象の具体的claimを渡し、URLと確認日を構造化して受け取る）。 | factory/state/release/current-release.json の human_required 節、および memory: codex-reviewer-calibration.md | LOW | open |
| codex-vision-review-path-caching-bug | スクリーンショットベースのCodex独立レビュー（`*-vision-audit.mjs`系スクリプト）で、同じファイルパスに新しい画像を上書き保存して再実行すると、画像内容が実際に変わっているにもかかわらずCodexの応答が前回と完全に同一文字列で返ってくる現象を確認した（2026-09-04、True Home / Mobile Map Simplificationの検証中）。ファイルパスを毎round変える（例: `mobile-map-shots-v2/`のように連番ディレクトリにコピーしてから渡す）ことで回避できることを確認済み。原因はcodex CLIまたはその配下の何らかのキャッシュ層と推測されるが未特定。今後この系統のスクリプトを書く際は、最初から「screenshotを一時的なユニークパスにコピーしてから渡す」パターンをテンプレート化しておくとよい。 | factory/harness/true-home-map-vision-audit.mjs の実行ログ（round1とround2が同一画像でないのに同一文字列を返した） | MEDIUM | open |
| port-flow-yard-bot-flakiness | `factory/harness/flows/port-flow.mjs` が同一コード・同一環境で実行しても間欠的に失敗する（yard game以降が"bot did not complete"で連鎖的に崩れる）。2026-09-04のInteraction Blocker修正（`src/screens/WorldMapScreen.tsx`のpointer capture導入）の影響を疑い、修正適用版と`git stash`で退避した修正前版の両方を複数回実行して比較した結果、**修正の有無に関わらず同程度の頻度（3回中1〜2回）で失敗する**ことを確認——Map側の変更が原因ではなく、yard/crane/tally/dispatchいずれかのbotロジック側の既存のタイミング依存な脆さ（`factory/harness/flows/port-flow.mjs`内の"bot lost (retry available)"というコメント自体が、ある程度想定済みの挙動であることを示唆）。原因究明・安定化は本件のスコープ外として別途起票。 | 2026-09-04 gesture-arbitration-qa実装時の回帰確認（stash比較3往復） | LOW | open |
