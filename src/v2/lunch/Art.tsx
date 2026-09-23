// One <img> wrapper for the whole slice. A picture that is missing or fails to
// load must never leave a broken-image icon in front of a child: it falls back
// to the clay shape the screen would have drawn anyway, and tells the caller so
// the layout can switch between "art" and "no art" geometry.
import { useEffect, useState, type ReactNode } from "react";

export default function Art({ src, className, fallback, onState }: {
  src?: string;
  className?: string;
  fallback?: ReactNode;
  onState?: (ok: boolean) => void;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); if (!src) onState?.(false); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!src || broken) return <>{fallback ?? null}</>;
  return (
    <img
      className={className}
      src={src}
      alt=""
      draggable={false}
      onLoad={() => onState?.(true)}
      onError={() => { setBroken(true); onState?.(false); }}
    />
  );
}
