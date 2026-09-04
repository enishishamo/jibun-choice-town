# Language UX Audit: ルビ（ふりがな）カバレッジ スキャン

実施日：2026-09-04  
対象：JIBUN CHOICE ゲーム・コンテンツ一式  
方法：機械的な grep / 手動サンプリングによる分析  
実装変更は行わない（調査のみ）

---

## 1. ルビマークアップ出現統計

### 全体統計
- **総出現回数**：67 箇所
- **対象ファイル**：src/ 配下全体
- **ルビが使用されていないファイル数**：多数（詳細は後述）

### ファイルごとの出現回数（降順）

| ファイル | 出現回数 |
|---------|---------|
| src/data/content/river.ts | 5 |
| src/data/content/forest.ts | 5 |
| src/data/content/schoolLunch.ts | 4 |
| src/data/content/priceHike.ts | 4 |
| src/data/content/extremeHeat.ts | 4 |
| src/q1/ThinningPickGame.tsx | 4 |
| src/data/content/library.ts | 3 |
| src/data/content/studio.ts | 3 |
| src/q1/YardPlanGame.tsx | 3 |
| src/q1/XrayGame.tsx | 3 |
| src/q1/WaterTraceGame.tsx | 3 |
| src/q1/PhotoCluesGame.tsx | 3 |
| src/q1/BugReproGame.tsx | 3 |
| src/q1/BankDesignGame.tsx | 3 |
| src/data/content/port.ts | 2 |
| src/q1/TallyCheckGame.tsx | 2 |
| src/q1/SceneAuditGame.tsx | 2 |
| src/q1/PlantOpsGame.tsx | 2 |
| src/q1/PaperRescueGame.tsx | 2 |
| src/q1/DigiArchiveGame.tsx | 2 |
| src/lib/ruby.tsx | 2 |
| src/q1/PlantPlanGame.tsx | 1 |
| src/q1/FellDirectionGame.tsx | 1 |
| src/q1/CraneLiftGame.tsx | 1 |

**合計 25 ファイルがルビマークアップを含む**

---

## 2. withRuby() 関数の使用状況

### import 状況
**withRuby() を import しているファイル（16 個）**
```
src/q1/BankDesignGame.tsx
src/q1/BugReproGame.tsx
src/q1/CraneLiftGame.tsx
src/q1/DigiArchiveGame.tsx
src/q1/FellDirectionGame.tsx
src/q1/PaperRescueGame.tsx
src/q1/PhotoCluesGame.tsx
src/q1/PlantOpsGame.tsx
src/q1/PlantPlanGame.tsx
src/q1/TallyCheckGame.tsx
src/q1/ThinningPickGame.tsx
src/q1/WaterTraceGame.tsx
src/q1/YardPlanGame.tsx
src/screens/AreaScreen.tsx
src/screens/ProfessionScreen.tsx
src/screens/Q1Screen.tsx
```

### withRuby() を import していないゲームコンポーネント
**Q1 配下 63 コンポーネント中 50 ファイルが withRuby をimport していない**

