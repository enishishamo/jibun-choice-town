---
description: art-manifest.json から画像を自動生成し、実装へ反映してvisual QAまで行う（OpenAI Image API・有料）
---

JIBUN CHOICE Game Factory の画像生成フローを実行してください。
$ARGUMENTS は world-id（例: shop-opening。省略時は最新の projects を使う）。

規約: `factory/rules/art-style.md`・`factory/art/style-prompt.md`・`factory/art/config.json`

## フロー

**STEP 1｜dry-run（無料・必ず最初に）**
`node factory/scripts/art-generate.mjs <world-id>` を実行。
生成対象の一覧・推定コスト・月間累計が出る。生成済みはスキップされる。

**STEP 2｜HUMAN_REQUIRED（毎回必ず停止）**
以下をユーザーに提示して、実行の承認を得る:
- 生成枚数と推定コスト（dry-runの出力）
- `.env.local` に OPENAI_API_KEY があるか（無ければ設定方法を案内して停止）
承認の言葉（「生成して」等）が無い限り、--confirm を付けてはならない。

**STEP 3｜生成**
`node factory/scripts/art-generate.mjs <world-id> --confirm`
失敗が出ても続行される（リトライ3回・manifestに lastError 記録）。
失敗分は同じコマンドの再実行で再開できる（成功済みはスキップ）。

**STEP 4｜機械的QA**
`node factory/scripts/art-qa.mjs <world-id>`（寸法・透過・PNG妥当性）

**STEP 5｜visual QA（Claudeの目視）**
生成された各PNGを Read で開き、manifest の scene / required_objects /
forbidden_objects / 共通アートスタイルと突き合わせて判定する:
- 主役が切れていないか（safe_margin）
- 読める文字・数字・ロゴが入っていないか
- クレイ/ジオラマのテイストから外れていないか（写実化・幼児化）
- required_objects が全部入っているか / forbidden_objects が入っていないか
- 人物・建物の一貫性ノートに合っているか（ハルさん・B物件）
不合格は `node factory/scripts/art-qa.mjs <world-id> --flag <id> "<理由>"` で
needs_regeneration にし、STEP 1 に戻って**その画像だけ**再生成する
（再生成も STEP 2 の承認を経ること）。最大2周。直らないものはユーザーへ報告。

**STEP 6｜実装へ反映**
合格後、content モジュールの TODO(art) を実装する（コード編集は Claude が行う）:
- 各画像を manifest の use に従って接続（place画像 / incident image / sceneMap /
  wrapUp beforeAfter / プレースホルダの差し替え）
- `node factory/scripts/art-check-links.mjs <world-id>` で結線を検証し、
  問題ゼロになったら `--update` で status を placed に更新
- `npm run build` / `npm run lint` / ブラウザでの表示確認（画像切れ・粗さ）

**STEP 7｜締め**
変更をコミットし（main へ直接pushしない）、結果を報告する。

## 安全弁

- dry-run がデフォルト。--confirm はユーザー承認後のみ
- 上限は `factory/art/config.json`（枚数/回・USD/回・USD/月）。超過見込みはスクリプトが実行前に拒否する
- APIキーは `.env.local` のみ。チャットに貼らせない・ログに出さない・コミットしない
- 生成済み画像の再生成は `--ids <id> --force` の明示指定のみ（全再生成コマンドは存在しない）
