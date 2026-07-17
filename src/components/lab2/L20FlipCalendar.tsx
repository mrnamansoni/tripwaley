"use client";

/* L20 — "The Desk Calendar" (itinerary section)
   A physical desk calendar pinned mid-screen: each scroll step flips the
   top page up and over in true 3D — day number on the front, that day's
   photograph on the falling back face. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const PAGES = [
  { d: "01", title: "Land in Srinagar", img: "kashmir" },
  { d: "02", title: "Shikara & floating market", img: "houseboat" },
  { d: "03", title: "Gulmarg gondola", img: "snowtrek" },
  { d: "04", title: "Pahalgam valley", img: "group-mountains" },
  { d: "05", title: "Fly home (rebooked already)", img: "himalaya-sunrise" },
];

export default function L20FlipCalendar() {
  const ref = useRef<HTMLElement>(null);
  const [flipped, setFlipped] = useState(0);
  const flippedRef = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.3,
          onUpdate: (self) => {
            const want = Math.min(PAGES.length - 1, Math.floor(self.progress * PAGES.length));
            if (want !== flippedRef.current) {
              flippedRef.current = want;
              setFlipped(want);
            }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[300vh] bg-blush">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-brand">kashmir · flip through it</p>
        <h2 className="mt-3 text-center font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Five pages of <span className="text-brand">February.</span>
        </h2>

        {/* the calendar */}
        <div className="relative mt-10 h-[21rem] w-[17rem] sm:h-[24rem] sm:w-[19rem]" style={{ perspective: "1600px" }}>
          {/* spiral binding */}
          <div className="absolute -top-2 left-1/2 z-30 flex -translate-x-1/2 gap-2.5" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-5 w-2 rounded-full border-2 border-ink/60 bg-transparent" />
            ))}
          </div>

          {PAGES.map((p, i) => {
            const isFlipped = i < flipped;
            const depth = PAGES.length - i;
            return (
              <div
                key={p.d}
                className="absolute inset-0 rounded-2xl transition-transform duration-[900ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "top center",
                  transform: isFlipped ? "rotateX(-178deg)" : "rotateX(0deg)",
                  zIndex: isFlipped ? i : depth,
                }}
              >
                {/* front: the day sheet */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-line bg-card shadow-card-lg" style={{ backfaceVisibility: "hidden" }}>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-brand">day</p>
                  <p className="font-display text-[7rem] font-extrabold leading-none text-ink sm:text-[8.5rem]">{p.d}</p>
                  <p className="mt-2 max-w-[13rem] text-center font-display text-lg font-bold text-ink/75">{p.title}</p>
                  <p className="mt-4 font-script text-xl text-gold">keep scrolling</p>
                </div>
                {/* back: that day's photo, seen as the page falls */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line shadow-card-lg" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
                  <Image src={`/images/${p.img}.jpg`} alt="" fill sizes="20rem" className="object-cover" />
                  <div className="absolute inset-0 bg-ink/25" aria-hidden="true" />
                  <p className="absolute bottom-4 w-full text-center font-script text-2xl text-white">that was day {p.d}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-2" aria-hidden="true">
          {PAGES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= flipped ? "w-7 bg-brand" : "w-2.5 bg-ink/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
