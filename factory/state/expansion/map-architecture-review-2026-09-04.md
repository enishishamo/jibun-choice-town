# Map Architecture Review（2026-09-04）— 比較・推奨のみ、実装なし

Human Reviewの指摘: 現在のMapは「district画像同士の配置・重なりを微調整
するだけでは不十分」——scale mismatch / disconnected terrain / visible
asset boundaries / floating-island appearance / excessive blank space /
inconsistent visual depth / awkward overlap / clipped districts /
unclear spatial continuity。実機screenshot
（`map-architecture-review-2026-09-04/desktop-overview.png`等）で確認:
中心の町イラストは町全体を俯瞰する広い画角、周辺の各districtイラストは
数棟だけを写す近接ジオラマ——**個別に生成されたイラストがそもそも
同じ世界スケール/画角/光源を共有するよう作られていない**。これはCSSの
配置調整では解決できない構造的な問題であり、指示通りMap Architecture
そのものを比較のみ行った（実装は行っていない）。

## 比較した3案

`factory/harness/map-architecture-review-prompt.md`により、Claude自身の
分析とCodex独立レビュー（互いの結論を見せずに実施）の両方を取得。

### A. ONE CONTINUOUS WORLD MAP
harbor→town→forest→station→hillが同じterrain/road/river上で連続する、
一枚の一貫した縮尺のイラスト/地形にする。

### B. DELIBERATE ISLAND / STYLIZED-CONSTELLATION MAP
「別々の場所である」ことを隠さず、統一された台座/縁取り・強い接続パスで
意図的な様式として見せる。既存の全illustrationをそのまま再利用（追加GPT
資産ゼロ）。

### C.（Codex提案の第三案）Hierarchical Atlas with Focused District Views
Overview（一覧）層は簡略化・統一されたmarker/thumbnailのみとし、
「並んだ複数の full-scale illustration」を同時に見せない。district単体へ
入った時だけ、既存の高品質illustrationをその district の適切な縮尺で
フル表示する。現在の実装にすでにある「overview→district focus」の
2段階構造を土台に、overview側の見せ方だけを抽象化する方向性。

## スコア比較（0-100、ART_PRODUCTION_COSTのみ低い方が良い）

| 軸 | A: 連続世界 | B: 意図的island | C: 階層的atlas |
|---|---|---|---|
| WORLD_CONTINUITY | 96 | 54 | 72 |
| EXPLORATION_DESIRE | 88 | 76 | 84 |
| GAME_FEEL | 85 | 88 | 90 |
| MOBILE_READABILITY | 58 | 79 | 94 |
| SCALABILITY_50_WORLDS | 32 | 67 | 94 |
| VISUAL_COHESION | 94 | 82 | 91 |
| INTERACTION_QUALITY | 75 | 84 | 92 |
| ART_PRODUCTION_COST（低いほど良い） | 96 | 12 | 28 |
| FUTURE_EXPANSION | 28 | 73 | 95 |
| JIBUN_CHOICE_PHILOSOPHY_FIT | 67 | 86 | 94 |
| **合成スコア**（ART_PRODUCTION_COSTを反転して単純平均） | **62.7** | **77.7** | **87.8** |

（出典: `factory/state/expansion/map-architecture-codex-review-2026-09-04.json`）

## CLAUDE_RECOMMENDATION

初期の自分の分析ではB（意図的island、追加コストゼロで確立済み研究知見
`factory/state/expansion/map-research.json`の「テーマ地域・地区への分割」
パターンとも一致）に傾いていたが、CodexのCへの指摘——特に
「overview層で複数のfull-scale illustrationを同時に並べる」こと自体が
scale mismatchの根本原因であり、Bもその配置様式を維持する限り
50 world規模では手狭になる——は的確であり、Cへ合意する。Cは現在の
実装（region overview⇄district focusの2階層）を土台にでき、Bで想定した
「統一された台座・接続パス」というvisual語彙もoverview側のmarker/
thumbnailデザインに転用可能なため、AとBの良い部分を両方取り込める。

## CODEX_RECOMMENDATION

C（Hierarchical Atlas with Focused District Views）。理由: 現在の画面は
「単に磨きが足りない」のではなく、根本的に異なる表現スケールを同一平面上に
同時表示していることが問題であり、CSSブレンドでは解決しない。Aは最も
連続性が高くなるが、art costとfuture expansionの観点で現実的でない。
Bは低コストな近い将来の改善として妥当だが、50 locationに近づくにつれ
一枚のconstellationとしては扱いにくくなる。Cはoverview側のnavigationと
detailの表示を分離することで、各professionの個性を保ったまま、
モバイルでも拡張性でも最も筋が良い。

## 収束

両者ともC。Human Reviewでも度々あったパターン（独立した2つの評価が
互いを見ずに同じ結論へ収束）と同様、今回も一致した。

## Human Product Decisionが必要な点（Codexが明示的に指摘）

- Mapが「文字通りの地理」を表現するか、「職業/場所をめぐる概念的な旅」を
  表現するかという前提そのもの
- district入場に二段階navigation（overview→focus）を挟むことを許容するか、
  それとも1タップでの即時アクセスを要求するか
- プロダクトロードマップが本当に約50 locationへの拡張を見込んでいるか
  （見込んでいなければBという選択肢も依然として有効）
- overview側の統一markerやthumbnailを既存illustrationの加工から作れるか、
  それとも新しいdistrict illustrationの再発注が必要になるか
- region分けの軸を地理・職業ファミリー・学習進度など何にするか

これらはいずれも`factory/rules/product-identity-gate.md`の
「新しい主要navigation architecture」「世界観・ブランドidentityの大きな
変更」に該当するため、選定・実装は行わない。

## 現在のMapのstatus

`VISUAL_ARCHITECTURE_REVIEW_REQUIRED`。現在のdistrict collage
architectureは既成事実として扱わない。district単位のCSS微調整
（`district-focus-camera-zoom-tuning`等）は、このアーキテクチャ決定に
よって前提が変わりうるため、決定が出るまで単独では追加投資しない
（`factory/state/backlog/ui-ux-backlog.md`に反映済み）。

## Release Safety

すべてfeature/harness-bootstrap（Development Track）上での比較・分析の
み。Map architectureのproduction実装は行っていない。Stable（main /
stable-prototype-v0.1）には一切触れていない。
