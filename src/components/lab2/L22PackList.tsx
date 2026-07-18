"use client";

/* L22 — "The Manifest" (itinerary / prep section)
   A packing list that checks itself off as you scroll — ticks draw in,
   items strike through — until the last line, which gets rejected with a
   red stamp. Charm as conversion. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

const ITEMS = [
  "Layers you'll swear were overkill (they're not)",
  "Sunscreen — the mountain sun files no warnings",
  "Power bank · 20,000 mAh minimum",
  "One outfit for the photos, honestly",
  "Cash for maggi points past civilisation",
  "Your doubts about going",
];

export default function L22PackList() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-l22-row]").forEach((row, i) => {
        const last = i === ITEMS.length - 1;
        const tick = row.querySelector<SVGPathElement>("[data-l22-tick]");
        const strike = row.querySelector<HTMLElement>("[data-l22-strike]");
        const stamp = row.querySelector<HTMLElement>("[data-l22-stamp]");
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 72%" } });
        tl.fromTo(row, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out" });
        if (!last && tick) {
          const len = tick.getTotalLength();
          tl.fromTo(tick, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, "-=0.1");
          if (strike) tl.fromTo(strike, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, "-=0.15");
        }
        if (last && stamp) {
          tl.to(row, { x: 0 });
          tl.fromTo(stamp, { autoAlpha: 0, scale: 2.4, rotate: 10 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.4, ease: "power4.in" });
          tl.to(row, { x: 5, duration: 0.05, yoyo: true, repeat: 3 }); // stamp thud
        }
      });
      gsap.fromTo("[data-l22-head]", { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 62%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="noise bg-[#14100c] py-[13vh]">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <Eyebrow tone="gold">pre-departure manifest</Eyebrow>
          <h2 data-l22-head className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Pack light. <span className="text-gold">We carry the rest.</span>
          </h2>
        </div>

        <ul className="mt-12 space-y-1">
          {ITEMS.map((item, i) => {
            const last = i === ITEMS.length - 1;
            return (
              <li key={item} data-l22-row className="relative flex items-center gap-4 border-b border-white/8 py-4 opacity-0">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${last ? "border-brand/60" : "border-gold/70"}`}>
                  {!last && (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path data-l22-tick d="M4 10.5l4 4L16 6" stroke="#f5a31a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="relative text-base text-white/85 sm:text-lg">
                  {item}
                  {!last && <span data-l22-strike aria-hidden="true" className="absolute inset-y-1/2 -left-1 -right-1 h-[2px] origin-left scale-x-0 bg-gold/80" />}
                </span>
                {last && (
                  <span data-l22-stamp className="ml-auto shrink-0 -rotate-8 rounded border-[2.5px] border-brand px-3 py-1 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-brand opacity-0">
                    Leave behind
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-10 text-center text-sm text-white/45">
          Tents, permits, oxygen, first-aid, chai supply — already on the truck.
        </p>
      </div>
    </section>
  );
}
