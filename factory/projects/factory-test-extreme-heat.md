# Factoryテスト: 既存「猛暑編」の把握精度検証（v0.1 → 二層評価で更新）

実施日: 2026-08-27（初回スキャン後、Layer 2 Semantic Code Review 導入時に更新）
目的: 新作を作る前に、Factory が既存の猛暑編（`src/data/content/extremeHeat.ts` +
各ゲームコンポーネント）から A/B/C/D/E・mechanic・retry・Job Reveal・interestSeeds・
fact uncertainty を正しく把握できるかを確認する。**猛暑編の再実装は行っていない。**

判定はすべて実コードを読んで行った（根拠 file:line は
`factory/taxonomy/component-reviews.json` に記録）。コードから確認できない項目のみ
理由付きで unknown としている。

## 猛暑編5ゲーム 一覧（Layer 1 + Layer 2 統合）

| 項目 | park-heat | power-heat | site-heat | water-heat | urban-heat |
| --- | --- | --- | --- | --- | --- |
| A（場所） | 猛暑の公園 | 街の電気 | 工事現場 | ダム・水の施設 | 暑い市街地 |
| B（困りごと） | 公園が暑すぎて人がいない | 電気の使用量が増え続ける | 39℃の日に工事を進めたい | ダムの水が減っている | 同じ街なのに場所で暑さが違う |
| C（情報・道具） | 日射・地表温度・風の3レイヤー | 気温予報・需要予測グラフ | 時間帯別WBGT・作業負荷 | 雨予測・貯水率・7日後予測 | 4データレイヤー＋2地点比較 |
| D（操作） | 対策パーツを配置→ためす | 供給ON/OFF→時間を進める | 作業を時間帯へ割当→実行 | 分野別配分→7日進める | レイヤー比較→対策設置→再シミュ |
| E（結果） | 人が戻ってきた（配置由来のafter画像） | 「一度も途切れなかった」（**固定**） | 進捗と安全の両立 | 大雨まで水をつないだ | Before/Afterヒートマップ |
| primary mechanic | spatial_placement | resource_allocation | sequencing | resource_allocation | data_layer_compare |
| secondary | simulation_run, data_layer_compare | simulation_run, tap_select | drag_drop_assign, simulation_run | parameter_adjust, simulation_run | search_discovery, simulation_run |
| Cは攻略上必要か | partial（試行錯誤で回避可、weak文が理由を示す） | **no（C無視・操作なしでクリア可）** | partial（リスク表示で回避可、基準31はCのみ） | partial（予測チップで代替可） | partial（3択当てずっぽうで回避可） |
| 操作→結果が変わるか | yes（after画像まで反映） | **no（最終Eが無条件成功）** | yes | yes（危険水準履歴で成功が消える） | yes（fixable判定） |
| retry可能か | yes（置き直し） | **no（失敗状態が存在しない）** | yes（組み直し） | yes（やり直しボタン） | yes（置きなおし） |
| fixed progressionでないか | ok | **実質NG（ボタン連打で完走）** | ok | ok | ok |
| Job Reveal | ✅ discoveryEcho あり | ✅ | ✅ | ✅ | ✅ |
| interestSeeds | ✅ 6個・行為由来 | ✅ 5個 | ✅ 6個 | ✅ 5個 | ✅ 6個 |
| FACT uncertainty | 職業名仮置き（TODO検出済） | 実務主体TODO検出済 | — | 判断範囲TODO検出済 | 職業名仮置きTODO検出済 |

unknown とした項目: なし（5ゲームすべてコンポーネントコードまで確認できた）。
初回スキャン時に unknown だった retry / C は、Layer 2 導入によりすべて判定済み。

## 重要な発見

1. **power-heat（PowerGame）は固定クリア。** 供給カードを1枚も入れず「進める」を
   5回押すだけで成功エンディング「一度も途切れなかった」に到達する
   （`src/q1/PowerGame.tsx:53-63` の advance は失敗で止まらず、`:65-79` の
   done 画面は無条件）。途中の需給ゲージは操作を反映するが、最終Eには反映されない。
   → Critic の BLOCKER「操作結果と無関係に固定クリア」に該当。
   詳細は [factory-test-extreme-heat-critic.md](factory-test-extreme-heat-critic.md)。
2. **C層の実装場所がテーマにより異なる**（給食編のみデータ層 `tools`、以降は
   コンポーネント内）。このため Critic / Final QA は必ず componentPath のコードを
   読む二層評価とした（rules/game-design-rules.md「二層評価」）。
3. **C_required: yes は34ゲーム中4つだけ**（recipe_balance / xray_shoot /
   life_plan / safety_plan / hotel_receive ※部分的含む）。大半は「失敗フィードバック
   追従の総当たり」でCを見ずにクリアできる partial。これは「失敗時に即答を教えない」
   原則との両立の結果でもあり、一律NGではないが、新作設計時は
   「C を見ることが最短経路になっているか」を Critic が確認する。
4. fact uncertainty の運用（コード内 TODO コメント）と職業名仮置き表現は
   猛暑編に前例があり、スキャナが自動検出できることを確認した。

## Critic 検知能力の確認

既存の横断監査レポートはリポジトリ内に存在しないため比較はできない。代替として:
- 実コードに記録済みの既知問題（冒頭TODOの3点）をスキャナが factCheckNotes として
  全件検出できることを確認
- 新 Critic ルール（二層評価）を猛暑編5ゲームへ実際に適用し、データDBだけでは
  見えなかった power-heat の固定クリアを検出できた
  → [factory-test-extreme-heat-critic.md](factory-test-extreme-heat-critic.md)

## DB の数値（再スキャン後）

- 6イベント / 34 Q1 / 33職業 / 34 gameType → **12 primary mechanic に正規化**
- primary 分布: drag_drop_assign 5, resource_allocation 4, composition_design 4,
  measurement_inspection 3, matching 3, sequencing 3, parameter_adjust 3,
  trial_and_error_experiment 2, spatial_placement 2, data_layer_compare 2,
  search_discovery 2, simulation_run 1
- semantic review 34/34、参照整合性エラー 0
