# Factory / Harness 改善 backlog（Track B）

2026-09-04 制定。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| codex-review-malformed-truncation | `factory/harness/codex-review.mjs` の `CODEX_MALFORMED` 分岐が `raw` を固定長でslice（約3000〜4000文字）して保存するため、実際には有効なJSONが返っていても後から `raw` を読んでも復元できないことがある（2026-09-04 のcareer-path fact review r6で発生）。`--output-last-message` の一時ファイルパスをresult jsonにも記録し、完全な生出力を失わないようにする。 | このセッションでの実運用中に発見 | MEDIUM | open |
| fact-review-needs-websearch-path | 62職業のようなfactual datasetに対する「インターネット再検証なしのCodex plausibility review」は非収束になりやすいことを実測（6round実施しても新しい指摘が出続けた）。WebSearch付きAgentによる実地検証を使うworkflowを、都度アドホックに組むのではなく `factory/harness/fact-verify.mjs` のような再利用可能なharnessスクリプトとして整備する（プロンプトに検証対象の具体的claimを渡し、URLと確認日を構造化して受け取る）。 | factory/state/release/current-release.json の human_required 節、および memory: codex-reviewer-calibration.md | LOW | open |
