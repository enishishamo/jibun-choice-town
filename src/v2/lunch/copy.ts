// Every user-visible string of the 給食 WORLD / 栄養教諭 vertical slice lives
// here and nowhere else (DESIGN_OWNERSHIP.md §2).
//
// PLAY has almost none by design: before the job is revealed the only sentence
// the game ever shows is the one that announces the delivery trouble. Everything
// else the child needs is carried by the objects and their motion.
//
// The job knowledge below is sourced, not invented
// (factory/projects/v2-lunch-menu/facts/research-2026-09-21.md, F1..F8):
//   - 給食をつくる: 学校給食衛生管理基準 第3 1(1)「献立作成」— a menu must fit
//     the kitchen's equipment and staff as well as the nutrition targets.
//   - 食べることを教える: 7初健食第2号 (令和7年4月30日) — a 栄養教諭 may run
//     給食指導 alone, and is expected to teach with the lunch roughly 4+ days a week.
//   - 一人ひとりと考える: 個別的な相談指導 (偏食・肥満・食物アレルギー等).
//   - 1日のなかで: only the beats that national documents actually establish —
//     検収 → 調理の工程確認 → 給食開始30分前の検食 → 給食の時間の指導.
//     NO clock times: no primary source states them (F8), so none are shown.
//   - なり方: 教育職員免許法 第4条第2項 / 地教行法 第37条, and the correction
//     that a 栄養士 qualification alone is not enough (src/data/careerPaths.ts).
//     Credit counts are deliberately absent — they are not sourced (FC in F5).
export const COPY = {
  play: {
    title: "こんだてを考える", // aria
    rack: "こんだての ようす", // aria
    send: "がっこうへ おくる", // aria of the school
    milk: "ぎゅうにゅう", // aria — V-A1 fixed slot
    emptySlot: "あいている ところ", // aria
    axis: { energy: "エネルギー", protein: "たんぱく質", fat: "しぼう", salt: "塩分" } as Record<string, string>,
    // aria only — on screen this is the bead's position, never a word
    band: { low: "すこし たりない", good: "ちょうどいい", high: "すこし おおい", idle: "まだ" } as Record<string, string>,
    notDelivered: (name: string) => `${name}が とどかない！`,
    dishGone: (name: string) => `${name}（とどかなかった）`, // aria
    dish: {
      rice: "ごはん",
      bread: "パン",
      salmon: "さけのしおやき",
      karaage: "とりのからあげ",
      croquette: "コロッケ",
      gomaae: "やさいのごまあえ",
      potato_salad: "ポテトサラダ",
      miso_soup: "とうふのみそしる",
      corn_soup: "コーンスープ",
      milk: "ぎゅうにゅう",
      unknown: "りょうり",
    } as Record<string, string>,
  },

  reveal: {
    lead: "いまやってたこと、じつは仕事。",
    job: "栄養教諭",
    note: "「学校栄養職員」とよばれる人もいる。",
    line: "いろんな条件を考えながら、\nみんなの給食をつくっている。",
    next: "この仕事を のぞいてみる",
  },

  know: {
    title: "栄養教諭",
    hint: "さわってみる", // the only instruction in the slice, 4 characters
    sides: [
      {
        id: "cook",
        label: "給食をつくる",
        line: "何百人分の献立を考える。栄養がたりるかだけでなく、その給食室の道具と人で、時間までに安全に作りきれるかまで考えて決める。",
      },
      {
        id: "teach",
        label: "食べることを教える",
        line: "教室へ行って、食べもののことを教える。給食の時間も、授業の時間も。週の大半を、給食を使った授業にあてる。",
      },
      {
        id: "talk",
        label: "一人ひとりと考える",
        line: "アレルギーのある子や、食べるのが苦手な子と、その子に合う食べ方をいっしょに考える。おうちの人と話すこともある。",
      },
    ],
    dayTitle: "1日のなかで",
    day: ["とどいた食材をたしかめる", "調理を見にいく", "30分前に、先に食べてたしかめる", "教室で いっしょに食べながら教える"],
    career: "どうやって なる？",
    next: "つぎへ",
  },

  career: {
    title: "どうやって なる？",
    steps: [
      { id: "learn", label: "学ぶ", line: "大学や短大で、栄養のことと、先生になるための勉強をする。" },
      { id: "license", label: "免許をとる", line: "勉強がおわったら、教育委員会に申請して、栄養教諭の免許状をもらう。" },
      { id: "work", label: "学校ではたらく", line: "都道府県の採用の試験にうかると、学校で働ける。" },
    ],
    notes: [
      "栄養士の資格だけでは栄養教諭にはなれない。先生の免許（栄養教諭免許状）がいる。",
      "先に給食の栄養の仕事をしてから、あとで先生の免許をとる人もいる。",
    ],
    back: "もどる",
  },

  seed: {
    question: "どこが おもしろかった？",
    options: [
      { id: "combine", label: "組み合わせを考える" },
      { id: "rebuild", label: "予定が変わって考え直す" },
      { id: "teach", label: "食べることを人に伝える" },
    ],
    done: "ちずへ",
  },

  world: {
    title: "給食の せかい", // aria
    spot: {
      grow: "そだてる",
      carry: "はこぶ",
      cook: "つくる",
      menu: "こんだてを考える",
      serve: "とどける",
    } as Record<string, string>,
    state: { trouble: "いま こまっている", solved: "かたづいた", muted: "まだ" } as Record<string, string>,
  },
} as const;
