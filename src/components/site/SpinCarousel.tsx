"use client";

/* SPIN CAROUSEL — an auto-rotating 3D cylinder of cards.
   Cards stand on a ring (rotateY · translateZ); the ring slowly turns on its
   own and a horizontal drag spins it directly with momentum. Vertical swipes
   pass through to page scroll (touch-action: pan-y). All motion is a single
   GPU-composited transform on the ring — no per-card JS, so it stays smooth
   on low-end phones. Pauses entirely while off-screen.

   Moving content that runs on its own must be stoppable (WCAG 2.2.2): the
   spin stops while the pointer or keyboard focus is on the ring, a button
   pauses it for good, and it never starts under reduced motion. Tabbing to a
   card turns the ring so that card faces the viewer. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

export default function SpinCarousel({
  children,
  radius = 260,
  autoDegPerSec = 9,
  perspective = 1100,
  tiltDeg = 0,
  className = "",
  cardClassName = "",
  onFrontChange,
}: {
  children: ReactNode[];
  radius?: number;
  autoDegPerSec?: number;
  /** lower = you feel closer to the ring ("standing inside the carousel") */
  perspective?: number;
  /** slight rotateX on the whole ring, like looking across a real carousel */
  tiltDeg?: number;
  className?: string;
  cardClassName?: string;
  onFrontChange?: (index: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef(-1);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const holdRef = useRef(false); // pointer over, or focus inside
  const spinTo = useRef<((i: number) => void) | null>(null);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    if (prefersReducedMotion()) setTimeout(() => setPaused(true), 0);
  }, []);
  const n = children.length;
  const step = 360 / Math.max(1, n);

  useEffect(() => {
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    if (!wrap || !ring || n === 0) return;

    let rotation = 0;
    let velocity = -autoDegPerSec; // deg/sec; negative = cards travel left→right
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let moved = 0;
    let visible = true;

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(wrap);

    const tick = (_t: number, deltaMs: number) => {
      if (!visible) return;
      if (!dragging) {
        // glide momentum back toward the idle auto-spin speed — or to rest
        const spinning = !pausedRef.current && !holdRef.current;
        const target = spinning ? (velocity < 0 ? -autoDegPerSec : autoDegPerSec) : 0;
        velocity += (target - velocity) * Math.min(1, (deltaMs / 1000) * 2.2);
        rotation += velocity * (deltaMs / 1000);
        ring.style.transform = `rotateX(${tiltDeg}deg) rotateY(${rotation}deg)`;
      }
      const front = ((Math.round(-rotation / step) % n) + n) % n;
      if (front !== frontRef.current) {
        frontRef.current = front;
        onFrontChange?.(front);
      }
    };
    gsap.ticker.add(tick);

    const onDown = (e: PointerEvent) => {
      // the pause button is a plain button, not a drag handle — capturing the
      // pointer here would retarget its click to the ring
      if ((e.target as HTMLElement).closest?.("[data-spin-pause]")) return;
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastT = performance.now();
      wrap.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      moved += Math.abs(dx);
      rotation += dx * 0.35; // drag sensitivity (deg per px)
      ring.style.transform = `rotateX(${tiltDeg}deg) rotateY(${rotation}deg)`;
      if (now - lastT > 0) velocity = gsap.utils.clamp(-240, 240, (dx * 0.35) / ((now - lastT) / 1000));
      lastX = e.clientX;
      lastT = now;
    };
    const onUp = () => { dragging = false; };
    // a real drag shouldn't fire the card's link click on release
    const onClick = (e: MouseEvent) => {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
    };

    const hold = () => { holdRef.current = true; };
    const release = () => { holdRef.current = wrap.contains(document.activeElement); };
    const leave = () => { holdRef.current = false; };
    spinTo.current = (i: number) => {
      rotation = -i * step;
      velocity = 0;
      ring.style.transform = `rotateX(${tiltDeg}deg) rotateY(${rotation}deg)`;
    };
    wrap.addEventListener("pointerenter", hold);
    wrap.addEventListener("pointerleave", release);
    wrap.addEventListener("focusin", hold);
    wrap.addEventListener("focusout", leave);
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("click", onClick, true);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      wrap.removeEventListener("pointerenter", hold);
      wrap.removeEventListener("pointerleave", release);
      wrap.removeEventListener("focusin", hold);
      wrap.removeEventListener("focusout", leave);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("click", onClick, true);
    };
  }, [n, step, autoDegPerSec, tiltDeg, onFrontChange]);

  return (
    <div
      ref={wrapRef}
      data-lenis-prevent
      className={`relative select-none ${className}`}
      style={{ perspective: `${perspective}px`, touchAction: "pan-y" }}
    >
      <div
        ref={ringRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            onFocus={() => spinTo.current?.(i)}
            className={`absolute left-1/2 top-1/2 ${cardClassName}`}
            style={{
              transform: `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${radius}px)`,
              backfaceVisibility: "hidden",
            }}
          >
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        data-spin-pause
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="absolute bottom-2 right-2 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 bg-ink/70 px-4 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
      >
        <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
        {paused ? "Play" : "Pause"}
        <span className="sr-only"> rotation</span>
      </button>
    </div>
  );
}
