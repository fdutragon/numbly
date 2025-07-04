"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      (media as any).addListener(listener);
    }

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      } else {
        // Fallback for older browsers
        (media as any).removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

// Breakpoint hooks
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () => useMediaQuery("(max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
