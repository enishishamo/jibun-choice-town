# art-plan v2: 33点の再分類（有料API不使用・新規生成の最小化）

- 作成日: 2026-08-31
- 方針: 従量課金APIは使わない（ユーザー方針）。既存素材の再利用 → CSS/UI → 組み合わせ →
  どうしても必要な新規（ChatGPT手動生成）の順で検討し、新規を最小化する。
- 既存素材の調査範囲: `public/assets/` 全7フォルダ（約155枚）＋ `assets-source/`（約61枚）。
  代表画像を目視確認（town-hero / price/overview / price/shop / medical who_* ・場面jpg /
  event p_* / heat place-* / bg-* 等）。
- art-manifest.json v1.1 の status は変更していない（この文書が生成計画の正本）。

## 調査で分かった既存運用の前例

- 医療編は **NPC（患者）と職業ヒーローを ChatGPT 生成の場面jpg** で運用（who_doctor.jpg 等）
  → ハルさん立ち絵の新規生成は既存運用と整合する
- 後期編ほど「ゲーム内小物は UI/emoji、場面だけ画像」の構成（今回の実装と同型）
- 商店街・シャッター通りに使える既存画像は**存在しない**（town-hero の SHOP 街区は
  全体俯瞰の一部で切り出すと粗い。bg-road はトラック道路。price/shop はスーパーの売り場）
- event/p_bins（フタなしの分別箱3連）は ch5 ゴミ箱に転用可能だが、改善後（フタ付き）の
  ペアが存在せず再検査の視覚差分が作れないため不採用

## 分類（33点）

### ① 既存画像をそのまま再利用 — 0点

意味の合う既存画像なし（上記のとおり）。無理な流用は世界観の混乱を生むため行わない。

### ② CSS / SVG / UI で表現（現行実装のまま確定）— 29点

実プレイQAで全て動作確認済み。C（見て判定する情報）はテキスト観察が設計上の中核であり、
画像化しなくてもゲーム体験が成立している。

| 群 | 点数 | 現行の表現 |
| --- | --- | --- |
| incident アイコン 5 | 5 | emoji ホットスポット（🏬📝💴📐🔍） |
| ch1 通り盤面 board-street | 1 | CSS カード列（絵文字＋店名。開店で表情が変わる演出も実装済み） |
| ch4 床 floor-base | 1 | CSS グリッド（給排水列の色分け・固定物emoji） |
| ch4 パーツ 8 | 8 | emoji チップ（水栓3タイプの判別はテキストボタン） |
| ch5 探索盤面 inspect-room | 1 | チェックリスト型UI |
| ch5 スポット近景 9 | 9 | 観察テキスト（「十字のハンドルを回して止める水栓だ」等）＝基準と突き合わせるCそのもの |
| place 4（counter/interview/interior-raw/inspect） | 4 | place.image 省略（intro はテキストで成立） |

### ③ 既存画像の組み合わせ / 新規1枚の多用途化 — 1点

- **shop-area-scene（エリア背景）**: 専用画像を作らず、④の ba-before.png を
  `sceneImage`（fit/focus 調整）として兼用する。物語の起点＝シャッター通りなので
  テーマ的にも正しい。暫定の bg-road を置き換える。

### ④ どうしても新規生成が必要（ChatGPT手動生成）— 3点

| id | 理由 |
| --- | --- |
| char-haru | 5章を貫くNPC軸の顔。会話・discovery・E画面で反復登場し、医療編の患者/who_*前例と同格の「物語の要」 |
| ba-before | wrapUp の Before ＋ エリア背景 ＋ ch1 place ヘッダの3役。世界の第一印象（シャッター商店街）は既存に代替なし |
| ba-after | イベント全体の感情的ペイオフ「シャッターが1枚開いた」。Before と同一建物の差分が必須で合成では作れない |

### 任意（体験は上がるが必須ではない・今回は生成しない）

職業ヒーロー5（現行SVGプレースホルダ。図鑑の見た目統一用）／水栓の近景ペア2
（ch5の形判定を視覚化）／これらは希望があれば次回リストに昇格。

## 生成後の手順（無料スクリプトで検証可能）

1. 生成画像を manifest の output_path（`public/assets/shop/ba-before.png` 等）に保存
2. `node factory/scripts/art-qa.mjs shop-opening`（寸法・PNG妥当性）
3. 実装の結線（sceneImage 差し替え・wrapUp beforeAfter・会話UIへの char-haru）
4. `node factory/scripts/art-check-links.mjs shop-opening --update`
