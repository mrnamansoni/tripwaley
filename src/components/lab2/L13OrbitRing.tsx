"use client";

/* L13 — "The Zodiac" (destination showcase)
   Eight destinations orbit a spinning ring of circular type. Each photo
   counter-rotates to stay upright as the wheel turns; hovering one halts
   the sky and names it. */

import { useState } from "react";
import Image from "next/image";
import { useEntrance, Eyebrow } from "./shared";

const ORBIT = [
  "ladakh", "kerala", "rajasthan", "meghalaya", "andaman", "kashmir", "spiti", "rishikesh",
];

export default function L13OrbitRing() {
  const ref = useEntrance<HTMLElement>();
  const [held, setHeld] = useState<string | null>(null);

  return (
    <section ref={ref} className="overflow-hidden bg-cream py-[12vh]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Eyebrow>the wheel of wander</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            Wherever it stops,
            <br />
            <span className="text-brand">you win.</span>
          </h2>
          <p data-in className="mt-5 max-w-sm text-base leading-relaxed text-ink/60">
            Eight departures in constant orbit. Hover one to hold the sky
            still — it&apos;ll tell you where it&apos;s taking you.
          </p>
          <p data-in className="mt-6 font-script text-2xl text-brand min-h-9">
            {held ? `${held}. good choice.` : "spin the wheel →"}
          </p>
        </div>

        {/* the orbit */}
        <div data-in className="relative mx-auto aspect-square w-full max-w-[34rem]">
          {/* circular type */}
          <svg viewBox="0 0 200 200" className="absolute inset-[19%] animate-[l13spin_30s_linear_infinite] [animation-play-state:inherit]" aria-hidden="true">
            <defs>
              <path id="l13-circ" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
            </defs>
            <text fill="#c9252c" fontSize="13.5" fontWeight="700" letterSpacing="3.5" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              <textPath href="#l13-circ">TRIPWALEY · 14 STATES · 350 DEPARTURES · ONE CREW ·</textPath>
            </text>
          </svg>

          {/* orbiting photos: wheel spins, each thumb counter-spins to stay upright */}
          <div className="absolute inset-0 animate-[l13spin_30s_linear_infinite]" style={{ animationPlayState: held ? "paused" : "running" }}>
            {ORBIT.map((img, i) => {
              const ang = (i / ORBIT.length) * Math.PI * 2;
              const x = 50 + 46 * Math.cos(ang);
              const y = 50 + 46 * Math.sin(ang);
              return (
                <div
                  key={img}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="animate-[l13counter_30s_linear_infinite]" style={{ animationPlayState: held ? "paused" : "running" }}>
                    <button
                      type="button"
                      onMouseEnter={() => setHeld(img.charAt(0).toUpperCase() + img.slice(1))}
                      onMouseLeave={() => setHeld(null)}
                      onFocus={() => setHeld(img.charAt(0).toUpperCase() + img.slice(1))}
                      onBlur={() => setHeld(null)}
                      className="relative block h-20 w-20 overflow-hidden rounded-full border-[3px] border-cream shadow-card-lg outline-offset-4 transition-transform duration-300 hover:scale-125 sm:h-24 sm:w-24"
                    >
                      <Image src={`/images/${img}.jpg`} alt={img} fill sizes="96px" className="object-cover" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* hub */}
          <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand shadow-red">
            <span className="font-script text-2xl text-white">go</span>
          </div>
        </div>
      </div>
    </section>
  );
}
