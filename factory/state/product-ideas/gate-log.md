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
