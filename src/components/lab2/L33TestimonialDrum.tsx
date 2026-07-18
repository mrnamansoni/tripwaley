"use client";

/* L33 — "The Drum" (social proof)
   Reviews mounted on a rotating 3D drum — scroll turns it like a music
   box, each card swinging up into the light while the others recede into
   the dark. Five voices, one axis. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const REVIEWS = [
  { q: "Went alone. Came back with 14 people who now have keys to my house feelings.", name: "Sneha M.", trip: "Ladakh · Jul '25", hue: 340 },
  { q: "The captain noticed I was struggling at 4,800m before I did. That's the whole review.", name: "Arjun T.", trip: "Everest Base · May '25", hue: 200 },
  { q: "I've done 6 group trips with other companies. This is the only one where the itinerary wasn't fiction.", name: "Priya K.", trip: "Spiti · Jun '25", hue: 150 },
  { q: "My mother tracked the live location the whole week and has now booked HERSELF a batch.", name: "Rohit S.", trip: "Kerala · Aug '25", hue: 25 },
  { q: "4.9 stars because the bus aux cable was contested territory. Otherwise flawless.", name: "Diya R.", trip: "Meghalaya · Sep '25", hue: 270 },
];

const STEP = 360 / REVIEWS.length;
const RADIUS = 300;

export default function L33TestimonialDrum() {
  const ref = useRef<HTMLElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      let cur = 0;
      gsap.fromTo(drumRef.current, { rotateX: 0 }, {
        rotateX: (REVIEWS.length - 1) * STEP,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.4,
          onUpdate: (self) => {
            const idx = Math.min(REVIEWS.length - 1, Math.round(self.progress * (REVIEWS.length - 1)));
            if (idx !== cur) { cur = idx; setActive(idx); }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[300vh] bg-[#0f0e11]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">2,400 reviews · scroll the drum</p>
        <h2 className="mt-3 text-center font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Word of <span className="text-gold">mouth,</span> mechanised.
        </h2>

        {/* the drum */}
        <div className="relative mt-6 h-[24rem] w-full max-w-2xl" style={{ perspective: "1500px" }}>
          <div ref={drumRef} className="absolute inset-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            {REVIEWS.map((r, i) => (
              <div
                key={r.name}
                className={`absolute left-1/2 top-1/2 w-[88%] max-w-lg transition-opacity duration-300 sm:w-full ${i === active ? "opacity-100" : "opacity-30"}`}
                style={{ transform: `translate(-50%, -50%) rotateX(${-i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <blockquote className="rounded-3xl border border-white/12 bg-[#191821] p-7 shadow-card-lg sm:p-9">
                  <div className="flex gap-1 text-gold" aria-hidden="true">{"★★★★★"}</div>
                  <p className="mt-4 font-display text-lg font-bold leading-snug text-white sm:text-2xl">&ldquo;{r.q}&rdquo;</p>
                  <footer className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-extrabold text-white" style={{ backgroundColor: `hsl(${r.hue} 55% 45%)` }}>
                      {r.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{r.name}</p>
                      <p className="text-xs text-white/45">{r.trip}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-success/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-success">verified batch</span>
                  </footer>
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2" aria-hidden="true">
          {REVIEWS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-gold" : "w-2.5 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
