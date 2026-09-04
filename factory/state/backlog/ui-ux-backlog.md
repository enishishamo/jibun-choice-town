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
| compass-forest-overlap | Home/World Mapのregion overview（ズームアウト状態）で、画面右上に固定表示されるCompassウィジェットと、forest（森と川）地区のサインポスト／地区イラストが、デフォルトのカメラ位置で画面上重なる。地区にタップして入る（フォーカス表示）と完全にクリアに見えるため実害は無いが、region overviewでの見た目が良くない。Compassの位置調整か、region overviewの初期カメラフレーミング（パン/ズーム）の調整で解消できる見込み。 | `../art/gpt-asset-quality-reeval-2026-09-04.md` の「既知の副次的事項」 | MEDIUM | open |

新しい項目を追加する際は、他のbacklogファイルと同じ表形式
（id/内容/根拠/優先度/status）に揃える。
