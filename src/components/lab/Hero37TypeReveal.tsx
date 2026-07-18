"use client";

/* HERO 37 — "Cutout"
   Pinned. A single giant word — WANDER — is a window: the live scenery
   plays *inside* the letters while everything around them is warm cream.
   Scroll pans the footage behind the type and finally bursts the word
   open to full-bleed. Kinetic magazine cover. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

export default function Hero37TypeReveal() {
  const ref = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const base = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      // pan the footage inside the letters
      gsap.fromTo(bgRef.current, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: base });
      // the word grows, then the cutout dilates to reveal the full frame
      gsap.to(maskRef.current, { scale: 1.35, ease: "power1.in", scrollTrigger: { ...base, start: "top top", end: "60% bottom" } });
      gsap.to(maskRef.current, { autoAlpha: 0, ease: "none", scrollTrigger: { ...base, start: "58% bottom", end: "72% bottom" } });
      gsap.fromTo(fullRef.current, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, ease: "none", scrollTrigger: { ...base, start: "56% bottom", end: "74% bottom" } });
      gsap.fromTo(endRef.current, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...base, start: "76% bottom", end: "92% bottom" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[280vh] bg-cream">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* full-bleed reveal (fades in late) */}
        <div ref={fullRef} className="absolute inset-0 opacity-0">
          <Image src="/images/himalaya-sunrise.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-ink/35" />
        </div>

        {/* the cutout word: cream card with text-shaped hole showing footage */}
        <div ref={maskRef} className="relative will-change-transform">
          {/* footage layer, clipped to the text */}
          <div className="relative">
            <div ref={bgRef} className="absolute inset-0 -z-10" aria-hidden="true">
              <Image src="/images/himalaya-sunrise.jpg" alt="" fill sizes="100vw" className="scale-125 object-cover" />
            </div>
            <h1
              className="bg-cover bg-center bg-clip-text text-center font-display text-[clamp(4.5rem,22vw,20rem)] font-extrabold leading-none tracking-tighter text-transparent"
              style={{ backgroundImage: "url(/images/himalaya-sunrise.jpg)" }}
            >
              WANDER
            </h1>
          </div>
        </div>

        {/* intro caption above the word */}
        <p className="pointer-events-none absolute top-[14%] text-center text-[0.65rem] font-bold uppercase tracking-[0.4em] text-ink/50">
          the word lives outside · scroll to step in
        </p>

        {/* landing */}
        <div ref={endRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="font-script text-3xl text-gold sm:text-4xl">you&apos;re inside it now</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Stop reading about it.
            <br />
            Go be in it.
          </h2>
          <a href="#" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
            Book the window seat →
          </a>
        </div>
      </div>
    </section>
  );
}
