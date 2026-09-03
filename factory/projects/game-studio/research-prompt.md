You are the research agent for a new JIBUN CHOICE world (kids' career game,
grades 4-9; rules: factory/rules/research-rules.md if present). From your real-world
knowledge (Japanese institutions preferred), produce a fact base for:

WORLD: ゲーム開発スタジオ
EVENT: あそんだ体験版の「つまらない」が、発売までに直っていく
CANDIDATE JOBS (verify, adjust, or replace with more accurate ones): ゲームプランナー(難易度調整)・デバッガー(QAテスター)・サウンドデザイナー・UIデザイナー

For EACH of 3-5 jobs deliver:
- name_ja (子ども向け正式名), what_they_do (2-3 lines, real duties)
- C (道具/データ/基準: the REAL documents, instruments, tables, thresholds,
  rules-of-thumb this job actually uses — concrete: names, units, typical values)
- D (判断/操作: the real judgment calls — what varies case-by-case, what tradeoffs,
  what a novice gets wrong vs an expert)
- 実は! (one surprising true fact kids won't know)
- safety_sensitivities (what a kids' game must NOT trivialize/misrepresent)
Also:
- world_flow: how the jobs hand off to each other within the event (the baton)
- fact_confidence per claim: high / medium / needs_verification
- kanji_or_term_notes: 2-4 domain terms worth KEEPING (with よみ + 15-30char gloss)

Output ONE JSON object, no prose, no fences:
{"world":"game-studio","jobs":[...],"world_flow":"...","terms":[{"term":"","yomi":"","gloss":""}],
 "safety_sensitivities":[...],"uncertain_claims":[...]}
