"use client";

/* L30 — "Baggage Claim" (CTA)
   Thirteen destination tags tumble off the carousel and pile up in the
   pit — real gravity, real collisions, all grabbable and throwable.
   The CTA sits on the rim: "pick one up." */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

const TAGS = [
  { label: "LEH", cls: "bg-brand text-white" }, { label: "GOA", cls: "bg-gold text-ink" },
  { label: "SPITI", cls: "bg-ink text-cream" }, { label: "KOCHI", cls: "bg-success text-white" },
  { label: "JAIPUR", cls: "bg-[#d76b9a] text-white" }, { label: "SHILLONG", cls: "bg-[#3a6ea5] text-white" },
  { label: "MANALI", cls: "bg-card text-ink border border-line" }, { label: "RISHIKESH", cls: "bg-[#7a4bd0] text-white" },
  { label: "ANDAMAN", cls: "bg-[#0f8b8d] text-white" }, { label: "KASOL", cls: "bg-[#5c8a3a] text-white" },
  { label: "AGRA", cls: "bg-[#c9a227] text-ink" }, { label: "VARKALA", cls: "bg-[#e0603a] text-white" },
  { label: "TAWANG", cls: "bg-[#444b7a] text-white" },
];

interface Body { x: number; y: number; vx: number; vy: number; r: number; held: boolean; }

export default function L30LuggagePit() {
  const ref = useEntrance<HTMLElement>();
  const pitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pit = pitRef.current;
    if (!pit) return;
    const chips = Array.from(pit.querySelectorAll<HTMLElement>("[data-l30-chip]"));
    const bodies: Body[] = chips.map((c, i) => ({
      x: 60 + (i % 7) * ((pit.clientWidth - 120) / 6) + (i % 2) * 14,
      y: -80 - Math.floor(i / 7) * 120 - i * 26,
      vx: (i % 3) - 1,
      vy: 0,
      r: Math.max(c.offsetWidth, c.offsetHeight) / 2,
      held: false,
    }));

    let running = false;
    let raf = 0;
    let dropped = false;

    const step = () => {
      const W = pit.clientWidth;
      const H = pit.clientHeight;
      for (const b of bodies) {
        if (b.held) continue;
        b.vy += 0.45; // gravity
        b.vx *= 0.995;
        b.x += b.vx;
        b.y += b.vy;
        // walls & floor
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
        if (b.y > H - b.r - 6) { b.y = H - b.r - 6; b.vy *= -0.32; b.vx *= 0.92; }
      }
      // pairwise separation (soft circles)
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], c = bodies[j];
          const dx = c.x - a.x, dy = c.y - a.y;
          const min = (a.r + c.r) * 0.82;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < min * min) {
            const d = Math.sqrt(d2);
            const push = (min - d) / 2;
            const nx = dx / d, ny = dy / d;
            if (!a.held) { a.x -= nx * push; a.y -= ny * push; }
            if (!c.held) { c.x += nx * push; c.y += ny * push; }
          }
        }
      }
      chips.forEach((chip, i) => {
        const b = bodies[i];
        chip.style.transform = `translate(${b.x - chip.offsetWidth / 2}px, ${b.y - chip.offsetHeight / 2}px) rotate(${b.vx * 2.4}deg)`;
      });
      if (running) raf = requestAnimationFrame(step);
    };

    const st = ScrollTrigger.create({
      trigger: pit,
      start: "top 78%",
      onEnter: () => {
        dropped = true;
        running = true;
        raf = requestAnimationFrame(step);
      },
      onLeave: () => { running = false; cancelAnimationFrame(raf); },
      onEnterBack: () => { if (dropped) { running = true; raf = requestAnimationFrame(step); } },
      onLeaveBack: () => { running = false; cancelAnimationFrame(raf); },
    });

    /* grab & toss */
    const cleanups = chips.map((chip, i) => {
      const b = bodies[i];
      let px = 0, py = 0;
      const onDown = (e: PointerEvent) => {
        b.held = true;
        chip.setPointerCapture(e.pointerId);
        px = e.clientX; py = e.clientY;
        gsap.to(chip, { scale: 1.15, duration: 0.2 });
      };
      const onMove = (e: PointerEvent) => {
        if (!b.held) return;
        b.vx = e.clientX - px; b.vy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        b.x += b.vx; b.y += b.vy;
      };
      const onUp = () => {
        b.held = false;
        gsap.to(chip, { scale: 1, duration: 0.25 });
      };
      chip.addEventListener("pointerdown", onDown);
      chip.addEventListener("pointermove", onMove);
      chip.addEventListener("pointerup", onUp);
      chip.addEventListener("pointercancel", onUp);
      return () => {
        chip.removeEventListener("pointerdown", onDown);
        chip.removeEventListener("pointermove", onMove);
        chip.removeEventListener("pointerup", onUp);
        chip.removeEventListener("pointercancel", onUp);
      };
    });

    return () => {
      st.kill();
      cancelAnimationFrame(raf);
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[12vh]">
      <div className="mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
        <Eyebrow>baggage claim · belt 7</Eyebrow>
        <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Unclaimed <span className="text-brand">weekends.</span>
        </h2>
        <p data-in className="mx-auto mt-4 max-w-md text-base text-ink/60">
          Thirteen destinations nobody&apos;s picked up yet. They fall, they pile,
          they can absolutely be thrown at each other.
        </p>

        <div
          ref={pitRef}
          data-in
          className="relative mx-auto mt-10 h-[24rem] touch-none overflow-hidden rounded-[1.8rem] border-2 border-dashed border-ink/20 bg-blush"
        >
          {TAGS.map((t) => (
            <button
              key={t.label}
              type="button"
              data-l30-chip
              className={`absolute left-0 top-0 cursor-grab touch-none rounded-full px-5 py-2.5 font-display text-sm font-extrabold tracking-wide shadow-card-lg will-change-transform active:cursor-grabbing ${t.cls}`}
              style={{ transform: "translate(-200px, -200px)" }}
            >
              {t.label}
            </button>
          ))}
          <p className="pointer-events-none absolute bottom-4 w-full text-center text-[0.6rem] font-bold uppercase tracking-[0.35em] text-ink/35">
            grab one · it&apos;s yours now
          </p>
        </div>

        <a data-in href="#" className="mt-9 inline-flex min-h-12 items-center rounded-full bg-brand px-9 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
          Claim yours properly →
        </a>
      </div>
    </section>
  );
}
