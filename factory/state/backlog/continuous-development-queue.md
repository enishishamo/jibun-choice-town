# Continuous Development Queue（Track B インデックス）

2026-09-04 制定。JIBUN CHOICE の運用を Stable/Public Validation Track（A）と
Continuous Development Track（B）に分離したことに伴い作成。**このファイルは
低優先度の改善を気長に積み上げていくための「入口」であり、既存の各種
backlog ファイルを置き換えるものではない。** 各カテゴリの実体は既存ファイルを
再利用し、無いものだけ新規に用意した。

Track の定義・昇格ルールは [`../release/two-track-model.md`](../release/two-track-model.md)
と既存の [`../release/release-lifecycle.md`](../release/release-lifecycle.md) を参照。

## カテゴリ別 backlog

| カテゴリ | 実体ファイル | 現在の件数 | 実行コマンド |
|---|---|---|---|
| 新world追加 | `factory/state/expansion/coverage-gap.md`（既存、/world-expansion が生成） | 要再スキャン | `/world-expansion` → `/new-world --theme="..."` |
| 既存world改善 | `../experience-backlog.json`（Game Quality Gate由来） | 39 items | `/game-lab improve <gameType>` |
| Game Quality改善 | `../experience-backlog.json` | 39 items（同上） | `/game-lab improve <gameType>` |
| Gameplay Experience改善 | `../experience-backlog.json` の `WEAK_WORLD_FEEDBACK` / `HINT_LEAKAGE` フラグ | 上記に含まれる | `/game-lab improve <gameType>` |
| World Map改善 | `../presentation-backlog.json`（Map系findings） | 7 items中Map関連あり | 専用repair workflow（Home/Map Human Visual Review系、slash command化はまだ） |
| Language / furigana改善 | [`language-furigana-backlog.md`](language-furigana-backlog.md)（新規） | 1 items（フル網羅パス） | `factory/harness/language-in-context-qa.mjs` を repair→再検証ループで使用 |
| Career Path改善 | [`career-path-backlog.md`](career-path-backlog.md)（新規） | 実行順第1項の結果待ち | WebSearch実地検証 → `factory/harness/build-career-paths.mjs` 再生成 |
| 「こんな仕事！」情報拡張 | [`job-info-expansion-backlog.md`](job-info-expansion-backlog.md)（新規、空） | 0 items | `/new-world` の profession データ拡張、または既存professionのq2拡充 |
| Art差し替え | `../art/gpt-asset-requests.json` | 4 items（PUBLIC_BLOCKER）+ 1 backlog | GPT側で画像制作 → 差し替え後にvisual QA再実行 |
| UI/UX改善 | [`ui-ux-backlog.md`](ui-ux-backlog.md)（新規、空） | 0 items | 都度判断（layout/CSS/animation はClaude担当領域） |
| Factory / Harness改善 | [`factory-harness-backlog.md`](factory-harness-backlog.md)（新規） | 2 items | 都度判断 |

## 優先順位の付け方

1. **REAL_USER_FEEDBACK が最上位入力**（`factory/state/feedback/`）。severity=HIGH/BLOCKER
   の実観測は、このqueueのどのカテゴリよりも先に着手する。ルーティング表は
   `factory/state/feedback/README.md` の「REAL_USER_FEEDBACK ルーティング表」節を参照。
2. REAL_USER_FEEDBACK が無い期間は、このqueue内で severity/priority が高い順に、
   気長に・低頻度で進めてよい（一度に大量実行する必要はない）。
3. どの項目も、着手前に該当worldの既存QA Gateを読み直し、後退させないことを確認する。

## 運用ルール（本ディレクティブより）

- Stable版を壊さずにDevelopment側だけを進化させられること（→ 二層モデル参照）。
- Development → AI_VERIFIED → Release Candidate までは自動化可能。
  Stable昇格は人間判断（`release-lifecycle.md` のまま変更なし）。
- Model routing: Sonnet=orchestration/implementation、Codex=research/independent
  review/audit/QA、Haiku/lightweight=repetitive scan/metadata/formatting、
  Fable=architecture・難しいdesign・failed repairなど本当に必要な場合のみ
  （使用理由を `factory/state/routing-log.jsonl` に記録）。Codex quota枯渇時に
  paid APIへfallbackしない。
- Art Ownership維持: Claude=functional UI/CSS/SVG/animation/game-state
  visualization、GPT=人物/建物/背景/world/scene/illustration。新worldで
  GPT illustrationが必要な場合は ASSET_REQUEST を `../art/gpt-asset-requests.json`
  に追記してqueueに積むところまでを自動で行い、画像が無いことだけを理由に
  Factory全体を止めない（該当worldはGPT画像待ちのまま他の作業を並行して進める）。
- 追加課金禁止・paid API禁止・API key禁止。remote pushは人間の明示指示まで禁止。
