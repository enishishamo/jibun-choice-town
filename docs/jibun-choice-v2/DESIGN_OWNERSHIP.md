# DESIGN OWNERSHIP — Ver.2 の設計責任分担と DESIGN LOCK

制定: 2026-09-20（Human Decision、`factory/state/product-ideas/gate-log.md` entry-2026-09-20-02）。
状態: **LOCKED**。Ver.2 の全画面・全 PLAY に適用する。Ver.1（`main` / `archive/ver1`）には
遡及しない。

## 1. 役割（LOCKED）

| 役割 | 担当 | 範囲 |
|---|---|---|
| **Design Owner** | **GPT**（Human 承認を経る） | ユーザーが画面上で「見る・読む・感じる」もの |
| **Implementation Owner** | **Claude Code** | 承認済みデザインを動かす技術実装 |

### Design Owner（GPT）の対象

- character / illustration / background
- WORLD / MAP / PLAY の visual
- UI layout、button / card / icon
- color、typography の見せ方
- **表示する文言と文字量**（1〜2 語の小さな文言も含む）
- spacing / visual hierarchy、visual feedback
- reward / item、animation の見せ方、character pose

画像・動き・interaction で伝えられる場合は、文字を置かないことを優先する
（[PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) §5 UI/TEXT RULE）。

### Implementation Owner（Claude Code）の対象

- React implementation、state / interaction、tap / drag 等の操作
- scoring logic、animation の技術実装、responsive implementation
- asset loading、persistence、test / QA、CI / build / deploy
- accessibility 等の技術要件

## 2. DESIGN LOCK（LOCKED）

GPT / Human 承認済みの screen・asset・spec を、Claude Code が独自に再デザインしない。
特に以下は**禁止**:

- helper text / subtitle / tooltip / CTA 等を追加する
- 文言を変更する（1〜2 語でも）
- 色を変更する
- icon を差し替える
- illustration を emoji / CSS drawing 等で代替する
- card / panel / decoration を追加する
- character を描き直す
- 「分かりやすくするため」の独自 visual 変更
- tutorial copy / success message / helper text を独自に追加する

### 不足があるとき

| 状況 | Claude Code の対応 |
|---|---|
| デザイン上、要素・文言・asset が足りない | 勝手に補完せず **`DESIGN_NEEDED`** として記録する（コード内コメント＋ `docs/jibun-choice-v2/OPEN_DECISIONS.md` または当該 PLAY の README） |
| 技術検証のために仮の見た目が必要 | **`TEMP_IMPLEMENTATION_ONLY`** とコード・画面の両方に明示する。**PUBLIC には出さない** |
| 承認済みデザインが技術的に実装不能 | 実装せず、代替案を **提案**（複数案・長所短所）して Design Owner / Human の判断を待つ |

`TEMP_IMPLEMENTATION_ONLY` が残ったままの画面は release gate（`factory/harness/task-state.mjs can-deploy`）を
通さない扱いとする（運用: 実装 task の QA 記録に「TEMP なし」を必須項目として含める。機械チェックは OPEN T-08）。

## 3. Production Flow（LOCKED）

以後の各 PLAY は原則この順で進める。**Claude Code が Design Approval より先に完成 UI を独自設計しない。**

```
体験設計（何を触り、何が起こり、何を知るか）
 ↓ GPT Screen Design / Assets
 ↓ Human Approval
 ↓ Master / Approved Design（design/v2/master/ + approval 記録）
 ↓ Claude Code Implementation（承認済み design のみ）
 ↓ Screenshot（375px 実機相当）
 ↓ GPT / Codex Visual QA（ART_PIPELINE.md §5 HARD GATES 含む）
 ↓ 修正
 ↓ Human Approval
 ↓ PUBLIC（Human 承認、deploy-release-policy に従う）
```

- 「体験設計」は Claude Code も担当できる（PLAY FIRST 規約に沿った盤面・操作・ロジックの設計提案）。
  ただし画面の見た目・文言は GPT Screen Design を待つ。
- GPT の承認は **Human Approval を代替しない**。Product Identity Gate 対象（相棒・アイテム・
  ノート・ループ等）の最終判断は引き続き Human（`factory/rules/product-identity-gate.md`）。

## 4. 既存ルールとの関係

| 既存ルール | Ver.2 での扱い |
|---|---|
| `factory/rules/art-style.md` の art ownership（Claude = UI/CSS/SVG、GPT = illustration） | **Ver.2 では本書が上書き**: UI layout・icon・color・文言も GPT が Design Owner。Claude は実装のみ。Ver.1 には従来どおり適用（両ファイルに scoped notice を追記） |
| `factory/rules/visual-design-system.md`（既存パレット維持 等） | Ver.2 は [VISUAL_TONE.md](VISUAL_TONE.md) の palette v1 を使う。Ver.1 画面には従来どおり適用 |
| `factory/rules/visual-production-flow.md`（Auto Review Team / Human Gate） | Ver.2 では §3 の Production Flow が正。Auto Review / Codex Visual QA はその中の「GPT / Codex Visual QA」段に対応 |
| `factory/rules/product-identity-gate.md` | 変更なし。GPT 承認は Human Product Decision の代替にならない |
| `factory/rules/deploy-release-policy.md` | 変更なし。Ver.2 の PUBLIC は必ず Human 承認 |
| `factory/rules/language-style.md`（語彙・ふりがな） | 文言の**内容**は GPT が決める。ふりがな付与・行間などの**技術的描画**は Claude が language-style に従って実装 |

## 5. Claude Code セッション開始時のチェック

Ver.2 の画面に触る前に確認する:

1. その画面の Approved Design（`design/v2/master/` または承認記録）が存在するか
2. 実装しようとしている文言・色・icon・配置はすべて承認済み design にあるか
3. 足りないものは `DESIGN_NEEDED` にしたか（補完していないか）
4. 仮表示は `TEMP_IMPLEMENTATION_ONLY` と明示したか
