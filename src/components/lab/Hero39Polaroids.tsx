"use client";

/* HERO 39 — "Shoebox"
   A scattered pile of polaroids you can physically fling around — grab,
   throw with momentum, they settle with a little bounce. The memories of
   a thousand trips, dumped on the table for you to rifle through. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const PICS = [
  { src: "/images/ladakh.jpg", note: "khardung la, 18k ft", rot: -12, x: -28, y: -16 },
  { src: "/images/kerala.jpg", note: "alleppey mornings", rot: 8, x: 20, y: -22 },
  { src: "/images/stars.jpg", note: "spiti, no signal ✦", rot: -6, x: 30, y: 14 },
  { src: "/images/andaman.jpg", note: "havelock blue", rot: 14, x: -24, y: 20 },
  { src: "/images/rajasthan.jpg", note: "jaipur pink", rot: -3, x: 4, y: 4 },
  { src: "/images/group-mountains.jpg", note: "the batch ♥", rot: 6, x: -2, y: -4 },
];

export default function Hero39Polaroids() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-poc]"));

    // entrance: cards tumble onto the table
    const ctx = gsap.context(() => {
      gsap.fromTo(cards, { y: -140, autoAlpha: 0, rotate: 0 }, {
        y: (i) => PICS[i].y, autoAlpha: 1, rotate: (i) => PICS[i].rot, x: (i) => `${PICS[i].x}%`,
        duration: 1, ease: "back.out(1.4)", stagger: 0.08, scrollTrigger: { trigger: ref.current, start: "top 62%" },
      });
      gsap.fromTo("[data-po-in]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ref.current, start: "top 60%" } });
    }, ref);

    // physics: drag with velocity, throw, settle inside bounds
    const cleanups: (() => void)[] = [];
    cards.forEach((card) => {
      let dragging = false;
      let px = 0, py = 0, vx = 0, vy = 0, cx = 0, cy = 0;
      let raf = 0;
      let pointerId = 0;

      const readXY = () => {
        cx = gsap.getProperty(card, "x") as number;
        cy = gsap.getProperty(card, "y") as number;
      };

      const glide = () => {
        vx *= 0.92; vy *= 0.92;
        cx += vx; cy += vy;
        const b = stage.getBoundingClientRect();
        const half = card.offsetWidth / 2;
        // soft walls
        if (cx < -b.width / 2 + half) { cx = -b.width / 2 + half; vx *= -0.5; }
        if (cx > b.width / 2 - half) { cx = b.width / 2 - half; vx *= -0.5; }
        if (cy < -b.height / 2 + half) { cy = -b.height / 2 + half; vy *= -0.5; }
        if (cy > b.height / 2 - half) { cy = b.height / 2 - half; vy *= -0.5; }
        gsap.set(card, { x: cx, y: cy });
        if (Math.hypot(vx, vy) > 0.3) raf = requestAnimationFrame(glide);
      };

      const onDown = (e: PointerEvent) => {
        dragging = true;
        pointerId = e.pointerId;
        card.setPointerCapture(pointerId);
        cancelAnimationFrame(raf);
        readXY();
        px = e.clientX; py = e.clientY;
        gsap.to(card, { scale: 1.08, zIndex: 50, boxShadow: "0 30px 60px rgba(0,0,0,0.4)", duration: 0.2 });
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        vx = e.clientX - px; vy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        cx += vx; cy += vy;
        gsap.set(card, { x: cx, y: cy, rotate: gsap.utils.clamp(-20, 20, vx * 0.6) });
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        card.releasePointerCapture(pointerId);
        gsap.to(card, { scale: 1, zIndex: 1, boxShadow: "0 12px 30px rgba(0,0,0,0.25)", duration: 0.3 });
        raf = requestAnimationFrame(glide);
      };
      card.addEventListener("pointerdown", onDown);
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerup", onUp);
      card.addEventListener("pointercancel", onUp);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        card.removeEventListener("pointerdown", onDown);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerup", onUp);
        card.removeEventListener("pointercancel", onUp);
      });
    });

    return () => {
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden bg-blush">
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-24 sm:px-8 lg:grid-cols-2">
        <div className="relative z-10">
          <p data-po-in className="font-script text-2xl text-brand sm:text-3xl">go on, make a mess</p>
          <h1 data-po-in className="mt-3 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            12,000 trips.
            <br />
            One <span className="text-brand">shoebox.</span>
          </h1>
          <p data-po-in className="mt-6 max-w-md text-base leading-relaxed text-ink/65">
            Grab a photo. Fling it. Every one is a real batch that actually
            happened — and there&apos;s always room for one more.
          </p>
          <a data-po-in href="#" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-4 font-bold text-white shadow-red transition-colors hover:bg-brand-bright">
            Add your polaroid →
          </a>
        </div>

        {/* the table */}
        <div ref={stageRef} className="relative h-[26rem] touch-none sm:h-[30rem]">
          {PICS.map((p, i) => (
            <div
              key={p.src}
              data-poc
              className="absolute left-1/2 top-1/2 -ml-[5.5rem] -mt-[6.5rem] w-44 cursor-grab touch-none rounded-sm bg-white p-2.5 pb-8 opacity-0 shadow-card-lg active:cursor-grabbing"
              style={{ zIndex: i === 5 ? 10 : i }}
            >
              <div className="relative aspect-square overflow-hidden">
                <Image src={p.src} alt="" fill sizes="180px" className="pointer-events-none object-cover" draggable={false} />
              </div>
              <p className="absolute inset-x-0 bottom-1.5 text-center font-script text-base text-ink/70">{p.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
