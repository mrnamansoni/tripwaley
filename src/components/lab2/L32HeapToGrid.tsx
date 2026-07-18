"use client";

/* L32 — "Tidy / Untidy" (memory section)
   Eight polaroids live in two states: dumped in a heap, or squared into
   an archive grid. Scroll (or the toggle) morphs every photo between the
   two with individually-eased flight paths. Order vs. memory. */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap";
import { useEntrance, Eyebrow } from "./shared";

const PHOTOS = [
  { img: "ladakh", heap: { x: -14, y: -8, r: -14 } },
  { img: "kerala", heap: { x: 12, y: -14, r: 9 } },
  { img: "stars", heap: { x: -4, y: 10, r: -5 } },
  { img: "rajasthan", heap: { x: 18, y: 8, r: 16 } },
  { img: "meghalaya", heap: { x: -20, y: 14, r: 7 } },
  { img: "andaman", heap: { x: 4, y: -4, r: -11 } },
  { img: "snowtrek", heap: { x: -9, y: 2, r: 13 } },
  { img: "houseboat", heap: { x: 15, y: -2, r: -7 } },
];

export default function L32HeapToGrid() {
  const ref = useEntrance<HTMLElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const [tidy, setTidy] = useState(false);
  const tidyRef = useRef(false);

  const morph = useCallback((toTidy: boolean) => {
    if (tidyRef.current === toTidy) return;
    tidyRef.current = toTidy;
    setTidy(toTidy);
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-l32-card]"));
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const cols = 4;
    const cw = cards[0]?.offsetWidth ?? 0;
    const ch = cards[0]?.offsetHeight ?? 0;
    const gapX = (W - cols * cw) / (cols + 1);
    const rows = Math.ceil(cards.length / cols);
    const gapY = (H - rows * ch) / (rows + 1);

    cards.forEach((card, i) => {
      const heap = PHOTOS[i].heap;
      const target = toTidy
        ? {
            x: gapX + (i % cols) * (cw + gapX) - (W / 2 - cw / 2),
            y: gapY + Math.floor(i / cols) * (ch + gapY) - (H / 2 - ch / 2),
            rotation: 0,
          }
        : { x: (heap.x / 100) * W, y: (heap.y / 100) * H, rotation: heap.r };
      gsap.to(card, {
        ...target,
        duration: 0.9,
        delay: i * 0.045,
        ease: toTidy ? "power4.inOut" : "back.out(1.2)",
      });
    });
  }, []);

  useEffect(() => {
    // initial heap placement + scroll-linked morph
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-l32-card]"));
    cards.forEach((card, i) => {
      const heap = PHOTOS[i].heap;
      gsap.set(card, { x: (heap.x / 100) * stage.clientWidth, y: (heap.y / 100) * stage.clientHeight, rotation: heap.r });
    });
    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top 45%",
      onEnter: () => morph(true),
      onLeaveBack: () => morph(false),
    });
    return () => st.kill();
  }, [morph]);

  return (
    <section ref={ref} className="bg-blush py-[12vh]">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>the shoebox archive</Eyebrow>
            <h2 data-in className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Memory is a mess.
              <br />
              <span className="text-brand">Archives aren&apos;t.</span>
            </h2>
          </div>
          <button
            type="button"
            data-in
            onClick={() => morph(!tidyRef.current)}
            className="inline-flex min-h-12 items-center gap-3 rounded-full border-2 border-ink px-6 py-3 font-bold text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            {tidy ? "Make a mess" : "Tidy up"}
            <span className={`inline-block transition-transform duration-500 ${tidy ? "rotate-180" : ""}`} aria-hidden="true">↺</span>
          </button>
        </div>

        <div ref={stageRef} data-in className="relative mx-auto mt-10 h-[30rem] sm:h-[34rem]">
          {PHOTOS.map((p, i) => (
            <div
              key={p.img}
              data-l32-card
              className="absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-2 pb-6 shadow-card-lg will-change-transform sm:w-40"
              style={{ zIndex: i }}
            >
              <div className="relative aspect-square overflow-hidden">
                <Image src={`/images/${p.img}.jpg`} alt="" fill sizes="160px" className="object-cover" />
              </div>
              <p className="absolute inset-x-0 bottom-1 text-center font-script text-sm text-ink/60">{p.img}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[0.62rem] font-bold uppercase tracking-[0.4em] text-ink/40">
          scroll does it too — the archive insists
        </p>
      </div>
    </section>
  );
}
