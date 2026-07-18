"use client";

/* HERO 22 — "After Dark"
   The Aceternity dialect: near-black stage, a cinematic spotlight beam,
   cursor-following dot-grid glow, shimmer headline, glass chips with
   animated shine borders. SaaS-grade gloss aimed at travel. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const CHIPS = [
  { k: "4.9★", v: "2,400 reviews" },
  { k: "350+", v: "departures / yr" },
  { k: "24h", v: "free seat hold" },
];

export default function Hero22Spotlight() {
  const ref = useRef<HTMLElement>(null);
  const gridGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      gridGlowRef.current?.style.setProperty("--mx", `${e.clientX - r.left}px`);
      gridGlowRef.current?.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove, { passive: true });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-sp-in]",
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 60%" } }
      );
      gsap.fromTo(
        "[data-sp-beam]",
        { autoAlpha: 0, rotate: -8 },
        { autoAlpha: 1, rotate: 0, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 65%" } }
      );
    }, el);
    return () => {
      el.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden bg-[#0a0908]">
      {/* dot grid, lit only around the cursor */}
      <div
        ref={gridGlowRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(245,163,26,0.55) 1px, transparent 1.4px)",
          backgroundSize: "34px 34px",
          WebkitMaskImage: "radial-gradient(360px circle at var(--mx, 50%) var(--my, 40%), black 0%, transparent 100%)",
          maskImage: "radial-gradient(360px circle at var(--mx, 50%) var(--my, 40%), black 0%, transparent 100%)",
        }}
      />
      {/* the spotlight beam */}
      <div
        data-sp-beam
        aria-hidden="true"
        className="absolute -top-1/4 left-[-10%] h-[150%] w-[70%] opacity-0"
        style={{
          background: "conic-gradient(from 100deg at 50% 0%, transparent 44%, rgba(255,244,220,0.14) 50%, transparent 56%)",
          filter: "blur(6px)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p data-sp-in className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 backdrop-blur-md">
            <span className="animate-live h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            Monsoon batches now boarding
          </p>

          {/* shimmer headline */}
          <h1
            data-sp-in
            className="mt-7 bg-[linear-gradient(110deg,#fdfaf4_35%,#f5a31a_47%,#fdfaf4_58%)] bg-[length:220%_100%] bg-clip-text font-display text-5xl font-extrabold leading-[1.03] tracking-tight text-transparent sm:text-7xl"
            style={{ animation: "lux-shimmer 4.5s linear infinite" }}
          >
            Travel that feels
            <br />
            first class —
            <br />
            priced like coach.
          </h1>

          <p data-sp-in className="mt-6 max-w-md text-base leading-relaxed text-white/55">
            Curated group departures across India with captains, concierge-grade
            planning and rooms we&apos;d book for ourselves.
          </p>

          <div data-sp-in className="mt-9 flex flex-wrap items-center gap-4">
            {/* shine-border CTA */}
            <a href="#" className="lux-shine-border group relative inline-flex overflow-hidden rounded-full p-px">
              <span className="inline-flex min-h-12 items-center rounded-full bg-[#161210] px-8 py-3.5 font-bold text-white transition-colors group-hover:bg-brand">
                Explore departures
              </span>
            </a>
            <a href="#" className="min-h-12 py-3 font-semibold text-white/65 transition-colors hover:text-gold">
              Watch the film ↗
            </a>
          </div>

          <div data-sp-in className="mt-12 flex flex-wrap gap-3">
            {CHIPS.map((c) => (
              <div key={c.k} className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3.5 backdrop-blur-md">
                <p className="font-display text-xl font-extrabold text-gold">{c.k}</p>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-white/45">{c.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* glass photo stack */}
        <div data-sp-in className="relative mx-auto hidden w-full max-w-sm lg:block">
          <div className="lux-shine-border rounded-[1.8rem] p-px">
            <div className="relative overflow-hidden rounded-[1.75rem]">
              <Image src="/images/stars.jpg" alt="Milky way over Himalayan camp" width={640} height={800} className="h-[26rem] w-full object-cover" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/12 bg-black/45 px-5 py-4 backdrop-blur-xl">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">Tonight, in Spiti</p>
                <p className="mt-1 font-display text-lg font-bold text-white">Astro camp · 11,000 ft · −2°C</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
