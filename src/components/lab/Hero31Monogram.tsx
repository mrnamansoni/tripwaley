"use client";

/* HERO 31 — "Gold Dust"
   The monogram, poured in gold dust: thousands of particles hold the
   letterform TW; your cursor scatters them like breath on powder and they
   drift home again. Jewellery-counter physics. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface P {
  hx: number; hy: number; // home
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  warm: boolean;
}

export default function Hero31Monogram() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = ref.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx2d = canvas.getContext("2d")!;
    let parts: P[] = [];
    let W = 0, H = 0;
    const mouse = { x: -9e3, y: -9e3 };
    let running = false;
    let raf = 0;

    const build = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      // stamp the monogram offscreen and sample it into particles
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d")!;
      const size = Math.min(W * 0.42, H * 0.62);
      o.font = `900 ${size}px ${getComputedStyle(document.body).fontFamily}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillText("tw", W / 2, H * 0.46);
      const data = o.getImageData(0, 0, W, H).data;

      parts = [];
      const step = Math.max(3, Math.round(W / 300));
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            parts.push({
              hx: x, hy: y,
              x: x + (Math.random() - 0.5) * 300,
              y: y + (Math.random() - 0.5) * 300,
              vx: 0, vy: 0,
              r: 0.8 + Math.random() * 1.3,
              warm: Math.random() < 0.2,
            });
          }
        }
      }
    };

    const drawFrame = () => {
      ctx2d.clearRect(0, 0, W, H);
      for (const p of parts) {
        // spring home
        p.vx += (p.hx - p.x) * 0.012;
        p.vy += (p.hy - p.y) * 0.012;
        // cursor breath
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 12100) {
          const d = Math.sqrt(d2) || 1;
          const f = ((110 - d) / 110) * 2.6;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;

        ctx2d.fillStyle = p.warm ? "rgba(232,32,40,0.85)" : "rgba(245,163,26,0.9)";
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx2d.fill();
      }
      if (running) raf = requestAnimationFrame(drawFrame);
    };

    build();
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(drawFrame);
      else cancelAnimationFrame(raf);
    });
    io.observe(section);
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    section.addEventListener("pointermove", onMove, { passive: true });

    const g = gsap.context(() => {
      gsap.fromTo(
        "[data-mono-in]",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.14, scrollTrigger: { trigger: section, start: "top 60%" } }
      );
    }, section);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      g.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col overflow-hidden bg-[#0e0c09]">
      {/* velvet pool of light behind the dust */}
      <div aria-hidden="true" className="absolute left-1/2 top-[42%] h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="pointer-events-none relative mt-auto pb-16 pt-[62vh] text-center">
        <p data-mono-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-gold">
          The house mark · disturb gently
        </p>
        <h1
          data-mono-in
          className="mx-auto mt-5 max-w-3xl px-6 text-4xl font-light leading-[1.1] text-[#f4ead2] sm:text-6xl"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Wander looks good
          <br />
          <em className="italic text-gold">on everyone.</em>
        </h1>
        <div data-mono-in className="mt-8">
          <a
            href="#"
            className="pointer-events-auto inline-block border border-gold/70 px-9 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-[#0e0c09]"
          >
            Wear the mark
          </a>
        </div>
      </div>
    </section>
  );
}
