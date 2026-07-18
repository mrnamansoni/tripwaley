"use client";

/* L08 — "The Blinds" (hero opener)
   One photograph sliced into seven vertical slats that glide open on
   alternating tracks as you scroll — venetian blinds opening onto Kerala —
   while the headline threads through the gaps. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const SLATS = 7;

export default function L08SlatReveal() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      gsap.utils.toArray<HTMLElement>("[data-l08-slat]").forEach((slat, i) => {
        gsap.fromTo(
          slat,
          { yPercent: i % 2 === 0 ? 104 : -104 },
          { yPercent: 0, ease: "none", scrollTrigger: { ...st, end: "70% bottom" } }
        );
      });
      gsap.fromTo("[data-l08-title]", { autoAlpha: 1 }, { autoAlpha: 0, y: -30, ease: "none", scrollTrigger: { ...st, start: "40% bottom", end: "62% bottom" } });
      gsap.fromTo("[data-l08-end]", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "72% bottom", end: "90% bottom" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[260vh] bg-[#0e1210]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* headline sits BEHIND the slats, visible through the gaps early on */}
        <div data-l08-title className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">now boarding · kerala</p>
          <h2 className="mt-5 font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold leading-[0.95] tracking-tight text-[#f2ecdd]">
            Open the
            <br />
            <span className="text-gold">blinds.</span>
          </h2>
        </div>

        {/* the slats — each carries its vertical strip of the same photo */}
        <div className="absolute inset-0 flex" aria-hidden="true">
          {Array.from({ length: SLATS }).map((_, i) => (
            <div key={i} className="relative h-full overflow-hidden" style={{ width: `${100 / SLATS}%` }}>
              <div
                data-l08-slat
                className="absolute inset-0 will-change-transform"
                style={{
                  backgroundImage: "url(/images/kerala.jpg)",
                  backgroundSize: `${SLATS * 100}% 100%`,
                  backgroundPosition: `${(i / (SLATS - 1)) * 100}% 50%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* landing copy over the fully-open photo */}
        <div data-l08-end className="absolute inset-0 flex flex-col items-center justify-end pb-[11vh] text-center opacity-0">
          <div className="rounded-2xl bg-ink/35 px-8 py-6 backdrop-blur-md">
            <p className="font-script text-2xl text-gold sm:text-3xl">morning in Alleppey</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-5xl">This is the view from bed.</h3>
            <a href="#" className="pointer-events-auto mt-5 inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3.5 font-bold text-ink transition-transform hover:scale-[1.04]">
              Wake up here →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
