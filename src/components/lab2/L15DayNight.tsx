"use client";

/* L15 — "Two Shifts" (destination showcase)
   The same trip, split by a draggable seam: daylight Kashmir on the left,
   the Milky Way over camp on the right. Drag the brass handle to trade
   one for the other. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useEntrance, Eyebrow } from "./shared";

export default function L15DayNight() {
  const ref = useEntrance<HTMLElement>();
  const frameRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const setFrom = (clientX: number) => {
      const r = frame.getBoundingClientRect();
      const p = Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100));
      if (nightRef.current) nightRef.current.style.clipPath = `inset(0 0 0 ${p}%)`;
      if (handleRef.current) handleRef.current.style.left = `${p}%`;
      setPct(Math.round(p));
    };

    const onDown = (e: PointerEvent) => { dragging.current = true; setFrom(e.clientX); };
    const onMove = (e: PointerEvent) => { if (dragging.current) setFrom(e.clientX); };
    const onUp = () => { dragging.current = false; };
    frame.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    return () => {
      frame.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <section ref={ref} className="bg-ink py-[12vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="gold">drag the seam</Eyebrow>
            <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Day job. <span className="text-gold">Night shift.</span>
            </h2>
          </div>
          <p data-in className="max-w-xs text-sm leading-relaxed text-white/50">
            Same itinerary, two personalities. Shikaras till six, stargazing after.
          </p>
        </div>

        <div
          ref={frameRef}
          data-in
          className="relative aspect-[16/9] cursor-ew-resize touch-none select-none overflow-hidden rounded-[1.6rem] shadow-card-lg"
          role="slider"
          aria-label="Compare day and night"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* day layer */}
          <Image src="/images/kashmir.jpg" alt="Kashmir by day" fill sizes="92vw" className="pointer-events-none object-cover" draggable={false} />
          <p className="absolute left-5 top-5 rounded-full bg-ink/45 px-4 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
            06:00 · shikara
          </p>

          {/* night layer, clipped */}
          <div ref={nightRef} className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
            <Image src="/images/stars.jpg" alt="Camp under the stars" fill sizes="92vw" className="pointer-events-none object-cover" draggable={false} />
            <p className="absolute right-5 top-5 rounded-full bg-white/12 px-4 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
              23:00 · milky way
            </p>
          </div>

          {/* brass seam */}
          <div ref={handleRef} className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold" aria-hidden="true">
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-ink/70 text-gold backdrop-blur-sm">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M5 1L1 6l4 5M13 1l4 5-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
