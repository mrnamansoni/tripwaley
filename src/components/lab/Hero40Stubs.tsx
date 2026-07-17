"use client";

/* HERO 40 — "The Ticket Rack"
   Pinned horizontal scroll: a rack of perforated boarding-pass stubs glides
   sideways as you scroll down. Each stub is a real departure with a torn
   edge, barcode and gold foil. Tactile, collectible, conversion-ready. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const STUBS = [
  { code: "TW-701", from: "DEL", to: "LEH", trip: "Leh–Ladakh", nights: "7N", price: "₹24,999", img: "/images/ladakh.jpg", seats: "3 left" },
  { code: "TW-702", from: "DEL", to: "KAZ", trip: "Spiti Valley", nights: "8N", price: "₹18,999", img: "/images/spiti.jpg", seats: "boarding" },
  { code: "TW-703", from: "DEL", to: "SXR", trip: "Kashmir", nights: "6N", price: "₹21,999", img: "/images/kashmir.jpg", seats: "on time" },
  { code: "TW-705", from: "COK", to: "ALZ", trip: "Kerala", nights: "6N", price: "₹16,999", img: "/images/kerala.jpg", seats: "boarding" },
  { code: "TW-706", from: "MAA", to: "IXZ", trip: "Andaman", nights: "6N", price: "₹28,999", img: "/images/andaman.jpg", seats: "6 left" },
];

export default function Hero40Stubs() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const track = trackRef.current;
      const section = ref.current;
      if (!track || !section) return;
      const amount = () => track.scrollWidth - window.innerWidth + 40;
      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: () => `+=${amount()}`, scrub: 0.5, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
      });
      if (progRef.current) {
        gsap.fromTo(progRef.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: () => `+=${amount()}`, scrub: 0.5 } });
      }
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} className="relative bg-[#0d0b09]">
      <div className="flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-8 w-full max-w-7xl px-5 sm:px-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">Departures rack · pull one</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Tear off your <span className="text-gold">next one.</span>
          </h1>
          <div className="mt-5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div ref={progRef} className="h-full w-full origin-left scale-x-0 rounded-full bg-gold" />
          </div>
        </div>

        <div ref={trackRef} className="flex w-max items-center gap-6 px-5 sm:px-8">
          {STUBS.map((s) => (
            <article key={s.code} className="relative flex w-[80vw] shrink-0 overflow-hidden rounded-2xl bg-[#f4efe4] shadow-card-lg sm:w-[30rem]">
              {/* photo half */}
              <div className="relative w-2/5">
                <Image src={s.img} alt={s.trip} fill sizes="200px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#f4efe4]" />
              </div>
              {/* perforation */}
              <div className="relative flex flex-col items-center justify-around py-3" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-2.5 w-2.5 rounded-full bg-[#0d0b09]" />
                ))}
              </div>
              {/* stub half */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink/45">{s.code}</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-ink">{s.trip}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase ${s.seats.includes("left") ? "bg-brand text-white" : "bg-ink/10 text-ink/70"}`}>
                    {s.seats}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <span className="font-display text-xl font-extrabold text-ink">{s.from}</span>
                  <span className="flex-1 border-b border-dashed border-ink/30" />
                  <span aria-hidden="true">✈</span>
                  <span className="flex-1 border-b border-dashed border-ink/30" />
                  <span className="font-display text-xl font-extrabold text-ink">{s.to}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-wider text-ink/45">{s.nights} · from</p>
                    <p className="font-display text-2xl font-extrabold text-brand">{s.price}</p>
                  </div>
                  {/* barcode */}
                  <div className="flex h-9 items-end gap-[2px]" aria-hidden="true">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span key={i} className="w-[2px] bg-ink" style={{ height: `${40 + ((i * 37) % 60)}%` }} />
                    ))}
                  </div>
                </div>
                <a href="#" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-ink py-2.5 text-sm font-bold text-cream transition-colors hover:bg-brand">
                  Hold this seat
                </a>
              </div>
            </article>
          ))}

          {/* end card */}
          <div className="flex h-[22rem] w-[70vw] shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/40 px-8 text-center sm:w-[22rem]">
            <p className="font-script text-3xl text-gold">out of stubs?</p>
            <p className="mt-3 font-display text-2xl font-extrabold text-white">We print new ones every week.</p>
            <a href="#" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3 font-bold text-[#0d0b09] transition-colors hover:bg-[#ffc45c]">
              See full schedule →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
