# Map Architecture Prototype Comparison（2026-09-04）— A vs C、比較のみ

Human Product Decisionにより、比較対象を最終候補2案（A: 連続世界地図 /
C: 階層的atlas）へ絞り、production実装なしのLOW-COST prototypeを作成して
比較した。**production実装は行っていない**（`public/dev-prototypes/`配下の
独立した静的HTML、React appからは完全に切り離されており、
`src/`配下のコードは一切変更していない）。既存のGPT illustrationは
再利用のみ、新規GPT illustrationの生成は行っていない。

## Prototype A: ONE CONTINUOUS WORLD

`public/dev-prototypes/prototype-a-continuous-world.html`

- 2400×1700の仮想canvasを1枚の連続terrain（抽象的なSVG色分け＋道＋川）として実装
- 各地点は既存illustrationの一部を丸くcropした「pin」（全地点で統一サイズ）として、その連続terrain上に配置——scale mismatchが起きないよう、full-scale illustration同士を並べては表示しない
- pan/tap arbitrationは今回のInteraction Harnessで検証済みの手法（pointer capture・cancel・8pxスロープ）をそのまま流用
- fog（未発見エリア）・雲の漂う演出・呼吸するpinアニメーションで最低限の「世界感」を付与

**重要な注意**: これは「本番のcontinuous illustrationがあればどう感じるか」を
厳密には再現していない——今回は新規GPU予算ゼロという制約のもと、
既存illustrationの小さなcropを仮のランドマークとして置いただけであり、
実際にterrainがかなり空疎に見える。IDEAL_UX_SCOREは「もし専用に
設計されたcontinuous world artが実在したら」という前提で別途評価した
（下記）。

## Prototype C: HIERARCHICAL ATLAS

`public/dev-prototypes/prototype-c-hierarchical-atlas.html`

- overview層は1100×1500の小さな世界——全pinがほぼ一目で見えるが、
  わずかにpanできる余地を残し、呼吸するアニメーション・漂う雲・
  「something's happening」signal・fogを配置し、「menuではなく生きた
  ミニチュア世界」を狙った
- pin tap→カメラズームで画面いっぱいに、その地点の**実際の承認済み
  illustration**をフル表示するfocus viewへ遷移（新規artなし、既存資産の
  再利用のみ）
- 「← 全体」で戻る

## Mobile Screenshot（比較用に添付）

`factory/state/expansion/map-architecture-prototypes-2026-09-04/` に格納:
`a-mobile-initial.png` / `a-mobile-panned.png` / `a-desktop.png` /
`c-mobile-overview.png` / `c-mobile-focus.png` / `c-desktop.png`

## Child-Eye Adversarial Review（Codex、独立実施）

`factory/harness/map-prototype-review-prompt.md`によりCodexへ
screenshotのみ渡し（互いのscoreは見せていない）実施。

| 質問 | A | C |
|---|---|---|
| 説明文なしで触りたくなるか | Yes | Yes |
| 画面外に何があるか見たくなるか | **Yes** | **No**——「ほぼ全部がすでに見えているので、端の向こうへの期待が薄い」 |
| menuではなくworldに見えるか | **Yes**（ただし現状の空疎さは未完成感あり） | **No**——「中心とつながった均等サイズの選択肢は、連続世界というよりレベル選択メニューに見える」 |
| 一つ遊んだ後、別の場所へ行きたくなるか | Yes | Yes |
| 学習アプリよりゲーム感が強いか | Yes | Yes（ただしoverviewは教育アプリの選択画面に近いとも） |

**この結果は重要な設計上の警告を含む**: 指示にあった
「Cでもoverviewが単なるregion/category selectorになった場合はFAIL」が、
今回作ったCプロトタイプでまさに一部再現された。これは
**階層的atlasという設計思想そのものの欠陥ではなく、今回のprototypeが
「ほぼ全地点を一目で見せる」という実装判断をしたことによる副作用**の
可能性が高い——overview自体をもっと部分的にしか見せない・pan必須にする
（Aのように画面外にもっと存在を感じさせる）「ハイブリッドC」を作れば
改善する余地がある。今回はA/C 2択の比較で停止する指示のため、
その3つ目の変種は作っていない。

## スコア（0-100、Codex独立採点。COST系は低いほど良い）

| 軸 | A | C |
|---|---|---|
| IDEAL_UX_SCORE | 91 | 84 |
| CURRENT_IMPLEMENTATION_COST（低いほど良い） | 22 | 31 |
| FUTURE_ART_COST（低いほど良い） | 94 | 27 |
| SCALABILITY（50 world規模） | 42 | 88 |
| **GAME_DESIRE**（最重要） | **88** | 74 |
| WORLD_CONTINUITY | 97 | 58 |
| **DISCOVERY_CURIOSITY**（最重要） | **95** | 64 |
| MOBILE_INTERACTION | 63 | 92 |
| JIBUN_CHOICE_PHILOSOPHY_FIT | 82 | 94 |
| **WORLD_FEEL**（最重要） | **94** | 69 |

## CODEX_RECOMMENDATION

**A**。「GAME_DESIRE・DISCOVERY_CURIOSITY・WORLD_FEELという最重要指標で
Aが明確に勝る。Cは production可用性とscalabilityの問題を、世界を
atlas型セレクターに変換することで解決しているに過ぎない。Aを選ぶなら
非常に高い長期art costと拡張上の制約を明示的に受け入れること。production
実現性が最優先の制約であるならCがより安全」。

## CLAUDE_RECOMMENDATION

Codexの指摘（最重要3軸でAが勝る、かつ今回のCプロトタイプがoverviewで
「ほぼ全部を一度に見せた」ことで意図せずmenu的になった）は的確であり、
同意する。ただし以下の留保をつけたい:

