# 栄養教諭 Job Vertical Slice — canonical spec (2026-09-21)

This is the current specification of the 給食 WORLD / 栄養教諭 slice. It supersedes
the game model and the status-display sections of
[`experience-design-proposal.md`](experience-design-proposal.md) (§3, §3', §3'', §3''');
that file is kept as the record of how the design got here, not as the spec.

Design contract: the Human/Design-Owner directive of 2026-09-21 (FACTORY RESTORATION +
SCHOOL LUNCH / 栄養教諭 JOB VERTICAL SLICE). Everything below is either in that
contract or derived from a primary source cited here.

---

## 1. Definition of Done for one job

From this job onward, "one job is finished" means all of:

```
ENTRY → PLAY → EVENT → CLEAR → JOB REVEAL → KNOW THE JOB
      → CAREER PATH → 好きの種 → WORLD RETURN
```

A finished slice also contains **no developer-facing text anywhere a child can reach**
(`TEMP_IMPLEMENTATION_ONLY`, `DESIGN_NEEDED`, `DN-nn`). Code comments are fine;
rendered strings are not. `task-state.mjs can-deploy` now enforces this mechanically.

## 2. FACT → DESIGN TRANSLATION → GAME RULE

Sources: [`facts/research-2026-09-21.md`](facts/research-2026-09-21.md) (F1..F8,
primary sources read in the original) and the earlier
[`facts/research.md`](facts/research.md) (V-A1..A9).

| Fact | What it licenses | What it does NOT license |
|---|---|---|
| **F1** 学校給食摂取基準（10〜11歳）: エネルギー 780kcal / たんぱく質 13〜20%E / 脂質 20〜30%E / 食塩相当量 2g未満、かつ注記に「**弾力的に運用すること**」 | The child balances exactly **four** axes — エネルギー・たんぱく質・しぼう・塩分 — and each is a **band**, not a target number. Missing a band on either side is a miss. | Showing any number. Requiring an exact match. Calling the game's per-dish values nutrition data. |
| **F2** 完全給食 = 主食 + ミルク + おかず（施行規則第1条の定義） | Milk occupies a **fixed** slot and is never a choice; it is never the dish that fails to arrive. | Claiming a law requires milk every day. |
| **F6** 学校給食衛生管理基準 第3 1(1): 献立は「学校給食施設及び設備並びに人員等の能力に応じたもの」 | KNOW THE JOB says the job is deciding what the kitchen can actually make safely and on time, not only what is nutritious. | Putting kitchen-capacity rules into this first PLAY (the board stays at four axes). |
| **F7** 食材が届かない時、校長等が献立の一部削除等の措置を講じる | The EVENT removes one swappable dish after the child's first send, and the child designs the substitute. | Saying who signs it off. (The old 校長OK stamp was removed — the chain of approval is a 県マニュアル detail, not a national fact.) |
| **F3** 7初健食第2号(令和7年4月30日): 栄養教諭は単独で給食指導ができ、**週の大半（おおむね週4回以上）**給食を使った指導に従事することが想定される | KNOW THE JOB side B, and the "1日のなかで" beat 「教室で いっしょに食べながら教える」. | — |
| 学校給食衛生管理基準: 検食は**給食開始30分前まで** | The beat 「30分前に、先に食べてたしかめる」. | — |
| **F8** 時刻つきの1日の流れは国の公式文書に存在しない | A day shown as an **order of beats with no clock times**. | Inventing 「8:30 …」. |
| **F5** 教育職員免許法 第4条第2項 / 地教行法 第37条 / careerPaths.ts の訂正 | CAREER PATH: 学ぶ → 免許をとる → 学校ではたらく, plus 「栄養士の資格だけではなれない」 and 「あとから免許をとる人もいる」. | Credit counts (22/14 単位 etc.) — not sourced, so not shown. |

### The numbers are GAME COEFFICIENTS

