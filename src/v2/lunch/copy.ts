// DESIGN_NEEDED: every user-visible string of the 給食 vertical slice lives here
// and nowhere else. All values below are TEMP_IMPLEMENTATION_ONLY placeholders
// written by Claude Code so the flow can be exercised; the Design Owner (GPT)
// replaces them (or removes them — PLAY FIRST prefers no text) before any
// Human Approval / PUBLIC. Do not add strings elsewhere in src/v2/lunch.
export const COPY = {
  reveal: {
    lead: "いまやってたこと、じつは仕事。", // DESIGN_NEEDED (spec §11 example)
    line: "いろんな条件を考えながら、給食の献立をつくる。", // DESIGN_NEEDED (spec §11 example)
    jobName: "栄養教諭・学校栄養職員", // NEEDS_VALIDATION V-A6 (which name, or both)
    next: "つぎへ", // DESIGN_NEEDED
  },
  seed: {
    question: "なにが おもしろかった？", // DESIGN_NEEDED (spec §12 example)
    options: [
      { id: "combine", label: "くみあわせる" }, // DESIGN_NEEDED icon + label
      { id: "retry", label: "なおしてみる" },
      { id: "balance", label: "バランスを考える" },
    ],
    done: "ちずへ", // DESIGN_NEEDED
  },
  world: {
    spotLabel: {
      grow: "そだてる", // DESIGN_NEEDED — labels may be dropped entirely (WORLD_DESIGN §3)
      carry: "はこぶ",
      cook: "つくる",
      menu: "こんだてを考える",
      serve: "とどける",
    },
  },
} as const;
