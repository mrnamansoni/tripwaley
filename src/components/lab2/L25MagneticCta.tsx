"use client";

/* L25 — "The Magnet" (CTA)
   One button that wants to be pressed: it leans toward your cursor inside
   a magnetic field, a gooey blob swells behind it (SVG filter), and on
   click it detonates a small burst of brand confetti. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

export default function L25MagneticCta() {
  const ref = useEntrance<HTMLElement>();
  const fieldRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const btn = btnRef.current;
    if (!field || !btn) return;

    const bx = gsap.quickTo(btn, "x", { duration: 0.55, ease: "power3.out" });
    const by = gsap.quickTo(btn, "y", { duration: 0.55, ease: "power3.out" });
    const blx = gsap.quickTo(blobRef.current, "x", { duration: 0.9, ease: "power3.out" });
    const bly = gsap.quickTo(blobRef.current, "y", { duration: 0.9, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      bx(dx * 0.32);
      by(dy * 0.32);
      blx(dx * 0.55);
      bly(dy * 0.55);
    };
    const onLeave = () => { bx(0); by(0); blx(0); bly(0); };
    field.addEventListener("pointermove", onMove, { passive: true });
    field.addEventListener("pointerleave", onLeave);

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      const burst = burstRef.current;
      if (!burst) return;
      // 14 confetti chips fly out and gravity takes them
      for (let i = 0; i < 14; i++) {
        const chip = document.createElement("span");
        const gold = i % 3 === 0;
        chip.className = `absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-sm ${gold ? "bg-gold" : "bg-brand"}`;
        burst.appendChild(chip);
        const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 70 + Math.random() * 90;
        gsap.fromTo(chip, { x: 0, y: 0, scale: 1, rotation: 0 }, {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist + 60,
          rotation: (Math.random() - 0.5) * 540,
          scale: 0,
          duration: 0.9 + Math.random() * 0.4,
          ease: "power2.out",
          onComplete: () => chip.remove(),
        });
      }
      gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" });
    };
    btn.addEventListener("click", onClick);
    return () => {
      field.removeEventListener("pointermove", onMove);
      field.removeEventListener("pointerleave", onLeave);
      btn.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <section ref={ref} className="bg-blush py-[14vh]">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <Eyebrow>the only button that matters</Eyebrow>
        <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          It leans in <span className="text-brand">when you do.</span>
        </h2>
        <p data-in className="mx-auto mt-4 max-w-md text-base text-ink/60">
          Magnetic pull, gooey shadow, confetti on commit. Try clicking it —
          it&apos;s been waiting all day.
        </p>

        {/* gooey filter */}
        <svg width="0" height="0" aria-hidden="true">
          <filter id="l25-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
          </filter>
        </svg>

        <div ref={fieldRef} data-in className="relative mx-auto mt-12 flex h-56 w-full max-w-md items-center justify-center">
          {/* the goo behind */}
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={{ filter: "url(#l25-goo)" }}>
            <div ref={blobRef} className="h-24 w-48 rounded-full bg-brand/25" />
            <div className="absolute h-20 w-40 rounded-full bg-brand/25" />
          </div>
          <a
            ref={btnRef}
            href="#"
            className="relative inline-flex min-h-14 items-center gap-3 rounded-full bg-brand px-10 py-5 text-lg font-extrabold text-white shadow-red will-change-transform"
          >
            Take my weekend →
          </a>
          <div ref={burstRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" />
        </div>

        <p data-in className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-ink/40">
          zero payment now · 24h seat hold
        </p>
      </div>
    </section>
  );
}
