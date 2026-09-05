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
