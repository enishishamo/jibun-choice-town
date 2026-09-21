// The places of the 給食 world, drawn as small clay objects.
//
// These are UI-level marks, not illustrations pretending to be scene art: a few
// rounded shapes in palette-v1 tokens, one object per place, on the same little
// round clay base as everything else in this world. They are what the screen
// shows when no generated tile is present for a place, and they are finished
// work in their own right — a child never sees an unfinished box.
// When a generated tile lands it replaces the mark 1:1 through `assets`.
export type PlaceId = "grow" | "cook" | "menu" | "carry" | "serve" | "teach" | "talk";

const C = {
  cream: "var(--v2-warm-cream)",
  beige: "var(--v2-warm-beige)",
  green: "var(--v2-fresh-green)",
  deep: "var(--v2-deep-green)",
  sky: "var(--v2-sky-blue)",
  soft: "var(--v2-soft-sky)",
  coral: "var(--v2-coral)",
  honey: "var(--v2-honey-yellow)",
};

/** the round clay base every place tile stands on */
function Base() {
  return (
    <>
      <ellipse cx="50" cy="78" rx="34" ry="9" fill={C.deep} opacity="0.12" />
      <ellipse cx="50" cy="74" rx="33" ry="11" fill={C.beige} />
      <ellipse cx="50" cy="71" rx="33" ry="11" fill={C.cream} />
    </>
  );
}

const SHAPES: Record<PlaceId, React.ReactNode> = {
  // a small vegetable bed: soil, two rows of leaves
  grow: (
    <>
      <ellipse cx="50" cy="66" rx="27" ry="9" fill={C.beige} />
      <path d="M32 66q4-12 11-12t11 12z" fill={C.green} />
      <path d="M50 64q5-14 13-13t8 13z" fill={C.deep} />
      <circle cx="43" cy="55" r="4" fill={C.coral} />
      <circle cx="61" cy="53" r="3.5" fill={C.honey} />
    </>
  ),
  // the kitchen: one big pot with a paddle across it
  cook: (
    <>
      <rect x="30" y="52" width="40" height="20" rx="8" fill={C.soft} />
      <rect x="27" y="47" width="46" height="9" rx="4.5" fill={C.sky} />
      <rect x="40" y="36" width="34" height="5" rx="2.5" fill={C.beige} transform="rotate(-18 57 38)" />
      <path d="M42 34q3-7 6 0" stroke={C.cream} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M54 31q3-7 6 0" stroke={C.cream} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  // the planning desk: a ruled sheet and a pencil
  menu: (
    <>
      <rect x="30" y="38" width="36" height="32" rx="4" fill={C.cream} />
      <rect x="35" y="45" width="26" height="3" rx="1.5" fill={C.beige} />
      <rect x="35" y="52" width="26" height="3" rx="1.5" fill={C.beige} />
      <rect x="35" y="59" width="17" height="3" rx="1.5" fill={C.beige} />
      <rect x="60" y="34" width="6" height="30" rx="3" fill={C.honey} transform="rotate(20 63 49)" />
      <path d="M69 63l3 6-6-1z" fill={C.deep} />
    </>
  ),
  // carry / serve fall back to the same language, in case their art is missing
  carry: (
    <>
      <rect x="28" y="48" width="30" height="20" rx="5" fill={C.cream} />
      <path d="M58 55h9l6 8v5H58z" fill={C.sky} />
      <circle cx="40" cy="70" r="5" fill={C.deep} />
      <circle cx="65" cy="70" r="5" fill={C.deep} />
    </>
  ),
  serve: (
    <>
      <rect x="30" y="44" width="40" height="26" rx="4" fill={C.cream} />
      <path d="M28 44l22-14 22 14z" fill={C.coral} />
      <rect x="45" y="56" width="10" height="14" rx="2" fill={C.sky} />
      <rect x="35" y="50" width="7" height="7" rx="1.5" fill={C.soft} />
      <rect x="58" y="50" width="7" height="7" rx="1.5" fill={C.soft} />
    </>
  ),
  // the classroom: a blackboard and a tray on a desk
  teach: (
    <>
      <rect x="24" y="30" width="40" height="26" rx="3" fill={C.deep} />
      <rect x="28" y="34" width="32" height="18" rx="2" fill={C.green} opacity="0.55" />
      <rect x="56" y="58" width="26" height="5" rx="2.5" fill={C.beige} />
      <rect x="60" y="52" width="18" height="7" rx="2" fill={C.cream} />
      <circle cx="66" cy="55" r="2" fill={C.coral} />
      <circle cx="73" cy="55" r="2" fill={C.honey} />
    </>
  ),
  // the quiet corner: a small round table and two chairs
  talk: (
    <>
      <ellipse cx="50" cy="52" rx="20" ry="7" fill={C.cream} />
      <rect x="47" y="52" width="6" height="16" rx="3" fill={C.beige} />
      <rect x="20" y="44" width="9" height="20" rx="4" fill={C.honey} />
      <rect x="71" y="44" width="9" height="20" rx="4" fill={C.honey} />
      <rect x="42" y="46" width="16" height="5" rx="2" fill={C.beige} />
    </>
  ),
};

export default function PlaceMark({ id, className }: { id: PlaceId; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 88" aria-hidden="true" focusable="false">
      <Base />
      {SHAPES[id]}
    </svg>
  );
}
