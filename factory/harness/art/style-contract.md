# JIBUN CHOICE Art Style Contract（Stage 6 正本）

シリーズ統一の判定基準。文章＋**reference assets（実画像パス）**の両方で定義する。
既存正本（factory/art/style-prompt.md / factory/rules/art-style.md）と矛盾させない。
プロンプト生成（art-loop.mjs）と visual QA（art-qa.mjs）は本 Contract を読む。

## 様式（MUST）

- 丸みのある **3Dクレイ／粘土細工風**。手作りミニチュア・ジオラマ感
- 人物・建物・道具・背景を**同一素材感**で統一（同じ粘土質感・同じ柔らかい斜光）
- やわらかく明るい配色。あたたかい
- 対象は小4〜6年生：**幼すぎない**。少し大人っぽく、現代的でおしゃれ。古臭さ・昭和感禁止
- 写実CG・写真素材の混在は禁止
- 画像内に**読める文字・数字・ロゴ・透かしを入れない**（テキストはUI側で載せる）
- 性別固定観念を避ける。職業の性別を固定しない
- 不自然な手指・肢体の破綻を避ける（クレイ人形は指の簡略化が正解）
- シリーズ内で色温度・質感・頭身を大きくズラさない（頭身はやや低め・2.5〜3頭身目安）

## Reference set（JIBUN CHOICEらしさの実例・視覚QAの比較基準）

| path | 何の基準か |
| --- | --- |
| public/assets/town-hero.png | 街全景のジオラマ感・配色・素材感の最上位基準 |
| public/assets/heat/place-park.png | 場所シーンの構図・粘土質感 |
| public/assets/medical/who_doctor.jpg | 人物（職業ヒーロー/NPC）の頭身・質感・現代性 |
| public/assets/medical/er_arrival.jpg | 場面jpg（物語シーン）の光・カメラ |
| public/assets/event/p_stage.png | 小物・オブジェクト単体の抜き方 |
| public/assets/kyushoku/bg-school.jpg | 背景の淡さ・情報量の抑え方 |

## 用途別の約束

- **place（場所シーン）**: 引きの構図・外周8%セーフマージン・主役が中央〜やや下
- **character**: 上半身〜全身。道具か制服で職業が分かる。顔は柔らかく、実在人物に似せない
- **before/after**: **同一建物・同一カメラ・同一構図・同一街並み**。変えるのは出来事の結果だけ
- **tool/object**: 単体抜き。背景は無地〜ごく薄い
- **mobile safety**: 重要要素は中央70%以内。端が切れても意味が壊れない構図

## 禁止（QAで自動指摘）

読める文字/ロゴ/透かし・写実質感・実在ブランド/人物・過度な汚れや恐怖表現・
人物の頭/手の見切れ・不自然な指・幼児向けすぎるデフォルメ・古臭い画風・
Before/Afterで建物や街並みが別物になること

## Series Style Gate（2026-09-02 追加・fail-closed）
- SERIES_STYLE_MATCH（<80でFAIL・必須）: 「綺麗な画像か」ではなく「既存JIBUN CHOICE
  reference set（factory/harness/art/reference-set.json の実画像）と並べたとき、同じ作品・
  同じ世界に見えるか」。clay material / miniature感 / 頭身 / 顔・目・鼻口の簡略化 /
  髪・肌・服の素材 / lighting / saturation / depth / 背景処理 / カメラ感 / toy-diorama感。
- CHARACTER_SERIES_MATCH（人物がいる場合<80でFAIL・必須）: Pixar/Disney/generic 3D寄り、
  リアルCG寄り、ソシャゲキャラ寄り、頭身過大、目が大きすぎ、肌が人間的に滑らか、
  髪がリアル、顔だけ精密、服だけ布リアル、「粘土人形でなく3Dアニメキャラに見える」を検出。
- 総合点が高くてもこの2ゲート未達ならPASS禁止。QAは毎回 reference set を実画像入力で添付。
- 生成時も generation_refs を毎回 -i で添付（文章だけの "3D clay style" 指定は禁止）。
- FAIL時のrepairは曖昧語（もっとclay等）禁止：criticの series_diffs（referenceとの具体差分）を
  次promptへ自動注入する。
- contact sheet（factory/harness/art/contact-sheet.py → factory/state/art/contact-sheet.png）で
  ref+新規を並べ、シリーズ内driftを面で確認する。

### FAILURE PATTERN（factory learning・再発防止）
"generic high-quality 3D clay character passes QA but does not match JIBUN CHOICE series"
— 単体品質の高い汎用clay/Pixar風人物が旧QA（text contractのみ）を通過した。
対策: reference-based series comparison を Art QA の標準工程とする（本ゲート）。

## Asset Presentation Gate（2026-09-03 追加・fail-closed・in-context）
ASSET QUALITY ≠ PRESENTATION QUALITY。asset単体のQA PASSでは完成にしない。
実ブラウザのscreenshot（mobile 375px + desktop 両方）を art-qa.mjs `presentation` モードで監査：
SUBJECT_CROP / SUBJECT_OCCLUSION / FOCAL_OBJECT_VISIBILITY / BADGE_OVERLAP /
CONTAINER_FIT / BACKGROUND_EDGE_QUALITY / ASPECT_RATIO_FIT / VISUAL_INTEGRATION /
MOBILE_CROP / DESKTOP_CROP。ASSET_PRESENTATION_QUALITY < 80 で FAIL、
BADGE_COLLISION（NEW等が顔・頭・手・職業道具に被る）= true で FAIL。
- subject safe area 優先：装飾（NEW/ラベル/sparkle/吹き出し）よりsubject。
- raw rectangle 検出：カード背景と合わない「四角い画像をそのまま貼った」見た目は
  border-radius / masking / object-fit / object-position / matching background /
  intentional frame で解消（無理な背景除去はしない。意図的なscene frameは許容）。
- object-fit: cover を無条件に使わない（人物・道具・scene情報が切れるなら contain /
  position調整 / 別aspect / responsive crop）。
- スクショ撮影は factory/harness/art/present-shots.mjs（puppeteer-core + 手元Chrome）、
  一覧比較は factory/state/art/contact-sheet-incontext.png（IN-CONTEXT CONTACT SHEET）。
- UI POLISH ADVERSARIAL QUESTION を毎回問う：「完成した商用ゲームUIに見えるか、
  素材を仮置きしたprototypeに見えるか」。prototype感の理由を具体列挙させる。

### FAILURE PATTERN（factory learning・再発防止）
"Asset itself passes Art QA, but its in-app presentation is poorly cropped,
occluded by badges, or visually pasted into the UI."
— 対策: IMAGE QA と IN-CONTEXT PRESENTATION QA の両PASSを完成条件とする（本ゲート）。
