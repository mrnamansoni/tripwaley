"use client";

/* L19 — "The Profile" (itinerary section)
   The trip as an ECG: an altitude profile that draws with scroll, a live
   altimeter counting the metres, and camp flags planting themselves as
   the line summits. Data-viz that gives you altitude sickness. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

/* x, altitude(m) */
const PROFILE: [number, number][] = [
  [0, 216], [14, 1950], [30, 2050], [44, 3980], [58, 3200], [72, 4290], [86, 5359], [100, 3500],
];
const FLAGS = [
  { x: 14, name: "Manali" }, { x: 44, name: "Rohtang" }, { x: 72, name: "Sarchu" }, { x: 86, name: "Khardung La" }, { x: 100, name: "Leh" },
];
const MAX_ALT = 5600;

const toY = (alt: number) => 210 - (alt / MAX_ALT) * 185;
const linePath = PROFILE.map(([x, a], i) => `${i === 0 ? "M" : "L"} ${x * 7.6 + 20} ${toY(a)}`).join(" ");

export default function L19AltitudeChart() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);

    const ctx = gsap.context(() => {
      const flags = gsap.utils.toArray<HTMLElement>("[data-l19-flag]");
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top 40%", end: "bottom 92%", scrub: 0.45,
          onUpdate: (self) => {
            const p = self.progress;
            path.style.strokeDashoffset = String(len * (1 - p));
            const pt = path.getPointAtLength(len * p);
            dotRef.current?.setAttribute("cx", String(pt.x));
            dotRef.current?.setAttribute("cy", String(pt.y));
            // live altimeter from the y coordinate
            const alt = Math.round(((210 - pt.y) / 185) * MAX_ALT);
            if (readRef.current) readRef.current.textContent = alt.toLocaleString("en-IN");
            flags.forEach((f, i) => {
              const on = pt.x >= FLAGS[i].x * 7.6 + 18;
              f.style.opacity = on ? "1" : "0";
              f.style.transform = on ? "translateY(0)" : "translateY(10px)";
            });
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="noise bg-[#0f1310] py-[13vh]">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="gold">delhi → leh · vertical truth</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              The itinerary, <span className="text-gold">as an ECG.</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/45">current altitude</p>
            <p className="font-display text-4xl font-extrabold text-gold tabular-nums sm:text-5xl">
              <span ref={readRef}>216</span>
              <span className="ml-1 text-lg text-white/50">m</span>
            </p>
          </div>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <svg viewBox="0 0 800 240" className="w-full" aria-hidden="true">
            {/* altitude gridlines */}
            {[1000, 2000, 3000, 4000, 5000].map((a) => (
              <g key={a}>
                <line x1="20" x2="780" y1={toY(a)} y2={toY(a)} stroke="rgba(255,255,255,0.07)" strokeDasharray="2 6" />
                <text x="784" y={toY(a) + 3} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace" textAnchor="start">{a / 1000}k</text>
              </g>
            ))}
            {/* danger zone */}
            <rect x="20" y={toY(5600)} width="760" height={toY(4500) - toY(5600)} fill="rgba(232,32,40,0.07)" />
            <text x="30" y={toY(5300)} fill="rgba(232,53,60,0.6)" fontSize="9" fontFamily="monospace">ACCLIMATISE ZONE</text>
            {/* the line */}
            <path ref={pathRef} d={linePath} fill="none" stroke="#f5a31a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <circle ref={dotRef} r="6" cx="20" cy={toY(216)} fill="#e8353c" stroke="#fff" strokeWidth="2" />
          </svg>

          {/* camp flags */}
          {FLAGS.map((f) => (
            <div
              key={f.name}
              data-l19-flag
              className="absolute bottom-4 opacity-0"
              style={{ left: `${4 + f.x * 0.88}%`, transition: "opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)" }}
            >
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm">
                ⛺ {f.name}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-white/45">
          Two acclimatisation nights built in — the chart is dramatic, the plan isn&apos;t.
        </p>
      </div>
    </section>
  );
}
