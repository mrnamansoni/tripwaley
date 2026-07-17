"use client";

/* L38 — "Base Camp" (footer)
   A survey-map footer: hand-wobbled contour rings drifting like weather
   systems, a pulsing gold summit pin, grid references on the links.
   Cartography as brand voice. */

import { useMemo } from "react";
import { useEntrance, Eyebrow } from "./shared";
import { prng } from "../lab/three/util3d";

/* hand-wobbled concentric contours around the summit pin */
function contourPath(cx: number, cy: number, r: number, seed: number): string {
  const rand = prng(seed);
  const pts: string[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob = r * (1 + (rand() - 0.5) * 0.16);
    const x = cx + Math.cos(a) * wob;
    const y = cy + Math.sin(a) * wob * 0.72;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ") + "Z";
}

export default function L38TopoFooter() {
  const ref = useEntrance<HTMLElement>("top 75%");
  const rings = useMemo(() => Array.from({ length: 7 }, (_, i) => contourPath(640, 210, 60 + i * 58, i + 3)), []);

  return (
    <footer ref={ref} className="relative overflow-hidden bg-[#101710] py-[10vh]">
      {/* drifting contours */}
      <svg viewBox="0 0 1280 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
        {rings.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={i === 2 ? "rgba(245,163,26,0.5)" : "rgba(190,205,180,0.28)"}
            strokeWidth={i === 2 ? 1.4 : 1}
            strokeDasharray={i % 2 ? "5 7" : undefined}
            style={{ animation: `l38drift ${26 + i * 7}s ease-in-out infinite alternate`, transformOrigin: "640px 210px" }}
          />
        ))}
        {/* grid crosses */}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = 90 + (i % 6) * 220;
          const y = 90 + Math.floor(i / 6) * 240;
          return (
            <g key={i} stroke="rgba(190,205,180,0.22)" strokeWidth="1">
              <line x1={x - 7} x2={x + 7} y1={y} y2={y} />
              <line x1={x} x2={x} y1={y - 7} y2={y + 7} />
            </g>
          );
        })}
      </svg>

      {/* summit pin */}
      <div aria-hidden="true" className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
        <span className="block h-3 w-3 rounded-full bg-gold shadow-[0_0_0_0_rgba(245,163,26,0.5)]" style={{ animation: "l38ping 2.6s ease-out infinite" }} />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="text-center">
          <Eyebrow tone="gold">survey sheet 53-J · base camp</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#e9eede] sm:text-6xl">
            You are <span className="text-gold">here.</span>
          </h2>
          <p data-in className="mx-auto mt-3 max-w-md text-sm text-[#e9eede]/50">
            Elevation: sea level. Prognosis: temporary.
          </p>
        </div>

        <div data-in className="mt-14 grid gap-9 border-t border-white/10 pt-10 text-center sm:grid-cols-4 sm:text-left">
          {[
            { grid: "NE 41°", head: "Expeditions", links: ["Ladakh", "Spiti", "Sikkim"] },
            { grid: "SW 12°", head: "Coastlines", links: ["Kerala", "Andaman", "Gokarna"] },
            { grid: "HQ 00°", head: "The Company", links: ["Crew", "Reviews", "Careers"] },
            { grid: "SOS 24/7", head: "Assistance", links: ["WhatsApp", "Safety", "FAQs"] },
          ].map((col) => (
            <nav key={col.head} aria-label={col.head}>
              <p className="font-mono text-[0.58rem] tracking-[0.3em] text-gold/70">{col.grid}</p>
              <p className="mt-1.5 font-display text-base font-extrabold uppercase tracking-widest text-[#e9eede]">{col.head}</p>
              <ul className="mt-3.5 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#e9eede]/60 underline-offset-4 transition-colors hover:text-gold hover:underline">{l}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div data-in className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-[#e9eede]/35">
          <p>© 2026 tripwaley expedition co.</p>
          <p>28.6139° N, 77.2090° E</p>
          <p>chart updated hourly</p>
        </div>
      </div>
    </footer>
  );
}
