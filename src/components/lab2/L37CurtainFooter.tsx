"use client";

/* L37 — "The Curtain" (footer)
   The page is a curtain: as you reach the end it lifts clean off,
   revealing the footer that was underneath the whole time — a wall-sized
   wordmark, magnetic link columns, one last door out. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const COLS = [
  { head: "Trips", links: ["Himalayas", "Beaches", "Deserts", "Northeast"] },
  { head: "Company", links: ["The crew", "Reviews", "Careers", "Press"] },
  { head: "Help", links: ["WhatsApp us", "Cancellations", "FAQs", "Safety"] },
];

export default function L37CurtainFooter() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.45 };
      gsap.to("[data-l37-curtain]", { yPercent: -100, ease: "none", scrollTrigger: st });
      gsap.fromTo("[data-l37-mark]", { yPercent: 34 }, { yPercent: 0, ease: "none", scrollTrigger: st });
      gsap.fromTo("[data-l37-item]", { autoAlpha: 0, y: 26 }, {
        autoAlpha: 1, y: 0, ease: "none", stagger: 0.04,
        scrollTrigger: { ...st, start: "45% bottom", end: "80% bottom" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-[#12100d]">
        {/* THE FOOTER — underneath all along */}
        <div className="absolute inset-0 flex flex-col justify-between px-5 pb-6 pt-[13vh] sm:px-10">
          <div className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div data-l37-item>
              <p className="font-script text-3xl text-gold">stay restless</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
                One email a month. Three trips, zero spam, occasional chai
                recipes from basecamp.
              </p>
              <div className="mt-5 flex max-w-xs items-center border-b border-white/25 pb-2 focus-within:border-gold">
                <input type="email" placeholder="you@somewhere.in" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
                <button type="button" className="shrink-0 text-gold transition-transform hover:translate-x-1" aria-label="Subscribe">→</button>
              </div>
            </div>
            {COLS.map((col) => (
              <nav key={col.head} data-l37-item aria-label={col.head}>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.35em] text-white/40">{col.head}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="group inline-flex items-center gap-2 text-[0.95rem] font-semibold text-white/75 transition-colors hover:text-gold">
                        <span aria-hidden="true" className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-4" />
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* wall-sized wordmark rising from the fold */}
          <div className="overflow-hidden">
            <p data-l37-mark aria-hidden="true" className="select-none whitespace-nowrap text-center font-display text-[17.5vw] font-extrabold leading-[0.85] tracking-tighter text-[#1f1b16] will-change-transform">
              trip<span className="text-brand/85">waley</span>
            </p>
          </div>

          <div data-l37-item className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/35">
            <p>© 2026 Tripwaley · New Delhi</p>
            <div className="flex gap-6">
              {["Instagram", "YouTube", "WhatsApp"].map((s) => (
                <a key={s} href="#" className="transition-colors hover:text-gold">{s}</a>
              ))}
            </div>
            <p>made between trips</p>
          </div>
        </div>

        {/* THE CURTAIN — the "page" that lifts away */}
        <div data-l37-curtain className="absolute inset-0 flex flex-col items-center justify-center bg-cream will-change-transform">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-ink/45">you&apos;ve reached the bottom</p>
          <h2 className="mt-4 text-center font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            …of the page. <span className="text-brand">Not the map.</span>
          </h2>
          <p className="mt-6 font-script text-2xl text-brand">keep pulling ↓</p>
          {/* curtain hem shadow */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-ink/25" />
        </div>
      </div>
    </section>
  );
}
