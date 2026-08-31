# JIBUN CHOICE Game Factory v0.1 — MASTER

新しいゲーム世界（イベント編）を半自動制作するための基盤。
思想の正本は `rules/principles.md`。**既存アプリの実コードが Source of Truth** であり、
`database/` はその索引にすぎない。

## パイプライン全体像

```
/new-world
  │
  ├─ STEP 1  DB更新            scripts/update-factory-db.mjs
  ├─ STEP 2  候補出し           jc-planner（出来事20〜30 → TOP3）
  ├─ STEP 3  ★GATE 1           ユーザーが出来事を選ぶ（必ず停止）
  ├─ STEP 4  広域調査           jc-researcher
  ├─ STEP 5  職種推奨           jc-planner（4〜6職種）
  ├─ STEP 6  ★GATE 2           ユーザーが職種構成を承認（必ず停止）
  └─ STEP 7  以降は原則止めない
       ├─ 深掘り調査            jc-researcher  → projects/<id>/research.md
       ├─ ゲームデザイン         jc-game-designer → projects/<id>/design.md
       ├─ 批評（差し戻し最大2回） jc-critic     → projects/<id>/critic-review.md
       ├─ アートmanifest        jc-art-director → projects/<id>/art-manifest.json
       └─ 実装計画              → projects/<id>/implementation-plan.md
                                  （v0.1では本番コードの自動実装はここで停止）
```

## 二層評価

- **Layer 1（Static Scan）**: `scripts/scan-existing-games.mjs` がコードから機械的に
  抽出する事実（event / Q1 / job / componentPath / データ層フィールド / Job Reveal /
  interestSeeds / FACT CHECK TODO）。`database/` に自動生成。
- **Layer 2（Semantic Code Review）**: Critic / Final QA が**コンポーネントコードを
  実際に読んで**判定した C / D / C_required / action_changes_result / retry /
  fixed_progression / obvious_binary_choice。`taxonomy/component-reviews.json` に
  根拠 file:line と対象コードのハッシュ（reviewedHash）つきで記録し、スキャナが
  mechanics.json へ結合する。コンポーネントが変更されるとハッシュ不一致で
  STALE 警告が出る（＝レビューのやり直しが必要）。

メカニクスは gameType（固有名）のまま登録し、偏り検出用に
`taxonomy/mechanics-taxonomy.md` の操作パターン（primaryMechanic）へ正規化する。

## 画像生成パイプライン（/generate-art）

Art Director の manifest から画像を自動生成する工程（OpenAI Image API・有料）:

```
/generate-art <world-id>
  ├─ STEP 1  dry-run（無料）     scripts/art-generate.mjs <world>（枚数と推定コストを表示）
  ├─ STEP 2  ★HUMAN_REQUIRED    コストとAPIキーをユーザーが承認（毎回必ず停止）
  ├─ STEP 3  生成               art-generate.mjs <world> --confirm（リトライ3回・途中再開可）
  ├─ STEP 4  機械的QA           scripts/art-qa.mjs（寸法・透過・PNG妥当性）
  ├─ STEP 5  visual QA          Claudeが各PNGをmanifestと突き合わせて目視判定
  │                             不合格は --flag で needs_regeneration → その画像だけ再生成
  ├─ STEP 6  実装へ反映         TODO(art)の結線（Claude）＋ scripts/art-check-links.mjs --update
  └─ STEP 7  build/lint/表示確認 → コミット
```

- スタイルは manifest の `common_style`（無ければ `art/style-prompt.md`）を全プロンプトに自動適用
- 人物・建物の一貫性は manifest の consistency note の自動挿入＋キャラ立ち絵を参照画像にした
  images/edits 呼び出しで担保（キャラクターを最初に生成する順序制御つき）
- 料金ガード: `art/config.json` の 枚数/回・USD/回・USD/月 上限（超過見込みは実行前に拒否）、
  `art/generation-log.jsonl` に全生成の台帳
- 生成済みはスキップ。再生成は `--ids <id> --force` の明示指定のみ
- APIキーは `.env.local`（gitignore済み）のみ。`.env.example` 参照

## ディレクトリ

- `rules/` — 全エージェント共通の規約（原則・調査・設計・アート・QA）
- `database/` — スキャン生成物。手で編集しない。`scripts/update-factory-db.mjs` で再生成
- `taxonomy/` — 操作パターン taxonomy 定義と Semantic Code Review（人・エージェントが更新）
- `scripts/` — スキャナ・バリデータ（Node、追加依存なし）
- `projects/` — 制作プロジェクトごとの成果物（research / design / critic-review / art-manifest / qa-report）
- `.cache/` — スキャナの一時ファイル（自動削除・gitignore）

## エージェント（.claude/agents/）

| agent | 役割 | 主な出力 |
| --- | --- | --- |
| jc-planner | 出来事候補の発散とTOP3、職種構成推奨 | 会話内提案 |
| jc-researcher | 現実の仕事の一次情報調査 | research.md |
| jc-game-designer | A→B→C⇄D→E への翻訳 | design.md |
| jc-critic | 独立採点・差し戻し | critic-review.md |
| jc-art-director | 画像manifest作成 | art-manifest.json |
| jc-final-qa | 実装後QA（13項目・CRITICAL〜LOW） | qa-report.md |

## v0.1 の自動化範囲

- 自動: DBスキャン／整合性検証／候補出し／調査／設計／批評ループ／manifest／実装計画
- 人間が必要: GATE 1・GATE 2 の選択、重大ファクト問題の判断、画像生成、
  本番コードへの実装指示（「実装して」）、コミット・push
