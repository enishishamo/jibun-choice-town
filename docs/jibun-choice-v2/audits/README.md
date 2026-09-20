# Ver.1 AS-IS 監査（作り直しの入力資料）

2026-09-20 に Ver.1 のコード・データを直接読んで作成した事実ベースの棚卸し。
Ver.2 の設計時に「Ver.1 では何がどうなっていたか」を参照するためのもの。
評価・改善案は含まない。

| ファイル | 対象 |
|---|---|
| [ver1-school-lunch-as-is.md](ver1-school-lunch-as-is.md) | 給食編（5 ゲーム）— 最初に作り直す編 |
| [ver1-medical-studio-as-is.md](ver1-medical-studio-as-is.md) | 医療編（9 ゲーム）・ゲームスタジオ編（3 ゲーム）— 要約版 |

共通の前提（全編）:
- Q1 シェル `src/screens/Q1Screen.tsx`: intro（mission 文 + 場面画像 + 「やってみる！」）→ game → discovery（resolution.title → discoveryEcho → 職業名 = Job Reveal → 好きの種チップ（1 つ以上必須）→ もっと知る / この場所をもう少し探す / 街にもどる）
- スコアの仕組みは全編に存在しない（`completeExperience(experienceId, professionId)` のみ）
- `profession.discoveryLine` は全モジュールで定義されているが、どの画面からも描画されていない
- `Q1Screen.tsx` の好きの種リプライ分岐は `"特にない"`（漢字）を判定。給食編の seeds は `"とくにない"`（ひらがな）なので一致しない。医療編は一致する。スタジオ編は opt-out 選択肢自体がない
