# GAME PRODUCTION PIPELINE — 調査からDesign引き渡しまで

制定 2026-09-23（Human 指示「INTEGRATED PRODUCTION FACTORY」）。
**正本はコード**（`factory/harness/q1-factory-schema.mjs` と
`factory/harness/q1-pipeline.mjs`）。本書とコードが食い違ったら、
コードが正しいものとして本書を直す。`q1-autonomous-factory.md` と同じ扱い。

## 0. なぜ新設しなかったか

前工程のパイプラインは**既に存在していた**。`q1-pipeline.mjs` は
成果物のversion管理・上流追跡・transitive STALE・失敗時の差し戻し先・
有限の予算（repair 1 / redesign 2）・独立レビューの取り込みまで実装済みで、
11本の Q1 パイプラインがこれで動いた記録が残っている。
Ver.2 がこれを使わず素の markdown に戻していただけだった。

したがって 2026-09-23 に行ったのは**新設ではなく track の追加**である。
ルールは1か所にしか置かない、という既存の方針（`review-evidence.mjs` と
同じ思想）を崩さないため。

## 1. 2つの track

| track | 開始 | 思想 |
|---|---|---|
| `q1` | `PROFESSION_RESEARCH` | 職業から入る。既存11本はこちら。**変更していない** |
| `v2` | `LEGACY_INVENTORY` | 行為から入る。職業名は PLAY のあとまで出さない |

`init` で `--track` を省略すると `q1`。既存の台帳は `track` を持たないので
自動的に `q1` として扱われ、挙動は一切変わらない。

## 2. v2 track の工程

```
LEGACY_INVENTORY
  → WORK_RESEARCH
  → EVIDENCE_REVIEW（独立レビュー）
  → WORK_DECISION_MAP
  → FACT_GATE（機械判定）
  → GAME_REFERENCE_RESEARCH
  → GAME_CONCEPTS（3案以上）
  → GAME_CRITIC（独立レビュー）
  → FINAL_GAME_DESIGN
  → DESIGN_HANDOFF
       ↓（ここから先は Design Owner = GPT）
  → DESIGN_PACKAGE
  → BUILD → BUILD_QA → 独立レビュー → RELEASE（既存の task-state / release gate）
```

一方向ではない。`fail` の failure_code に応じて上流へ戻り、
`reject-concepts` は研究または案出しへ戻す。上流の新versionは
下流を transitive に STALE にする（`DOWNSTREAM_OF`）。

## 3. 成果物の契約

型は `ARTIFACT_SCHEMAS`。`submit <job> <type> --file <p.json> --source <type>@<version>`
で登録し、`--source` が現行版でないか STALE なら**拒否される**。

| artifact | 要点 |
|---|---|
| `legacy_inventory` | KEEP/UPGRADE/REPLACE/DROP。**DROP には理由必須**（機械チェック） |
| `work_research` | claim ごとに actor / source / source_class / confidence |
| `work_decision_map` | 行ごとに 15 項目。FACT GATE が実際に読む唯一の表 |
| `game_reference_research` | 参照ゲーム2件以上。借りるのは**抽象文法のみ** |
| `game_concepts` | 3案以上。**main_action が重複したら拒否**（＝見た目違いの同一案の禁止） |
| `final_game_design` | 採択1案。**却下した案の記録が2件以上ないと拒否** |
| `design_handoff` | Design Factory への入力 |
| `design_package` | Design Factory からの返却（Claude は作らない） |

## 4. FACT GATE（§8 の機械化）

`node factory/harness/q1-pipeline.mjs fact-gate <job_id>`

`work_decision_map` の行を読み、次を**すべて**満たす行が1つ以上あるときだけ通る。

- `actor` が名指しされている（空でも UNKNOWN でもない）
- `confidence` が HIGH、または MEDIUM かつ `source_class` が
  primary_law / government / municipal
- `gameability` が HIGH か MEDIUM
- `distortion_risk` が HIGH ではない

**「事実は十分です」と書いても通らない。** 通らないときは
`FACT_NEEDED` として記録し、WORK_RESEARCH へ戻る。
ゲーム案を先に書いてはいけない。他の job は止めない。

> 2026-09-23 の初適用（「はこぶ」）で、このゲートは12行中2行を落とした。
> 落ちた1行が「配送計画の策定」＝物流と聞いて誰もが最初に思いつく
> 経路ゲームの素だった（gameability LOW / distortion_risk HIGH：
> 実際には運転手ではなく発注者が契約時に決めている）。
> ゲートが機械的でなければ、この案は通っていた。

## 5. 3つの confidence（§26）

`set-confidence <job> --fact|--game-fit|--design <HIGH|MEDIUM|LOW|UNCONFIRMED>`

| confidence | LOW だと止まるもの |
|---|---|
| `fact` | GAME DESIGN へ進めない |
| `game_fit` | BUILD へ進めない |
| `design` | PRODUCTION READY にできない |

未設定は LOW ではない。未設定はそれ自体では止めない。

`can-advance <job> <GAME_DESIGN|BUILD|PRODUCTION_READY>` が
confidence と成果物の有無・STALE を合わせて判定する。

## 6. 作らない判断（§17）

`reject-concepts <job> --reason "..." [--return-to WORK_RESEARCH|GAME_CONCEPTS]`

