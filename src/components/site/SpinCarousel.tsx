"use client";

/* SPIN CAROUSEL — an auto-rotating 3D cylinder of cards.
   Cards stand on a ring (rotateY · translateZ); the ring slowly turns on its
   own and a horizontal drag spins it directly with momentum. Vertical swipes
   pass through to page scroll (touch-action: pan-y). All motion is a single
   GPU-composited transform on the ring — no per-card JS, so it stays smooth
   on low-end phones. Pauses entirely while off-screen. */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

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
        // glide momentum back toward the idle auto-spin speed
        const target = velocity < 0 ? -autoDegPerSec : autoDegPerSec;
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

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("click", onClick, true);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
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
    </div>
  );
}
