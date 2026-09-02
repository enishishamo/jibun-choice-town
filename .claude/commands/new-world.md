# /new-world — 新しい世界を自律制作する（v2・Harness統合）

Stage 0〜6 で実証した部品による end-to-end production workflow。**default は autonomous**：
HUMAN_REQUIRED（追加課金・APIキー・重大fact不確実・legal/safety・irreversible・max loop でも
BLOCKER 解消不能）以外で停止しない。「どの職業にしますか？」等の通常質問は禁止。

オプション:
- `/new-world --theme="..."` — テーマを指定して開始（選定フェーズをスキップ）
- `/new-world --interactive` — 旧 GATE 1/2（出来事選択・職種承認）で停止する互換モード

## パイプライン（各フェーズの実行部品）

| # | フェーズ | 実行 | 成果物（factory/projects/<world>/） |
| --- | --- | --- | --- |
| 1 | WORLD SELECTION | Claude 起案 → `codex-task` 独立採点 → synthesis | selection.md |
| 2 | EVENT / SOCIAL RESEARCH | `codex-task` 委譲（構造化・出典方針は research-rules.md） | research.md |
| 3 | JOB DISCOVERY | 同上（出来事を成立させる仕事を列挙→バランス選定。数は自律決定） | research.md |
| 4 | CAREER FACT RESEARCH | `codex-task`（C=道具/データ/基準、D=判断を職業ごとに） | research.md |
| 5 | DIFFICULTY EXTRACTION | Claude（job-difficulty-taxonomy.md の id で 2〜4/職） | design.md |
| 6 | MECHANICS MATCHING | job-mechanics-map.json から候補（**mechanic先行禁止**）＋多様性確認 | design.md |
| 7 | GAME DESIGN | Claude（Q1毎に Goal/CoreAction/C/D/制約/失敗/Retry/Mastery/Replay/Variation/Result + 4 statements） | design.md |
| 8 | GAME CRITIC + CAREER CRITIC | `loop.mjs` + design 用二軸レビュー prompt（--require-axes） | critic レビュー(runs/) |
| 9 | ART NEED DETECTION | `art/art-need-detector.mjs`（reuse優先・OPTIONAL生成禁止） | art-requests/ |
| 10 | ART GENERATION / QA | `art/art-loop.mjs run / run-pair`（直列・regen≤3・pair整合） | manifest-v2 反映 |
| 11 | IMPLEMENTATION | Claude（純ロジック `<x>Logic.ts` 分離・registry 登録・既存アーキ尊重） | src/ |
| 12 | BUILD / STATIC QA | `verify.mjs`（build/lint/factory-data）+ `art/art-link-qa.mjs` | verify ログ |
| 13 | AUTOMATED GAMEPLAY QA | Q1毎の `gameplay-qa-<world>.mjs`（no-action/spam/all-select/ignore-C/最短/edge/乱数/optimal） | harness/ |
| 14 | BROWSER QA | Browser pane（mobile 375px + desktop、entry→map→Q1→failure→retry→success→JobReveal→wrapUp、console/networkエラー確認） | スクリーンショット記録 |
| 15 | CODEX ADVERSARIAL REVIEW | `loop.mjs review --require-axes`（二軸・BLOCKER/HIGH=0 まで repair、max_iterations で明示停止） | runs/ |
| 16 | DATABASE / MANIFEST | `update-factory-db.mjs` + component-reviews.json（新hash）+ validate | database/ |
| 17 | COMMIT | meaningful commit（remote push 禁止） | git |

進行状態は `factory/projects/<world>/pipeline.json`（フェーズ毎の status/evidence）へ記録する。

## 品質ゲート（必須）

- 各 Q1: `C_required=true` / `C_alone_determines_answer=false` / `player_judgment_required=true` / `action_changes_result=true`
- 4 statements（CORE LOOP / MASTERY / REPLAY / NOVICE VS EXPERT）が意味のある内容で書けること
- 二軸（CAREER_AUTHENTICITY × GAME_QUALITY）両方 PASS・BLOCKER/HIGH = 0
- world 内 mechanics 多様性（primary challenge mechanic の重複は最大2）
- Art: reuse 優先・Style Contract 準拠・Before/After は同一建物/カメラ
- コスト: subscription_included_confirmed のみ。provider status 変化時は再probe、unknown は停止

## 検証境界（§18）

Factory の PASS は **AI_VERIFIED** であり、実際の子どもの熱中は
**REAL_CHILD_VALIDATION_PENDING**。観察結果は
`factory/state/validation/child-observations.jsonl`（schema:
`child-observation-schema.json`）に蓄積し、`/game-lab improve <gameType>` の
入力として戻す。
