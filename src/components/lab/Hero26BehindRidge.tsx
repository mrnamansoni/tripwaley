"use client";

/* HERO 26 — "Behind the Range"
   The Apple-keynote depth trick: the headline rises from BEHIND the
   mountain ridge — a clipped copy of the night photo overdraws the type,
   so the peaks physically occlude the words as they climb. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/* rough trace of the ridge line in stars.jpg (viewport %) */
const RIDGE_CLIP =
  "polygon(0% 100%, 0% 58%, 10% 52%, 20% 56%, 30% 44%, 38% 40%, 46% 50%, 54% 47%, 62% 43%, 72% 49%, 82% 46%, 92% 50%, 100% 47%, 100% 100%)";

export default function Hero26BehindRidge() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      // the headline climbs out from behind the peaks
      gsap.fromTo("[data-br-title]", { yPercent: 46 }, { yPercent: -16, ease: "none", scrollTrigger: st });
      gsap.fromTo("[data-br-sub]", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: "none",
        scrollTrigger: { ...st, start: "55% bottom", end: "80% bottom" },
      });
      gsap.to("[data-br-hint]", {
        autoAlpha: 0, ease: "none",
        scrollTrigger: { ...st, start: "12% bottom", end: "30% bottom" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[240vh] bg-[#0b0e18]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* sky + range */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/stars.jpg)" }}
        />

        {/* the headline — sandwiched between sky and ridge */}
        <div data-br-title className="absolute inset-x-0 top-[16%] px-4 text-center will-change-transform">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">Tripwaley expeditions</p>
          <h1
            className="mt-4 text-[clamp(3.6rem,13vw,11rem)] font-light leading-[0.95] text-[#f4ead2]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Higher
            <br />
            <em className="italic">ground</em>
          </h1>
        </div>

        {/* clipped copy of the same photo — the ridge overdraws the type */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/stars.jpg)", clipPath: RIDGE_CLIP }}
        />

        {/* landing copy in the foreground valley */}
        <div data-br-sub className="absolute inset-x-0 bottom-[9%] px-6 text-center opacity-0">
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/75">
            Some words only make sense at 4,000 metres. Winter summit batches —
            certified leaders, oxygen on route, silence included.
          </p>
          <a
            href="#"
            className="mt-6 inline-block border border-gold/70 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-[#0b0e18]"
          >
            Climb with us
          </a>
        </div>

        <p data-br-hint className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[0.6rem] font-bold uppercase tracking-[0.35em] text-white/40">
          scroll — let it rise
        </p>
      </div>
    </section>
  );
}
