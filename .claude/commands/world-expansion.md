# /world-expansion — World Expansion Mode（§20）

増え続けるworldを、破綻なく・重複なく・自律的に増やすための標準工程。

```
CURRENT WORLD COVERAGE   factory DB(events/jobs/mechanics) から偏りを分析 → coverage-gap.md
        ↓
GAP ANALYSIS             「まだ子どもが出会えていない社会」を特定（カテゴリ均等化が目的ではない）
        ↓
NEW EVENT CANDIDATES     30+候補を PLACE/SOCIAL CONTEXT + EVENT + WHY_CHILD_MIGHT_CARE から生成
                         （職業起点は禁止）→ world-candidates.json
        ↓
DUPLICATE FILTER         既存world/既候補との overlap を評価（重複(高)は自動除外）
        ↓
RANKING                  Codex独立採点（child_proximity/surprise/job_diversity/mechanic_potential/
                         visual_potential/overlap/age_fit）＋制約付き選定
                         （場所・動詞の重複禁止、非トラブル型を含む、不可視職を2つ以上）
        ↓
/new-world               選定worldごとに v2 パイプライン（research→…→commit）を実行
                         ＋ Language QA Gate（language-style.md §9）を design/impl レビューに追加
        ↓
QA                       gameplay QA sims / browser QA / presentation QA / series style gate
        ↓
COMMIT                   world単位の meaningful commit（remote push禁止）
        ↓
NEXT                     WORLD_DISTRICT へ1行登録（districtSlotが自動配置）。
                         地区が DISTRICT_CAPACITY(8) に達したら新地区を追加し、靄teaserを更新
```

人間に候補を選ばせない（§24）。selection rationale は factory/state/expansion/ に保存。
