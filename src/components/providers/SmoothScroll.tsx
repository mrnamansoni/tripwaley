"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Scroll layer, split by input type:
 *  - Desktop (fine pointer): Lenis smooths the wheel and keeps ScrollTrigger in sync.
 *  - Touch (coarse pointer): NO Lenis. Instead ScrollTrigger.normalizeScroll() takes
 *    over touch input so every scrub (hero zoom, deck, gallery, curtain) tracks the
 *    finger smoothly and reliably — this is GSAP's recommended setup for scrub-heavy
 *    mobile sites and fixes the "gallery blank / curtain won't lift" activation bugs.
 *    ignoreMobileResize stops the address-bar show/hide from jolting the animations.
 * Disabled entirely for users who prefer reduced motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;

    /* ---------------- touch devices ---------------- */
    if (coarse) {
      ScrollTrigger.config({ ignoreMobileResize: true });
      // allowNestedScroll: elements with their own overflow-x/y (the ticket
      // rack's horizontal rail, any modal, etc.) keep handling their own touch
      // scroll instead of the page normalizer swallowing the gesture.
      ScrollTrigger.normalizeScroll({ allowNestedScroll: true });
      // recalc once layout + fonts + first images settle (fixes stale positions)
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      const t = setTimeout(() => ScrollTrigger.refresh(), 600);
      return () => {
        window.removeEventListener("load", onLoad);
        clearTimeout(t);
        ScrollTrigger.normalizeScroll(false);
      };
    }

    /* ---------------- desktop (wheel) ---------------- */
    const lenis = new Lenis({ lerp: 0.115, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onAnchorClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const target = document.querySelector(link.hash || "#");
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
