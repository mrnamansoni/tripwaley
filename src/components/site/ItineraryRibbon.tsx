"use client";

/* THE RIBBON + THE SPINE — package itinerary (their L14 + L17 picks).
   A gold route draws itself down the page with a plane riding the tip;
   each day's card swings in as the ink reaches its node. Data-driven:
   works for any package with a day-by-day itinerary. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import type { ItineraryDay } from "@/lib/types";

export default function ItineraryRibbon({ days, images }: { days: ItineraryDay[]; images: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(inkRef.current, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: "[data-ir-rail]", start: "top 60%", end: "bottom 72%", scrub: 0.4 },
      });
      gsap.fromTo(planeRef.current, { top: "0%" }, {
        top: "100%", ease: "none",
        scrollTrigger: { trigger: "[data-ir-rail]", start: "top 60%", end: "bottom 72%", scrub: 0.4 },
      });
      gsap.utils.toArray<HTMLElement>("[data-ir-card]").forEach((card, i) => {
        gsap.fromTo(card, { autoAlpha: 0, x: i % 2 === 0 ? -52 : 52, rotate: i % 2 === 0 ? -1.5 : 1.5 }, {
          autoAlpha: 1, x: 0, rotate: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 76%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-ir-node]").forEach((node) => {
        gsap.fromTo(node, { scale: 0 }, {
          scale: 1, duration: 0.5, ease: "back.out(2.4)",
          scrollTrigger: { trigger: node, start: "top 72%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[10vh]">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-brand">the route · day by day</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Read it like a <span className="text-brand">boarding call.</span>
        </h2>
      </div>

      <div data-ir-rail className="relative mx-auto mt-12 w-full max-w-4xl px-5 pb-6 sm:px-8">
        <div aria-hidden="true" className="absolute inset-y-0 left-7 w-px bg-ink/12 sm:left-1/2 sm:-translate-x-1/2" />
        <div ref={inkRef} aria-hidden="true" className="absolute inset-y-0 left-7 w-[3px] origin-top rounded-full bg-gold will-change-transform sm:left-1/2 sm:-translate-x-1/2" />
        {/* the plane riding the ink */}
        <div ref={planeRef} aria-hidden="true" className="absolute left-7 z-20 -translate-x-1/2 sm:left-1/2" style={{ top: 0 }}>
          <span className="block rotate-180 text-xl text-brand drop-shadow">✈</span>
        </div>

        <div className="space-y-12">
          {days.map((day, i) => (
            <div key={day.day} className={`relative flex pl-14 sm:pl-0 ${i % 2 === 0 ? "sm:justify-start" : "sm:justify-end"}`}>
              <span data-ir-node className="absolute left-7 top-7 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-brand font-display text-[0.65rem] font-extrabold text-white shadow-red sm:left-1/2">
                D{day.day}
              </span>
              <article
                data-ir-card
                className="group relative w-full overflow-hidden rounded-3xl border border-line bg-card opacity-0 shadow-card-lg transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-[0_24px_60px_rgba(201,37,44,0.16)] sm:w-[calc(50%-2.6rem)]"
              >
                <div className="relative h-36 overflow-hidden">
                  <Image src={images[i % images.length]} alt="" fill sizes="40vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.08]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" aria-hidden="true" />
                  {/* ghost day numeral */}
                  <span aria-hidden="true" className="absolute -right-2 -top-5 font-display text-[5.2rem] font-extrabold leading-none text-white/25 transition-colors duration-500 group-hover:text-gold/50">
                    {String(day.day).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-3 left-4 rounded-full bg-gold px-3 py-1 text-[0.58rem] font-extrabold uppercase tracking-widest text-ink">
                    Day {String(day.day).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-extrabold leading-snug text-ink transition-colors group-hover:text-brand">{day.title}</h3>
                  {day.body && <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/60">{day.body.slice(0, 400)}</p>}
                  {day.image && (
                    <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl">
                      <Image src={day.image} alt="" fill sizes="(max-width:640px) 90vw, 22rem" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                </div>
                {/* gold hairline that draws on hover */}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
