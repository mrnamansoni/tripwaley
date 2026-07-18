"use client";

/* THE ATLAS TABLE — lab L16 wired to admin photo slots.
   A giant photo map you pan by hand; momentum carries, walls bounce softly.
   data-lenis-prevent + touch-none keep the drag entirely native. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

export default function AtlasTable({
  tiles,
  headline = "Grab the map.",
  accent = "Throw it.",
  sub = "Drag anywhere — momentum does the rest.",
}: {
  tiles: { img: string; label: string }[];
  headline?: string;
  accent?: string;
  sub?: string;
}) {
  const wellRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const well = wellRef.current;
    const sheet = sheetRef.current;
    if (!well || !sheet) return;

    let x = 0, y = 0, vx = 0, vy = 0, px = 0, py = 0;
    let dragging = false;
    let raf = 0;

    const clampAndSet = () => {
      const minX = -(sheet.scrollWidth - well.clientWidth);
      const minY = -(sheet.scrollHeight - well.clientHeight);
      if (x > 0) { x = 0; vx *= -0.4; }
      if (x < minX) { x = minX; vx *= -0.4; }
      if (y > 0) { y = 0; vy *= -0.4; }
      if (y < minY) { y = minY; vy *= -0.4; }
      gsap.set(sheet, { x, y });
    };

    const glide = () => {
      vx *= 0.93; vy *= 0.93;
      x += vx; y += vy;
      clampAndSet();
      if (Math.hypot(vx, vy) > 0.25) raf = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      cancelAnimationFrame(raf);
      px = e.clientX; py = e.clientY;
      well.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      vx = e.clientX - px; vy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      x += vx; y += vy;
      clampAndSet();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      raf = requestAnimationFrame(glide);
    };

    x = -(sheet.scrollWidth - well.clientWidth) / 2;
    y = -(sheet.scrollHeight - well.clientHeight) / 2;
    gsap.set(sheet, { x, y });

    well.addEventListener("pointerdown", onDown);
    well.addEventListener("pointermove", onMove);
    well.addEventListener("pointerup", onUp);
    well.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      well.removeEventListener("pointerdown", onDown);
      well.removeEventListener("pointermove", onMove);
      well.removeEventListener("pointerup", onUp);
      well.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section className="bg-blush py-[10vh]">
      <div className="mx-auto mb-8 flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the atlas table</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            {headline} <span className="text-brand">{accent}</span>
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-ink/55">{sub}</p>
      </div>

      <div
        ref={wellRef}
        data-lenis-prevent
        className="relative mx-auto h-[56vh] w-full max-w-7xl cursor-grab touch-none overflow-hidden rounded-[1.8rem] border border-line bg-cream shadow-card-lg active:cursor-grabbing sm:mx-8 sm:h-[68vh]"
      >
        <div ref={sheetRef} className="grid w-max grid-cols-4 gap-4 p-6 will-change-transform">
          {tiles.map((t, i) => (
            <figure key={`${t.img}-${i}`} className={`relative overflow-hidden rounded-2xl ${i % 3 === 0 ? "h-56 w-72 sm:h-72 sm:w-96" : "h-56 w-56 sm:h-72 sm:w-72"}`}>
              <Image src={t.img} alt={t.label} fill sizes="400px" className="pointer-events-none object-cover" draggable={false} />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/55 px-3.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                {t.label}
              </figcaption>
            </figure>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.8rem] shadow-[inset_0_0_80px_rgba(22,19,15,0.28)]" />
        <span className="pointer-events-none absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 font-display text-xs font-extrabold text-gold backdrop-blur-sm">N↑</span>
      </div>
    </section>
  );
}
