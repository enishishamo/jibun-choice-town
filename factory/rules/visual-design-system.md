# Visual Design System

2026-09-04 制定（Experience Design Harness）。根拠:
`factory/state/expansion/visual-design-research-2026-09-04.json`
（Animal Crossing: New Horizons / Super Mario Bros. Wonder / Pokémon
Scarlet-Violet / Kirby and the Forgotten Land / Splatoon 3 / Zelda: Tears
of the Kingdom / Stardew Valley / Sky: Children of the Light / Alto's
Odyssey・Adventure / Fantasian / Ni no Kuni系 / Pikmin 4 / Monument Valley /
Genshin Impact / Snufkin: Melody of Moominvalley / Toca Boca World /
Cozy Grove / Super Mario RPG (2023) の18例分析）。

**このドキュメントの位置づけ**: 「観察された原則」を実装ルールへ翻訳した
ものであり、JIBUN CHOICEのブランドidentityそのものを確定するものでは
ない。ブランドカラー・ブランド書体の最終選定・マスコット等は
`factory/rules/product-identity-gate.md` 対象として別途扱う（各項目末尾に
明記）。個別画面への最初の適用例は True Home（`src/screens/HomeScreen.tsx`）
——`factory/state/expansion/whole-screen-visual-director-baseline-2026-09-04.json`
のCodex独立レビュー結果（baseline: AMATEURISHNESS 44-51、
ICON_CONSISTENCY 29等）を出発点とする。

## TYPOGRAPHY

研究知見: 高品質タイトルの多くは装飾書体を見出し等ごく限定的な箇所に
とどめ、太さ2-3段階のみで階層を作る「単一タイプシステム」。
ローカライズ言語ごとにフォントがバラつくと世界観と不一致を起こす失敗例
も観測された。

JIBUN CHOICEルール:
- 既存の書体スタック（`"Hiragino Maru Gothic ProN", "Hiragino Kaku Gothic
  ProN", "Zen Maru Gothic", "Yu Gothic", sans-serif` — `body`に設定済み）
  は「丸みゴシック単一システム」の方針に既に合致しており、新しい
  brand fontを今すぐ導入する必要はない
- 見出し（ロゴ・画面タイトル）とbody/数値/badgeで、ファミリーを変えず
  太さ・字間・サイズの3軸のみで階層を作る
- ルビ（ふりがな）を伴う語は行間・文字サイズの比率を崩さない
  （`factory/rules/language-style.md`の既存ルール優先）

**HUMAN_PRODUCT_DECISION_REQUIRED**: 独自の display 書体（ロゴ専用の
brand typeface）を新規に導入するかどうかの最終決定。候補比較・
プロトタイプ提示まではAIが行ってよい。

## COLOR

研究知見: 背景・カード面・アクセントの3層で意図的に彩度を変える例が多い。
ブランドカラーを1-2系統に絞り一貫適用する例がある一方、彩度レンジを
決めずに画面ごとにばらつくとトーンが崩れる。

JIBUN CHOICEルール:
- 既存パレット（`--cream`/`--ivory`/`--card`/`--blue`系/`--green`系/
  `--orange`系/`--red`）を今回変更しない。3層（背景/面/アクセント）の
  彩度差をこのパレット内で意識的に使う（アクセントは`--orange`系に
  一本化——既存のprimary card play buttonが既にこの方針）
- 新しい色トークンを画面ごとに増やさない。既存トークンで表現できない
  場合はここに追記してから使う

**HUMAN_PRODUCT_DECISION_REQUIRED**: パレット自体（色数・色相）を
大きく変える場合。既存パレット内での配分調整はAIの裁量で可。

## BACKGROUND

研究知見: 背景を単色フラットで済ませず、環境を示唆する簡略化イラスト・
グラデーション・ぼかしを重ねて奥行きを作る例が多い。「背景が単なる
色の板ではない」点が共通。

JIBUN CHOICEルール:
- 主要ハブ画面（True Home等）の背景は、既存の承認済みイラスト
  （例: town-hero）を非破壊的に加工（ぼかし・減光・トリミング）した
  ものを敷き、単色/単純グラデーションのみで済ませない
- 新規イラストは発注しない。既存GPT資産のCSS加工（blur/opacity/mask）
  のみで実現する

## SURFACE

研究知見: カード・パネルは背景から浮くよう明度差・縁取り・素材感を持たせ、
単なる矩形の色面にしない例が多い。

JIBUN CHOICEルール:
- カード面は`--card`/`--ivory`と`--line`の組み合わせを維持しつつ、
  背景が単色でなくなる場合はカード側のコントラスト確保
  （半透明度・追加のscrim）を調整する

## CARD

研究知見: 情報カードはアイコン・短いラベル・状態表示という要素構成が
繰り返し観測され、同一画面内でサイズ・角丸・影のルールが統一されている。

JIBUN CHOICEルール:
- 同一画面内のカード群は角丸半径・影のルールを揃える
  （`--radius`/`--shadow`トークンを共通利用）
- カード内の要素構成は「アイコン→ラベル→状態（バッジ/近日公開等）」の
  順を崩さない

## BORDER

研究知見: 太い単色の外枠一辺倒ではなく二重線・内側ハイライト等も
見られるが、子ども向けタイトルほど視認性確保のためコントラストの
強い縁を使う傾向。

JIBUN CHOICEルール:
- 対象年齢（8-12歳）を踏まえ、視認性を優先した現在の`--line`単色縁を
  基本とする。装飾のための多重線は優先度を下げる

## SHADOW

研究知見: 単純なドロップシャドウに加え、光源方向を意識した柔らかい
落影とAO（環境遮蔽）を併用してジオラマ感を強める例が複数。影の付け方が
画面内で不統一だと「平面に貼られただけ」に見えるリスクが繰り返し示唆。

