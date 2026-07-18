"use client";

/* L06 — "Momentum" (hero opener / section break)
   Rows of monumental outlined type slide against the scroll and lean with
   its velocity — the page physically reacts to how hard you push it.
   Hover any word and it floods with brand red. */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const ROWS = [
  { words: ["EXPLORE", "·", "WANDER", "·", "ESCAPE", "·", "EXPLORE", "·", "WANDER"], dir: 1 },
  { words: ["MOUNTAINS", "·", "OCEANS", "·", "DESERTS", "·", "MOUNTAINS", "·", "OCEANS"], dir: -1 },
  { words: ["LEAVE", "·", "NOW", "·", "LEAVE", "·", "NOW", "·", "LEAVE", "·", "NOW"], dir: 1 },
];

export default function L06KineticWall() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-l06-row]");
      // rows drift opposite ways as the section passes through the viewport
      rows.forEach((row, i) => {
        gsap.fromTo(
          row,
          { xPercent: ROWS[i].dir * 8 },
          { xPercent: ROWS[i].dir * -8, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 } }
        );
      });
      // velocity lean
      const lean = gsap.quickTo(rows, "skewX", { duration: 0.5, ease: "power2.out" });
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => lean(gsap.utils.clamp(-9, 9, self.getVelocity() / 260)),
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream py-[16vh]">
      <p className="mb-10 text-center text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">
        scroll hard · the type leans into it
      </p>
      <div className="flex flex-col gap-2 sm:gap-1">
        {ROWS.map((row, i) => (
          <div key={i} data-l06-row className="flex justify-center gap-[0.5em] whitespace-nowrap will-change-transform">
            {row.words.map((w, j) => (
              <span
                key={j}
                className={`select-none font-display text-[clamp(3.2rem,9vw,8rem)] font-extrabold leading-[0.98] tracking-tight transition-colors duration-300 ${
                  w === "·"
                    ? "text-gold"
                    : "cursor-default text-transparent hover:text-brand"
                }`}
                style={w === "·" ? undefined : { WebkitTextStroke: "2px #16130f" }}
              >
                {w}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-ink px-8 py-4 font-bold text-cream transition-colors hover:bg-brand">
          Stop scrolling. Start packing →
        </a>
      </div>
    </section>
  );
}
