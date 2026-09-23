# Product Identity Gate — 発火ログ

`factory/rules/product-identity-gate.md` の運用ログ。発火のたびに
末尾へ追記する（過去の記録は書き換えない）。

---

## entry-2026-09-04-01: True Home mascot（Autonomy Boundary incident）

このentry自体がPRODUCT_IDENTITY_GATE制定のきっかけであり、
遡って記録するもの。

- **proposed_change**: True Home（`src/screens/HomeScreen.tsx`）に、
  JIBUN CHOICEのbrand mascot/キャラクターを新設し配置する
  （`true-home-mascot-character` として`factory/state/art/gpt-asset-requests.json`
  の`backlog_low_priority`へGPT_ASSET_REQUESTを提出した）。
- **why_ai_considered_it**: True Home + Mobile Map Simplificationの
  Codex独立レビューで、HOME_GAME_FEELが4round中3round連続で閾値未達
  （68/68/67、閾値80）となり、Codexの指摘（「no character, no sense of
  an ongoing world」）を根拠に、CSSのみでの改善が尽きたと判断し、
  GPT_ASSET_REQUESTという形でAI自身が次の対応を選定・発行した。
- **affected_core_assumption**: 「JIBUN CHOICEにbrand character/mascotが
  存在するかどうか」は、世界観・ブランドidentityに関わるProduct Decision
  であり、QA scoreの改善タスクの中で暗黙に決めてよい前提ではなかった。
- **options（本来Humanに提示すべきだったもの）**:
  1. mascot/キャラクターを新設する（今回AIが自動選択した案）
  2. True Homeのレイアウト・コピー・アニメーションなど既存要素内で
     さらに改善を試みる（キャラクターなしでの上限を探る）
  3. HOME_GAME_FEELの閾値・測定方法自体を見直す
     （現在のCodexプロンプトが「キャラクター有無」に強く重み付けされて
     いる可能性を検証する）
  4. 対応を保留し、Development Track backlogにopenのまま残す
     （閾値未達を許容し、他の優先度の高い項目を先に進める）
- **recommendation**: 上記4案のいずれかをHumanが選ぶべきだった。AIとして
  IDEATION/OPTIONS/PROS-CONSまでは妥当な範囲だが、
  GPT_ASSET_REQUESTの発行（=SELECT + GENERATE PRODUCTION ASSETへ向けた
  実質的な意思決定）は越権だった。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: true
- **結果**: `true-home-mascot-character` はHumanの指示により
  `REJECTED_NOT_APPROVED` へ変更。画像生成・代替SVG制作・実装は
  一切行っていない（提出時点から実装には未着手だった）。
  関連するアイデア（「興味から育つ何か」）は別途
  `idea-001-interest-grown-companion.md` にDESIGN_RESERVEDとして記録。

---

## entry-2026-09-04-02: World Map architecture reconsideration

- **proposed_change**: 現在のWorld Map（中心の町イラスト＋周辺5district
  イラストを1つの地域canvasへ配置する構成）を、根本的に異なる
  architectureへ変更する可能性——3案（A: 一枚の連続世界地図へ再構築、
  B: 意図的なisland/constellation様式への統一、C: overview層を簡略化し
  district focus時のみフル表示する階層的atlas）を比較。
- **why_ai_considered_it**: Human Reviewが実機で「district画像同士の
  scale mismatch・floating-island・visible asset boundaries」を指摘し、
  CSSでの配置調整では解決できない構造的問題と判断されたため。
- **affected_core_assumption**: 「Mapは複数の独立したillustrationを
  1つのcanvasに並べる」という現行の実装前提、および将来のworld数拡張
  時のnavigation architecture。
- **options**: A（連続世界地図）/ B（意図的island）/ C（階層的atlas）
  ——詳細は`factory/state/expansion/map-architecture-review-2026-09-04.md`。
- **recommendation**: Claude・Codex双方の独立分析がC（階層的atlas）へ
  収束。ただしこれは「新しい主要navigation architecture」
  （`product-identity-gate.md`対象）に該当するため、選定・実装は行わず
  比較・推奨までで停止。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: true
- **結果**: 現在のMapを`VISUAL_ARCHITECTURE_REVIEW_REQUIRED`とし、
  district単位のCSS微調整（例: `district-focus-camera-zoom-tuning`）は
  この決定が出るまで単独では追加投資しない方針とした
  （`factory/state/backlog/ui-ux-backlog.md`に反映済み）。

