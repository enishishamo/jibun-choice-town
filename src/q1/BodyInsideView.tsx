// 医療編で使う「からだの中」の絵。
// リアルな胸部X線写真は使わない（JIBUN CHOICE共通のクレイ／イラスト世界に合わせる）。
// 中が見えるかどうかは inside で切りかえるだけ。判定に使う情報はすべてReact側にある。
interface Props {
  /** true でからだが透けて、中が見える */
  inside: boolean;
  /** 中が見えているとき、どちらの肺を光らせるか */
  focus?: "right" | "left" | null;
  /** 白いモヤ（＝何かたまっている）を出す側。none なら健康な肺。症例ごとに変えられる */
  hazeSide?: "right" | "left" | "none";
  onPickLung?: (side: "right" | "left") => void;
}

export default function BodyInsideView({ inside, focus = null, hazeSide = "right", onPickLung }: Props) {
  // Mirror the haze across the body's center line (x=120) for left-lung cases.
  const hx = (x: number) => (hazeSide === "left" ? 240 - x : x);
  return (
    <svg className={`body-view ${inside ? "inside" : ""}`} viewBox="0 0 240 250" role="img" aria-label="からだの絵">
      {/* ベッド */}
      <rect x="18" y="180" width="204" height="52" rx="22" fill="#cfe0ee" />
      <rect x="18" y="180" width="204" height="16" rx="8" fill="#e2eef7" />

      {/* からだ（クレイ調） */}
      <g className="body-shell">
        <ellipse cx="120" cy="236" rx="70" ry="8" fill="#000" opacity="0.06" />
        <circle cx="120" cy="42" r="27" fill="#f3cfae" stroke="#e0b48f" strokeWidth="3" />
        <path d="M104 62 h32 v14 h-32 z" fill="#f3cfae" />
        <rect x="60" y="70" width="120" height="128" rx="44" fill="#cfe3d6" stroke="#b3cfc0" strokeWidth="3" />
        <rect x="74" y="86" width="92" height="100" rx="34" fill="#dcecdf" opacity="0.85" />
      </g>

      {/* からだの中（透けたときだけ見える） */}
      <g className="body-inner">
        {/* ろっ骨 */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} opacity="0.5">
            <path d={`M118 ${104 + i * 20} q-26 4 -32 18`} stroke="#f6f1e4" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d={`M122 ${104 + i * 20} q26 4 32 18`} stroke="#f6f1e4" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
        ))}
        {/* 肺（左右） */}
        <path
          className={`lung ${focus === "right" ? "focus" : ""}`}
          d="M112 96 q-34 6 -40 40 q-6 34 8 52 q16 10 30 -6 q6 -42 2 -86 z"
          fill="#f0b8bd" stroke="#d99aa2" strokeWidth="3"
          onClick={() => onPickLung?.("right")}
        />
        <path
          className={`lung ${focus === "left" ? "focus" : ""}`}
          d="M128 96 q34 6 40 40 q6 34 -8 52 q-16 10 -30 -6 q-6 -42 -2 -86 z"
          fill="#f0b8bd" stroke="#d99aa2" strokeWidth="3"
          onClick={() => onPickLung?.("left")}
        />
        {/* 白いモヤ（＝何かたまっている）。hazeSide の肺に出る（none なら無し） */}
        <g className="haze" style={hazeSide === "none" ? { display: "none" } : undefined}>
          <circle cx={hx(88)} cy="150" r="19" fill="#fdfaf2" opacity="0.85" />
          <circle cx={hx(98)} cy="163" r="13" fill="#fdfaf2" opacity="0.75" />
          <circle cx={hx(80)} cy="164" r="11" fill="#fdfaf2" opacity="0.7" />
        </g>
        {/* 心臓 */}
        <path d="M120 150 q10 -14 20 -2 q8 10 -20 28 q-28 -18 -20 -28 q10 -12 20 2 z" fill="#e79a9a" stroke="#cf8383" strokeWidth="2.5" opacity="0.9" />
      </g>
    </svg>
  );
}
