# World Selection — ごみのゆくえ・清掃工場編（Stage 7）

- 候補6件（防災/動物園/本づくり/水道/ごみ/ソフトウェア）を Claude が起案し、
  Codex が7基準で独立採点（factory/state/world-selection.result.json）
- 結果: E ごみ 92 ≒ D 水道 92 > C 本 91 > B 動物園 89 > A 防災 88 > F 86
- Codex 推奨: Stage 7 = E（hidden_society 99 / mechanic_diversity 96 /
  「日常のごみ→巨大な公共システム」への接続）、Stage 8 = B（産業インフラ型のEと
  性質が対照的な、生命・ケア・観察型）
- Claude synthesis: 両推奨を採用。リスク指摘を設計制約に組み込む:
  1. 給食編 sort_out（分別ゲーム）と重複させない → 選別ゲームは作らず、
     収集現場の「回収可否判定」・焼却運転・環境計測・処分場計画で構成
  2. 汚れ・煙を過度に不快に描かない／「焼却すれば万能」の誤解を避ける
     → E画面で処分場余命と3Rへ接続

## 職業構成（JOB DISCOVERY 方針）

出来事「1袋のごみが家を出てから土に還るまで」を成立させる仕事から、
見える仕事×裏側の仕事・判断の種類が異なる4職を選定:

| job | 表/裏 | 子どもの認知 | primary challenge mechanic |
| --- | --- | --- | --- |
| ごみ収集作業員 | 表 | 知っている | rule_matching_verification（回収可否の現場判定） |
| 焼却炉運転員 | 裏 | ほぼ知らない | dynamic_state + execution_precision（撹拌と炉温） |
| 環境計測担当 | 裏 | 知らない | partial_information + measurement（どこを測るか） |
| 最終処分場管理者 | 裏 | 知らない | resource_tradeoff + delayed_feedback（埋立余命） |

mechanics 多様性: primary が全て異なる（重複0）。
