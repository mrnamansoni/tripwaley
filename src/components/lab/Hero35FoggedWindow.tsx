"use client";

/* HERO 35 — "First Rain"
   A monsoon window fogged with condensation; you wipe it clear with your
   finger to reveal Meghalaya behind the glass. Canvas destination-alpha
   erasing, drifting droplets, the fog slowly creeping back. Deeply Indian. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero35FoggedWindow() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = ref.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, dpr = 1;
    let running = false;
    let raf = 0;
    let last = { x: 0, y: 0, on: false };
    let idle = 0;
    let sawPointer = false;

    interface Drop { x: number; y: number; r: number; vy: number; }
    let drops: Drop[] = [];

    const paintFog = () => {
      // frosted base
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#cdd6d3");
      g.addColorStop(1, "#b9c4c2");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // speckle for condensation texture
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 900; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.6, 0, 6.28);
        ctx.fill();
      }
    };

    const build = () => {
      dpr = Math.min(devicePixelRatio, 2);
      W = canvas.clientWidth * dpr;
      H = canvas.clientHeight * dpr;
      canvas.width = W;
      canvas.height = H;
      drops = Array.from({ length: 26 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (3 + Math.random() * 7) * dpr,
        vy: (0.2 + Math.random() * 0.5) * dpr,
      }));
      paintFog();
    };

    const wipe = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out";
      const r = 46 * dpr;
      // smear between last and current for a continuous swipe
      const steps = last.on ? Math.ceil(Math.hypot(x - last.x, y - last.y) / (r * 0.4)) : 1;
      for (let s = 0; s <= steps; s++) {
        const ix = last.on ? last.x + ((x - last.x) * s) / steps : x;
        const iy = last.on ? last.y + ((y - last.y) * s) / steps : y;
        const grd = ctx.createRadialGradient(ix, iy, 0, ix, iy, r);
        grd.addColorStop(0, "rgba(0,0,0,1)");
        grd.addColorStop(0.7, "rgba(0,0,0,0.65)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(ix, iy, r, 0, 6.28);
        ctx.fill();
      }
      last = { x, y, on: true };
    };

    const tick = () => {
      // droplets slide + carve thin trails
      ctx.globalCompositeOperation = "destination-out";
      for (const d of drops) {
        d.y += d.vy;
        if (d.y - d.r > H) { d.y = -d.r; d.x = Math.random() * W; }
        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        grd.addColorStop(0, "rgba(0,0,0,0.5)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, 6.28);
        ctx.fill();
      }
      // fog very slowly creeps back
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(199,208,205,0.006)";
      ctx.fillRect(0, 0, W, H);

      // idle auto-wipe until first real touch
      if (!sawPointer) {
        idle += 0.02;
        wipe(W * (0.5 + Math.sin(idle) * 0.3), H * (0.5 + Math.cos(idle * 1.3) * 0.24));
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    build();
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    });
    io.observe(section);
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      sawPointer = true;
      const r = canvas.getBoundingClientRect();
      wipe((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
    };
    const onLeave = () => { last.on = false; };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);

    const g = gsap.context(() => {
      gsap.fromTo("[data-fw-in]", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.13, scrollTrigger: { trigger: section, start: "top 60%" } });
    }, section);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      g.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink">
      {/* the world behind the glass */}
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/images/meghalaya.jpg)" }} />
      <div aria-hidden="true" className="absolute inset-0 bg-ink/15" />

      {/* the fog you wipe */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden="true" />

      {/* copy sits above, always legible */}
      <div className="pointer-events-none relative px-6 text-center">
        <p data-fw-in className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-white drop-shadow-lg">
          wipe the glass · monsoon&apos;s calling
        </p>
        <h1 data-fw-in className="mt-5 font-display text-[clamp(3rem,10vw,8rem)] font-extrabold leading-[0.96] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          Clear skies are
          <br />
          <span className="text-gold">overrated.</span>
        </h1>
        <p data-fw-in className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/85 drop-shadow-lg">
          Cherrapunji in full pour, root bridges, and chai that hits different
          when it&apos;s bucketing outside.
        </p>
        <a data-fw-in href="#" className="pointer-events-auto mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 font-bold text-ink shadow-card-lg transition-transform hover:scale-[1.03]">
          Chase the rain →
        </a>
      </div>
    </section>
  );
}
