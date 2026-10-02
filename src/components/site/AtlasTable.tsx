"use client";

/* THE ATLAS TABLE — lab L16 wired to admin photo slots.
   A giant photo map you pan by hand; momentum carries, walls bounce softly.

   On touch screens the drag is off. `touch-none` on a 56vh well meant a thumb
   landing on the map could not scroll the PAGE — the map swallowed the swipe
   and the visitor was stuck until they found its edge. Phones get a native
   sideways-scrolling strip instead (two rows, snap), so a vertical swipe
   always scrolls the page. Keyboard users pan the desktop map with arrows. */

import { useEffect, useRef } from "react";
import SiteMedia from "./SiteMedia";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";

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
  const touch = useMediaQuery("(pointer: coarse)");

  useEffect(() => {
    const well = wellRef.current;
    const sheet = sheetRef.current;
    if (!well || !sheet || touch) return;
    const still = prefersReducedMotion();

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
      if (!still) raf = requestAnimationFrame(glide);
    };
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 240 : 80;
      const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
      if (!d) return;
      e.preventDefault();
      cancelAnimationFrame(raf);
      vx = vy = 0;
      x += d[0]; y += d[1];
      clampAndSet();
    };

    x = -(sheet.scrollWidth - well.clientWidth) / 2;
    y = -(sheet.scrollHeight - well.clientHeight) / 2;
    gsap.set(sheet, { x, y });

    well.addEventListener("pointerdown", onDown);
    well.addEventListener("pointermove", onMove);
    well.addEventListener("pointerup", onUp);
    well.addEventListener("pointercancel", onUp);
    well.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      well.removeEventListener("keydown", onKey);
      gsap.set(sheet, { clearProps: "transform" });
      well.removeEventListener("pointerdown", onDown);
      well.removeEventListener("pointermove", onMove);
      well.removeEventListener("pointerup", onUp);
      well.removeEventListener("pointercancel", onUp);
    };
  }, [touch]);

  return (
    <section className="bg-blush py-[10vh]">
      <div className="mx-auto mb-8 flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-brand">the atlas table</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            {headline} <span className="text-brand">{accent}</span>
          </h2>
        </div>
        {/* the admin line talks about dragging; a phone swipes instead */}
        <p className="max-w-xs text-sm leading-relaxed text-ink/65">{touch ? "Swipe sideways through the map." : sub}</p>
      </div>

      {/* the gutter wrapper keeps the well inside the viewport — `w-full` plus
          `sm:mx-8` on the well itself overflowed the page sideways */}
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div
        ref={wellRef}
        role="region"
        aria-label={touch ? "Trip photo map, scroll sideways" : "Trip photo map, drag or use arrow keys to pan"}
        tabIndex={0}
        className={`relative w-full rounded-[1.8rem] border border-line bg-cream shadow-card-lg outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          touch
            ? "snap-x snap-mandatory scroll-px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain"
            : "h-[56vh] cursor-grab touch-none overflow-hidden active:cursor-grabbing sm:h-[68vh]"
        }`}
      >
        <div
          ref={sheetRef}
          className={`grid w-max gap-4 p-6 ${touch ? "auto-cols-max grid-flow-col grid-rows-2" : "grid-cols-4 will-change-transform"}`}
        >
          {tiles.map((t, i) => (
            <figure key={`${t.img}-${i}`} className={`relative snap-start overflow-hidden rounded-2xl ${i % 3 === 0 ? "h-56 w-72 sm:h-72 sm:w-96" : "h-56 w-56 sm:h-72 sm:w-72"}`}>
              <SiteMedia src={t.img} alt={t.label} fill sizes="400px" className="pointer-events-none object-cover" draggable={false} />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/55 px-3.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                {t.label}
              </figcaption>
            </figure>
          ))}
        </div>
        {!touch && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.8rem] shadow-[inset_0_0_80px_rgba(22,19,15,0.28)]" />
        )}
        {!touch && (
          <span aria-hidden="true" className="pointer-events-none absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 font-display text-xs font-extrabold text-gold backdrop-blur-sm">N↑</span>
        )}
      </div>
      </div>
    </section>
  );
}