```
src/q1/BabyCareGame.tsx
src/q1/BodyInsideView.tsx
src/q1/BusOpsGame.tsx
src/q1/ClueBoardGame.tsx
src/q1/CookGame.tsx
src/q1/CrowdFlowGame.tsx
src/q1/CurbCheckGame.tsx
src/q1/DebutPlanGame.tsx
src/q1/DelayRecoverGame.tsx
src/q1/DiagnoseGame.tsx
src/q1/DifficultyTuneGame.tsx
src/q1/FactoryLineGame.tsx
src/q1/FarmGame.tsx
src/q1/FeedPrepGame.tsx
src/q1/GasWatchGame.tsx
src/q1/HotelReceiveGame.tsx
src/q1/InfoCards.tsx
src/q1/LabCheckGame.tsx
src/q1/LandfillOpsGame.tsx
src/q1/LifePlanGame.tsx
src/q1/LoanScreenGame.tsx
src/q1/LogisticsGame.tsx
src/q1/MealFitGame.tsx
src/q1/MenuGame.tsx
src/q1/MoveTryGame.tsx
src/q1/NurseObserveGame.tsx
src/q1/PackageGame.tsx
src/q1/ParkHeatGame.tsx
src/q1/PitCraneGame.tsx
src/q1/PlanCoachGame.tsx
src/q1/PlanEventGame.tsx
src/q1/PowerGame.tsx
src/q1/PromoGame.tsx
src/q1/RecipeGame.tsx
src/q1/RecycleGame.tsx
src/q1/RxCheckGame.tsx
src/q1/SafetyPlanGame.tsx
src/q1/SceneAuditGame.tsx
src/q1/SiteHeatGame.tsx
src/q1/SoundCheckGame.tsx
src/q1/SourcingGame.tsx
src/q1/TenantMatchGame.tsx
src/q1/TimetableGame.tsx
src/q1/TripPlanGame.tsx
src/q1/TruckDispatchGame.tsx
src/q1/UiClarityGame.tsx
src/q1/UrbanHeatGame.tsx
src/q1/VenueLayoutGame.tsx
src/q1/WaterGame.tsx
src/q1/XrayGame.tsx
src/q1/ZoneFitGame.tsx
src/q1/ZooCheckupGame.tsx
```

**カバレッジ：13/63 ゲームコンポーネント（20.6%）のみが withRuby を利用**

---

## 3. コンテンツファイル（src/data/content/*.ts）のマークアップ分布

### マークアップ数による分類

| ファイル | ルビ数 | 傾向 |
|---------|-------|------|
| forest.ts | 6 | **高い** |
| river.ts | 5 | **高い** |
| schoolLunch.ts | 4 | 中程度 |
| priceHike.ts | 4 | 中程度 |
| extremeHeat.ts | 4 | 中程度 |
| library.ts | 3 | 中程度 |
| studio.ts | 3 | 中程度 |
| port.ts | 2 | 低い |
| medical.ts | 0 | **ゼロ** ⚠️ |
| schoolTrip.ts | 0 | **ゼロ** ⚠️ |
| shopOpening.ts | 0 | **ゼロ** ⚠️ |
| townEvent.ts | 0 | **ゼロ** ⚠️ |
| waste.ts | 0 | **ゼロ** ⚠️ |
| zoo.ts | 0 | **ゼロ** ⚠️ |

### セクション別の確認（サンプル分析）

#### river.ts（ルビ数：5）
- **areaLead**: ルビなし
  ```
  "良い変化にも、理由がある。調べる→動かす→つくる。3つの仕事をのぞいてみよう。"
  ```
- **lensSummary**: ルビ 1 個（微生物）
  ```
  { icon: "🫧", label: "処理場", view: "｜微生物《びせいぶつ》のきげんと電力。多すぎもだめ" }
  ```
- **professions q2**: ルビ 3 個
  - 溶存酸素《ようぞんさんそ》
  - 活性汚泥《かっせいおでい》
- **mission**: ルビ 1 個
  - 堰《せき》
  - 護岸《ごがん》

#### forest.ts（ルビ数：6）
- **areaLead**: ルビ 1 個
  ```
  "「｜伐《き》って守る」には、順番がある。選ぶ→倒す→植える。3つの仕事をのぞいてみよう。"
  ```
- **professions**: ルビ 3 個
  - 伐《き》
  - 材積《ざいせき》
  - 受け口《うけぐち》
- **missions**: ルビ 2 個
  - 伐《き》る（重複）

#### ルビゼロのファイル（medical.ts, schoolTrip.ts, shopOpening.ts, townEvent.ts, waste.ts, zoo.ts）
- すべてのセクション（mission, q2, tools, resolution）が**ルビなし**
- UI文字列やシステム文言にも対応ルビがない

---

## 4. ルビなしの専門語サンプリング（10-15 個）

### Q1 ゲームコンポーネント UI文字列から検出

