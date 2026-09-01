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
