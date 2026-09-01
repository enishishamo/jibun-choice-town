# 全Q1監査サマリー（Stage 3・2026-09-01）

auditor: Codex（独立）/ rubric: game-critic-v2.md / 詳細: q1-audit.json
🟢 75+（完成候補） 🟡 60-74（改善余地） 🔴 <60（要改修）

## ヒートマップ（GQ=game_quality / CA=career_authenticity 昇順）

| game | 世界 | GQ | CA | C要 | C単独× | 判断 | 因果 | risk | exploit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lab_check | 医療編／前半：診断まで／救急外来に、息苦しそうな人が来た | 🔴18 | 🔴41 | ⚠ | ✓ | ⚠ | ✓ | high | select-all |
| clue_board | 医療編／前半：診断まで／救急外来に、息苦しそうな人が来た | 🔴31 | 🔴54 | ✓ | ✓ | ⚠ | ✓ | high | button spam |
| line_debug | 物価高編／アイス工場 | 🔴39 | 🔴57 | ⚠ | ⚠ | ⚠ | ✓ | high | select-all |
| rx_check | 医療編／前半：診断まで／救急外来に、息苦しそうな人が来た | 🔴42 | 🟡72 | ⚠ | ⚠ | ⚠ | ✓ | high | brute force |
| timetable | イベント編／なんかイベントをやることになった！ | 🔴43 | 🟡67 | ⚠ | ✓ | ⚠ | ✓ | high | select-all |
| bus_ops | 修学旅行編（5つの役割を自由な順番で体験する） | 🔴43 | 🔴55 | ⚠ | ⚠ | ⚠ | ✓ | high | memorize |
| forecast_and_balance | 街（猛暑）／街の電気 | 🔴48 | 🔴57 | ⚠ | ✓ | ✓ | ✓ | high | select-all |
| safety_plan | 修学旅行編（5つの役割を自由な順番で体験する） | 🔴48 | 🔴47 | ✓ | ✓ | ⚠ | ✓ | high | memorize |
| clue_join | 医療編／前半：診断まで／救急外来に、息苦しそうな人が来た | 🔴49 | 🟡70 | ✓ | ⚠ | ⚠ | ✓ | high | brute force |
| sow_and_grow | 給食編 | 🔴52 | 🟡72 | ✓ | ⚠ | ⚠ | ✓ | high | memorize |
| layer_and_compare | 街（猛暑）／暑い市街地 | 🔴52 | 🟡69 | ⚠ | ✓ | ✓ | ✓ | high | brute force |
| allocate_and_forecast | 街（猛暑）／ダム・水の施設 | 🔴54 | 🟡66 | ⚠ | ✓ | ✓ | ✓ | high | select-all |
| load_and_route | 給食編 | 🔴58 | 🟢80 | ✓ | ⚠ | ⚠ | ✓ | high | memorize |
| move_try | 医療編／退院後に自力でトイレへ行けるか確かめる場面 | 🔴58 | 🟡72 | ✓ | ✓ | ✓ | ✓ | high | brute force |
| hotel_receive | 修学旅行編（5つの役割を自由な順番で体験する） | 🔴59 | 🟡65 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| plan_coach | 商店街・開店編 | 🟡62 | 🟢76 | ✓ | ✓ | ✓ | ✓ | medium | memorize |
| delay_recover | 修学旅行編（5つの役割を自由な順番で体験する） | 🟡64 | 🟡73 | ✓ | ✓ | ✓ | ✓ | medium | select-all |
| sourcing_mix | 物価高編／材料・倉庫 | 🟡65 | 🟢76 | ⚠ | ✓ | ✓ | ✓ | medium | memorize |
| sort_out | 給食編 | 🟡66 | 🟢76 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| crowd_flow | イベント編／なんかイベントをやることになった！ | 🟡66 | 🟢75 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| place_and_test | 街（猛暑）／猛暑の公園 | 🟡68 | 🟢76 | ⚠ | ✓ | ✓ | ✓ | medium | brute force |
| plan_mix | イベント編／打ち合わせ（からっぽの広場） | 🟡68 | 🟡74 | ⚠ | ✓ | ✓ | ✓ | medium | memorize |
| observe_care | 医療編／入院患者の回復を支える場面 | 🟡68 | 🟢82 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| inspect_and_measure | 給食編 | 🟡69 | 🟢88 | ✓ | ✓ | ✓ | ✓ | medium | memorize |
| venue_layout | イベント編／なんかイベントをやることになった！ | 🟡69 | 🟢76 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| schedule_and_protect | 街（猛暑）／工事現場 | 🟡70 | 🟢78 | ✓ | ✓ | ✓ | ✓ | medium | memorize |
| reach_mix | イベント編／なんかイベントをやることになった！ | 🟡72 | 🟢82 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| life_plan | 医療編／一人暮らしの患者の退院後生活を組み立てる場面 | 🟡72 | 🟢86 | ✓ | ✓ | ✓ | ✓ | medium | select-all |
| meal_fit | 医療編／回復中の患者が食べられる食事を整える場面 | 🟡73 | 🟢84 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| scene_audit | 商店街・開店編 | 🟡73 | 🟢83 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| sound_check | イベント編／なんかイベントをやることになった！ | 🟡74 | 🟢81 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| tenant_match | 商店街・開店編 | 🟡74 | 🟢82 | ⚠ | ✓ | ✓ | ✓ | medium | brute force |
| loan_screen | 商店街・開店編 | 🟡74 | 🟢84 | ✓ | ✓ | ✓ | ✓ | medium | memorize |
| package_design | 物価高編／包装・パッケージ開発室 | 🟢75 | 🟢80 | ✓ | ✓ | ✓ | ✓ | low | brute force |
| drag_and_drop | 給食編 | 🟢78 | 🟢84 | ✓ | ✓ | ✓ | ✓ | low | memorize |
| recipe_balance | 物価高編／試作室 | 🟢78 | 🟢82 | ✓ | ✓ | ✓ | ✓ | low | brute force |
| trip_plan | 修学旅行編／学校の依頼に沿った2泊3日の旅程を提案する場面 | 🟢79 | 🟡69 | ✓ | ✓ | ✓ | ✓ | medium | brute force |
| xray_shoot | 医療編／前半：診断まで／救急外来に、息苦しそうな人が来た | 🟢86 | 🟢89 | ✓ | ✓ | ✓ | ✓ | low | none-found |
| zone_and_fit | 商店街・開店編 | 🟢86 | 🟢88 | ✓ | ✓ | ✓ | ✓ | low | none-found |

