# Stable / Public Validation Track — PUBLIC BLOCKER 整理（2026-09-04）

Two-Track運用（[`two-track-model.md`](two-track-model.md)）における
Track A（Stable/Public Validation）の公開判定基準を、この文書に一本化する。
「完璧である」ことではなく「**公開してよいか**」だけを判定する。

## 判定基準（今回の直接指示）

- Career Path: 事実誤認のPUBLIC BLOCKERが0であること（Codex plausibility
  reviewの得点ではなく、WebSearch実地検証での確認）。
- Language UX: 全63 Q1コンポーネントのふりがな網羅は今回のStable判定には
  含めない。**主要導線上の致命的な読みづらさ**（＝読めないことで実際に
  先へ進めなくなる／誤った行動を選んでしまう箇所）のみをPUBLIC BLOCKERとして扱う。
- Art Ownership: GPT_ASSETS_REQUIRED=4・PUBLIC_BLOCKING_GPT_ASSETS=4 を保持
  （既存の判定を変更しない）。

## 1. Career Path — CAREER_FACT_PUBLIC_BLOCKERS = 0

`factory/state/career-path/websearch-fact-verification-2026-09-04.md` に
17職業・22論点の実地検証（政府一次情報・法令・職能団体公式情報）を記録。
発見した10件の実質的な事実誤認（doctor/labtech/nurse/river-operator/
env-measurer/incinerator-operator/landfill-manager/food-inspector/logistics/
crowd-safety/trip-conductor/forest-picker、一部重複あり）はすべて修正済み。
修正後、62職業sweep・tsc・全5ワールドflow bot regressionはPASS。

**判定: CAREER_FACT_PUBLIC_BLOCKERS = 0**

## 2. Language UX — LANGUAGE_PUBLIC_BLOCKERS = 0（判断根拠つき）

4round実施したCodex in-context screenshot QAの最終blocker指摘:
> 「ホームの地名・誘導文とイベント導入の進行ボタンに、小学3年生が読めない
> 可能性のある漢字が無ルビで残り、行き先選択や次画面への進行に影響し得る」

この指摘を「主要導線を壊すBLOCKER」なのか「読みやすさの改善余地」なのか、
実際のスクリーンショットに基づいて判定した:

- 指摘された語（丘・森・川・駅・港・追・気・行・場）はいずれも小学1〜4年生
  配当の基礎的な漢字で、意味理解の壁というより「読みの流暢さ」の問題。
- ホームの地区選択・イベント誘導は、既存の「SHOW, DON'T EXPLAIN」設計原則
  どおりアイコン・位置・色で識別できるようになっており、文字が読めなくても
  タップ対象を選べる（例: 港のアイコンは⚓、丘の上は🏛、というように場所固有の
  絵文字・図形が主要な識別子で、テキストラベルは補助）。
- イベント導入画面（例: 救急外来）は「この人を、追いかけてみる」という
  単一の大きなボタンのみが操作対象で、選択肢が複数あって読めないと迷う、
  という構造にはなっていない。
- Q1ゲーム内の判断（例: 川の調査で地点を選ぶ）は総当たり・やり直しが可能な
  設計になっており、文章を読めなくても試行錯誤で進行できる（進行不能には
  ならない）。

以上より、**読みやすさの改善余地はある（Development Track backlogへ）が、
「読めないことで実際に先へ進めなくなる」致命的なBLOCKERには該当しない**
と判断する。

**判定: LANGUAGE_PUBLIC_BLOCKERS = 0**
（残存改善事項は `factory/state/backlog/language-furigana-backlog.md` へ）

## 3. Art Ownership — GPT_PUBLIC_BLOCKERS = 4（保持・変更なし）

`factory/state/art/gpt-asset-requests.json` を4件のPUBLIC BLOCKER
（harbor / hill / station / forest の各district illustration）として保持。
確認の過程で、このファイル自体に矛盾（`revision_note` は4件すべてを
public_blocker=trueとしたと書いていたが、実データは3件のみ・全てfalseの
ままだった。forest-district-illustrationのrequestエントリも欠落していた）
を発見し、今回修正した。`authoring-source-ledger.json` の
`forest_trees`・`station_rail_line` も D→E に整合させた。

**判定: GPT_ASSETS_REQUIRED = 4, PUBLIC_BLOCKING_GPT_ASSETS = 4**
（GPT側で画像制作後、visual QA再実行 → 差し替え）

## Stable Track 昇格条件（現時点のまとめ）

| 項目 | 状態 |
|---|---|
| CAREER_FACT_PUBLIC_BLOCKERS | 0 ✅ |
| LANGUAGE_PUBLIC_BLOCKERS | 0 ✅ |
| GPT_PUBLIC_BLOCKERS | 4（未解消、GPT納品待ち）⏳ |

GPT asset 4件が差し替わり次第、Public Smoke QA → Release Candidate →
Stable の順に進める（`release-lifecycle.md` 参照）。GPT納品を待つ間も、
Development Track側の作業は独立して継続できる（`two-track-model.md`）。
