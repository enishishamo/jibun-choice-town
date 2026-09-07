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

**READY FOR USER TESTINGはFactory全体のSTOP CONDITIONではない。** ある画面/
機能が「子どもに見せられる」状態になったことを示す、その部分のstatusに
すぎない。実ユーザー検証を待っている間も、Human-approved Product Boundary
内で価値のある仕事が存在する限りFactoryは継続して動く。Factoryは常に
2つのloopを管理する。

**A. USER LEARNING LOOP** — 実際の子ども・親・利用者からfeedback
（`factory/state/feedback/`）が入った場合、それを最優先のevidenceとして
扱う: Observation → Structure → Severity → Hypothesis → Task → Repair/
Design → QA → Release → 次のUser Test。AI内部評価より優先する。

**2026-09-07 確立（Human Decision — 初回REAL_USER_FEEDBACK実例）**: REAL_USER_
FEEDBACKが届いた時点で、たとえContinuous Product Loopが別taskの途中で
あっても、都度Humanへ「切り替えていいですか」と確認しない。安全な地点まで
現在のtaskを一時中断し（進行中の変更はcommit、task状態は正直に記録——
「repair待ち」等——してから中断する。実装途中のまま放置しない）、
即座にUSER LEARNING LOOPへ切り替える。severity/BLOCKER候補かどうかの
一次判断はFactory Manager自身が行ってよい（Humanの判断を待たない）——
ただし記録自体は`factory/state/feedback/real-user-feedback-schema.json`
の形式で必ず残す。Fix→独立review→QA→releaseまで自律実行してよいのは、
Product Identity Gate（mascot/経済/分類system/core gameplay等）に
触れない範囲に限る。触れる場合のみHuman Decisionへ上げる。完了後は
Continuous Product Loopへ戻り、中断したtaskがあれば状態を確認して
再開するか次のtaskへ進むか判断する（`factory/state/feedback/README.md`
の「NO自動改善ループ」注記は、この決定により2026-09-07付けで上書き
される——README側にも同日付で追記すること）。

**B. CONTINUOUS PRODUCT LOOP** — User feedback待ちの間も停止しない。既存
Productを継続的に監査し、次に価値の高い改善taskを自ら選択して進める。
見る優先順位（概ね）:

1. **BROKEN / BLOCKER** — bug、操作不能、表示崩れ、fact error等
2. **GAME EXPERIENCE** — 既存worldを実際にplayし直し、本当にゲームに
   なっているか（読んで答えるだけ・2択クイズ化・C不要で攻略可能になって
   いないか）、操作→結果→再試行、仕事固有のC⇄D、Job Revealの発見感を
   継続的に再点検する（`game-critic-v2.md`、`factory/state/audits/
   q1-audit.json`の既存監査を土台にする——監査を毎回作り直さない）。
   **2026-09-07〜**: Q1のprimary quality gateは
   [`factory/rules/q1-first-play-standard.md`](q1-first-play-standard.md)
   （FIRST-PLAY EXPERIENCE、固定単一症例のMASTERY/REPLAY欠如だけを理由
   にBLOCKERにしない）。Independent Reviewのprompt作成時は必ずこの
   ファイルを参照する。
3. **KIDS UX / FUN** — 375px primaryで最初の数秒の触りたさ、退屈な説明
   画面の有無、テンポ、generic EdTech/SaaS化していないか、visual feedback
4. **WORK / FACT QUALITY** — 実際の仕事との乖離、専門性の有無、一般常識
   問題化していないか、Fact Researcher/Fact Criticで確認
5. **CONTENT BREADTH / BIAS** — 業界偏り、ホワイトカラー/医療偏重、性別
   ステレオタイプ、mechanic偏重の監査
6. **NEW CONTENT** — 上記監査から明確なcoverage gapが見つかった場合のみ
   候補化。「数を増やすこと」自体を目的にしない。WHY THIS WORLD? / WHAT
   NEW SOCIAL ENCOUNTER? / WHAT NEW PROFESSION? / WHAT UNIQUE C⇄D? / WHAT
   MECHANIC DIFFERENCE? に答えられるものだけ優先する
7. **POLISH / TECH DEBT** — accessibility/responsive/performance/code
   structure等。ただし実ユーザー価値より優先しない

### GAME RESEARCHの継続利用

Game Researcher（`.claude/agents/jc-researcher`、`/game-lab research`）は
新規world制作時だけでなく既存world改善にも使う。puzzle/simulation/
management/strategy/sandbox/party game/mobile casual/board game/escape
game/tycoon/creative play等から「なぜ触り続けたくなるか」「失敗がなぜ
面白いか」「もう1回がなぜ起きるか」の原理を研究し、表面的コピーはせず
`factory/taxonomy/mechanics-library.json`へ保存、JIBUN CHOICEの仕事固有
C⇄Dへ翻訳する。

### ANTI-IDLE RULE

以下を理由にFactoryを止めない: 「User feedbackがまだないので停止します」
「全blockerがないので仕事はありません」「V1が公開済みなので待ちます」。
Factory ManagerはUser feedback待ちでもCONTINUOUS PRODUCT LOOPから
NEXT TASKを選ぶ。

### ANTI-BUSYWORK RULE

ただし、動き続けるためだけの仕事を作らない。禁止: 意味のないpixel polish、
同じ画面の無限redesign、点数を95→96にするためだけのrepair、根拠なく
新機能を発明、根拠なくworldを量産、Human-approved Product Identity変更。
各task開始時に内部で必ず **WHY NOW? / EXPECTED USER VALUE? / WHAT
EVIDENCE・PRINCIPLE SUPPORTS THIS?** を確認する。説明できなければ実行しない。

### WIP LIMIT

一度に大量のworldを半端に触らない。原則: 1 task/worldを選択 →
Research → Design → Critic → Implement → QA → Release/Backlog → NEXT、
まで1つを閉じてから次へ進む。

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