## Weakest 10 (game_quality)

1. **lab_check** GQ18/CA41 — high — 検査結果を情報化する職業説明にはなるが、検査選択、精度確認、再検査判断がなく全選択で必ず進む
2. **clue_board** GQ31/CA54 — high — 医師らしい情報収集はあるが、情報の内容を解釈せず有効な項目を5個押すだけで成功する
3. **line_debug** GQ39/CA57 — high — 赤い詰まり表示が固定の正解工程を直接示し、調整内容に関係なく同じ改善結果になるため診断も改善判断も実質的に消えている
4. **rx_check** GQ42/CA72 — high — 薬剤師らしい照合対象と問い合わせ行動は扱うが、重要文書の確認が保証されず、答えを直接述べた固定選択肢を無コストで試せる
5. **timetable** GQ43/CA67 — high — 全演目を選択しても15時までに収まり、中心となる取捨選択や転換最適化をせず成功できる
6. **bus_ops** GQ43/CA55 — high — 配車要素はあるが道路条件が固定され、山道は必ず失敗するため資料から唯一の安全入力を転記する構造になっている
7. **forecast_and_balance** GQ48/CA57 — high — 全供給源を最初から稼働すれば予報も各電源の制約も無視して確実に勝てる
8. **safety_plan** GQ48/CA47 — high — 資料確認は必須だが、その内容を引率者の選定や安全体制へ適用する仕事固有の判断が実装されていない
9. **clue_join** GQ49/CA70 — high — 情報統合という医師の仕事には沿うが、解説が所属先を明示し、3枚以上という内部タグ判定を無コストで総当たりできる
10. **sow_and_grow** GQ52/CA72 — high — 農業情報は具体的だが、種袋と注文を読めば唯一の正解が確定し、その後も固定進行になる

## Strongest 5 (GQ+CA合計)

1. **xray_shoot** GQ86/CA89
2. **zone_and_fit** GQ86/CA88
3. **drag_and_drop** GQ78/CA84
4. **recipe_balance** GQ78/CA82
5. **life_plan** GQ72/CA86

