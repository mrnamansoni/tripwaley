"use client";

/* L24 — "Stations" (itinerary / journey section)
   Pinned: station names stream past a fixed platform marker like signs
   from a train window — each one snapping to focus as it crosses the
   centre — while the km counter spins and the speed lines lean. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const STATIONS = [
  { name: "NEW DELHI", km: 0 }, { name: "AMBALA CANTT", km: 200 }, { name: "CHANDIGARH", km: 245 },
  { name: "KALKA", km: 265 }, { name: "BAROG", km: 304 }, { name: "SHIMLA", km: 361 },
];

export default function L24TrainTicker() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const section = ref.current;
      if (!track || !section) return;
      const amount = () => track.scrollWidth - window.innerWidth * 0.5;
      let cur = 0;
      gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const idx = Math.min(STATIONS.length - 1, Math.round(p * (STATIONS.length - 1)));
            if (idx !== cur) { cur = idx; setActive(idx); }
            if (kmRef.current) kmRef.current.textContent = String(Math.round(p * 361)).padStart(3, "0");
            setDone(p > 0.96);
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[320vh] bg-[#101410]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">kalka–shimla line · UNESCO narrow gauge</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Watch the stations <span className="text-gold">go by.</span>
          </h2>
        </div>

        {/* the window */}
        <div className="relative mt-10 border-y-4 border-[#2a2f2a] bg-[#0b0f0b] py-14">
          {/* platform marker at centre */}
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold/50" />
          <div ref={trackRef} className="flex w-max items-center gap-[18vw] pl-[50vw] will-change-transform">
            {STATIONS.map((s, i) => (
              <div key={s.name} className={`whitespace-nowrap text-center transition-all duration-300 ${i === active ? "scale-100 opacity-100" : "scale-90 opacity-35"}`}>
                <p className="rounded-lg border-2 border-[#e9e2cf] bg-[#f5efdd] px-6 py-3 font-display text-2xl font-extrabold tracking-wide text-[#22301f] shadow-card-lg sm:px-10 sm:text-4xl">
                  {s.name}
                </p>
                <p className="mt-2 font-mono text-[0.62rem] tracking-[0.25em] text-white/45">KM {s.km} · ELEV {200 + i * 380} M</p>
              </div>
            ))}
          </div>
          {/* speed lines */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.25) 60px 61px)" }} />
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <p className="font-mono text-sm text-white/55">
            KM <span ref={kmRef} className="text-2xl font-bold text-gold tabular-nums">000</span> / 361
          </p>
          <div className={`transition-all duration-500 ${done ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
            <span className="-rotate-6 rounded border-[3px] border-gold px-4 py-1.5 font-display text-sm font-extrabold uppercase tracking-[0.2em] text-gold">
              Arrived · Shimla
            </span>
          </div>
          <a href="#" className="inline-flex min-h-11 items-center rounded-full bg-gold px-6 py-3 text-sm font-bold text-[#101410] transition-transform hover:scale-[1.04]">
            Book a window seat →
          </a>
        </div>
      </div>
    </section>
  );
}
