# QA REPORT: 商店街・開店編（world-id: shop-opening）

- 実施日: 2026-08-31
- 担当: FINAL QA
- 対象: design.md v1.2 / 実装（新規5コンポーネント＋content module＋共有3ファイル差分）
- 前提: オーケストレータによる実プレイQA済み（全章成功/失敗パス・requires連鎖・
  ch3→ch4予算連動・ch5抽選・コンソールエラーなし確認済み）。画像は全pending（意図的）。

## ビルド・DB検証結果

| 検証 | 結果 |
| --- | --- |
| `npm run build` | ✅ 成功（tsc + vite、exit 0。chunk >500kB 警告は既存事象） |
| `npm run lint` | ✅ エラー0。警告1件のみ＝既存の `src/state/GameState.tsx:102` fast-refresh 警告（本変更と無関係） |
| `node factory/scripts/update-factory-db.mjs` | ✅ 参照エラー0。7 events / 39 experiences / 39 mechanics。警告は新5 gameType の semantic review 未登録のみ（本レポートの Layer 2 判定 JSON で解消予定） |
| 既存編への回帰 | ✅ なし（詳細は項目12） |

## 13項目評価

1. **ファーストビュー** ✅ — default レイアウト＋bg-road 暫定背景に絵文字ホットスポット5つ。
   ①②が開き、③〜⑤は🔒＋requiresHint で「順番がある」ことが読める
   （AreaScreen.tsx:263-296）。専用背景 area-street は pending（意図的・TODO(art) 記載済み）。
2. **操作の分かりやすさ** ✅ — 全5ゲームとも mission-bar に目標とカウンタchip、
   「〜をタップしよう」の一行ガイドあり。ch3 は audit-01 の指摘どおり
   mission-bar タイトルで最初の一手を提示（LoanScreenGame.tsx:107）。
3. **C利用** ✅（ch2/ch3/ch5 = yes、ch1/ch4 = partial。partial は design v1.2 の
   「C緩和策」に明記され Critic 通過済みの設計どおり）— 詳細は Layer 2 判定参照。
4. **操作→結果** ✅ 固定クリアなし — 全章で最終E画面がプレイ内容を反映:
   ch1 入居業種・条件カード（TenantMatchGame.tsx:137-163）、ch2 追加質問の有無
   （PlanCoachGame.tsx:125-129）、ch3 承認額280/250（LoanScreenGame.tsx:81-101）、
   ch4 席数・水栓・予算・カウンター（ZoneFitGame.tsx:131-151）、
   ch5 抽選された不備（SceneAuditGame.tsx:123-140）。
   ch3→ch4 の localStorage 予算連動も実装済み（LoanScreenGame.tsx:75 → ZoneFitGame.tsx:56-61,98）。
5. **retry** ✅ — 全章で差し戻し→やり直しループ成立。リセット導線あり
   （ch1「ぜんぶ外す」:226、ch4「ぜんぶ置き直す」:256）。※助言/指示モーダルに
   閉じるボタンがない件は MEDIUM-1 参照。
6. **Job Reveal** ✅ — 5件とも discoveryEcho が実際の操作（カルテを開く/質問する/
   通帳をめくる/基準設備を先に置く/チェックリストで見て回る）を正しく指す。
   ch3 は組織主語（「公庫」）で FACT_CHECK 回避も設計どおり。
7. **interestSeeds** ✅ — 6択すべてゲーム内で実際に可能な行為＋「特にない」。適職判定なし。
8. **スマホ** ✅ — 全操作タップベース（ドラッグなし。ch1割当・ch4配置とも選択→タップ）。
   street-row は横スクロール、floor-grid は 6fr+aspect-ratio、○✗ボタンは38px。
9. **画像切れ** ✅ — ラスタ画像は既存 bg-road のみ。hero はインラインSVG。崩れなし。
10. **画像の粗さ** —（評価対象なし）アート全pending は art-manifest どおりの意図的状態。
11. **既存UIとの一貫性** ✅ — Q1Screen 共通フロー（game E→resolution→echo→seeds）に準拠。
    mission-bar / sched-issues / choice-card / layer-btn / chapter-tabs / InfoCards を再利用。
    新規CSSクラスは既存と衝突なし（modal-veil 等は新規名、grep で確認）。
12. **既存ゲームの回帰** ✅ — registry.ts は import 5行＋エントリ5行の追加のみ、
    data/index.ts は import 1行＋MODULES 1要素の追加のみ（git diff で確認）。
    AreaScreen の default レイアウト変更は `inc.requires` が無ければ locked=false で
    従来と同一挙動。requires を持つのは medical（sceneMap レイアウト＝既存ロック処理、
    今回未変更）と shopOpening のみのため、既存5編（default レイアウト）への影響なし。
    index.css は末尾112行の追加のみ（削除0）。
