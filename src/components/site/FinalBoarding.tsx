"use client";

/* FINAL BOARDING — lab L27 wired to real data.
   Flip-clock counts down to the actual next departure from the visitor's
   city; the seat map pulses a few free seats (deterministic per trip, so it
   doesn't reshuffle on every render). CTA goes straight to that trip. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCity } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";

export interface BoardingRow {
  date: string; // ISO yyyy-mm-dd
  slug: string;
  name: string;
  citySlugs: string[];
  fromPrices: Record<string, number>;
}

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
      className="relative inline-flex h-12 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#171513] font-mono text-2xl font-bold text-gold shadow-[inset_0_-3px_6px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.06)] transition-transform duration-150 sm:h-20 sm:w-14 sm:text-5xl"
      style={{ transform: flip ? "rotateX(80deg)" : "rotateX(0deg)", transformOrigin: "center 60%" }}
    >
      {cur}
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
    </span>
  );
}

/** deterministic seat-map layout per trip slug */
function takenSeats(slug: string, total: number, free: number): Set<number> {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const freeIdx = new Set<number>();
  while (freeIdx.size < free) {
    h = (h * 1103515245 + 12345) >>> 0;
    freeIdx.add(h % total);
  }
  const taken = new Set<number>();
  for (let i = 0; i < total; i++) if (!freeIdx.has(i)) taken.add(i);
  return taken;
}

export default function FinalBoarding({
  rows,
  headline = "Seats melt.",
  accent = "Clock's honest.",
  sub = "This is the real clock to the next batch leaving your city.",
}: {
  rows: BoardingRow[];
  headline?: string;
  accent?: string;
  sub?: string;
}) {
  const { city } = useCity();
  const [now, setNow] = useState(0); // 0 until mounted (SSR-safe)
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const next = useMemo(() => {
    const mine = rows.filter((r) => r.citySlugs.includes(city.slug));
    const pool = mine.length ? mine : rows;
    return pool.slice().sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }, [rows, city.slug]);

  if (!next) return null;
  const price = next.fromPrices[city.slug] ?? Object.values(next.fromPrices)[0];

  const target = new Date(`${next.date}T06:00:00+05:30`).getTime();
  const left = Math.max(0, Math.floor((target - (now || target)) / 1000));
  const dd = String(Math.min(99, Math.floor(left / 86400))).padStart(2, "0");
  const hh = String(Math.floor((left % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const TOTAL = 24;
  const FREE = 4;
  const taken = takenSeats(next.slug, TOTAL, FREE);

  return (
    <section className="noise bg-[#0e0c0a] py-[11vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-gold">
            {next.name.slice(0, 28)} · {weekday(next.date)} {shortDate(next.date)} · ex-{city.name}
          </p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl">
            {headline}
            <br />
            <span className="text-gold">{accent}</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/55">{sub}</p>

          {/* the clock — DD : HH : MM : SS */}
          <div className="mt-8 flex items-center gap-1.5 sm:gap-2.5">
            <FlipDigit ch={dd[0]} /><FlipDigit ch={dd[1]} />
            <span className="font-mono text-2xl font-bold text-gold/70 sm:text-5xl">:</span>
            <FlipDigit ch={hh[0]} /><FlipDigit ch={hh[1]} />
            <span className="font-mono text-2xl font-bold text-gold/70 sm:text-5xl">:</span>
            <FlipDigit ch={mm[0]} /><FlipDigit ch={mm[1]} />
            <span className="hidden font-mono text-5xl font-bold text-gold/70 sm:inline">:</span>
            <span className="hidden sm:contents"><FlipDigit ch={ss[0]} /><FlipDigit ch={ss[1]} /></span>
          </div>
          <p className="mt-2 text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/40">days · hours · min<span className="hidden sm:inline"> · sec</span></p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={`/trips/${next.slug}`} className="inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-3.5 font-extrabold text-[#0e0c0a] shadow-card-lg transition-transform hover:scale-[1.04]">
              {price ? `Lock ${inr(price)} now` : "Hold my seat"}
            </Link>
            <p className="text-xs text-white/45">hold is free · cancel in one tap</p>
          </div>
        </div>

        {/* seat map */}
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-white">TW-701 · Tempo</p>
            <p className="font-mono text-[0.62rem] text-gold">{FREE} SEATS LEFT</p>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2.5 sm:gap-3">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isTaken = taken.has(i);
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`flex h-10 items-center justify-center rounded-lg rounded-t-2xl text-[0.58rem] font-bold sm:h-11 ${
                    isTaken ? "bg-white/8 text-white/25" : "animate-pulse bg-brand text-white shadow-red"
                  }`}
                >
                  {isTaken ? "" : "FREE"}
                </span>
              );
            })}
          </div>
          <p className="mt-5 text-center text-[0.62rem] uppercase tracking-[0.25em] text-white/35">
            front row goes first · every batch
          </p>
        </div>
      </div>
    </section>
  );
}
