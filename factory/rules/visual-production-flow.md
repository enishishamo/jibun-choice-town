# VISUAL PRODUCTION FLOW — Auto Review Loop + Human Gate

2026-09-06 制定。適用範囲: visual / UI / game screen制作
（Home、World Map等の画面実装）。`factory/MASTER.md`の`/new-world`
コンテンツpipeline（GATE 1/GATE 2でイベント・職種を選ぶ工程）とは別軸——
そちらは新しい「世界（イベント編）」のコンテンツ制作、このファイルは
「画面のvisual/UI」制作の進行ルール。両者は独立して併存する。

## きっかけ

Home Visual Refresh（2026-09-05）→ Home Design Review（2026-09-06）の
往復で、Humanが「実装を見る→指摘→AIが再レビュー→修正指示→また見る」を
毎回繰り返す状態になった。Humanの役割は
**PRODUCT OWNER / PRODUCT TASTE / FINAL DECISION**であり、
「AIの制作進行・細部添削」ではない。既存方針の範囲内で判断できる
Design Review・Critique・Repair・QAは、Factory内部で自動的に完結させる。

## 標準Production Flow

```
SPEC
 ↓
DESIGN / RESEARCH
 ↓
IMPLEMENTATION
 ↓
375px SCREENSHOT
 ↓
AUTO REVIEW TEAM
 ↓
REPAIR DECISION
 ↓
必要なら AUTO REPAIR（最大1回）
 ↓
SCREENSHOT 再取得
 ↓
TECHNICAL / INTERACTION QA（factory/rules/qa-rules.md、既存harness scripts）
 ↓
INDEPENDENT QA
 ↓
━━━━━━━━━━━━━━
 HUMAN GATE
━━━━━━━━━━━━━━
 ↓
GO / REPAIR / STOP
```

Humanは原則、途中工程には介入しない。

## AUTO REVIEW TEAM

成果物の種類に応じて必要な専門家を選択する。Visual / Home / Map等では:

1. Kids UX Reviewer
2. Game Experience Reviewer
3. Art Director Reviewer
4. Mobile UI Reviewer
5. Independent Critic

各Reviewerは独立して評価する。**実装担当自身による自己評価だけでPASSさせない。**
（実務上は、実装を行ったセッション自身がこの5視点を明示的に切り替えて
批判的に採点する——`factory/rules/ai-routing.md`のCodex活用余地がある場合は
independent reviewとしてCodexを併用してよいが、必須ではない。重要なのは
「実装者の自己満足採点でPASSにしない」という規律そのもの。）

## JIBUN CHOICE DESIGN PRINCIPLES（visual/UI, 恒久ルール）

- 対象は主に小学校高学年〜中学生。**子ども向け ≠ 幼児向け**
- 「大人から見て綺麗」だけではPASSしない
- 子どもが「触りたい」「何これ？」「やってみたい」と感じることを重要評価軸とする
- generic SaaS / EdTech / wellness UIへ収束しない
- 意味のないpill UIを安易に使わない。何でも均一な角丸cardにしない
- 過度な中央揃え＋均等余白だけで構成しない
- 「WebアプリだからWebアプリらしくする」を前提にしない
- JIBUN CHOICEのVisual Languageは production illustrationだけでなく
  UI chrome / typography / compositionにも反映する

**Visual Language**: 明るい・warm・handmade・3D clay / miniature diorama・
少し不揃い・大小のリズムがある・ポップだが幼児的ではない・遊びが始まりそう・
世界を触りたくなる。

**Reference quality**: 街頭配布チラシ、子ども向けイベント制作物、
Human-approved Continuous World（`public/assets/world/continuous-world.png`）。

**FAIL条件**: 「写真だけJIBUN CHOICE、周囲のUIはgeneric SaaS」という状態。

### COPY PRINCIPLE

子ども向け画面のコピーが「大人が子ども向けサービスを説明している文章」に
なっていないか確認する。説明より、子ども自身の次の行動が想像できる言葉を
優先する。ただし、Human承認済みのMission / Product Conceptを勝手に変更しない
（`factory/rules/principles.md`が上位）。

## AUTO REPAIR RULE

Auto Reviewで問題が見つかった場合、既存のHuman Decision / Design Principles /
Specの範囲内で修正可能なら、Humanへ戻さず自動修正してよい。

- AUTO REPAIRは原則**最大1回**
- 修正後は必ずScreenshotを再取得し、Review / QAを再実行する
- 2回目の大きな修正が必要な場合はHUMAN GATEへ送る
- 目的は95点を延々追求することではない。
  **「実ユーザーに見せられるV1」に到達したらSTOPする**
  （既存方針: memory `codex-reviewer-calibration` — 点数ではなく
  BLOCKER/HIGH=0＋max-iteration明示停止を踏襲）

## HUMAN ESCALATION RULE

以下の場合のみ、途中でHumanへ戻す。

1. `factory/rules/product-identity-gate.md`に触れる
2. Humanの既存Decision同士が矛盾する
3. AI Review Team内で重要な判断が割れる
4. Mission / target / core experience変更が必要
5. 新しいmajor featureが必要
6. gameplayそのものの変更が必要
7. 新mascot / character / reward / points / currency / streak /
   collection / growth / classification / unlock / monetization等が必要
   （= product-identity-gate.md 適用対象。リストの正本はそちら）
8. 既存assetでは成立せず、新しいproduction artが必要
   （GPT_ASSET_REQUESTを要する場合）
9. RepairしてもV1 release thresholdに届かない
10. AIだけではProduct Tasteを決められない

## HUMAN INTERVENTION BUDGET

原則、1 screen / 1 worldにつきHumanが見るのは最大2 Gate。

- **GATE 1 — DIRECTION**: 「この方向で作ってよいか」
- **GATE 2 — RELEASE**: 「子どもに見せてよいか」

Human Decision済みの方向性が既に存在する場合、GATE 1を省略可能。その場合:

```
Factory制作 → Auto Review → Repair → QA → RELEASE GATE
```

までHumanを呼ばない。

## HUMAN GATE OUTPUT（形式）

Humanへ大量のtechnical reportを投げない。原則、以下だけを提出する。

```
【成果物】375px screenshot
【Factory判定】PASS / PASS WITH NOTES / HUMAN DECISION REQUIRED
【確認してほしいこと】最大3点
【QA】重大blockerの有無
【Human Decision】GO / REPAIR / STOP
```

technical details、各Reviewerの長文、build log等はFactory内部
（`factory/state/expansion/`等）に保存し、Humanが求めない限り逐一提示しない。

## DEVELOPMENT / STABLE

Auto Review / Auto RepairはDevelopment Track（`feature/harness-bootstrap`）内のみ。
HumanのGOなしにStableへpromoteしない。remote pushもHuman Decisionなしに行わない。
（`factory/rules/product-identity-gate.md`の適用範囲と同じ二層構造。）

## 適用実績

- 2026-09-06: Home（HomeScreen.tsx / index.css）— Design Review Gate 1完了後
  （Human Decision: C65% Playful Diorama + B25% Game Start + A10% World Is
  The Hero）、本フローで実装→Auto Review→Repair→QAまで実行し、
  RELEASE GATEのみHumanへ提示。詳細は
  `factory/state/expansion/home-design-review-2026-09-06.md`と
  `factory/state/expansion/home-auto-review-2026-09-06.md`。
