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
  /** 給食 WORLD MAP. Only the two places whose art exists are pictures; the rest
   * are the clay place marks in PlaceMark.tsx until their tiles are generated
   * (recorded as design_needed on the task, not silently referenced and missing). */
  map: { spot: { carry: `${BASE}truck.png`, serve: `${BASE}school.png` } },
};
