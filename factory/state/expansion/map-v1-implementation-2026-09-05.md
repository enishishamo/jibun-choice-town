# Map V1 — Continuous World Base Illustration Implementation（2026-09-05）

Human-approved Continuous World Base Illustration
（`factory/state/art/gpt-asset-requests.json`の
`continuous-world-base-illustration`）をDevelopment Mapへ実装した。
**Map architectureの再検討・新規prototypeは行っていない**——Human
Decision済みのContinuous World + Semantic Zoom + Progressive Disclosure
（A2/A3 prototypeで検証済み）をそのまま、production mapへ適用した。

## 1. 変更したファイル一覧

- `src/data/districts.ts` — 座標系を新しい一枚絵（1774×887px）に合わせて
  更新（`TOWN_TILE`・各districtの`cx/cy/r`）。データ構造・API
  （`District`型・`districtSlot()`・`WORLD_DISTRICT`等）は無変更
- `src/screens/WorldMapScreen.tsx` — 旧来の「town-tile画像＋district別
  illustration4枚＋SVG地形」の合成を、単一のcontinuous-world画像へ置換。
  pan/zoom/tap判定・marker描画・de-collision・Compass・fog teaserの
  ロジックは再利用（再発明していない）
- `src/index.css` — `.town-tile`/`.district-illustration`/
  `.region-terrain`ルールを削除（他箇所で未使用を確認済み）。新規
  `.world-illustration`・`.town-hitzone`を追加
- `public/assets/world/continuous-world.png`（新規、2.8MB、1774×887）—
  iCloud上のHuman提供ファイルから非破壊コピー。元ファイルは無変更

## 2. Continuous World Artの配置

`public/assets/world/continuous-world.png`。Vite `BASE_URL`経由で
`WORLD_IMG`定数として参照。**1:1のネイティブpixelサイズでレンダリング**
（width/height属性がCANVAS_W/H定数と完全一致、object-fit等でのstretchは
一切行っていない——Human Directive §11の要件）。

## 3. World Coordinate Systemの概要

`CANVAS_W=1774, CANVAS_H=887`（画像のネイティブpixelサイズと完全一致）。
`districts.ts`の各districtに、新しい一枚絵の中で実際にその場所が写って
いる座標を目視で当てはめた:

| district | cx,cy | r | 実際の位置 |
|---|---|---|---|
| center（まちの中心） | 850,380 | 240 | 噴水・時計塔の広場 |
| minato（港） | 220,520 | 200 | 灯台・桟橋・ボート |
| ekimae（駅前） | 1080,230 | 180 | 駅舎・線路・電車 |
| mori-kawa（森と川） | 1480,480 | 190 | 滝・川・橋 |
| oka-bunka（丘の上） | 1650,140 | 170 | 青いドームの施設 |
| fog-sky/fog-yuki | — | 90 | 遠くの離島／山奥（既存teaser機構を再配置のみ） |

fog districtは画像へ焼き込まず（Human Directive §14「no embedded UI」）、
既存のsignpost＋silhouette＋teaser機構をそのまま、image内の
「遠くにありそうな」場所へ再配置しただけ。

## 4. Initial Viewportのscale/position

`regionScale`は2つの制約のうちscaleが大きい方（=より寄る方）を採用:

1. **height overscan**: `(vp.h * 1.15) / CANVAS_H` —
   単純な高さフィットだとmobile portraitではcanvas高さ=viewport高さと
   ほぼ一致し、垂直方向のpanが数学的に不可能になる（§6が要求する
   「上下左右pan可能」に反する）ため、15%分オーバースキャンして
   垂直方向にも実際にpanできる余白を確保
2. **width cap**: `vp.w / (CANVAS_W * 0.46)` —
   高さ基準のみだと、desktopのような横長viewportでは画像の全景近くが
   一度に見えてしまう（実測: 素朴な高さフィットで約80%が可視）——
   これはHuman Directive §19「desktopで必要以上にworld全体を見せない」
   に反するため、可視幅を画像全体の約46%以下に制限する項を追加し、
   どちらか大きい方（=より寄る方）のscaleを採用

初期position（camera focal point）は、噴水広場のジオメトリ中心ちょうど
ではなく、`center.r`の22%/12%分だけ左上へ意図的にオフセット（§5/§7
「時計塔／噴水の完全中央固定を避ける」）——harbor方向・station方向双方に
わずかに寄せることで、「広場が完成品として画面いっぱいに収まる」ではなく
「大きな世界の途中にいる」を狙った。

実測（375×812 mobile）: scale≈0.948、canvas 1774×887→1682×841、
viewport 375×731（ヘッダー等を除く実高さ）——横方向可視率約22%、
縦方向に約110px（約13%）のpan余地。

## 5. Pan実装の概要

**既存実装をそのまま再利用**（今回変更していない）: pointerdown/move/up/
cancel + `setPointerCapture` + 8px Euclidean touch slop
（`factory/harness/gesture-arbitration-qa.mjs`で今回このsessionの前半に
実機相当検証済みのロジック）。上下左右とも同じ`clampPan()`が処理する
ため、水平方向のみという制約はもとから無い——今回の変更は
「縦方向に実際にpanできるだけの余白scaleを確保した」ことのみ（§4参照）。

## 6. Tap/Pan Separationの概要

**既存実装をそのまま再利用**。`suppressTap`ref・80ms解除タイマー・
`onPointerCancel`ハンドラのいずれも無変更。今回の変更後に
`factory/harness/gesture-arbitration-qa.mjs`（本番Map対象、実touch
event）を再実行し、5/5 PASS・`ACCIDENTAL_ACTIVATION_RATE=0`を確認
（下記QA結果参照）。

