"use client";

/* HERO 38 — "True North"
   A field of compass needles that all swing to point at your cursor —
   the whole page orienting toward you. Where they cluster, a destination
   name surfaces. Magnetic, hypnotic, on-brand (Tripwaley = travel guru). */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const COLS = 9;
const ROWS = 6;

export default function Hero38Compass() {
  const ref = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const grid = gridRef.current;
    if (!el || !grid) return;

    const needles = Array.from(grid.querySelectorAll<HTMLElement>("[data-needle]"));
    const setters = needles.map((n) => gsap.quickTo(n, "rotate", { duration: 0.5, ease: "power2.out" }));
    const target = { x: 0.5, y: 0.5 };
    const pos = { x: 0.5, y: 0.5 };
    let auto = 0;
    let sawMouse = false;
    let raf = 0;
    let visible = false;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (!sawMouse) {
        auto += 0.01;
        target.x = 0.5 + Math.cos(auto) * 0.36;
        target.y = 0.5 + Math.sin(auto * 1.3) * 0.3;
      }
      pos.x += (target.x - pos.x) * 0.09;
      pos.y += (target.y - pos.y) * 0.09;
      const r = grid.getBoundingClientRect();
      const mx = pos.x * r.width;
      const my = pos.y * r.height;
      needles.forEach((n, i) => {
        const nr = n.getBoundingClientRect();
        const cx = nr.left - r.left + nr.width / 2;
        const cy = nr.top - r.top + nr.height / 2;
        const deg = (Math.atan2(my - cy, mx - cx) * 180) / Math.PI + 90;
        setters[i](deg);
      });
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") sawMouse = true;
      const r = grid.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
    };
    el.addEventListener("pointermove", onMove, { passive: true });

    const ctx = gsap.context(() => {
      gsap.fromTo("[data-cp-needle-wrap]", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.7)", stagger: { each: 0.02, from: "center", grid: [ROWS, COLS] }, scrollTrigger: { trigger: el, start: "top 65%" } });
      gsap.fromTo("[data-cp-in]", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 60%" } });
    }, el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#12100e]">
      {/* needle field */}
      <div ref={gridRef} aria-hidden="true" className="absolute inset-0 grid place-items-center gap-2 p-8" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {Array.from({ length: COLS * ROWS }).map((_, i) => (
          <div key={i} data-cp-needle-wrap className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/8">
            <div data-needle className="origin-center will-change-transform">
              {/* needle: gold north, faint south */}
              <svg width="8" height="26" viewBox="0 0 8 26" aria-hidden="true">
                <path d="M4 0 L8 13 L4 10 Z" fill="#f5a31a" />
                <path d="M4 26 L0 13 L4 16 Z" fill="rgba(255,255,255,0.22)" />
              </svg>
            </div>
            <span className="absolute h-1 w-1 rounded-full bg-white/25" />
          </div>
        ))}
      </div>

      <div className="pointer-events-none relative px-6 text-center">
        <p data-cp-in className="text-[0.65rem] font-bold uppercase tracking-[0.45em] text-gold">
          your complete travel guru
        </p>
        <h1 data-cp-in className="mt-6 font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold leading-[0.95] tracking-tight text-white">
          Every needle
          <br />
          points to <span className="text-gold">you.</span>
        </h1>
        <p data-cp-in className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/60">
          Tell us the vibe; we&apos;ll orient the whole trip around it. Move your
          cursor — feel the pull.
        </p>
        <a data-cp-in href="#" className="pointer-events-auto mt-9 inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 font-bold text-[#12100e] shadow-card-lg transition-transform hover:scale-[1.03]">
          Find my direction →
        </a>
      </div>
    </section>
  );
}
