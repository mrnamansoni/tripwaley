"use client";

/* HERO 06 — "Flight Network"
   Canvas particle map: India rendered as a field of dots, live red flight
   arcs pulsing between cities, dots shying away from the cursor. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/* rough India silhouette, normalized 0–1 */
const OUTLINE: [number, number][] = [
  [0.42, 0.02], [0.52, 0.06], [0.6, 0.12], [0.72, 0.2], [0.88, 0.26],
  [0.95, 0.3], [0.88, 0.36], [0.8, 0.4], [0.72, 0.36], [0.68, 0.44],
  [0.58, 0.58], [0.52, 0.72], [0.47, 0.86], [0.42, 0.72], [0.36, 0.56],
  [0.3, 0.42], [0.26, 0.32], [0.14, 0.28], [0.2, 0.2], [0.3, 0.12], [0.36, 0.06],
];

const CITIES: { name: string; x: number; y: number }[] = [
  { name: "LEH", x: 0.46, y: 0.09 },
  { name: "DELHI", x: 0.42, y: 0.21 },
  { name: "SHILLONG", x: 0.84, y: 0.32 },
  { name: "JAIPUR", x: 0.35, y: 0.26 },
  { name: "MUMBAI", x: 0.3, y: 0.45 },
  { name: "GOA", x: 0.33, y: 0.56 },
  { name: "KOCHI", x: 0.41, y: 0.76 },
  { name: "CHENNAI", x: 0.54, y: 0.66 },
];

function inPoly(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export default function Hero06FlightNetwork() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = ref.current;
    if (!canvas || !section) return;
    const ctx2d = canvas.getContext("2d")!;

    let W = 0, H = 0, mapX = 0, mapY = 0, mapS = 0;
    let dots: { x: number; y: number }[] = [];
    let cities: { name: string; x: number; y: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    let running = false;
    let raf = 0;
    let t = 0;

    const layout = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      // map occupies the right side on desktop, center on mobile
      const wide = W > 900;
      mapS = Math.min(H * 1.02, wide ? W * 0.44 : W * 0.94);
      mapX = wide ? W * 0.56 : W * 0.5 - mapS * 0.5;
      mapY = H * 0.5 - mapS * 0.46;
      dots = [];
      const step = mapS / 34;
      for (let gx = 0; gx < mapS; gx += step) {
        for (let gy = 0; gy < mapS; gy += step) {
          if (inPoly(gx / mapS, gy / mapS)) dots.push({ x: mapX + gx, y: mapY + gy });
        }
      }
      cities = CITIES.map((c) => ({ name: c.name, x: mapX + c.x * mapS, y: mapY + c.y * mapS }));
    };

    const draw = () => {
      t += 0.008;
      ctx2d.clearRect(0, 0, W, H);

      // dot field with cursor repulsion
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        let ox = 0, oy = 0;
        if (dist2 < 8100) {
          const dist = Math.sqrt(dist2) || 1;
          const f = ((90 - dist) / 90) * 14;
          ox = (dx / dist) * f;
          oy = (dy / dist) * f;
        }
        ctx2d.fillStyle = "rgba(26,22,20,0.22)";
        ctx2d.beginPath();
        ctx2d.arc(d.x + ox, d.y + oy, 1.6, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // flight arcs: three staggered comets cycling city pairs
      for (let k = 0; k < 3; k++) {
        const phase = (t * 0.55 + k / 3) % 1;
        const pairIdx = (Math.floor(t * 0.55 + k / 3) * 3 + k * 2) % (CITIES.length - 1);
        const a = cities[pairIdx];
        const b = cities[(pairIdx + 2) % cities.length];
        if (!a || !b) continue;
        const mx = (a.x + b.x) / 2;
        const my = Math.min(a.y, b.y) - Math.abs(a.x - b.x) * 0.35 - 30;
        ctx2d.strokeStyle = "rgba(201,27,32,0.85)";
        ctx2d.lineWidth = 2;
        ctx2d.lineCap = "round";
        ctx2d.beginPath();
        const TRAIL = 0.22;
        for (let s = 0; s <= 20; s++) {
          const tt = Math.max(0, phase - TRAIL + (s / 20) * TRAIL);
          const u = 1 - tt;
          const px = u * u * a.x + 2 * u * tt * mx + tt * tt * b.x;
          const py = u * u * a.y + 2 * u * tt * my + tt * tt * b.y;
          if (s === 0) ctx2d.moveTo(px, py);
          else ctx2d.lineTo(px, py);
        }
        ctx2d.globalAlpha = 0.9;
        ctx2d.stroke();
        ctx2d.globalAlpha = 1;
      }

      // cities: pulse + label
      for (const c of cities) {
        const pulse = (Math.sin(t * 3 + c.x) + 1) / 2;
        ctx2d.fillStyle = "#c91b20";
        ctx2d.beginPath();
        ctx2d.arc(c.x, c.y, 3.2, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.strokeStyle = `rgba(201,27,32,${0.5 - pulse * 0.45})`;
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.arc(c.x, c.y, 5 + pulse * 9, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.fillStyle = "rgba(26,22,20,0.55)";
        ctx2d.font = "700 9.5px var(--font-body), sans-serif";
        ctx2d.fillText(c.name, c.x + 9, c.y + 3);
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    layout();
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    });
    io.observe(section);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    section.addEventListener("pointermove", onMove, { passive: true });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-fn-copy]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 62%" } }
      );
    }, section);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden bg-cream">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="pointer-events-none relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p data-fn-copy className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-brand">
            Live network · 350+ departures a year
          </p>
          <h1 data-fn-copy className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            One country.
            <br />
            A hundred
            <br />
            <span className="text-brand">weekends.</span>
          </h1>
          <p data-fn-copy className="mt-6 max-w-sm text-base leading-relaxed text-ink/65">
            Every red arc is a batch already on the road. Pick a dot, we&apos;ll
            handle the rest — stays, transport, and fourteen new co-conspirators.
          </p>
          <div data-fn-copy className="pointer-events-auto mt-8 flex items-center gap-4">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
              Find my departure
            </a>
            <span className="font-script text-xl text-ink/50">cursor se dots ko chhedo →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
