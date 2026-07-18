"use client";

/* L10 — "The Accordion" (destination showcase)
   The 21st.dev expanding-panel pattern, finished properly: five departures
   in one strip, the active one unfurling with a long custom ease while its
   caption, chips and CTA cascade in. Hover on desktop, tap on touch. */

import { useState } from "react";
import Image from "next/image";
import { useEntrance, Eyebrow } from "./shared";

const PANELS = [
  { img: "ladakh", name: "Ladakh", tag: "High passes", days: "7N / 8D", price: "₹24,999", blurb: "Khardung La, Pangong, and the kind of silence phones can't record." },
  { img: "meghalaya", name: "Meghalaya", tag: "Living bridges", days: "6N / 7D", price: "₹17,999", blurb: "Root bridges, rain that means it, waterfalls with no railings." },
  { img: "kerala", name: "Kerala", tag: "Backwaters", days: "6N / 7D", price: "₹16,999", blurb: "A houseboat, a cook, a sunset that takes its time." },
  { img: "spiti", name: "Spiti", tag: "Cold desert", days: "8N / 9D", price: "₹18,999", blurb: "Key Monastery, fossil villages, one bar of signal — if lucky." },
  { img: "andaman", name: "Andaman", tag: "Emerald reef", days: "6N / 7D", price: "₹28,999", blurb: "Scuba certs, bioluminescent kayaks, sand you'll write home about." },
];

export default function L10ExpandPanels() {
  const ref = useEntrance<HTMLElement>();
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} className="bg-blush py-[12vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>this week&apos;s strip</Eyebrow>
            <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Five doors. <span className="text-brand">Pick one.</span>
            </h2>
          </div>
          <p data-in className="max-w-xs text-sm leading-relaxed text-ink/55">
            Hover a panel — it makes its case. The others politely step aside.
          </p>
        </div>

        <div data-in className="flex h-[68vh] min-h-[26rem] gap-2.5 sm:gap-3">
          {PANELS.map((p, i) => {
            const open = i === active;
            return (
              <button
                key={p.img}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={open}
                className="group relative overflow-hidden rounded-2xl text-left outline-offset-4 transition-[flex-grow] duration-700 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)]"
                style={{ flexGrow: open ? 5 : 1, flexBasis: 0 }}
              >
                <Image
                  src={`/images/${p.img}.jpg`}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 60vw, 40vw"
                  className={`object-cover transition-all duration-700 ${open ? "scale-100 brightness-95" : "scale-110 brightness-[0.55]"}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent transition-opacity duration-500 ${open ? "opacity-100" : "opacity-70"}`} aria-hidden="true" />

                {/* collapsed: vertical name */}
                <p
                  className={`absolute bottom-6 left-1/2 origin-center -translate-x-1/2 whitespace-nowrap font-display text-lg font-extrabold uppercase tracking-widest text-white transition-all duration-500 ${
                    open ? "pointer-events-none opacity-0" : "opacity-90"
                  }`}
                  style={{ writingMode: "vertical-rl", rotate: "180deg" }}
                >
                  {p.name}
                </p>

                {/* expanded payload */}
                <div className={`absolute inset-x-0 bottom-0 p-6 transition-all delay-150 duration-500 sm:p-8 ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-gold">{p.tag} · {p.days}</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-white sm:text-5xl">{p.name}</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">{p.blurb}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-red">from {p.price}</span>
                    <span className="text-sm font-semibold text-white/80 underline decoration-gold underline-offset-4">itinerary →</span>
                  </div>
                </div>

                {/* index chip */}
                <span className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-colors duration-500 ${open ? "bg-gold text-ink" : "bg-white/15 text-white/80 backdrop-blur-sm"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