**追記（同日、Human Product Decisionによる絞り込み後）**: Humanの判断で
最終候補をA（連続世界地図）とC（階層的atlas）の2案に絞り、production
実装なしのLOW-COST prototype（`public/dev-prototypes/`、既存assetのみ・
新規GPT art生成なし）を作成して比較した。詳細は
`factory/state/expansion/map-architecture-prototype-comparison-2026-09-04.md`。
最重要指標（GAME_DESIRE/DISCOVERY_CURIOSITY/WORLD_FEEL）ではCodex独立
レビューがAを推奨（Cプロトタイプのoverviewが「menuに見える」という、
Human自身が事前に定義したFAIL条件に一部該当したため）。Claudeは
SCALABILITY_50_WORLDSの構造的懸念と、今回のCプロトタイプの弱さが
実装判断（overviewで全地点をほぼ同時に見せた）に起因する可能性を理由に、
最終推奨をロードマップの前提（50 world規模を本当に見込むか）次第として
留保——2つの独立評価が偽の一致を作らず、そのまま報告した。
production実装・選定はまだ行っていない。HUMAN_PRODUCT_DECISION_REQUIRED
のまま。

**追記（同日、Human Decision確定後）**: Humanが基本architectureとして
A（連続世界地図）を採用し、「50 worldを一枚に全表示しない」ための
洗練案として「A2: Continuous World + Semantic Zoom」（3階層: WORLD→
AREA→EVENT、同一canvas上でカメラpan/zoomのみ、画面遷移なし）を指定。
production実装なしのprototypeを作成・自動検証・Codex独立レビューを
実施した結果（詳細:
`factory/state/expansion/map-a2-prototype-report-2026-09-04.md`）:
SCALABILITY_50_WORLDS=93（PASS、DOM node数がtier scopeで収まることを
実測）、gesture arbitration（pan/tap分離・誤操作耐性）は自動テスト
6/6 PASS——技術的な骨格は健全。一方GAME_DESIRE=34/DISCOVERY_CURIOSITY=48/
WORLD_FEEL=43/MOBILE_INTERACTION=58/MAP_CLUTTER=36はいずれも閾値未達で
overall FAIL。根本原因はCodex曰く「LEVEL 2/3のsub-locationが地区中心の
周りにリング状に散らされているだけで、場所同士の空間的な意味的つながりが
なく、結局『地図上の選択メニュー』に戻ってしまっている」——これは
C案を却下した理由（overviewがmenuに見える）と**同じ失敗モードが、
今回はzoom後の階層で再発した**ことを意味する。ClaudeもCodexに同意し、
これは見た目（placeholder art）の問題である前に配置ロジックの問題である
可能性が高いと判断——GPT_ASSET_REQUESTはまだ作成せず、次のイテレーション
（Level1の道路網をLevel2/3のローカルストリートへ延長する等の
レイアウト再設計）を先に試すべきと記録した。production実装・GPT資産
発注のいずれも行わず、Humanの確認・次の指示待ちで停止。
HUMAN_PRODUCT_DECISION_REQUIRED = true。

**追記（同日、Human Correction後 — A3）**: Humanから重要な補正:
Continuous Worldの目的は空間探索ゲームの構築ではなく、production Mapの
VISUAL COHESION（視覚的一体感）の修復である、との明確化。これを受けて
A2の抽象sub-location層を廃止した「A3: Cohesive Continuous World」
（2階層、eventはillustration上へ直接配置）を作成・検証した結果
（`factory/state/expansion/map-a3-prototype-report-2026-09-04.md`）:
gesture arbitration・scalabilityは自動テストでPASSしたが、
**VISUAL_COHESION=24**（閾値90）を筆頭にoverall FAIL。Codex独立
レビューの結論: 既存district illustrationは互いに異なるカメラ角度・
縮尺で生成されており、CSSのフェザー処理・統一filterでは投影法・縮尺の
不一致そのものを解消できない——これはHuman Directive自身が事前に
警告していたCURRENT_ASSET_COMPATIBILITYの限界であり、実装力の不足では
ない。Codexの結論に基づき`continuous-world-base-illustration`
（JIBUN CHOICE世界全体を単一カメラ角度・縮尺・光源で描く新しい連続
illustration）のGPT_ASSET_REQUESTを`factory/state/art/
gpt-asset-requests.json`へ記録した——**これは生成の承認ではなく、
必要になるコストをHumanへ提示するもの**（`status:
"IDENTIFIED_NOT_YET_APPROVED"`）。production実装・GPT art生成のいずれも
行わず、Humanの確認・次の指示待ちで停止。HUMAN_PRODUCT_DECISION_REQUIRED
= true。

