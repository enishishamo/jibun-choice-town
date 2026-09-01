# JIBUN CHOICE Harness — Design Principles（Stage Manager 保存版）

今後の全 Stage が従う設計原則。Stage Manager と各レビュー prompt はここを参照する。

## ゲーム構造の正本

```
A → B → C ⇄ D → E
```

- **A**: 場所・出来事
- **B**: 困りごと／達成したいこと
- **C**: その仕事特有の情報・道具・データ・制約
- **D**: C を使った判断・操作・試行錯誤
- **E**: 結果として起きる社会の変化

重要条件（必須・2026-09-02 ユーザー裁定で較正済み）:

- `C_required = true` — C を見ずに突破できてはならない
- `C_alone_determines_answer = false` — C を読んだだけで答えが一意に決まってはならない
- `player_judgment_required = true` — C を「適用する」プレイヤー自身の判断・操作が残ること
- `action_changes_result = true` — 操作によって結果が変わらなければならない

**較正ルール（reviewer 必読）**: 「C に必要情報が書いてある」こと自体は BLOCKER にしない。
区別せよ — (A) C が必要である（JIBUN CHOICE では望ましい）／(B) C を読めば答えが一意に
決まりプレイヤー自身の判断が残らない（これのみ game quality の問題）。
小学生向けであることを理由に game quality の基準は下げない。ただし認知負荷・文章量・
UI complexity は対象年齢に合わせる（simple ≠ shallow）。

## 禁止 anti-pattern

- 明白な2択
- 固定進行
- 連打で成功
- 全部選べば成功
- C を見なくても成功
- 説明を読んで正解ボタン
- 見せかけだけの選択

## Game Quality の3ステートメント（監査必須）

チェックリストだけで PASS させない。以下3つを意味のある内容で記述できない場合、Game Quality は PASS 不可:

1. **CORE LOOP STATEMENT** — プレイヤーは何を繰り返し、その繰り返しのどこが考えどころ／面白さなのか
2. **MASTERY STATEMENT** — 初回プレイヤーと上手いプレイヤーでは何が違うのか
3. **REPLAY STATEMENT** — 2回目には何を違って試せるのか

## 二軸 QA（完成判定）

両方 PASS して初めて完成候補:

- **CAREER_AUTHENTICITY** — これは本当にこの仕事の体験か？
- **GAME_QUALITY** — これは本当にゲームとして成立しているか？

## Reviewer 独立性

- Claude = Builder / Repairer、Codex = Independent Reviewer
- Codex には Claude の自己評価を渡さない。artifact・rules・実コードを直接読ませる
- BLOCKER / HIGH が残っている場合は原則 PASS 不可（harness が機械的に enforce）
- Reviewer が停止しても Harness 全体は停止しない（reviewer_failure として明示停止 → HUMAN_REQUIRED）

## コスト・安全（ABSOLUTE）

- 従量課金 API（OpenAI / Anthropic / その他）禁止。API キーの要求・設定・探索禁止
- Claude Code Max と ChatGPT/Codex の月額契約内のみ。追加課金が必要なら実行せず HUMAN_REQUIRED
- paid provider への自動 fallback 禁止
- remote push 禁止 / irreversible 削除禁止 / 既存変更を勝手に消さない

## Art 優先順位（Stage 6 で接続）

1. existing asset reuse → 2. CSS → 3. SVG → 4. composition → 5. new raster generation

`paid_api.enabled = false`。追加課金なしの公式経路が本当に使える場合のみ登録。
無ければ `ART_GENERATION_HUMAN_BOUNDARY` で停止（OpenAI Image API 等への勝手な fallback 禁止）。

## HUMAN GATE（これ以外は自律判断）

- 追加課金 / API キー
- 重大な fact uncertainty
- legal / safety issue
- irreversible operation / major destructive change
- max loop でも BLOCKER 解消不能

## Game Design Lab（Stage 1〜 で追加）

Game Researcher / Mechanics Library / Game Designer / Fact Critic / Game Critic / Gameplay Critic。
Researcher は既存ゲームをジャンル横断で研究し、goal / core_action / information / constraints /
decisions / feedback / failure / retry_motivation / mastery / variation / progression /
reusable_mechanics に分解する。タイトルの模倣ではなく再利用可能な mechanic を蓄積する。
