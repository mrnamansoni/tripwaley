"use client";

/* THE DECK — destination showcase (their L09 pick, wired to real data).
   Desktop: scroll flicks through the live catalog in a 3D coverflow.
   Touch: an auto-rotating 3D cylinder carousel — spins on its axis by itself,
   a horizontal drag spins it by hand (SpinCarousel). Same cards, same
   reflections; page scroll stays vertical and native. */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMediaQuery } from "@/lib/useMediaQuery";
import SpinCarousel from "./SpinCarousel";
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

function CardFace({ c, sizes }: { c: DeckCard; sizes: string }) {
  return (
    <>
      <span className="relative block h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-card-lg">
        <Image src={c.image} alt={c.name} fill sizes={sizes} className="object-cover" />
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
        <Image src={c.image} alt="" fill sizes={sizes} className="object-cover" />
      </span>
    </>
  );
}

export default function DeckDestinations({ cards, eyebrow = "somewhere in here is your next trip" }: { cards: DeckCard[]; eyebrow?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const isTouch = useMediaQuery("(pointer: coarse)");
  const { city } = useCity();

  useEffect(() => {
    if (isTouch) {
      // section height changes drastically when the carousel replaces the
      // pinned coverflow — recompute every trigger below it
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return; // carousel mode needs no ScrollTrigger
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
              // opacity (compositor-cheap) instead of filter:brightness
              card.style.opacity = String(1 - Math.min(a * 0.34, 0.72));
            });
            const idx = Math.round(f);
            if (idx !== cur) { cur = idx; setActive(idx); }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, [cards.length, isTouch]);

  const onFront = useCallback((i: number) => setActive(i), []);

  const activeCard = cards[active];
  const price = activeCard?.fromPrices[city.slug];

  /* ---------- touch: auto-rotating 3D cylinder ---------- */
  if (isTouch) {
    return (
      <section className="overflow-hidden bg-[#101012] py-[9vh]">
        <div className="px-5 text-center">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white">
            {activeCard?.name}
          </h2>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white/40">
            {price != null ? `from ${inr(price)} ex-${city.name}` : activeCard?.destination || activeCard?.nightsLabel}
          </p>
        </div>

        {/* low perspective + large radius = the camera stands INSIDE the ring
            (their lab orbit-gallery feel): the front card looms close, the
            side cards sweep past the screen edges as it turns */}
        <SpinCarousel
          className="mx-auto mt-6 h-[48vh] max-h-[26rem] w-full"
          radius={Math.round(Math.max(300, cards.length * 30))}
          perspective={780}
          tiltDeg={-4}
          autoDegPerSec={7}
          cardClassName="h-[32vh] max-h-[17rem] w-[38vw] min-w-[8.5rem] max-w-[11rem]"
          onFrontChange={onFront}
        >
          {cards.map((c) => (
            <Link key={c.slug} href={`/trips/${c.slug}`} aria-label={`${c.name} package`} className="relative block h-full w-full" draggable={false}>
              <CardFace c={c} sizes="40vw" />
            </Link>
          ))}
        </SpinCarousel>

        <div className="mt-16 flex justify-center gap-2" aria-hidden="true">
          {cards.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-gold" : "w-2 bg-white/25"}`} />
          ))}
        </div>
        <p className="mt-3 text-center text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/30">
          drag to spin · tap to open
        </p>
      </section>
    );
  }

  /* ---------- desktop: scroll-scrubbed 3D coverflow ---------- */
  return (
    <section ref={ref} className="relative bg-[#101012]" style={{ height: `${Math.max(260, cards.length * 34)}vh` }}>
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
                <CardFace c={c} sizes="32vh" />
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
