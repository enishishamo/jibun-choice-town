# Ver.1 Archive — 保存方法と復元方法

作成日: 2026-09-20
目的: Ver.2（PLAY FIRST）開発中に、これまで作ったゲーム・コンテンツを失わないこと。

## 何を保存したか

| 項目 | 値 |
|---|---|
| 保存対象コミット | `78ada73f0d685fc1274ebcf72f7db1b99a0e25bf`（`origin/main`、PR #5 merge） |
| 内容 | 2026-09-20 時点で GitHub Pages に公開されている Ver.1（14 world / 64 Q1 体験、`src/` `public/` `factory/` すべて） |
| 注釈付きタグ | `ver1-archive-2026-09-20`（**動かさない**。`release-lifecycle.md` の STABLE tag と同じ扱い） |
| アーカイブブランチ | `archive/ver1`（同じコミットを指す。参照・比較・緊急 hotfix 用） |
| 既存 Stable tag | `stable-prototype-v0.1`（`85acbd5`、2026-09-04）はそのまま残す |

タグとブランチの両方を作った理由: タグは「その時点」を不変に指す記録、ブランチは
`git checkout` / `git diff` / GitHub 上での閲覧がしやすい入口。役割が違うので両方置く。

## 既存 main / deploy 運用への影響

- `main` は変更していない。GitHub Pages は引き続き `main` へのpushでのみ deploy される。
- Ver.2 の開発は `v2/develop` ブランチで行う（[`docs/jibun-choice-v2/MIGRATION_PLAN.md`](../../../docs/jibun-choice-v2/MIGRATION_PLAN.md)）。
- 未コミットだった MAP 横pan 作業（⑧）は `wip/map-pan-direct-manipulation` ブランチ（ローカル）に退避した。アーカイブには含まれない。

## 復元・参照の手順

```bash
# Ver.1 のコードを見る（読み取り専用の detached HEAD）
git checkout ver1-archive-2026-09-20

# Ver.1 のコードを編集できる状態で開く
git checkout archive/ver1

# 現在のブランチと Ver.1 の差分
git diff ver1-archive-2026-09-20 -- src/ public/

# Ver.1 の特定ファイルだけ取り出す（例: 給食編のコンテンツ定義）
git show ver1-archive-2026-09-20:src/data/content/schoolLunch.ts

# Ver.1 をローカルで動かす
git worktree add ../jibun-choice-ver1 ver1-archive-2026-09-20
cd ../jibun-choice-ver1 && npm ci && npm run dev
```

## 公開版を Ver.1 に戻す必要が出た場合

`main` を `78ada73` に戻す操作は **人間の明示指示があるときのみ**（force-push 禁止のため、
戻す場合は `git revert` の連続、または人間の判断で新しいコミットとして復元する）。
AI が単独で行わない。

## 禁止事項

- `ver1-archive-2026-09-20` タグを削除・移動しない
- `archive/ver1` を force-push しない
- Ver.1 の資産（`src/q1/*`, `src/data/content/*`, `public/assets/*`）を Ver.2 開発の都合で削除しない
