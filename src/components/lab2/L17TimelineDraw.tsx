"use client";

/* L17 — "The Spine" (itinerary section)
   A gold line draws itself down the middle of the itinerary; day cards
   swing in from alternating sides as the ink reaches them, and each node
   ignites in sequence. The default itinerary layout, done with a pulse. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

const DAYS = [
  { d: "01", title: "Delhi → Manali", note: "Overnight Volvo, playlist wars, first mountain silhouettes at dawn.", img: "traveller-street" },
  { d: "02", title: "Solang & Atal Tunnel", note: "Paragliding window, snow-line photos, apple-orchard walk.", img: "snowtrek" },
  { d: "03", title: "Manali → Kasol", note: "Parvati valley curves, riverside camp, bonfire till the stars show up.", img: "camp-tents" },
  { d: "04", title: "Kheerganga Trek", note: "12 km through pine and mist, hot springs at the top. Legs earn dinner.", img: "group-trek" },
  { d: "05", title: "Back & brunch", note: "Slow morning, café-hopping in Old Manali, the drive home nobody wants.", img: "group-mountains" },
];

export default function L17TimelineDraw() {
  const ref = useRef<HTMLElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // the ink pours down with scroll
      gsap.fromTo(inkRef.current, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: "[data-l17-rail]", start: "top 62%", end: "bottom 70%", scrub: 0.4 },
      });
      // cards swing in as the ink reaches them
      gsap.utils.toArray<HTMLElement>("[data-l17-card]").forEach((card, i) => {
        gsap.fromTo(card, { autoAlpha: 0, x: i % 2 === 0 ? -56 : 56, rotate: i % 2 === 0 ? -2 : 2 }, {
          autoAlpha: 1, x: 0, rotate: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 74%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-l17-node]").forEach((node) => {
        gsap.fromTo(node, { scale: 0 }, {
          scale: 1, duration: 0.5, ease: "back.out(2.4)",
          scrollTrigger: { trigger: node, start: "top 70%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[12vh]">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <Eyebrow>kasol–kheerganga · 5 days</Eyebrow>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Read it like a <span className="text-brand">heartbeat.</span>
        </h2>
      </div>

      <div data-l17-rail className="relative mx-auto mt-14 w-full max-w-4xl px-5 pb-6 sm:px-8">
        {/* ghost + ink rails */}
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink/12" />
        <div ref={inkRef} aria-hidden="true" className="absolute inset-y-0 left-1/2 w-[3px] origin-top -translate-x-1/2 rounded-full bg-gold will-change-transform" />

        <div className="space-y-14">
          {DAYS.map((day, i) => (
            <div key={day.d} className={`relative flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              {/* node */}
              <span data-l17-node className="absolute left-1/2 top-8 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-brand font-display text-[0.65rem] font-extrabold text-white shadow-red">
                {day.d}
              </span>
              {/* card */}
              <article data-l17-card className="w-[calc(50%-2.6rem)] overflow-hidden rounded-2xl border border-line bg-card opacity-0 shadow-card-lg">
                <div className="relative h-36">
                  <Image src={`/images/${day.img}.jpg`} alt="" fill sizes="40vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-brand">day {day.d}</p>
                  <h3 className="mt-1 font-display text-xl font-extrabold text-ink">{day.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{day.note}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
          Live all five days →
        </a>
      </div>
    </section>
  );
}
