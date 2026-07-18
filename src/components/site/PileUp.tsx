"use client";

/* THE PILE-UP — signature trips (their L11 pick, real packages).
   Four flagship departures stack; each arrival presses the previous one
   deeper into the page. Prices follow the visitor's city. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useCity } from "./CityProvider";
import { inr } from "@/lib/types";

export interface PileCard {
  slug: string;
  name: string;
  line: string;
  nightsLabel: string;
  image: string;
  fromPrices: Record<string, number>;
  nextDate?: string;
}

export default function PileUp({ cards }: { cards: PileCard[] }) {
  const ref = useRef<HTMLElement>(null);
  const { city } = useCity();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>("[data-pile-card]");
      els.forEach((card, i) => {
        if (i === els.length - 1) return;
        gsap.to(card, {
          scale: 0.9, filter: "brightness(0.45)", yPercent: -4, ease: "none",
          scrollTrigger: { trigger: els[i + 1], start: "top bottom", end: "top top", scrub: 0.4 },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [cards.length]);

  return (
    <section ref={ref} className="relative bg-ink">
      <div className="px-5 pb-2 pt-[10vh] text-center sm:px-8">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">the headliners · keep scrolling</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Four trips that <span className="text-gold">fight for you.</span>
        </h2>
      </div>

      {cards.map((c, i) => {
        const price = c.fromPrices[city.slug];
        return (
          <div key={c.slug} className="sticky top-0 flex h-screen items-center justify-center px-4 sm:px-8">
            <article data-pile-card className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#181614] shadow-card-lg will-change-transform">
              <Image src={c.image} alt={c.name} fill sizes="92vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/25" aria-hidden="true" />
              <span className="absolute left-7 top-7 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-ink/40 font-display text-sm font-extrabold text-white backdrop-blur-md">
                {i + 1}/{cards.length}
              </span>
              {c.nextDate && (
                <span className="absolute right-7 top-7 rounded-full bg-brand px-4 py-2 text-[0.62rem] font-bold uppercase tracking-widest text-white shadow-red">
                  next batch · {c.nextDate}
                </span>
              )}
              <div className="absolute bottom-0 flex w-full flex-wrap items-end justify-between gap-5 p-7 sm:p-10">
                <div className="min-w-0">
                  <p className="font-script text-2xl text-gold sm:text-3xl">{c.line}</p>
                  <h3 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-white sm:text-7xl">{c.name}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/60">{c.nightsLabel} · ex-{city.name}</p>
                    <p className="font-display text-3xl font-extrabold text-gold">{price ? inr(price) : "on request"}</p>
                  </div>
                  <Link href={`/trips/${c.slug}`} className="inline-flex min-h-12 items-center rounded-full bg-white px-7 py-3.5 font-bold text-ink transition-colors hover:bg-gold">
                    Claim →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </section>
  );
}
