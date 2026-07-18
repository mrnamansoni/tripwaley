"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import RouteDraw from "@/components/svg/RouteDraw";
import { destinations, formatINR } from "@/lib/data";
import { useBooking } from "@/components/booking/BookingContext";

export default function FeaturedDestinations() {
  const sectionRef = useRef<HTMLElement>(null);
  const { open } = useBooking();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-bento-card]",
        { autoAlpha: 0, y: 48 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: "[data-bento-grid]", start: "top 78%" },
        }
      );
      gsap.fromTo(
        "[data-section-head]",
        { autoAlpha: 0, y: 32 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="destinations" className="relative bg-cream py-20 sm:py-28">
      {/* dotted route flying in from the hero, weaving toward the grid */}
      <RouteDraw
        d="M620 -10 C 700 90, 460 120, 540 200 S 980 190, 1080 300 S 700 380, 820 470"
        viewBox="0 0 1200 480"
        className="pointer-events-none absolute inset-x-0 top-0 hidden w-full lg:block"
        markers={[
          { x: 540, y: 200 },
          { x: 1080, y: 300 },
        ]}
        start="top 90%"
        end="top 20%"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p data-section-head className="font-script text-2xl text-brand sm:text-3xl">
            pack for these ✦
          </p>
          <h2 data-section-head className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Departing soon,
            <br />
            filling <span className="text-brand">faster.</span>
          </h2>
          <p data-section-head className="mt-4 text-base leading-relaxed text-ink/65 sm:text-lg">
            Fixed dates, small batches of 15–20, one trip captain, zero group-admin
            chaos. These are the departures India is booking right now.
          </p>
        </div>

        {/* --------------------------------------------- asymmetric bento grid */}
        <div data-bento-grid className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-12 md:auto-rows-[15rem]">
          {destinations.map((d, i) => {
            const large = i === 0;
            return (
              <article
                key={d.slug}
                data-bento-card
                className={`group relative min-h-[20rem] overflow-hidden rounded-3xl bg-ink shadow-card transition-shadow duration-500 hover:shadow-card-lg md:min-h-0 ${d.bento}`}
              >
                <Image
                  src={d.image}
                  alt={`${d.name} — ${d.region}`}
                  fill
                  sizes={large ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/5" aria-hidden="true" />

                {/* top chips */}
                <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md ${
                      d.seatsLeft <= 5 ? "bg-brand text-white" : "bg-cream/85 text-ink"
                    }`}
                  >
                    {d.seatsLeft <= 5 && (
                      <span className="animate-live h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                    )}
                    {d.seatsLeft} seats left
                  </span>
                  <span className="rounded-full bg-cream/85 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur-md">
                    <span className="text-gold" aria-hidden="true">★</span> {d.rating} ({d.reviews})
                  </span>
                </div>

                {/* bottom info */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{d.region}</p>
                  <h3 className={`mt-1 font-display font-extrabold text-white ${large ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
                    {d.name}
                  </h3>
                  {large && (
                    <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-white/80 sm:block">
                      {d.hook}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {d.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/25 px-2.5 py-1 text-[0.7rem] font-semibold text-white/85">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/65">
                        {d.days}D/{d.nights}N · next: {d.nextDeparture}
                      </p>
                      <p className="font-display text-xl font-bold text-white sm:text-2xl">
                        {formatINR(d.priceFrom)}
                        <span className="ml-1 text-xs font-medium text-white/60">onwards</span>
                      </p>
                    </div>
                    <button
                      onClick={() => open("hold", d.slug)}
                      aria-label={`Hold a seat on ${d.name}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-all duration-300 group-hover:bg-brand group-hover:text-white hover:!scale-110 active:scale-95"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M3 15L15 3m0 0H6m9 0v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-ink/55">
          Can&apos;t spot your dream trip?{" "}
          <a href="#collections" className="font-bold text-brand underline decoration-2 underline-offset-4 hover:text-brand-bright">
            Browse all collections →
          </a>
        </p>
      </div>
    </section>
  );
}
