# アートスタイル規約（JC ART DIRECTOR用）

## JIBUN CHOICE 共通アートスタイル

- 丸みのある3Dクレイ／粘土細工風
- 手作りミニチュア・ジオラマ感
- 柔らかく明るい
- 小4〜6向け（幼児向けにしない・少し大人っぽくおしゃれ）
- シリーズ全体で同じ素材感
- 写実CGへ寄せない
- 画像に文字を基本的に焼き込まない（テキストはUIで載せる）

既存アセットの実例: `public/assets/`（テーマ別サブフォルダ: `heat/`, `event/` など）。
新テーマも `public/assets/<theme>/` に置き、コンテンツ側は
`` const X = (name) => `${import.meta.env.BASE_URL}assets/<theme>/${name}.png` ``
のヘルパーで参照する（既存モジュールの慣例）。

## 画像化するもの / UIで作るもの

| 画像化する | UIで作る |
| --- | --- |
| 場所・情景 | 数字・数値表示 |
| 人物 | 長文 |
| 道具 | グラフ |
| Before/After | ボタン・バッジ |
| ゲームに必要なオブジェクト | 状態表示 |

## manifest 形式

確定したゲーム仕様から `factory/projects/<world-id>/art-manifest.json` を作成する。
各エントリの必須フィールド:

```json
{
  "id": "heat-park-scene",
  "event": "heat-wave",
  "game": "heat-park",
  "use": "place | tool | incident_icon | before_after | wrapup | character",
  "scene": "何が写っているかの説明（日本語）",
  "composition": "構図指定（引き/寄り、視点、余白）",
  "required_objects": ["必ず入れるもの"],
  "forbidden_objects": ["入れてはいけないもの（文字、職業名の看板など）"],
  "aspect_ratio": "1:1",
  "transparent_background": false,
  "safe_margin": "外周8%",
  "intended_display_size": "丸形ホットスポット 96px など",
  "filename": "park-scene.png",
  "output_path": "public/assets/<theme>/park-scene.png",
  "status": "pending | generated | placed | needs_regeneration"
}
```

## v0.1 の範囲

画像生成APIの接続はまだ必須にしない。**manifestを正確に作るところまでが必須。**
生成は人間が manifest を使って行い、`status` を更新する。
