# Art Harness（Stage 6）

画像の必要判定 → 再利用 → 生成/構成 → QA → 再生成 → 実装 → ブラウザ Visual QA までの自動ループ。
スタイル正本: [style-contract.md](style-contract.md)（reference assets つき）

## 絶対ルール

- **従量課金 API 禁止**。`art-provider.mjs` が paid provider（openai_image_api 等）を機械的に拒否
- 生成経路は **codex_imagegen のみ**（Codex CLI 組み込み `image_gen.imagegen`・ChatGPT OAuth・
  API キー不要・subscription_included_confirmed — 2026-09-02 実プローブ済み、
  `factory/state/art/provider-status.json`）
- 優先順位: **reuse > CSS > SVG > composition > codex_imagegen > human_boundary**
- 画像を増やすこと自体を目的にしない。OPTIONAL は生成しない
- 既存の良い asset を「統一のため」に再生成しない（orphan も削除せず保護）

## 構成

| ファイル | 役割 |
| --- | --- |
| `asset-inventory.mjs` | 機械インベントリ（寸法/hash/参照/重複/orphan、動的参照prefix対応）→ `factory/state/art/asset-inventory.json` |
| `art-need-detector.mjs` | Codex 委譲の意味スキャン + 再利用で必要数を削減 → `art-needs.json` |
| `art-provider.mjs` | Provider Adapter（generate / compose / human-boundary。paid は enabled=false 固定） |
| `art-loop.mjs` | 生成ループ（prompt生成→生成→QA→失敗理由を次promptへ→最大3回）+ Manifest v2 |
| `art-qa.mjs` | 機械チェック + Codex vision critic（10カテゴリ・pair モードで Before/After 整合QA） |
| `art-link-qa.mjs` | 参照切れ/casing/重複名/配置違反/巨大ファイル検査（fail-closed） |
| `style-contract.md` | Art Style Contract（文章 + reference asset paths） |

状態: `factory/state/art/`（inventory / needs / provider-status / manifest-v2 / human-boundary/）

## 使い方

```
node factory/harness/art/art-need-detector.mjs          # 必要画像の抽出と再利用削減
node factory/harness/art/art-loop.mjs run --request factory/projects/<world>/art-requests/<id>.json
node factory/harness/art/art-loop.mjs run-pair --before <before.json> --after <after.json>
node factory/harness/art/art-qa.mjs asset --file public/assets/<...> --purpose "..."
node factory/harness/art/art-link-qa.mjs                # コミット前の資産検査
```

## Before / After（§9）

`run-pair` は Before を先に生成・QA し、**合格した Before を参照画像として After を生成**、
pair QA（同一建物・同一カメラ・同一街並みを strict 判定）まで自動で行う。

## HUMAN_BOUNDARY（§19）

自動化可能な無課金 provider が使えない要求は `art-provider.mjs human-boundary` が
prompt・寸法・filename・reference・配置先まで含む実行可能パッケージを
`factory/state/art/human-boundary/` に書き出す。**これは失敗ではない**
（ART_PIPELINE_READY / GENERATION_PROVIDER_UNAVAILABLE）。provider が使えるようになれば
同じ request JSON をそのまま `art-loop.mjs run` に渡せる。
