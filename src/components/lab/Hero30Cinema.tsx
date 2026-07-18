"use client";

/* HERO 30 — "35mm"
   Arthouse cinema: letterboxed frames, film grain, fade-to-black cuts,
   subtitle typography and a running timecode. The trailer for your own
   film — restraint as spectacle. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SHOTS = [
  { src: "/images/himalaya-sunrise.jpg", sub: "— somewhere above Leh, 4:52 am" },
  { src: "/images/backwater-canoe.jpg", sub: "— Alleppey. the day refuses to hurry" },
  { src: "/images/camp-tents.jpg", sub: "— night three. nobody checks their phone" },
  { src: "/images/rajasthan.jpg", sub: "— Jaipur, in its sunday best" },
];
const CUT_MS = 4600;

export default function Hero30Cinema() {
  const ref = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);
  const [tc, setTc] = useState("00:00:00:00");

  useEffect(() => {
    const cut = setInterval(() => setIdx((v) => (v + 1) % SHOTS.length), CUT_MS);
    const t0 = Date.now();
    const clock = setInterval(() => {
      const ms = Date.now() - t0;
      const f = Math.floor((ms % 1000) / 41.6);
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      setTc(`00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`);
    }, 83);
    return () => {
      clearInterval(cut);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-cin-sub]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out", delay: 0.5 });
    }, ref);
    return () => ctx.revert();
  }, [idx]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-cin-in]",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.6, ease: "power2.out", stagger: 0.2, scrollTrigger: { trigger: ref.current, start: "top 60%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-black py-10">
      {/* the frame */}
      <div className="relative mx-auto aspect-video w-full max-w-6xl overflow-hidden bg-black">
        {SHOTS.map((s, i) => (
          <div
            key={s.src}
            aria-hidden={i !== idx}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
            style={{ opacity: i === idx ? 1 : 0 }}
          >
            <Image
              src={s.src}
              alt=""
              fill
              priority={i === 0}
              sizes="90vw"
              className={`object-cover ${i === idx ? "animate-[maisonDrift_7s_linear_forwards]" : ""}`}
            />
          </div>
        ))}
        {/* grain + vignette */}
        <div className="noise absolute inset-0" aria-hidden="true" />
        <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.75)]" />

        {/* corner chrome */}
        <p data-cin-in className="absolute left-5 top-4 font-mono text-[0.62rem] tracking-[0.25em] text-white/60">
          TRIPWALEY PICTURES
        </p>
        <p className="absolute right-5 top-4 font-mono text-[0.62rem] tracking-[0.15em] text-gold/90 tabular-nums">{tc}</p>
        <p data-cin-in className="absolute left-5 bottom-4 font-mono text-[0.6rem] tracking-[0.2em] text-white/45">
          SCENE {String(idx + 1).padStart(2, "0")} / 04 · 35MM
        </p>

        {/* subtitle */}
        <p
          key={idx}
          data-cin-sub
          className="absolute inset-x-0 bottom-12 px-8 text-center text-lg italic text-[#f3ead6] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-2xl"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          {SHOTS[idx].sub}
        </p>
      </div>

      {/* below the screen */}
      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
        <h1 data-cin-in className="text-3xl font-light text-[#f3ead6] sm:text-5xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Your life, <em className="italic text-gold">director&apos;s cut.</em>
        </h1>
        <div data-cin-in className="flex items-center gap-6">
          <a href="#" className="border border-gold/70 px-8 py-3.5 text-[0.66rem] font-bold uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-black">
            Get cast — book now
          </a>
          <p className="hidden font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40 sm:block">
            now screening<br />across india
          </p>
        </div>
      </div>
    </section>
  );
}
