# Q1 GAME QUALITY STANDARD V1 — FIRST-PLAY EXPERIENCE

**Human Decision, 2026-09-07.** This is the canonical Game Quality
standard for Q1 evaluation (Game Critic / Independent Review), taking
priority over the MASTERY/REPLAY-related items in
`factory/rules/game-critic-v2.md` wherever they conflict (see the
amendment notice added to that file). It does not replace
`game-critic-v2.md` — the C_required calibration, the BLOCKER list in
`factory/rules/principles.md`, and the WORLD_FEEDBACK_QUALITY /
HINT_LEAKAGE / VISUAL_GAMEPLAY_LEGIBILITY axes all remain in force.

## 1. Q1の目的

Q1の目的は「同じゲームを何度も遊び、熟達すること」ではない。初めて
その社会・仕事に出会った子どもが、以下のFIRST-PLAY EXPERIENCEを成立
させることを最優先とする:

```
出来事に出会う → 気になる → 自分で触る
→ 仕事固有の情報・道具・専門性Cを使う → 判断・操作Dをする
→ 結果が変わる → 必要なら一度考え直す → 社会への結果を見る
→ 最後に「これも仕事なんだ」と知る
```

## 2. PRIMARY QUALITY GATE

Game Critic / Independent Reviewは、Q1について以下を最優先で評価する。

| # | 軸 | 問い |
|---|---|---|
| A | CURIOSITY | 初見で「何これ？」「やってみたい」「次どうなる？」が生まれる余地があるか |
| B | ACTIVE PLAY | 説明を読む→次へ、だけではなく、子ども自身の操作・選択・試行があるか |
| C | C NECESSITY | 仕事固有の情報・道具・見方・専門性(C)を見る／使うことに、ゲーム攻略上の意味があるか |
| D | D AUTHENTICITY | Dが単なる一般常識クイズではなく、その仕事らしい判断・操作になっているか |
| E | NO ANSWER LEAK | 初回プレイ時に、選択肢名・色・位置・説明文・クルーの有無・UI hierarchy等から正解が露骨に漏れていないか |
| F | CONSEQUENCE | 子どもの操作によって、何らかの結果・反応・状態変化が起きるか |
| G | THINK AGAIN | 失敗時に即答を表示するだけではなく、少なくとも一度「違った。じゃあどうしよう？」と考え直せる余地があるか |
| H | HONEST OUTCOME | 失敗したのに成功と同じ状態として処理しない。不正解時は違う結果／partial outcome／weaker outcome／再考など、体験として正直な結果にする |
| I | JOB REVEAL | 最後に「さっき自分がやっていたこと」と「実際の仕事」がつながるか |

## 3. RELEASE BLOCKER

以下はFIRST-PLAY EXPERIENCEを壊すため、HIGH / BLOCKERになり得る:

- 何も読まず全選択で突破できる
- 総当たりだけで容易に突破できる
- 一定回数submitするだけで成功扱いになる
- Cを使わなくても突破できる
- 選択肢/UI自体が答えを漏らす
- 子どもの操作が結果に影響しない
- 実際の仕事として重大な誤りがある
- 失敗を成功として偽装する

## 4. REPLAYABILITY / MASTERY — PLUS QUALITY（BLOCKERにしない）

Replayability / Masteryは高ければ望ましいPLUS QUALITYとする
（Game Researcherは引き続き改善方法を研究してよい）。ただし
**「固定単一症例なので、2周目には答えを覚えている」という理由だけで
HIGH / BLOCKER / Release Failにしない**。すべてのQ1を繰り返し熟達型
ゲームにする必要はない。

重要な区別: 「2周目の記憶」で初めて成立する抜け道（PLUS QUALITY領域、
波及しない）と、「1周目でも成立する内容非依存の近道」（§3のBLOCKER、
例: 固定された選択肢の並び順だけで正誤を推測できる、選択肢名が症例を
読まなくても正誤を教える）は別物——後者は初回プレイの`E. NO ANSWER
LEAK`/`C NECESSITY`違反であり、依然としてBLOCKER対象。

## 5. FUN

「教育的に成立している」だけではPASSにしない。Game Criticは必ず:
触りたくなるか／次を見たくなるか／操作した反応が気持ちいいか／考える
こと自体が遊びになっているか／説明問題を解かされている感じになって
いないか、も評価する。ただしFUNを理由に仕事の事実を歪めない。

## 6. SCOREについて

現時点でHumanは恣意的な数値thresholdを新設しない。GQ score等は比較・
改善優先順位には利用してよいが、単一総合点だけでReleaseを決めない。
上記PRIMARY QUALITY GATEとBLOCKER条件を優先する
（`game-critic-v2.md`の二軸60点floorとの関係は同ファイルの追記を参照）。

## 適用実績

- 2026-09-07: `q1-improve-lab-check` / `q1-improve-clue-board`
  （`factory/state/blocked-queue.md`でHUMAN_DECISION_REQUIRED停止中）を、
  本Standardに基づくNEW ITERATIONとして再開。詳細は各
  `factory/projects/q1-improve-*/redesign-proposals.md`。
