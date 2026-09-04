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
| compass-forest-overlap | Home/World Mapのregion overview（ズームアウト状態）で、画面右上に固定表示されるCompassウィジェットと、forest（森と川）地区のサインポスト／地区イラストが、デフォルトのカメラ位置で画面上重なる。 | `../art/gpt-asset-quality-reeval-2026-09-04.md` の「既知の副次的事項」 | MEDIUM | **resolved**（2026-09-04 True Home / Mobile Map Simplificationで、Compassをbottom-rightへ移動＋縮小し、region overviewの初期ズームも変更したことで解消を確認） |
| district-focus-camera-zoom-tuning | district focus（地区にタップして入った拡大表示）のカメラズームが、「空白が残りすぎる」（fill不足）と「拡大しすぎて周辺の町とのつながりが失われる」（過拡大）の間で綱引きになっており、単一のスカラーzoom値では両立が難しい。4roundのCodex独立レビューで72→76点（閾値85点未達）にとどまった。より根本的な対応（districtの実際のaspect比に応じた非等方ズーム、focus時に町中心へのミニ視覚的つながりを別途表示する等）を検討する必要がある。 | `../expansion/mobile-map-repair-2026-09-04.md` §6.5、`../expansion/true-home-map-codex-review-final.json` | MEDIUM | open |
| true-home-game-feel | True HomeのHOME_GAME_FEELスコアがCodexレビューで一貫して閾値未達（68→68→67→74、4round改善傾向はあるが80点未満）。根本原因はキャラクター性の欠如とCodexが一貫して指摘——CSSアニメーション・日本語化・play button等の対応で67→74までは改善したが、真の解決にはマスコット/キャラクターイラストが必要と判断し、GPT_ASSET_REQUESTとして提出済み（`../art/gpt-asset-requests.json`の`true-home-mascot-character`）。画像が届き次第、配置してから再評価する。 | 同上 | MEDIUM | open（GPT納品待ち） |

新しい項目を追加する際は、他のbacklogファイルと同じ表形式
（id/内容/根拠/優先度/status）に揃える。
