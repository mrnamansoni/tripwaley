"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * ONE scroll engine for the whole site: Lenis.
 *  - Desktop: smooths the wheel (lerp).
 *  - Touch: syncTouch — Lenis owns touch scrolling too, so the entire page
 *    shares a single, uniform momentum curve and every ScrollTrigger scrub
 *    (hero, gallery, drum, curtain) tracks the finger 1:1. This replaced
 *    ScrollTrigger.normalizeScroll, whose synthesized tap-clicks caused the
 *    ticket-rack "auto-click while swiping" bug.
 *  - Elements that scroll themselves (horizontal rails, dropdowns, the spin
 *    carousel) opt out with data-lenis-prevent so their gestures stay native.
 * Disabled entirely for users who prefer reduced motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });

    const lenis = new Lenis({
      lerp: 0.115,
      wheelMultiplier: 1,
      syncTouch: coarse, // unified momentum on phones; wheel-only on desktop
      syncTouchLerp: 0.08, // slightly heavier glide so flicks feel weighty, not twitchy
      touchMultiplier: 1.4,
    });
    lenis.on("scroll", ScrollTrigger.update);
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    // Lenis expects milliseconds; gsap ticker gives seconds.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // positions settle late on mobile (fonts/images/address bar) — recalc once
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);

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
      window.removeEventListener("load", onLoad);
      clearTimeout(t);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
