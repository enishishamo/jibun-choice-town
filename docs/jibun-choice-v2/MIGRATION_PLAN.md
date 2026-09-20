# MIGRATION PLAN — Ver.1 → Ver.2

作成: 2026-09-20。状態ラベルは [README.md](README.md) 参照。

## 1. 現状（2026-09-20）

- 公開 URL: `https://enishishamo.github.io/jibun-choice-town/`（`main` push で自動 deploy）
- Ver.1 内容: 14 world / 64 Q1 体験 / 64 ゲームコンポーネント / 43 ロジックファイル / assets 196 ファイル（83MB）
- 画面遷移: URL ルーティングなし。`src/state/GameState.tsx` の `screen` state machine
  （home → map → area → q1 → profession / zukan）
- 進捗: `localStorage["jibun-choice-progress-v1"]`（completed / discovered / visitedEvents / seenVersion / seeds）
- ゲート: `main` へのpushで `src/` `public/` が変わる場合、`factory/state/tasks.json` に
  passing gate 記録がないと CI が deploy を止める（`factory/scripts/release-gate-check.mjs`）

## 2. Ver.1 の凍結（完了）

| 種類 | 名前 | コミット |
|---|---|---|
| 注釈付きタグ | `ver1-archive-2026-09-20` | `78ada73` |
| ブランチ | `archive/ver1` | `78ada73` |

詳細・復元手順: [`factory/state/release/ver1-archive.md`](../../factory/state/release/ver1-archive.md)

## 3. Ver.2 の開発系統

### ブランチ（決定・実施済み）

- `v2/develop` — Ver.2 の Development Track。`78ada73`（= Ver.1 = 現 `main`）から分岐。
- `main` — 引き続き Ver.1 の Stable/Public。Ver.2 の作業を直接 push しない。
- `wip/map-pan-direct-manipulation` — Ver.1 側の未完了作業（MAP 横pan ⑧）。Ver.2 とは無関係。ローカルのみ。

### コードの分離方式（T-01・**決定: 案A**、2026-09-20 Human Decision）

実装済み（`v2/develop`）:

| | Ver.1（公開版） | Ver.2（開発中） |
|---|---|---|
| HTML エントリ | `index.html` → `src/main.tsx` | `v2.html` → `src/v2/main.tsx` |
| dev URL | `/jibun-choice-town/` | `/jibun-choice-town/v2.html` |
| `npm run build`（CI と同一） | 含む | **含まない**（`vite.config.ts` の `rollupOptions.input` は `index.html` のみ） |
| `npm run build:v2` | 含む | 含む（`VITE_INCLUDE_V2=1`） |
| CSS / localStorage | `src/index.css` / `jibun-choice-progress-v1` | `src/v2/index.css` / 未定（T-03、決まるまで触らない） |

- Ver.1 側のファイルは一切変更していない（`src/main.tsx`・`index.html` も無変更）。
- `main` に将来 `v2/develop` を merge しても、CI の `npm run build` は環境変数なしなので
  **Ver.2 は公開されない**。公開の切り替えは T-02 の Human Decision。
- ガード: `npm run check:ver1-freeze`（`factory/harness/ver1-freeze-check.mjs`）が
  「`src/`・`public/`（`src/v2/` 除く）が `ver1-archive-2026-09-20` と一致」「`src/v2` が Ver.1 の
  screens/q1/state/App を import していない」を機械的に検査する。Ver.2 のコミット前に必ず実行。
- 詳細: [`src/v2/README.md`](../../src/v2/README.md)

以下は決定前の比較記録として残す。

#### 比較（決定済み・記録）

| 案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| **A（推奨）** | 同一 app 内に `src/v2/` を新設し、`App.tsx` の起動時に **build-time flag**（例: `VITE_APP_VERSION=2`）または起動画面の切替で Ver.1 / Ver.2 のどちらを描画するか決める | Ver.1 の資産（assets・data・ロジック）を同じリポジトリで参照・再利用できる。1 ゲームずつ Ver.2 側へ移せる。deploy 設定を変えなくてよい | `src/` が二重構造になる。Ver.1 のコードを誤って触るリスク（→ lint/CI で `src/q1/`・`src/screens/` への変更を Ver.2 ブランチで警告する仕組みを検討） |
| B | `/v2/` サブパスで別ビルド（`vite.config` を 2 本） | 公開 URL を分けられる。Ver.1 と Ver.2 を同時公開できる | CI/Pages 設定の変更が必要。deploy policy の再設計が必要 |
| C | 別リポジトリ | 完全分離 | Ver.1 資産の再利用・比較が面倒。Factory ルール群の二重管理 |

