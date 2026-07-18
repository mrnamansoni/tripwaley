"use client";

/* HERO 01 — "Editorial Kinetic"
   Swiss-editorial cream layout. Giant stacked type slides at different
   speeds on scroll; a passport stamp slams in and slowly rotates. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { waLink } from "@/lib/data";

function PassportStamp() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <path id="stamp-arc" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" fill="none" />
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--color-brand)" strokeWidth="4" strokeDasharray="2 6" strokeLinecap="round" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />
      <text fill="var(--color-brand)" fontSize="15.5" fontWeight="800" letterSpacing="3.5">
        <textPath href="#stamp-arc">TRIPWALEY ✦ GROUP DEPARTURES ✦ INDIA ✦</textPath>
      </text>
      <text x="100" y="92" textAnchor="middle" fill="var(--color-brand)" fontSize="19" fontWeight="900" letterSpacing="2">SEAT</text>
      <text x="100" y="116" textAnchor="middle" fill="var(--color-brand)" fontSize="19" fontWeight="900" letterSpacing="2">CONFIRMED</text>
    </svg>
  );
}

export default function Hero01EditorialKinetic() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-k-line]",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ref.current, start: "top 70%" },
        }
      );
      // each line drifts sideways at its own speed while the section scrolls
      gsap.utils.toArray<HTMLElement>("[data-k-drift]").forEach((el) => {
        gsap.fromTo(
          el,
          { x: 0 },
          {
            x: parseFloat(el.dataset.kDrift ?? "0"),
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        );
      });
      gsap.fromTo(
        "[data-k-stamp]",
        { scale: 2.4, autoAlpha: 0, rotate: 24 },
        {
          scale: 1,
          autoAlpha: 1,
          rotate: -12,
          duration: 0.55,
          ease: "power4.in",
          scrollTrigger: { trigger: ref.current, start: "top 45%" },
          onComplete: () => {
            gsap.to("[data-k-stamp]", { rotate: 8, duration: 6, yoyo: true, repeat: -1, ease: "sine.inOut" });
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-cream py-24">
      {/* faint editorial grid */}
      <div aria-hidden="true" className="absolute inset-0 mx-auto grid max-w-7xl grid-cols-4 px-5 sm:px-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-l border-line/60 last:border-r" />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex items-baseline justify-between border-b border-ink/15 pb-3 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-ink/50">
          <span>Tripwaley · Est. 2019</span>
          <span className="hidden sm:block">Group departures across India</span>
          <span>★ 4.9 / 12,000+</span>
        </div>

        <h1 className="mt-8 font-display font-extrabold leading-[0.88] tracking-tight">
          <span className="block overflow-hidden">
            <span
              data-k-line data-k-drift="-55"
              className="block pl-6 text-[clamp(3.4rem,12vw,10rem)] text-transparent [-webkit-text-stroke:2px_var(--color-ink)] sm:pl-12"
            >
              EXPLORE
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-k-line data-k-drift="85" className="block text-[clamp(3.4rem,12vw,10rem)] text-brand">
              INDIA
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-k-line data-k-drift="30" className="block pl-3 text-[clamp(3.4rem,12vw,10rem)] text-ink sm:pl-6">
              TOGETHER<span className="text-gold">.</span>
            </span>
          </span>
        </h1>

        {/* stamp overlaps the type block */}
        <div data-k-stamp className="absolute right-6 top-16 h-32 w-32 opacity-0 sm:right-16 sm:top-20 sm:h-48 sm:w-48">
          <PassportStamp />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-ink/15 pt-6">
          <p className="max-w-sm text-sm leading-relaxed text-ink/65">
            Fixed-date group trips with 15 strangers who won&apos;t stay strangers.
            Ladakh to Andaman, zero planning required.
          </p>
          <div className="flex items-center gap-3">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              See departures
            </a>
            <a
              href={waLink("Hi Tripwaley!")}
              target="_blank" rel="noopener noreferrer"
              className="link-sweep font-bold text-ink"
            >
              WhatsApp us →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
