# ART PIPELINE — Visual Consistency / Master Asset 運用

制定: 2026-09-20（Human Decision）。既存の `factory/rules/art-style.md` /
`visual-production-flow.md` / `factory/art/`（有料 API を使う `/generate-art`）とは別系統で、
Ver.2 の視覚一貫性を守るための運用ルール。

## 1. 目的

Ver.2 では、画面ごとに AI が別の世界観を生成することを避ける。
まず現在の Reference を保存し、将来的に正式な **Master Asset / Model Sheet** へ
昇格できる構造にする。

## 2. ディレクトリ（LOCKED）

```
design/v2/
  reference/   現在の方向性参考画像（DESIGN DIRECTION REFERENCE）。完成版ではない
  master/      人間が正式承認した基準画像。AI が reference を勝手に昇格させない
  generated/   Claude / Codex / Image Generation 等による候補
  rejected/    不採用または比較用
```

各ディレクトリの `README.md` にルールを記載。`reference/MANIFEST.md` に
各 Reference（A〜E）の「採用するもの / 固定ではないもの」を記録する。

## 3. Visual Reference の扱い（LOCKED）

- Reference は方向性共有のためのもの。**pixel-perfect に再現しない**。
- 画像内のすべての要素を正しい仕様として実装しない。
- 優先順位: Design Bible の文章ルール ＞ LOCKED 仕様 ＞ Visual Reference ＞ AI の推測。
- Reference に含まれる既知の未修正点: 相棒の耳の左右・色調・UI・文字量。
  特に相棒は **「口なし」「本人基準で右耳＝🔍、左耳＝❤️」** が正
  （[CHARACTER_BIBLE.md](CHARACTER_BIBLE.md)）。

## 4. Art Pipeline（2026-09-20 更新 — DESIGN_OWNERSHIP.md §3 の Production Flow と同一）

```
体験設計
 ↓ GPT Screen Design / Assets（Design Owner = GPT。image generation は Codex 組み込み等、有料 API は使わない）
 ↓ Human Approval
 ↓ Master / Approved Design（design/v2/master/ へ配置 + approval 記録。§5 HARD GATES を通過）
 ↓ Claude Code Implementation（承認済み design のみ。public/assets/ へ配置）
 ↓ Screenshot（375px）
 ↓ GPT / Codex Visual QA（§5 HARD GATES、VISUAL_TONE.md §4/§5、WORLD_DESIGN.md §7）
 ↓ 修正
 ↓ Human Approval
 ↓ PUBLIC
```

asset 単位の内訳（GPT Screen Design 段の中）: 必要 asset 定義（manifest）→ 生成 → Character Bible review →
World consistency review → human approval → master 昇格。

- 今回のタスクでは**大量の新規画像生成を開始しない**。
- 既存の `factory/harness/` の Art Harness（Codex 組み込み画像生成が契約内で自動化可能、
  記録: memory `art-harness.md`）を Ver.2 でも利用候補とする。有料 API（`factory/art/`
  の gpt-image-1 経路）は CLAUDE.md §8 のとおり使わない。

## 5. Art QA HARD GATES（LOCKED）

### 相棒が登場する画像（最低限）

```
□ mouth が存在しない
□ character RIGHT ear = 🔍
□ character LEFT  ear = ❤️
□ 前後左右で耳が反転していない
□ beak がない
□ 鼻は小さく・丸く・オレンジ色（尖っていない／横に伸びていない）
□ 別キャラクター化していない
□ body proportion が大きく変化していない
□ Master 画像（design/v2/master/companion-model-sheet-2026-09-20.png）と同一キャラクターに見える
```

### WORLD 画像

```
□ bright / high-key
□ adopted toy / clay style
□ 全画面で色調が大きくズレていない
□ 不要な装飾で clutter していない
□ Overall MAP と WORLD MAP の地理的連続性がある
□ job name を PLAY 前に不用意に露出していない
□ image / motion で表現できることを文章で説明しすぎていない
```

- Hard Rule 違反は visual review 上の **BLOCKER**。
- 自動レビューだけで Master Asset へ昇格させない。**最終 Master 承認は human approval**。

## 6. 既存ルールとの関係

- `art-style.md` の「丸みのある 3D クレイ／ジオラマ」「画像に文字を焼き込まない」は Ver.2 でも有効。
- `art-style.md` の「小4〜6向け・少し大人っぽく」と Ver.2 Reference の toy 感の距離は OPEN
  （Human が Master を承認する時点で確定する）。
- `art-style.md` の art ownership（Claude = UI/CSS/SVG、GPT = illustration）は **Ver.2 では
  [DESIGN_OWNERSHIP.md](DESIGN_OWNERSHIP.md) が上書き**（GPT が UI layout・icon・color・文言まで設計、Claude は実装）。
- `visual-design-system.md` の COLOR ルール（既存パレット維持）は Ver.1 画面にのみ適用。
  Ver.2 の色は [VISUAL_TONE.md](VISUAL_TONE.md) palette v1（2026-09-20 決定、D-16 解消）。

## 7. Art Harness との接続（OPEN）

`factory/harness/` に Ver.2 用の Art QA チェック（耳の左右・口なし）を機械的に
判定するスクリプトを置くかどうかは未決定。画像の左右判定は自動化が難しく、
現状は human review が前提。
