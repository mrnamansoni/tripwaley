"use client";

/* HERO 42 — "The Wall"
   Three infinite rows of destinations drift opposite ways behind a bold
   headline; on scroll the whole wall rushes toward you and one single frame
   swallows the screen — the trip you were always going to pick. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const ROW_A = ["ladakh", "kerala", "spiti", "andaman", "rajasthan", "kashmir"];
const ROW_B = ["meghalaya", "stars", "snowtrek", "houseboat", "group-trek", "tent-view"];
const ROW_C = ["himalaya-sunrise", "backwater-canoe", "group-mountains", "traveller-street", "camp-tents", "taj"];

function Row({ names, reverse, dur }: { names: string[]; reverse?: boolean; dur: number }) {
  return (
    <div className="overflow-hidden">
      <div className={`marquee-track gap-4 ${reverse ? "marquee-reverse" : ""}`} style={{ "--marquee-duration": `${dur}s` } as React.CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1}>
            {names.map((n) => (
              <div key={`${copy}-${n}`} className="relative h-40 w-60 shrink-0 overflow-hidden rounded-xl sm:h-52 sm:w-80">
                <Image src={`/images/${n}.jpg`} alt="" fill sizes="320px" className="object-cover" />
                <div className="absolute inset-0 bg-ink/25" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero42InfiniteWall() {
  const ref = useRef<HTMLElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const base = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      // wall rushes forward + fades
      gsap.to(wallRef.current, { scale: 2.6, autoAlpha: 0, ease: "power2.in", scrollTrigger: { ...base, start: "top top", end: "62% bottom" } });
      gsap.to(headRef.current, { autoAlpha: 0, scale: 1.4, ease: "none", scrollTrigger: { ...base, start: "top top", end: "34% bottom" } });
      // the single chosen frame zooms up to fill
      gsap.fromTo(zoomRef.current, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: "power2.out", scrollTrigger: { ...base, start: "45% bottom", end: "72% bottom" } });
      gsap.fromTo(endRef.current, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...base, start: "74% bottom", end: "92% bottom" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[280vh] bg-ink">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* the drifting wall */}
        <div ref={wallRef} className="absolute inset-0 flex flex-col justify-center gap-4 will-change-transform">
          <Row names={ROW_A} dur={48} />
          <Row names={ROW_B} reverse dur={58} />
          <Row names={ROW_C} dur={52} />
        </div>
        <div className="absolute inset-0 bg-ink/45" aria-hidden="true" />

        {/* headline over the wall */}
        <div ref={headRef} className="relative px-6 text-center will-change-transform">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-gold">350 departures · pick one, we dare you</p>
          <h1 className="mt-5 font-display text-[clamp(3rem,11vw,9rem)] font-extrabold leading-[0.92] tracking-tight text-white">
            Too much
            <br />
            <span className="text-gold">to choose from.</span>
          </h1>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.35em] text-white/50">scroll — let us pick</p>
        </div>

        {/* the chosen frame */}
        <div ref={zoomRef} className="absolute inset-0 opacity-0">
          <Image src="/images/ladakh.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/40" />
        </div>

        {/* landing */}
        <div ref={endRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="font-script text-3xl text-gold sm:text-4xl">knew it all along</p>
          <h2 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-white sm:text-8xl">Ladakh. Obviously.</h2>
          <p className="mt-4 max-w-md text-sm text-white/70">12 Jul batch · 7 nights · 3 seats left · ₹24,999</p>
          <a href="#" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
            Hold my seat →
          </a>
        </div>
      </div>
    </section>
  );
}
