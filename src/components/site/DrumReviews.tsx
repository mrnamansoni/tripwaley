"use client";

/* THE DRUM — reviews (their L33 pick).
   Real-voice reviews from Google & Instagram mounted on a rotating 3D
   drum; scroll turns the axle. Source badges keep it credible. */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { Review } from "@/lib/types";

const HUES = [340, 205, 155, 25, 275, 105, 185, 315];

export default function DrumReviews({
  reviews,
  eyebrow = "straight from google & instagram · nothing paid, nothing scripted",
  headline = "12,000 wanderers.",
  headlineAccent = "Zero scripts.",
}: {
  reviews: Review[];
  eyebrow?: string;
  headline?: string;
  headlineAccent?: string;
}) {
  const STEP = 360 / Math.max(1, reviews.length);
  const ref = useRef<HTMLElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Perspective projection scales a card at translateZ(R) by P/(P−R).
  // Desktop: 1500/(1500−360) ≈ 1.32× on a 94%-wide card → fine in a 32rem well.
  // Phones: that same math pushed cards past the viewport edges (the cutoff),
  // so shrink the drum radius and card width until the projected card fits.
  const RADIUS = isMobile ? 220 : 360;

  useEffect(() => {
    const ctx = gsap.context(() => {
      let cur = 0;
      gsap.fromTo(drumRef.current, { rotateX: 0 }, {
        rotateX: (reviews.length - 1) * STEP,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.4,
          onUpdate: (self) => {
            const idx = Math.min(reviews.length - 1, Math.round(self.progress * (reviews.length - 1)));
            if (idx !== cur) { cur = idx; setActive(idx); }
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, [STEP, reviews.length]);

  return (
    <section ref={ref} className="relative h-[400vh] bg-[#0f0e11]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4 sm:px-5">
        {/* headline stays on top — the drum lives in its own clipped well below */}
        <div className="relative z-10 text-center">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.4em] text-gold sm:text-[0.62rem] sm:tracking-[0.5em]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-6xl">
            {headline} <span className="text-gold">{headlineAccent}</span>
          </h2>
        </div>

        <div
          className="relative mt-8 h-[24rem] w-full max-w-2xl overflow-hidden sm:mt-10 sm:h-[27rem]"
          style={{
            perspective: "1500px",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
            maskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
          }}
        >
          <div ref={drumRef} className="absolute inset-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            {reviews.map((r, i) => (
              <div
                key={r.name}
                className={`absolute left-1/2 top-1/2 w-[80%] max-w-lg transition-opacity duration-300 sm:w-full ${i === active ? "opacity-100" : "opacity-20"}`}
                style={{ transform: `translate(-50%, -50%) rotateX(${-i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <blockquote className="rounded-3xl border border-white/12 bg-[#191821] p-5 shadow-card-lg sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5 text-gold" aria-label={`${r.rating} stars`}>
                      {"★★★★★".slice(0, r.rating)}
                      <span className="text-white/20">{"★★★★★".slice(r.rating)}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.58rem] font-bold uppercase tracking-wider ${
                      r.source === "google" ? "bg-white/10 text-white/75" : "bg-[#833ab4]/25 text-[#e1a8f0]"
                    }`}>
                      {r.source === "google" ? "G · Google review" : "◎ Instagram"}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-base font-bold leading-snug text-white sm:text-xl">&ldquo;{r.text}&rdquo;</p>
                  <footer className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-extrabold text-white" style={{ backgroundColor: `hsl(${HUES[i % HUES.length]} 55% 45%)` }}>
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{r.name}</p>
                      <p className="text-xs text-white/45">{r.city} · {r.trip}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-success/15 px-3 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-success">verified batch</span>
                  </footer>
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2" aria-hidden="true">
          {reviews.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-gold" : "w-2.5 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
