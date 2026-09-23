# WORLD DESIGN — 全体MAP / パカッ / WORLD MAP

制定: 2026-09-20（Human Decision）。

## 1. 全体MAP（LOCKED の骨格）

全体MAPは「普通の街に学校・病院などが並んでいる」世界**ではない**。
**巨大な身近なモノ**がランドマークとして広い世界に点在している。

現在想定している最初の WORLD:

| WORLD | 入口となる巨大オブジェ | 状態 |
|---|---|---|
| 給食 | 閉じた**お弁当箱** | LOCKED（最初に作る） |
| テクノロジー / エンジニア系 | OPEN（Reference B ではゲーム機のような形だが未確定） | 詳細設計は未着手 |
| 医療 | OPEN（Reference B では救急箱のような形だが未確定） | 詳細設計は未着手 |

### デザイン（LOCKED）

- 明るい 3D clay / toy diorama
- clear / bright / saturated colors: sky blue, green, coral / orange, yellow, cream
- 暗い・濁った・レトロな色にしない
- 淡すぎるパステル一辺倒にしない
- 小さい建物や装飾を大量に置きすぎない
- 巨大オブジェがランドマークとして**読める**
- 世界は**広く**感じる
- スマホ**縦画面**

### 地形の整合性（LOCKED）

- 全体MAPでは、給食のお弁当箱の**真下に川はない**。
- WORLD へズームするとき、全体MAPの地形との整合性を維持する。
  **別の場所へ突然ワープしたように見せない。**

### 固定ではないもの（OPEN — Reference B から確定しない）

exact color values / exact object positions / typography / UI spacing / labels / decorative details

## 2. 「パカッ」のルール（LOCKED）

巨大オブジェを触ると、**そのモノの内部に隠れていた社会**が現れる。

```
閉じた巨大なお弁当箱
 ↓ 近づく
 ↓ パカッ
 ↓ 弁当箱の内部に「給食を支えている社会」が広がる
```

これは単なるステージ選択 UI ではない。コンセプトは
**「身近なモノを開けると、その向こうに知らなかった社会が入っている」**。

- OPEN: 「近づく」の操作（タップ / ピンチ / 自動ズーム）、開く演出の長さ、
  開いた後のカメラ位置。Ver.1 の MAP camera 仕様（district focus はカメラを動かさない等）を
  そのまま流用するかは未決定。
- Storyboard Reference（2026-09-21、GPT 作成）: 6 コマ `MAP → APPROACH → DISCOVERY → UNLATCH →
  PAKKA! → WORLD` が連続動作・カメラ・相棒の演技の**方向性**を示す
  （`design/v2/reference/MANIFEST.md` 参照）。各コマの絵を最終 asset にはせず、英語ラベルも
  実画面に使わない。上記 OPEN の決定の代わりにはならない。

## 3. 給食 WORLD MAP（LOCKED の骨格）

開いた巨大なお弁当箱の内部に、給食を支える社会がミニチュアとして存在する。

現在の主な要素（順序は「社会的なつながり」の順。配置は OPEN）:

| 要素 | 想起させる視覚表現（例） | Ver.1 の対応ゲーム |
|---|---|---|
| 農業 / 生産 | 🌱 | farmer-lunch (`sow_and_grow`) |
| 配送 | 🚚 | logistics-lunch (`load_and_route`) |
| 栄養・献立 | 🍲 / 📋 | nutrition-lunch (`drag_and_drop`) ← **最初に作り直す** |
| 調理 | 🍲 | cook-lunch (`inspect_and_measure`) |
| 学校で食べる | 🍴 | （Ver.1 に対応ゲームなし。OPEN） |
| リサイクル | ♻️ | recycle-lunch (`sort_out`) |

### 職業名を出さない（LOCKED）

最初から「農家」「配送業」「栄養教諭」など職業名を大量に表示しない。
まず 🌱 🚚 🍲 🍴 ♻️ など、**行為や出来事を想起する視覚表現**で「ここ何だろう？」を作る。

## 4. WORLD MAP の進行表現（LOCKED）

WORLD MAP 自体を進捗表示にする。

| 状態 | 表現 |
|---|---|
| 未体験 | アイコンは gray / muted、道は通常状態 |
| 体験済み | アイコンに色がつく、場所が少し明るくなる |
| 関連する複数の体験をした | 場所同士をつなぐ**道に光が走る** |

例:
```
農業を遊ぶ → 🌱 が点灯
配送を遊ぶ → 🚚 が点灯 → 🌱 から 🚚 への道が光る
さらに遊ぶ → 光のネットワークが広がる
```

最終的に「一つの給食の裏に、こんなに多くの人・仕事がつながっていた」ことを、
**説明文ではなく WORLD MAP そのもので**理解できるようにする。

- OPEN: どの場所とどの場所を「関連」とみなすか（道のグラフ定義）。Ver.1 の給食編は
  incident 間に依存関係を持たない（`audits/ver1-school-lunch-as-is.md`）ため、新規定義が必要。
- NEEDS_VALIDATION: 「つながり」が現実の給食サプライチェーンと矛盾しないこと。

## 5. WORLD Event State（参考・OPEN）

Reference E の「たいへん！今日の給食が間に合わないかも！」のように、

```
WORLD の中で出来事が発生
 ↓ 複数の場所に変化が起きる
 ↓ 気になる場所を触る
 ↓ 仕事の行為そのものを PLAY する
```

という体験構造は採用候補。ただし Reference E の画面自体は完成 UI ではなく、
説明文・「！」マーク・進捗バーをそのまま採用する必要はない
（PLAY FIRST に照らして個別判断）。

## 6. Ver.1 MAP との関係（記録）

Ver.1 の MAP は「生きた町のアトラス」（`src/data/districts.ts`、
`public/assets/world/continuous-world.png` 1 枚の連続イラスト＋ district focus）であり、
Ver.2 の「巨大オブジェ点在」構造とは**異なる architecture**。
Ver.1 MAP は `archive/ver1` で参照可能。Ver.2 MAP の実装方式（新規画面 / 既存
`WorldMapScreen` の差し替え）は [MIGRATION_PLAN.md](MIGRATION_PLAN.md) の OPEN 項目。

## 7. WORLD 画像の Art QA HARD GATES

```
□ bright / high-key
□ adopted toy / clay style
□ 全画面で色調が大きくズレていない
□ 不要な装飾で clutter していない
□ Overall MAP と WORLD MAP の地理的連続性がある
□ job name を PLAY 前に不用意に露出していない
□ image / motion で表現できることを文章で説明しすぎていない
```