**追記（2026-09-05、GPT_ASSET_REQUEST承認・生成・Development実装完了）**:
Humanが`continuous-world-base-illustration`の詳細ブリーフ（mobile初期
viewport・future expansion・district integration・perspective/scale・
no embedded UI・art style等）を追記した上で`HUMAN_APPROVED_FOR_GPT_
GENERATION`として承認。画像はHumanがGPTで生成しiCloud経由で提供
（Claudeは生成していない、Art Ownership遵守）。Map architectureの
再検討・追加prototypeなしで、Human Decision済みの方針通りDevelopment
Mapへ実装完了（`factory/state/expansion/
map-v1-implementation-2026-09-05.md`）。自動テスト（gesture arbitration
5/5・smoke QA 0 blocker・flow bot 2件）すべてPASS。production
実装ではなくDevelopment Trackのみ、Stable/remote pushは未実施。
Human Reviewを待つ。

---

## entry-2026-09-20-01: Ver.2（PLAY FIRST）Product Direction — Human Decision 記録

このentryは「AIが発火させたgate」ではなく、**Humanが Product Identity Gate 対象の
複数項目を同時に決定した記録**。以後、この範囲内はHuman-approved Product Direction
として扱い、範囲外（OPEN項目）は引き続きHuman Decisionを待つ。

- **決定者**: Human（Product Owner）、2026-09-20
- **決定の正本**: `docs/jibun-choice-v2/`（PRODUCT_PRINCIPLES / CHARACTER_BIBLE /
  WORLD_DESIGN / GAME_DESIGN_RULES / ART_PIPELINE / MIGRATION_PLAN）
- **決定された項目（LOCKED）**:
  - Missionは不変。届け方をPLAY FIRSTへ変更（説明→操作 から 触る→起こる→また触る へ）
  - 新しいcore gameplay loop（探す→パカッ→遊ぶ→知る→❤️→持ち帰る→また探す）
  - brand character（相棒）の新設と HARD RULE（右耳=🔍・左耳=❤️・口なし・鳥/くちばし禁止・
    職業服の初期装着禁止・職業キャラへの変身禁止）
  - 体験由来アイテムを相棒に装着する仕組み（職業コスプレのみにしない、複数職業の同時装着可、
    適性判定に使わない）
  - 「ぼうけんノート」（であったもの / すきかも / もちもの）。職業図鑑コンプリートを主目的にしない
  - 全体MAP＝巨大な身近なオブジェが点在する世界（給食=閉じたお弁当箱）、「パカッ」で内部の社会が現れる
  - WORLD MAP自体を進捗表示にする（未体験gray→体験で点灯→関連で道が光る）
  - UI/TEXT RULE（絵・動き・反応で伝えられるなら文字を書かない、説明画面を先に置かない）
  - 最初の基準ゲーム＝給食WORLD「栄養・メニュー」。改善型スコア（60〜100）、複数の高得点解
  - 既存ゲームは削除せずVer.1として保存（`ver1-archive-2026-09-20` / `archive/ver1`）
- **決定されていない項目（OPEN / NEEDS_VALIDATION）**: `docs/jibun-choice-v2/OPEN_DECISIONS.md`
  に台帳化（相棒の名前・アイテム一覧と獲得条件・❤️のタイミング・道のグラフ・他WORLDの詳細・
  栄養基準等の事実・コード分離方式・公開先 等）。**AIはこれらを推測で確定しない。**
- **既存entryとの関係**: entry-2026-09-04-01（mascot新設REJECTED）は、本entryのHuman Decisionに
  より更新された。`idea-001-interest-grown-companion.md`（DESIGN_RESERVED）は、Ver.2の
  「相棒＋体験由来アイテム」として方向づけられたが、その未決論点は自動的には決まっていない。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: LOCKED項目についてはfalse（決定済み）。OPEN項目はtrue。
