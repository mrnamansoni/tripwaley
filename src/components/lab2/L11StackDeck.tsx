"use client";

/* L11 — "The Pile-Up" (destination showcase)
   Full-bleed destination cards stack on top of each other as you scroll —
   each arriving card presses the one beneath it deeper into the page
   (scale, dim, slight lift). The most satisfying way to compare four trips. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const DECK = [
  { img: "kashmir", name: "Kashmir", line: "Shikaras before breakfast", days: "6N", price: "₹21,999", tone: "#1c2e38" },
  { img: "rajasthan", name: "Rajasthan", line: "Forts, folk nights, thalis", days: "5N", price: "₹15,999", tone: "#3a1f14" },
  { img: "meghalaya", name: "Meghalaya", line: "Rain-fed everything", days: "6N", price: "₹17,999", tone: "#16281c" },
  { img: "andaman", name: "Andaman", line: "Reef-side reset", days: "6N", price: "₹28,999", tone: "#0d2733" },
];

export default function L11StackDeck() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-l11-card]");
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        // as the NEXT card arrives, this one sinks
        gsap.to(card, {
          scale: 0.9, filter: "brightness(0.45)", yPercent: -4,
          ease: "none",
          scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top top", scrub: 0.4 },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative bg-ink">
      <div className="px-5 pb-4 pt-[10vh] text-center sm:px-8">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">four contenders · keep scrolling</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Let them fight <span className="text-gold">for you.</span>
        </h2>
      </div>

      {DECK.map((d, i) => (
        <div key={d.img} className="sticky top-0 flex h-screen items-center justify-center px-4 sm:px-8">
          <article
            data-l11-card
            className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-[2rem] shadow-card-lg will-change-transform"
            style={{ backgroundColor: d.tone }}
          >
            <Image src={`/images/${d.img}.jpg`} alt={d.name} fill sizes="92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/25" aria-hidden="true" />
            {/* round counter */}
            <span className="absolute left-7 top-7 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-ink/40 font-display text-sm font-extrabold text-white backdrop-blur-md">
              {i + 1}/{DECK.length}
            </span>
            <div className="absolute bottom-0 flex w-full flex-wrap items-end justify-between gap-5 p-7 sm:p-10">
              <div>
                <p className="font-script text-2xl text-gold sm:text-3xl">{d.line}</p>
                <h3 className="mt-1 font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl">{d.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/60">{d.days} · from</p>
                  <p className="font-display text-3xl font-extrabold text-gold">{d.price}</p>
                </div>
                <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-white px-7 py-3.5 font-bold text-ink transition-colors hover:bg-gold">
                  Claim →
                </a>
              </div>
            </div>
          </article>
        </div>
      ))}
    </section>
  );
}
