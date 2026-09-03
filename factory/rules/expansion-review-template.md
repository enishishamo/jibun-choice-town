# Expansion world review template（v1・combined: 二軸 + Language QA）

各新worldの実装レビューは codex-review.mjs で以下の統合スキーマを要求する
（binding: verdict=PASS かつ blockers/high=0 かつ CA/GQ>=60 かつ
LANGUAGE_AGE_FIT/BUTTON_CLARITY/TEXT_DENSITY>=80）。

```json
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0,
 "career_authenticity_score":0,"game_quality_score":0,
 "language":{"LANGUAGE_AGE_FIT":0,"FURIGANA_SUPPORT":0,"TEXT_DENSITY":0,
  "BUTTON_CLARITY":0,"TECHNICAL_TERM_SUPPORT":0,"VISUAL_LANGUAGE_SUPPORT":0},
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
```

レビュー観点:
- Game Quality v3（factory/rules/game-critic-v2.md 全節・v3体験ゲート含む）
- 較正裁定: C(資料)×今日のデータの導出は採用パターン（C単独確定のみBLOCKER）
- Language: factory/rules/language-style.md §1-§8 準拠
  （選択的ルビ・専門語=語+言い換え+視覚・1文45字・説明2ブロック・ボタン2-6字・
   失敗文の答え漏洩禁止・中学生に幼稚でない・文章なしでも次の操作が推測可能）
- gameplay-references.json に当該worldの全gameTypeのエントリがあること
