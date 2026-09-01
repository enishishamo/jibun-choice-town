# Game Design Lab（mini）

既存ゲームの研究から再利用可能な mechanic を抽出し、
「仕事固有の難しさ」→「適した mechanic」→「A→B→C⇄D→E 設計」へ翻訳する工房。
Stage 1〜2 で構築（2026-09-02）。評価規約は `../rules/game-critic-v2.md`。

## パイプライン

```
1. RESEARCH      research/games.json        既存ゲームをジャンル横断で構造分解
                                            （Codexへ委譲・Claudeがキュレーション）
2. MECHANICS     ../taxonomy/mechanics-library.json
                                            タイトル非依存の再利用mechanicへ正規化
3. JOB DIFFICULTY job-difficulty-taxonomy.md 仕事固有の難しさを先に抽出（★mechanic先行禁止）
4. MATCHING      ../taxonomy/job-mechanics-map.json
                                            difficulty → mechanic 候補のmapping
5. DESIGN        projects/<id>/design.md    A→B→C⇄D→E 仕様（2〜4案 → 独立比較 → 選択）
6. CRITIC        game-critic-v2.md 準拠      二軸（CAREER_AUTHENTICITY × GAME_QUALITY）
```

## 鉄則

- **mechanic を仕事へ貼るのは禁止**。先に「その仕事固有の難しさは何か」を抽出し、
  その difficulty に適した mechanic を後から match する
- ゲームタイトルの模倣ではなく構造の抽出。research の各エントリは
  `reusable_mechanics`（snake_case・タイトル非依存）まで分解して初めて完成
- 小学生向けでも game quality の基準は下げない。下げてよいのは認知負荷・文章量・UI 複雑性のみ
- 較正ルール: C_required=true は望ましい。問題は C_alone_determines_answer=true のみ

## ファイル

| ファイル | 内容 | 更新者 |
| --- | --- | --- |
| `research/games.json` | 研究済みゲームの構造分解（15本〜） | Codex 生成 → Claude 検収 |
| `research/batch-*.result.json` | Codex 委譲の生ログ | 自動 |
| `job-difficulty-taxonomy.md` | 仕事固有の難しさの分類 | Claude |
| `../taxonomy/mechanics-library.json` | 再利用 mechanic ライブラリ | Claude 統合・Codex レビュー |
| `../taxonomy/job-mechanics-map.json` | difficulty ↔ mechanic の対応 | Claude |
