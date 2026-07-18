"use client";

/* L35 — "Reviews, Constellated" (social proof)
   Every five-star review is a star; together they form a constellation
   that draws its own connecting lines as you arrive. Hover a star and its
   review glows in — astronomy as testimonial wall. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

const STARS = [
  { x: 12, y: 30, q: "Cried at the sunrise. No regrets.", name: "Tanya · Kedarkantha" },
  { x: 26, y: 58, q: "Best ₹17k I've ever spent, and I own an air fryer.", name: "Vikram · Meghalaya" },
  { x: 38, y: 22, q: "The captain carried my bag AND my ego.", name: "Sara · Spiti" },
  { x: 52, y: 44, q: "14 strangers. 0 awkward silences after day 1.", name: "Aditya · Ladakh" },
  { x: 66, y: 18, q: "Mum-approved. That's the highest tier.", name: "Nikita · Kerala" },
  { x: 78, y: 52, q: "Saw the Milky Way. Quit my gym. Unrelated.", name: "Farhan · Chopta" },
  { x: 90, y: 28, q: "Already rebooked for December.", name: "Leah · Kashmir" },
];

export default function L35StarMap() {
  const ref = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const len = line.getTotalLength();
    const ctx = gsap.context(() => {
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top 60%", end: "70% 60%", scrub: 0.5 },
      });
      gsap.fromTo("[data-l35-star]", { scale: 0 }, {
        scale: 1, duration: 0.5, ease: "back.out(2.6)", stagger: 0.09,
        scrollTrigger: { trigger: ref.current, start: "top 58%" },
      });
      gsap.fromTo("[data-l35-head]", { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 64%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const current = hover !== null ? STARS[hover] : null;

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#0b0e18] py-[13vh]">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <Eyebrow tone="gold">the review sky · hover a star</Eyebrow>
        <h2 data-l35-head className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          4.9, written in <span className="text-gold">stars.</span>
        </h2>
      </div>

      {/* the sky */}
      <div className="relative mx-auto mt-10 h-[26rem] w-full max-w-5xl px-5">
        <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <polyline
            ref={lineRef}
            points={STARS.map((s) => `${s.x},${s.y}`).join(" ")}
            fill="none" stroke="rgba(245,163,26,0.5)" strokeWidth="0.22"
          />
        </svg>
        {STARS.map((s, i) => (
          <button
            key={i}
            type="button"
            data-l35-star
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`Review by ${s.name}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <span className={`block h-3.5 w-3.5 rotate-45 rounded-[2px] transition-all duration-300 ${hover === i ? "scale-[1.8] bg-gold shadow-[0_0_24px_rgba(245,163,26,0.9)]" : "bg-[#dfe6ff] shadow-[0_0_10px_rgba(223,230,255,0.7)]"}`} />
          </button>
        ))}
        {/* ambient dust */}
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute h-px w-px rounded-full bg-white/60"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 100}%`, opacity: 0.2 + ((i * 13) % 10) / 20 }}
          />
        ))}
      </div>

      {/* the reading */}
      <div className="mx-auto mt-4 flex min-h-28 max-w-xl items-center justify-center px-5 text-center">
        {current ? (
          <blockquote key={hover} className="animate-[fadeUp_.35s_ease-out]">
            <p className="font-display text-xl font-bold text-white sm:text-2xl">&ldquo;{current.q}&rdquo;</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">{current.name}</p>
          </blockquote>
        ) : (
          <p className="text-sm text-white/40">each star is a verified five-star review — touch one</p>
        )}
      </div>
    </section>
  );
}