仕事固有の行為が弱い／操作にすると実務を大きく歪める／文章説明なしに
成立しない／既存ゲームとの差がない／正解当て教材になっている／
子どもの意思決定がほぼない、のいずれかなら**作らない**。

これは失敗ではないので **repair / redesign の予算を消費しない**。
職業数を増やすためだけに低品質なゲームを作らない。

## 7. Design Factory が未接続のとき（§23）

`DESIGN_FACTORY_UNAVAILABLE` で Factory 全体を止めない。

- 進めてよい: データモデル、ゲームロジック、状態機械、全探索テスト、
  事実テスト、保存、結合インターフェース、QA契約
- 進めてはいけない: 最終的な画面構成、visual identity、新キャラクター、
  世界のレイアウト、アセットの見え方

`can-advance <job> PRODUCTION_READY` が DESIGN_PACKAGE の不在を理由に
拒否するので、**実装者が自分で「見た目も完成」と宣言することはできない**。

## 8. Build 工程との接続（§29）

`node factory/harness/task-state.mjs set-upstream <task_id> --job <job_id> --game-design <version> [--design <version>]`

記録は任意（ゲーム実装でない task が大半）。ただし**記録したうえで
上流が進んだ場合、release gate が stale として拒否する**。
記録しないことは許されるが、記録して食い違うことは許されない。

## 9. 役割の分離（§24）

| 役割 | 決めてよいこと | 決めてはいけないこと |
|---|---|---|
| WORK RESEARCHER | 事実 | ゲーム |
| GAME DESIGNER | 機構 | 事実、Product Mission |
| DESIGN FACTORY (GPT) | 見た目・UI・動き | ゲーム機構 |
| BUILDER | 実装方法 | ゲーム、デザイン |
| QA | 問題の検出 | 仕様 |
| HUMAN | Mission、Product Identity、世界構造、重大な抽象化 | — |

`set-review` は evidence の provenance から reviewer を導出し、
**producer と同一なら拒否する**。段階をまたいで同じ人格が
「作ってレビューして通す」ことは機械的にできない。

## 10. 自己テスト

```bash
npm run selftest:factory     # 既存9件 + 本パイプライン9件
npm run selftest:pipeline    # 本パイプラインのみ
```

`pipeline-self-test.mjs` は scratch 台帳（`JC_PIPELINE_ROOT` +
`JC_TASKS_PATH`）に対してのみ動き、本物の
`factory/projects/` と `factory/state/tasks.json` を読み書きしない。
**ゲートを1つ足したら sub-test も1つ足す**（`qa-rules.md` と同じ規律）。

## 10.5. 初パイロットで判明した運用則（2026-09-23、「はこぶ」）

パイプラインを実際に1本通して分かったこと。詳細は
`factory/state/retrospectives/2026-09-23-integrated-production-factory.md`。

1. **ゲートを足したら、その出力を使う側も同じゲートに繋ぐ。**
   FACT GATE は決定マップの「行」を検証していたが、ゲーム案がその行に
   立脚しているかは誰も検査していなかった。結果、誰もしていない判断を
   発明した案が独立 critic まで到達した。`conceptRowTraceProblems` で塞いだ。

2. **blocker が全部「根拠がない」の形をしていたら、研究へ戻す合図。**
   設計者の力不足ではないので、設計者を替えても直らない。差し戻し先は
   GAME_CONCEPTS ではなく WORK_RESEARCH。

3. **作った人に直させない（producer ≠ next producer）。**
   producer ≠ reviewer は既に機械強制されている。設計の差し戻しでは、
   設計者自身を交代させたほうが構造的な誤りが直る。実際 r2 は r1 の
   4 blocker のうち3つを構造的に起こりえない形にしてきた。

4. **critic の指摘も、機械で確かめられるものは確かめる。**
   r2 の HIGH 1件は誤読だった（ゲートが落とした行数を取り違えていた）。
   ただしその下敷きにあった懸念——`gameability` は事実ではなく私が付けた
   判断である——は正しい。**主観値を事実と同じ棚に置かない。**

## 11. まだ無いもの（正直な記録）

- ~~子どもが今遊んでいるゲームの分析が repo に存在しない~~ → **2026-09-23 に解消。**
  `factory/lab/research/games.json` に batch 2 として6本を追加した
  （Minecraft / あつ森 / Roblox obby / Block Blast / おみせっち / ビビッター、
  `first_30_seconds` つき）。人気は ゲムトレ2025（小学生324名）で実証。
  ただし**この層は Switch 優位でスマホ中心ではない**ので、Switch の文法を
  指1本へ翻訳する作業が別途要る。
- **身体的主操作（止める・合わせる・置く…）とリプレイ類型の分類が無い。**
  あるのは「攻略の意味」の16分類（`mechanics-taxonomy.md`）。
- **`game-critic-v2.md` の採点軸に PLAY FIRST が入っていない。**
  `MIGRATION_PLAN.md` 自身が未対応と認めている。
- **子どもの実観測が1件しかない。** 63本のゲームはすべて AI_VERIFIED で
  あって、子どもに検証されていない。
- `q1-factory-selftest.mjs` が 41 件中 9 件失敗している（本変更の前から。
  別件として台帳に記録）。
