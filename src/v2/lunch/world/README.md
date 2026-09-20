# 給食 WORLD MAP (`LunchWorldMap`)

TEMP_IMPLEMENTATION_ONLY — 見た目はすべて Claude Code の仮置き。GPT（Design Owner）の art が
`assets` から差し込まれるまで PUBLIC には出さない（DESIGN_OWNERSHIP.md §2）。

## Props

| prop | 型 | 説明 |
|---|---|---|
| `view` | `LunchWorldView` | `spots[id]`: `muted` / `trouble` / `solved`、`roads[id]`: `off` / `partial` / `on`、`newTrouble`: マウント時に「ガタッ」登場演出を再生する spot |
| `onTapSpot` | `(id: SpotId) => void` | 全 spot で呼ぶ。何が起きるかは親が決める |
| `assets` | `{ bento?: string; spot?: Partial<Record<SpotId, string>> }` | 指定した slot は仮シェイプの代わりに `<img object-fit: contain>` で描画 |
| `showLabels` | `boolean`（既定 `false`） | `COPY.world.spotLabel` を表示するか。false でも `aria-label` は常に付く（PLAY FIRST） |

class hook: `is-playable`（`menu` のみ）、`is-muted` / `is-trouble` / `is-solved` / `is-new`。

## 位置テーブル（`SPOT_POS`、map 座標 375×560）

| spot | x | y | 配置 |
|---|---|---|---|
| grow | 95 | 190 | 左上 |
| carry | 280 | 190 | 右上 |
| serve | 187 | 320 | 中央（学校） |
| cook | 95 | 450 | 左下 |
| menu | 280 | 450 | 右下 |

道（`ROAD_PATH`）は同じ座標系のベジェ。spot を動かしたら両端を合わせて調整する。
`carry-cook` は中央の serve を避けて左寄りを通る（仮）。

## DESIGN_NEEDED

- お弁当箱（開いたフタ＋トレイ）の art
- 5 spot × 3 状態（muted / trouble / solved）の art — 現状は 1 枚を CSS で減色・リング付与している
- 異変マーカー（現状: コーラルの無地丸。「!」等の記号は使っていない）
- 道の art（off の破線 / 点灯時の蜂蜜色 / 走る光）
- solved リング（現状: 蜂蜜色の box-shadow）
- 登場演出「ガタッ」の見え方（現状: 600ms の translate/rotate シェイク → 1.6s bob）
- 道の経路そのもの（グラフ定義は WORLD_DESIGN §4 で OPEN）
- 仮シェイプの色割り当て（`SPOT_TONE`）は Claude Code の独断

## Asset slot 契約

| slot | 想定ファイル | サイズ | 備考 |
|---|---|---|---|
| `assets.bento` | `bento-open.png` | 375×560 縦・透過 PNG | フタが上、トレイが下。spot はこの座標系に置かれる |
| `assets.spot.grow` 等 | `spot-grow.png` … `spot-serve.png` | 160×160 透過 PNG | 正方形。状態別 art が来たら親が `view.spots[id]` に応じて差し替える |

配置例: `public/v2/lunch/world/`（親が URL を渡す。コンポーネントはパスを知らない）。
