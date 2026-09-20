// DESIGN_NEEDED: every user-visible string of the 給食 vertical slice (including
// aria-labels and dev markers) lives here and nowhere else. All values are
// TEMP_IMPLEMENTATION_ONLY placeholders written by Claude Code so the flow
// can be exercised; the Design Owner (GPT) replaces or removes them (PLAY
// FIRST prefers no text) before Human Approval / PUBLIC.
export const COPY = {
  dev: {
    temp: "TEMP_IMPLEMENTATION_ONLY",
    tag: "TEMP",
    commitTemp: "TEMP commit ↑",
    revealVisual: "DESIGN_NEEDED DN-08",
    seedIcon: "DESIGN_NEEDED DN-09",
  },
  play: {
    title: "こんだてを考える", // aria only
    slotEmpty: (n: number) => `${n}ばんめ（あき）`, // aria only
    milkSlot: "ぎゅうにゅう（いつも）", // aria only — V-A1 fixed slot
    unknownDish: "りょうり", // aria fallback; never expose an internal id
    dishUnavailable: (name: string) => `${name}（とどかなかった）`, // aria — V-A5
    // dish display names: content facts, appearance DESIGN_NEEDED (DN-02)
    dish: {
      rice: "ごはん",
      bread: "パン",
      salmon: "さけのしおやき",
      karaage: "とりのからあげ",
      hamburg: "ハンバーグ",
      croquette: "コロッケ",
      gomaae: "やさいのごまあえ",
      potato_salad: "ポテトサラダ",
      hijiki: "ひじきのにもの",
      miso_soup: "とうふのみそしる",
      corn_soup: "コーンスープ",
      kenchin: "けんちんじる",
      mikan: "みかん",
      milk: "ぎゅうにゅう",
    } as Record<string, string>,
  },
  reveal: {
    lead: "いまやってたこと、じつは仕事。", // DESIGN_NEEDED (spec §11 example)
    line: "いろんな条件を考えながら、給食の献立をつくる。", // DESIGN_NEEDED (spec §11 example)
    // V-A6: 栄養教諭 is the legal title; 学校栄養職員 also plan menus in many schools.
    jobName: "栄養教諭",
    jobNote: "学校栄養職員という呼び名の人もいる", // DESIGN_NEEDED whether to show
    next: "つぎへ", // DESIGN_NEEDED
  },
  seed: {
    question: "なにが おもしろかった？", // DESIGN_NEEDED (spec §12 example)
    options: [
      { id: "combine", label: "くみあわせる" },
      { id: "retry", label: "なおしてみる" },
      { id: "balance", label: "バランスを考える" },
    ],
    done: "ちずへ", // DESIGN_NEEDED
  },
  world: {
    spotLabel: {
      grow: "そだてる", // aria; visible labels off by default (WORLD_DESIGN §3)
      carry: "はこぶ",
      cook: "つくる",
      menu: "こんだてを考える",
      serve: "とどける",
    },
  },
} as const;
