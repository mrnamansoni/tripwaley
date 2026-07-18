"use client";

import { useEffect, useState } from "react";
import { NEXT_DEPARTURE, waLink } from "@/lib/data";
import { useBooking } from "@/components/booking/BookingContext";

interface Remaining {
  d: number;
  h: number;
  m: number;
  s: number;
}

function remainingTo(iso: string): Remaining {
  const diff = Math.max(0, new Date(iso).getTime() - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor(diff / 3_600_000) % 24,
    m: Math.floor(diff / 60_000) % 60,
    s: Math.floor(diff / 1_000) % 60,
  };
}

export default function CTABand() {
  const { open } = useBooking();
  // null until mounted → server and first client render match (no hydration diff)
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setLeft(remainingTo(NEXT_DEPARTURE.iso));
    // first update lands a frame after mount → hydration-safe, no sync setState
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const cells: [string, number | null][] = [
    ["days", left?.d ?? null],
    ["hrs", left?.h ?? null],
    ["min", left?.m ?? null],
    ["sec", left?.s ?? null],
  ];

  return (
    <section id="cta" className="noise relative overflow-hidden bg-gradient-to-br from-brand via-[#b8161b] to-[#8f1216]">
      {/* faint giant sun for depth */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <p className="font-script text-3xl text-gold sm:text-4xl">abhi nahi toh kabhi nahi ✦</p>
        <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Seats fill fast. Yours shouldn&apos;t be the empty one.
        </h2>

        {/* live countdown to the next flagship departure */}
        <div className="mt-9 inline-flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            {NEXT_DEPARTURE.trip} departs in
          </p>
          <div className="mt-3 flex items-center gap-2.5 sm:gap-3" role="timer" aria-label="Countdown to next departure">
            {cells.map(([label, value], i) => (
              <div key={label} className="flex items-center gap-2.5 sm:gap-3">
                {i > 0 && <span className="font-display text-2xl font-bold text-white/40" aria-hidden="true">:</span>}
                <div className="flex w-[4.2rem] flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-sm sm:w-20 sm:py-4">
                  <span className="font-display text-3xl font-extrabold tabular-nums text-white sm:text-4xl">
                    {value === null ? "--" : String(value).padStart(2, "0")}
                  </span>
                  <span className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/60">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gold backdrop-blur-sm">
            <span className="animate-live h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
            only {NEXT_DEPARTURE.seatsLeft} seats left on this batch
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          <button
            onClick={() => open("hold", "ladakh")}
            className="w-full min-h-13 rounded-full bg-white px-8 py-4 text-base font-bold text-brand shadow-card-lg transition-all hover:bg-cream active:scale-[0.97] sm:w-auto"
          >
            Hold my seat — free for 24h
          </button>
          <button
            onClick={() => open("token", "ladakh")}
            className="w-full min-h-13 rounded-full border-2 border-white/40 px-8 py-[0.9rem] text-base font-bold text-white transition-all hover:border-white hover:bg-white/10 active:scale-[0.97] sm:w-auto"
          >
            Pay ₹2,000 token & book
          </button>
        </div>
        <a
          href={waLink("Hi! I have a question before booking the Ladakh 12 Jul batch 🙋")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block text-sm font-semibold text-white/75 underline decoration-white/40 decoration-2 underline-offset-4 transition-colors hover:text-white"
        >
          Questions? WhatsApp a trip captain →
        </a>
      </div>
    </section>
  );
}
