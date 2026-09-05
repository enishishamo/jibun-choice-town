# UI/UX改善 backlog（Track B）

2026-09-04 制定。
Claude担当領域（layout / CSS / masks / crop / borders / functional icons /
arrows / charts / graphs / functional SVG / game-state visualization /
meters / paths / hit areas / animation / UI feedback）に該当する改善案を
ここに積む。作品世界を描くillustration系の話は art-ownership 側
（`../art/gpt-asset-requests.json`）へ。

## Items

| id | 内容 | 根拠 | 優先度 | status |
|---|---|---|---|---|
| interaction-blocker-map-tap-vs-pan | 実機Human Reviewで、地図をpan/dragしようと指を置いた位置がdistrict/world-markerの上だと意図せずtapとして発火し、worldへ入ってしまう問題（functional testはPASSしていたが実機で再現）。原因は`setPointerCapture`未使用・`onPointerCancel`未実装・touch slop閾値(6px Manhattan)が緩すぎたこと。3点とも修正し、real touch event simulation（`factory/harness/gesture-arbitration-qa.mjs`、CDP touchStart/move/end）で5ケース（district上drag／world-marker上drag／通常tap／連続drag）を検証してPASS。修正前後をgit stash比較し、既存のport-flow flakinessとは無関係であることも確認済み。 | 2026-09-04 Experience Design Harness Human Review §2 | HIGH | **resolved** |
| map-canvas-will-change | `.region-canvas`（pan/zoomのたびにtransformが変わる要素）に`will-change: transform`が無く、モバイルSafariでの初回タッチ時にレイヤー昇格のジャンクが起きうる状態だった。追加してビルド・回帰テストで確認済み。 | 2026-09-04 Interaction & Motion Harness、Motion Quality監査 | LOW | **resolved** |
| compass-forest-overlap | Home/World Mapのregion overview（ズームアウト状態）で、画面右上に固定表示されるCompassウィジェットと、forest（森と川）地区のサインポスト／地区イラストが、デフォルトのカメラ位置で画面上重なる。 | `../art/gpt-asset-quality-reeval-2026-09-04.md` の「既知の副次的事項」 | MEDIUM | **resolved**（2026-09-04 True Home / Mobile Map Simplificationで、Compassをbottom-rightへ移動＋縮小し、region overviewの初期ズームも変更したことで解消を確認） |
| district-focus-camera-zoom-tuning | district focus（地区にタップして入った拡大表示）のカメラズームが、「空白が残りすぎる」（fill不足）と「拡大しすぎて周辺の町とのつながりが失われる」（過拡大）の間で綱引きになっており、単一のスカラーzoom値では両立が難しい。4roundのCodex独立レビューで72→76点（閾値85点未達）にとどまった。より根本的な対応（districtの実際のaspect比に応じた非等方ズーム、focus時に町中心へのミニ視覚的つながりを別途表示する等）を検討する必要がある。 | `../expansion/mobile-map-repair-2026-09-04.md` §6.5、`../expansion/true-home-map-codex-review-final.json` | MEDIUM | open |
| true-home-game-feel | True HomeのHOME_GAME_FEELスコアがCodexレビューで一貫して閾値未達（68→68→67→74、4round改善傾向はあるが80点未満）。既存仕様内のCSS対応（アニメーション・日本語化・play button等）で67→74までは改善した。Codexは一貫して「キャラクター性の欠如」を指摘しているが、mascot/キャラクター新設は`../../rules/product-identity-gate.md`のHUMAN_PRODUCT_DECISION_REQUIRED対象（brand character新設）であり、2026-09-04にAIが自動発行したGPT_ASSET_REQUEST（`true-home-mascot-character`）はREJECTED_NOT_APPROVEDへ差し戻された（`../product-ideas/gate-log.md#entry-2026-09-04-01`）。関連するproduct ideaは`../product-ideas/idea-001-interest-grown-companion.md`にDESIGN_RESERVEDとして記録。次に進めてよいのは既存仕様内でのさらなる改善検討まで。mascot新設の可否はHuman Product Decision待ち。 | 同上、`../product-ideas/gate-log.md` | MEDIUM | open（HUMAN_PRODUCT_DECISION_REQUIRED、既存仕様内改善は着手可） |

新しい項目を追加する際は、他のbacklogファイルと同じ表形式
（id/内容/根拠/優先度/status）に揃える。
