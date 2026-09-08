# leak-detective — 記録ストリップの視認性（PLUS QUALITY / polish）

- 出所: `factory/projects/leak-detective/impl-review-r4.result.json`（PASS 84、MEDIUM 1件、2026-09-09）
- 指摘: 記録ストリップが 11px・高さ34px（約2行）で、設計（state_table.legibility_rules）の「約56px＋タップで展開」より狭い。流量と音の証拠を見比べにくい。
- 現状の理由: 375×812 でスクロールなし（no-scroll target）を保つため、外れ注記＋反応行が同時に出る状態でも 812/812 に収まる高さに詰めた（impl review r3 の実機計測）。
- 提案: 「記録」見出しをタップで全画面／オーバーレイ展開（44px以上のタップ領域）、閉じた状態は現状維持。展開はタイムライン表示のみで状態を変えない（openRecords は identity のまま＝考え直しゲートを解禁しない）。
- 受け入れ: 375×812 で夜画面 812/812 を維持、展開時に全記録が読める、QA harness に展開要素の source check を追加、レビューは通常の Codex impl review。
- 分類: §3 RELEASE BLOCKER ではない（レビュアー明記）。リリースを止めない。
