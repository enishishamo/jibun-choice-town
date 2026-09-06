# AUTONOMOUS EXECUTION MODE

2026-09-06 制定。Factoryを「Humanから1 taskずつ指示される制作チーム」から、
Human-approved roadmap / backlog / Product Rulesに基づいて自律的に次の仕事を
選び、制作・QA・releaseまで進めるチームへ移行する。既存の
`factory/rules/*.md`・backlog群を置き換えるものではなく、それらを繋いで
「次のtaskを誰が・いつ・どう選ぶか」を定義する最上位の運用ルール。

## 基本原則

Humanが既に決定している範囲では、1 task完了ごとに
「次は何をしますか？」とHumanへ聞かない。Factory Managerは:

1. 現在のProduct Goal（`factory/rules/principles.md`）
2. Human-approved priorities（各種Human Decision — `factory/state/product-ideas/gate-log.md`等）
3. backlog（`factory/state/backlog/*.md`、`factory/state/experience-backlog.json`、
   `factory/state/presentation-backlog.json`）
4. blocker（release blocker、QA blocker）
5. dependency
6. user-testing readiness（`factory/state/feedback/`のREAL_USER_FEEDBACK）

を確認し、次に価値の高いtaskを自ら選択する。task完了後はbacklog/status/evidence
を更新し、次の実行可能taskへ進む。

## STANDARD LOOP

```
ROADMAP / BACKLOG
 ↓
Factory ManagerがNEXT TASKを選択
 ↓
必要な専門Teamを自動routing
 ↓
Research / Design
 ↓
Critic
 ↓
Implementation
 ↓
Auto Review（visual-production-flow.mdのAUTO REVIEW TEAM）
 ↓
Auto Repair 最大1回
 ↓
Technical QA（qa-rules.md / factory/harness/）
 ↓
Independent QA
 ↓
Deploy Policy判定（deploy-release-policy.md）
 ↓
条件を満たせばRELEASE
 ↓
Evidence / backlog / status更新
 ↓
NEXT TASK
```

Human escalation条件（後述）に到達するまで、このloopを継続する。

## ROUTING

全taskに全Agentを使わない。Factory Managerがtaskを分類して必要な専門家だけ
招集する（`factory/rules/ai-routing.md`のDEFAULT ROUTINGと整合）。

| task種別 | Team |
|---|---|
| GAME CONTENT（新world・既存world改善） | Fact Researcher → Fact Critic → Game Researcher/Mechanics Library → Game Designer → Game Critic → Builder（実体: `.claude/agents/jc-researcher`,`jc-game-designer`,`jc-critic`） |
| VISUAL / UI | Kids UX → Art Director → Mobile UI → Critic → Builder（実体: `visual-production-flow.md`のAUTO REVIEW TEAM＋実装セッション自身） |
| BUG / TECHNICAL | Builder → Technical QA → Independent QA |
| PRODUCTION ARTが必要 | Art Director → Human-approved Art Rules確認（`art-style.md`） → Production Art → Art QA → Builder |

既存assetで解決できる場合は新規画像を作らない（`art-style.md`）。

## DEFINITION OF DONE

「コードを書いた」をDONEとしない。DONEは原則:

- required experienceが実装されている
- 375px primary viewportで成立
- 重大interaction failureなし
- console/build blockerなし
- JIBUN CHOICE Design Principles PASS（`visual-production-flow.md`）
- Fact/Game taskなら該当Critic PASS（`game-critic-v2.md`, `language-style.md`）
- QA PASS（`qa-rules.md`）
- release可能なら公開反映済み（`deploy-release-policy.md`）
- backlog/status/evidence更新済み

まで。

## SELF-CRITIQUE

実装者自身の「良好です」だけではPASSにしない。成果物を必ず別roleがレビュー
する（`visual-production-flow.md`のAUTO REVIEW TEAM）。ただし、minor polish
suggestionだけを理由にreleaseを止めない。

## ANTI-PERFECTION RULE

AIだけで95点を追わない。以下を満たしたらV1 COMPLETE:

