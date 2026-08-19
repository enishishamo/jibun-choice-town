# JIBUN CHOICE（プロトタイプ）

「何になりたい？」と聞かないキャリア教育。
バーチャル社会を冒険していたら、思いがけず知らない仕事に出会うアプリの体験デモです。

## 体験の流れ

```
HOME（バーチャル社会の街）
  → 出来事に出会う（🔥 大変！今日の給食が間に合わない！）
  → 気になる「起きていること」を選ぶ（職業名は見せない）
  → Q1：仕事の一部をミニゲームで体験
  → 仕事発見（NEW! 実はこの仕事だった！）
  → Q2：もっと知る（任意・カード形式）
  → しごと図鑑にたまっていく
```

今回のテーマは「学校／給食」。5職種（給食調理員・栄養教諭・農家・物流・食品リサイクル）のうち、給食調理員のQ1が最も作り込まれています。

## 起動方法

```bash
npm install
npm run dev
```

http://localhost:5177 で開きます。
（ward-management-app の launch.json では `town-app` として登録済み）

## 構造：新しいテーマの追加方法

コンテンツとUIは分離されています。給食専用のコードはありません。

```
src/
  data/
    types.ts          ... Place / AreaEvent / Incident / Profession / Q1Experience / Q2Card
    content/
      schoolLunch.ts  ... 「学校／給食」テーマのデータ（全コンテンツがここ）
    index.ts          ... テーマの登録場所（MODULES 配列）
  q1/
    gameTypes.ts      ... Q1ゲームが受け取る共通Props
    registry.ts       ... gameType → ゲームコンポーネントの対応表
    CookGame.tsx      ... 給食調理員（フル実装）
    MenuGame.tsx / FarmGame.tsx / LogisticsGame.tsx / RecycleGame.tsx
  screens/            ... HOME・エリア・Q1外枠・仕事発見・Q2・図鑑（全テーマ共通）
  state/GameState.tsx ... 画面遷移 + 進捗（localStorage保存）
```

例えば「病院／医療」を追加するには：

1. `src/data/content/hospital.ts` を作り、場所・出来事・職業・Q1・Q2データを書く
2. 医師の鑑別ゲームなど新形式のQ1が必要なら `src/q1/` にコンポーネントを追加し `registry.ts` に登録
3. `src/data/index.ts` の `MODULES` に追加

HOME・出来事表示・仕事発見・図鑑・Q2表示はそのまま再利用されます。

### 設計上のポイント

- **EventとProfessionは多対多**：「農家」は給食からも異常気象からも出会える。Q1Experienceが「出来事×職業」の組を表す
- **Q1のA〜E構造**（場所→困りごと→道具→思考→解決）は共通の骨格だが、ゲーム形式は職業ごとに自由
- **体験履歴で演出が変わる**：農家を体験済みだと、リサイクルの結末で「あ！さっきの畑につながった！」が出る（`hasCompleted`）
- **Q3（人に出会う）** は `Profession.q3` として拡張余地を確保済み

## 画像素材

`assets-source/board1-3.png`（デザインボード原本）から `assets-source/extract.py` で切り出しています。座標を調整して再実行すれば `public/assets/` が更新されます。キャラクター画像は背景を透過処理済みです。
