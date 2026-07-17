"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger and Lenis
 * share one rAF loop (avoids double-driving scroll updates).
 * Disabled entirely for users who prefer reduced motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // On touch devices, native momentum scrolling is smoother and offloaded to
    // the compositor. Running Lenis on top of it just adds a per-frame rAF and
    // fights the browser — so skip it on mobile. ScrollTrigger still drives all
    // the scroll animations off the native scroll position.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({ lerp: 0.115, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    // handy for QA + lets anchor clicks route through Lenis
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    // Lenis expects milliseconds; gsap ticker gives seconds.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Glide to in-page anchors via Lenis (CSS smooth-behavior would fight it).
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
