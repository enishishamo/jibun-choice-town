# Prototype A3 — Cohesive Continuous World（2026-09-04）

Human Correctionを受け、A2の反省点を踏まえて再設計。**production実装
ではない**（`src/`配下無変更、tsc/build差分なし。新規GPT illustration
生成なし——既存の承認済みdistrict illustration/town-heroをCSS
masking/blendingで再利用のみ）。

## Human Correctionの反映

- Continuous Worldの目的は「空間探索ゲームを作ること」ではなく
  「現在のproduction Mapの視覚的一体感の欠如を直すこと」と再定義
- A2にあった「sub-locationを地区中心の周りにリング状に散らす」抽象層を
  廃止。3階層→2階層（L1 WORLD／L2 focus）へ簡素化
- L2ではevent hotspotを地区illustrationの**内容そのものの上**
  （橋・噴水・駅舎など絵の中の自然な場所）に直接配置——「イラスト内の
  要素自体をUI要素として機能させる」という研究知見
  （`visual-design-system.md`§ILLUSTRATION_INTEGRATION）をそのまま適用
- DiscoveryはVISUAL HOOK（glow・sparkle・fog・screen edge curiosity）で
  実現し、新しいroute-finding/spatial puzzleは一切追加していない

## 実装した視覚統合技術

- 各illustrationを`radial-gradient` maskで feather——白い縁取り
  （A2の「アバターアイコン」的な見た目）を廃止
- 全illustration＋地形へ共通の`filter`（saturate/brightness）と
  canvas全体の単一光源gradient overlayを適用し、色調・光源方向を統一
- 地面に馴染ませるcontact shadow（`drop-shadow`、透明maskの形状に追従）
- 50 world規模のスケーラビリティ実証用に4つの実assetに加え、
  意図的に「霞んだ」プレースホルダー地区を3つ追加（「まだ発見度の低い
  場所」という設定で見た目のギャップを物語に転用）

## 自動検証（`factory/harness/map-a3-gesture-qa.mjs`、実touch event）

7ケース全PASS。`ACCIDENTAL_ACTIVATION_RATE=0`、`PAN_TAP_SEPARATION=PASS`
（DOM node数もL1:15/L2:11で、27件のdummy event登録に対して常にtier
scopeで収まることを確認）。

## Codex独立レビュー（screenshotのみ）

`factory/harness/map-a3-review-prompt.md`。**overall_verdict = FAIL**
（2回連続）。

| Gate | 閾値 | 実測 | 判定 |
|---|---|---|---|
| GAME_DESIRE | >=85 | 42 | FAIL |
| DISCOVERY_CURIOSITY | >=85 | 46 | FAIL |
| WORLD_FEEL | >=90 | 31 | FAIL |
| VISUAL_COHESION | >=90 | **24** | **FAIL（最重要の未達）** |
| ART_UI_INTEGRATION | >=85 | 48 | FAIL |
| MOBILE_READABILITY | >=85 | 67 | FAIL |
| MAP_CLUTTER | <=15 | 10 | PASS |
| AMATEURISHNESS | <=15 | 68 | FAIL |
| SCALABILITY_50_WORLDS | >=85 | 91 | PASS |
| PAN_TAP_SEPARATION | PASS | screenshotのみでは判定不能と明記 | 自動テストでPASS確定 |

**根本原因（Codex）**: 「再利用されたdistrict illustrationは似た柔らかい
色調を持つが、同一のカメラ角度・縮尺・光源には見えない。中心の町は広域を
俯瞰した矩形画像、駅や港は低い視点から見た立体ジオラマで、建物・樹木・
道路の相対寸法も一致しない。背景へのフェザー処理は切断線を和らげる
だけで、投影法と縮尺の不一致そのものは解消できない」。

## この結果の意味——今回の指示との整合

今回のHuman Directive自体が事前にこのリスクを明記していた:
> 「A案を採用する場合、既存district illustrationをそのまま貼り合わせる
> ことは前提にしません。」

今回のA3実装は、CSS技術（feather・統一filter・grounding shadow）で
「貼り合わせ」の見た目をできる限り改善する試みだったが、Codexの
独立検証はこれを明確に否定した——**レイアウト・CSS技術だけでは、
そもそも異なる投影法・縮尺で生成された画像を「同じ世界」に見せる
ことはできない**。これはCSSの実装力不足ではなく、素材そのものの
制約であり、Human Directiveが最初から想定していた
CURRENT_ASSET_COMPATIBILITYの限界そのものである。

## 副次的な観察（Codexスコアの対象外、実装メモ）

`level1-panned.png`で川のSVG pathが、地形をつなぐ意図とは裏腹に
無関係な場所（河口プレースホルダー付近）を斜めに横切って見える箇所が
ある。これは光源処理のバグではなく、川road pathの座標を各地区の
実際の配置に合わせて調整しきれていないためで、VISUAL_COHESIONの
主要因（illustration間のカメラ角度・縮尺不一致）とは別の、より
軽微な実装上の詰めの甘さ。次のイテレーションで座標調整すれば解消できる
範囲の指摘であり、今回のGPT_ASSET_REQUESTの要否判断には影響しない。

## GPT_MAP_ASSET_REQUEST

**作成した**（`factory/state/art/gpt-asset-requests.json`の
`continuous-world-base-illustration`、`backlog_low_priority`内、
`status: "IDENTIFIED_NOT_YET_APPROVED"`）。内容: JIBUN CHOICE世界全体
（町・港・森と川・駅前・丘の上）を、単一のカメラ角度・縮尺・光源で
描いた、一枚の新しい連続illustration。既存assetは参照用のみとし、
それらの再配置では要件を満たせないことを明記した。

**重要**: これは生成の承認ではない。Map architecture自体（A/A2/A3/
さらなる改良案）がまだproduction向けに確定していないため、まず
architecture方向性の最終確認と、この記事内で指摘した
「将来のdistrict追加時にこの一枚絵をどう拡張するか」という未解決の
リスクの検討を、生成前にHumanへ委ねる。

## Release Safety

feature/harness-bootstrap（Development Track）上、`public/
dev-prototypes/`の独立静的prototypeのみ。`src/`配下のproductionコードは
一切変更していない。Stable（main / stable-prototype-v0.1）には一切
触れていない。paid API/API keyは使用していない。GPT_ASSET_REQUESTは
記録のみで生成は行っていない。