No official source states "ごはん = N kcal" for a school-lunch portion: the standard
gives a **per-meal total** and the composition table gives **per 100g**, so any
per-dish figure embeds an unofficial assumption about the serving. `Dish.axis` in
`lunchMenuLogic.ts` is therefore a **normalized design model tuned for play**, and its
header says so. A child never sees a number, and neither does anything else.

## 3. The game

- 4 free slots + a fixed milk slot; 9 candidate dishes (expanding the pool to 15–20 is
  NEXT ITERATION, recorded in the backlog — the core loop is complete at nine).
- Every dish moves all four axes. Each axis has a good band, and the visible track is
  the band padded by 0.7× on each side, so the band is literally the middle of the track.
- **Tuned by exhaustive search over all C(9,4)=126 menus**, re-proved on every run by
  `npm run qa:v2-lunch`:

| Property | Value |
|---|---|
| menus that work | 16 of 126 (13%) |
| genuinely different families (≥2 dishes apart) | 7 |
| dishes that appear in every solution | 0 |
| axes that can be missed on both sides | 4 of 4 |
| near misses one swap from a working menu | 42 of 44 (the other 2 are exactly two swaps) |
| menus further off that a single swap improves | all |
| working menus left when any one dish fails to arrive | ≥ 6 |
| distinct dishes the EVENT can take | 5 |

Besides the four axes there is exactly one structural rule, and it comes from F2:
**a tray with no 主食 is not a school lunch**, however well the axes sit. It is not a
fifth gauge — the child meets it as the rice-and-bread pan asking to be used.

- **EVENT**: on the child's first send, the delivery trouble takes the dish on the tray
  that is carrying the most weight, among those whose loss still leaves at least
  `MIN_RECOVERIES` working menus. Milk is never taken. Different menus lose different dishes.
- **CLEAR**: only `send()` reaches the cleared phase, and `send()` is only ever called
  from the child's own gesture — an upward swipe on the tray (≥56px), or tapping the
  school, which is the accessible equivalent. Nothing clears on a timer.

## 4. The screen

Top to bottom: a band where the truck and the school appear / the tray (the hero) /
the counting rack / the serving counter.

- **The rack is an object, not a chart.** One block with four grooves carved in it; the
  middle of each groove is carved deeper. A clay bead rolls along the groove and can
  only come to rest in the hollow — the wood in front of the groove covers its lower
  edge, so the ball is visibly *inside* the channel rather than riding on a track. Out
  on the shallow part it sits high, fully visible, and keeps rocking. **The bead never
  changes colour** — a colour change would read as right/wrong, which the contract
  forbids. The hollow's position and width are computed at runtime from `TRACK`, so the
  picture cannot drift from the rule.
- **An unfinished tray is never judged.** While the tray is filling, the beads only
  move; nothing rocks, nothing is pointed at, nothing can read as a mistake. The
  verdict appears only when the tray is full — and it is read off the beads *where they
  are drawn*, not off the model, so the school can never appear before the beads have
  finished rolling.
- Placing a dish sends motes from it into the four grooves; the beads move **when the
  motes arrive**, never before, so the cause is visible.
- The counter is one serving pan per kind of dish, in serving order (主食→主菜→副菜→汁物).
  A dish on the tray leaves an empty place in its pan — no tick. A dish that did not
  arrive stays visible, grey, with a coral dot, and shakes when touched.
- The only sentence the game says before the job is revealed is the delivery trouble.

## 5. Where the Ver.1 assets went

See [`legacy-inventory.md`](legacy-inventory.md) for the full KEEP / UPGRADE / REPLACE /
DROP table.

## 6. Still open / next iteration

- Dish pool 9 → 15–20 (`factory/state/backlog/`).
- The other four spots of the 給食 WORLD (そだてる／はこぶ／つくる／とどける) have no PLAY yet;
  they react to a tap so nothing looks broken, and 「はこぶ」 shows the next trouble after CLEAR.
- The overall MAP / 「パカッ」 entry is the TOP lane's, not this one's.
