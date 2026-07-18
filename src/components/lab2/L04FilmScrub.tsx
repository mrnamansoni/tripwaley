"use client";

/* L04 — "One Take" (hero opener)
   Scroll IS the playhead: a pinned, letterboxed film that scrubs through
   five graded scenes with camera-report metadata, running timecode and a
   progress ring. The Apple-keynote scrub, pointed at India. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SCENES = [
  { src: "/images/himalaya-sunrise.jpg", place: "HIMALAYA — 05:12", lens: "24MM · f/8 · ISO 100" },
  { src: "/images/rishikesh.jpg", place: "RISHIKESH — 07:40", lens: "35MM · f/4 · ISO 200" },
  { src: "/images/rajasthan.jpg", place: "JAIPUR — 12:26", lens: "50MM · f/5.6 · ISO 100" },
  { src: "/images/backwater-canoe.jpg", place: "ALLEPPEY — 17:03", lens: "85MM · f/2.8 · ISO 400" },
  { src: "/images/stars.jpg", place: "SPITI — 23:58", lens: "14MM · f/1.8 · ISO 3200" },
];

export default function L04FilmScrub() {
  const ref = useRef<HTMLElement>(null);
  const tcRef = useRef<HTMLParagraphElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const frames = gsap.utils.toArray<HTMLElement>("[data-l04-frame]");
      const metas = gsap.utils.toArray<HTMLElement>("[data-l04-meta]");
      const seg = 1 / SCENES.length;

      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.4,
          onUpdate: (self) => {
            const p = self.progress;
            // running timecode
            const total = p * 24; // a 24s film
            const s = Math.floor(total);
            const f = Math.floor((total - s) * 24);
            if (tcRef.current) tcRef.current.textContent = `00:00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
            if (ringRef.current) ringRef.current.style.strokeDashoffset = String(88 * (1 - p));
            // frame windows: hard cut in, slow push while live
            frames.forEach((fr, i) => {
              const local = gsap.utils.clamp(0, 1, (p - i * seg) / seg);
              const active = p >= i * seg && p < (i + 1) * seg + (i === SCENES.length - 1 ? 0.001 : 0);
              fr.style.opacity = active || (i === SCENES.length - 1 && p >= 1) ? "1" : "0";
              fr.style.transform = `scale(${1.14 - local * 0.12})`;
              if (metas[i]) metas[i].style.opacity = active ? "1" : "0";
            });
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[380vh] bg-black">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* letterboxed frame */}
        <div className="relative mx-auto aspect-video w-full max-w-6xl overflow-hidden bg-black">
          {SCENES.map((s, i) => (
            <div key={s.src} data-l04-frame className="absolute inset-0 opacity-0 will-change-transform" style={{ transitionProperty: "none" }}>
              <Image src={s.src} alt="" fill sizes="90vw" priority={i === 0} className="object-cover" />
            </div>
          ))}
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

          {/* HUD */}
          <div className="absolute left-5 top-4 flex items-center gap-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
            <p className="font-mono text-[0.62rem] tracking-[0.25em] text-white/70">SCRUB — ONE TAKE ACROSS INDIA</p>
          </div>
          <p ref={tcRef} className="absolute right-5 top-4 font-mono text-[0.66rem] tracking-[0.14em] text-gold tabular-nums">00:00:00:00</p>

          {/* per-scene camera report */}
          {SCENES.map((s, i) => (
            <div key={i} data-l04-meta className="absolute bottom-4 left-5 opacity-0" style={{ transition: "opacity .35s" }}>
              <p className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-white">{s.place}</p>
              <p className="mt-0.5 font-mono text-[0.58rem] tracking-[0.18em] text-white/50">{s.lens}</p>
            </div>
          ))}

          {/* progress ring */}
          <svg className="absolute bottom-4 right-5 h-9 w-9 -rotate-90" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <circle ref={ringRef} cx="16" cy="16" r="14" fill="none" stroke="#f5a31a" strokeWidth="2" strokeDasharray="88" strokeDashoffset="88" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-6xl items-end justify-between px-4">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Scroll is the <span className="text-gold">playhead.</span>
          </h2>
          <p className="hidden max-w-xs text-right text-sm text-white/45 sm:block">
            Five scenes, one day, zero cuts. Your thumb is the editor.
          </p>
        </div>
      </div>
    </section>
  );
}