JIBUN CHOICEルール:
- 画面内の光源方向を1つに揃える（暗黙に「左上から」を既定とする——
  既存の`--shadow`トークンの向きと合わせる）
- 新しい影スタイルを画面ごとに増やさない。`--shadow`トークンを共通利用

## SPACING

研究知見: 情報密度が上がりやすい収集・進行系画面ほどグループ間の余白を
広く取り視線誘導する。高評価モバイルタイトルは1画面の主役要素数を絞る
傾向。

JIBUN CHOICEルール:
- 1画面の「主役」は原則1つ（True Homeなら「社会を冒険する」カード）。
  それ以外は視覚的に一段トーンダウンする
- グループ間の余白はグループ内の余白より明確に広く取る

## RADIUS

研究知見: カジュアル・子ども向け系統は角を大きく丸める傾向、探索系は
情報密度優先で角丸を抑えめにする傾向。対象年齢とジャンルで最適値が
変わる。

JIBUN CHOICEルール:
- 既存の`--radius: 20px`（カジュアル寄り、対象年齢8-12歳に合致）を
  維持する。画面ごとに異なる半径を増やさない

## ICONOGRAPHY

研究知見: 高品質タイトルはアイコンを単一の描画言語（線幅・丸み・影の
付け方）で統一し、写実的な絵文字やOS標準アイコンとの混在を避ける傾向が
一貫して見られた。

JIBUN CHOICEルール（§6 NO RANDOM EMOJIと直結）:
- production UIの主要visualにOS emoji（📖🌱等）を使わない
- 機能アイコンが必要な場合の優先順位: (1)既存JC資産の再利用 →
  (2)一貫した線画スタイル（線幅・角丸・色）のfunctional SVG icon を
  Claude自身が新規に作る → (3)それでも足りない場合のみGPT_ASSET_REQUEST
- functional SVG iconはイラストのwarm/roundedなトーンに合わせ、
  単一のstroke-width・色トークンを使う

## ILLUSTRATION_INTEGRATION

研究知見: 個別イラストが枠と別レイヤーで「貼られている」ように見えない
ための手法として、(1)イラストの縁と背景/フレームの質感を近づける、
(2)画面全体で光源方向を統一する、(3)イラスト内の要素自体をUI要素として
機能させる、の3種が繰り返し観測された。

JIBUN CHOICEルール:
- 主要イラストの縁を背景へ feather/blend させ、カードの角で
  ハードカットしない（既存のtown-tile/district-illustrationの
  マスク処理と同じ考え方をHome/主要画面にも適用）
- 背景そのものを同じイラストの加工版にする（BACKGROUND参照）ことで、
  「画面全体が一枚の世界に見える」を達成する
- 新規イラストのClaudeによる描き直しは行わない
  （既存承認済みGPT資産のCSS加工のみ）

## VISUAL_HIERARCHY

研究知見: 多くのタイトルで「今できる次の一手」を色・サイズ・動きの
いずれかで一つだけ際立たせ、それ以外はトーンダウンする設計が共通。

JIBUN CHOICEルール:
- 各画面で「今できる次の一手」を1つに絞り、色（アクセント）・
  サイズ・motionの少なくとも1軸で他要素より明確に目立たせる

## MOBILE_COMPOSITION

研究知見: モバイル最適化成功例は1画面の主役要素数を絞り、階層
（全体→地域→場所）を深くすることで各階層の情報密度を下げる。

JIBUN CHOICEルール:
- 375px幅を基準に、1画面の主役要素数を絞る方針を維持する
  （True Home・Mobile Map Simplificationで既に適用済み）

## DESKTOP_COMPOSITION

研究知見: 据置・PC系は同時に多くの情報を並列表示できるため階層を浅く
保ちながら余白と整列で読みやすさを担保する。ただしモバイルと同一UIを
そのまま展開すると操作性課題が生じる例も報告された。

JIBUN CHOICEルール:
- モバイル用の狭いカラムをそのままデスクトップの中央に置いて
  余白を放置しない。背景（BACKGROUND参照）で広い画面を埋めつつ、
  主要コンテンツ幅は可読性を優先して適度に広げる
  （無制限に広げてカードを間延びさせない）

## STATE

研究知見: 未訪問・訪問済み・ロック状態は色・輪郭スタイルで視覚的に
区別され、文字ラベルのみに頼らない例が多い。

JIBUN CHOICEルール:
- 状態（未訪問/訪問済み/ロック/近日公開）は色・不透明度・輪郭の
  組み合わせで表現し、テキストラベルだけに頼らない
  （既存の`is-coming-soon`のopacity処理は方針に合致、継続）

## MOTION

研究知見: 到達・解放・新規発見時に短いアニメーションや粒子効果で変化を
知らせる手法が広い。一方、意図的に「完璧に滑らかではない」動きで
世界観のトーンと一致させる例（Snufkin）もある。

JIBUN CHOICEルール:
- 「存在するだけ」のアニメーションで良しとしない。到達・発見・状態変化
  など意味のあるタイミングにmotionを結びつける
  （既存のhome-card-breathe/sparkleは方針に合致）
- 新しいmotionを追加する際は`factory/rules/product-identity-gate.md`の
  対象（例: 新しい育成/進行の視覚表現）に踏み込んでいないか確認する

## DEPTH

研究知見: 視差・前景/中景/背景のレイヤー分け・統一された光源による陰影を
組み合わせて立体感を作る手法が、様式を問わず共通して観測された。

JIBUN CHOICEルール:
- 平面的なカード羅列に見えないよう、少なくとも背景/カード/前景要素の
  3層で明度・ぼかし量に差をつける
- 新しいレイヤーを追加する際もSHADOWの光源方向ルールと矛盾させない
