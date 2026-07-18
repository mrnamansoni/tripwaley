"use client";

/* HERO 28 — "The Suite"
   Aurora-behind-glass: enormous soft light fields in brand crimson and
   gold breathing behind a single frosted panel. One serif sentence, one
   gold action. The five-star lobby at 2 AM. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const ORBS = [
  { cls: "bg-brand/50", size: "55vmax", x: "-12%", y: "-18%", dur: 19 },
  { cls: "bg-gold/40", size: "48vmax", x: "62%", y: "-6%", dur: 23 },
  { cls: "bg-[#7a2a5e]/40", size: "50vmax", x: "18%", y: "52%", dur: 27 },
];

export default function Hero28Aurora() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // slow breathing drift for each light field (transform only)
      gsap.utils.toArray<HTMLElement>("[data-au-orb]").forEach((orb, i) => {
        gsap.to(orb, {
          xPercent: i % 2 ? -18 : 18,
          yPercent: i % 2 ? 14 : -12,
          scale: 1.18,
          duration: ORBS[i].dur,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });
      gsap.fromTo(
        "[data-au-in]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.3, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: ref.current, start: "top 58%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0a10] px-5 py-24">
      {/* aurora fields */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          data-au-orb
          aria-hidden="true"
          className={`absolute rounded-full blur-[110px] ${o.cls}`}
          style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
        />
      ))}
      {/* fine grain to make the light feel physical */}
      <div className="noise absolute inset-0" aria-hidden="true" />

      {/* the frosted panel */}
      <div className="lux-shine-border relative w-full max-w-3xl rounded-[2.2rem] p-px">
        <div className="rounded-[calc(2.2rem-1px)] border border-white/10 bg-white/[0.055] px-7 py-14 text-center backdrop-blur-2xl sm:px-16 sm:py-20">
          <p data-au-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
            Tripwaley · the travel house
          </p>
          <h1
            data-au-in
            className="mt-7 text-5xl font-light leading-[1.08] text-[#f6efe2] sm:text-7xl"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Checked in:
            <br />
            <em className="italic bg-[linear-gradient(110deg,#f6efe2_35%,#f5a31a_50%,#f6efe2_65%)] bg-[length:220%_100%] bg-clip-text text-transparent" style={{ animation: "lux-shimmer 5s linear infinite" }}>
              everywhere
            </em>
          </h1>
          <p data-au-in className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-white/55">
            One membership of wanderers, twelve thousand strong. Departures every
            week, standards that never leave the lobby.
          </p>
          <div data-au-in className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="#"
              className="inline-flex min-h-12 items-center rounded-full bg-gold px-9 py-4 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#0c0a10] transition-all duration-300 hover:bg-[#ffc45c]"
            >
              Begin the ritual
            </a>
            <a href="#" className="min-h-12 py-3 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white">
              House rules ↗
            </a>
          </div>
        </div>
      </div>

      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.6rem] uppercase tracking-[0.4em] text-white/30">
        est. 2019 · new delhi · leh · kochi
      </p>
    </section>
  );
}