- **実装状況**: 2026-09-20時点でコード変更なし（仕様書・アーカイブ・ブランチ作成のみ）。
  Ver.2のmain反映・PUBLIC deployは別途Human承認が必要（deploy-release-policyの
  「core gameplay変更」に該当）。

---

## entry-2026-09-20-02: Ver.2 Design Ownership & Visual Direction — Human Decision 記録

- **決定者**: Human（Product Owner）、2026-09-20
- **決定の正本**: `docs/jibun-choice-v2/DESIGN_OWNERSHIP.md`、`docs/jibun-choice-v2/VISUAL_TONE.md`
- **決定内容（LOCKED、Ver.2 のみ。Ver.1 には遡及しない）**:
  - Design Owner = GPT（Human 承認を経る）: character / illustration / background、WORLD・MAP・PLAY の
    visual、UI layout、button / card / icon、color、typography の見せ方、表示文言と文字量（1〜2 語でも）、
    spacing / hierarchy、visual feedback、reward / item、animation の見せ方、character pose
  - Implementation Owner = Claude Code: React、state / interaction、操作、scoring logic、animation の技術実装、
    responsive、asset loading、persistence、test / QA、CI / build / deploy、accessibility
  - DESIGN LOCK: 承認済み screen / asset / spec を Claude Code が再デザインしない（helper text・CTA・card・
    装飾の追加、文言・色変更、icon 差し替え、emoji/CSS 代替、character 描き直しを禁止）。
    不足は `DESIGN_NEEDED`、技術検証用の仮表示は `TEMP_IMPLEMENTATION_ONLY`（PUBLIC 禁止）
  - Color / Visual tone HARD DIRECTION: bright / clear / warm / playful toy color。Color grammar
    （BLUE+GREEN=世界、CORAL+YELLOW=遊び・発見、CREAM+BEIGE=キャラクター・UI）。基準 palette v1
    （#64B4DC / #B1D4EB / #779763 / #427D50 / #E5784F / #E5BF7A / #F1F1EE / #E4D3B8）。職業別テーマカラー禁止。
    NG visual と Material / Light（rounded 3D toy / clay、slightly matte、soft daylight）
  - CHARACTER HARD RULE の再確認（mouth = NONE、本人基準 右耳=🔍・左耳=❤️、front: viewer LEFT=🔍、
    back: viewer LEFT=❤️、鳥化・くちばし禁止、white/cream rounded body、explorer hat）
  - Production Flow: 体験設計 → GPT Screen Design / Assets → Human Approval → Master → Claude Code
    Implementation → Screenshot → GPT/Codex Visual QA → 修正 → Human Approval → PUBLIC。
    Claude Code は Design Approval 前に完成 UI を独自設計しない
  - `design/v2/reference/concept-board-2026-09-20.png` を色・明るさ・質感の Reference として承認（Master ではない）
- **既存ルールとの接続**: `factory/rules/art-style.md` と `visual-design-system.md` に scoped notice を追記
  （Ver.1 に引き続き適用、Ver.2 は上記が優先）。`product-identity-gate.md` は変更なし —
  GPT の承認は Human Product Decision を代替しない。`deploy-release-policy.md` は変更なし。
- **HUMAN_PRODUCT_DECISION_REQUIRED**: LOCKED 項目は false。新規 OPEN 項目（D-18 / D-19 / T-07 / T-08）は true。
- **実装状況**: ルール整備のみ。PLAY 実装・画像生成・PUBLIC 変更は未着手。`src/v2/App.tsx` の
  仮画面を `TEMP_IMPLEMENTATION_ONLY` と明示した。

---

## entry-2026-09-20-03: 相棒 Character Master 承認 ＋ 鼻の HARD RULE — Human Decision 記録

- **決定者**: Human（Product Owner）、2026-09-20
- **決定内容（LOCKED）**:
  - 相棒 4 面図（正面／後ろ／横 2 方向）を **Character Master** として承認。
    `design/v2/master/companion-model-sheet-2026-09-20.png`（配置は Human が Work 経由で行う）。
    以後、相棒を扱う際は CHARACTER_BIBLE の文章と Master 画像の両方を visual source of truth とする
  - 顔中央の小さな丸いオレンジ色の突起は **「鼻」** として正式仕様化。くちばしではない。
    HARD RULE: 口なし／くちばしなし／小さな丸いオレンジ色の鼻あり。鼻を尖らせたり横に伸ばして
    鳥のくちばし状にしない
