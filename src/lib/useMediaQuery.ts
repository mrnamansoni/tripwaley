"use client";

import { useEffect, useState } from "react";

/**
 * Shared media-query hook — one place for every touch/size/pointer check so
 * they can't drift apart. SSR-safe (starts false, resolves after mount) and
 * tracks live changes. Use `"(pointer: coarse)"` for "is a touch device",
 * `"(max-width: 639px)"` for "is a narrow screen", etc.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
