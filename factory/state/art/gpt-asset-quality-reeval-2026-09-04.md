# GPT District Illustration — Placement & Quality Re-evaluation（2026-09-04）

## 対象

`factory/state/art/gpt-asset-requests.json` の4件のPUBLIC BLOCKER:
`harbor-district-illustration` / `hill-district-illustration` /
`station-district-illustration` / `forest-district-illustration`。

## 配置内容

- 元画像はユーザーがGPTで生成し、iCloud経由で受領（1536×1024、RGBA、
  イラスト本体の周囲に元々ソフトなアルファのフェザーエッジが焼き込まれている）。
- 画像自体はClaude側で描き直し・加工生成していない。`public/assets/districts/`
  にそのまま配置。
- 実装は [`src/screens/HomeScreen.tsx`](../../../src/screens/HomeScreen.tsx) に
  `DISTRICT_ILLUSTRATION` マップと `<img className="district-illustration">` を
  追加し、地区の `cx/cy/r`（データはそのまま）に基づいてCSSの
  `left/top/width/height` を計算して配置。`object-fit: contain` と、既存の
  `#worldGrain` SVGフィルター＋drop-shadow（中心街イラストと同じ質感処理）を
  [`src/index.css`](../../../src/index.css) の `.district-illustration` クラスで適用。
  マスクや切り抜きは画像自身の透明フチに任せ、追加のクロップは行っていない
  （＝「必要な調整はCSSのサイズ・position・object-fit のみ」の指示どおり）。
- 旧SVGプレースホルダー（`districtKit()` 関数、harbor/forest/station/hillの
  各手描き形状）は完全に不要になったため削除（4地区すべてがGPT画像に置き換わり、
  到達不能なdead codeになったため）。`districtWarmth`（旧SVGの窓点灯にのみ使って
  いた進捗計算）も未使用になったため削除。地区の進捗表示自体は、別系統の
  「living signal」マーカー（👥、新規未訪問worldの合図）で引き続き機能する。

## 評価軸ごとの結果

実際のブラウザで撮影したスクリーンショット
（`factory/state/art/gpt-asset-placement-2026-09-04/`）に基づく。

| 軸 | 結果 | 根拠 |
|---|---|---|
| ASSET_PRESENTATION_QUALITY | PASS | 4枚とも粘土ジオラマ調で質感が揃っており、既存の中心街イラスト・港/図書館/駅シーン素材と違和感なく調和する。 |
| SUBJECT_CROP | PASS | `object-fit: contain` を使用し、灯台・図書館ドーム・電車・滝など主要モチーフが上下左右とも欠けずに収まっている（4地区×mobile/desktop=8枚のスクリーンショットで確認）。 |
| FOCAL_OBJECT_VISIBILITY | PASS（forestのみ既知の副次的事象あり、下記参照） | 各地区の「フォーカス画面」（サインポストをタップして拡大した状態）では4地区とも主題（灯台・船／図書館建物・望遠鏡／駅舎・電車／滝・橋）が画面の大部分を占めて明瞭に見える。 |
| CONTAINER_FIT | PASS | 地区サイズ（`d.r`）に応じて `width = d.r * 2.7` で比例スケーリングしており、4地区とも地図上での相対サイズ感が一貫している。 |
| VISUAL_INTEGRATION | PASS | `#worldGrain` フィルター＋drop-shadowを中心街イラストと共有しているため、「写真＋フラットベクターアイコン」ではなく一つの描画系として読める（Art Ownership修理の既存方針と一致）。 |
| MOBILE_CROP | PASS | 375px幅のregion overview・4地区focused viewすべてで、はみ出し・欠けなし。 |
| DESKTOP_CROP | PASS | 1280px幅でも同様に確認（`desktop-district-*.png`）。 |
| SERIES_STYLE_MATCH | PASS | 4枚とも粘土ジオラマ調・暖色の丸みのある造形・柔らかい光で統一されており、既存の承認済みアセット（town-hero.png等）と同一シリーズに見える。独立監査で指摘されたharbor/hill/station/forestのスタイル不一致は解消。 |

## 既知の副次的事項（このタスクの範囲外、要corrective follow-up）

**forest（森と川）地区の region overview（ズームアウトした地図全体表示）で、
既存のCompassウィジェット（画面右上に固定表示されるミニマップ）と、forest
地区のサインポスト（クリック可能なマーカー）が、デフォルトのカメラ位置において
画面上で重なることを確認した。**

- 実測: forestのサインポストの画面座標は、Compassウィジェットの画面座標に
  すでに完全に内包されている（`getBoundingClientRect()` で確認）。
- 検証の結果、**これはCompassウィジェットとforest地区の世界座標配置という
  既存の設計同士の組み合わせによるもので、今回の画像差し替え作業そのものが
  生んだ不具合ではない**（サインポストの位置は一切変更していない）。
- ただし、以前の細い木のSVGプレースホルダーは視覚的な重みが小さく目立たな
  かったのに対し、今回のイラストは詳細で存在感があるため、重なりがより
  「見える形」で顕在化した。
- 地区を実際にタップして「フォーカス表示（ズームイン状態）」に入れば、
  forestのイラストは他の3地区と同様に完全にクリアに表示される
  （`mobile-district-forest.png` / `desktop-district-forest.png` で確認）。
  ゲームプレイ上の実害（該当worldに入れない等）は無い。
- この件はHome/Map側のカメラ・レイアウトの問題として
  [`factory/state/backlog/ui-ux-backlog.md`](../backlog/ui-ux-backlog.md) に
  記録し、Continuous Development Trackで別途対応する
  （Compassの位置調整か、region overviewの初期カメラフレーミング調整のいずれか）。
- 今回のGPT_PUBLIC_BLOCKERS判定においては、**フォーカス画面での完全な可視性が
  確認できていること**、および**この重なりが新規に持ち込まれたart-quality上の
  欠陥ではなく既存レイアウトの副次効果であること**から、この4件のPUBLIC
  BLOCKER自体は解消したと判断する。

## 総合判定

4件すべて ASSET_PRESENTATION_QUALITY 系の8軸で実質PASS。
**GPT_PUBLIC_BLOCKERS = 0** とする。
