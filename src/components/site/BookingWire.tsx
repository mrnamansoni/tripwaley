"use client";

/* THE WIRE — lab L34 wired to admin-curated entries (no real customer data).
   Entries spring in at the top every few seconds; the stack breathes down. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { WireEntry } from "@/lib/types";

const hueOf = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};

export default function BookingWire({
  entries,
  headline = "Somebody books",
  accent = "every few minutes.",
  sub = "The booking wire, slightly delayed so nobody's boss sees them planning.",
}: {
  entries: WireEntry[];
  headline?: string;
  accent?: string;
  sub?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<(WireEntry & { id: number })[]>(
    entries.slice(0, 3).map((w, i) => ({ ...w, id: i }))
  );
  const counter = useRef(3);

  /* cycle only while on screen — no background timers */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || entries.length === 0) return;
    let iv: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !iv) {
        iv = setInterval(() => {
          const next = entries[counter.current % entries.length];
          const id = counter.current++;
          setItems((prev) => [{ ...next, id }, ...prev].slice(0, 4));
        }, 3200);
      } else if (!e.isIntersecting && iv) {
        clearInterval(iv);
        iv = null;
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { if (iv) clearInterval(iv); io.disconnect(); };
  }, [entries]);

  useEffect(() => {
    const first = listRef.current?.firstElementChild;
    if (first) {
      gsap.fromTo(first, { autoAlpha: 0, y: -26, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.7)" });
    }
  }, [items]);

  return (
    <section ref={sectionRef} className="bg-cream py-[10vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the wire · unedited</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            {headline}
            <br />
            <span className="text-brand">{accent}</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/60">{sub}</p>
        </div>

        <div className="rounded-3xl border border-line bg-card p-5 shadow-card-lg sm:p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-ink">Live bookings</p>
            <span className="inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-wider text-success">
              <span className="animate-live h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              on air
            </span>
          </div>
          <div ref={listRef} className="mt-4 space-y-3">
            {items.map((w) => (
              <div key={w.id} className="flex items-center gap-3.5 rounded-2xl border border-line bg-cream px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white" style={{ backgroundColor: `hsl(${hueOf(w.name)} 55% 45%)` }}>
                  {w.name.charAt(0)}
                </span>
                <p className="min-w-0 text-sm leading-snug text-ink/80">
                  <strong className="text-ink">{w.name}</strong> from {w.city} {w.act}{" "}
                  <strong className="text-brand">{w.trip}</strong>
                </p>
                <span className="ml-auto shrink-0 text-[0.58rem] font-semibold uppercase text-ink/35">now</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