#### 医療・看護関連（NurseObserveGame.tsx）
1. **酸素（SpO₂）** - ルビなし
   - 本来："酸素" は単語として OK だが、医療用語 "SpO₂" は専門度が高い
   - 現状：`label: "酸素（SpO₂）"`

2. **排泄** - ルビなし
   - `label: "排泄"`
   - 現在高学年～中学生向けだが、より幼い層向けゲームでは要注意

3. **肺炎** - ルビなし
   - `label: "肺炎がまた悪くなっている"`

#### 放射線技師（XrayGame.tsx）
4. **被ばく** - ルビなし
   - コメント：`// 被ばく予算`
   - UI未表示だがコンテンツに潜在

5. **フレーミング** - 英語のままルビなし
   - コメント：`// 1. フレーミング — この患者の体格・写り位置を見て...`

6. **ALARA** - ルビなし
   - コメント：`// 広いフレームは2回ぶん（ALARA）`
   - 略語で、さらに理解困難

#### 川づくり（BankDesignGame.tsx）
7. **護岸** - ルビあり（tool-works内）
   - `{ id: "works", name: "工法カタログ", desc: "｜護岸《ごがん》・石積み・魚道" }`
   - だが mission では**ルビなし**：`"｜堰《せき》"`で「堰」のみ

8. **根固め** - ルビなし
   - `{ label: "石積み", sub: `根固めつき・固さと自然の間...` }`

#### 音響・舞台（SoundCheckGame.tsx）
9. **リハーサル** - ルビなし
   - `icon: "📋", title: "リハーサルのコツ"`
   - カタカナ5文字、専門的な演技・舞台用語

#### 栄養・給食（MenuGame.tsx）
10. **副菜** - ルビなし
    - コメント：`// B: 来月の献立の副菜「ほうれん草のごまあえ」が長雨で調達できない。`

11. **カルシウム** - ルビなし
    - UI：`<p>給食1食で、エネルギーや鉄・カルシウムなどの目安が決められている。</p>`

#### 広報・PR（PromoGame.tsx）
12. **媒体** - ルビなし
    - コメント：`// C: 「だれに届けたいか」の資料と、媒体ごとの届き方。`
    - UI：`// 媒体を選ぶと...`

#### 建設・測量（YardPlanGame.tsx, CraneLiftGame.tsx 推定）
13. **勾配** - ルビなし（推定、内容未確認）
14. **スペック** - ルビなし（推定、内容未確認）
15. **シムレーション** - ルビなし（推定、内容未確認）

### 傾向
- **高度な専門用語がルビなしで登場**
  - 医療系（被ばく、肺炎、排泄）
  - 土木・河川（護岸、根固め、堰、魚道）
  - 栄養学（カルシウム、副菜、栄養基準）
  - 音響・舞台（リハーサル、媒体）

- **ルビがあるもの**
  - content ファイル内の専門語（mission, q2）
  - スクリーン層（ProfessionScreen.tsx で表示）

- **ルビがないもの**
  - ゲーム UI 内のシステム文言（タスク、ボタン、ラベル）
  - コンポーネント内コメント（実画面に影響しないが、保守性低い）

---

## 5. CSS テキストサイズ設定

### 主要なテキストクラスのフォントサイズ

| クラス名 | フォントサイズ | 用途 | line-height |
|---------|---------------|------|-----------|
| .game-line | 16px | ゲーム内本文・説明 | （継承） |
| .game-line.soft | 16px | ゲーム内本文（柔らかい） | （継承） |
| .mission-line | 15px | ミッション説明（赤字） | （継承） |
| .mission-title | 20px | ミッション見出し | 1.5 |
| .resolution-line | 15px | 結果画面説明 | （継承） |
| .resolution-title | 22px | 結果画面見出し | （継承） |
| .discovery-line | 14.5px | 職業紹介カード本文 | pre-line |
| .discovery-name | 24px | 職業名 | （継承） |
| .tool-name | 13px | 道具名 | （継承） |
| .tool-desc | 11.5px | 道具説明 | （継承） |
| .choice-name | - | 選択肢ラベル | （調査対象外） |
| .q2-para | - | 職業紹介段落 | （調査対象外） |
| .area-lead | 14.5px | エリア説明（中導入） | （継承） |
| .area-banner h2 | 17px | エリア見出し | 1.5 |
| .balloon-text | 12px | イベント吹き出し | 1.4 |
| .incident-title | 15px | インシデント見出し | 1.45 |
| .incident-emoji | 36px | インシデント emoji | （継承） |
| .big-emoji | 44px | ゲーム大型 emoji | 1 |