1. **SCALABILITY_50_WORLDSはart予算の問題ではなく構造的な問題**——
   仮に理想的なcontinuous illustrationが存在しても、50地点規模の
   単一canvasは「探索の迷子」「制作・追加のたびに全体を触る必要」という
   問題を抱え続ける。IDEAL_UX_SCORE=91は「今の5地点規模」における評価
   であり、この前提が崩れるとAの優位性も崩れる。
2. **今回のCプロトタイプの弱さは実装判断の産物である可能性が高い**——
   overviewをもっと部分的にしか見せない・pan必須にする「ハイブリッドC」
   （階層構造は保ちつつ、overview自体にAの「画面外への期待」を持たせる）
   を試せば、C側のGAME_DESIRE/DISCOVERY_CURIOSITY/WORLD_FEELスコアは
   相応に改善する余地があり、今回の比較だけでCを構造的に劣ると結論
   づけるのは早計。

以上により、Claudeとしては「現在のロードマップが50 world規模への拡張を
本気で見込んでいるか」が最終判断の分水嶺になると考える。見込んでいる
なら、Aの持つ短期的な魅力に対して長期的な制作コスト・拡張性のリスクが
上回る可能性が高く、Cを土台にした改良（ハイブリッド案）を先に試す価値が
ある。見込んでいない、または当面5〜10地点規模を維持するなら、Codexの
推奨通りAの持つWORLD_FEEL/DISCOVERY_CURIOSITYの優位性を取りに行く価値は
十分ある。

**両者の収束点はない**——前回（アーキテクチャ抽象比較）はA/C双方の
分析がCへ収束したが、今回（実際に触れるprototypeでの評価、かつ
GAME_DESIRE/DISCOVERY_CURIOSITY/WORLD_FEELを最重要視する条件下）では
CodexはAを推し、Claudeは「ロードマップの前提次第」で判断を留保している。
これは偽の一致を作らず、正直に報告する。

## Human Product Decisionが必要な点（Codex指摘＋Claude追加）

- world feelと探索欲求のために、高額な連続illustrationの制作・
  将来の保守コストを受け入れるか
- プロダクトロードマップが本当に10倍規模（約50地点）への成長を
  地図artを作り直さずに支える必要があるか
- モバイルでのdiscoverabilityを「子どもが自由にpanすることを学ぶ」
  前提に置いてよいか、明示的なnavigation補助が必要か
- 各地点の個別に承認されたillustrationをそのまま活かすことと、
  全地点が1つの物理的に連続した世界の一部として見えることの
  どちらを優先するか
- （Claude追加）「ハイブリッドC」variantを追加で試作する価値があるか、
  それとも今回の2択のままHuman決定へ進むか

## Release Safety

すべてfeature/harness-bootstrap（Development Track）上、
`public/dev-prototypes/`の独立静的prototypeのみ。`src/`配下のproduction
コードは一切変更していない（tsc/build確認済み、差分なし）。Stable
（main / stable-prototype-v0.1）には一切触れていない。paid API/API key
は使用していない。

## 追記（2026-09-04、Human指摘によるスコア再検証）

### FUTURE_ART_COSTの正規化について

このファイルの表は生の軸別スコアをそのまま並べただけで、**合成
（単一の数値へのマージ）は行っていない**——したがってCOST系軸
（CURRENT_IMPLEMENTATION_COST/FUTURE_ART_COST、低いほど良い）を他の
品質軸（高いほど良い）と混ぜて平均する操作自体を行っておらず、
方向性の取り違えバグは存在しない。合成スコアを実際に計算したのは
別ファイル`map-architecture-review-2026-09-04.md`（A/B/C抽象比較、
prototype作成前の回）のみで、そちらは表内に明記の通り
「ART_PRODUCTION_COSTを反転して（100-cost）から単純平均」と正しく
処理していた。確認の結果、問題は見つからなかった。

### JIBUN_CHOICE_PHILOSOPHY_FIT（A=82 / C=94）の独立再検証

ご指摘の「実装しやすい／情報整理しやすいことをphilosophy適合と混同して
いないか」を検証するため、このプロジェクトの既存決定文書
`factory/state/expansion/map-architecture-decision.md`（2026-09-03、
今回のセッションより前に確定していたもの）を確認した。

そこには既に以下が明記されている（§選定理由「実装の容易さでは選んで
いない」）:
> (a) event-first哲学の維持（シグナル=出来事が呼ぶ。職業分類は前面に
> 出ない）(c) 「世界の中を見ている」感覚（連続キャンバス+ズーム演出、
> 画面カット排除）

これはCの「各districtを別々の場所として提示する」設計よりも、Aに近い
「一枚の連続したキャンバスの中にいる」という体験のほうに、
JIBUN CHOICE自身が過去に明文化した哲学が寄っていることを示す。

**結論**: Codexの過去のJIBUN_CHOICE_PHILOSOPHY_FITスコア（A=82<C=94）は、
「異なる職業・場所を無理に地理的に隣接させるのは不自然」という一般的な
ゲームデザインの理屈からは筋が通っているが、**JIBUN CHOICE自身が
すでに明文化していた「連続キャンバス+ズーム、画面カット排除」という
既存哲学とは逆方向の評価**になっていた。これは「実装しやすさ／情報
整理しやすさ」を直接philosophy fitと混同したとまでは言えないが、
一般的なゲームデザイン論を優先し、**プロジェクト固有の既存決定を
参照していなかった**という意味で、Independent Reviewとしては不十分
だったと判断する。Human Decision（A採用）は、この既存哲学とも整合して
おり、妥当だったと評価する。
