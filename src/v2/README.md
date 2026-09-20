# src/v2 — JIBUN CHOICE Ver.2（PLAY FIRST）開発領域

正本仕様: [`docs/jibun-choice-v2/`](../../docs/jibun-choice-v2/README.md)。
決定記録: `factory/state/product-ideas/gate-log.md` entry-2026-09-20-01。

## Ver.1 / Ver.2 の切り替え方式（T-01 = 案A、2026-09-20 決定）

| | Ver.1（公開版） | Ver.2（開発中） |
|---|---|---|
| HTML エントリ | `index.html` → `src/main.tsx` → `src/App.tsx` | `v2.html` → `src/v2/main.tsx` → `src/v2/App.tsx` |
| dev URL | `http://localhost:5177/jibun-choice-town/` | `http://localhost:5177/jibun-choice-town/v2.html` |
| `npm run build`（CI と同じ） | 含まれる | **含まれない**（`dist/` に `v2.html` は出ない） |
| `npm run build:v2` | 含まれる | 含まれる（`VITE_INCLUDE_V2=1`） |
| CSS | `src/index.css` | `src/v2/index.css`（別ファイル、混ぜない） |
| localStorage | `jibun-choice-progress-v1` | **未定（T-03）**。決まるまで読み書きしない |

- Vite はルートの `*.html` をすべて dev で配信するので、Ver.2 は開発中いつでも `/v2.html` で開ける。
- 本番ビルド（`.github/workflows/deploy.yml` の `npm run build`）は `vite.config.ts` の
  `rollupOptions.input` が `index.html` だけなので、`v2/develop` を将来 `main` に merge しても
  **環境変数を付けない限り Ver.2 は公開されない**。公開の切り替えは Human Decision（T-02）。
- Ver.1 側のファイル（`src/{screens,q1,state,data,lib}`, `src/App.tsx`, `src/main.tsx`,
  `src/index.css`, `public/`）は Ver.2 の開発で変更しない。

## 機械的なガード

```bash
npm run check:ver1-freeze
```

`factory/harness/ver1-freeze-check.mjs` が次を検査し、違反なら exit 1:

1. `src/`・`public/`（`src/v2/` を除く）が `ver1-archive-2026-09-20` と一致している
2. `src/v2/**` が `src/screens` / `src/q1` / `src/state` / `src/App` / `src/main` / `src/index.css` を import していない
   （`src/data` と `src/lib` の read-only 利用は許可）

Ver.2 のコミット前・PR 前に必ず実行する。

## ディレクトリ構成（予定）

```
src/v2/
  main.tsx            エントリ
  App.tsx             ルートシェル（画面遷移は未実装）
  index.css           Ver.2 専用 CSS（パレット未定）
  games/<game-id>/    1 ゲーム = 1 ディレクトリ（最初: lunch-menu）
    <Game>.tsx        盤面（PLAY FIRST: 説明画面なし・最初のタップで反応）
    <game>Logic.ts    純ロジック（React なし。factory/harness の gameplay-qa から直接読む）
    README.md         NEEDS_VALIDATION と根拠の記録
  world/              全体MAP・給食 WORLD MAP（未着手）
  companion/          相棒（CHARACTER_BIBLE の HARD RULE を守る。未着手）
  note/               ぼうけんノート（未着手）
  state/              Ver.2 の進捗（T-03 決定後）
```

## やってはいけないこと

- 承認済み design にない文言・色・icon・card・装飾を追加する／illustration を emoji・CSS で代替する
  （DESIGN LOCK。不足は `DESIGN_NEEDED`、仮表示は `TEMP_IMPLEMENTATION_ONLY` と明示し PUBLIC に出さない —
  [`docs/jibun-choice-v2/DESIGN_OWNERSHIP.md`](../../docs/jibun-choice-v2/DESIGN_OWNERSHIP.md)）
- Ver.1 のコード・アセットを変更・削除する
- `src/v2` から Ver.1 の画面・ゲームコンポーネントを import する
- `docs/jibun-choice-v2/OPEN_DECISIONS.md` の OPEN / NEEDS_VALIDATION を推測で埋める
- 職業名を PLAY 前に表示する / 説明画面を先に置く（PLAY FIRST）
- `main` へ直接 push する / Ver.2 を公開する（Human 承認が必要）
