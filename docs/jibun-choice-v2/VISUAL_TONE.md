# VISUAL TONE — Color / Material / Light（HARD DIRECTION）

制定: 2026-09-20（Human Decision、gate-log entry-2026-09-20-02）。状態: **LOCKED**。
Reference: `design/v2/reference/concept-board-2026-09-20.png`（**色・明るさ・質感の Reference として承認済み**。
Master ではない。相棒の HARD RULE は画像より優先 — [CHARACTER_BIBLE.md](CHARACTER_BIBLE.md)）。

## 1. 目標

**bright / clear / warm / playful toy color**

明るく鮮やかだが、原色・ネオンにはしない。単純な「高彩度」が目標ではない。

## 2. Color grammar（LOCKED）

| 組み合わせ | 意味 |
|---|---|
| BLUE + GREEN | 世界・環境 |
| CORAL + YELLOW | 遊び・発見・注目 |
| CREAM + BEIGE | キャラクター・UI・休ませる領域 |

**職業別テーマカラー化をしない**（医療だから全面 blue、農業だから全面 green、technology だから purple、等は NG）。

## 3. 基準 palette v1（LOCKED）

| 名前 | 値 |
|---|---|
| Sky Blue | `#64B4DC` |
| Soft Sky | `#B1D4EB` |
| Fresh Green | `#779763` |
| Deep Green | `#427D50` |
| Coral | `#E5784F` |
| Honey Yellow | `#E5BF7A` |
| Warm Cream | `#F1F1EE` |
| Warm Beige | `#E4D3B8` |

- Reference から整理した基準値。**ゲームごとに別 palette を作るためのものではない。**
- Master 制作時の Human / GPT 判断による調整は可能（調整は本表を更新し、日付を残す）。
- Claude Code はこの表にない色を独自に追加しない（[DESIGN_OWNERSHIP.md](DESIGN_OWNERSHIP.md) §2）。
- `src/v2/index.css` にトークン化する際は、この表の名前と値をそのまま使う（実装時に行う。2026-09-20 時点では未実装）。

## 4. NG visual（LOCKED）

- dark / muddy / grayish、くすみカラー主体
- beige / brown 主体のナチュラルデザイン
- 淡すぎる pastel
- neon / 原色主体
- retro / vintage
- wellness app 風
- 行政・教材資料風
- generic SaaS UI
- realistic CG

## 5. MATERIAL / LIGHT（LOCKED）

- rounded 3D toy / clay miniature
- tactile で触りたくなる立体感
- slightly matte、柔らかな clay / toy texture、rounded edges
- bright daylight / soft studio-like lighting、soft shadows
- 避ける: 強い黒影、dramatic lighting、金属的・photorealistic な CG 表現

MAP → WORLD → PLAY → ぼうけんノートまで、**同じ玩具世界が続いているように見せる**。

## 6. PLAY 画面での優先順位

背景装飾を増やすよりも、**今触ってほしいものが最も触れそうに見える**ことを優先する
（[GAME_DESIGN_RULES.md](GAME_DESIGN_RULES.md) §1、PLAY FIRST）。

## 7. 既存ルールとの関係

- `factory/rules/art-style.md` の「丸みのある 3D クレイ／ジオラマ」「画像に文字を焼き込まない」は本書と整合。
- `factory/rules/visual-design-system.md` の「既存パレット（`--cream` / `--blue` 系…）を変更しない」は
  **Ver.1 画面にのみ適用**。Ver.2 は本書の palette v1 を使う（OPEN_DECISIONS D-16 → 決定済み）。
- Art QA の WORLD 画像 HARD GATES（[ART_PIPELINE.md](ART_PIPELINE.md) §5）は本書 §4/§5 を判定基準として読む。
