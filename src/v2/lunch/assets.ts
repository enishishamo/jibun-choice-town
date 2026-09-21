// Asset map for the 給食 vertical slice. Files are produced by the Art Harness
// (factory/projects/v2-lunch-menu/art-requests → factory/harness/art/art-loop.mjs
// → asset-postprocess.py) into public/assets/v2/lunch/. A missing or broken
// file falls back to the TEMP placeholder shape at render time (see DishFace),
// so the PLAY never breaks while the batch is still running.
const BASE = `${import.meta.env.BASE_URL}assets/v2/lunch/`;

export const DISH_IDS = ["rice", "bread", "salmon", "karaage", "croquette", "gomaae", "potato_salad", "miso_soup", "corn_soup", "milk"] as const;

export const LUNCH_ASSETS = {
  tray: `${BASE}tray.png`,
  truck: `${BASE}truck.png`,
  school: `${BASE}school.png`,
  dish: Object.fromEntries(DISH_IDS.map((id) => [id, `${BASE}dishes/${id}.png`])) as Record<string, string>,
  // the three baskets on the table that the dishes fill (status layer, GPT Visual Review 2026-09-21)
  basket: { red: `${BASE}baskets/red.png`, yellow: `${BASE}baskets/yellow.png`, green: `${BASE}baskets/green.png` },
};
