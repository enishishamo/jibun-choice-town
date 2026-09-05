# Prototype A2 — Continuous World + Semantic Zoom（2026-09-04）

Human Decision（基本architecture = A、ただし「50 worldを一枚に全部表示」
ではなく3階層のsemantic zoom）を受け、`public/dev-prototypes/
prototype-a2-semantic-zoom.html`を実装。**production実装ではない**
（`src/`配下は無変更、tsc/build差分なし。新規GPT illustration生成なし）。

`factory/state/expansion/map-architecture-decision.md`（2026-09-03、
このセッションより前の既存決定）を確認したところ、そこで既に
「Level 1=連続地域canvas、Level 2=カメラズームでdistrict scene、画面
カット排除」という、今回のA2とほぼ同じ設計思想が明文化されていたことを
発見した。「選定理由（実装の容易さでは選んでいない）」として
event-first哲学・スケール・「世界の中を見ている」感覚の3点が明記されて
おり、Human Decisionの方向性は本プロジェクトの既存哲学と整合している。

## 実装

- LEVEL 1 — WORLD: 3400×2400の連続canvas。7地区（既存4district
  illustrationのcrop pin + town-hero + プレースホルダー2地区）＋fog2箇所
- LEVEL 2 — AREA: 地区タップでカメラズーム（画面遷移でなくtransform）。
  タップした地区の sub-location のみDOMへ描画（他地区分はマウントしない）
- LEVEL 3 — EVENT: sub-locationタップでさらにズーム。そのsub-locationの
  eventのみ描画
- 50 world規模の負荷試験用に、194 sub-location・146+ eventをプロシージャル
  生成（`mulberry32`シード付き擬似乱数、手作業配置ではない）
- pan/tap arbitrationは今回のInteraction Harnessで検証済みの手法
  （pointer capture・cancel・8pxスロープ）をそのまま流用
- 空白タップで1階層戻る、専用の「← ひとつ戻る」ボタンも常設

## 自動検証（`factory/harness/map-a2-gesture-qa.mjs`、実touch event）

6ケース全PASS:
1. DOM node数がtier scopeで収まる（L1:11 / L2:7 / L3:4、登録上194+146件）
2. 地区pin上でdragしてもzoom-inしない（pan優先）
3. 通常tapでは正しくzoom-inする（過抑制の回帰確認）
4. sub-location上でdragしてもLevel3へ飛ばない
5. 空白タップで1階層戻る
6. 連続的な高速drag操作後も状態が壊れない

`ACCIDENTAL_ACTIVATION_RATE = 0`、`PAN_TAP_SEPARATION = PASS`
（**実機相当のtouch simulationによる検証。以下のCodex screenshotレビューは
この軸を「screenshotだけでは判定不能」と正しく留保しており、両者は矛盾
しない——自動テストの方が高い証拠能力を持つ**）。

## Codex独立レビュー（screenshotのみ、child-eye adversarial）

`factory/harness/map-a2-review-prompt.md`。**overall_verdict = FAIL**。

| Gate | 閾値 | 実測 | 判定 |
|---|---|---|---|
| GAME_DESIRE | >=85 | 34 | FAIL |
| DISCOVERY_CURIOSITY | >=85 | 48 | FAIL |
| WORLD_FEEL | >=90 | 43 | FAIL |
| MOBILE_INTERACTION | >=85 | 58 | FAIL |
| SCALABILITY_50_WORLDS | >=85 | **93** | **PASS** |
| MAP_CLUTTER | <=15 | 36 | FAIL |
| PAN_TAP_SEPARATION | PASS | screenshotのみでは判定不能と明記 | 自動テストでPASS確定 |

**根本原因（Codex）**: 「LOD方式は大規模データを静かに扱えている一方、
ズーム後も同じ世界を深く探索していると感じさせる空間的連続性・場所固有性が
不足し、LEVEL 2とLEVEL 3が結局『地図上の選択メニュー』へ戻ってしまって
いる」。具体的にはLEVEL 2で「同じ施設アイコンが並ぶだけで、場所同士の
意味ある位置関係がない」——これはHuman DecisionでC案を却下した理由
（overviewがmenuに見える）と**同じ失敗モードが、今回はzoom後の階層で
再発した**ことを意味する。

**Codex自身の留保**: 単色地形・汎用絵文字というplaceholder品質では
WORLD_FEELを公平に最終評価できない——適切な制作版には「地域ごとに識別
できる地形・建物・道沿いの環境ディテール、各ズーム段階を空間的につなぐ
ランドマーク、場所固有の視覚的な物語」が必要、との指摘。

## CODEX_VERDICT

FAIL。SCALABILITY（技術的なLOD設計）は優秀だが、このprototypeの実装水準
では「一つの世界を探索している」という核心的な体験を実証できていない。

## CLAUDE_VERDICT

Codexの指摘に同意する。特に重要なのは、これが**単なる見た目の安っぽさ
（placeholder art）の問題だけではない**という点——LEVEL 2の
sub-locationを「地区中心のまわりに一定半径でリング状に散らす」という
今回の実装判断自体が、場所同士の空間的な意味（実際の道沿いに並ぶ、
地形に沿って配置される等）を持たせておらず、たとえ本番品質のartを
載せても「選択肢が円形に並んだメニュー」という骨格は変わらない
リスクがある。

次に試すべきは（今回は指示により実施しない）:
1. LEVEL 2/3のsub-location配置を、Level 1の道路網をそのままローカル
   ストリートへ延長する形にする（「同じ道の続き」という空間的連続性）
2. 汎用絵文字ではなく、せめて建物の向き・高さ・道との関係性を示す簡易
   functional SVG（production artではない）で「場所らしさ」を最低限
   持たせる
3. ズーム遷移中に地形要素（道・川）が画面内に残り続けるようにし、
   「別の画面に切り替わった」ではなく「同じ場所に近づいた」を強化する

これらはlayout/interactionの再設計であり、production-quality world art
がなくても検証できる——そのためGPT_ASSET_REQUESTは**今回はまだ作成しない**
（見た目の問題である前に、配置ロジックの問題である可能性が高いため）。

## GPT_MAP_ASSET_REQUIRED

**作成していない**。理由: 今回浮上した根本課題（LEVEL 2/3が場所らしい
空間的連続性を欠く）は、artの品質を上げる前に配置ロジック（sub-location
のレイアウト方法）を直す方が優先度が高いと判断したため。artの必要性は
そのレイアウト再設計を試した後に再判断する。

## Release Safety

feature/harness-bootstrap（Development Track）上、`public/
dev-prototypes/`の独立静的prototypeのみ。`src/`配下のproductionコードは
一切変更していない（tsc確認済み、差分なし）。Stable
（main / stable-prototype-v0.1）には一切触れていない。paid API/API key
は使用していない。Production Mapへの反映は行っていない。
