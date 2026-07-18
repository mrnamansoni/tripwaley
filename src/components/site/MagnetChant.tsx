"use client";

/* THE CHANT + THE MAGNET — closing CTA (their L28 × L25 picks fused).
   Marquee lanes chant behind a magnetic button that leans into the
   cursor and detonates confetti on click before opening WhatsApp. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCity } from "./CityProvider";

const LANES = [
  { text: "PACK YOUR BAGS · PACK YOUR BAGS · PACK YOUR BAGS · ", reverse: false, dur: 26 },
  { text: "BOOK THE DAMN TRIP · BOOK THE DAMN TRIP · ", reverse: true, dur: 22 },
];

export default function MagnetChant({ whatsappLink }: { whatsappLink: string }) {
  const ref = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const { city } = useCity();

  useEffect(() => {
    const field = fieldRef.current;
    const btn = btnRef.current;
    if (!field || !btn) return;
    const bx = gsap.quickTo(btn, "x", { duration: 0.55, ease: "power3.out" });
    const by = gsap.quickTo(btn, "y", { duration: 0.55, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      bx((e.clientX - (r.left + r.width / 2)) * 0.3);
      by((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const onLeave = () => { bx(0); by(0); };
    field.addEventListener("pointermove", onMove, { passive: true });
    field.addEventListener("pointerleave", onLeave);

    const onClick = () => {
      const burst = burstRef.current;
      if (!burst) return;
      for (let i = 0; i < 14; i++) {
        const chip = document.createElement("span");
        chip.className = `absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-sm ${i % 3 === 0 ? "bg-gold" : "bg-brand"}`;
        burst.appendChild(chip);
        const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 70 + Math.random() * 90;
        gsap.fromTo(chip, { x: 0, y: 0, scale: 1 }, {
          x: Math.cos(ang) * dist, y: Math.sin(ang) * dist + 60,
          rotation: (Math.random() - 0.5) * 540, scale: 0,
          duration: 1, ease: "power2.out", onComplete: () => chip.remove(),
        });
      }
    };
    btn.addEventListener("click", onClick);
    return () => {
      field.removeEventListener("pointermove", onMove);
      field.removeEventListener("pointerleave", onLeave);
      btn.removeEventListener("click", onClick);
    };
  }, []);

  const msg = encodeURIComponent(`Hi Tripwaley! I want to plan a trip from ${city.name}.`);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink py-[13vh]">
      <div className="space-y-3" aria-hidden="true">
        {LANES.map((lane, i) => (
          <div key={i} className="select-none whitespace-nowrap">
            <div className={`marquee-track inline-flex ${lane.reverse ? "marquee-reverse" : ""}`} style={{ "--marquee-duration": `${lane.dur}s` } as React.CSSProperties}>
              {[0, 1].map((copy) => (
                <span
                  key={copy}
                  className="pr-4 font-display text-[clamp(2.6rem,7vw,6rem)] font-extrabold leading-[1.06] tracking-tight text-transparent"
                  style={{ WebkitTextStroke: "1.5px rgba(246,236,215,0.5)" }}
                >
                  {lane.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div ref={fieldRef} className="pointer-events-auto absolute inset-0 flex items-center justify-center">
        <a
          ref={btnRef}
          href={`${whatsappLink}?text=${msg}`}
          target="_blank"
          rel="noreferrer"
          className="relative inline-flex min-h-14 items-center gap-3 rounded-full bg-gold px-10 py-5 text-lg font-extrabold text-ink shadow-[0_20px_60px_rgba(245,163,26,0.45)] will-change-transform"
        >
          Fine — plan my escape →
        </a>
        <div ref={burstRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      </div>

      <p className="mt-9 text-center text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/35">
        replies in ~4 minutes · zero payment to start talking
      </p>
    </section>
  );
}
