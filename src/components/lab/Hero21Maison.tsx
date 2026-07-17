"use client";

/* HERO 21 — "The Maison"
   Aman-school quiet luxury: full-bleed environment photography with a slow
   Ken Burns drift, sparse serif type, hairline rules, unhurried crossfades.
   The most expensive thing on a page is restraint. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SCENES = [
  { src: "/images/kashmir.jpg", place: "Dal Lake, Kashmir", line: "Where mornings arrive by shikara" },
  { src: "/images/himalaya-sunrise.jpg", place: "Above the clouds", line: "Six passes. One long exhale" },
  { src: "/images/kerala.jpg", place: "Alleppey, Kerala", line: "The slowest hour of your year" },
];

const HOLD_MS = 5200;

export default function Hero21Maison() {
  const ref = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setIdx((v) => (v + 1) % SCENES.length), HOLD_MS);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-mai-reveal]",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1.4, ease: "power3.out", stagger: 0.16, scrollTrigger: { trigger: ref.current, start: "top 62%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  /* caption crossfade per scene */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-mai-caption]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [idx]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-coal">
      {/* slow crossfading environments with Ken Burns drift */}
      {SCENES.map((s, i) => (
        <div
          key={s.src}
          className="absolute inset-0 transition-opacity duration-[2400ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
          aria-hidden={i !== idx}
        >
          <Image
            src={s.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === idx ? "animate-[maisonDrift_9s_ease-out_forwards]" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-coal/55 via-transparent to-coal/70" aria-hidden="true" />

      {/* chrome: hairline frame + tiny caps */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-5 border border-white/20 sm:inset-9" />
      <p data-mai-reveal className="absolute left-1/2 top-9 -translate-x-1/2 text-[0.6rem] font-semibold uppercase tracking-[0.55em] text-white/75 sm:top-14">
        Tripwaley · Est. MMXIX
      </p>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p data-mai-reveal className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
          Private group departures
        </p>
        <h1
          data-mai-reveal
          className="mt-6 max-w-4xl text-5xl font-light leading-[1.08] text-white sm:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          India, at the
          <br />
          <em className="font-normal italic text-[#e8d5b5]">unhurried</em> pace
        </h1>
        <span data-mai-reveal className="mt-8 h-px w-24 bg-gold/70" aria-hidden="true" />
        <p data-mai-reveal className="mt-8 max-w-md text-sm leading-relaxed text-white/70">
          Fifteen guests. One captain. Routes composed like tasting menus —
          Ladakh to the backwaters, every detail already considered.
        </p>
        <div data-mai-reveal className="mt-10 flex items-center gap-8">
          <a
            href="#"
            className="border border-gold/80 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-coal"
          >
            Reserve passage
          </a>
          <a href="#" className="text-[0.68rem] font-bold uppercase tracking-[0.35em] text-white/70 underline decoration-white/30 underline-offset-8 transition-colors hover:text-white">
            The journeys
          </a>
        </div>
      </div>

      {/* scene caption + index, bottom corners */}
      <div className="absolute bottom-9 left-9 hidden sm:block" key={idx}>
        <p data-mai-caption className="text-[0.62rem] font-semibold uppercase tracking-[0.4em] text-white/80">
          {SCENES[idx].place}
        </p>
        <p data-mai-caption className="mt-1 text-sm italic text-white/60" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          {SCENES[idx].line}
        </p>
      </div>
      <div className="absolute bottom-9 right-9 hidden items-center gap-3 sm:flex" aria-hidden="true">
        {SCENES.map((_, i) => (
          <span key={i} className={`h-px transition-all duration-700 ${i === idx ? "w-10 bg-gold" : "w-4 bg-white/30"}`} />
        ))}
      </div>
    </section>
  );
}
