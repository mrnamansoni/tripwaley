"use client";

/* HERO 03 — "Zoom-Through Type"
   Pinned. The camera flies THROUGH the word ESCAPE: the photo lives inside
   the letters (background-clip: text) and scroll scales the word until the
   image swallows the viewport, landing on the closing line. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero03ZoomType() {
  const ref = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      gsap.fromTo(wordRef.current, { scale: 1 }, { scale: 22, ease: "power2.in", scrollTrigger: st });
      gsap.fromTo(wordRef.current, { autoAlpha: 1 }, { autoAlpha: 0, ease: "none", scrollTrigger: { ...st, start: "62% bottom", end: "78% bottom" } });
      gsap.fromTo(bgRef.current, { autoAlpha: 0 }, { autoAlpha: 1, ease: "none", scrollTrigger: { ...st, start: "45% bottom", end: "72% bottom" } });
      gsap.fromTo(introRef.current, { autoAlpha: 1 }, { autoAlpha: 0, ease: "none", scrollTrigger: { ...st, start: "top top", end: "25% bottom" } });
      gsap.fromTo(
        endRef.current,
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "70% bottom", end: "92% bottom" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[260vh] bg-cream">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* the destination waiting behind the letters */}
        <div
          ref={bgRef}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-0"
          style={{ backgroundImage: "url(/images/himalaya-sunrise.jpg)" }}
        />

        <div ref={introRef} className="absolute top-[14%] z-10 px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-ink/50">Tripwaley presents</p>
          <p className="mt-2 font-script text-2xl text-brand sm:text-3xl">the only 6 letters you need this year</p>
        </div>

        {/* photo-filled word, scaled by scroll */}
        <div ref={wordRef} className="will-change-transform">
          <h1
            className="select-none bg-cover bg-center bg-clip-text font-display text-[clamp(4rem,16.5vw,15rem)] font-extrabold leading-none tracking-tighter text-transparent"
            style={{ backgroundImage: "url(/images/himalaya-sunrise.jpg)" }}
          >
            ESCAPE
          </h1>
        </div>

        {/* landing */}
        <div ref={endRef} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink/35 px-6 text-center opacity-0">
          <p className="font-script text-3xl text-gold sm:text-4xl">welcome to the other side</p>
          <p className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            It&apos;s closer than
            <br />
            you think.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright"
          >
            Escape with us — from ₹5,000
          </a>
        </div>

        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink/40">
          keep scrolling
        </p>
      </div>
    </section>
  );
}