13. **FACT_CHECK_REQUIRED** ✅ — shop-opening の新規ファイルに FACT_CHECK は 0件。
    TODO は `TODO(art)` 3件のみ（shopOpening.ts:12,40 / TenantMatchGame.tsx:7 —
    アート生成後の差し替えメモ。意図的に残す）。
    既存の FACT CHECK 2件（extremeHeat.ts:6 / priceHike.ts:6）は本編と無関係の継続分。
    design.md §7 の継続調査3件はゲーム内表現で回避済み（組織主語・簡略欄名・構造要件のみ）。

## 指摘

### CRITICAL — なし

### HIGH — なし

（「Cを見ずに解ける」「固定クリア」「答えの直渡し」の禁止事項違反は
5ゲームとも検出せず。失敗文はすべて理由のみで正解を言わない。）

### MEDIUM — 2件

- **MEDIUM-1: 助言/指示モーダルに閉じる導線がない（ch2・ch5）**
  - PlanCoachGame.tsx:206-222 / SceneAuditGame.tsx:275-291。モーダルが開くと
    正解カードを選ぶまで面談・観点カード・現場観察へ戻れない。
    「答えを確かめてから選ぶ」というCの再参照が絶たれる。
  - 修正案: 両モーダルに `<button className="btn ghost">あとで考える</button>` を追加し
    `setAdvising(null)` / `setInstructing(null)`。PlanCoach 側は再オープン経路として
    `flag()` の `if (found.includes(f.id)) return;`（:81）を
    `if (found.includes(f.id) && !advised.includes(f.id)) { setAdvising(f.id); return; }` に変更
    （SceneAudit 側は指示カード一覧が常時表示のため再タップで再オープン可、変更不要）。
- **MEDIUM-2: ch3 で計画書・見積書を開かずに「金額▲」を付けられる**
  - LoanScreenGame.tsx:42-49。通帳のみ開封ガードあり（:44-47）だが、
    250万vs280万の食い違いは書類を1つも開かずに▲を勘で付けても通過できる。
    design v1.2「開き比べると250万vs280万」の照合行為が省略可能。
  - 修正案: `const [openedDocs, setOpenedDocs] = useState<Set<string>>()` を追加し
    doc ボタン（:116-124）で記録。`mark("amount", ...)` 時に plan と quote の
    両方未開封なら `「計画書と見積書を、開きくらべてから記入しよう」` で差し戻す
    （通帳ガードと同型）。

### LOW — 4件

- **LOW-1**: `jc.shop-opening.tenantChoice`（TenantMatchGame.tsx:131）を書き込むが
  読み手が存在しない。修正案: wrapUp の「となりの元・洋品店でも〜」の一文を
  選択業種（雑貨屋/パン屋）で出し分ける将来拡張に使うか、削除。現状は無害。
- **LOW-2**: ch3 通帳の既読判定が `maxPage >= 2`（LoanScreenGame.tsx:39、4ページ中3ページ目）
  なのにガード文は「最後までめくってみよう」（:45）。修正案:
  `maxPage >= PASSBOOK_PAGES.length - 1` に変更（残高150万の最終ページ＝「貯まり方」の結論）。
- **LOW-3**: ch4 事前相談の水栓指摘文（ZoneFitGame.tsx:116）が基準の内容を
  ほぼそのまま示す。design v1.2 の指定文言どおりのため仕様準拠だが、
  基準カードを読む動機がやや下がる。対応不要（設計どおり）。記録のみ。
- **LOW-4**: ch3 のデータ層 resolution（shopOpening.ts:361）は承認額を含まない汎用文。
  承認額はコンポーネントEで表示済みのため体験上は問題なし（データ層が静的な以上
  妥当な実装判断）。記録のみ。

## Layer 2 セマンティック判定（component-reviews.json 追記用）

（本レポート末尾の JSON を参照。親エージェントが component-reviews.json へ追記後、
`node factory/scripts/update-factory-db.mjs` を再実行すると warning 5件が解消される。）

