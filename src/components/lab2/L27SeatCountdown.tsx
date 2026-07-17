"use client";

/* L27 — "Final Boarding" (CTA)
   Scarcity, staged like an airport: mechanical flip-clock digits counting
   down to the fare lock, a seat map with the last three seats pulsing,
   and one gold button to end the suspense. */

import { useEffect, useRef, useState } from "react";
import { useEntrance, Eyebrow } from "./shared";

const DEADLINE_MIN = 47; // demo countdown length

function FlipDigit({ ch }: { ch: string }) {
  const [cur, setCur] = useState(ch);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (ch === cur) return;
    const t1 = setTimeout(() => setFlip(true), 0);
    const t2 = setTimeout(() => { setCur(ch); setFlip(false); }, 150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ch, cur]);

  return (
    <span
      className="relative inline-flex h-16 w-11 items-center justify-center overflow-hidden rounded-lg bg-[#171513] font-mono text-4xl font-bold text-gold shadow-[inset_0_-3px_6px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.06)] transition-transform duration-150 sm:h-20 sm:w-14 sm:text-5xl"
      style={{ transform: flip ? "rotateX(80deg)" : "rotateX(0deg)", transformOrigin: "center 60%" }}
    >
      {cur}
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
    </span>
  );
}

export default function L27SeatCountdown() {
  const ref = useEntrance<HTMLElement>();
  const [left, setLeft] = useState(DEADLINE_MIN * 60);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const iv = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const TAKEN = new Set([0, 1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18, 19, 20, 22, 23]);

  return (
    <section ref={ref} className="noise bg-[#0e0c0a] py-[13vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <Eyebrow tone="gold">ladakh · 12 jul · fare lock</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl">
            Three seats.
            <br />
            <span className="text-gold">One clock.</span>
          </h2>
          <p data-in className="mt-5 max-w-sm text-base leading-relaxed text-white/55">
            When the flip-clock hits zero, this price re-files its paperwork.
            The seats don&apos;t wait for group consensus.
          </p>

          {/* the clock */}
          <div data-in className="mt-8 flex items-center gap-2.5">
            <FlipDigit ch={mm[0]} />
            <FlipDigit ch={mm[1]} />
            <span className="animate-pulse font-mono text-4xl font-bold text-gold/70 sm:text-5xl">:</span>
            <FlipDigit ch={ss[0]} />
            <FlipDigit ch={ss[1]} />
            <span className="ml-2 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/40">min · sec</span>
          </div>

          <div data-in className="mt-9 flex flex-wrap items-center gap-5">
            <a href="#" className="inline-flex min-h-13 items-center rounded-full bg-gold px-9 py-4 font-extrabold text-[#0e0c0a] shadow-card-lg transition-transform hover:scale-[1.04]">
              Lock ₹24,999 now
            </a>
            <p className="text-xs text-white/45">hold is free · cancel in one tap</p>
          </div>
        </div>

        {/* seat map */}
        <div data-in className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-white">TW-701 · Tempo</p>
            <p className="font-mono text-[0.62rem] text-gold">3 SEATS LEFT</p>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {Array.from({ length: 24 }).map((_, i) => {
              const taken = TAKEN.has(i);
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`flex h-11 items-center justify-center rounded-lg rounded-t-2xl text-[0.6rem] font-bold ${
                    taken ? "bg-white/8 text-white/25" : "animate-pulse bg-brand text-white shadow-red"
                  }`}
                >
                  {taken ? "" : "FREE"}
                </span>
              );
            })}
          </div>
          <p className="mt-5 text-center text-[0.62rem] uppercase tracking-[0.25em] text-white/35">
            front row went 40 minutes ago
          </p>
        </div>
      </div>
    </section>
  );
}
