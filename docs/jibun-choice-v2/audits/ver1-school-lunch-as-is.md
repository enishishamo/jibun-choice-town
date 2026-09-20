# Ver.1 給食編（`lunch-late`）AS-IS 監査 — 2026-09-20

対象: `src/data/content/schoolLunch.ts`、`src/q1/{MenuGame,CookGame,FarmGame,LogisticsGame,RecycleGame}.tsx`、
`src/q1/{menuLogic,cookLogic,farmLogic,logisticsLogic,sortOutLogic}.ts`、`useDragDrop.ts`。
コードから確認できた事実のみ。参照コミット: `78ada73`（`ver1-archive-2026-09-20`）。

## 比較表

| # | 項目 | nutrition-lunch（栄養教諭） | cook-lunch（給食調理員） | farmer-lunch（農家） | logistics-lunch（配送） | recycle-lunch（リサイクル） |
|---|---|---|---|---|---|---|
| 1 | 名前/ID/gameType | MenuGame / `drag_and_drop` | CookGame / `inspect_and_measure` | FarmGame / `sow_and_grow` | LogisticsGame / `load_and_route` | RecycleGame / `sort_out` |
| 2 | incident | 「来月の野菜が足りなくなりそう！」（`menu-mystery`） | 「給食室が大忙し！」（`kitchen-busy`） | 「このにんじん、どうやって育てた？」（`no-carrot`） | 「食材は今朝、どうやって届いた？」（`not-delivered`） | 「食べ終わったあとも何かあるみたい…」（`after-lunch`） |
| 3 | Reveal 職業 | 栄養教諭・学校栄養職員 | 給食調理員 | 農家・生産者 | 給食の食材を届ける仕事 | 食べ残しを資源に変える工場の仕事 |
| 4 | 最初の文章 | 「来月使う予定の野菜が、少なくなりそう！」＋「資料を見ながら、献立と食材を調整しよう。」 | 「500人分の給食を、安全に完成させよう！」＋「工程表と道具をたしかめながら進めよう。」 | 「給食で使うにんじんを育てたい！」＋2行 | 「2つの学校に、調理が始まる前に食材を届けたい！」＋1行 | 「食べ残しが工場に届いた。でも、このままではリサイクルできない！」＋1行 |
| 5 | 操作 | 候補カードを副菜スロットへ**ドラッグ**、または**タップ選択→タップ配置**（`useDragDrop` の 8px 閾値で切替） | タップのみ（温度計を持つ→魚 3 か所を計測→オーブン→衛生 2 択→記録票） | タップのみ（3 品種から 1 つ「これでまく」、一発確定） | タップのみ（食材 4 個×ゾーン選択、学校 2 校の訪問順、「出発する」1 回） | タップのみ（異物 3 個を「？」で観察→道具選択→「使う」、全適用後「結果を見る」） |
| 6 | 画面遷移 | 共通シェル。game 内: 入替⇄確認 → confirmed | game 内: round1 → round2（衛生ダイアログ）→ 記録票 → 完了 | game 内: 選択 → success / partial | game 内: 割当・順序 → success / partial | game 内: 観察・適用 → done / reflecting |
| 7 | 成功/失敗 | `supply>=1 && nutri>=1` の副菜で確認。失敗状態なし | round2 で 3 か所すべて ≥75℃ → 記録。失敗状態なし | 3 条件（季節・日数・耐暑）すべて一致。不一致は partial（同一セッション内やり直し不可） | 4 食材ゾーン正解＋訪問順の締切充足。不一致は partial（やり直し不可） | 3 個すべて正しい道具。不一致は reflecting（結果に影響しない答え合わせ）→ partial |
| 8 | スコア | なし | なし | なし | なし | なし |
| 9 | 制限時間 | なし | なし（時計表示は演出） | なし | なし | なし |
| 10 | retry | なし（無制限に入替可） | なし（失敗がない） | なし | なし | なし（reflecting は非機能） |
| 11 | ランダム性 | **なし**（定数） | **なし**（`TEMPS` 定数） | **あり**（月・締切・猛暑をリジェクションサンプリング） | **あり**（食材 4/8 抽選、経路 3 型＋ミラー、校名割当） | **あり**（異物 3 個の性質を独立抽選） |
| 12 | 操作による変化 | 副菜スロットと栄養/予算/調達/調理チップ（×△○◎）がリアルタイム変化 | 魚の温度表示・色、round 切替、記録票 | カード選択後すぐ結果画面 | ゾーンハイライト、訪問順番号 | カードが観察前→観察後→適用後の 3 段階。`hasCompleted("farmer-lunch")` で成功画面に 1 文追加（唯一のクロス参照） |
| 13 | Job Reveal | 「来月の献立、調整できた！」→ echo → 職業名 | 「安全確認、完了！」→ echo → 職業名 | 「にんじん300kg、収穫！」 | 「2校とも、安全な状態で時間までに届いた！」（clock 8:20） | 「きれいになった食べ残しが、資源に変わっていく！」 |
| 14 | 好きの種 | 5 択（…/とくにない） | 5 択 | 5 択 | 4 択 | 4 択 |
| 15 | 読まないと進めない | なし（チップで判断可） | 衛生ダイアログの正答が必要 | なし | なし | 「？」を開かないと道具選択 UI が出ない |
| 16 | 操作回数 | 最短 2 タップ | 約 9〜10 タップ | 1 タップ | 最短 7 タップ | 最低 9 タップ相当 |
| 17 | 読解選択型 | ほぼなし | 衛生 2 択 | なし | なし | 観察テキストの比重が高い |

## 全体

- フロー: MAP → 学校 → AreaScreen（default layout、5 incident、`requires` なし＝順不同・ロックなし）→ Q1 → discovery
- 5 ゲーム / 5 職業 / retry 実質 0 / スコア 0 / partial に到達しうるのは farmer・logistics・recycle の 3 / ランダム性 3（farmer・logistics・recycle）
- 職業名の事前露出: mission / tools / InfoCards 本文には確認できない
- `recycle-lunch` のみ `hasCompleted("farmer-lunch")` を参照（クリア順で成功画面の文言が変わる）
- `logistics-lunch` のみ `resolution.clock` を持つ。`recycle-lunch` のみ `tools: []`

## Ver.2 で最初に作り直す nutrition-lunch の詳細

- データ: `ORIGINAL`（ほうれん草のごまあえ、supply=0）と `CANDIDATES` 4 件（別産地ほうれん草 / 小松菜 / キャベツ / フライドポテト）。各 nutri/budget/supply/cook は 0〜3 の**プロトタイプ用仮値**。
- 判定: `isAcceptableSide = supply>=1 && nutri>=1`。budget / cook は表示のみで判定に使われない。
- 通る解: 別産地ほうれん草・小松菜・キャベツ（3 つ）。通らない: ポテト（nutri=0）、元のほうれん草（supply=0）。
- InfoCards 4 枚（栄養の基準 / 予算 / 旬・調達 / 残食記録）は開閉式。「別産地は約1.5倍の値段」等はカード内にのみ記載。
- 「確認する」で不通過の場合は note 文（「候補の料理をトレーにドラッグして入れかえよう」等）を表示するだけで、失敗状態には入らない。
- 成功画面: トレー表示＋「来月の献立、調整できた！ 変わった注文が、農家さんや納入業者さんへ伝わっていく…」＋「この献立でいく！」
