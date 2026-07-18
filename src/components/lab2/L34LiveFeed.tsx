"use client";

/* L34 — "The Wire" (social proof)
   A live booking wire: entries spring in at the top every few seconds,
   the stack breathes down, old news fades off the bottom. The site feels
   inhabited — because it is. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

const WIRE = [
  { name: "Sneha", city: "Pune", act: "held a seat on", trip: "Ladakh · 12 Jul", hue: 340 },
  { name: "Kabir", city: "Delhi", act: "just booked", trip: "Spiti · 19 Jul", hue: 210 },
  { name: "Ishita", city: "Mumbai", act: "joined the waitlist for", trip: "Andaman · Aug", hue: 160 },
  { name: "Dev", city: "Bengaluru", act: "paid the balance for", trip: "Kashmir · 26 Jul", hue: 25 },
  { name: "Mira", city: "Jaipur", act: "just booked", trip: "Meghalaya · 2 Aug", hue: 280 },
  { name: "Aarav", city: "Kochi", act: "held a seat on", trip: "Rishikesh · 15 Jul", hue: 95 },
];

export default function L34LiveFeed() {
  const ref = useEntrance<HTMLElement>();
  const listRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<(typeof WIRE[number] & { id: number })[]>(
    WIRE.slice(0, 3).map((w, i) => ({ ...w, id: i }))
  );
  const counter = useRef(3);

  useEffect(() => {
    const iv = setInterval(() => {
      const next = WIRE[counter.current % WIRE.length];
      const id = counter.current++;
      setItems((prev) => [{ ...next, id }, ...prev].slice(0, 4));
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const first = listRef.current?.firstElementChild;
    if (first) {
      gsap.fromTo(first, { autoAlpha: 0, y: -26, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.7)" });
    }
  }, [items]);

  return (
    <section ref={ref} className="bg-cream py-[12vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <Eyebrow>the wire · unedited</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            Somebody books
            <br />
            <span className="text-brand">every 4 minutes.</span>
          </h2>
          <p data-in className="mt-5 max-w-sm text-base leading-relaxed text-ink/60">
            This isn&apos;t a marquee of made-up names — it&apos;s the booking wire,
            slightly delayed so nobody&apos;s boss sees them planning.
          </p>
          <div data-in className="mt-7 flex items-center gap-6">
            <div>
              <p className="font-display text-3xl font-extrabold text-brand">1,214</p>
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-ink/45">seats this month</p>
            </div>
            <div className="h-10 w-px bg-line" aria-hidden="true" />
            <div>
              <p className="font-display text-3xl font-extrabold text-brand">38s</p>
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-ink/45">fastest sell-out</p>
            </div>
          </div>
        </div>

        {/* the wire */}
        <div data-in className="rounded-3xl border border-line bg-card p-5 shadow-card-lg sm:p-6">
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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white" style={{ backgroundColor: `hsl(${w.hue} 55% 45%)` }}>
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
