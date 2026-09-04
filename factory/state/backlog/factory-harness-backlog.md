# Factory / Harness 改善 backlog（Track B）

2026-09-04 制定。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| codex-review-malformed-truncation | `factory/harness/codex-review.mjs` の `CODEX_MALFORMED` 分岐が `raw` を固定長でslice（約3000〜4000文字）して保存するため、実際には有効なJSONが返っていても後から `raw` を読んでも復元できないことがある（2026-09-04 のcareer-path fact review r6で発生）。`--output-last-message` の一時ファイルパスをresult jsonにも記録し、完全な生出力を失わないようにする。 | このセッションでの実運用中に発見 | MEDIUM | open |
| fact-review-needs-websearch-path | 62職業のようなfactual datasetに対する「インターネット再検証なしのCodex plausibility review」は非収束になりやすいことを実測（6round実施しても新しい指摘が出続けた）。WebSearch付きAgentによる実地検証を使うworkflowを、都度アドホックに組むのではなく `factory/harness/fact-verify.mjs` のような再利用可能なharnessスクリプトとして整備する（プロンプトに検証対象の具体的claimを渡し、URLと確認日を構造化して受け取る）。 | factory/state/release/current-release.json の human_required 節、および memory: codex-reviewer-calibration.md | LOW | open |
| codex-vision-review-path-caching-bug | スクリーンショットベースのCodex独立レビュー（`*-vision-audit.mjs`系スクリプト）で、同じファイルパスに新しい画像を上書き保存して再実行すると、画像内容が実際に変わっているにもかかわらずCodexの応答が前回と完全に同一文字列で返ってくる現象を確認した（2026-09-04、True Home / Mobile Map Simplificationの検証中）。ファイルパスを毎round変える（例: `mobile-map-shots-v2/`のように連番ディレクトリにコピーしてから渡す）ことで回避できることを確認済み。原因はcodex CLIまたはその配下の何らかのキャッシュ層と推測されるが未特定。今後この系統のスクリプトを書く際は、最初から「screenshotを一時的なユニークパスにコピーしてから渡す」パターンをテンプレート化しておくとよい。 | factory/harness/true-home-map-vision-audit.mjs の実行ログ（round1とround2が同一画像でないのに同一文字列を返した） | MEDIUM | open |
