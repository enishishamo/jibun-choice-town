# GAME CRITIC — JIBUN CHOICE Ver.2 「はこぶ」 3案の独立審査

You are the GAME CRITIC for a children's career-exploration product (JIBUN CHOICE), reviewing three game concepts for the 給食 WORLD spot 「はこぶ」 (carrying / delivering school lunch). Target: Japanese upper-primary children (小4〜6), on phones, one session 1〜3 minutes.

You did not write these concepts. Do not assume the designer was right about anything, including the recommendation.

## THIS IS ROUND 3, AND THE GROUND HAS CHANGED

You rejected rounds 1 and 2 (FAIL 43, then FAIL 38, adopt NONE both times). Those verdicts are preserved at `game-critic-r1.result.json` and `game-critic-r2.result.json`. Read both.

**Your round-2 finding was acted on at the product level, not patched around.** You wrote that every blocker was of the form "the rule that makes this work is invented, not sourced", and recommended asking a Human whether to shelve the spot. That was done. The Human's decision (recorded at `factory/state/product-ideas/gate-log.md`, entry-2026-09-23-01) was:

1. **The spot is redefined.** 「はこぶ」= *給食を、必要な場所へ、安全に・間違えず受け渡していく社会の工程*. It need not be one delivery driver. **Multiple actors' verified work actions are in scope.**
2. **Gamifiable work is no longer limited to discretionary DECISION.** 確認 / 照合 / 異常への気づき / 正確な手順 / タイミング / 受け渡し / 記録 / 連絡 / 複数人の連携 count too, when sourced. Still forbidden: mindless work reproduction with no active operation by the child.

The artifact was therefore upgraded from a WORK **DECISION** MAP to a WORK **ACTION** MAP. The measured consequence: **`work_action_map_v1.json` has 21 rows, 19 pass the FACT GATE, and only ONE of those is a DECISION.** Eighteen gate-passing rows did not exist in the map you reviewed. Two rows still fail the gate and remain off-limits: rows[0] 配送計画の策定 and rows[9] 固定順どおりに走る.

So: **do not treat your two prior rejections as settling this.** Judge the new concepts on the new ground. Equally, do not go soft — if the same failure modes have reappeared in new clothes, say so.

**The concepts to judge are in `factory/projects/v2-lunch-carry/design/game_concepts_v3.json`** (A-wakete-okuridasu / B-tosu-ka-tomeru / C-saigo-no-hitori-made; a third designer, not either previous one; recommends **A** at confidence MEDIUM).

