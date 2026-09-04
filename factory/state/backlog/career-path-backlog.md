# Career Path改善 backlog（Track B）

2026-09-04 制定。Stable/Public Validation Track向けのFact QAは
`../career-path/websearch-fact-verification-2026-09-04.md` に記録した
17職業・22論点の実地検証で完了し、PUBLIC BLOCKER=0とした。以下は
Stable公開をブロックしないが、気長に進めるべき残存事項。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| career-path-remaining-45-professions | 62職業のうち今回WebSearchで実地検証したのは17職業（22論点）のみ。残り約45職業は「Codex plausibility review 6roundで一度もHIGH以上のフラグが立たなかった」という状態にとどまり、一次情報での裏取りは未実施。 | `../career-path/websearch-fact-verification-2026-09-04.md` の「残存する低優先度事項」節 | LOW | open |
| career-path-real-professional-profile | Job Revealの「将来：この仕事を選んだ人たち」（Real Professional Profile）はDESIGN_RESERVEDのまま未実装。実装する場合は実在の個人の経歴・価値観・年収等を捏造しないこと（§20）。取材・許諾された実例が必要。 | 2026-09-04ディレクティブ §3・§20 | LOW | design_reserved |
| career-path-annual-refresh | 資格制度・法令は改正されうる（例: 通信制看護師課程の実務経験要件が2026年4月に7年→5年へ変更済み）。career-path-research-merged.jsonの`last_verified`日付を目安に、年1回程度WebSearchで再確認する運用を検討。 | websearch-fact-verification-2026-09-04.md の nurse 論点 | LOW | open |

## 進め方

- 1回のセッションで大量に再検証しない。REAL_USER_FEEDBACKで特定の職業に
  ついて疑問が寄せられた場合はそれを最優先し、それ以外は気長にどれか数職業
  ずつWebSearchで実地検証していく。
- 検証結果は必ず `websearch-fact-verification-2026-09-04.md`（または新しい
  日付のファイル）に「根拠URL・確認日・必須条件と一般的ルートの区別」を
  記録してから `career-path-research-merged.json` を修正する。
