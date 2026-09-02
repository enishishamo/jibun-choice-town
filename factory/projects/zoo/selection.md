# World Selection — 動物園に赤ちゃんが生まれた（Stage 8・再現性テスト）

- Stage 7 と同一の選定プロセスから採択（factory/state/world-selection.result.json、
  Codex 独立採点 total 89・comprehensibility 98・novelty 92）
- Codex 推奨理由: 「産業インフラ型の Stage 7（ごみ）と性質が対照的な、
  生命・ケア・観察中心の世界」— 再現性テストの趣旨（テーマ・職種・mechanics が
  過度に似ないこと）に合致
- リスク指摘の採用: 動物の病気・死を失敗罰にしない／かわいさだけに寄せず
  獣医・栄養・展示企画の異なる判断を立てる／動物福祉と集客の関係は慎重に扱う

## 職業構成（JOB DISCOVERY 方針）

「赤ちゃん誕生から一般公開まで」を成立させる仕事から4職:

| job | 表/裏 | 子どもの認知 | primary challenge mechanic（候補） |
| --- | --- | --- | --- |
| 飼育員 | 表 | 知っている | delayed_feedback + 成長曲線の読み |
| 動物園の獣医師 | 半分裏 | 名前だけ知っている | risk_reward（検査の負担予算） |
| 動物栄養担当 | 裏 | 知らない | combination_search + rule_matching（禁忌） |
| 展示・広報企画 | 裏 | 知らない | resource_tradeoff + self_quality_gate（延期判断） |

Stage 7 との mechanic 重複: primary レベルで 0（waste: rule照合/動的状態/部分情報/資源+空間）。