Specific things the designer claims — test each:
- A's three rows share one actor, one place, one time window, and two of them come from the same municipality's same 仕様書. Claimed as the direct answer to your r1 blocker "actor・trigger・decision が同じ通過行に揃っていない".
- **No unconfirmed fact enters any win condition.** The designer says they deliberately did NOT build on rows[11] (what is reported in a delay call — your GAP1/2/3), rows[13] (the record book's column names), or rows[17] (no sourced capacity cap, so always-separate cannot be beaten mechanically — they say this is why they refused to put a win condition there rather than inventing one, answering your r2 blocker on C). Verify that refusal is real and complete.
- The designer says RECORDING (the ピクロス two-axis-ledger grammar, the least crowded option available) was **shelved on purpose** because it could only live on rows[13] or rows[20] and both would have required inventing something. Check whether that was honest or convenient.
- C's actor is 給食当番の児童生徒＋教職員 — **the playing child is literally the actor the 告示 names**. Judge whether that is as strong as it sounds or whether it makes the loop thin.

Every concept now also declares `child_active_operations`, because a sourced work action is necessary but not sufficient: the Human Decision forbids reproducing mindless repetition. Judge whether the named operations are really what the loop asks of the child, or decoration.

## Read these, in the repo

- `factory/projects/v2-lunch-carry/design/game_concepts_v3.json` — **this is what you are judging.** (v1 and v2 are the rejected rounds, for comparison only.)
- `factory/projects/v2-lunch-carry/design/work_action_map_v1.json` — **the ground truth**: 21 work actions with action_type, actor, source, confidence, gameability, distortion_risk. The mechanical FACT GATE passed 19 and rejected rows[0] and rows[9].
- `factory/projects/v2-lunch-carry/design/work_research_v1.json` and `work_research_v2.json` — the sourced claims and, critically, everything still UNCONFIRMED. Nothing listed there may be a win condition.
- `factory/projects/v2-lunch-carry/design/game_reference_research_v2.json` — 15 references, each traced to the rows it serves, plus the known traps and the first-30-seconds rules.
- `factory/projects/v2-lunch-carry/design/legacy_inventory_v1.json` — what Ver.1 already shipped for this job and why most of it is being dropped.

## The binding rules you are judging against

- `docs/jibun-choice-v2/PRODUCT_PRINCIPLES.md` — **PLAY FIRST**: 触る → 何か起こる → 分かる → また触る. NEVER 説明を読む → 理解する → 操作する. The child does not read. 説明画面を先に置かない.
- `docs/jibun-choice-v2/GAME_DESIGN_RULES.md` §1 — especially rule 7 (判定に必要な情報を「開かないと見えない場所」に隠さない。情報は盤面そのものに置く) and rule 8 (0/1 の正解判定より改善型を優先。ただし正解が一つしかない実務を無理に改善型にしない).
- `factory/rules/principles.md` — A→B→C⇄D→E, and the BLOCKER list (説明→次へ→クリア / 明らかな正解だけの2択 / Cを使わなくても攻略できる / 操作結果と無関係に固定クリア / 職業名先出し / 適職診断 / 失敗時に即答を文章で教える / 全ゲームを同じinteractionへ統一 / 実務主体を推測で断定).
- `factory/rules/game-critic-v2.md` — the two binding axes CAREER_AUTHENTICITY and GAME_QUALITY (both must pass; either below 60 is FAIL), plus WORLD_FEEDBACK_QUALITY (結果を文章で説明せず世界の変化で見せる), TEXT_ONLY_CONSEQUENCE, HINT_LEAKAGE, GAMEPLAY_REFERENCE, and the **GAME-LIKENESS ADVERSARIAL QUESTION**: 職業・教育内容をすべて取り除いても、この interaction loop 自体にゲームとしての面白さ／上達余地が残るか？
- `factory/rules/q1-first-play-standard.md` — the RELEASE BLOCKER list (何も読まず全選択で突破できる / 総当たりだけで突破できる / Cを使わなくても突破できる / 選択肢やUI自体が答えを漏らす / 子どもの操作が結果に影響しない / 実際の仕事として重大な誤りがある / 失敗を成功として偽装する).
- `factory/taxonomy/exploit-patterns.json` — the known traps.

## What to attack

1. **Is each concept actually the job?** Check every concept against `work_action_map_v1.json`. Does it rest on rows that PASSED the fact gate? Does it quietly reintroduce route planning, which the gate rejected? Is the actor right — is the child doing what that named person really does, or has a different profession's work been handed to them?

2. **Is it a game?** Apply the adversarial question to each concept with the job stripped out. If 「はこぶ」 were replaced by a nonsense theme, would the loop still be worth a second play?

3. **Is the designer's recommendation correct?** The designer recommends **A-wakete-okuridasu** at confidence MEDIUM. Attack that choice. Are the degenerate strategies defeated by mechanical conditions drawn from sourced facts, or only asserted? Is there any answer oracle? Is any unconfirmed fact load-bearing? If B or C should be adopted instead, or none, say so.

4. **Are the three genuinely different?** Or are they one concept in three skins? Judge the main actions as written in the file under review.

5. **Exploits.** For the recommended concept especially, construct the cheapest way a child could beat it WITHOUT engaging with the real judgement. Name the exploit pattern if it is in `exploit-patterns.json`. Test every degenerate strategy the designer claims to have defeated, and check whether the defeat is a stated mechanical condition or only an assertion. Check for any on-screen element that hands the answer over rather than requiring the child to derive it.

6. **Differentiation.** Does the recommended concept collide with something already shipped? The repo has 63 games; crowded primaryMechanic territory is measurement_inspection (6), spatial_placement (6), resource_allocation (6), drag_drop_assign (5). Existing close relatives: `load_and_route` (the Ver.1 給食 transport game: 積み分け＋順路計画→検収), `crane_lift` (止めるのが勝ち手), `pit_crane` (温度バンド維持), `delay_recover` (連絡と順序), `yard_plan` (往路の配置が復路で採点), `tally_check` (書類と現物の突合).

7. **Should any of this be built at all?** `factory/rules/game-production-pipeline.md` §6 makes GAME_CONCEPT_REJECTED a first-class outcome. If the honest answer is that none of the three is good enough, say so — recommending rejection is a valid verdict here and costs the Factory nothing but time.

## What NOT to do

- Do not propose a fourth concept in detail. You may name a direction in one sentence if you are rejecting all three.
- Do not redesign the approved product decisions (PLAY FIRST, the 給食 WORLD map, the companion, the absence of scores or aptitude verdicts).
- Do not mark something down for being simple. `game-critic-v2.md` calibration: 対象は小学生。文章量・選択肢数・操作の複雑さの少なさは減点対象にしない。判断の不在だけを減点する。

OUTPUT FORMAT (mandatory): your ENTIRE final message must be ONE JSON object, no prose, no code fences, exactly this shape:
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,"career_authenticity":0-100,"game_quality":0-100,"blockers":[string],"high":[string],"medium":[string],"low":[string],"evidence":[string],"recommended_actions":[string],"adopt_concept_id":"A-wakete-okuridasu|B-tosu-ka-tomeru|C-saigo-no-hitori-made|NONE"}
Each finding string: "<concept_id or file:line> — <title> — <why it is wrong> — <fix>". blockers/high non-empty ⇒ verdict FAIL.
