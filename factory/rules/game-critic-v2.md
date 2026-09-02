# Game Critic v2 — 評価規約（2026-09-02）

Bootstrap（XrayGame ループ）の較正裁定を反映した Critic の正本。
旧 Critic 規約（qa-rules.md 内の game 評価部分）より本書が優先する。
reviewer は必ず `factory/harness/design-principles.md` の較正ルールも読むこと。

## 必須評価項目

| 項目 | 問い |
| --- | --- |
| is_actually_a_game | 判断・操作・結果の連鎖があるか（紙芝居・クイズではないか） |
| meaningful_choice | 選択肢が結果を分けるか。見せかけ選択・明白な2択はないか |
| failure | 意味のある失敗が成立するか。失敗に実害（コスト・差し戻し・症例失敗等）があるか |
| feedback | 行動の結果が理解可能な形で返るか |
| skill_expression | プレイヤーの理解・観察・予測が結果に反映されるか |
| mastery | 上手さの余地。何が上達するのか |
| replay | 2回目に違う体験・違う戦略があるか |
| variation | 条件・症例・配置等のバリエーションがあるか |
| constraint | 資源・時間・品質等の制約が実在するか |
| action_result_causality | 操作→結果の因果がコードで実装されているか（文言分岐だけでないか） |
| C_required | C（仕事固有の情報・道具・データ）を使わずに突破できないか |
| C_alone_determines_answer | C を読むだけで答えが一意に決まらないか（決まるなら問題） |
| player_judgment_required | C の適用にプレイヤー自身の判断・観察・操作が必要か |
| exploitability | 総当たり・連打・全選択・記憶で突破できないか |
| fixed_progression | 進行が一本道でないか |
| spam_success | 連打で成功しないか |
| all_select_success | 全部選べば成功しないか |

## 必須ステートメント（意味のある内容で書けなければ PASS 不可）

1. **CORE LOOP STATEMENT** — プレイヤーは何を繰り返し、どこが考えどころ／面白さか
2. **MASTERY STATEMENT** — 初回プレイヤーと上手いプレイヤーでは何が違うか
3. **REPLAY STATEMENT** — 2回目には何を違って試せるか
4. **NOVICE VS EXPERT DIFFERENCE** — 上手いプレイヤーは何を理解／予測／操作できるか

## 二軸 QUALITY GATE（完成判定）

- **CAREER_AUTHENTICITY** — 本当にこの仕事固有の判断・制約を体験しているか。
  仕事のリアリティを「操作可能な rule」へ正しく翻訳しているか
- **GAME_QUALITY** — 本当にゲームとして成立しているか（上記項目）

**両方 PASS が必要。片方だけ PASS で完成扱い禁止。**

## 較正（reviewer が守ること）

- C_required = true は望ましい設計。「資料に必要情報が書いてある」だけでは減点しない
- BLOCKER にするのは: C を読んだ後にプレイヤーの判断・観察・タイミング・比較が
  何も残らない場合（C_alone_determines_answer = true）
- 対象は小学生。文章量・選択肢数・操作の複雑さの少なさは減点対象にしない。
  判断の不在だけを減点する
- score の目安: 75+ = 完成候補 / 60-74 = 改善余地 / 60未満 = 要改修 / BLOCKER あり = PASS 不可

---

# Game Quality v3 — Gameplay Experience / Game Reference Gate（2026-09-02追加・BINDING）

ロジックが C_required / failure / retry を満たしても、体験が
「行動 → 説明文カード → やり直し」なら教材であってゲームではない。以下を必須軸に追加する。

## WORLD_FEEDBACK_QUALITY（必須）
結果を文章で説明せず、世界の変化で見せる（SHOW, DON'T EXPLAIN）。
map movement / state transition / meter movement / object movement / character reaction /
CSS・SVG・React state animation / simple simulation を優先。動画ファイルは不要。
中心となる因果関係が視覚的に理解できない場合は減点、文章のみなら原則FAIL。

## TEXT_ONLY_CONSEQUENCE（検出器）
「PLAYER ACTION → 文章カード『○○になりました』→ retry」構造の検出。
主要な結果が文章だけなら原則 HIGH。true のゲームは原則 GAME_QUALITY PASS 禁止。

