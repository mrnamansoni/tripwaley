"use client";

/* THE ALBUM — lab L31 wired to admin photo slots + captions.
   Three lanes of polaroids scrolling at different speeds; the middle lane
   runs against the grain. Captions in the batch's own words. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SPEEDS = [-8, 14, -14];

export default function AlbumWall({
  photos,
  eyebrow = "shot on 14 different phones",
  headline = "Proof it",
  accent = "happened.",
  sub = "Unstaged, uncropped, occasionally out of focus — exactly how memory works.",
}: {
  photos: { src: string; note: string }[];
  eyebrow?: string;
  headline?: string;
  accent?: string;
  sub?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-album-col]").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: -SPEEDS[i % SPEEDS.length] },
          { yPercent: SPEEDS[i % SPEEDS.length], ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 } }
        );
      });
      gsap.fromTo("[data-album-head]", { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 65%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  if (photos.length < 3) return null;
  // round-robin into three lanes
  const lanes: { src: string; note: string }[][] = [[], [], []];
  photos.forEach((p, i) => lanes[i % 3].push(p));

  return (
    <section ref={ref} className="overflow-hidden bg-ink py-[11vh]">
      <div className="mx-auto mb-12 max-w-2xl px-5 text-center">
        <p data-album-head className="text-[0.62rem] font-bold uppercase tracking-[0.45em] text-gold">{eyebrow}</p>
        <h2 data-album-head className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          {headline} <span className="text-gold">{accent}</span>
        </h2>
        <p data-album-head className="mt-4 text-base text-white/50">{sub}</p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-5 sm:grid-cols-3 sm:gap-6 sm:px-8">
        {lanes.map((lane, i) => (
          <div key={i} data-album-col className={`space-y-4 will-change-transform sm:space-y-6 ${i === 2 ? "hidden sm:block" : ""}`}>
            {lane.map((item) => (
              <figure key={item.src} className="group overflow-hidden rounded-2xl bg-white p-2.5 pb-4 shadow-card-lg">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                  <Image src={item.src} alt={item.note} fill sizes="(max-width:640px) 46vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
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
