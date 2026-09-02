# §1 Current World / Home Audit (2026-09-03, from code)

## 構造
- HomeScreen (src/screens/HomeScreen.tsx, 87行): 1枚の町イラスト(town-hero.png 1536x1024)を
  `town-stage`として表示し、その上に絶対配置。
  - event balloon: `.event-balloon`(max-width min(200px,52vw)) を mapPos{left%,top%} に
    translate(-50%,-100%)配置。edge-clamp(clamp(100px,…,100%-100px))は導入済み。
  - quiet-pin: eventのないplace（工場/公園=じゅんびちゅう）。タップでpeek吹き出し。
  - NEW badge: school-trip 1件のみのハードコード（`ev.id === "school-trip"`）。データ駆動でない。
- 探索モデル: パンなし・ズームなし・1画面固定。地図は装飾で、balloonが実質「一覧」。
- world registry: src/data/index.ts MODULES配列(9 module)→places/events/professions/experiences平坦結合。
- state: Progress{completed[], discovered[], seeds} のみ。**worldレベルの状態なし**
  （UNSEEN/VISITED/COMPLETED等なし）。訪問済みの区別はballoonに一切出ない。
- world completion表示なし。Job Reveal導線はQ1完了時のみ。図鑑カウンタはある。

## 窮屈さの実測（presentation監査済み事実）
- 9 event balloonで既にmobile 375pxは相互重なり（town-map APQ 74→90はclamp+backlog記録後。
  「バルーン同士の衝突」「ランドマーク隠蔽」は systemic backlog として残存）。
- balloonはtop:-100%方向に伸びるため、上端付近のmapPosは実質使用不可。
- mapPos手打ち%: 新world追加のたび手動調整（zoo 90%→80%等の修理履歴あり）。
- 収容限界の見積り: 現バルーン方式はmobileで**10-11個が物理限界**（面積比計算:
  balloon平均 150x54px ≒ 8100px², town-stage可視 375x500 ≒ 187500px², 重なり回避で
  実効50%とすると ~11個）。14worldで確実に破綻。
- NEW badgeを全新規worldに付けると「NEWだらけ」問題（§15指摘どおり）。
- desktop: 中央640px程度のカラムに固定、左右は空白（地図は拡大されない）。
- 子どもの導線: balloonの文言（「〜？」）は良いが、既訪問/未訪問の区別ゼロ、
  「全部で何worldあるか」「まだ見ていない場所がどれか」が分からない。

## 結論（設計要件へ）
- 1枚絵+balloon一覧は9worldで限界。20-50worldには「空間の拡張」（pan/区画/開示）が必須。
- world状態モデル（UNSEEN/DISCOVERED/VISITED/IN_PROGRESS/COMPLETED/UPDATED）を
  Progressに追加する必要（後方互換: completed/discoveredから導出可能な部分は導出）。
- NEW依存の新着通知を地図上の変化（動き・シルエット・開示）へ置換する必要。
- mapPos手打ちを generic layout system（district内自動配置+衝突回避）へ。
