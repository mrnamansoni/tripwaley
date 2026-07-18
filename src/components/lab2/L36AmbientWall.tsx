"use client";

/* L36 — "The Screening Room" (memory section)
   A wall of six living frames — every tile slowly breathing with its own
   Ken Burns drift like paused film reels. Hover one and it wakes: swells,
   sharpens, dims the room, rolls its caption. */

import { useState } from "react";
import Image from "next/image";
import { useEntrance, Eyebrow } from "./shared";

const REELS = [
  { img: "himalaya-sunrise", cap: "the 5 AM payoff", meta: "Kedarkantha · Dec" },
  { img: "backwater-canoe", cap: "slow is a skill", meta: "Alleppey · Aug" },
  { img: "group-trek", cap: "single file, shared oxygen", meta: "Hampta · Jun" },
  { img: "taj", cap: "worth the queue", meta: "Agra · Feb" },
  { img: "snowtrek", cap: "first snow, aged 26", meta: "Chopta · Jan" },
  { img: "houseboat", cap: "room service by paddle", meta: "Kumarakom · Sep" },
];

export default function L36AmbientWall() {
  const ref = useEntrance<HTMLElement>();
  const [wake, setWake] = useState<number | null>(null);

  return (
    <section ref={ref} className="bg-ink py-[13vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="gold">the screening room</Eyebrow>
            <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Six reels, <span className="text-gold">always rolling.</span>
            </h2>
          </div>
          <p data-in className="max-w-xs text-sm leading-relaxed text-white/50">
            Every frame drifts on its own clock. Wake one up — the room dims
            for it.
          </p>
        </div>

        <div data-in className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" onMouseLeave={() => setWake(null)}>
          {REELS.map((r, i) => {
            const awake = wake === i;
            const dimmed = wake !== null && !awake;
            return (
              <figure
                key={r.img}
                onMouseEnter={() => setWake(i)}
                className={`group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 sm:aspect-[3/4] ${
                  awake ? "z-10 scale-[1.04] shadow-card-lg" : dimmed ? "scale-[0.985] opacity-40" : "opacity-85"
                }`}
              >
                <Image
                  src={`/images/${r.img}.jpg`}
                  alt={r.cap}
                  fill
                  sizes="(max-width:640px) 46vw, 30vw"
                  className={`object-cover ${i % 2 === 0 ? "animate-[maisonDrift_11s_ease-in-out_infinite_alternate]" : "animate-[maisonDrift_14s_ease-in-out_infinite_alternate-reverse]"}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent transition-opacity duration-500 ${awake ? "opacity-100" : "opacity-55"}`} aria-hidden="true" />
                {/* reel counter chrome */}
                <span className="absolute right-3.5 top-3.5 font-mono text-[0.58rem] font-bold tracking-[0.2em] text-white/55">
                  R{String(i + 1).padStart(2, "0")}
                </span>
                <figcaption className={`absolute bottom-0 w-full p-5 transition-all duration-500 ${awake ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                  <p className="font-script text-xl text-gold sm:text-2xl">{r.cap}</p>
                  <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/60">{r.meta}</p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
