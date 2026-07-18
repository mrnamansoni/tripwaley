"use client";

/* HERO 10 — "The Portal"
   Pinned. A small circular window onto the valley sits in a calm cream
   composition; scrolling swells the circle until it swallows the screen
   and the invitation lands inside the world. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero10Portal() {
  const ref = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const outsideRef = useRef<HTMLDivElement>(null);
  const insideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      gsap.fromTo(
        worldRef.current,
        { clipPath: "circle(9rem at 50% 54%)" },
        { clipPath: "circle(120% at 50% 54%)", ease: "power2.in", scrollTrigger: st }
      );
      gsap.fromTo(
        outsideRef.current,
        { autoAlpha: 1 },
        { autoAlpha: 0, ease: "none", scrollTrigger: { ...st, start: "20% bottom", end: "50% bottom" } }
      );
      gsap.fromTo(
        insideRef.current,
        { autoAlpha: 0, y: 50 },
        { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "62% bottom", end: "88% bottom" } }
      );
      // gentle parallax inside the porthole while it's small
      gsap.fromTo(
        "[data-pt-img]",
        { scale: 1.25 },
        { scale: 1, ease: "none", scrollTrigger: st }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[240vh] bg-cream">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* outside: the quiet invitation */}
        <div ref={outsideRef} className="absolute inset-0 z-10 flex flex-col items-center pt-[12vh] text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-ink/45">Tripwaley · group departures</p>
          <h1 className="mt-4 px-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            There&apos;s a whole world
            <br />
            behind this <span className="text-brand">little circle.</span>
          </h1>
          <p className="mt-3 font-script text-2xl text-brand">scroll to step through ↓</p>
          {/* porthole ring accent — fades together with this layer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[54%] h-[19.5rem] w-[19.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand/40"
          />
        </div>

        {/* the world behind the porthole */}
        <div ref={worldRef} className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: "circle(9rem at 50% 54%)" }}>
          <div
            data-pt-img
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{ backgroundImage: "url(/images/kashmir.jpg)" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />

          {/* inside: the landing */}
          <div ref={insideRef} className="absolute inset-0 flex flex-col items-center justify-end pb-[12vh] text-center opacity-0">
            <p className="font-script text-3xl text-gold">told you it was worth it</p>
            <h2 className="mt-3 px-6 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Kashmir, next weekend.
              <br />
              Fourteen strangers. One shikara.
            </h2>
            <a
              href="#"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright"
            >
              Step through — hold my seat
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
