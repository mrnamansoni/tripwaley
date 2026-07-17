"use client";

/* L14 — "The Ribbon" (destination / route section)
   The Delhi→Leh highway as a gold ribbon that draws itself down the page
   while a tiny plane rides its tip. Waypoint cards pop as the ink passes
   them — altitude, night stop, one-liner. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const PATH = "M 80 20 C 260 90, 40 200, 200 290 C 340 370, 120 460, 240 560 C 330 635, 180 720, 260 780";

const STOPS = [
  { u: 0.02, name: "Delhi", alt: "216 m", note: "Rolling out at 4 AM sharp", side: "right" },
  { u: 0.3, name: "Manali", alt: "2,050 m", note: "First maggi checkpoint", side: "left" },
  { u: 0.55, name: "Jispa", alt: "3,200 m", note: "Night halt by the Bhaga", side: "right" },
  { u: 0.78, name: "Sarchu", alt: "4,290 m", note: "Sleep light, dream heavy", side: "left" },
  { u: 0.97, name: "Leh", alt: "3,500 m", note: "Made it. Chai first.", side: "right" },
];

export default function L14RouteRibbon() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-l14-stop]");
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top 55%", end: "bottom 78%", scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress;
            path.style.strokeDashoffset = String(len * (1 - p));
            // plane rides the tip, nose along the tangent
            const pt = path.getPointAtLength(len * p);
            const ahead = path.getPointAtLength(Math.min(len, len * p + 2));
            const deg = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
            planeRef.current?.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${deg + 90})`);
            // stops pop once the ink passes them
            cards.forEach((card, i) => {
              const on = p >= STOPS[i].u;
              card.style.opacity = on ? "1" : "0";
              card.style.transform = on ? "translateX(0) scale(1)" : `translateX(${STOPS[i].side === "left" ? -24 : 24}px) scale(0.94)`;
            });
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="noise relative overflow-hidden bg-[#141410] py-[12vh]">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">manali–leh highway · 474 km</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          The road draws <span className="text-gold">itself.</span>
        </h2>
      </div>

      <div className="relative mx-auto mt-8 h-[820px] w-full max-w-md">
        <svg viewBox="0 0 320 800" className="h-full w-full" fill="none" aria-hidden="true">
          {/* ghost of the full route */}
          <path d={PATH} stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
          {/* the ink */}
          <path ref={pathRef} d={PATH} stroke="#f5a31a" strokeWidth="3.5" strokeLinecap="round" />
          {/* the plane */}
          <g ref={planeRef}>
            <path d="M0,-9 L6,6 L0,2.5 L-6,6 Z" fill="#e8353c" stroke="#fff" strokeWidth="0.8" />
          </g>
        </svg>

        {/* waypoint cards */}
        {STOPS.map((s) => (
          <div
            key={s.name}
            data-l14-stop
            className={`absolute w-44 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 opacity-0 backdrop-blur-md sm:w-52 ${
              s.side === "left" ? "left-0" : "right-0"
            }`}
            style={{ top: `${6 + s.u * 86}%`, transition: "opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1)" }}
          >
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-extrabold text-white">{s.name}</p>
              <p className="font-mono text-[0.62rem] text-gold">{s.alt}</p>
            </div>
            <p className="mt-0.5 text-xs text-white/55">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 font-bold text-[#141410] transition-transform hover:scale-[1.04]">
          Ride this line →
        </a>
      </div>
    </section>
  );
}
