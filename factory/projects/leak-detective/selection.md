# leak-detective — E2E実証用 NEW Q1 候補選定の記録

2026-09-08。Human指示: 「E2E実証用の候補職業選定はHuman Decisionではない。
Factoryが自律的に選定し、理由をevidenceに記録して、設計→独立review→Art→
Implementation→QA→Releaseまで自走せよ」。本ファイルはその選定evidence。

## 目的

Q1 Autonomous Game Factoryの **NEW Q1 → Art → Implementation → Release** の
接続を、実物1本で実証する。Factoryの頭脳・レビュー・再設計・Legacy修復・
Release機構は既に実証済み（forecast_and_balance実リリース、weather-forecaster
の5ラウンド審査〜ESCALATE）。未実証なのは新規プロフェッションの下流だけ。

## 受け皿（Product Identity Gate非該当の形）

**既存イベント「猛暑（heat-wave）」の6つ目のincident** として追加する。
- 新world・world unlock・Home/nav変更なし → Human Decision domainに触れない。
- 既存scene（`public/assets/heat/place-city.png` 等）とhotspot機構をそのまま使う。
- hotspotの空き位置: 既存5点 (22,20)(74,24)(18,58)(78,60)(48,82) に対し
  中央帯 (50,48) 付近が空いている。
- lensSummary に1行追加するだけで「同じ猛暑を別の情報で見る」構成に収まる。

## 候補比較（既存Factory基準）

判定軸は weather-forecaster が5ラウンドで落ち続けた根本原因から導く:
**E（結果）が、プロフェッショナル自身の権限内の行為だけで確定するか**
（別主体の裁量的判断が因果の途中に入らないか）。加えて principles.md /
q1-first-play-standard.md の Gate F（可視的な世界の結果）、coverage-gap.md
の空白領域、事実確認のしやすさ、Art必要量。

| 候補 | 因果が自領域で閉じるか | Gate F（可視結果） | coverage-gap | 事実確認 | 判定 |
|---|---|---|---|---|---|
| 水道の漏水調査員 | ○ 探知→掘削→修理まで水道局（直営/指定工事店）の業務。他組織の裁量判断なし | ○ 漏れが止まる・道路の水たまりが消える・水圧計/流量計が戻る | ○ 「水道/見えないインフラ」「見つける」「家に届くまで」が明示的な空白 | ○ 水道局・JWWAの公式資料が豊富 | **採用** |
| 冷蔵・冷凍倉庫の温度管理 | ○ 自領域 | △ 成功＝「何も起きない」でTEXT_ONLY化しやすい（既存blocked前例と同型） | △ 物流は港worldで一部カバー済み | ○ | 次点 |
| 鉄道の保線（レール温度） | ✕ 徐行規制の発令は運輸指令＝別主体の判断が因果に入る（weather-forecaster と同型のリスク） | ○ | ○ 鉄道運行は空白 | ○ | 不採用 |

## 採用: 水道の漏水調査員（給水・配水管の漏水調査／修繕）

- 子ども向けフック: 「雨も降ってないのに、道がぬれてる？」（違和感型・
  職業名を先に出さない、principles.md の Profession Name Hidden に沿う）。
- 想定A-E（研究で確定するまでは仮）: A=夜の住宅街の道路（音聴調査は騒音の少ない
  夜間に行う）、B=水が減っているのにどこから漏れているか分からない、
  C=音聴棒/漏水探知機・配管図・夜間最小流量・水圧、D=どこを聴き、どこを掘るか、
  E=漏れが止まり、水たまりが消え、流量が戻る。
- リスク: 音聴調査の実務手順・修理主体（直営か委託か）・用語の正確さは
  PROFESSION_RESEARCH で確認する（FACT_CHECK_REQUIRED を残さない）。

## 次工程

`q1-trigger.mjs fire NEW_Q1_REQUEST --game-id leak-detective` →
`jc-researcher` による fact_sheet → SCOPE/CORE → A-E → … → 独立review →
GAME_DESIGN_READY → game_spec → art_brief → `art-loop.mjs`（Codex OAuth
imagegen、有料API不可）→ 独立art review → implementation（`src/q1/LeakTraceGame.tsx`
+ `leakLogic.ts` + `gameplay-qa-leak.mjs`）→ QA → 独立impl review →
release-ready → main → CI → live確認。
