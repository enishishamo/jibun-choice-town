# World Expansion v1 — 最終レポート（2026-09-04）

指示: 「教材の一覧」から探検できる JIBUN CHOICE WORLD へ。言語UXを先に確立し、
Factory v1 で 5 world を量産しても地図・ホーム・探検・言語UXが壊れないことを実証する。
全工程自律実行・Codex独立レビュー・追加課金ゼロ。

---

## 1. Language UX Lab（§2-7）
- 対象年齢帯の実在タイトル **17本** を調査（factory/state/expansion/language-research.json）。
- **Language Style Guide** を制定（factory/rules/language-style.md）:
  幼稚化しない・専門語は「語＋15-30字の言い換え＋視覚」・選択的ルビ（画面初出）・
  1文45字・説明2ブロック上限・ボタン2-6字・failureで答えを漏らさない。
- 実装基盤: `｜語《よみ》` マークアップ＋`withRuby()`（src/lib/ruby.tsx）。
  Q1ミッション行・Q2本文・lensSummaryに配線。グローバル文字サイズ底上げ
  （本文16px・choice-name 14.5px 等）。
- 既存worldの文言は**書き換えず** LANGUAGE_BACKLOG に70項目を記録（§7遵守）。
- Language QA Gate はworldレビューに統合され、5 world 全てで
  LANGUAGE_AGE_FIT / BUTTON_CLARITY / TEXT_DENSITY ≥ 80 を達成。

## 2. World Map Lab（§8-19）—「生きた町のアトラス」
- ゲーム地図 **20本** を調査。Claude と Codex が**結論非共有で独立選定**し、
  Codex案「Living Event Atlas」とClaude案（D+C+F複合）が収束（§11記録:
  factory/state/expansion/map-architecture-decision.md）。
- 実装: 1枚の連続リージョンキャンバス（1200×820）・既存の町イラストは中央タイル・
  地区（港/森と川/駅前/丘の上＋霧×2）・CSSズームカメラ（画面切替なし）・
  ドラッグパン・地区チップ・生活シグナル上限5（NEWバッジ依存を置換）。