## 7. Semantic Zoom / Progressive Disclosureで再利用したもの

- district focus時のカメラズーム式（`Math.min(Math.max(...), 2.0)`の
  fill/cap方式）はそのまま再利用——district の新しい`r`値に対して
  再検証し、station/harbor双方で自然な収まりを目視確認（§8参照）
- world markerの表示ロジック（`far`/`in-focus`のCSS区分、
  `MAX_SIGNALS=5`の生きたシグナル上限、14-pass de-collision）は完全に
  無変更・無改造
- Compassミニマップは`CANVAS_W/H`の変更に自動追従（座標変換式が定数
  参照のため）。ただし新しい座標系に合わない旧・装飾用の「海岸線」
  ハードコードpathのみ削除（機能に無関係な装飾のみ、動作は影響なし）

## 8. 375px QA結果

チェックリスト（§21）:

- [x] 初期画面でtown centerが認識できる
- [x] 隣接districtが画面端に見える（駅前方向・山側は明確、harbor方向は
      画像の構図上distanceが大きく、直接は見えないが海岸線が
      左下へ続いているのが見える——下記「明らかなvisual issue」参照）
- [x] World全体が縮小表示されていない（1:1ネイティブサイズ、CSS
      transformでのみズーム）
- [x] 建物が小さすぎない（focus時、station/harborとも建物・ランドマークが
      画面の主要な部分を占める）
- [x] 「どこか触れそう」と感じるscale（fire markerが実際の建物・通り上に
      自然に乗っている）
- [x] 左右panできる
- [x] 上下pan できる（15%オーバースキャンで実現、§4参照）
- [x] 画像外の空白が見えない（`clampPan`が両軸で機能、実機screenshot複数で確認）
- [x] panしようとしてmarkerを誤tapしない（`gesture-arbitration-qa.mjs` 5/5 PASS）
- [x] tapしたmarkerは正常activationする（同上、genuine-tap-still-opens-world-marker PASS）
- [x] markerがpan後にズレない（座標系はcanvas絶対値のまま、pan/zoomは
      親要素のtransformのみ——ズレる余地がない構造）
- [x] zoom時にmarkerがズレない（同上）
- [x] UIがMapを覆いすぎない（ヘッダー・leadテキストのみ、既存のまま）
- [x] map edgeへ行ったときcamera boundsが自然（`clampPan`既存ロジック）
- [x] jagged/blur/stretchingがない（1:1ネイティブレンダリング、目視確認）
- [x] 横スクロールbarが発生しない（`overflow:hidden`on `.region-viewport`、既存のまま）
- [ ] mobile browser height変化でレイアウト崩壊 — 個別デバイスでの実機確認は
      今回未実施（ResizeObserverで`vp`を追従する既存実装のまま、変更なし）

自動テスト:
- `factory/harness/gesture-arbitration-qa.mjs`: **5/5 PASS**
  （drag-starting-on-district-hotspot／drag-starting-on-world-marker／
  genuine-tap-still-opens-world-marker／rapid-repeated-drags、いずれもPASS）
- `factory/harness/public-safety-smoke-qa.mjs --viewport both`:
  **0 blocker**、mobile/desktop両方で**14/14 world**が正常に開けることを確認
- `factory/harness/flows/river-flow.mjs`・`port-flow.mjs`: 両方PASS
  （地図経由でのworld到達・ゲームプレイに回帰なし）
- `tsc --noEmit`・`npm run build`: いずれもクリーン

## 9. 明らかなvisual issue（正直な報告）

1. **harbor方向は初期viewportで「見える」とまでは言えない** ——
   station/山側は初期画面から部分的に見えるが、harborは画像の構図上
   town centerから距離があり（他districtと比べ約2倍遠い）、初期状態では
   直接見えていない。ただし左下へ続く海岸線・砂浜がその方向への続きを
   ほのめかしており、「町だけで完結している」という最悪のケースは
   回避できていると判断する。より強くharbor方向を見せたい場合は
   focal pointの調整余地があるが、他方向とのバランスを崩す可能性があり
   今回はこのまま報告する
2. **district focus時、districtの発光式signpost（絵文字＋ラベル）が
   world markerのラベルと視覚的に近接・一部重なることがある**
   （station focus screenshotで確認） —— これはこの一枚絵導入以前から
   存在した構造（signpostはfocus中も常時描画される既存仕様）で、
   今回の変更による新規回帰ではない。新しい一枚絵は旧アセットより
   ズーム時の情報密度が高く見えるため、この既存の重なりがやや
   目立ちやすくなった可能性がある
3. mobile browser の動的な高さ変化（アドレスバー表示/非表示等）での
   実機検証は今回のスコープ外（Puppeteerでの固定viewportでのみ確認）

## 10. Human Decisionが必要な事項

明確に体験が成立しない問題・Product Identity Gateに触れる問題・
Stable promotionに関わる問題はいずれも今回発生していない。以下は
参考情報として記録するのみで、今回はHumanへの判断を求めない
（minor preferenceの大量質問を避ける、という指示に従う）:

- 上記issue 1（harbor方向の初期可視性）を追加調整するかどうかは、
  実際に触ってみたうえで判断されたい場合はお知らせください
- 上記issue 2（signpostとworld markerラベルの近接）も同様

## Release Safety

すべてfeature/harness-bootstrap（Development Track）上。Stable
（main / stable-prototype-v0.1）には一切触れていない。remote push・
production deploy・Stable branch変更のいずれも行っていない。新しい
Product Identity（mascot/currency/unlock system等）は一切追加していない。
paid API/API keyは使用していない。
