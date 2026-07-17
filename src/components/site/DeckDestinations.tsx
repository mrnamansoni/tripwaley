"use client";

/* THE DECK — destination showcase (their L09 pick, wired to real data).
   Scroll flicks through the live catalog in 3D coverflow; the centered
   card announces itself with the visitor's ex-city price. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useCity } from "./CityProvider";
import { inr } from "@/lib/types";

export interface DeckCard {
  slug: string;
  name: string;
  destination: string;
  nightsLabel: string;
  image: string;
  fromPrices: Record<string, number>; // citySlug -> min price
}

export default function DeckDestinations({ cards, eyebrow = "somewhere in here is your next trip" }: { cards: DeckCard[]; eyebrow?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { city } = useCity();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>("[data-deck-card]");
      const n = els.length;
      let cur = -1;
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.35,
          onUpdate: (self) => {
            const f = self.progress * (n - 1);
            els.forEach((card, i) => {
              const d = i - f;
              const a = Math.abs(d);
              const side = Math.sign(d);
              card.style.transform = `translateX(${d * 46}%) translateZ(${-Math.min(a, 3) * 190}px) rotateY(${-side * Math.min(a * 42, 55)}deg) scale(${1 - Math.min(a * 0.06, 0.2)})`;
              card.style.zIndex = String(100 - Math.round(a * 10));
              card.style.filter = `brightness(${1 - Math.min(a * 0.28, 0.62)})`;
            });
            const idx = Math.round(f);
            if (idx !== cur) { cur = idx; setActive(idx); }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, [cards.length]);

  const cardHeight = `${34 * cards.length}0vh`;
  void cardHeight;
  const activeCard = cards[active];
  const price = activeCard?.fromPrices[city.slug];

  return (
    <section ref={ref} className="relative bg-[#101012]" style={{ height: `${Math.max(260, cards.length * 36)}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mb-6 px-5 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">{eyebrow}</p>
          <h2 key={active} className="mt-3 animate-[fadeUp_.4s_ease-out] font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {activeCard?.name}
            {price && (
              <span className="ml-4 align-middle font-display text-lg font-bold text-gold sm:text-2xl">
                from {inr(price)} <span className="text-white/45">ex-{city.name}</span>
              </span>
            )}
          </h2>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            {activeCard?.destination || activeCard?.nightsLabel}
          </p>
        </div>

        <div className="relative mx-auto h-[44vh] w-full max-w-5xl" style={{ perspective: "1200px" }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {cards.map((c, i) => (
              <Link
                key={c.slug}
                href={`/trips/${c.slug}`}
                data-deck-card
                aria-label={`${c.name} package`}
                className="absolute left-1/2 top-1/2 h-[38vh] w-[29vh] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
                tabIndex={i === active ? 0 : -1}
              >
                <span className="relative block h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-card-lg">
                  <Image src={c.image} alt={c.name} fill sizes="32vh" className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-3 pt-8">
                    <span className="block truncate font-display text-sm font-extrabold text-white">{c.name}</span>
                    <span className="text-[0.58rem] font-bold uppercase tracking-widest text-gold">{c.nightsLabel}</span>
                  </span>
                </span>
                {/* reflection */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-full mt-2 block h-full w-full scale-y-[-1] overflow-hidden rounded-xl opacity-25"
                  style={{ WebkitMaskImage: "linear-gradient(to top, transparent 60%, black 100%)", maskImage: "linear-gradient(to top, transparent 60%, black 100%)" }}
                >
                  <Image src={c.image} alt="" fill sizes="32vh" className="object-cover" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14 flex justify-center gap-2" aria-hidden="true">
          {cards.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-gold" : "w-2.5 bg-white/25"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