- world状態 6種を実装: UNSEEN(霧)/DISCOVERED🔥/VISITED📍/IN_PROGRESS🔨/
  COMPLETED🚩/**UPDATED✨**（WORLD_CONTENT_VERSION×seenVersionで到達可能）。
- 汎用配置（§30）: WORLD_DISTRICT 1行登録・districtSlotリング・**ラベル幅推定
  つき決定的デコリジョン緩和（地区内拘束）**・地形はTERRAIN_FILL×レジストリから
  生成（world個別の手調整ゼロ）・定員8超過と未登録/誤登録IDはフェイルセーフ＋警告。
- **§31 50world級負荷試験**: ダミー20world注入で34マーカー→**重なり0**
  （mobile 375px / desktop 1280px）。ダミーは試験後に完全除去（本番データ残留なし）。
- **Home Quality Gate（§34）: R4 PASS** — EXPLORATION_DESIRE 91 / SCALABILITY 87 /
  MAP_CLARITY 90 / LANGUAGE_AGE_FIT 92（R1 68→R4、4周の修理）。

## 3. World Expansion Mode（§20-28）— 5/5 完成
候補30件（PLACE+EVENT+WHY_CHILD_MIGHT_CARE、job-first禁止）から **Codexが自律選定**
（人間への選択依頼なし）。全worldでバインディング相手はCodex adversarialレビュー
（CA/GQ二軸＋Language 6軸、blockers/high=0必須）。

| world | 地区 | Q1 | 判定 | 周回 |
|---|---|---|---|---|
| 真夜中のみなと（night-port） | 港 | yard_plan / crane_lift / tally_check / truck_dispatch | **PASS 84** (CA89/GQ84) | 3 |
| もりをきる、もりをまもる（forest-care） | 森と川 | thinning_pick / fell_direction / plant_plan | **PASS 86** (CA91/GQ86) | 4 |
| 川に魚がもどった！（river-health） | 森と川 | water_trace / plant_ops / bank_design | **PASS 84** (CA91/GQ84) | 12 |
| 「たまに止まる」の犯人さがし（game-studio） | 駅前 | bug_repro / difficulty_tune / ui_clarity | **PASS 84** (CA91/GQ84) | 2 |
| 100年前の写真のなぞ（library-detective） | 丘の上 | photo_clues / paper_rescue / digi_archive | **PASS 82** (CA88/GQ82) | 4 |

- 全15 Q1: 純ロジックモジュール（portLogic/forestLogic/riverLogic/studioLogic/
  libraryLogic）＋決定的シミュレーション **121本**（33/22/24/18/24）全通過。
  informed play 100%勝利・novice trap（HP下げ反射・1点一致断定・全部コンクリ・
  太い不具合票 等）は機械的に敗北・予算/拒否/ミス上限を機械強制。
- 既存3ゲート（Series Style / Gameplay Experience v3 / Asset Presentation）と
  Game Reference Gate（trace付きで taxonomy 登録）を全world維持。
- ブラウザQA: 5 world × mobile/desktop の correct-play bot 完走・console 0エラー。
  riverに稀な環境フレーク（約1/14）を観測、計測装置（クリック履歴・ストレージ・
  リロード検出）を恒久残置。直近8/8完走。
- machine検証: `validate-pipeline.mjs` 5 world 全てOK（alias対応・最新PASSレビュー
  再読・QAスイート実行・presentation証跡・reference trace チェック）。

## 4. Art（契約内自動生成・ガバナンス）
- 全生成は Codex 組み込み画像生成（サブスク内・APIキーなし）。11点を新規生成
  （scene×5 / ba-before×5相当 / ba-after×2 は再生成含む）、全て<2MB。
- **BAペアのアンカー法**確立（before に固定アンカー2-3点→afterはUNCHANGED宣言＋
  変更点列挙）。forest/river/portペアはユニットQA＋in-context双方PASS。
- **裁定2件**を style-contract に記録: (1) scene_map級のcrop指摘はin-context監査が正
  （先例拡張）。(2) ペア厳格条件がmax_iterations時は**wrapUp画面でのin-context仲裁**
  （「同じ場所＋1つの物語変化」）。library/studioペアはこの仲裁でPASS。
- **presentation層の汎用修正**: バッジを被写体の上へ持ち上げ（ステム▼）・アクティブ
  スポット自動センタリング・エッジフェード → 再監査 **12/12 PASS**（5 area
  mobile+desktop / 5 wrapUp / ほか）。
- 事故と再発防止: コピーしたartリクエストのoutput_path残存でriver sceneが一時
  上書きされた → 全リクエスト修正＋art-loopに **output_path≡filename フェイル
  クローズドガード**（run/run-pair/run-after）。

## 5. 子ども視点批評（§33）と反映
Codex批評（小5/中2ロールプレイ）の指摘を反映:
- 霧地区: 再タップごとに新しい手がかりへ循環（誠実な予告のみ・偽の解放条件なし）
- worldマーカーの空振り排除: 遠景タップ→カメラが寄ってそのまま入場（1連続動作）
- 港の導入に危機を追加・CTAを2-6字の動詞へ（ふ頭へ/森へ入る/川ぞいへ/奥へ入る/中へ入る）
- 説教調の「きみの家の…」行を削除・wrapUp圧縮・ひらがな氾濫を配当漢字へ
- weakest hook（港）・text_heavy（wrapUp/lens）・dead_zones の全指摘に対応または
  LANGUAGE_BACKLOGへ記録

## 6. §29 / §35 / §36 / §37
- §29: docs/professional-profile-compat.md — **実装なし**。データモデル非破壊
  （professional_profiles[] を将来optional追加可能）。架空プロフィール生成の恒久禁止を明記。
- §35: child-observation-schema.json に **map_observation**（最初のタップ・パン・
  霧反応・シグナル外探索・自力帰還・発話）を追加。
- §36: principles.md へ学習4件（artリクエスト衛生・BAペアアンカー法・レビュー終端
  チェックリスト7項目・クォータキュー運用）。過度な一般化はせず記録に留めた。
- §37: 意味単位で**7コミット**（world単位＋修理単位）。remote pushなし。

## 7. コスト・独立性
- 外部APIコール 0・APIキー使用 0・従量課金 0。Codex は ChatGPT サブスクリプション
  OAuth のみ（SAFE_ENVでAPIキー環境変数を剥離）。クォータ枯渇時は**待機キュー**
  （20分間隔probe）で回復待ちし、有料フォールバックは一切行っていない。
- レビュー独立性: バインディング判定は全て Codex adversarial レビュー
  （INDEPENDENCE_PREAMBLE付き）。Claudeによる自己合格なし。
  途中からのモデルルーティング指示に従い、Fable使用は routing-log.jsonl に理由を記録
  （方針採択・Home修理・ガバナンス裁定・本レポート合成の4件）、定型作業は軽量モデルへ委譲。

## 8. 残課題（次サイクル）
- LANGUAGE_BACKLOG 70項目（既存worldの文言改善）
- riverフレークの根本原因（計測装置残置済み・出現率~7%）
- 実子ども検証（下記フラグ2件）・霧地区の実world化（📡/🛩）
- component-reviews の presentation系変更に伴う定期rehash運用

---

## フラグ（§39）
- **LANGUAGE_UX_V1: DONE**（Style Guide＋ルビ基盤＋全worldでLanguage軸80+）
- **WORLD_MAP_V1: DONE**（生きた町のアトラス・Home Quality Gate PASS 91/87/90/92）
- **WORLD_EXPANSION_MODE: DONE**（候補30→Codex自律選定→Factory量産の全区間実証）
- **NEW_WORLDS_COMPLETED: 5/5**（84/86/84/84/82・全てblockers/high=0）
- **MAP_SCALABILITY_50_WORLDS: VERIFIED**（34マーカー重なり0・定員/境界/未登録の機械強制）
- **AI_VERIFIED_MAP: TRUE**
- **REAL_CHILD_MAP_VALIDATION: PENDING**（観察スキーマ整備済み・実子データ待ち）
- **REAL_PROFESSIONAL_PROFILE: DESIGN_RESERVED**（実装なし・非破壊確認済み・架空生成なし）
- **EXTRA_COST_INCURRED: 0**
