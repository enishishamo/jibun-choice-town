# DEPLOY / RELEASE POLICY

2026-09-06 制定。適用範囲: Development Track（`feature/harness-bootstrap`）から
Stable（`main`、GitHub Pagesで実配布——`.github/workflows/deploy.yml`が
`main`へのpush毎に`npm run build`→GitHub Pagesへ自動デプロイする）への反映。

## きっかけ・段階の変化

JIBUN CHOICEは「AI内部で完成度を上げ続ける段階」から、
「実際の子どもに配布・使用してもらい検証する段階」に移った。
「Humanが毎回Stable promotion / remote pushを個別承認する」運用を変更する。

## 基本方針

Human-approved Product Directionの範囲内で行う、次のような変更は:

- UI/UX改善
- visual polish
- responsive改善
- accessibility改善
- bug fix
- copyの軽微な改善
- 既存assetの適切な差し替え
- performance改善
- QAで発見された軽微なrepair

`factory/rules/visual-production-flow.md`のFactory Review → Technical QA
→ Independent QAを満たし、**blockerなし**の場合、Humanの個別承認を待たず、
適宜、実配布中の最新版（`main` → GitHub Pages）へ反映してよい。必要な
commit / merge / push / deployまで、このrepositoryで通常行っている反映
工程を実行する。

## HUMAN APPROVALが必要な変更（自動反映しない）

- Mission変更 / target age変更 / core philosophy変更
- core gameplay変更 / major feature追加・削除
- 新mascot / brand character
- points / currency / reward / streak
- collection / growth system
- interest / aptitude classification
- world unlock / monetization
- 大きな情報architecture変更
- ユーザーデータの扱いに関わる変更
- 既存Human Decisionを覆す変更
- Factory内で意見が大きく割れた変更

（= 実質`factory/rules/product-identity-gate.md`の適用対象と同一集合。
リストの正本はそちら。ここでは「これらはPolicyの対象外＝個別承認必須」
であることのみを明記する。）

## RELEASE PHILOSOPHY

目的は「AIが考える95点を作ってから公開する」ことではない。
**「安全で、壊れておらず、JIBUN CHOICEの既存方針に沿った十分良いV1を
早く実ユーザーへ届け、子どもの反応から次を学ぶ」**こと。

```
V1 thresholdを満たす → RELEASE → 実ユーザー検証 → V2
```

を優先する。追加polish案があっても、releaseを止める理由にならなければ
`factory/state/backlog/`へ送る（実装しない）。

## SAFETY（fail-closed）

QA failure / blocker / regressionがある状態では自動反映しない。
不明な場合に無理にreleaseするのではなく、Humanへescalateする
（`visual-production-flow.md`のHUMAN ESCALATION RULEに従う）。

## RELEASE後のHuman報告（形式）

承認依頼ではなく、簡潔なrelease reportを出す。

```
【反映内容】何を反映したか
【公開先】main → GitHub Pages（実URL）
【QA結果】実行したQAと結果
【Human Decision Required】残っているものの有無
【実ユーザーで見てほしいこと】
```

## 適用実績

- 2026-09-06: Continuous World Map V1・Map minimum repair・Home Visual
  Refresh（C65+B25+A10方向の再実装含む）を本policyの初回適用対象とした。
  詳細は当該release reportを参照（`factory/state/expansion/`）。
