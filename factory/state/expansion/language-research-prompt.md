You are a children's-game localization/UX researcher. From your knowledge of real,
shipped games (no web access needed — use what you know of the actual products),
produce a structured study of how games handle Japanese text for children.

Target frame: JIBUN CHOICE — primary audience 小学校高学年〜中学生 (grades 5-9),
secondary: younger elementary kids who may touch it unaided. The goal is NOT to
dumb everything down: upper-elementary kids should read it unaided, middle
schoolers must not find it babyish, lower-elementary kids should manage with
pictures/motion/furigana support.

Study AT LEAST 12 titles across: Pokémon main series (note the えらべる漢字モード
history: HGSS onward kana/kanji toggle, SV auto-furigana policies as you know
them), Nintendo first-party (Animal Crossing, Splatoon, Mario RPG-likes, Zelda),
kids' RPGs (Dragon Quest, Yo-kai Watch, Puzzle & Dragons kids' modes), adventure
(Layton), elementary-school mobile games, and educational titles (Shinkansen
games / チャレンジ系 / Duolingo Japanese UI, プログラミングゼミ, Scratch Jr,
ビノバ, トドさんすう etc. — pick real ones you actually know).

For EACH title emit:
{"title","target_age","kanji_policy","furigana_policy","sentence_length",
"text_density","button_language","technical_terms","tutorial_style",
"visual_support","error_message_style","hint_style","age_range_strategy",
"useful_principles":["..."]}

For Pokémon-class titles specifically observe: how far kanji goes, how furigana
is attached (all kanji? per-screen? first occurrence?), whether domain-specific
proper nouns are kept for kids (わざ名/とくせい etc.), dialogue length, action
button brevity, and whether understanding ever depends on text alone.

Then output cross-title syntheses:
- "kanji_grade_consensus": what school-grade kanji level kids' games actually use
  (cite the titles), and how they handle above-grade kanji
- "furigana_patterns": the 2-3 real patterns seen (e.g. toggle mode / ruby on all
  kanji / ruby on hard words only / no kanji at all) with pros/cons for a
  grades-4-9 span
- "technical_term_patterns": how real games keep domain words alive for kids
  (keep word + short gloss + visual) vs replace them
- "sentence_rules": observed practical limits (chars per line, lines per box,
  boxes per beat)
- "button_rules": observed norms for action buttons
- "anti_babyish": what keeps text from feeling childish to a 14-year-old even
  when readable by a 9-year-old

Output ONE JSON object, no prose, no fences:
{"titles":[...12+ entries...],
 "kanji_grade_consensus":"...","furigana_patterns":[...],
 "technical_term_patterns":[...],"sentence_rules":{...},
 "button_rules":{...},"anti_babyish":[...],
 "recommendations_for_jibun_choice":["concrete, testable rules"]}
Be honest where your knowledge is uncertain: mark uncertain fields with "(推定)".