## HINT_LEAKAGE（検出器）
失敗後にゲーム自身が「○○（特定のC）を見てみよう」と次に見るべき情報を毎回直接教える構造の検出。
CはUI上に存在してよいが、突破口までは教えない。対象年齢上必要なら段階的hint：
失敗1回目 = visual consequence のみ → 2回目 = 「見落としている情報があるかも」→ それ以上で specific hint。
最初から答えを教えない。

## VISUAL_GAMEPLAY_LEGIBILITY（OBSERVER TEST・必須）
画面を横から見ている人が文章を読まずに「今なにをしているか／何が失敗したか／何が変わったか」を
ある程度理解できるか。主要gameplayで <70 なら repair。

## GAMEPLAY_REFERENCE（必須・記録: factory/taxonomy/gameplay-references.json）
各Q1に {reference_games, borrowed_design_principles, transformed_for_job, why_it_is_fun,
what_requires_skill, why_replay} を記録。reference_games=[] のまま完成扱い禁止。
ただし skin copy（○○っぽい見た目）は禁止：抽出するのは core loop / tension /
information pressure / resource tradeoff / timing / uncertainty / feedback / escalation /
mastery / replay structure であり、それを JOB-SPECIFIC DIFFICULTY へ翻訳する。

## GAME DESIGN TRACEABILITY（必須）
JOB-SPECIFIC DIFFICULTY → REFERENCE GAME PRINCIPLE → MECHANIC → IMPLEMENTED PLAYER ACTION
→ WORLD FEEDBACK → MASTERY を追跡可能にする（researchしたのに実装に使われない、を防ぐ）。

## GAME-LIKENESS ADVERSARIAL QUESTION（Criticが必ず問う）
「職業・教育内容をすべて取り除いても、このinteraction loop自体にゲームとしての
面白さ／上達余地が残るか？」 NO なら原則 GAME_QUALITY PASS 禁止
（職業内容とmechanicが不可分の場合はその理由を明示すること）。

## FAILURE PATTERNS（factory learning・再発防止）
- "Logic satisfies C_required/failure/retry, but experience becomes
  action → explanatory text → retry (educational software, not a game)."
- "Game Design Lab exists, but the final implementation does not visibly inherit
  a proven game-design principle."

---

# ゲート定義の正本（2026-09-03 明文化 — §16監査への応答）

- **バインディングゲートは「実装に対する二軸 adversarial レビュー」**（PASS かつ BLOCKER/HIGH=0）。
  設計段階の critic は「BLOCKERを設計/コードへ機械的に吸収するまで回す」義務を持つ助言ゲート
  であり、design レビューの最終 verdict が FAIL のまま实装へ進む場合は、
  (a) 各 BLOCKER/HIGH への機械的対応（コード＋QA sims）または較正裁定の根拠を design.md に記録し、
  (b) その全てが実装レビューの検査対象に含まれること。
  これは fail-open ではない：品質の最終判定は常に実装レビューが行い、そこで BLOCKER/HIGH が
  1件でも残れば世界は完成にならない。
- **オーケストレータは Claude Code セッションそのもの**（.claude/commands/new-world.md は
  その実行手順書）。機械が強制するのは各ゲート（loop.mjs / art-qa / gameplay-qa / verify）で、
  工程間の接続は Claude が行う。これは設計であり隠れた手作業ではない——ただし工程の実施証跡は
  pipeline.json / runs/ / routing-log.jsonl に残すこと。
- **人間介入の定義**: 世界コンテンツへの人間の手直し・選択は human_intervention としてカウント。
  品質バーそのものの較正裁定（例:「C単独確定のみ問題」）や工場レベルのゲート追加はファクトリー
  仕様の変更であり、世界の human_interventions には数えないが、最終レポートで開示する。

## 閾値の正本
- 各軸 60 = loop.mjs が機械強制する二軸の最低床（これ未満は即FAIL）
- 75+ = 完成候補の目安（rubric）
- **完成の必要十分条件は「二軸PASS かつ BLOCKER=0 かつ HIGH=0」**（点数だけでは完成にならない）
