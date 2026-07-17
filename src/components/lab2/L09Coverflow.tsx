"use client";

/* L09 — "The Deck" (destination showcase)
   A true 3D coverflow: nine destinations fanned in perspective with live
   reflections, scrubbed by scroll. The centered card lifts, brightens and
   announces itself. iTunes-era muscle memory, travel-agency payload. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const CARDS = [
  { img: "ladakh", name: "Ladakh", price: "₹24,999" },
  { img: "kashmir", name: "Kashmir", price: "₹21,999" },
  { img: "spiti", name: "Spiti", price: "₹18,999" },
  { img: "rishikesh", name: "Rishikesh", price: "₹9,499" },
  { img: "rajasthan", name: "Rajasthan", price: "₹15,999" },
  { img: "meghalaya", name: "Meghalaya", price: "₹17,999" },
  { img: "kerala", name: "Kerala", price: "₹16,999" },
  { img: "andaman", name: "Andaman", price: "₹28,999" },
  { img: "taj", name: "Agra", price: "₹6,999" },
];

export default function L09Coverflow() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-l09-card]");
      const n = CARDS.length;
      let cur = -1;
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.35,
          onUpdate: (self) => {
            const f = self.progress * (n - 1); // continuous focus index
            cards.forEach((card, i) => {
              const d = i - f; // signed distance from focus
              const a = Math.abs(d);
              const side = Math.sign(d);
              card.style.transform = [
                `translateX(${d * 46}%)`,
                `translateZ(${-Math.min(a, 3) * 190}px)`,
                `rotateY(${-side * Math.min(a * 42, 55)}deg)`,
                `scale(${1 - Math.min(a * 0.06, 0.2)})`,
              ].join(" ");
              card.style.zIndex = String(100 - Math.round(a * 10));
              card.style.filter = `brightness(${1 - Math.min(a * 0.28, 0.62)})`;
            });
            const idx = Math.round(f);
            if (idx !== cur) {
              cur = idx;
              setActive(idx);
            }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[340vh] bg-[#101012]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mb-6 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">the deck · scroll to flick through</p>
          <h2 key={active} className="mt-3 animate-[fadeUp_.4s_ease-out] font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {CARDS[active].name}
            <span className="ml-4 align-middle font-display text-lg font-bold text-gold sm:text-2xl">{CARDS[active].price}</span>
          </h2>
        </div>

        {/* the fan */}
        <div className="relative mx-auto h-[46vh] w-full max-w-5xl" style={{ perspective: "1200px" }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {CARDS.map((c) => (
              <div
                key={c.img}
                data-l09-card
                className="absolute left-1/2 top-1/2 h-[40vh] w-[30vh] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-card-lg">
                  <Image src={`/images/${c.img}.jpg`} alt={c.name} fill sizes="34vh" className="object-cover" />
                </div>
                {/* live reflection */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-full mt-2 h-full w-full scale-y-[-1] overflow-hidden rounded-xl opacity-30"
                  style={{
                    WebkitMaskImage: "linear-gradient(to top, transparent 55%, black 100%)",
                    maskImage: "linear-gradient(to top, transparent 55%, black 100%)",
                  }}
                >
                  <Image src={`/images/${c.img}.jpg`} alt="" fill sizes="34vh" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-16 flex justify-center gap-2" aria-hidden="true">
          {CARDS.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-gold" : "w-2.5 bg-white/25"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
