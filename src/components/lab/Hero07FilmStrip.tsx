"use client";

/* HERO 07 — "Film Strip"
   Cinematic double marquee of film cells scrolling opposite directions,
   skewing with scroll velocity; a giant italic title floats over. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const ROW_A = ["ladakh", "kerala", "stars", "rajasthan", "meghalaya", "group-mountains"];
const ROW_B = ["andaman", "snowtrek", "houseboat", "spiti", "camp-tents", "group-trek"];

function FilmRow({ names, reverse, duration }: { names: string[]; reverse?: boolean; duration: number }) {
  return (
    <div className="marquee-paused overflow-hidden" aria-hidden="true">
      <div
        className={`marquee-track items-center gap-4 ${reverse ? "marquee-reverse" : ""}`}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-4 pr-4">
            {names.map((n) => (
              <div key={`${copy}-${n}`} className="relative">
                {/* sprocket holes */}
                <div className="flex justify-between px-2 py-1.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className="h-1.5 w-2.5 rounded-[2px] bg-cream/25" />
                  ))}
                </div>
                <div className="relative h-44 w-64 overflow-hidden rounded-sm sm:h-52 sm:w-80">
                  <Image src={`/images/${n}.jpg`} alt="" fill sizes="320px" className="object-cover" />
                </div>
                <div className="flex justify-between px-2 py-1.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className="h-1.5 w-2.5 rounded-[2px] bg-cream/25" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero07FilmStrip() {
  const ref = useRef<HTMLElement>(null);
  const stripsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // scroll-velocity skew on the whole strip block
      const proxy = { skew: 0 };
      const setter = gsap.quickSetter(stripsRef.current, "skewX", "deg");
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-7, 7, self.getVelocity() / -350);
          if (Math.abs(v) > Math.abs(proxy.skew)) {
            proxy.skew = v;
            gsap.to(proxy, {
              skew: 0,
              duration: 0.7,
              ease: "power3.out",
              overwrite: true,
              onUpdate: () => setter(proxy.skew),
            });
          }
        },
      });
      gsap.fromTo(
        "[data-fs-title]",
        { autoAlpha: 0, scale: 0.94, y: 30 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 55%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen flex-col justify-center overflow-hidden bg-ink py-20">
      <p className="mb-8 text-center text-[0.65rem] font-bold uppercase tracking-[0.35em] text-white/40">
        Tripwaley Studios presents · 12,000 travellers · one big picture
      </p>

      <div ref={stripsRef} className="space-y-6 will-change-transform">
        <div className="-rotate-2">
          <FilmRow names={ROW_A} duration={46} />
        </div>
        <div className="rotate-1">
          <FilmRow names={ROW_B} reverse duration={56} />
        </div>
      </div>

      {/* floating title card */}
      <div data-fs-title className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
        <div className="pointer-events-auto max-w-2xl rounded-3xl border border-white/10 bg-ink/55 px-8 py-10 text-center shadow-card-lg backdrop-blur-md sm:px-14">
          <p className="font-script text-2xl text-gold sm:text-3xl">now showing, everywhere in India</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold italic leading-tight tracking-tight text-white sm:text-6xl">
            Your life,
            <br />
            in widescreen.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Group departures shot on 15 phones at once. Book the trip; the
            cinematography sorts itself out.
          </p>
          <a href="#" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
            Roll camera — book now
          </a>
        </div>
      </div>
    </section>
  );
}
