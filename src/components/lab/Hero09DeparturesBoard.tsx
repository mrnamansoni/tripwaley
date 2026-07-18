"use client";

/* HERO 09 — "Departures Board"
   Airport split-flap romance: an amber-on-black departures board where the
   rows flip through live Tripwaley batches. Monospace, blinking statuses. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

interface Row {
  time: string;
  dest: string;
  batch: string;
  price: string;
  status: string;
  urgent?: boolean;
}

const ROWS: Row[] = [
  { time: "05:40", dest: "LEH — LADAKH", batch: "TW-701", price: "₹24,999", status: "3 SEATS", urgent: true },
  { time: "06:15", dest: "SPITI VALLEY", batch: "TW-702", price: "₹18,999", status: "BOARDING" },
  { time: "07:00", dest: "KASHMIR", batch: "TW-703", price: "₹21,999", status: "ON TIME" },
  { time: "08:30", dest: "MEGHALAYA", batch: "TW-704", price: "₹17,999", status: "ON TIME" },
  { time: "09:10", dest: "KERALA", batch: "TW-705", price: "₹16,999", status: "BOARDING" },
  { time: "11:45", dest: "ANDAMAN", batch: "TW-706", price: "₹28,999", status: "6 SEATS", urgent: true },
];

/** flips a row over rotateX when its content changes */
function FlapRow({ row, delay }: { row: Row; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // periodic re-flip: the board feels alive
    const iv = setInterval(() => {
      gsap.fromTo(el, { rotateX: -88, opacity: 0.4 }, { rotateX: 0, opacity: 1, duration: 0.55, ease: "power3.out" });
    }, 6200 + delay * 900);
    return () => clearInterval(iv);
  }, [delay]);

  return (
    <div style={{ perspective: "600px" }}>
      <div
        ref={ref}
        className="grid grid-cols-[3.4rem_1fr_auto] items-center gap-3 border-b border-white/8 py-3 font-mono text-[0.8rem] tracking-wider sm:grid-cols-[4.5rem_1fr_5.5rem_6rem_6.5rem] sm:text-base"
        style={{ transformOrigin: "50% 0%" }}
      >
        <span className="text-gold/90">{row.time}</span>
        <span className="truncate font-bold text-white">{row.dest}</span>
        <span className="hidden text-white/45 sm:block">{row.batch}</span>
        <span className="hidden text-gold/90 sm:block">{row.price}</span>
        <span className={`text-right font-bold ${row.urgent ? "animate-live text-brand-bright" : "text-success"}`}>
          {row.status}
        </span>
      </div>
    </div>
  );
}

export default function Hero09DeparturesBoard() {
  const ref = useRef<HTMLElement>(null);
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const iv = setInterval(() => {
      setClock(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    }, 1000);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-db-row]",
        { rotateX: -90, autoAlpha: 0 },
        {
          rotateX: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: ref.current, start: "top 60%" },
        }
      );
      gsap.fromTo(
        "[data-db-copy]",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 65%" } }
      );
    }, ref);

    return () => {
      clearInterval(iv);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden bg-coal py-24">
      {/* scanline sheen */}
      <div aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_3px,rgba(255,255,255,0.012)_4px)]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p data-db-copy className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-gold">
            Terminal TW · all departures guaranteed
          </p>
          <h1 data-db-copy className="mt-5 font-display text-5xl font-extrabold leading-[1.0] tracking-tight text-white sm:text-7xl">
            Now boarding:
            <br />
            your <span className="text-gold">next story.</span>
          </h1>
          <p data-db-copy className="mt-6 max-w-sm text-base leading-relaxed text-white/55">
            Fixed dates that actually depart. No &ldquo;trip cancelled, group too
            small&rdquo; heartbreak — if it&apos;s on the board, it flies.
          </p>
          <div data-db-copy className="mt-9 flex flex-wrap gap-4">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Grab a boarding pass
            </a>
            <a href="#" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-7 py-3.5 font-bold text-white/85 transition-colors hover:border-gold hover:text-gold">
              Full schedule
            </a>
          </div>
        </div>

        {/* the board */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-card-lg sm:p-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/40">
            <span>Departures — July 2026</span>
            <span className="text-gold tabular-nums">{clock} IST</span>
          </div>
          <div className="mt-1">
            {ROWS.map((r, i) => (
              <div key={r.batch} data-db-row>
                <FlapRow row={r} delay={i} />
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
            <span className="animate-live inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            live · seats update every hour · whatsapp for standby
          </p>
        </div>
      </div>
    </section>
  );
}
