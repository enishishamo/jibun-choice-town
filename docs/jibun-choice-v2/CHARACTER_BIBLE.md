# CHARACTER BIBLE — 相棒キャラクター（仮名）

制定: 2026-09-20（Human Decision）。本書は Product Identity Gate 対象（brand character）の
**Human 決定記録**であり、AI が形態を再設計・再生成することを禁じる。

## 0. 名前

- **OPEN**: 正式名称は未決定。仕様書・コード内では暫定的に「相棒（companion）」と呼ぶ。
  AI が名前を付けない。

## 1. 役割（LOCKED）

> 探検に行って、好きなものを見つける子。

- 全画面で**同一キャラクター**として扱う。画面ごとに似たキャラクターを生成・再設計しない。
- 相棒は**職業キャラクターに変身しない**。ゲームで出会った仕事由来の「好きかも」アイテムを
  **後から身につける**（→ [GAME_DESIGN_RULES.md](GAME_DESIGN_RULES.md) §アイテム）。

## 2. HARD RULE（LOCKED・画像より優先）

```
character RIGHT ear = 🔍 magnifying glass  （さがす）
character LEFT  ear = ❤️ heart             （すき）
mouth = NONE          口なし
beak  = NONE          くちばしなし
nose  = small round ORANGE nose   小さな丸いオレンジ色の鼻あり（2026-09-20 Human 決定）
```

- 鼻は**小さく・丸く・オレンジ色**。**尖らせない／横に伸ばさない**（鳥のくちばし状にしない）。
  これも HARD RULE。
- 鼻は口ではない。鼻の下に口・線・表情記号を描かない。

- 左右は**本人の身体基準**。**絶対に入れ替えない。**
- 表示上の見え方:

| 向き | 画面左 | 画面右 |
|---|---|---|
| 正面 | 🔍 | ❤️ |
| 後ろ姿 | ❤️ | 🔍 |
| 斜め・横向き | 身体上の位置を維持（回転で導出。反転で作らない） |

- **口を描かない。** 表情は目・姿勢・身体の動きで表現する。
- 画像生成 AI による左右反転を「正しい仕様」として採用しない。
- **Visual source of truth**: `design/v2/master/companion-model-sheet-2026-09-20.png`（正面／後ろ／
  横向き 2 方向の 4 面図、Human 承認済み Master）。以後、相棒を扱うときは本書の文章と
  **この Master 画像の両方**を参照する。文章と Master 画像が食い違う場合は Human に確認する
  （AI がどちらかを勝手に正としない）。承認記録: `design/v2/master/companion-model-sheet-2026-09-20.approval.md`。
  Visual Reference（`design/v2/reference/`）に未修正の反転が含まれていても、本書が優先。

## 3. 外見仕様（LOCKED）

- body: white / cream
- eyes: small black eyes
- nose: 小さな丸いオレンジ色の鼻（口・くちばしではない）
- cheeks: Master 画像どおりの淡い頬の赤み（表情の一部。誇張しない）
- hat: explorer hat を基本、beige 系 + green band
- body shape: white / cream の rounded body（VISUAL_TONE の toy / clay 質感）
- 必要に応じて green backpack
- torso / arms / legs を維持（後からアイテムを装着できる身体）

## 4. 禁止（LOCKED）

- 鳥にしない / くちばし（beak）を付けない / 鼻を尖らせたり横に伸ばしたりしてくちばし状にしない
- スカーフ等の装飾を勝手に追加しない
- profession-specific な服を**初期状態で**着せない
- 別キャラクター化しない / body proportion を大きく変えない
- 口を描かない（再掲）

## 4.5. 誰が描くか（2026-09-20 追加）

相棒の pose・表情・装着アイテムの見た目は **Design Owner（GPT）** が設計し Human が承認する。
Claude Code は相棒を描き直さない・emoji / CSS で代替しない（[DESIGN_OWNERSHIP.md](DESIGN_OWNERSHIP.md) §2）。
承認済み asset がない画面では `DESIGN_NEEDED` とし、相棒を仮描画しない。

## 5. 未決定（OPEN）

- 名前
- 声・鳴き声・セリフの有無（UI/TEXT RULE に照らし、文章での説明役にはしない方向。確定は Human）
- 表情バリエーションの正式セット（Reference A に例はあるが Master ではない）
- 姿勢バリエーション（まえ・よこ・うしろ・ななめ）の正式 Model Sheet
- アイテム装着スロットの定義（頭・背中・手 等）

## 6. Art QA HARD GATES（相棒が登場する画像すべてに適用）

```
□ mouth が存在しない
□ character RIGHT ear = 🔍
□ character LEFT  ear = ❤️
□ 前後左右で耳が反転していない
□ beak がない
□ 鼻は小さく・丸く・オレンジ色（尖っていない／横に伸びていない）
□ 別キャラクター化していない
□ body proportion が大きく変化していない
□ Master 画像（companion-model-sheet-2026-09-20.png）と同一キャラクターに見える
```

違反は visual review 上の **BLOCKER**。自動レビューだけで Master Asset へ昇格させない
（→ [ART_PIPELINE.md](ART_PIPELINE.md)）。

## 6.5. 未決定（OPEN）から Master 化で決まったこと（2026-09-20）

- 姿勢バリエーション（まえ・うしろ・よこ 2 方向）の Model Sheet → **Master 化**（D-02 の一部解消）。
- 表情バリエーション・アイテム装着スロット・名前・セリフは引き続き OPEN（D-01 / D-02 残り / D-03 / D-04）。

## 7. Ver.1 との関係

Ver.1 には brand character は存在しない（`factory/state/product-ideas/gate-log.md`
entry-2026-09-04-01 で mascot 新設は REJECTED、`idea-001-interest-grown-companion.md` は
DESIGN_RESERVED）。本書はその Human Decision の**更新**にあたる（gate-log entry-2026-09-20-01）。
idea-001 の「興味から育つ何か」は、Ver.2 では「相棒 + 体験由来アイテム装着」という形で
Human が方向を決めたものと解釈するが、idea-001 の未決論点（分類軸・成長ルール等）が
自動的に決まったわけではない（→ [OPEN_DECISIONS.md](OPEN_DECISIONS.md)）。
