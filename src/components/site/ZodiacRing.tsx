"use client";

/* THE ZODIAC — lab L13 wired to the real regions.
   Regions orbit a spinning ring of circular type; each photo counter-rotates
   to stay upright. Tap/hover holds the sky and links to that region below. */

import { useState } from "react";
import Image from "next/image";

export interface ZodiacItem {
  img: string;
  label: string;
  href: string; // in-page anchor to the region section
}

export default function ZodiacRing({
  items,
  headline = "Wherever it stops,",
  accent = "you win.",
  sub = "Every region in constant orbit.",
  ringText = "TRIPWALEY · 14 STATES · 350 DEPARTURES · ONE CREW ·",
}: {
  items: ZodiacItem[];
  headline?: string;
  accent?: string;
  sub?: string;
  ringText?: string;
}) {
  const [held, setHeld] = useState<string | null>(null);
  if (items.length < 3) return null;

  return (
    <section className="overflow-hidden bg-cream py-[10vh]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the wheel of wander</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            {headline}
            <br />
            <span className="text-brand">{accent}</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/60">{sub}</p>
          <p className="mt-6 min-h-9 font-script text-2xl text-brand">
            {held ? `${held}. good choice.` : "spin the wheel →"}
          </p>
        </div>

        {/* the orbit */}
        <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
          <svg viewBox="0 0 200 200" className="absolute inset-[19%] animate-[l13spin_30s_linear_infinite]" style={{ animationPlayState: held ? "paused" : "running" }} aria-hidden="true">
            <defs>
              <path id="zr-circ" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
            </defs>
            <text fill="#c9252c" fontSize="13.5" fontWeight="700" letterSpacing="3.5" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              <textPath href="#zr-circ">{ringText}</textPath>
            </text>
          </svg>

          <div className="absolute inset-0 animate-[l13spin_30s_linear_infinite]" style={{ animationPlayState: held ? "paused" : "running" }}>
            {items.map((it, i) => {
              const ang = (i / items.length) * Math.PI * 2;
              const x = 50 + 46 * Math.cos(ang);
              const y = 50 + 46 * Math.sin(ang);
              return (
                <div key={it.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                  <div className="animate-[l13counter_30s_linear_infinite]" style={{ animationPlayState: held ? "paused" : "running" }}>
                    <a
                      href={it.href}
                      aria-label={`Jump to ${it.label}`}
                      onMouseEnter={() => setHeld(it.label)}
                      onMouseLeave={() => setHeld(null)}
                      onFocus={() => setHeld(it.label)}
                      onBlur={() => setHeld(null)}
                      className="relative block h-20 w-20 overflow-hidden rounded-full border-[3px] border-cream shadow-card-lg outline-offset-4 transition-transform duration-300 hover:scale-125 sm:h-24 sm:w-24"
                    >
                      <Image src={it.img} alt={it.label} fill sizes="96px" className="object-cover" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand shadow-red">
            <span className="font-script text-2xl text-white">go</span>
          </div>
        </div>
      </div>
    </section>
  );
}
