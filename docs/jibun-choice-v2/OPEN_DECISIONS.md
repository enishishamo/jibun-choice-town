# OPEN DECISIONS / NEEDS_VALIDATION 台帳

制定: 2026-09-20。**ここに載っている項目は AI が推測で確定してはいけない。**
決まったら該当仕様書へ LOCKED として転記し、ここでは「決定済み（日付・場所）」に更新する。

## A. Product / Design（Human Decision 必要）

| ID | 項目 | 関連仕様書 | 状態 |
|---|---|---|---|
| D-01 | 相棒の正式名称 | CHARACTER_BIBLE §0 | OPEN |
| D-02 | 相棒の表情・姿勢の正式 Model Sheet（Master 承認） | CHARACTER_BIBLE §5 / ART_PIPELINE | **一部決定 2026-09-20**: 姿勢 4 面図を Master 化（`design/v2/master/companion-model-sheet-2026-09-20.png`）。表情セットは OPEN |
| D-03 | 相棒のアイテム装着スロット定義 | CHARACTER_BIBLE §5 | OPEN |
| D-04 | 相棒のセリフ・声の有無 | CHARACTER_BIBLE §5 | OPEN |
| D-05 | 給食 WORLD の具体的アイテム一覧と獲得条件 | GAME_DESIGN_RULES §3 | OPEN（reward/collection = Identity Gate） |
| D-06 | ❤️「すきかも」を付けるタイミングと UI | GAME_DESIGN_RULES §4 | OPEN |
| D-07 | 「であったもの」の記録粒度（行為／場所／職業） | GAME_DESIGN_RULES §4 | OPEN |
| D-08 | Ver.1「好きの種」5択チップの扱い（流用／置換） | GAME_DESIGN_RULES §4 | OPEN |
| D-09 | テクノロジー WORLD の入口オブジェと内容 | WORLD_DESIGN §1 | OPEN（今回は設計しない） |
| D-10 | 医療 WORLD の入口オブジェと内容 | WORLD_DESIGN §1 | OPEN（今回は設計しない） |
| D-11 | 「パカッ」の操作（タップ／ズーム）と演出 | WORLD_DESIGN §2 | OPEN |
| D-12 | 給食 WORLD の「道」のグラフ定義（何と何がつながるか） | WORLD_DESIGN §4 | OPEN |
| D-13 | 「学校で食べる」🍴 に対応する PLAY の有無 | WORLD_DESIGN §3 | OPEN |
| D-14 | Event State（たいへん！…）を採用するか、採用時の表現 | WORLD_DESIGN §5 | OPEN |
| D-15 | 栄養ゲームの Lv1〜Lv5 構成の採否 | GAME_DESIGN_RULES §5 | OPEN（検討段階） |
| D-16 | Ver.2 の色指定と `visual-design-system.md` 既存パレットの関係 | VISUAL_TONE §3/§7 | **決定済み 2026-09-20**: Ver.2 は palette v1、Ver.1 は既存パレットのまま |
| D-18 | GPT Screen Design の成果物の受け渡し形式と置き場所（画像のみ／spec 文書／Figma 等） | DESIGN_OWNERSHIP §3 | OPEN |
| D-19 | 「体験設計」段の成果物形式（Claude Code が書く盤面・操作・ロジック案の様式） | DESIGN_OWNERSHIP §3 | OPEN |
| D-17 | 相棒が全画面に出るとき、Ver.1 True Home（写真ベース）をどうするか | MIGRATION_PLAN | OPEN |

## B. 技術・移行（AI が案を出し、Human が選ぶ）

| ID | 項目 | 関連仕様書 | 状態 |
|---|---|---|---|
| T-01 | Ver.2 コードの分離方式 | MIGRATION_PLAN §3 | **決定済み 2026-09-20: 案A**（`src/v2/` ＋ `v2.html` 別エントリ、本番ビルドは `VITE_INCLUDE_V2=1` の時のみ含む） |
| T-02 | Ver.2 の公開先（同一 GitHub Pages を置き換える／`/v2/` サブパス／別 Pages） | MIGRATION_PLAN §3 | OPEN |
| T-03 | 進捗データの保存キー（`jibun-choice-progress-v1` 拡張 or 新キー、移行の要否） | GAME_DESIGN_RULES §4 | OPEN |
| T-04 | Ver.1 MAP（`WorldMapScreen`）を Ver.2 で置き換えるか並存させるか | WORLD_DESIGN §6 | OPEN |
| T-05 | `factory/state/tasks.json` の release gate を Ver.2 ブランチにも適用する運用 | MIGRATION_PLAN §5 | OPEN（適用する前提で推奨） |
| T-06 | Ver.2 用 Art QA（耳・口）の機械チェックの要否 | ART_PIPELINE §7 | OPEN |
| T-07 | palette v1 を `src/v2/index.css` の CSS トークンにする実装タイミング | VISUAL_TONE §3 | OPEN（最初の PLAY 実装時） |
| T-08 | `TEMP_IMPLEMENTATION_ONLY` / `DESIGN_NEEDED` 残存を release gate で機械検出するか | DESIGN_OWNERSHIP §2 | OPEN（grep ベースで実装可能） |

## C. NEEDS_VALIDATION（事実確認が必要。推測で実装しない）

| ID | 項目 | 関連仕様書 |
|---|---|---|
| V-01 | 学校給食摂取基準（対象年齢別）の値と、ゲームで扱う栄養項目の選定 | GAME_DESIGN_RULES §5 |
| V-02 | 1 食あたり材料費の実勢と予算条件の粒度 | GAME_DESIGN_RULES §5 |
| V-03 | 献立作成で実際に考慮される条件と優先順位（栄養／予算／調達／調理／残食／アレルギー） | GAME_DESIGN_RULES §5 |
| V-04 | 改善型スコア（60〜100）の算出根拠・重み付け | GAME_DESIGN_RULES §5 |
| V-05 | 給食サプライチェーンの「つながり」（道のグラフ）が現実と矛盾しないこと | WORLD_DESIGN §4 |
| V-06 | Ver.1 `menuLogic.ts` の 0〜3 段階値はプロトタイプ用仮値であること（流用禁止の根拠） | audits/ |

## D. 決定済み（参照用）

| 日付 | 項目 | 記録場所 |
|---|---|---|
| 2026-09-20 | Ver.2 の思想・ループ・相棒 HARD RULE・アイテム思想・ノート構造・UI/TEXT RULE・最初の基準ゲーム | 本仕様書群 + `factory/state/product-ideas/gate-log.md` entry-2026-09-20-01 |
| 2026-09-20 | Ver.1 を `ver1-archive-2026-09-20` / `archive/ver1` に凍結 | `factory/state/release/ver1-archive.md` |
| 2026-09-20 | T-01 コード分離＝案A（`src/v2/` ＋ `v2.html`、`npm run check:ver1-freeze` でガード） | `src/v2/README.md`、MIGRATION_PLAN §3 |
| 2026-09-20 | Design Owner = GPT / Implementation Owner = Claude Code、DESIGN LOCK、Production Flow、Color/Material HARD DIRECTION（palette v1） | DESIGN_OWNERSHIP.md、VISUAL_TONE.md、gate-log entry-2026-09-20-02 |
