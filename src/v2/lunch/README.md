# src/v2/lunch — 給食 WORLD 縦切り（MAP → こんだて PLAY → CLEAR → JOB REVEAL → 好きの種 → MAP）

体験設計: `factory/projects/v2-lunch-menu/experience-design-proposal.md`（Human 決定 2026-09-20）
事実確認: `factory/projects/v2-lunch-menu/facts/`（V-A1〜A9）
ルール: `docs/jibun-choice-v2/`（DESIGN_OWNERSHIP / VISUAL_TONE / CHARACTER_BIBLE）

## 構成

| ファイル | 役割 | 状態 |
|---|---|---|
| `types.ts` | MAP と PLAY の共有型（SpotId / SpotState / RoadState / LunchWorldView） | 確定 |
| `copy.ts` | 表示文言の**唯一**の置き場。すべて `DESIGN_NEEDED` プレースホルダ | GPT 置換待ち |
| `worldView.ts` | 進捗 → MAP 表示状態の導出 | 確定 |
| `LunchWorldApp.tsx` | 縦切りの画面遷移（自前 state。TOP レーンが 1 ユニットとして mount する） | 確定 |
| `world/LunchWorldMap.tsx` | 開いた弁当箱 + 5 スポット + 道（状態: muted / trouble / solved、off / partial / on） | ロジック確定・見た目 TEMP |
| `play/lunchMenuLogic.ts` | 純ロジック（料理・採点・EVENT・commit）。**全ルールが PROVISIONAL**、V-A 確定後に再調整 | 事実確認待ち |
| `play/LunchMenuPlay.tsx` | 盤面（タップで置く／戻す、即時再計算、EVENT、swipe-up commit） | ロジック確定・見た目 TEMP |
| `screens/JobReveal.tsx` / `SeedPick.tsx` | CLEAR 後の 2 画面 | 見た目 TEMP |
| `../state/progress.ts` | Ver.2 進捗（`localStorage["jibun-choice:v2:progress"]`、Ver.1 キーは読まない） | 確定 |

開発 URL: `http://localhost:5177/jibun-choice-town/v2.html#lunch`（`#lunch` は TEMP の開発用スイッチ。TOP レーンの導線が入ったら撤去）。

## 機械検証

```bash
node factory/harness/gameplay-qa-v2-lunch-menu.mjs   # 複数解・トレードオフ・EVENT・commit ゲート（15 checks）
npm run check:ver1-freeze                            # Ver.1 不変・Ver.1 import なし
npx tsc -p tsconfig.app.json --noEmit && npx oxlint src/v2
```

## Asset pipeline（自走、2026-09-21）

```
factory/projects/v2-lunch-menu/art-requests/*.json   承認済み Visual Direction から起こした 13 件
  → node factory/projects/v2-lunch-menu/art-run.mjs  直列: art-loop（生成→vision QA→再生成≤3）
  → factory/harness/art/asset-postprocess.py         alpha 検証/白背景キー/トリム/master 256
  → public/assets/v2/lunch/{dishes/*.png,tray.png,truck.png,school.png}
  → src/v2/lunch/assets.ts                           <Art> が読み込み失敗時は placeholder に戻る
  → node factory/harness/v2-lunch-shots.mjs          375×812 実操作 12 state のスクリーンショット
  → node factory/harness/art/art-qa.mjs presentation  in-context QA
```
provenance: `factory/state/art/manifest-v2.json`（asset_id `v2_lunch_*`）、raw 生成物: `factory/state/art/generated/v2-lunch/`。
「届かなかった」状態は画像を作らず CSS（desaturate + badge + shake）。

## GPT Screen Design / Assets の受け口（asset slots）

- `LunchWorldMap` props `assets.bento` / `assets.spot[id]`（`world/README.md` 参照）
- `LunchMenuPlay` props `assets.tray` / `assets.dish[id]` / `assets.truck`
- 承認済み画像は `public/assets/v2/lunch/` に置き、`LunchWorldApp` から渡す（コード変更は 1 箇所）。

## DESIGN_NEEDED（見た目が未決のもの）

`factory/projects/v2-lunch-menu/experience-design-proposal.md` §6 DN-01〜14 と `world/README.md` を正とする。
本ディレクトリの CSS・図形・文言はすべて `TEMP_IMPLEMENTATION_ONLY`。PUBLIC には出さない。
