// 医療編で使う「からだの中」の絵。
// リアルな胸部X線写真は使わない（JIBUN CHOICE共通のクレイ／イラスト世界に合わせる）。
// 中が見えるかどうかは inside で切りかえるだけ。判定に使う情報はすべてReact側にある。
// 患者は症例ごとに体格(build)と写り位置(dy)が変わり、撮影フレーム(frame)を重ねられる。
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  /** true でからだが透けて、中が見える */
  inside: boolean;
  /** 中が見えているとき、どちらの肺を光らせるか */
  focus?: "right" | "left" | null;
  /** 白いモヤ（＝何かたまっている）を出す側。none なら健康な肺。症例ごとに変えられる */
  hazeSide?: "right" | "left" | "none";
  /** 患者の体格スケール（xrayLogic.BUILD_SCALE の値） */
  scale?: number;
  /** 患者の上下オフセット（xrayLogic.LUNG_POS_DY の値） */
  dy?: number;
  /** 撮影フレーム（SVG座標）。null なら非表示 */
  frame?: Rect | null;
  /** true なら frame の範囲で切り抜いて「うつった画像」として見せる */
  clipToFrame?: boolean;
  onPickLung?: (side: "right" | "left") => void;
}

export default function BodyInsideView({
  inside,
  focus = null,
  hazeSide = "right",
  scale = 1,
  dy = 0,
  frame = null,
  clipToFrame = false,
  onPickLung,
}: Props) {
  // Mirror the haze across the body's center line (x=120) for left-lung cases.
  const hx = (x: number) => (hazeSide === "left" ? 240 - x : x);
  // Scale the patient about the torso center (120,143), then shift by dy.
  const patientTransform = `translate(${120 * (1 - scale)} ${143 * (1 - scale) + dy}) scale(${scale})`;
  const clipId = clipToFrame && frame ? `frame-clip-${frame.x}-${frame.y}-${frame.w}` : null;
  return (
    <svg className={`body-view ${inside ? "inside" : ""}`} viewBox="0 0 240 250" role="img" aria-label="からだの絵">
      {clipId && (
        <defs>
          <clipPath id={clipId}>
            <rect x={frame!.x} y={frame!.y} width={frame!.w} height={frame!.h} rx="6" />
          </clipPath>
        </defs>
      )}
      {clipId ? (
        // 撮影後の「うつった画像」: フレームの外は写っていない
        <rect x="0" y="0" width="240" height="250" fill="#1c2733" opacity="0.15" />
      ) : (
        <>
          {/* ベッド */}
          <rect x="18" y="180" width="204" height="52" rx="22" fill="#cfe0ee" />
          <rect x="18" y="180" width="204" height="16" rx="8" fill="#e2eef7" />
        </>
      )}

      <g clipPath={clipId ? `url(#${clipId})` : undefined}>
      <g transform={patientTransform}>
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
      </g>
      </g>

      {/* 撮影フレーム（患者スケールの外に重ねる） */}
      {frame && (
        <g pointerEvents="none">
          <rect
            x={frame.x} y={frame.y} width={frame.w} height={frame.h}
            fill="none" stroke="#4a90d9" strokeWidth="3" strokeDasharray="10 6" rx="6"
          />
          {[
            [frame.x, frame.y], [frame.x + frame.w, frame.y],
            [frame.x, frame.y + frame.h], [frame.x + frame.w, frame.y + frame.h],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill="#4a90d9" />
          ))}
        </g>
      )}
    </svg>
  );
}
