"use client";

/* L16 — "The Atlas Table" (destination showcase)
   An oversized map table of photographs you pan by hand — grab anywhere
   and throw; momentum carries you across the country and the walls bounce
   you back softly. Exploration as a physical act. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

const TILES = [
  { img: "ladakh", label: "Ladakh · N 34°" }, { img: "kashmir", label: "Kashmir · N 34°" },
  { img: "spiti", label: "Spiti · N 32°" }, { img: "rishikesh", label: "Rishikesh · N 30°" },
  { img: "rajasthan", label: "Rajasthan · N 26°" }, { img: "taj", label: "Agra · N 27°" },
  { img: "meghalaya", label: "Meghalaya · N 25°" }, { img: "kerala", label: "Kerala · N 9°" },
  { img: "houseboat", label: "Alleppey · N 9°" }, { img: "andaman", label: "Andaman · N 11°" },
  { img: "snowtrek", label: "Kedarkantha · N 31°" }, { img: "camp-tents", label: "Chopta · N 30°" },
];

export default function L16DragAtlas() {
  const ref = useEntrance<HTMLElement>();
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
      const maxX = 0;
      const minX = -(sheet.scrollWidth - well.clientWidth);
      const maxY = 0;
      const minY = -(sheet.scrollHeight - well.clientHeight);
      if (x > maxX) { x = maxX; vx *= -0.4; }
      if (x < minX) { x = minX; vx *= -0.4; }
      if (y > maxY) { y = maxY; vy *= -0.4; }
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

    // start roughly centered
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
    <section ref={ref} className="bg-blush py-[12vh]">
      <div className="mx-auto mb-8 flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <Eyebrow>the atlas table</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Grab the map. <span className="text-brand">Throw it.</span>
          </h2>
        </div>
        <p data-in className="max-w-xs text-sm leading-relaxed text-ink/55">
          Drag anywhere — momentum does the rest. Twelve regions on one table.
        </p>
      </div>

      <div
        ref={wellRef}
        data-in
        className="relative mx-auto h-[68vh] w-full max-w-7xl cursor-grab touch-none overflow-hidden rounded-[1.8rem] border border-line bg-cream shadow-card-lg active:cursor-grabbing sm:mx-8"
      >
        <div ref={sheetRef} className="grid w-max grid-cols-4 gap-4 p-6 will-change-transform">
          {TILES.map((t, i) => (
            <figure key={t.img} className={`relative overflow-hidden rounded-2xl ${i % 3 === 0 ? "h-72 w-96" : "h-72 w-72"}`}>
              <Image src={`/images/${t.img}.jpg`} alt={t.label} fill sizes="400px" className="pointer-events-none object-cover" draggable={false} />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/55 px-3.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                {t.label}
              </figcaption>
            </figure>
          ))}
        </div>
        {/* edge vignette + compass */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.8rem] shadow-[inset_0_0_80px_rgba(22,19,15,0.28)]" />
        <span className="pointer-events-none absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 font-display text-xs font-extrabold text-gold backdrop-blur-sm">N↑</span>
      </div>
    </section>
  );
}
