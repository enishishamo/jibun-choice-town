# Master Approval — companion-model-sheet-2026-09-20.png

| 項目 | 値 |
|---|---|
| asset | `design/v2/master/companion-model-sheet-2026-09-20.png`（相棒 4 面図: 正面／後ろ／横向き 2 方向、白背景） |
| 種別 | **Character Master / Model Sheet** — 相棒の visual source of truth |
| 承認日 | 2026-09-20 |
| 承認者 | Human（Product Owner） |
| 承認の経緯 | Human が 4 面図を提示し「Character Master として保存」と指示。Claude Code が Art QA HARD GATES を目視確認し、鼻の扱いを質問 → Human が「小さな丸いオレンジ色の鼻。くちばしではない」と決定し、CHARACTER_BIBLE を更新 |
| 適用範囲 | Ver.2 の全画面・全 asset に登場する相棒。以後の相棒生成・実装はこの画像と `docs/jibun-choice-v2/CHARACTER_BIBLE.md` の両方を参照する |
| 配置状況 | **PNG は Human が Work 経由で配置する**（チャット画像はファイルとして取り出せないため）。配置後に `git add design/v2/master/*.png` でコミット |

## Art QA HARD GATES（CHARACTER_BIBLE §6）— 2026-09-20 目視確認

| ゲート | 結果 | 備考 |
|---|---|---|
| mouth が存在しない | PASS | 口・口線なし |
| character RIGHT ear = 🔍 | PASS | 正面: 画面左=🔍 |
| character LEFT ear = ❤️ | PASS | 正面: 画面右=❤️ |
| 前後左右で耳が反転していない | PASS | 後ろ: 画面左=❤️／画面右=🔍。横向き 2 方向も本人基準で一致 |
| beak がない | PASS（Human 判断） | 顔中央の小さな丸いオレンジの突起は **鼻** と Human が決定。くちばしではない |
| 鼻は小さく・丸く・オレンジ色 | PASS | 尖っていない・横に伸びていない |
| 別キャラクター化していない | PASS | 4 面すべて同一 character |
| body proportion | PASS | 頭大きめ・短い手足の toy proportion、4 面で一貫 |

## 仕様として確定した外見（画像から）

- white / cream の rounded body、small black eyes、淡い頬の赤み、小さな丸いオレンジの鼻
- explorer hat（beige + green band、金具は黄土色）
- green backpack（横・後ろで見える。正面では肩ベルトのみ）
- torso / arms / legs あり（後からアイテム装着可能な身体）

## 引き続き OPEN

表情バリエーション・アイテム装着スロット・名前・セリフ（OPEN_DECISIONS D-01 / D-02 残り / D-03 / D-04）。
これらは本 Master を基準に GPT が設計し、Human が承認する（DESIGN_OWNERSHIP §3）。
