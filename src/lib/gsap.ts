"use client";

/**
 * Central GSAP setup — import gsap/ScrollTrigger from here everywhere so the
 * plugin is registered exactly once and tree-shaking stays predictable.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // dev/QA convenience: inspect triggers from the console
  (window as Window & { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

export { gsap, ScrollTrigger };
