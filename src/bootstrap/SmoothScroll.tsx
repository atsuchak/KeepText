"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      prevent: (node) => node instanceof HTMLElement && node.matches("dialog, textarea"),
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
