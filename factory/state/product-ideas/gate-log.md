# Product Identity Gate — 発火ログ

`factory/rules/product-identity-gate.md` の運用ログ。発火のたびに
末尾へ追記する（過去の記録は書き換えない）。

---

## entry-2026-09-04-01: True Home mascot（Autonomy Boundary incident）

このentry自体がPRODUCT_IDENTITY_GATE制定のきっかけであり、
遡って記録するもの。

- **proposed_change**: True Home（`src/screens/HomeScreen.tsx`）に、
  JIBUN CHOICEのbrand mascot/キャラクターを新設し配置する
  （`true-home-mascot-character` として`factory/state/art/gpt-asset-requests.json`
  の`backlog_low_priority`へGPT_ASSET_REQUESTを提出した）。
- **why_ai_considered_it**: True Home + Mobile Map Simplificationの
  Codex独立レビューで、HOME_GAME_FEELが4round中3round連続で閾値未達
  （68/68/67、閾値80）となり、Codexの指摘（「no character, no sense of
  an ongoing world」）を根拠に、CSSのみでの改善が尽きたと判断し、
  GPT_ASSET_REQUESTという形でAI自身が次の対応を選定・発行した。
- **affected_core_assumption**: 「JIBUN CHOICEにbrand character/mascotが
  存在するかどうか」は、世界観・ブランドidentityに関わるProduct Decision
  であり、QA scoreの改善タスクの中で暗黙に決めてよい前提ではなかった。
- **options（本来Humanに提示すべきだったもの）**:
  1. mascot/キャラクターを新設する（今回AIが自動選択した案）
  2. True Homeのレイアウト・コピー・アニメーションなど既存要素内で
     さらに改善を試みる（キャラクターなしでの上限を探る）
  3. HOME_GAME_FEELの閾値・測定方法自体を見直す
     （現在のCodexプロンプトが「キャラクター有無」に強く重み付けされて
     いる可能性を検証する）
  4. 対応を保留し、Development Track backlogにopenのまま残す
     （閾値未達を許容し、他の優先度の高い項目を先に進める）
- **recommendation**: 上記4案のいずれかをHumanが選ぶべきだった。AIとして
  IDEATION/OPTIONS/PROS-CONSまでは妥当な範囲だが、
  GPT_ASSET_REQUESTの発行（=SELECT + GENERATE PRODUCTION ASSETへ向けた
  実質的な意思決定）は越権だった。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: true
- **結果**: `true-home-mascot-character` はHumanの指示により
  `REJECTED_NOT_APPROVED` へ変更。画像生成・代替SVG制作・実装は
  一切行っていない（提出時点から実装には未着手だった）。
  関連するアイデア（「興味から育つ何か」）は別途
  `idea-001-interest-grown-companion.md` にDESIGN_RESERVEDとして記録。

---

## entry-2026-09-04-02: World Map architecture reconsideration

- **proposed_change**: 現在のWorld Map（中心の町イラスト＋周辺5district
  イラストを1つの地域canvasへ配置する構成）を、根本的に異なる
  architectureへ変更する可能性——3案（A: 一枚の連続世界地図へ再構築、
  B: 意図的なisland/constellation様式への統一、C: overview層を簡略化し
  district focus時のみフル表示する階層的atlas）を比較。
- **why_ai_considered_it**: Human Reviewが実機で「district画像同士の
  scale mismatch・floating-island・visible asset boundaries」を指摘し、
  CSSでの配置調整では解決できない構造的問題と判断されたため。
- **affected_core_assumption**: 「Mapは複数の独立したillustrationを
  1つのcanvasに並べる」という現行の実装前提、および将来のworld数拡張
  時のnavigation architecture。
- **options**: A（連続世界地図）/ B（意図的island）/ C（階層的atlas）
  ——詳細は`factory/state/expansion/map-architecture-review-2026-09-04.md`。
- **recommendation**: Claude・Codex双方の独立分析がC（階層的atlas）へ
  収束。ただしこれは「新しい主要navigation architecture」
  （`product-identity-gate.md`対象）に該当するため、選定・実装は行わず
  比較・推奨までで停止。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: true
- **結果**: 現在のMapを`VISUAL_ARCHITECTURE_REVIEW_REQUIRED`とし、
  district単位のCSS微調整（例: `district-focus-camera-zoom-tuning`）は
  この決定が出るまで単独では追加投資しない方針とした
  （`factory/state/backlog/ui-ux-backlog.md`に反映済み）。

