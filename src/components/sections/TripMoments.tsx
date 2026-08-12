"use client";

import { useEffect, useRef, useState } from "react";
import SiteMedia from "@/components/site/SiteMedia";
import { gsap } from "@/lib/gsap";
import { moments as defaultMoments, type Moment } from "@/lib/data";

/**
 * "Moments" — expanding image panels (adapted from a 21st.dev interactive
 * selector). Click/tap a panel and it grows to reveal the moment; the rest
 * collapse to icon slivers. Horizontal on desktop, vertical accordion on
 * mobile so it stays flawless at 360px.
 */

const ICONS: Record<string, React.ReactNode> = {
  bonfire: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3s4.5 3.6 4.5 8a4.5 4.5 0 0 1-9 0c0-1.6.6-3 1.4-4.2C9.5 8.4 10.5 9.5 11 9c.6-.6-.4-3.4 1-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 21l14-4M19 21L5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  astro: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.6 4.2L18 8.8l-4.4 1.6L12 14.6l-1.6-4.2L6 8.8l4.4-1.6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="18.5" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="6" cy="17.5" r="0.9" fill="currentColor" />
    </svg>
  ),
  rapids: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9c2.2 0 2.2 1.8 4.5 1.8S9.8 9 12 9s2.3 1.8 4.5 1.8S18.8 9 21 9M3 15c2.2 0 2.2 1.8 4.5 1.8S9.8 15 12 15s2.3 1.8 4.5 1.8S18.8 15 21 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  backwaters: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 15h16l-2.5 4h-11L4 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 15V5m0 0c3.5 1 5.5 3.5 6 6.5L12 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  summit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 19L10 7l3.5 6L16 9l5 10H3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="17.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

export default function TripMoments({ moments = defaultMoments }: { moments?: Moment[] } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-moment-head]",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
      // panels slide in from the left, staggered — mirrors the source component
      gsap.fromTo(
        "[data-moment-panel]",
        { autoAlpha: 0, x: -56 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: "[data-moment-strip]", start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="moments" className="noise relative overflow-hidden bg-ink">
      {/* wave in from the blush section above */}
      <svg className="block w-full text-blush" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1440v10c-160 28-360 42-600 38C580 44 300 18 140 14 90 13 40 14 0 20V0Z" fill="currentColor" />
      </svg>

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p data-moment-head className="font-script text-2xl text-gold sm:text-3xl">
            sab kuch included hai ✦
          </p>
          <h2 data-moment-head className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Moments you&apos;ll <span className="text-brand-bright">re-live</span> forever.
          </h2>
          <p data-moment-head className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
            No itinerary jargon. This is what a Tripwaley week actually feels like —
            tap through the good parts.
          </p>
        </div>

        {/* expanding panel strip */}
        <div
          data-moment-strip
          className="mt-12 flex h-[30rem] flex-col gap-3 md:h-[26rem] md:flex-row"
        >
          {moments.map((m, i) => {
            const isActive = active === i;
            return (
              <button
                key={m.id}
                data-moment-panel
                onClick={() => setActive(i)}
                aria-expanded={isActive}
                aria-label={`${m.title} — ${m.desc}`}
                className={`group relative min-h-14 overflow-hidden rounded-2xl border-2 text-left outline-offset-4 md:min-h-0 md:min-w-14 ${
                  isActive ? "border-gold/80 shadow-card-lg" : "border-white/10 hover:border-white/30"
                }`}
                style={{
                  // the signature effect of the source component: panels trade
                  // flex share; the transition is contained to this strip
                  flex: isActive ? "6 1 0%" : "1 1 0%",
                  transition:
                    "flex 0.7s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease",
                }}
              >
                <SiteMedia
                  src={m.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className={`object-cover transition-all duration-700 ${
                    isActive ? "scale-100 opacity-100" : "scale-110 opacity-60 group-hover:opacity-85"
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent transition-opacity duration-700 ${
                    isActive ? "opacity-90" : "opacity-60"
                  }`}
                  aria-hidden="true"
                />

                {/* icon + label pinned to the bottom edge */}
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 backdrop-blur-md transition-colors duration-300 ${
                      isActive
                        ? "border-gold bg-brand text-white"
                        : "border-white/25 bg-ink/60 text-gold"
                    }`}
                  >
                    {ICONS[m.id]}
                  </span>
                  <span
                    className="min-w-0 transition-all duration-500"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(24px)",
                    }}
                  >
                    <span className="block truncate font-display text-lg font-bold text-white sm:text-xl">
                      {m.title}
                    </span>
                    <span className="block truncate text-sm text-white/70">{m.desc}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
          every departure · every batch · already in the price
        </p>
      </div>

      {/* wave back out to the blush section below */}
      <svg className="block w-full rotate-180 text-blush" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1440v10c-160 28-360 42-600 38C580 44 300 18 140 14 90 13 40 14 0 20V0Z" fill="currentColor" />
      </svg>
    </section>
  );
}
