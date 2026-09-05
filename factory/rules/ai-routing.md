# AI Routing / Compute Steward

2026-09-04 制定。Factoryの規模拡大に伴い、「どの仕事を、どのAI /
model / agent / toolへ任せるか」自体を管理する方針。

**役割の実体について**: `jc-ai-router` / `jc-compute-steward` という
役割名で運用するが、これはサブエージェントとして独立実行するものでは
ない——ルーティング判断（どのタスクをどのagent/modelへ渡すか）は、
その判断を行っている当のオーケストレーター（作業を統括しているClaude
セッション自身）が、このファイルの方針に従って毎回下す。ルーティングを
さらに別のagentへ委譲すると、判断の責任の所在が無限後退するため。

目的は単純なコスト削減ではない。QUALITY / COST・USAGE / SPEED /
INDEPENDENCE / CONTEXT SIZE / TASK COMPLEXITYを考慮して、
必要十分なAIを選ぶこと。

## ROUTING BEFORE EXECUTION

大きなtaskを開始する前に:

```
TASK → DECOMPOSE → CLASSIFY → ROUTE → EXECUTE
```

分類例: MECHANICAL / RESEARCH / IMPLEMENTATION / VISUAL_REVIEW /
CODE_REVIEW / INTERACTION_QA / PRODUCT_REASONING / ART / HUMAN_DECISION

## DEFAULT ROUTING

| task種別 | route先 |
|---|---|
| MECHANICAL / repetitive（repository scan / grep / metadata） | direct tools最優先。AI reasoningを浪費しない |
| implementation | Sonnet（このセッションの既定model） |
| independent code review | Codex |
| adversarial QA | Codex |
| gesture / interaction bug hunting | Codex + automated browser tests（real touch simulation） |
| visual screenshot critique | Codex independent critic ＋ jc-visual-director |
| large parallel research | lightweight / Codex / Sonnet subagentsへ分散。Fableをresearch workerとして大量使用しない |
| architecture / difficult ambiguity | Sonnet first → unresolvedならFable or Opusへescalate |
| illustration | GPT（`factory/state/art/gpt-asset-requests.json`経由） |
| Product Identity decision | HUMAN（`factory/rules/product-identity-gate.md`） |

## ESCALATION LADDER

```
DIRECT TOOL → LIGHTWEIGHT / HAIKU → CODEX or SONNET → FABLE / OPUS → HUMAN
```

task typeによってCodex/Sonnetの順序は入れ替えてよい。高価・高能力modelを
最初からdefaultにしない。

## FABLE / OPUS BUDGET

Fable / Opusは以下に限定:
- major architecture
- unresolved ambiguity
- repeated failed repair
- cross-system conflict
- genuinely difficult reasoning

使用前に `WHY_HIGH_REASONING_MODEL_REQUIRED` を
`factory/state/routing-log.jsonl` へ記録する。

以下では原則使用禁止: grep / file listing / metadata / formatting /
simple CSS adjustment / screenshot capture / repetitive QA / bulk fact
extraction / routine test execution。

## CODEX UTILIZATION

Codexを単なる最終reviewerに限定しない。積極的に: independent
implementation review / bug hunting / regression analysis / gesture logic
review / automated test design / repository exploration / duplicate
detection / adversarial QA / factual inconsistency scanへ利用する。

ただしCodex quotaを考慮し、同じreviewを意味なく何roundも繰り返さない
（`factory/state/backlog/factory-harness-backlog.md` の
`fact-review-needs-websearch-path`、および memory:
`codex-reviewer-calibration` の「点数ではなくBLOCKER/HIGH=0＋
max-iterations明示停止」を踏襲）。MAX REVIEW ITERATIONを維持する。

**Codex quota exhaustion / auth / timeout時**: `CODEX_UNAVAILABLE` として
記録し、全体を停止しない。paid API fallbackは禁止。Codex非依存で進められる
task（Sonnet self-review、direct tool検証、既存automated testの拡充等）へ
routingして続行する。Fable / Opusへの自動fallbackもしない
（WHY_HIGH_REASONING_MODEL_REQUIREDの記録なしにエスカレーションしない）。

## PARALLELIZATION

独立したtaskは並列化する（例: Visual Research / Interaction Audit /
Performance Audit / Existing UI Scanは並列可能）。一方、
implementation → screenshot → critique → repairのような依存taskを
無理に並列化しない。

## CONTEXT EFFICIENCY

巨大な全履歴を全agentへ毎回渡さない。各agentへ: relevant rules /
relevant files / current task / required gates だけを渡す。共通思想は
Factory rules（`factory/rules/*.md`）をsource of truthとする。

## DUPLICATE WORK DETECTOR

実行前に確認: ALREADY_RESEARCHED? ALREADY_TESTED? EXISTING_REPORT?
EXISTING_ASSET? EXISTING_BACKLOG_ITEM? YESならreuseする。同じresearch・
同じscreenshot QA等を理由なく最初から繰り返さない。

## ROUTING LOG

`factory/state/routing-log.jsonl` に、各主要taskについて: task_id /
task_type / selected_executor / selected_model / reason /
alternatives_considered / escalated / escalation_reason / reviewer /
iterations / result を短いstructured recordで記録する。logging自体で
tokenを大量消費しない。

## IMPORTANT

Routing自体がProduct Decisionを行わない。「Fableがこう言ったから採用」
「Codex scoreを上げるために新機能追加」は禁止。Modelは意思決定権ではなく
仕事を行うresource。`product-identity-gate.md` はRoutingより上位。

## COST SAFETY

追加課金禁止。API key禁止。paid API禁止。subscription内の利用でも
usage limitは有限と考え、無駄な反復を避ける。利用上限到達を理由に
有料fallbackしない。
