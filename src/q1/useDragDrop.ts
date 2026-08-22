// Shared finger-friendly drag & drop for Q1 games.
// - Real drag: press an item, move, release over an element with
//   [data-drop="zoneId"].
// - Tap fallback: a short press (< 8px movement) fires onTap so games
//   can offer select-then-tap-zone as an alternative.
// Draggable elements should have the .drag-item class (touch-action:none)
// and games render a floating ghost from the returned drag state.
import { useRef, useState } from "react";

export interface DragState {
  id: string;
  x: number;
  y: number;
}

export function useDragDrop(
  onDrop: (itemId: string, zoneId: string) => void,
  onTap?: (itemId: string) => void,
) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragId = useRef<string | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragId.current = id;
    origin.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setDrag({ id, x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId.current) return;
    if (
      origin.current &&
      Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 8
    ) {
      moved.current = true;
    }
    setDrag({ id: dragId.current, x: e.clientX, y: e.clientY });
  };

  const finish = (e: React.PointerEvent) => {
    const id = dragId.current;
    dragId.current = null;
    setDrag(null);
    if (!id) return;
    if (moved.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = el?.closest("[data-drop]")?.getAttribute("data-drop");
      if (zone) onDrop(id, zone);
    } else {
      onTap?.(id);
    }
  };

  return {
    /** current drag for rendering a ghost (null = not dragging) */
    drag,
    /** spread on each draggable: onPointerDown={startDrag(id)} */
    startDrag,
    /** spread on the game container so moves/releases are captured */
    surfaceProps: {
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: () => {
        dragId.current = null;
        setDrag(null);
      },
    },
  };
}