```json
{
  "tenant_match": {
    "componentPath": "src/q1/TenantMatchGame.tsx",
    "primaryMechanic": "matching",
    "secondaryMechanics": ["tap_select", "trial_and_error_experiment"],
    "interactionNotes": "3組の出店希望者を3つの空き店舗へタップ割当。カルテ（家賃・水回り・所有者意向メモ）を開いて条件を読み、B物件では契約条件カード3択を提案。判定→理由つき差し戻し→組み替えのループ。複数解（条件カード2×A物件業種2）。",
    "C_in_component": "空き店舗カルテ3件（家賃・水回り・所有者の意向メモ, L28-49, モーダルL233-253）／通りの業種ならび=テナントミックス（L52-59, L178-198）／希望者の条件カード（L15-19）／ダイアログ内「もう一度、所有者さんの話を聞く」再読動線（L273-275）",
    "C_required": "partial",
    "action_changes_result": "yes",
    "retry": "yes",
    "fixed_progression": "no",
    "obvious_binary_choice": "no",
    "evidence": "C(partial): B物件の条件カードは意向メモ（L41）を読むのが最短経路だが、成立カードが3枚中2枚（keepのみ差し戻し L117-119）のため総当たりでも通り得る＝design v1.2 C緩和策どおり。失敗6パターンは理由のみで正解を言わない（L83, L86-90, L109-127）。結果反映: E画面が条件カード・家賃UP注記・A物件業種で変化（L149-157）、通りの絵も変化（L142-148）。retry: 差し戻し後も割当し直し自由＋「ぜんぶ外す」（L226-228）。"
  },
  "plan_coach": {
    "componentPath": "src/q1/PlanCoachGame.tsx",
    "primaryMechanic": "conversation_observation",
    "secondaryMechanics": ["document_check", "tap_select"],
    "interactionNotes": "質問カード6枚でハルさんに面談→聞いた欄だけ計画書で指摘できる→弱点2つに助言3択（惜しい選択肢入り）。「面談で確かめていないことは指摘できない」が攻略の背骨。",
    "C_in_component": "創業計画書6欄（L22-39, plan-sheet L149-168）／面談の回答=弱点の根拠（1日50人 vs 8席, 人件費抜け, L26-29）／チェックの観点カード3枚=公庫の売上計算式（L185-195）",
    "C_required": "yes",
    "action_changes_result": "yes",
    "retry": "yes",
    "fixed_progression": "no",
    "obvious_binary_choice": "no",
    "evidence": "C(yes): 未質問の欄は指摘不可でガード（L77-80）＝面談（C）が省略不能。誤指摘は notWeak 文で理由のみ返す（L82-84）、不適切助言も理由のみでバウンス（L47-56, L97-99）。結果反映: 計画書がv2表示に更新（L162）、E画面は追加質問数>=3で一文が変化（L103, L125-129。audit-01 MEDIUM対応）。retry: 指摘・助言とも選び直し自由、質問は常時追加可（L69-73）。注意: 助言モーダルに閉じるボタンなし（qa MEDIUM-1）。"
  },
  "loan_screen": {
    "componentPath": "src/q1/LoanScreenGame.tsx",
    "primaryMechanic": "measurement_inspection",
    "secondaryMechanics": ["document_check", "conversation_observation"],
    "interactionNotes": "書類3点（計画書v2・通帳・見積書）を開き、照合チェックリストに○/▲を自分で記入→▲項目だけ面談で確認→返済ミニ計器で借入額と利益を見比べ、承認額を判断（280万/250万の複数解）。",
    "C_in_component": "創業計画書v2=250万（L127-133）／通帳4ページのめくりUI=コツコツ型の貯まり方（L19-24, L134-156）／見積書=280万の食い違い（L157-162）／返済ミニ計器=借入額→月返済vs利益バー（L192-204）",
    "C_required": "partial",
    "action_changes_result": "yes",
    "retry": "yes",
    "fixed_progression": "no",
    "obvious_binary_choice": "no",
    "evidence": "C(partial): 通帳は3ページ目までめくらないと○を記入できない強制ガード（L39, L44-47）。金額食い違いは▲必須（L57-60）だが計画書・見積書の開封チェックはなく勘で▲を付けられる（qa MEDIUM-2）。ガード文は場所・正解を言わない（L54-64, L71）。結果反映: 承認額でE文言が変化（L92-95）し localStorage 経由で ch4 予算上限に連動（L75 → ZoneFitGame.tsx L56-61）。retry: 記入し直し常時可、見送りは理由を問う差し戻し（L70-72）。2択は両立するトレードオフで obvious ではない（design C緩和策どおり）。"
  },
  "zone_and_fit": {
    "componentPath": "src/q1/ZoneFitGame.tsx",
    "primaryMechanic": "spatial_placement",
    "secondaryMechanics": ["drag_drop_assign", "trial_and_error_experiment"],
    "interactionNotes": "6x5グリッドに厨房セット・区画ドア・手洗い（水栓タイプ3択）・席パーツ等を選択→タップで配置。給排水壁の制約は置く瞬間に理由つきで返る。「図面をチェックする（保健所に事前相談）」が基準/営業の2タブで不備を理由つき列挙→再配置ループ。合格図面のみ決定ボタンが出現。",
    "C_in_component": "現況図（柱・トイレ・居抜き2槽シンク固定 L33-37、給排水は左壁のみ L82-85）／施設基準カード=区画・非接触水栓・2槽シンク・フタ付きゴミ箱等（L164-181）／ハルさんの希望メモ（L178-179）／予算メーター=ch3承認額連動（L56-61, L98-99, L124）",
    "C_required": "partial",
    "action_changes_result": "yes",
    "retry": "yes",
    "fixed_progression": "no",
    "obvious_binary_choice": "no",
    "evidence": "C(partial): 基準カードを読まなくても事前相談の理由つき指摘（L106-128）で収束できる＝design v1.2 C緩和策どおり。ただし指摘は「どこに何を置け」は言わない。ハンドル式（安い）は必ず基準で差し戻され（L115-116）、承認額250万だとセンサー式が予算超過で置けない（L98-99）＝ch3の判断が制約として返る。結果反映: E画面に席数・水栓・費用/承認額・カウンター有無の分岐文（L131-151）。retry: 盤面変更で合格状態がリセットされ再チェック必須（L67, L103, L127）、「ぜんぶ置き直す」あり（L256）。合格レイアウトは複数。"
  },
  "scene_audit": {
    "componentPath": "src/q1/SceneAuditGame.tsx",
    "primaryMechanic": "search_discovery",
    "secondaryMechanics": ["measurement_inspection", "document_check"],
    "interactionNotes": "7スポットを見て回り（近景の観察テキスト）、チェックリストと突き合わせて○/✗を自分で記入→判定→改善指示3択→数日後の再検査→書類（責任者修了証）確認。不備はプール抽選（旧ハンドル水栓=固定＋ゴミ箱/食器棚から1件）。レバー式水栓・古い2槽シンクが「紛らわしい適合」。",
    "C_in_component": "検査チェックリスト常時表示=別表19構造要件（L159-163）／スポットの観察テキスト=見たままの事実で正誤は書かない（seen, L25-45）／申請図面との突き合わせ（backwash=図面に載っていない設備 L43）／食品衛生責任者の修了証（L252-268）",
    "C_required": "yes",
    "action_changes_result": "yes",
    "retry": "yes",
    "fixed_progression": "no",
    "obvious_binary_choice": "no",
    "evidence": "C(yes): 観察テキストは事実描写のみで、○✗の判定には基準との突き合わせが必要。「怪しいものに全部✗」はレバー式水栓（L28-29）・古い2槽シンク（L30-31）の紛らわしい適合で不合格になる。未見スポットは記入不可（L177, L181）、誤記入は件数のみ提示で差し戻し（L102-106）。結果反映: 抽選された不備（bin/shelf, L70-72）がE画面の列挙に反映（L130）。retry: 判定差し戻し→記入し直し、指示カードは理由つきバウンス（L110-120）、改善→再検査ループが本体（L218-250）。papers はワンタップ工程（設計どおり）。注意: 指示モーダルに閉じるボタンなし（qa MEDIUM-1）。"
  }
}
```

