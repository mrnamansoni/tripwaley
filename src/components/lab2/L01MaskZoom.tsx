"use client";

/* L01 — "The Title Drop" (hero opener)
   The GTA-VI grammar: the whole screen is a cream slab with INDIA punched
   through it, live footage moving inside the letters. Scroll flies the
   camera through the counter of the D until the slab is gone and the
   country swallows the frame. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

export default function L01MaskZoom() {
  const ref = useRef<HTMLElement>(null);
  const slabRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const landRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.5 };
      // fly through the counter of the "D" — slow approach, violent finish
      gsap.fromTo(
        slabRef.current,
        { scale: 1 },
        {
          keyframes: [
            { scale: 2.2, duration: 0.45, ease: "power1.in" },
            { scale: 42, duration: 0.35, ease: "power2.in" },
          ],
          scrollTrigger: { ...st, end: "78% bottom" },
        }
      );
      gsap.to(slabRef.current, {
        autoAlpha: 0, ease: "none",
        scrollTrigger: { ...st, start: "68% bottom", end: "76% bottom" },
      });
      // footage breathes while trapped in the letters, settles when free
      gsap.fromTo(photoRef.current, { scale: 1.22 }, { scale: 1, ease: "none", scrollTrigger: st });
      gsap.fromTo(
        landRef.current,
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "78% bottom", end: "94% bottom" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[300vh] bg-cream">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the footage behind the letters */}
        <div ref={photoRef} className="absolute inset-0 will-change-transform">
          <Image src="/images/himalaya-sunrise.jpg" alt="Sunrise over the Himalayas" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-ink/20" aria-hidden="true" />
        </div>

        {/* the cream slab with INDIA punched out — origin sits in the D's counter */}
        <div ref={slabRef} className="absolute inset-0 will-change-transform" style={{ transformOrigin: "77.5% 50%" }}>
          <svg className="h-full w-full" viewBox="0 0 1000 563" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <mask id="l01-cut">
                <rect width="1000" height="563" fill="white" />
                <text
                  x="500" y="281" textAnchor="middle" dominantBaseline="central"
                  fill="black" fontSize="235" fontWeight="800" letterSpacing="-8"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  INDIA
                </text>
              </mask>
            </defs>
            <rect width="1000" height="563" fill="#faf6ef" mask="url(#l01-cut)" />
            {/* slab chrome — rides along and flies past the camera */}
            <text x="500" y="88" textAnchor="middle" fill="#16130f" fontSize="13" fontWeight="700" letterSpacing="7" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              TRIPWALEY PRESENTS
            </text>
            <text x="500" y="492" textAnchor="middle" fill="#c9252c" fontSize="13" fontWeight="700" letterSpacing="7" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              SEASON VII · 350 DEPARTURES
            </text>
            <line x1="380" y1="108" x2="620" y2="108" stroke="#16130f" strokeOpacity="0.25" strokeWidth="1" />
            <line x1="380" y1="462" x2="620" y2="462" stroke="#16130f" strokeOpacity="0.25" strokeWidth="1" />
          </svg>
        </div>

        {/* the landing, once you're through */}
        <div ref={landRef} className="absolute inset-0 flex flex-col items-center justify-end pb-[12vh] text-center opacity-0">
          <p className="font-script text-3xl text-gold sm:text-4xl">you&apos;re in</p>
          <h2 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl">
            Now stay a while.
          </h2>
          <a href="#" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
            Start exploring →
          </a>
        </div>

        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.6rem] font-bold uppercase tracking-[0.35em] text-ink/40">
          scroll to enter
        </p>
      </div>
    </section>
  );
}
