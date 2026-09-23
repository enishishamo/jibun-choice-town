# Ver.1 → Ver.2 legacy inventory — 栄養教諭 / 給食 (2026-09-21)

Why this file exists: Ver.2 rebuilds the entry and the PLAY, **not** the knowledge
behind them. Without a written inventory, the job understanding Ver.1 had accumulated
(what the job is, a day in it, how you become one) quietly disappears in the rewrite.
Every Ver.2 job slice from now on starts with one of these.

Ver.1 is frozen at `ver1-archive-2026-09-20` and none of it was modified.

## Decisions

| Ver.1 asset | What it is | Decision | Where it went / why |
|---|---|---|---|
| `src/data/content/schoolLunch.ts:122-167` — `nutrition` Q2 cards | 栄養教諭 job description, 1日の流れ, なり方, 実は | **UPGRADE** | Became KNOW THE JOB. The three sides (給食をつくる / 食べることを教える / 一人ひとりと考える) keep Ver.1's substance; the wording was re-grounded on primary sources (F3/F6) and the allergy line survived intact. |
| same file — `cook` の時刻つき `day` flow | 「朝｜…／午前｜…」 timeline shape | **KEEP as a template, DROP the clock times** | The Ver.2 day strip uses the beat order, with **no times**: F8 found no primary source for a 栄養教諭's clock. Inventing them would put fiction in a child's hands. |
| `src/data/careerPaths.ts:1765-1841` — `"nutrition"` | 3 routes, sourced to 文科省 中教審, with the correction that a 栄養士 qualification alone is not enough | **KEEP (content), REPLACE (presentation)** | CAREER PATH shows the three stepping stones and **both** corrections. The detailed institutional differences stay in the data file, not on a child's screen. |
| `src/data/content/medical.ts:231-233` — 管理栄養士「はたらく場所」 | The only Ver.1 "where do they work" card for a nutrition job | **DEFERRED** | Ver.1 has no such card for 栄養教諭, and a correct one needs 自校方式／共同調理場 sourcing. Recorded as next-iteration rather than guessed. |
| `src/q1/menuLogic.ts` — ORIGINAL/CANDIDATES/isAcceptableSide | Ver.1 lunch game rules (4 dishes, ○△× chips) | **DROP (frozen, not deleted)** | `GAME_DESIGN_RULES.md` §5 forbids reusing its provisional values as Ver.2 grounds. Ver.2 has its own fact-grounded model. |
| `src/q1/MenuGame.tsx:43-89` — the four InfoCards | 青菜は鉄・カルシウムのもと / 別産地は約1.5倍 / 11月は小松菜（地場）/ 残食記録 | **UPGRADE, deferred** | Real knowledge Ver.2 does not yet have. It must NOT go into PLAY (PLAY FIRST); it belongs in a later KNOW THE JOB layer. Recorded so it cannot be lost. |
| `src/q1/MenuGame.tsx` kid-facing copy | Ver.1 UI wording | **REPLACE** | Ver.2 copy is written against the new flow. Kept as a tone reference only. |
| `schoolLunch.ts:344` — `discoveryEcho` | 「さっき、トレーの料理を入れかえながら…」 | **UPGRADE** | Its shape ("what you just did IS the job") is exactly Ver.2's JOB REVEAL. Ver.2 says it shorter: 「いまやってたこと、じつは仕事。」 |
| `schoolLunch.ts:346-352` — 5 seeds | 条件を見ながら入れかえる／代わりを考える／… | **UPGRADE to 3** | Ver.2 keeps the two that match what the child actually did (組み合わせを考える／予定が変わって考え直す) and a third for the reason behind the balancing (食べる人のことを考える), plus 「とくにない」. The teaching side was NOT carried over as a seed: a seed must be an action the child performed in this PLAY (`qa-rules.md` item 7 of the Ver.1 checklist), and nothing in こんだて has the child teach anyone. |
| `public/assets/kyushoku/*.jpg`, `char-nutrition.png` | Ver.1 photos and character | **KEEP frozen, REPLACE for Ver.2** | Different visual language; Ver.1 still uses them. `classroom_lunch.jpg` stays useful as a content reference. |
| `public/assets/v2/lunch/**` (dishes, tray, truck, school) | Generated Ver.2 assets, QA-passed | **KEEP** | Reused unchanged. Nothing was regenerated without a reason. |
| `public/assets/v2/lunch/baskets/*.png` | The three 三色食品群 baskets | **RETIRED, not deleted** | The 三色食品群 mechanic was removed from PLAY by the design contract. The files and their provenance stay; nothing references them. |
| `factory/state/audits/q1-audit.json` — nutrition 84/78, risk low | Ver.1 独立監査 | **KEEP as the baseline** | Ver.2 must not regress below it. Its recorded weakness (「チップの◎△×表示だけでも総当たりで解ける」) is exactly what the four-axis model with 19 solutions and real trade-offs is meant to answer. |
| `factory/state/experience-backlog.json:255-268` — `HINT_LEAKAGE` | Ver.1 MenuGame told the child which document to open after a failure | **KEEP as a rule** | Ver.2 shows no hint text at all; the related dishes wobble, capped at two, and never exactly one. |
| `factory/state/feedback/real-user-feedback.jsonl` | The one real child test: `abandoned_confused` at the Home→Map entry | **KEEP as the standing warning** | "Solve it with affordance, not with a long how-to-play screen." Ver.2's PLAY has no tutorial: the first dish floats, and tapping it is the tutorial. |
| `factory/projects/v2-lunch-menu/facts/{research.md,facts.json}` | V-A1..A9 | **KEEP, corrected** | `research-2026-09-21.md` lists the errors found in it (学校教育法 37条13項→14項, 学校給食法7条に管理栄養士が追加, 栄養教諭数, 学校栄養職員も指導に努める, 出典衛生). |

## Not carried over, deliberately

- Q3「その仕事の人に会う」 — unimplemented in Ver.1 by decision (no fabricated individuals). Unchanged.
- Ver.1's ○△× chips and the 予算/調達/調理 axes — replaced by the four sourced axes.
