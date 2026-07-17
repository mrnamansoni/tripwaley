"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import Hero3D from "@/components/three/Hero3D";
import { waLink } from "@/lib/data";

const MARQUEE_STOPS = [
  "Leh–Ladakh", "Spiti", "Kashmir", "Meghalaya", "Kerala", "Andaman",
  "Rishikesh", "Kedarkantha", "Jaisalmer", "Varkala", "Tawang", "Gokarna",
];

/** Static painted backdrop — always present under the 3D canvas, and the
 *  graceful fallback when WebGL / motion isn't available. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-[#fdf1e6] to-[#f9e3d3]" />
      {/* gold sun */}
      <div className="absolute left-[12%] top-[16%] h-40 w-40 rounded-full bg-gold opacity-90 blur-[2px] sm:h-56 sm:w-56" />
      <div className="absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-gold/25 blur-3xl sm:h-96 sm:w-96" />
      {/* layered ridge silhouettes */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 420" preserveAspectRatio="none" fill="none">
        <path d="M0 300 L180 190 L340 260 L520 150 L720 250 L900 130 L1100 240 L1280 180 L1440 250 V420 H0 Z" fill="#ecd0b4" opacity="0.6" />
        <path d="M0 340 L220 240 L400 300 L620 200 L840 300 L1040 210 L1240 300 L1440 240 V420 H0 Z" fill="#e0b28c" opacity="0.7" />
        <path d="M0 390 L260 300 L480 360 L700 280 L940 370 L1180 300 L1440 360 V420 H0 Z" fill="#d99a6c" opacity="0.8" />
      </svg>
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* Act 1 — entrance: headline lines rise out of clipped wrappers */
      if (!reduced) {
        gsap.fromTo(
          "[data-hero-line]",
          { yPercent: 115 },
          { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.13, delay: 0.2 }
        );
        gsap.fromTo(
          "[data-hero-fade]",
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.55 }
        );
      }

      /* Scroll-out: content lifts away as the camera dives into the valley */
      gsap.to(contentRef.current, {
        yPercent: -22,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "45% bottom",
          scrub: 0.4,
        },
      });
      gsap.to(bottomRef.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "25% bottom",
          scrub: 0.4,
        },
      });

      /* Act 2 — mid-flight message fades in deep in the valley, then out */
      gsap.fromTo(
        act2Ref.current,
        { autoAlpha: 0, scale: 0.92 },
        {
          autoAlpha: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "42% bottom",
            end: "70% bottom",
            scrub: 0.4,
          },
        }
      );
      gsap.to(act2Ref.current, {
        autoAlpha: 0,
        scale: 1.05,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "88% bottom",
          end: "bottom bottom",
          scrub: 0.4,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative h-[240vh]" aria-label="Tripwaley — group trips across India">
      <div className="sticky top-0 h-screen overflow-hidden">
        <Backdrop />
        <Hero3D />

        {/* ------------------------------------------------ act 1: main content */}
        <div
          ref={contentRef}
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-28 pt-24 sm:px-8 lg:px-12"
        >
          <h1 className="font-display text-[clamp(2.9rem,9.5vw,7rem)] font-extrabold leading-[0.98] tracking-tight">
            <span className="block overflow-hidden pb-1">
              <span data-hero-line className="block">Big mountains.</span>
            </span>
            <span className="block overflow-hidden py-1">
              <span data-hero-line className="block font-script font-bold leading-[0.9] text-brand" style={{ fontSize: "1.18em" }}>
                new friends,
              </span>
            </span>
            <span className="block overflow-hidden pt-1">
              <span data-hero-line className="block">zero planning.</span>
            </span>
          </h1>

          <p data-hero-fade className="mt-6 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
            Curated group departures across India — Ladakh to Andaman. We handle the
            stays, the routes and the vibe. <strong className="text-ink">You just show up.</strong>
          </p>

          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href="#destinations"
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white shadow-red transition-all hover:bg-brand-bright hover:shadow-card-lg active:scale-[0.97]"
            >
              Explore departures
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">
                <path d="M8 2v11m0 0l-4.5-4.5M8 13l4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href={waLink("Hi Tripwaley! I want to plan a trip 🏔️")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-ink/15 bg-card/80 px-6 py-3 text-base font-bold text-ink backdrop-blur-sm transition-all hover:border-success hover:text-success active:scale-[0.97]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-success">
                <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Zm5.47 14.3c-.23.65-1.35 1.24-1.86 1.28-.5.05-.97.24-3.27-.68-2.77-1.1-4.53-3.94-4.67-4.12-.13-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.48-.09.18-.13.29-.27.45-.13.16-.28.36-.4.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.11.6-.07.16-.18.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.59.75 1.86.89.27.13.45.2.52.32.06.11.06.65-.16 1.29Z" />
              </svg>
              WhatsApp us
            </a>
          </div>

          <ul data-hero-fade className="mt-10 flex flex-wrap gap-x-7 gap-y-2.5 text-sm font-medium text-ink/60">
            {["2,400+ five-star reviews", "Women-safe certified batches", "No hidden costs. Ever."].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" fill="var(--color-success)" opacity="0.15" />
                  <path d="M4.5 8.2l2.3 2.3 4.7-4.8" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* --------------------------------------------- act 2: mid-flight text */}
        <div
          ref={act2Ref}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center opacity-0"
        >
          <p className="font-script text-3xl text-brand sm:text-4xl">somewhere over the Himalayas…</p>
          <p className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Strangers on Friday.
            <br />
            <span className="text-brand">Family</span> by Sunday.
          </p>
        </div>

        {/* ------------------------------------------------- bottom strip */}
        <div ref={bottomRef} className="absolute inset-x-0 bottom-0 z-10">
          <div className="marquee-paused border-t border-line/70 bg-cream/60 py-3 backdrop-blur-sm" aria-hidden="true">
            <div className="marquee-track gap-0" style={{ "--marquee-duration": "36s" } as React.CSSProperties}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center">
                  {MARQUEE_STOPS.map((stop) => (
                    <span key={`${copy}-${stop}`} className="flex items-center whitespace-nowrap px-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-ink/45">
                      {stop}
                      <span className="ml-8 text-gold">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
