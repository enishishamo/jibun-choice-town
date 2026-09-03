// Region map data ("生きた町のアトラス" — factory/state/expansion/map-architecture-decision.md).
// ONE continuous region canvas: the existing town illustration stays as the
// center tile; new districts attach around it; foggy silhouettes tease what is
// not open yet. Worlds are assigned to districts here (not in content modules)
// so existing modules stay untouched and new worlds add one line.
//
// Coordinates: virtual region canvas, 1200 x 820 (px units at scale 1 —
// must match CANVAS_W/CANVAS_H in HomeScreen).

export interface District {
  id: string;
  name: string;
  /** short flavor line shown at district zoom (language-style: <=45 chars) */
  lead: string;
  /** center of the district on the region canvas */
  cx: number;
  cy: number;
  /** approx visual radius, used for zoom framing + slot layout */
  r: number;
  /** terrain class drives the SVG ground shapes / palette */
  terrain: "town" | "harbor" | "forest" | "river" | "station" | "hill" | "fog";
  landmarkEmoji: string;
  /** foggy districts render as silhouettes with a teaser, not yet enterable */
  foggy?: boolean;
  teaser?: string;
  /** fog only: the ghosted silhouette shown IN the mist (a visible hint) */
  silhouette?: string;
  /** fog only: rotating hints — every re-tap yields a NEW clue (§15) */
  teasers?: string[];
}

export const TOWN_TILE = {
  // where the existing town illustration sits on the region canvas
  x: 300,
  y: 210,
  w: 620,
  h: 413, // 1536x1024 aspect
};

export const DISTRICTS: District[] = [
  {
    id: "center",
    name: "まちの中心",
    lead: "いつもの町。今日も、あちこちで何かが起きている。",
    cx: TOWN_TILE.x + TOWN_TILE.w / 2,
    cy: TOWN_TILE.y + TOWN_TILE.h / 2,
    r: 300,
    terrain: "town",
    landmarkEmoji: "🏙",
  },
  {
    id: "minato",
    name: "港",
    lead: "海のそば。大きな船と、夜も動きつづける仕事の場所。",
    cx: 240,
    cy: 690,
    r: 150,
    terrain: "harbor",
    landmarkEmoji: "⚓",
  },
  {
    id: "mori-kawa",
    name: "森と川",
    lead: "川の上流と森。しずかに見えて、手入れがつづいている。",
    cx: 950,
    cy: 185,
    r: 160,
    terrain: "forest",
    landmarkEmoji: "🌲",
  },
  {
    id: "ekimae",
    name: "駅前",
    lead: "駅とオフィスのまわり。画面の向こうを作る人たちもいる。",
    cx: 930,
    cy: 600,
    r: 140,
    terrain: "station",
    landmarkEmoji: "🚉",
  },
  {
    id: "oka-bunka",
    name: "丘の上",
    lead: "図書館と、まちの記憶が集まる丘。",
    cx: 245,
    cy: 165,
    r: 130,
    terrain: "hill",
    landmarkEmoji: "🏛",
  },
  // ---- not yet open: silhouettes in the mist (§15 discovery signal) --------
  {
    id: "fog-sky",
    name: "？？？",
    lead: "",
    cx: 585,
    cy: 52,
    r: 100,
    terrain: "fog",
    landmarkEmoji: "🌫",
    foggy: true,
    silhouette: "📡",
    teaser: "山のむこうに、大きなアンテナのようなものが見える…",
    teasers: [
      "山のむこうに、大きなアンテナのようなものが見える…",
      "夜、そのアンテナがゆっくり動いたのを見た人がいる。",
      "まちの探検がすすめば、もやの晴れる日が来るらしい。",
    ],
  },
  {
    id: "fog-yuki",
    name: "？？？",
    lead: "",
    cx: 1090,
    cy: 420,
    r: 90,
    terrain: "fog",
    landmarkEmoji: "🌫",
    foggy: true,
    silhouette: "🛩",
    teaser: "遠くの空から、白いものが飛んでくる季節があるらしい…",
    teasers: [
      "遠くの空から、白いものが飛んでくる季節があるらしい…",
      "朝はやく、白い機体が音もなく降りていったって。",
      "まちの探検がすすめば、もやの晴れる日が来るらしい。",
    ],
  },
];

/** worldId (eventId) -> district. Existing 9 live on the center town tile. */
export const WORLD_DISTRICT: Record<string, string> = {
  "lunch-late": "center",
  "heat-wave": "center",
  "ice-price": "center",
  "town-festival": "center",
  "er-patient": "center",
  "school-trip": "center",
  "shop-opening": "ekimae", // 商店街の新店 — 駅前の商圏へ再配置（capacity §12）
  "waste-journey": "center",
  "zoo-baby": "mori-kawa", // 動物園 — 自然側の地区へ再配置（capacity §12）
  // Expansion v1 (new worlds register here as they ship)
  "night-port": "minato",
  "forest-care": "mori-kawa",
  "river-health": "mori-kawa",
  "game-studio": "ekimae",
  "library-detective": "oka-bunka",
};

/** ground fill per terrain class — HomeScreen renders district grounds
 * generically from the registry (no per-district hard-coding). */
export const TERRAIN_FILL: Record<District["terrain"], string | null> = {
  town: null, // the town tile artwork is its own ground
  harbor: "#e0d9bd",
  forest: "#bcd9a8",
  river: "#cfe3dc",
  station: "#e3ddc8",
  hill: "#d4e3b4",
  fog: null, // fog patches render separately
};

/** Content versions per world (eventId). Bump when a shipped world gains new
 * content; players who saw the older version get the UPDATED map state. */
export const WORLD_CONTENT_VERSION: Record<string, number> = {};
export const contentVersion = (eventId: string) => WORLD_CONTENT_VERSION[eventId] ?? 1;

/** Max worlds per district before a NEW district should be opened (§12/§30). */
export const DISTRICT_CAPACITY = 8;

/**
 * Generic slot layout (§30: no more hand-tuned absolute positions for new
 * worlds): deterministic, collision-free marker positions around a district
 * center. Slot i of n sits on a ring, offset so labels never stack.
 */
export function districtSlot(d: District, index: number, count: number): { x: number; y: number } {
  if (count <= 1) return { x: d.cx, y: d.cy + d.r * 0.15 };
  const ring = d.r * 0.55;
  // start at upper-left, sweep clockwise, keep the top center free for the name
  const start = (-3 * Math.PI) / 4;
  const step = (1.5 * Math.PI) / Math.max(count - 1, 1);
  const a = start + step * index;
  return { x: d.cx + Math.cos(a) * ring, y: d.cy + Math.sin(a) * ring * 0.8 };
}

export const getDistrict = (id: string) => DISTRICTS.find((d) => d.id === id);
