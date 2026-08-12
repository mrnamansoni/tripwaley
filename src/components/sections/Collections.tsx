"use client";

import { useEffect, useRef } from "react";
import SiteMedia from "@/components/site/SiteMedia";
import { gsap } from "@/lib/gsap";
import { collections as defaultCollections, formatINR, type Collection } from "@/lib/data";

/**
 * Curated collections — pinned section with scroll-scrubbed horizontal travel
 * on desktop; natural swipe-with-snap on mobile (no pin, still premium).
 */
export default function Collections({ items = defaultCollections }: { items?: Collection[] } = {}) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      if (!track || !pin) return;

      // distance the track must travel so its right edge meets the viewport's
      const amount = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${amount()}`,
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              start: "top top",
              end: () => `+=${amount()}`,
              scrub: 0.5,
            },
          }
        );
      }
      return () => tween.scrollTrigger?.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="collections" className="relative overflow-hidden bg-blush">
      {/* wave in from the cream section above */}
      <svg className="block w-full text-cream" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1440v18c-120 26-320 44-560 40C560 54 320 20 160 16 100 14 40 16 0 24V0Z" fill="currentColor" />
      </svg>

      <div ref={pinRef} className="flex flex-col justify-center py-14 md:h-screen md:py-0">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-script text-2xl text-brand sm:text-3xl">pick a mood, not a place</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
                Curated <span className="text-brand">collections.</span>
              </h2>
            </div>
            <p className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-ink/40 md:block" aria-hidden="true">
              scroll → to explore
            </p>
          </div>
          {/* scrub progress bar */}
          <div className="mt-6 hidden h-1 w-full overflow-hidden rounded-full bg-line md:block" aria-hidden="true">
            <div ref={progressRef} className="h-full w-full origin-left scale-x-0 rounded-full bg-brand" />
          </div>
        </div>

        <div data-lenis-prevent className="mt-8 snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:snap-none md:overflow-visible md:pb-0">
          <div ref={trackRef} className="flex w-max items-stretch gap-4 px-5 sm:gap-6 sm:px-8">
            {items.map((c, i) => (
              <a
                key={c.slug}
                href="#cta"
                aria-label={`${c.title} — ${c.trips} trips from ${formatINR(c.from)}`}
                className="group relative block h-[26rem] w-[76vw] shrink-0 snap-center overflow-hidden rounded-3xl bg-ink shadow-card transition-shadow duration-500 hover:shadow-card-lg sm:h-[30rem] sm:w-[24rem]"
              >
                <SiteMedia
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 76vw, 24rem"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" aria-hidden="true" />

                <span className="absolute left-5 top-5 font-display text-sm font-bold text-white/50" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {c.badge && (
                  <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-ink">
                    {c.badge}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-3xl font-extrabold leading-tight text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{c.sub}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                      {c.trips} trips · from {formatINR(c.from)}
                    </span>
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 group-hover:border-brand group-hover:bg-brand"
                      aria-hidden="true"
                    >
                      <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                        <path d="M3 15L15 3m0 0H6m9 0v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}

            {/* end card nudging to the vibe check */}
            <div className="flex h-[26rem] w-[70vw] shrink-0 snap-center flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand/30 bg-cream/60 px-8 text-center sm:h-[30rem] sm:w-[20rem]">
              <p className="font-script text-3xl text-brand">still scrolling?</p>
              <p className="mt-3 font-display text-2xl font-extrabold">
                Let&apos;s match you with your perfect batch instead.
              </p>
              <a
                href="#vibe-check"
                className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-6 py-3 font-bold text-white shadow-red transition-colors hover:bg-brand-bright"
              >
                Take the vibe check ↓
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
