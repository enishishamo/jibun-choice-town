// When the slice moves from one screen to the next, focus has to move with it.
// Without this, an assistive-technology user is dropped back at the top of the
// document with nothing announced and no idea the game went on.
import { useEffect, useRef } from "react";

export function useScreenFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return ref;
}