**追記（同日、Human Product Decisionによる絞り込み後）**: Humanの判断で
最終候補をA（連続世界地図）とC（階層的atlas）の2案に絞り、production
実装なしのLOW-COST prototype（`public/dev-prototypes/`、既存assetのみ・
新規GPT art生成なし）を作成して比較した。詳細は
`factory/state/expansion/map-architecture-prototype-comparison-2026-09-04.md`。
最重要指標（GAME_DESIRE/DISCOVERY_CURIOSITY/WORLD_FEEL）ではCodex独立
レビューがAを推奨（Cプロトタイプのoverviewが「menuに見える」という、
Human自身が事前に定義したFAIL条件に一部該当したため）。Claudeは
SCALABILITY_50_WORLDSの構造的懸念と、今回のCプロトタイプの弱さが
実装判断（overviewで全地点をほぼ同時に見せた）に起因する可能性を理由に、
最終推奨をロードマップの前提（50 world規模を本当に見込むか）次第として
留保——2つの独立評価が偽の一致を作らず、そのまま報告した。
production実装・選定はまだ行っていない。HUMAN_PRODUCT_DECISION_REQUIRED
のまま。

**追記（同日、Human Decision確定後）**: Humanが基本architectureとして
A（連続世界地図）を採用し、「50 worldを一枚に全表示しない」ための
洗練案として「A2: Continuous World + Semantic Zoom」（3階層: WORLD→
AREA→EVENT、同一canvas上でカメラpan/zoomのみ、画面遷移なし）を指定。
production実装なしのprototypeを作成・自動検証・Codex独立レビューを
実施した結果（詳細:
`factory/state/expansion/map-a2-prototype-report-2026-09-04.md`）:
SCALABILITY_50_WORLDS=93（PASS、DOM node数がtier scopeで収まることを
実測）、gesture arbitration（pan/tap分離・誤操作耐性）は自動テスト
6/6 PASS——技術的な骨格は健全。一方GAME_DESIRE=34/DISCOVERY_CURIOSITY=48/
WORLD_FEEL=43/MOBILE_INTERACTION=58/MAP_CLUTTER=36はいずれも閾値未達で
overall FAIL。根本原因はCodex曰く「LEVEL 2/3のsub-locationが地区中心の
周りにリング状に散らされているだけで、場所同士の空間的な意味的つながりが
なく、結局『地図上の選択メニュー』に戻ってしまっている」——これは
C案を却下した理由（overviewがmenuに見える）と**同じ失敗モードが、
今回はzoom後の階層で再発した**ことを意味する。ClaudeもCodexに同意し、
これは見た目（placeholder art）の問題である前に配置ロジックの問題である
可能性が高いと判断——GPT_ASSET_REQUESTはまだ作成せず、次のイテレーション
（Level1の道路網をLevel2/3のローカルストリートへ延長する等の
レイアウト再設計）を先に試すべきと記録した。production実装・GPT資産
発注のいずれも行わず、Humanの確認・次の指示待ちで停止。
HUMAN_PRODUCT_DECISION_REQUIRED = true。

**追記（同日、Human Correction後 — A3）**: Humanから重要な補正:
Continuous Worldの目的は空間探索ゲームの構築ではなく、production Mapの
VISUAL COHESION（視覚的一体感）の修復である、との明確化。これを受けて
A2の抽象sub-location層を廃止した「A3: Cohesive Continuous World」
（2階層、eventはillustration上へ直接配置）を作成・検証した結果
（`factory/state/expansion/map-a3-prototype-report-2026-09-04.md`）:
gesture arbitration・scalabilityは自動テストでPASSしたが、
**VISUAL_COHESION=24**（閾値90）を筆頭にoverall FAIL。Codex独立
レビューの結論: 既存district illustrationは互いに異なるカメラ角度・
縮尺で生成されており、CSSのフェザー処理・統一filterでは投影法・縮尺の
不一致そのものを解消できない——これはHuman Directive自身が事前に
警告していたCURRENT_ASSET_COMPATIBILITYの限界であり、実装力の不足では
ない。Codexの結論に基づき`continuous-world-base-illustration`
（JIBUN CHOICE世界全体を単一カメラ角度・縮尺・光源で描く新しい連続
illustration）のGPT_ASSET_REQUESTを`factory/state/art/
gpt-asset-requests.json`へ記録した——**これは生成の承認ではなく、
必要になるコストをHumanへ提示するもの**（`status:
"IDENTIFIED_NOT_YET_APPROVED"`）。production実装・GPT art生成のいずれも
行わず、Humanの確認・次の指示待ちで停止。HUMAN_PRODUCT_DECISION_REQUIRED
= true。
