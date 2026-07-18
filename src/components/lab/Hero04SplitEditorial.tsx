"use client";

/* HERO 04 — "Split Editorial"
   Kinfolk-style split screen: quiet type on the left, a photo column on the
   right that auto-cycles destinations with a clip-path wipe. Click advances. */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SLIDES = [
  { src: "/images/ladakh.jpg", place: "Ladakh", region: "Jammu & Kashmir · 11,500 ft", price: "₹24,999" },
  { src: "/images/kerala.jpg", place: "Kerala", region: "Backwaters · God's own", price: "₹16,999" },
  { src: "/images/meghalaya.jpg", place: "Meghalaya", region: "Abode of clouds", price: "₹17,999" },
  { src: "/images/rajasthan.jpg", place: "Jaipur", region: "The pink city", price: "₹8,999" },
  { src: "/images/andaman.jpg", place: "Andaman", region: "Emerald islands", price: "₹28,999" },
];

export default function Hero04SplitEditorial() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setIdx((v) => {
      setPrev(v);
      return (v + 1) % SLIDES.length;
    });
  }, []);

  useEffect(() => {
    timer.current = setInterval(advance, 3400);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [advance]);

  /* wipe the fresh image in with a clip-path sweep + name swap */
  useEffect(() => {
    if (prev === null) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `[data-se-img="${idx}"]`,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power4.inOut" }
      );
      gsap.fromTo("[data-se-place]", { yPercent: 105 }, { yPercent: 0, duration: 0.7, ease: "power3.out" });
      gsap.fromTo("[data-se-meta]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.15 });
    }, ref);
    return () => ctx.revert();
  }, [idx, prev]);

  const s = SLIDES[idx];

  return (
    <section ref={ref} className="relative min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-[110rem] lg:grid-cols-2">
        {/* left — quiet editorial */}
        <div className="flex flex-col justify-between px-5 py-16 sm:px-12 lg:py-20">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-ink/45">
            Nº {String(idx + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")} — the season&apos;s picks
          </p>

          <div className="py-14">
            <p className="font-script text-2xl text-brand sm:text-3xl">this month we&apos;re obsessed with</p>
            <h1 className="mt-3 overflow-hidden font-display text-6xl font-extrabold tracking-tight sm:text-8xl">
              <span data-se-place className="block">
                {s.place}<span className="text-brand">.</span>
              </span>
            </h1>
            <p data-se-meta className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-ink/50">
              {s.region} · from {s.price}
            </p>
            <p className="mt-7 max-w-md text-base leading-relaxed text-ink/65">
              One departure a week. Fifteen travellers. A trip captain who knows
              every chai stall on the route. This is slow, certain, brilliant
              group travel.
            </p>
            <div className="mt-9 flex items-center gap-5">
              <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
                View this batch
              </a>
              <button
                onClick={advance}
                className="link-sweep min-h-12 font-bold text-ink"
                aria-label="Show next destination"
              >
                Next stop →
              </button>
            </div>
          </div>

          {/* progress */}
          <div className="flex gap-2" role="tablist" aria-label="Destinations">
            {SLIDES.map((sl, i) => (
              <button
                key={sl.place}
                role="tab"
                aria-selected={i === idx}
                aria-label={sl.place}
                onClick={() => {
                  setPrev(idx);
                  setIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === idx ? "w-10 bg-brand" : "w-5 bg-ink/15 hover:bg-ink/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* right — wiping photo column */}
        <div className="relative min-h-[52vh] overflow-hidden lg:min-h-0">
          {SLIDES.map((sl, i) => (
            <div
              key={sl.src}
              data-se-img={i}
              className="absolute inset-0"
              style={{
                zIndex: i === idx ? 2 : i === prev ? 1 : 0,
                clipPath: i === idx ? undefined : "inset(0 0 0 0)",
                visibility: i === idx || i === prev ? "visible" : "hidden",
              }}
            >
              <Image src={sl.src} alt={sl.place} fill priority={i === 0} sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" />
            </div>
          ))}
          <div className="absolute bottom-5 left-5 z-10 rounded-full bg-cream/85 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink backdrop-blur-sm">
            ● shot by batch 07
          </div>
        </div>
      </div>
    </section>
  );
}
