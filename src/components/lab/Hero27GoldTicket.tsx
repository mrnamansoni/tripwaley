"use client";

/* HERO 27 — "First Class"
   A metal-card moment: an embossed gold-foil boarding pass floating in a
   dark atelier, tilting in true 3D under the cursor with a holographic
   glare that tracks your hand. Credit-card-launch energy. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero27GoldTicket() {
  const ref = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const card = cardRef.current;
    if (!el || !card) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      gsap.to(card, { rotateY: nx * 14, rotateX: -ny * 10, duration: 0.7, ease: "power2.out" });
      glareRef.current?.style.setProperty("--gx", `${(nx * 0.5 + 0.5) * 100}%`);
      glareRef.current?.style.setProperty("--gy", `${(ny * 0.5 + 0.5) * 100}%`);
    };
    const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 1, ease: "power3.out" });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);

    const ctx = gsap.context(() => {
      gsap.fromTo(card, { y: 90, autoAlpha: 0, rotateX: -24 }, {
        y: 0, autoAlpha: 1, rotateX: 0, duration: 1.4, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 58%" },
      });
      gsap.fromTo("[data-tk-in]", { autoAlpha: 0, y: 26 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 60%" },
      });
      gsap.to(card, { y: -12, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.6 });
    }, el);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden bg-[#0d0b09]">
      {/* soft table light */}
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p data-tk-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
            Membership has its mountains
          </p>
          <h1
            data-tk-in
            className="mt-6 text-5xl font-light leading-[1.05] text-[#f4ead2] sm:text-7xl"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Your seat,
            <br />
            <em className="italic text-gold">minted.</em>
          </h1>
          <p data-tk-in className="mt-6 max-w-md text-sm leading-relaxed text-white/55">
            One pass covers everything — stays, transport, captains, chai at
            altitude. No hidden line items. It simply wouldn&apos;t be tasteful.
          </p>
          <div data-tk-in className="mt-9 flex flex-wrap items-center gap-6">
            <a href="#" className="border border-gold/70 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-[#0d0b09]">
              Claim the pass
            </a>
            <p className="text-xs text-white/40">from ₹5,000 · fully adjustable token</p>
          </div>
        </div>

        {/* the ticket */}
        <div className="order-1 flex justify-center lg:order-2" style={{ perspective: "1400px" }}>
          <div
            ref={cardRef}
            className="relative w-[21rem] rounded-3xl opacity-0 will-change-transform sm:w-[24rem] [transform-style:preserve-3d]"
          >
            <div className="lux-shine-border rounded-3xl p-px">
              <div
                className="relative overflow-hidden rounded-[calc(1.5rem-1px)] px-7 py-8"
                style={{
                  background: "linear-gradient(135deg, #2a2013 0%, #4a3618 34%, #21170c 62%, #3d2d14 100%)",
                }}
              >
                {/* holographic glare tracking the cursor */}
                <div
                  ref={glareRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(420px circle at var(--gx,50%) var(--gy,40%), rgba(255,231,170,0.28), rgba(232,32,40,0.07) 45%, transparent 70%)",
                  }}
                />
                {/* guilloché deco lines */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.16]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(115deg, transparent 0 9px, rgba(245,163,26,0.7) 9px 9.6px)",
                  }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <p className="font-script text-2xl text-gold">tripwaley</p>
                    <p className="text-right text-[0.55rem] font-bold uppercase tracking-[0.3em] text-[#e8d5b5]/85">
                      First class
                      <br />
                      Himalaya
                    </p>
                  </div>

                  <div className="mt-9 flex items-end justify-between">
                    <div>
                      <p className="text-[0.55rem] uppercase tracking-[0.3em] text-[#e8d5b5]/60">passenger</p>
                      <p className="mt-1 font-display text-lg font-bold tracking-wide text-[#f8ecd4]">YOU, FINALLY</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.55rem] uppercase tracking-[0.3em] text-[#e8d5b5]/60">gate</p>
                      <p className="mt-1 font-display text-lg font-bold text-[#f8ecd4]">TW-01</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-gold/25 pt-5">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-2xl font-extrabold text-gold">DEL</p>
                      <svg width="46" height="10" viewBox="0 0 46 10" aria-hidden="true">
                        <path d="M1 5h36" stroke="#f5a31a" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" />
                        <path d="M38 5l6 0-4.5-4v3l-2 1 2 1v3z" fill="#f5a31a" transform="scale(0.9)" />
                      </svg>
                      <p className="font-display text-2xl font-extrabold text-gold">LEH</p>
                    </div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[#e8d5b5]/85">12 JUL 2026</p>
                  </div>
                </div>
              </div>
            </div>
            {/* card shadow */}
            <div aria-hidden="true" className="absolute -bottom-10 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-black/70 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