## High-priority repair queue（GQ<60 または C単独で答え確定 または 判断不在）

- lab_check (GQ18) — high — 検査結果を情報化する職業説明にはなるが、検査選択、精度確認、再検査判断がなく全選択で必ず進む
- clue_board (GQ31) — high — 医師らしい情報収集はあるが、情報の内容を解釈せず有効な項目を5個押すだけで成功する
- line_debug (GQ39) — high — 赤い詰まり表示が固定の正解工程を直接示し、調整内容に関係なく同じ改善結果になるため診断も改善判断も実質的に消えている
- rx_check (GQ42) — high — 薬剤師らしい照合対象と問い合わせ行動は扱うが、重要文書の確認が保証されず、答えを直接述べた固定選択肢を無コストで試せる
- timetable (GQ43) — high — 全演目を選択しても15時までに収まり、中心となる取捨選択や転換最適化をせず成功できる
- bus_ops (GQ43) — high — 配車要素はあるが道路条件が固定され、山道は必ず失敗するため資料から唯一の安全入力を転記する構造になっている
- forecast_and_balance (GQ48) — high — 全供給源を最初から稼働すれば予報も各電源の制約も無視して確実に勝てる
- safety_plan (GQ48) — high — 資料確認は必須だが、その内容を引率者の選定や安全体制へ適用する仕事固有の判断が実装されていない
- clue_join (GQ49) — high — 情報統合という医師の仕事には沿うが、解説が所属先を明示し、3枚以上という内部タグ判定を無コストで総当たりできる
- sow_and_grow (GQ52) — high — 農業情報は具体的だが、種袋と注文を読めば唯一の正解が確定し、その後も固定進行になる
- layer_and_compare (GQ52) — high — 赤いヒート表示だけでAかCを選べば成功し、レイヤー閲覧と2地点比較はクリア条件になっていない
- allocate_and_forecast (GQ54) — high — 全部門を最低利用率にする極端な制限が無罰で成功し、配分の社会的トレードオフが結果を変えない
- load_and_route (GQ58) — high — 温度管理と納品期限は実務的だが、資料が積載先と唯一の経路を完全に決定する固定パズルである
- move_try (GQ58) — high — 動作分析の題材は適切だが、固定順の正解カード当てで失敗コスト、複合調整、症例変化がない
- hotel_receive (GQ59) — medium — 部屋・食事・入浴という受入業務は具体的だが、資料と判定の不整合や固定された正解転記が判断の質を弱めている

## カテゴリ別リスト

- fake-choice疑い（C単独確定 or 判断不在）: lab_check, clue_board, line_debug, rx_check, timetable, bus_ops, safety_plan, clue_join, sow_and_grow, load_and_route
- quiz化疑い: lab_check, clue_board, line_debug, rx_check, timetable, bus_ops, safety_plan, clue_join, sow_and_grow, load_and_route, plan_coach, sourcing_mix, plan_mix, inspect_and_measure, schedule_and_protect, loan_screen, drag_and_drop
- 固定進行疑い: line_debug, rx_check, bus_ops, sow_and_grow, load_and_route, move_try, hotel_receive, plan_coach, sort_out, crowd_flow, plan_mix, observe_care, inspect_and_measure, venue_layout, schedule_and_protect, reach_mix, meal_fit, sound_check, loan_screen, package_design, drag_and_drop, recipe_balance
- exploit報告あり: lab_check(select-all), clue_board(button spam), line_debug(select-all), rx_check(brute force), timetable(select-all), bus_ops(memorize), forecast_and_balance(select-all), safety_plan(memorize), clue_join(brute force), sow_and_grow(memorize), layer_and_compare(brute force), allocate_and_forecast(select-all), load_and_route(memorize), move_try(brute force), hotel_receive(brute force), plan_coach(memorize), delay_recover(select-all), sourcing_mix(memorize), sort_out(brute force), crowd_flow(brute force), place_and_test(brute force), plan_mix(memorize), observe_care(brute force), inspect_and_measure(memorize), venue_layout(brute force), schedule_and_protect(memorize), reach_mix(brute force), life_plan(select-all), meal_fit(brute force), scene_audit(brute force), sound_check(brute force), tenant_match(brute force), loan_screen(memorize), package_design(brute force), drag_and_drop(memorize), recipe_balance(brute force), trip_plan(brute force)

## 構造重複（mechanic先頭句が同じもの）

