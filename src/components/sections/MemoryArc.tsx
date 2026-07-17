"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { galleryPhotos } from "@/lib/data";

export interface GalleryPhoto { src: string; label: string }

/**
 * "The photo dump" — scroll-driven flip-card gallery (adapted from a 21st.dev
 * intro animation). The original hijacked the wheel with a virtual scroll;
 * here the exact same choreography — scatter → circle → rainbow arc → shuffle
 * — is scrubbed by a pinned ScrollTrigger, so native (Lenis) scrolling drives
 * it and it reverses cleanly. Cards flip in 3D on hover/tap.
 */

const CARD_W = 92;
const CARD_H = 126;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** deterministic pseudo-random (stable across renders/mounts) */
function prand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const DEFAULT_COPY = {
  eyebrow: "the photo dump ✦",
  headline: "Straight from the batch camera rolls.",
  sub: "Zero stock photos in the reviews below — keep scrolling to shuffle through what our travellers actually shot.",
};

export default function MemoryArc({
  photos = galleryPhotos,
  eyebrow = DEFAULT_COPY.eyebrow,
  headline = DEFAULT_COPY.headline,
  sub = DEFAULT_COPY.sub,
}: {
  photos?: GalleryPhoto[];
  eyebrow?: string;
  headline?: string;
  sub?: string;
} = {}) {
  const N = photos.length;
  const SCATTER = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: (prand(i * 3 + 1) - 0.5) * 1400,
        y: (prand(i * 3 + 2) - 0.5) * 900,
        r: (prand(i * 3 + 3) - 0.5) * 160,
      })),
    [N]
  );
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Touch devices (phones/tablets) get the calm static grid instead of the
    // per-frame scroll choreography — same photos, none of the main-thread cost
    // that makes the animated version stutter on mobile GPUs.
    const wantsStatic =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    if (wantsStatic) {
      // async so the state swap lands a frame after mount (lint: no sync setState)
      const raf = requestAnimationFrame(() => setReduced(true));
      return () => cancelAnimationFrame(raf);
    }

    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-arc-card]"));
    const progress = { target: 0, value: 0 };
    const parallax = { target: 0, value: 0 };
    let dims = { w: stage.clientWidth, h: stage.clientHeight };
    let active = true; // keep ticking briefly until first layout lands

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.target = self.progress;
      },
      onToggle: (self) => {
        active = self.isActive;
      },
    });

    const onMove = (e: PointerEvent) => {
      parallax.target = ((e.clientX / window.innerWidth) * 2 - 1) * 80;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const ro = new ResizeObserver(() => {
      dims = { w: stage.clientWidth, h: stage.clientHeight };
    });
    ro.observe(stage);

    /** one imperative layout pass per frame — no React re-renders */
    const tick = (_t: number, deltaMs: number) => {
      const settled = Math.abs(progress.target - progress.value) < 0.0005;
      if (!active && settled) return;

      const k = 1 - Math.exp(-(deltaMs / 1000) * 7); // frame-rate independent damping
      progress.value += (progress.target - progress.value) * k;
      parallax.value += (parallax.target - parallax.value) * k * 0.6;

      const { w, h } = dims;
      const isMobile = w < 768;
      const p = progress.value;

      // choreography phases
      const t1 = clamp01(p / 0.16); // scatter → circle
      const t2 = clamp01((p - 0.24) / 0.34); // circle → rainbow arc
      const t3 = clamp01((p - 0.62) / 0.38); // shuffle along the arc

      // circle geometry (centered)
      const circleR = Math.min(Math.min(w, h) * 0.34, 330);
      // arc geometry (rainbow rising from the lower half)
      const arcR = Math.min(w, h * 1.5) * (isMobile ? 1.4 : 1.1);
      // apex offset from stage center: keep the rainbow inside the viewport
      // on phones (heading occupies the top ~45%)
      const apexY = h * (isMobile ? 0.12 : 0.24);
      const arcCenterY = apexY + arcR;
      const spread = isMobile ? 100 : 130;
      const startAngle = -90 - spread / 2;
      const step = spread / (N - 1);
      // sweep just enough that the arc visibly shuffles while staying full;
      // ends with the last photos centered (the "stop on the last image" beat)
      const shuffle = -t3 * spread * 0.3;
      const finalScale = isMobile ? 1.3 : 1.8;

      for (let i = 0; i < cards.length; i++) {
        const circleAngle = (i / N) * 360;
        const cRad = (circleAngle * Math.PI) / 180;
        const cx = Math.cos(cRad) * circleR;
        const cy = Math.sin(cRad) * circleR;
        const cRot = circleAngle + 90;

        const aAngle = startAngle + i * step + shuffle;
        const aRad = (aAngle * Math.PI) / 180;
        const ax = Math.cos(aRad) * arcR + parallax.value;
        const ay = Math.sin(aRad) * arcR + arcCenterY;
        const aRot = aAngle + 90;

        // scatter → circle → arc
        const x1 = lerp(SCATTER[i].x, cx, t1);
        const y1 = lerp(SCATTER[i].y, cy, t1);
        const r1 = lerp(SCATTER[i].r, cRot, t1);

        gsap.set(cards[i], {
          x: lerp(x1, ax, t2),
          y: lerp(y1, ay, t2),
          rotation: lerp(r1, aRot, t2),
          scale: lerp(lerp(0.55, 1, t1), finalScale, t2),
          autoAlpha: t1,
          xPercent: -50,
          yPercent: -50,
        });
      }

      // heading fades in as the arc forms; hint fades out
      if (headRef.current) {
        gsap.set(headRef.current, {
          autoAlpha: clamp01((t2 - 0.7) / 0.3),
          y: (1 - t2) * 24,
        });
      }
      if (hintRef.current) {
        gsap.set(hintRef.current, { autoAlpha: t1 * (1 - clamp01(t2 * 2.5)) });
      }
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SCATTER]);

  /* Reduced motion: a calm static grid instead of the choreography */
  if (reduced) {
    return (
      <section id="gallery" className="bg-blush py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="font-script text-2xl text-brand sm:text-3xl">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {headline}
          </h2>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
            {photos.map((ph) => (
              <div key={ph.src} className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-card">
                <Image src={ph.src} alt={ph.label} fill sizes="160px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="gallery" className="relative h-[280vh] bg-blush" aria-label="Photo gallery from Tripwaley batches">
      <p className="sr-only">
        A gallery of real trip photos: {photos.map((p) => p.label).filter(Boolean).join(", ")}.
      </p>

      <div className="sticky top-0 h-screen overflow-hidden">
        <div ref={stageRef} className="relative flex h-full w-full items-center justify-center">
          {/* heading revealed once the arc forms */}
          <div
            ref={headRef}
            className="pointer-events-none absolute top-[9%] z-0 px-5 text-center opacity-0"
          >
            <p className="font-script text-2xl text-brand sm:text-3xl">{eyebrow}</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              {headline}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/60 sm:text-base">
              {sub}
            </p>
          </div>

          {/* circle-phase hint */}
          <p
            ref={hintRef}
            className="pointer-events-none absolute z-0 text-xs font-bold uppercase tracking-[0.25em] text-ink/45 opacity-0"
          >
every frame shot by a real traveller
          </p>

          {/* flip cards, laid out imperatively every frame */}
          {photos.map((ph) => (
            <div
              key={ph.src}
              data-arc-card
              aria-hidden="true"
              onClick={(e) => {
                const el = e.currentTarget;
                el.dataset.flipped = el.dataset.flipped === "true" ? "false" : "true";
              }}
              className="arc-card absolute left-1/2 top-1/2 z-10 cursor-pointer opacity-0 will-change-transform"
              style={{ width: CARD_W, height: CARD_H, perspective: "800px" }}
            >
              <div className="arc-flip relative h-full w-full">
                {/* front: the photo */}
                <div className="absolute inset-0 overflow-hidden rounded-lg shadow-card [backface-visibility:hidden]">
                  <Image src={ph.src} alt="" fill sizes="128px" className="object-cover" />
                </div>
                {/* back: brand card */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg bg-brand p-1 text-center shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">
                    📍 {ph.label}
                  </span>
                  <span className="font-script text-sm leading-none text-gold">tripwaley</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
