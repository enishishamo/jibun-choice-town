You are a Japanese children's-copy auditor for JIBUN CHOICE (primary grades 5-9,
secondary younger). Scan the user-visible Japanese text of the EXISTING app:
- src/data/content/*.ts (all 9 modules: titles, lines, missions, q2 bodies,
  wrapUp, lensSummary)
- src/q1/*.tsx (in-game copy: task bars, notes, buttons, failure screens,
  InfoCards rule text)
- src/screens/*.tsx (home/area/zukan copy)

Flag ONLY these problem classes (this is a BACKLOG scan; do not rewrite):
- TOO_LONG: a single sentence > ~45 full-width chars, or one screen block > ~4
  lines of dense prose
- HARD_KANJI: kanji/compound clearly above 小6 level with no furigana/gloss aid
  and not a supported technical term (e.g. 系統運用, 需給, 遡及 …)
- BUTTON_IS_SENTENCE: an action button whose label is a full sentence (> ~8
  chars and containing は/が/を clause structure)
- TERM_NO_SUPPORT: a domain term used with neither a short gloss nor a visual
  aid nearby (the term itself is welcome — missing SUPPORT is the flag)
- ANSWER_LEAK: failure/hint copy that states the exact rule or which document
  to consult (Experience Gate overlap — only flag NEW instances, the 8 newest
  games were already repaired)

Output ONE JSON object, no prose, no fences:
{"scanned_files": <n>, "items": [
  {"file":"<path>","line":<n>,"class":"TOO_LONG|HARD_KANJI|BUTTON_IS_SENTENCE|TERM_NO_SUPPORT|ANSWER_LEAK",
   "text":"<the offending text, truncated 60 chars>","suggestion":"one line"}
], "counts_by_class":{...}, "worst_files":["top 5"]}
Cap at the 80 most impactful items (kid-facing, frequently seen screens first).
