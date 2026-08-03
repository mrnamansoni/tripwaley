"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * ONE scroll engine for the whole site: Lenis.
 *  - Desktop: smooths the wheel (lerp).
 *  - Touch: NATIVE scrolling. Lenis deliberately does not intercept it.
 *  - Elements that scroll themselves (horizontal rails, dropdowns, the spin
 *    carousel) opt out with data-lenis-prevent so their gestures stay native.
 * Disabled entirely for users who prefer reduced motion.
 *
 * Why touch is native
 * ------------------
 * syncTouch made Lenis own finger-scrolling so every scrub tracked 1:1. It
 * looks lovely on a desktop emulator and is the main reason the site felt
 * laggy on real phones: native scrolling is handled on the compositor thread,
 * but syncTouch moves it onto the main thread, where it has to queue behind
 * ScrollTrigger updates, GSAP tweens and image decodes. Any one slow frame
 * becomes visible scroll stutter — the finger stops tracking the screen.
 * Native touch scroll never stalls, so we let the browser do it and accept
 * that scrubbed effects update per scroll event rather than per frame.
 * (This does NOT bring back ScrollTrigger.normalizeScroll, whose synthesized
 * tap-clicks caused the old ticket-rack "auto-click while swiping" bug.)
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    const lenis = new Lenis({
      lerp: 0.115,
      wheelMultiplier: 1,
      syncTouch: false, // see note above — phones scroll natively
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
