# Two-Track Operating Model（2026-09-04 制定）

JIBUN CHOICEの運用を以下の2レーンに分離する。既存の
[`release-lifecycle.md`](release-lifecycle.md)（DEVELOPMENT → AI_VERIFIED →
RELEASE_CANDIDATE → STABLE）はそのまま生きており、この文書はその上に
「常に両方が並行して動く」という運用フレームを追加するもの。

```
┌─────────────────────────────┐    ┌──────────────────────────────┐
│ A. STABLE / PUBLIC           │    │ B. CONTINUOUS DEVELOPMENT     │
│    VALIDATION TRACK          │    │    TRACK                      │
│                               │    │                                │
│ 実際の子ども・保護者へ配布し、  │    │ world追加・改善、Game Quality、 │
│ 反応を見る。                   │    │ Language/Career Path/Art、     │
│                               │    │ UI/UX、Factory/Harness改善を    │
│ 昇格には人間の明示判断が必要。   │    │ 気長に継続。Stableを壊さない。   │
└─────────────────────────────┘    └──────────────────────────────┘
        ↑ human-triggered promotion only ↑
        Development → AI_VERIFIED → Release Candidate は自動化可能
        Release Candidate → STABLE は REAL USER VALIDATION 期間中、常に人間判断
```

## A. Stable / Public Validation Track

- 目的: 今日から実際の子ども・保護者へ試作を配布して反応を見る。
- 現在の状態: [`stable-public-blockers-2026-09-04.md`](stable-public-blockers-2026-09-04.md)
  参照。CAREER_FACT_PUBLIC_BLOCKERS=0、LANGUAGE_PUBLIC_BLOCKERS=0、
  GPT_PUBLIC_BLOCKERS=4（GPT納品待ち）。
- ふりがな全63コンポーネント網羅パスは**今回のStable判定には含めない**
  （`factory/state/backlog/language-furigana-backlog.md` へ）。
- GPT asset 4件差し替え後: Public Smoke QA → Release Candidate → Stable
  （`release-lifecycle.md` の既定フローそのまま）。
- Stable tag作成・remote pushは、これまでどおり人間の明示指示があるまで行わない。

## B. Continuous Development Track

- 目的: Stable版を壊さずに、JIBUN CHOICE自体の作り込みを継続する。
- **機構**: gitの通常のコミット運用がそのままこの分離を実現する——
  `feature/harness-bootstrap`（または以後のdevelopmentブランチ）上で
  コミットを積み重ねてよい。STABLE tagは特定の1コミットを指すポインタで
  あり、ブランチが先に進んでもtagは動かない。**Stableを壊す、とは
  「STABLE tagが指すコミットの中身が変わること」であり、tagを動かさない
  限りDevelopment側の変更がStableに影響することはない。**
- 対象領域（今回すぐに全部やる必要はない、気長に）:
  新world追加 / 既存world改善 / Game Quality改善 / Gameplay Experience改善 /
  World Map改善 / Language・furigana改善 / Career Path改善 /
  「こんな仕事！」情報拡張 / Art差し替え / UI/UX改善 / Factory・Harness改善。
- backlogの入口: [`../backlog/continuous-development-queue.md`](../backlog/continuous-development-queue.md)。
- 既存Factoryコマンドを再利用する（新設しない）: `/world-expansion`・
  `/new-world`・`/game-lab improve <gameType>`・各種QA Gate。
- Development → AI_VERIFIED → Release Candidate までは自動化可能
  （`release-lifecycle.md` の既定どおり）。**Release Candidate → STABLE は、
  REAL USER VALIDATION実施中は常に人間が判断する**（自動昇格しない）。

## REAL_USER_FEEDBACK ルーティング表（Development Trackの最上位入力）

`factory/state/feedback/` の既存スキーマ・triage flowに対し、以下の
具体例マッピングを正式なルーティングルールとして追加する。実際の子ども・
保護者の行動観察は、AIが考えた改善案よりも常に優先する。

| 観測されたこと | ルーティング先 | 記録方法 |
|---|---|---|
| 子どもが押せなかった（ボタンを見つけられない・タップしても反応が分からない） | navigation repair（Home/Map/画面遷移の修理） | `candidate_factory_gate: map_navigation`、severity HIGH以上ならbacklog.mdへ |
| 文字を読まなかった（読まずにスキップした・止まった） | Language UX repair | `candidate_factory_gate: language_qa`、`text_skipped: true`／`unreadable_words`に具体語を記録。severity HIGH以上なら `factory/state/backlog/language-furigana-backlog.md` にも転記 |
| C情報（しごとの資料・InfoCards）を見なかった | Game Design repair | `candidate_factory_gate: game_quality`、`confusion_points`に該当ゲームを記録。`factory/state/experience-backlog.json` の該当componentと突き合わせる |
| もう一回遊んだ（`spontaneous_replay: true`） | **successful mechanic** として記録 | [`../feedback/successful-patterns.md`](../feedback/successful-patterns.md) に追記。同じ仕組みを他worldへ展開する根拠にする |
| 知らない仕事に興味を持った（`next_place_clicked`が新しい職業／`child_quote`に興味の兆候） | **successful discovery pattern** として記録 | 同上 `successful-patterns.md`。どんな導線・提示の仕方が興味を引いたかを書く |

この表に当てはまらない観測は、既存の
[`../feedback/README.md`](../feedback/README.md) のtriage flow（severity判定
→ candidate_factory_gate割当）に従う。**AI_VERIFIED済みであることを理由に、
実観測されたHIGH/BLOCKER findingを却下・格下げしない**（既存ルールのまま）。

「AIが考えた改善」だけでなく「実際の子どもの行動から次の改善を決める」
Factoryへの移行が目的——backlogの優先順位付けにおいて、REAL_USER_FEEDBACKは
このqueue内のどの項目よりも常に先に着手する
（[`../backlog/continuous-development-queue.md`](../backlog/continuous-development-queue.md)
の「優先順位の付け方」節参照）。

## Model Routing（Continuous Development専用の確認事項）

既存のmodel routing方針を、Continuous Developmentの文脈で再確認する:
- **Sonnet** = orchestration / implementation（このトラックの主担当）
- **Codex** = research / independent review / audit / QA
- **Haiku / lightweight** = repetitive scan / metadata / formatting /
  bulk mechanical tasks
- **Fable** = architecture・難しいdesign・failed repairなど、本当に
  必要な場合のみ。使用した場合は理由を `factory/state/routing-log.jsonl`
  に記録する（Fableを大量消費しない）。
- Codex quota枯渇時、paid APIへのfallbackは行わない
  （利用不可の場合は`CODEX_UNAVAILABLE`として結果を返し、人間に判断を仰ぐ）。

## Art Ownership（Continuous Developmentでも維持）

- Claude担当: functional UI / CSS / SVG / animation / game-state visualization。
- GPT担当: 人物 / 建物 / 背景 / world / scene / illustration。
- 新worldでGPT illustrationが必要になった場合のフロー:
  `ASSET_REQUEST` を `../art/gpt-asset-requests.json` に追記 → queueに積む、
  までを自動で行う。**画像が無いことだけを理由にFactory全体を止めない**——
  該当worldはGPT画像待ちのまま、他の独立した作業（別worldの改善、
  Language QA、Career Path検証等）を並行して進めてよい。

## Cost / Safety（変更なし、再掲）

- 追加課金禁止・paid API禁止・API key禁止。
- remote pushは人間の明示指示があるまで禁止。
- Stable tag作成は、REAL USER VALIDATION期間中は常に人間判断
  （`STABLE_AUTO_PROMOTION = false`）。
