/* The visitor's "reduce motion" setting, read once where an animation is set up.
 *
 * CSS animations are handled globally in globals.css. GSAP timelines are
 * JavaScript, so CSS cannot stop them: every scroll-driven component checks
 * this and shows its finished state instead of animating to it. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