- 安全
- 壊れていない
- core experienceが成立
- Human-approved directionに沿う
- 実ユーザーに見せられる

残りはV2 backlogへ。同一taskに対するAuto Repairは原則最大1回。それ以上
必要ならrelease可能性を判断し、minorならbacklog、majorならHuman escalation
（`deploy-release-policy.md`のSAFETY節と同じfail-closed原則）。

## USER TESTING FIRST（STOP CONDITION）

現在のJIBUN CHOICEは実ユーザー検証フェーズ。AI内部で改善できることより、
子どもに触ってもらわないと分からないことが残った時点で、それをSTOP
CONDITIONとする。その場合、「さらにAIで改善」ではなく **READY FOR USER
TESTING** へstatusを変更する（新規taskを自作して継続しない）。

**2026-09-06 明確化（Human訂正）**: WIP LIMITは「同一taskへの追加修正」に
限定される規律であり、Factory全体を1 task直列でしか進められないという
意味ではない。あるtaskがHUMAN_DECISION_REQUIREDへ到達したら、それは
`factory/state/blocked-queue.md`へ移し（3回目の自力repairを重ねて粘らない
——これはAUTO REPAIR RULEそのもの）、Continuous Product Loopは**止まらず**
次に価値の高い独立taskへ進む。「1つのtaskが止まった＝Factoryが止まる」
にしない。blocked queueの項目はHuman Decisionが下りるまで再着手しない
（同じ独立レビューを無意味に繰り返さない、DUPLICATE WORK DETECTORと同じ
精神）。

## HUMANを呼ぶ条件

Humanへ途中確認するのは原則:

- Product Identity Gate（`product-identity-gate.md`）
- Mission / target / core philosophy
- 新しいcore gameplay / major feature
- 重要なDesign Directionが未決定
- AI Team内で重要判断が割れた
- 新しいproduction artでHuman taste判断が必要
- 既存Human Decisionsが矛盾
- 安全性 / privacy / data handling
- release blockerを自律解決できない
- 実ユーザー結果によって次のProduct Decisionが必要

（= `visual-production-flow.md`のHUMAN ESCALATION RULEと同一集合。ここでは
「task選択の自律化」に適用範囲を広げることのみを追加する。）

「どちらのCSSが綺麗か」「余白を何pxにするか」「このbugをどう直すか」等では
Humanを呼ばない。

## HUMAN REPORT

Humanへ逐次ログを流さない。報告は原則、次のいずれかのstatusに到達した
時だけ:

1. **RELEASED**
2. **READY FOR USER TESTING**
3. **HUMAN DECISION REQUIRED**
4. **BLOCKED**

報告内容:

```
STATUS
WHAT CHANGED
LIVE URL（releaseした場合）
EVIDENCE / QA
WHAT WE LEARNED
NEXT ACTION
HUMAN DECISION REQUIRED（ある場合のみ）
```

詳細logはFactory内部（`factory/state/`）へ保存する。

## IMPORTANT

自走とは、AIがProductを勝手に発明することではない。Humanが決めたProduct
Boundaryの中で、調査・制作・批評・修正・QA・release・次task選択を自律化
することである。**Product Identity Gate（`product-identity-gate.md`）は
常に優先する。**

## 適用実績

- 2026-09-06: 初回loop実行。backlog全件（`ui-ux-backlog.md` /
  `factory-harness-backlog.md` / `career-path-backlog.md` /
  `language-furigana-backlog.md` / `experience-backlog.json` /
  `presentation-backlog.json`）とREAL_USER_FEEDBACK（`factory/state/feedback/`、
  未収集）を確認。CRITICAL/BLOCKER相当のrelease blockerなし。stale化した
  Map旧architecture関連のbacklog項目（`presentation-backlog.json`の
  `map-balloon-collisions` / `map-mobile-crop` / `map-bottom-edge`、
  `ui-ux-backlog.md`の`map-v1-implementation`のstatus記載）を実態に合わせて
  更新。REAL_USER_FEEDBACKが未収集のため、新規taskを自作して継続する代わりに
  READY FOR USER TESTINGへ移行。
