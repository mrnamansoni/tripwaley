"use client";

/* L39 — "Night Shift" (footer)
   A footer with its own rotating planet: a canvas-2D dot globe spinning
   quietly in the corner (India in brand red), beside office cities with
   their clocks ticking live. The company never quite sleeps. */

import { useEffect, useRef, useState } from "react";
import { useEntrance, Eyebrow } from "./shared";

const CITIES = [
  { name: "New Delhi", role: "HQ · trip design", tz: "Asia/Kolkata" },
  { name: "Leh", role: "mountain ops", tz: "Asia/Kolkata" },
  { name: "Kochi", role: "coastal ops", tz: "Asia/Kolkata" },
  { name: "Dubai", role: "intl. desk", tz: "Asia/Dubai" },
];

export default function L39GlobeFooter() {
  const ref = useEntrance<HTMLElement>("top 75%");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  /* live clocks */
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), 0);
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  /* canvas dot globe */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio, 2);
    const SIZE = 280;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // fibonacci points with lat/lon retained
    const N = 900;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y);
      const lon = ((golden * i) % (Math.PI * 2)) - Math.PI;
      const india = lat > 0.1 && lat < 0.63 && lon > 1.18 && lon < 1.72;
      return { lat, lon, india };
    });

    let rot = 0;
    let raf = 0;
    let running = false;
    const R = SIZE / 2 - 14;

    const draw = () => {
      rot += 0.0035;
      ctx.clearRect(0, 0, SIZE, SIZE);
      for (const p of pts) {
        const lon = p.lon + rot;
        const x = Math.cos(p.lat) * Math.sin(lon);
        const z = Math.cos(p.lat) * Math.cos(lon);
        if (z < -0.15) continue; // back of the planet
        const y = Math.sin(p.lat);
        const px = SIZE / 2 + x * R;
        const py = SIZE / 2 - y * R;
        const depth = (z + 1) / 2;
        ctx.fillStyle = p.india
          ? `rgba(232, 53, 60, ${0.35 + depth * 0.65})`
          : `rgba(214, 200, 176, ${0.08 + depth * 0.4})`;
        const r = 0.8 + depth * 1.1 + (p.india ? 0.5 : 0);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const clock = (tz: string) =>
    now
      ? now.toLocaleTimeString("en-IN", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      : "--:--:--";

  return (
    <footer ref={ref} className="bg-[#0d0b09] py-[10vh]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[auto_1fr]">
        {/* the planet */}
        <div data-in className="relative mx-auto">
          <canvas ref={canvasRef} className="h-[280px] w-[280px]" aria-label="Rotating globe with India highlighted" />
          <p className="mt-2 text-center font-mono text-[0.58rem] uppercase tracking-[0.3em] text-white/35">
            rotation: real · sleep: optional
          </p>
        </div>

        <div>
          <Eyebrow tone="gold">the night shift</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Someone&apos;s always <span className="text-gold">awake.</span>
          </h2>

          <div data-in className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {CITIES.map((c) => (
              <div key={c.name} className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="font-display text-lg font-extrabold text-white">{c.name}</p>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-white/40">{c.role}</p>
                </div>
                <p className="font-mono text-xl text-gold tabular-nums">{clock(c.tz)}</p>
              </div>
            ))}
          </div>

          <div data-in className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/35">
            <p>© 2026 tripwaley · made in india, used everywhere</p>
            <div className="flex gap-5">
              {["Instagram", "YouTube", "X"].map((s) => (
                <a key={s} href="#" className="transition-colors hover:text-gold">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
