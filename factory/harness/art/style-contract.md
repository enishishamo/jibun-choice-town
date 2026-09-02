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