推奨は **A**。理由: 今回の方針が「給食編を 1 ゲームずつ作り直す」「既存資産を削除しない」
であり、同一リポジトリ内で Ver.1 のロジック（`*Logic.ts`）・assets・監査結果を参照しながら
作り直すのが最短。最終決定は Human（T-01）。

### 公開先（T-02・OPEN）

Ver.2 が「1 ゲーム完成 → テスト」の段階に入った時点で決める。それまで **PUBLIC deploy はしない**。
子どもテスト用の限定公開（例: `v2/develop` を別 Pages / プレビュー URL）は別途 Human Decision。

## 4. Ver.2 の作り方（LOCKED の方針）

```
給食編
 ↓ 1 ゲーム完成（最初: 栄養・メニュー）
 ↓ テスト（実機 375px、子どもテスト）
 ↓ 改善
 ↓ 次のゲーム
```

- 量より完成度。
- Ver.2 の公開導線には未改修ゲームを大量に並べない。
- 既存ゲームは削除せず `archive/ver1` と `src/q1/` に残す。

## 5. Factory ルールとの接続

- **Product Identity Gate**: Ver.2 の相棒・ループ・アイテム・ノートは Human Decision 済み
  （`gate-log.md` entry-2026-09-20-01）。ただし [OPEN_DECISIONS.md](OPEN_DECISIONS.md) の項目は未決定のまま。
- **deploy-release-policy**: Ver.2 は「新しい core gameplay loop」に該当するため、
  **Ver.2 を `main` へ反映する行為は自動 deploy 対象外**（必ず Human 承認）。
- **release gate（tasks.json）**: `v2/develop` 上でも 1 ゲームごとに task を作り、QA / 独立レビュー
  （`factory/harness/codex-review.mjs`）の evidence を記録する運用を推奨（T-05）。
- **Design Ownership**（2026-09-20）: 見た目・文言は GPT（Design Owner）が設計し Human が承認、Claude Code は実装のみ。
  `art-style.md` / `visual-design-system.md` / `visual-production-flow.md` は Ver.1 にのみ従来どおり適用
  （[DESIGN_OWNERSHIP.md](DESIGN_OWNERSHIP.md) §4）。
- **language-style / qa-rules / game-critic-v2**: 引き続き適用。ただし game-critic-v2 の採点軸に
  PLAY FIRST（説明画面なし・最初のタップで反応）が入っていない場合は、Ver.2 用に追記が必要（OPEN）。

## 6. 次に着手できる最小タスク（実装はまだ開始しない）

**Step 0（2026-09-20 完了）**: Ver.1 凍結（`ver1-archive-2026-09-20` / `archive/ver1`）/ `v2/develop` /
Design Bible / Ver.1 AS-IS 監査 / `src/v2/` 開発基盤（案A、`check:ver1-freeze`）/
Visual Reference 配置（`design/v2/reference/concept-board-2026-09-20.png`、Master ではない）。
→ **Ver.2 移行準備は完了扱い。** 以降は Step 1 から。

**Step 1（次）— 栄養・メニュー Ver.2 の「体験設計」**（コードを書かない。DESIGN_OWNERSHIP §3 の第 1 段）:
1. NEEDS_VALIDATION V-01〜V-04 の事実確認（`jc-researcher` 相当の一次情報調査）
2. 事実に基づく「体験」の設計: 何を触る／何が即座に変わる／スコアの意味（見せ方は GPT Screen Design）
3. Lv1（栄養のみ）の最小仕様を `factory/projects/v2-lunch-menu/design.md` として作成
4. `jc-critic` 相当の独立レビュー（PLAY FIRST 規約・principles.md BLOCKER）
5. → **GPT Screen Design / Assets → Human Approval → Master**（Claude Code はここで待つ）

**Step 2 以降**: Claude Code Implementation（承認済み design のみ、`src/v2/games/lunch-menu/`）→
Screenshot（375px）→ GPT / Codex Visual QA → 修正 → Human Approval → 子どもテスト → 改善 → 次ゲーム（候補順は OPEN）。
Human Approval 前に完成 UI を独自設計しない。

## 7. 今回やらなかったこと（意図的）

- 全ゲームの Ver.2 化 / 医療 WORLD・テクノロジー WORLD の詳細設計
- 栄養ゲームの事実未確認ロジックの実装
- 既存コンテンツ削除 / `main` への変更 / PUBLIC deploy
- 新規画像の大量生成 / Reference の Master 昇格
- デザインの不足部分の推測による確定
