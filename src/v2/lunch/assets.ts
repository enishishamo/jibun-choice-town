// Asset map for the 給食 vertical slice. Files are produced by the Art Harness
// (factory/projects/v2-lunch-menu/art-requests → factory/harness/art/art-loop.mjs
// → asset-postprocess.py) into public/assets/v2/lunch/. A missing or broken
// file falls back to a plain clay shape at render time (see DishFace),
// so the PLAY never breaks while the batch is still running.
const BASE = `${import.meta.env.BASE_URL}assets/v2/lunch/`;

export const DISH_IDS = ["rice", "bread", "salmon", "karaage", "croquette", "gomaae", "potato_salad", "miso_soup", "corn_soup", "milk"] as const;

export const LUNCH_ASSETS = {
  tray: `${BASE}tray.png`,
  truck: `${BASE}truck.png`,
  school: `${BASE}school.png`,
  dish: Object.fromEntries(DISH_IDS.map((id) => [id, `${BASE}dishes/${id}.png`])) as Record<string, string>,
  /** 給食 WORLD MAP: the opened bento box is the ground, each place is a tile
   * standing on it. Same camera, light and contact shadow as truck/school, which
   * is why those two are reused unchanged as はこぶ/とどける. */
  map: {
    // NOT WIRED: map/bento.png. The generated box is a shallow dish in 35°
    // perspective whose empty cream interior is only ~57% x 32% of the frame —
    // the five spots do not fit in it at the current portrait map geometry, and
    // re-laying-out the map is a screen design, not an asset swap. See DN-MAPTILES.
    spot: {
      grow: `${BASE}map/grow.png`,
      carry: `${BASE}truck.png`,
      cook: `${BASE}map/cook.png`,
      menu: `${BASE}map/menu.png`,
      serve: `${BASE}school.png`,
    },
  },
  /** KNOW THE JOB — one picture per side of the job, keyed by COPY.know.sides id. */
  scene: {
    cook: `${BASE}scenes/kitchen.png`,
    teach: `${BASE}scenes/classroom.png`,
    talk: `${BASE}scenes/talk.png`,
  } as Record<string, string>,
  /** NOT WIRED: gauge-rack.png. The rack's hollow is the GOOD BAND, and the four
   * bands are genuinely different widths (≈21/29/38/19 % of their grooves), so a
   * painted hollow would be a second, unverifiable source of truth for the rule
   * the bead is obeying. The rack stays drawn from bandOnTrack(). See DN-RACK. */
};
