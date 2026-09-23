# src/v2/lunch — 栄養教諭 Job Vertical Slice

`MAP → こんだて PLAY → EVENT → CLEAR → JOB REVEAL → KNOW THE JOB →（CAREER PATH）→ 好きの種 → MAP RETURN`

- 仕様の正本: [`factory/projects/v2-lunch-menu/nutrition-teacher-slice.md`](../../../factory/projects/v2-lunch-menu/nutrition-teacher-slice.md)
  （`experience-design-proposal.md` は「ここに至った経緯」の記録であって仕様ではない）
- 事実の出典: [`facts/research-2026-09-21.md`](../../../factory/projects/v2-lunch-menu/facts/research-2026-09-21.md)（F1〜F8・一次情報）
- Ver.1 からの引き継ぎ: [`legacy-inventory.md`](../../../factory/projects/v2-lunch-menu/legacy-inventory.md)
- ルール: [`docs/jibun-choice-v2/`](../../../docs/jibun-choice-v2/)（DESIGN_OWNERSHIP / VISUAL_TONE / CHARACTER_BIBLE）

開発 URL: `http://localhost:5177/jibun-choice-town/v2.html`

## 構成

| ファイル | 役割 |
|---|---|
| `types.ts` | 画面と MAP の共有型（SpotId / SpotState / RoadState / LunchWorldView / LunchScreen） |
| `copy.ts` | 子どもが目にする文言の**唯一**の置き場。aria-label も含む。ここに無い文字列が画面に出たら QA が落ちる |
| `worldView.ts` | 進捗 → MAP 表示状態の導出（生の値は保存しない） |
| `LunchWorldApp.tsx` | 縦切りの画面遷移。TOP レーンが 1 ユニットとして mount できるよう自前 state |
| `Art.tsx` | 画像 1 枚のラッパ。src なし／読み込み失敗なら fallback に落ちるので、壊れた画像アイコンは出ない |
| `PlaceMark.tsx` | 生成タイルが無い場所のクレイ図形。TEMP ではなく、それ自体が完成物 |
| `assets.ts` | `public/assets/v2/lunch/` への対応表。**配線していない画像とその理由もここに書く** |
| `world/LunchWorldMap.tsx` | 5 スポット＋道（muted / trouble / solved、off / partial / on） |
| `play/lunchMenuLogic.ts` | 純ロジック。4 軸のバンド、完全給食（主食＋ミルク＋おかず）、EVENT、2 回送信 |
| `play/LunchMenuPlay.tsx` | 盤面。判定は**描かれた玉の位置**から読む（モデルと絵がずれたら送れない） |
| `screens/` | JobReveal / KnowTheJob / CareerPath / SeedPick |
| `../state/progress.ts` | Ver.2 進捗（`localStorage["jibun-choice:v2:progress"]`。Ver.1 キーは読まない。score は持たない） |

## 機械検証

```bash
npm run qa:v2-lunch          # 純ロジック 54 checks（126 通り全探索・EVENT の回復可能性・commit ゲート）
npm run shots:v2-lunch       # 実 Chrome で 375×812 を実操作、24 state 撮影＋assert（5 サイズ掃引を含む）
npm run check:ver1-freeze    # Ver.1 不変・Ver.1 import なし
npx tsc -p tsconfig.app.json --noEmit && npm run lint
```

ゲート検査の書き方は [`factory/rules/qa-rules.md`](../../../factory/rules/qa-rules.md) §「ゲート検査の書き方」。
**新しい検査は、わざと壊した実装を入れて落ちることを見てから記録する。**
これまでの変異は [`factory/state/qa/v2-lunch-mutation-log.md`](../../../factory/state/qa/v2-lunch-mutation-log.md)。

## Asset pipeline（自走）

```
factory/projects/v2-lunch-menu/art-requests/*.json
  → node factory/projects/v2-lunch-menu/art-run.mjs   art-loop（生成→vision QA→再生成 ≤3）
  → factory/harness/art/asset-postprocess.py          alpha 検証／白背景キー／トリム／master サイズ
  → public/assets/v2/lunch/**
  → src/v2/lunch/assets.ts
```

provenance: `factory/state/art/manifest-v2.json`（`asset_id` は `v2_lunch_*`）。
raw 生成物: `factory/state/art/generated/v2-lunch/`。
「届かなかった」状態は画像を作らず CSS（閉じた木箱＋shake）。

## いまの見た目（2026-09-22）

| 領域 | 状態 |
|---|---|
| 料理 9 品＋牛乳・トレー・トラック・学校 | 生成済み・Art QA PASS |
| WORLD MAP の 5 か所 | 生成済み（そだてる／つくる／こんだて＝新規タイル、はこぶ／とどける＝トラックと学校を流用） |
| KNOW THE JOB の 3 場面 | 生成済み（給食室／教室／相談） |
| こんだての ようす（4 本の溝の板） | CSS 描画。窪み＝ちょうどいい範囲は `bandOnTrack()` から実行時に計算するので、絵と規則がずれない |
| WORLD MAP の地面（弁当箱） | CSS 描画。生成物はあるが配線していない（DN-MAPGROUND） |
| 相棒の反応ポーズ | 未制作（Master PNG 未配置。別キャラで代替しない） |

配線していない生成物とその理由: [`art-wiring-2026-09-22.md`](../../../factory/projects/v2-lunch-menu/art-wiring-2026-09-22.md)。
未解決の画面設計（DN-KNOW-LAYOUT / DN-CAREER-LAYOUT / DN-SEED-LAYOUT / DN-MAPGROUND /
DN-RACK-HOLLOW）は Design Owner 待ちで、台帳 `factory/state/tasks.json` が正本。