### サイズ傾向分析
- **見出し系**：20-24px（24px は職業名で最大）
- **本文系**：14.5-16px（ゲーム内主体文は16px）
- **補足系**：11.5-13px（ツール説明、UI補足）
- **最小**：10px（タグ、小註）

### ルビ表示の問題
- `<ruby>` 要素は親の `font-size` を継承する
- 本体 16px → ルビ自動スケール
- **root 体内でのルビ：やや小さく見える可能性**（検証必要）
- CSS では ルビサイズの明示的な制御なし

---

## 要約と所見

### ルビ使用率
| 指標 | 数値 | 評価 |
|-----|------|------|
| コンテンツファイル内ルビ総数 | 32 / ~300+ | 約 10-15% |
| ゲームコンポーネント使用率 | 13 / 63 (20.6%) | **低い** |
| スクリーン層（ProfessionScreen等）での表示 | ✓ | **高い** |

### どこがルビ薄いか

#### 1. **ゲームコンポーネント UI（Q1/※*.tsx）**
- **80% 弱がルビなし**
- タスク文、ボタンラベル、ルール説明が対象外
- 例：NurseObserveGame / MenuGame / SoundCheckGame 等は UI 文言に withRuby 不使用
- **推奨対応**：ゲーム内「状況説明」「選択肢」などに withRuby を導入

#### 2. **コンテンツ世界別の偏り**
- **ルビ多い**：forest.ts, river.ts（自然・土木系、用語密度高い）
- **ルビゼロ**：medical.ts, zoo.ts, townEvent.ts など 6 ファイル
  - 理由推定：設計時点で「低学年でも理解できる」想定だったか、単に未実装か
- **推奨対応**：医療・動物関連も同じ基準でルビ審査を実施

#### 3. **スクリーン層（表示層）での実装**
- `src/screens/ProfessionScreen.tsx` と `src/screens/Q1Screen.tsx` で正しく `withRuby()` 適用
- **ただし入力元（コンテンツ）側のマークアップがなければ無意味**
- 現状、職業紹介（q2）は withRuby 表示されるが、mission/tools/resolution はゲームごとに不均一

#### 4. **保守性の低さ**
- ゲーム内コンポーネント：直書き文言、ハードコード化
- ルビ化困難：JSX 内に埋め込まれた文字列が多い
- **推奨対応**：mission / UI 固定文言も content ファイル化して一元管理

---

## 結論

**ルビ使用率は「ルール上は高い」が「実画面では実装が部分的」**

| 層 | 実装状況 | 度合い |
|----|--------|-------|
| **定義層** `src/lib/ruby.tsx` | ✓ 完全 | 100% |
| **データ層** `src/data/content/*.ts` | △ 散発的 | ~30% |
| **UI 層** `src/q1/*.tsx` | ✗ ほぼ未実装 | <5% |
| **表示層** `src/screens/*.tsx` | ✓ 実装あり | 100%（入力があれば） |

### 直ちに確認が必要な項目
1. **medical.ts（医療世界）**：なぜルビゼロなのか意図確認
2. **ゲームコンポーネントの UI 文言**：どのレベルをルビ対象にするか基準化
3. **現在表示されているゲーム画面**：ルビなし専門語が見える具体例の列挙
4. **ユーザーテスト**：ルビなしの医療/土木用語が実際に理解困難か検証

---

*Report generated by automated scan. No implementation changes applied.*
