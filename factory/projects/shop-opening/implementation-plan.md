# 実装計画: 商店街の空き店舗に新しい店ができる（shop-opening）

前提: design.md **v1.1**（Critic 1回目反映済み・全5ゲーム80点以上・BLOCKERなし）を実装する。
v0.1 の安全弁により、この計画の実行は**ユーザーの「実装して」指示後**。

## 1. 新規作成ファイル（既存ファイルは下記2点の追加行以外いっさい変更しない）

| ファイル | 内容 | 目安規模 |
| --- | --- | --- |
| `src/data/content/shopOpening.ts` | ContentModule（place: shopping-street / event: shop-opening / incidents 5件 requires連鎖 / professions 5件 / experiences 5件）。文言はすべて design.md §0〜§6 から転記 | 400行前後 |
| `src/q1/TenantMatchGame.tsx` | ch1 `tenant_match`（matching）: 物件カルテ×希望者×条件カード交渉 | 250行前後 |
| `src/q1/PlanCoachGame.tsx` | ch2 `plan_coach`（conversation_observation）: 質問→計画書の弱点特定→助言。**面談済みの欄しか指摘できないゲート**が本体 | 220行前後 |
| `src/q1/LoanScreenGame.tsx` | ch3 `loan_screen`（measurement_inspection）: 計画書×通帳めくり×見積書の照合→面談→承認判断（満額/減額の複数解） | 250行前後 |
| `src/q1/ZoneFitGame.tsx` | ch4 `zone_and_fit`（spatial_placement）: 基準必須設備を先置き→席数・動線トレードオフ→保健所事前相談で検証 | 280行前後 |
| `src/q1/SceneAuditGame.tsx` | ch5 `scene_audit`（search_discovery）: チェックリスト持参の実地検査。○✗を自分で記入、不備プール3件中2件、改善→再検査 | 250行前後 |

## 2. 既存ファイルへの追加行（追加のみ・変更なし）

`src/data/index.ts`（2行）:
```ts
import { shopOpening } from "./content/shopOpening";
// MODULES 配列の末尾に shopOpening を追加
```

`src/q1/registry.ts`（セクションコメント＋5行）:
```ts
  // 商店街編
  tenant_match: TenantMatchGame, // 相手の意向×物件条件×全体バランスで組み合わせる
  plan_coach: PlanCoachGame, // 話を聞き出す→書類の弱点を特定→直し方を助言
  loan_screen: LoanScreenGame, // 複数書類の突き合わせ→面談で確認→承認判断
  zone_and_fit: ZoneFitGame, // 基準必須を先に固定し、残りで営業効率を設計
  scene_audit: SceneAuditGame, // 現場を見て回り、基準と照らして自分で判定を記入
```
（import 5行も追加）

## 3. 章間の状態連動（v0.1 ルール内での実装方針）

design.md の実装ノートにある ch3承認額→ch4予算 の連動は、
**GameState.tsx（共通画面）を変更せず** `localStorage` で行う:
- キー: `jc.shop-opening.loanAmount`（LoanScreenGame が承認時に書き、ZoneFitGame が読む）
- 読めない場合のフォールバックは design.md 指定の固定値（満額 280）
- 同様に ch1 の入居業種（wrapUp/E 文言用に使う場合）: `jc.shop-opening.tenantChoice`
- 将来 GameState への正式な章間状態の導入は QA 後の別判断（factory-self-audit の後回し改善に追記済みの方針に従う）

## 4. 画像アセット

- 一覧・仕様: `art-manifest.json`（**42エントリ**・place 7 / incident_icon 5 / character 3 / tool 25 / before_after 2）
- 配置先: `public/assets/shop/`、コンテンツ側は既存慣例の
  `` const S = (n: string) => `${import.meta.env.BASE_URL}assets/shop/${n}.png` ``
- 画像が揃う前の実装は **emoji フォールバック**（Incident.emoji / ToolInfo.emoji は
  既存スキーマで対応済み）で進められる。manifest の status を
  pending → generated → placed で管理
- 特記: ba-before / ba-after / karte-b は同一建物・同一画角（wrapUp の因果）。
  水栓3タイプは差分＝形状のみ（ch4→ch5 の伏線の成立条件）

## 5. 実装順序（1ゲームずつ動かす。段階的に）

1. `shopOpening.ts` を emoji フォールバックで作成 + index.ts / registry.ts へ追加
   （この時点で5章がプレースホルダとして画面に出る）→ build 確認
2. ch1 → ch2 → ch3 → ch4 → ch5 の順にコンポーネント実装
   （requires 連鎖の上流から。各ゲーム完成ごとにブラウザで
   失敗パス→再試行→成功パスを実プレイ検証。WaterGame の失敗設計を基準実装として参照）
3. jc-final-qa による13項目QA（Layer 2: 5コンポーネントのコード精読、
   `component-reviews.json` へ5エントリ追記、reviewedHash 刻印）
4. `node factory/scripts/update-factory-db.mjs`（DB再生成・STALE/整合性チェック）
5. 画像生成（人間・manifest 準拠）→ 差し替え → 画像切れ/粗さの再QA

## 6. QA で特に検証する点（Critic 減点理由の残り）

- ch1: B物件の条件カード対応表（design.md v1.1 §1）どおりに実装されているか
- ch3: 通帳めくり・○/▲手書き記入が操作の主役か（RxCheck と体験がかぶらないか）
- ch4: ch3 承認額の予算連動が働くか（減額を選んだ場合に差が出るか）
- ch5: 不備プールの抽選で E がプレイごとに変わるか、紛らわしい適合スポットで
  「全部✗総当たり」が失敗するか
- 全章: 最終 E がプレイヤーの選択を反映するか（固定クリア禁止・power-heat の教訓）
- 残存 FACT_CHECK（design.md §7）: ch2 の売上計算例の資料根拠を実装前に1回だけ再確認。
  なければフォールバック表現（客数×客単価×営業日数）で実装

## 7. 回帰安全

- 既存6編のファイルは無変更（index.ts / registry.ts の追加行のみ）
- 実装ブランチ: `feature/shop-opening` を `feature/game-factory` から分岐（main 直 push 禁止）
- QA で既存34ゲームのスモーク（登録数・route の生存）を DB 突合で確認
