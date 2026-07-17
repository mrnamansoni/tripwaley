"use client";

/* L12 — "Vitrine" (destination showcase)
   Three museum-case cards in true 3D: the photo, the label and the price
   float at different depths inside the glass, a glare tracks your hand,
   and the whole case tilts to meet the cursor. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

const CASES = [
  { img: "houseboat", name: "The Houseboat", place: "Alleppey, Kerala", price: "₹16,999" },
  { img: "tent-view", name: "The Canvas Suite", place: "Chandratal, Spiti", price: "₹18,999" },
  { img: "snowtrek", name: "The Snow Line", place: "Kedarkantha, Uttarakhand", price: "₹9,499" },
];

export default function L12TiltGlass() {
  const ref = useEntrance<HTMLElement>();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-l12-card]"));
    const cleanups = cards.map((card) => {
      const glare = card.querySelector<HTMLElement>("[data-l12-glare]");
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power2.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power2.out" });
      const onMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        rx(-ny * 10);
        ry(nx * 12);
        glare?.style.setProperty("--gx", `${(nx * 0.5 + 0.5) * 100}%`);
        glare?.style.setProperty("--gy", `${(ny * 0.5 + 0.5) * 100}%`);
      };
      const onLeave = () => { rx(0); ry(0); };
      card.addEventListener("pointermove", onMove, { passive: true });
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section ref={ref} className="noise bg-[#111013] py-[13vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <Eyebrow tone="gold">the vitrine · lean in</Eyebrow>
          <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Stays worth <span className="text-gold">glass cases.</span>
          </h2>
        </div>

        <div ref={stageRef} className="grid gap-8 sm:grid-cols-3" style={{ perspective: "1400px" }}>
          {CASES.map((c) => (
            <div
              key={c.img}
              data-l12-card
              data-in
              className="group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-sm will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* photo floats deepest */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl" style={{ transform: "translateZ(30px)" }}>
                <Image src={`/images/${c.img}.jpg`} alt={c.name} fill sizes="(max-width:640px) 90vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.07]" />
              </div>
              {/* label floats above the photo */}
              <div className="px-3 py-5" style={{ transform: "translateZ(55px)" }}>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">{c.place}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <h3 className="font-display text-2xl font-extrabold text-white">{c.name}</h3>
                  <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold text-gold">{c.price}</span>
                </div>
              </div>
              {/* glass glare tracking the cursor */}
              <div
                data-l12-glare
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "radial-gradient(360px circle at var(--gx,50%) var(--gy,50%), rgba(255,240,210,0.16), transparent 65%)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