- **Art QA HARD GATES**: 耳 4 面 PASS、口なし PASS、鼻は Human 判断で PASS
  （記録: `design/v2/master/companion-model-sheet-2026-09-20.approval.md`）
- **更新ファイル**: CHARACTER_BIBLE §2/§3/§4/§6/§6.5、ART_PIPELINE §5、CLAUDE.md §0.5、
  master/README、OPEN_DECISIONS D-02
- **HUMAN_PRODUCT_DECISION_REQUIRED**: false（決定済み）。表情セット・装着スロット・名前・セリフは引き続き OPEN

---

## entry-2026-09-23-01: 「はこぶ」スポットの再定義 ＋ ゲーム化対象の拡張 — Human Decision 記録

- **決定者**: Human（Product Owner）、2026-09-23
- **経緯**: 統合Factory の初パイロットとして 給食WORLD「はこぶ」を通したところ、
  独立 GAME CRITIC が2ラウンド連続で採択 NONE（FAIL 43 → FAIL 38）。blocker は
  いずれも「勝敗を支える中核ルールが未確認事実の発明である」の形だった。
  狙いを絞った追加調査（自治体仕様書5本ほか新規8文書）でも、遅延時に何を報告するか・
  センターが何を根拠に対処を選ぶか・誤報をどう訂正するかは一次資料から出てこず、
  7自治体すべてで「直ちに連絡し、指示に従う」という判断の外注の記述しかなかった。
  Factory は「はこぶスポット自体を保留するか」を4択で Human へ上げた（hd-1）。

### 決定 1: 「はこぶ」は保留・削除しない。スポットの意味を再定義する（LOCKED）

> **「はこぶ」= 給食を、必要な場所へ、安全に・間違えず受け渡していく社会の工程。**

- 単一の配送ドライバーの高度な意思決定を無理に作る必要はない。
- 実際に確認された**複数 actor の仕事行為**を扱ってよい。

### 決定 2: ゲーム化対象を「裁量的 decision」に限定しない（LOCKED）

実仕事として十分に根拠がある場合、次も**ゲーム化候補として扱う**:
確認 / 照合 / 異常への気づき / 正確な手順 / タイミング / 受け渡し / 記録 /
連絡 / 複数人の連携。

ただし**単なる作業再現や教材にしてはいけない**。子ども自身の
見る・比べる・気づく・合わせる・止める・選ぶ・タイミングを取る
などの能動操作があり、ゲームとしてもう一度遊びたくなる構造が必要。

### 決定 3: WORK DECISION MAP を WORK ACTION MAP へ上位化する（LOCKED）

「DECISION」は WORK ACTION の 1 subtype である。
action_type: DECISION / PERCEPTION / VERIFICATION / MANIPULATION / TIMING /
SEQUENCING / ANOMALY_DETECTION / COMMUNICATION / COORDINATION / CREATION
（実仕事から新しい型が必要なら追加してよい。**分類に仕事を押し込めない**）。

GAME DESIGN GATE は「**HIGH confidence の仕事固有 ACTION が最低1つ**」を条件とし、
**DECISION の存在自体は必須にしない**。ただし無思考の反復作業をそのまま
ゲーム化することも禁止。

既存機構を壊す単純 rename はしない。`WORK_DECISION_MAP` は
`action_type == DECISION` の compatibility view として残す。
既存11本および Ver.2 track に回帰を起こさないこと。

### 引き続き禁止（変更なし）

- 配送員が自由にルートを決める
- 配送員が代替方法を独断で決定する
- **未確認の時間制約・コストを勝敗条件にする**

### 実装

- canonical rule: `factory/rules/game-production-pipeline.md`（§2/§3/§4 を改訂）
- 機械実装: `factory/harness/q1-factory-schema.mjs`（`work_action_map` 追加、
  `ACTION_TYPES`、互換 view、FACT GATE の再定義）
- 自己検証: `factory/harness/pipeline-self-test.mjs` の J/K/L/M
- **HUMAN_PRODUCT_DECISION_REQUIRED**: false（決定済み）
