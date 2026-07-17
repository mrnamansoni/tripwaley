"use client";

/* HERO 29 — "The Private View"
   A collector's gallery after hours: three photographs hung in hairline
   gold frames under individual picture lights. Hovering a frame warms its
   spotlight and tips it toward you. Museum-placard typography. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const WORKS = [
  { src: "/images/ladakh.jpg", no: "№ 014", title: "Khardung La, first light", medium: "7 nights · ₹24,999" },
  { src: "/images/kerala.jpg", no: "№ 022", title: "Still water, Alleppey", medium: "6 nights · ₹16,999" },
  { src: "/images/camp-tents.jpg", no: "№ 031", title: "Basecamp nocturne", medium: "5 nights · ₹9,499" },
];

export default function Hero29Gallery() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gal-frame]",
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.18, scrollTrigger: { trigger: ref.current, start: "top 58%" } }
      );
      gsap.fromTo(
        "[data-gal-in]",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: ref.current, start: "top 62%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="noise relative min-h-screen overflow-hidden bg-[#141210] py-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p data-gal-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
              Private view · by appointment
            </p>
            <h1
              data-gal-in
              className="mt-5 text-5xl font-light leading-[1.04] text-[#efe7d8] sm:text-7xl"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              India, <em className="italic">curated.</em>
            </h1>
          </div>
          <p data-gal-in className="max-w-xs text-sm leading-relaxed text-white/45">
            Three works from the summer collection. Each piece includes travel,
            company and the story rights.
          </p>
        </div>

        <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {WORKS.map((w) => (
            <figure key={w.no} data-gal-frame className="group">
              {/* picture light + cone */}
              <div className="relative mx-auto mb-[-6px] h-10 w-2/3" aria-hidden="true">
                <div className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-full bg-gold/80 shadow-[0_0_18px_rgba(245,163,26,0.65)]" />
                <div
                  className="absolute left-1/2 top-1 h-32 w-[140%] -translate-x-1/2 opacity-40 transition-opacity duration-700 group-hover:opacity-75"
                  style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(255,226,160,0.35) 50%, transparent 60%)" }}
                />
              </div>

              {/* the frame */}
              <div className="relative border border-gold/50 bg-[#0d0c0a] p-2.5 shadow-card-lg transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:perspective(900px)_rotateX(3deg)_translateY(-6px)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={w.src}
                    alt={w.title}
                    fill
                    sizes="(max-width: 640px) 90vw, 30vw"
                    className="object-cover brightness-[0.82] transition-all duration-700 group-hover:brightness-100"
                  />
                </div>
              </div>

              {/* placard */}
              <figcaption className="mt-5 border-l border-gold/40 pl-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.3em] text-gold/80">{w.no}</p>
                <p className="mt-1 text-lg italic text-[#efe7d8]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                  {w.title}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-white/40">{w.medium}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div data-gal-in className="mt-16 flex items-center justify-center">
          <a href="#" className="border border-gold/60 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-[#141210]">
            Acquire a departure
          </a>
        </div>
      </div>
    </section>
  );
}
