# QA規約（JC FINAL QA用）

実装後、以下を評価する。評価結果は `factory/projects/<world-id>/qa-report.md` に保存。

## チェック項目

1. ファーストビュー（イベント入口が魅力的か、何をすればいいか分かるか）
2. 操作の分かりやすさ（説明なしで触り始められるか）
3. C利用（道具・情報カードを見ないと解けない作りになっているか）
4. 操作→結果（操作が結果に反映されるか。固定クリアがないか）
5. retry（失敗→再試行の導線があるか）
6. Job Reveal（discoveryEcho が「さっきの行為」を正しく指しているか）
7. interestSeeds（実際にした行為だけが選択肢になっているか）
8. スマホ（縦画面で操作できるか。ドラッグ系はタッチで成立するか）
9. 画像切れ（ホットスポット・シーン画像のクロップ崩れ）
10. 画像の粗さ（表示サイズに対する解像度不足）
11. 既存UIとの一貫性（共通シェル Q1Screen の流儀に沿っているか）
12. 既存ゲームの回帰（registry.ts / data/index.ts への追加が既存編を壊していないか）
13. FACT_CHECK_REQUIRED（未解決フラグの残数と内容）

## 検証手段

- `npm run build`（tsc + vite build が通ること）
- `npm run lint`（oxlint）
- `npm run dev` + ブラウザ確認（town-app 設定、port 5177）
- `node factory/scripts/update-factory-db.mjs`（DB再同期と整合性チェック）

## 分類

- **CRITICAL**: 進行不能・既存編の破壊・重大な実務誤認
- **HIGH**: 禁止事項違反（C不要で攻略可能、固定クリア等）
- **MEDIUM**: 分かりにくい操作、画像品質、文言
- **LOW**: 微調整

修正可能なものは修正案まで作成する。
