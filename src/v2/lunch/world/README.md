# 給食 WORLD MAP (`LunchWorldMap`)

5 つの場所は生成済みのクレイタイル。地面（開いた弁当箱）だけがまだ CSS 描画で、
生成物はあるが配線していない（理由は
[`art-wiring-2026-09-22.md`](../../../../factory/projects/v2-lunch-menu/art-wiring-2026-09-22.md) §1、
台帳の `DN-MAPGROUND`）。ラベルは常に隠し、`aria-label` だけ付く（PLAY FIRST）。

## Props

| prop | 型 | 説明 |
|---|---|---|
| `view` | `LunchWorldView` | `spots[id]`: `muted` / `trouble` / `solved`、`roads[id]`: `off` / `partial` / `on`、`newTrouble`: マウント時に「ガタッ」登場演出を再生する spot |
| `onTapSpot` | `(id: SpotId) => void` | 全 spot で呼ぶ。何が起きるかは親が決める。遊べない場所も必ず一度揺れる（触って無反応にしない） |
| `assets` | `{ bento?: string; spot?: Partial<Record<SpotId, string>> }` | 指定した slot は `PlaceMark` の代わりに `<Art>`（読み込み失敗時は `PlaceMark` に戻る） |
| `showLabels` | `boolean`（既定 `false`） | `COPY.world.spot[id]` を表示するか |

class hook: `is-playable`（`menu` のみ）、`is-muted` / `is-trouble` / `is-solved` / `is-nudged` / `is-new`。

## 位置テーブル（`SPOT_POS`、map 座標 375×700）

| spot | x | y | 配置 |
|---|---|---|---|
| grow | 96 | 250 | 左上 |
| carry | 279 | 250 | 右上 |
| serve | 187 | 405 | 中央（学校） |
| cook | 96 | 560 | 左下 |
| menu | 279 | 560 | 右下 |

道（`ROAD_PATH`）は同じ座標系のベジェ。spot を動かしたら両端を合わせて調整する。
道は常に破線で、点いても破線のまま色だけ変わる（`is-partial` は前半だけ蜂蜜色）。
一本の実線にすると、場所に棒が刺さっているように見える。

## いま配線しているもの

| slot | ファイル |
|---|---|
| `spot.grow` | `public/assets/v2/lunch/map/grow.png` |
| `spot.cook` | `public/assets/v2/lunch/map/cook.png` |
| `spot.menu` | `public/assets/v2/lunch/map/menu.png` |
| `spot.carry` | `public/assets/v2/lunch/truck.png`（流用） |
| `spot.serve` | `public/assets/v2/lunch/school.png`（流用） |
| `bento` | **未配線** — `map/bento.png` は浅い皿のパースで、内側に 5 か所が入らない |

コンポーネントはパスを知らない。URL は `LunchWorldApp` が `assets.ts` から渡す。

## まだ設計が要るもの（Design Owner）

- 地面。上記 A/B の選択（`DN-MAPGROUND`）
- 場所ごとの状態別 art（現状は 1 枚に CSS の減色と glow）
- 異変の見え方（現状: コーラルの glow。記号は使っていない）
- 登場演出「ガタッ」の見え方（現状: 600ms の translate/rotate → 1.6s bob）
- 道の経路そのもの（グラフ定義は `WORLD_DESIGN.md` §4 で OPEN）
