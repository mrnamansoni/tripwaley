"use client";

/* HERO 05 — "Contour Expedition"
   Dark expedition chart: topographic contour rings draw themselves in,
   drift with the cursor, a gold dotted route crosses the map, and an
   altitude ticker climbs. Premium mountaineering-brief energy. */

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** wobbly concentric contour rings, deterministic */
function contourPath(cx: number, cy: number, r: number, seed: number): string {
  const pts: string[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob = Math.sin(a * 3 + seed) * r * 0.07 + Math.cos(a * 5 + seed * 2) * r * 0.045;
    const x = cx + Math.cos(a) * (r + wob);
    const y = cy + Math.sin(a) * (r + wob) * 0.82;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ") + "Z";
}

export default function Hero05Contours() {
  const ref = useRef<HTMLElement>(null);
  const mapRef = useRef<SVGSVGElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);

  const rings = useMemo(
    () => [70, 105, 145, 190, 240, 295, 355].map((r, i) => contourPath(430, 300, r, i * 1.7)),
    []
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGPathElement>("[data-ct-ring]").forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(
          p,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: 1.6,
            delay: i * 0.12,
            ease: "power2.inOut",
            scrollTrigger: { trigger: ref.current, start: "top 60%" },
          }
        );
      });
      gsap.fromTo(
        "[data-ct-copy]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 62%" } }
      );
      // altitude ticker
      const counter = { v: 0 };
      gsap.to(counter, {
        v: 4270,
        duration: 2.4,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 55%" },
        onUpdate: () => {
          if (altRef.current) altRef.current.textContent = Math.round(counter.v).toLocaleString("en-IN");
        },
      });
    }, ref);

    // cursor parallax on the contour map
    const onMove = (e: PointerEvent) => {
      if (!mapRef.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      gsap.to(mapRef.current, { x: nx * 26, y: ny * 18, duration: 1, ease: "power2.out" });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden bg-ink py-24">
      {/* contour chart */}
      <svg
        ref={mapRef}
        viewBox="0 0 860 600"
        className="pointer-events-none absolute -right-24 top-1/2 w-[54rem] -translate-y-1/2 opacity-70 sm:-right-10"
        aria-hidden="true"
      >
        {rings.map((d, i) => (
          <path key={i} data-ct-ring d={d} fill="none" stroke="#f5a31a" strokeOpacity={0.34 - i * 0.03} strokeWidth="1.5" />
        ))}
        {/* summit + route */}
        <circle cx="430" cy="300" r="5" fill="#f5a31a" />
        <path
          data-ct-ring
          d="M80,520 C 200,470 260,380 350,350 S 420,320 430,300"
          fill="none"
          stroke="#c91b20"
          strokeWidth="2.5"
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <text x="446" y="296" fill="#f5a31a" fontSize="13" fontWeight="700" letterSpacing="2">SUMMIT CAMP</text>
        <text x="66" y="545" fill="#c91b20" fontSize="12" fontWeight="700" letterSpacing="2">YOU, PROBABLY</text>
      </svg>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p data-ct-copy className="flex items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-gold">
            <span className="h-px w-10 bg-gold" aria-hidden="true" />
            Expedition brief · Batch 08
          </p>
          <h1 data-ct-copy className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl">
            The high passes
            <br />
            are <span className="text-gold">calling.</span>
          </h1>
          <p data-ct-copy className="mt-6 max-w-md text-base leading-relaxed text-white/60">
            Kedarkantha, Brahmatal, Hampta — certified trek leaders, oxygen on
            every route, and a batch that waits for the slowest climber. Summits
            are a team sport.
          </p>
          <div data-ct-copy className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Join the expedition
            </a>
            <a href="#" className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-7 py-3.5 font-bold text-white transition-colors hover:border-gold hover:text-gold">
              Trek calendar
            </a>
          </div>
        </div>

        {/* altitude ticker */}
        <div data-ct-copy className="mt-14 flex items-end gap-3 border-t border-white/10 pt-6 sm:absolute sm:bottom-0 sm:right-8 sm:mt-0 sm:border-0">
          <p className="font-display text-5xl font-extrabold text-gold tabular-nums sm:text-6xl">
            <span ref={altRef}>0</span>
          </p>
          <p className="pb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-white/50">
            metres above
            <br />
            your desk
          </p>
        </div>
      </div>
    </section>
  );
}
