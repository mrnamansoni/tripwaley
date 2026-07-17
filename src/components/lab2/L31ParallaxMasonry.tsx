"use client";

/* L31 — "The Album" (memory section)
   Three columns of trip photography scrolling at different speeds — the
   middle lane runs against the grain — so the wall feels alive the whole
   way down. Captions in the batch's own words. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

const COLS: { speed: number; items: { img: string; note: string }[] }[] = [
  {
    speed: -8,
    items: [
      { img: "group-trek", note: "km 11 of 12. still smiling. barely." },
      { img: "kerala", note: "the backwater brief: do nothing, slowly" },
      { img: "snowtrek", note: "first snow for 9 of 14 of us" },
    ],
  },
  {
    speed: 14,
    items: [
      { img: "camp-tents", note: "home for the night, population 15" },
      { img: "stars", note: "no filter. genuinely none." },
      { img: "houseboat", note: "breakfast came to the deck" },
    ],
  },
  {
    speed: -14,
    items: [
      { img: "traveller-street", note: "lost in jaipur. found lassi." },
      { img: "group-mountains", note: "strangers on day 1, this by day 6" },
      { img: "backwater-canoe", note: "arms tired, worth it" },
    ],
  },
];

export default function L31ParallaxMasonry() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-l31-col]").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: -COLS[i].speed },
          { yPercent: COLS[i].speed, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 } }
        );
      });
      gsap.fromTo("[data-l31-head]", { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 65%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="overflow-hidden bg-ink py-[14vh]">
      <div className="mx-auto mb-12 max-w-2xl px-5 text-center">
        <Eyebrow tone="gold">shot on 14 different phones</Eyebrow>
        <h2 data-l31-head className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Proof it <span className="text-gold">happened.</span>
        </h2>
        <p data-l31-head className="mt-4 text-base text-white/50">
          Unstaged, uncropped, occasionally out of focus — exactly how memory works.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-5 sm:grid-cols-3 sm:gap-6 sm:px-8">
        {COLS.map((col, i) => (
          <div key={i} data-l31-col className={`space-y-4 will-change-transform sm:space-y-6 ${i === 2 ? "hidden sm:block" : ""}`}>
            {col.items.map((item) => (
              <figure key={item.img} className="group overflow-hidden rounded-2xl bg-white p-2.5 pb-4 shadow-card-lg">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                  <Image src={`/images/${item.img}.jpg`} alt={item.note} fill sizes="(max-width:640px) 46vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <figcaption className="pt-3 text-center font-script text-base leading-tight text-ink/70">{item.note}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
