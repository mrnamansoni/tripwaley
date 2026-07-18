"use client";

/* L29 — "The Printer" (CTA)
   Scroll feeds the machine: a brushed-metal slot prints your boarding
   pass line by line — jittering like a real thermal printer — and when
   the paper clears the slot, a CONFIRMED stamp slams down. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function L29TicketPrinter() {
  const ref = useRef<HTMLElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.4 };
      // paper feeds out of the slot
      gsap.fromTo(ticketRef.current, { yPercent: -96 }, { yPercent: 0, ease: "none", scrollTrigger: { ...st, end: "78% bottom" } });
      // thermal-printer jitter while feeding
      gsap.to(ticketRef.current, {
        x: 1.2, duration: 0.06, yoyo: true, repeat: -1, ease: "none",
        scrollTrigger: { ...st, end: "78% bottom", toggleActions: "play pause resume pause" },
      });
      // the stamp slams once the paper is out
      gsap.fromTo(stampRef.current, { autoAlpha: 0, scale: 2.6, rotate: 14 }, {
        autoAlpha: 1, scale: 1, rotate: -7, ease: "power4.in",
        scrollTrigger: { ...st, start: "80% bottom", end: "88% bottom" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[280vh] bg-[#121110]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-start overflow-hidden pt-[9vh]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">scroll to print</p>
        <h2 className="mt-2 px-5 text-center font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Your seat, <span className="text-gold">on paper.</span>
        </h2>

        {/* the machine */}
        <div className="relative z-20 mt-8 w-[21rem] rounded-2xl border border-white/10 bg-gradient-to-b from-[#2b2926] to-[#1a1917] px-6 py-4 shadow-card-lg sm:w-[24rem]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/55">TW TICKETING · BAY 04</p>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
          </div>
          {/* the slot */}
          <div className="mt-3 h-2.5 rounded-full bg-black shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]" aria-hidden="true" />
        </div>

        {/* the paper */}
        <div className="relative z-10 -mt-1 h-[52vh] w-[19rem] overflow-hidden sm:w-[21rem]">
          <div ref={ticketRef} className="relative will-change-transform">
            <div className="rounded-b-xl bg-[#f7f2e4] px-7 py-6 shadow-card-lg">
              <div className="flex items-start justify-between border-b-2 border-dashed border-ink/15 pb-4">
                <p className="font-script text-2xl text-brand">tripwaley</p>
                <p className="text-right font-mono text-[0.58rem] uppercase leading-relaxed tracking-[0.2em] text-ink/50">
                  boarding pass<br />TW-701
                </p>
              </div>
              <div className="grid grid-cols-2 gap-y-4 py-5">
                <div><p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">passenger</p><p className="font-display text-base font-extrabold text-ink">FUTURE YOU</p></div>
                <div className="text-right"><p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">date</p><p className="font-display text-base font-extrabold text-ink">12 JUL</p></div>
                <div><p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">from</p><p className="font-display text-2xl font-extrabold text-ink">DEL</p></div>
                <div className="text-right"><p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">to</p><p className="font-display text-2xl font-extrabold text-brand">LEH</p></div>
              </div>
              {/* barcode */}
              <div className="flex h-10 items-end gap-[2px] border-t-2 border-dashed border-ink/15 pt-4" aria-hidden="true">
                {Array.from({ length: 34 }).map((_, i) => (
                  <span key={i} className="w-[3px] bg-ink" style={{ height: `${35 + ((i * 41) % 62)}%` }} />
                ))}
              </div>
              <p className="mt-3 text-center font-mono text-[0.55rem] tracking-[0.35em] text-ink/45">HOLD EXPIRES IN 24:00:00</p>
            </div>
            {/* torn edge */}
            <svg viewBox="0 0 320 12" className="block w-full text-[#f7f2e4]" aria-hidden="true">
              <path d="M0 0 L0 4 L10 12 L20 4 L30 12 L40 4 L50 12 L60 4 L70 12 L80 4 L90 12 L100 4 L110 12 L120 4 L130 12 L140 4 L150 12 L160 4 L170 12 L180 4 L190 12 L200 4 L210 12 L220 4 L230 12 L240 4 L250 12 L260 4 L270 12 L280 4 L290 12 L300 4 L310 12 L320 4 L320 0 Z" fill="currentColor" />
            </svg>
            {/* the stamp */}
            <div ref={stampRef} className="absolute right-6 top-[38%] opacity-0">
              <span className="rounded border-[3.5px] border-success px-4 py-1.5 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-success">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        <a href="#" className="relative z-20 mt-2 inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 font-bold text-[#121110] transition-transform hover:scale-[1.04]">
          Print mine for real →
        </a>
      </div>
    </section>
  );
}
