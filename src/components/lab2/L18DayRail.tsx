"use client";

/* L18 — "The Rail" (itinerary section)
   Pinned horizontal itinerary: six tall day-panels glide past while a
   giant ghost day-counter flips behind them and a progress rail lights
   each completed day. Scroll down, travel sideways. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const DAYS = [
  { img: "himalaya-sunrise", title: "Fly in & acclimatise", meta: "Leh · 3,500 m" },
  { img: "ladakh", title: "Sham Valley loop", meta: "Magnetic Hill · Sangam" },
  { img: "spiti", title: "Khardung La push", meta: "5,359 m · prayer flags" },
  { img: "camp-tents", title: "Nubra dunes & camp", meta: "Hunder · double-humps" },
  { img: "stars", title: "Pangong overnight", meta: "4,225 m · zero light" },
  { img: "group-mountains", title: "The long goodbye", meta: "Leh · fly out" },
];

export default function L18DayRail() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const track = trackRef.current;
      const section = ref.current;
      if (!track || !section) return;
      const amount = () => track.scrollWidth - window.innerWidth;
      let cur = -1;
      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: section, start: "top top", end: () => `+=${amount()}`,
          scrub: 0.45, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(DAYS.length - 1, Math.floor(self.progress * DAYS.length));
            if (idx !== cur) { cur = idx; setActive(idx); }
          },
        },
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#101013]">
      <div className="flex h-screen flex-col justify-center">
        {/* ghost counter */}
        <p aria-hidden="true" key={active} className="pointer-events-none absolute right-[4vw] top-[6vh] animate-[fadeUp_.45s_ease-out] font-display text-[26vh] font-extrabold leading-none text-white/[0.06]">
          {String(active + 1).padStart(2, "0")}
        </p>

        <div className="mx-auto mb-7 w-full max-w-7xl px-5 sm:px-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">leh–ladakh · day by day</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Six days, <span className="text-gold">sideways.</span>
          </h2>
          {/* progress rail */}
          <div className="mt-5 flex items-center gap-2" aria-hidden="true">
            {DAYS.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-gold" : "bg-white/12"}`} />
            ))}
          </div>
        </div>

        <div ref={trackRef} className="flex w-max gap-5 px-5 will-change-transform sm:px-8">
          {DAYS.map((d, i) => (
            <article key={d.img} className={`relative h-[56vh] w-[74vw] shrink-0 overflow-hidden rounded-3xl transition-all duration-500 sm:w-[26rem] ${i === active ? "opacity-100" : "opacity-55"}`}>
              <Image src={`/images/${d.img}.jpg`} alt={d.title} fill sizes="(max-width:640px) 80vw, 30rem" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/10" aria-hidden="true" />
              <span className="absolute left-5 top-5 rounded-full bg-white/12 px-4 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                Day {String(i + 1).padStart(2, "0")}
              </span>
              <div className="absolute bottom-0 w-full p-6">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">{d.meta}</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">{d.title}</h3>
              </div>
            </article>
          ))}
          {/* terminal card */}
          <div className="flex h-[56vh] w-[70vw] shrink-0 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gold/35 text-center sm:w-[22rem]">
            <p className="font-script text-3xl text-gold">day seven?</p>
            <p className="mt-2 max-w-[16rem] font-display text-2xl font-extrabold text-white">That&apos;s the one where you book the next trip.</p>
            <a href="#" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3.5 font-bold text-[#101013] transition-transform hover:scale-[1.04]">
              Restart the loop →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
