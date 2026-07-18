"use client";

/* L28 — "The Chant" (CTA)
   Three lanes of giant type streaming in opposite directions — a stadium
   chant for leaving town. Hovering a lane snaps it to a stop and floods it
   red; the pill CTA floats above the noise. */

import { useState } from "react";
import { useEntrance } from "./shared";

const LANES = [
  { text: "PACK YOUR BAGS · PACK YOUR BAGS · PACK YOUR BAGS · ", reverse: false, dur: 26 },
  { text: "LEAVE THE CITY · LEAVE THE CITY · LEAVE THE CITY · ", reverse: true, dur: 32 },
  { text: "BOOK THE DAMN TRIP · BOOK THE DAMN TRIP · ", reverse: false, dur: 22 },
];

export default function L28MarqueeCta() {
  const ref = useEntrance<HTMLElement>();
  const [hot, setHot] = useState<number | null>(null);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink py-[13vh]">
      <div className="space-y-3">
        {LANES.map((lane, i) => (
          <div
            key={i}
            data-in
            onMouseEnter={() => setHot(i)}
            onMouseLeave={() => setHot(null)}
            className={`select-none whitespace-nowrap transition-colors duration-400 ${hot === i ? "bg-brand" : "bg-transparent"}`}
          >
            <div
              className={`marquee-track inline-flex ${lane.reverse ? "marquee-reverse" : ""}`}
              style={{ "--marquee-duration": `${lane.dur}s`, animationPlayState: hot === i ? "paused" : "running" } as React.CSSProperties}
            >
              {[0, 1].map((copy) => (
                <span
                  key={copy}
                  aria-hidden={copy === 1}
                  className={`pr-4 font-display text-[clamp(2.6rem,7vw,6rem)] font-extrabold leading-[1.06] tracking-tight transition-colors duration-400 ${
                    hot === i ? "text-white" : "text-transparent"
                  }`}
                  style={hot === i ? undefined : { WebkitTextStroke: "1.5px rgba(246,236,215,0.55)" }}
                >
                  {lane.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* the pill above the chant */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <a
          data-in
          href="#"
          className="pointer-events-auto inline-flex min-h-14 items-center gap-3 rounded-full bg-gold px-10 py-5 text-lg font-extrabold text-ink shadow-[0_20px_60px_rgba(245,163,26,0.45)] transition-transform hover:scale-[1.06]"
        >
          Okay, okay — I&apos;m going →
        </a>
      </div>

      <p className="mt-10 text-center text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/35">
        hover a lane to stop the chant · it won&apos;t stop wanting
      </p>
    </section>
  );
}