## 総合判定

**PASS（リリース可）**。CRITICAL / HIGH なし。ビルド・lint・DB整合性・既存6編への
回帰チェックすべて通過。MEDIUM 2件はいずれも局所修正（モーダル閉じる導線・
書類開封ガード）で対応可能であり、進行不能や禁止事項違反ではない。
画像は art-manifest 全pending の意図的状態（TODO(art) 3件がその印）。

---

## 修正対応（2026-08-30・オーケストレータ）

- **MEDIUM-1 対応済み**: ch2 助言モーダル・ch5 指示モーダルに「あとで考える」閉じ導線を追加。
  ch2 は指摘済み欄の再タップでモーダルを再オープンできる（PlanCoachGame flag() に再開経路追加）。
  実機確認済み（閉じる→資料閲覧→欄再タップで再開）。
- **MEDIUM-2 対応済み**: ch3 の「計画書の金額と見積書」への記入に、計画書・見積書
  両方の開封ガードを追加（通帳ガードと同型・文言は場所と正解を言わない）。実機確認済み。
- **LOW-② 対応済み**: 通帳の既読判定を「最終ページまでめくった」に修正しガード文と整合。
- LOW-①（tenantChoice の読み手なし）は将来の wrapUp 拡張用として保持、
  LOW-③④は記録のみ（設計指定どおり）。
- 修正後 build / lint / update-factory-db すべて通過。component-reviews.json に
  新5ゲームの Layer 2 レビューを reviewedHash つきで追記済み（39/39 classified）。
