"use client";

/* MOMENTUM — section break (their L06 pick, condensed).
   Two lanes of monumental type sliding against the scroll, leaning with
   its velocity. A palate cleanser between data-heavy sections. */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const ROWS = [
  { words: ["LEAVE", "·", "THE", "·", "GROUP CHAT", "·", "LEAVE", "·", "THE", "·", "GROUP CHAT"], dir: 1 },
  { words: ["JOIN", "·", "THE", "·", "GROUP TRIP", "·", "JOIN", "·", "THE", "·", "GROUP TRIP"], dir: -1 },
];

export default function MomentumBreak() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-mb-row]");
      rows.forEach((row, i) => {
        gsap.fromTo(row, { xPercent: ROWS[i].dir * 10 }, {
          xPercent: ROWS[i].dir * -10, ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });
      const lean = gsap.quickTo(rows, "skewX", { duration: 0.5, ease: "power2.out" });
      ScrollTrigger.create({
        trigger: ref.current, start: "top bottom", end: "bottom top",
        onUpdate: (self) => lean(gsap.utils.clamp(-8, 8, self.getVelocity() / 280)),
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="overflow-hidden bg-cream py-[11vh]" aria-hidden="true">
      <div className="flex flex-col gap-1">
        {ROWS.map((row, i) => (
          <div key={i} data-mb-row className="flex justify-center gap-[0.45em] whitespace-nowrap will-change-transform">
            {row.words.map((w, j) => (
              <span
                key={j}
                className={`select-none font-display text-[clamp(2.8rem,8vw,7rem)] font-extrabold leading-[1.02] tracking-tight ${
                  w === "·" ? "text-gold" : i === 1 ? "text-brand" : "text-transparent"
                }`}
                style={w !== "·" && i === 0 ? { WebkitTextStroke: "2px #16130f" } : undefined}
              >
                {w}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
