"use client";

/* HERO 02 — "Postcard Fan"
   Scrapbook aesthetic: five polaroids fanned like a hand of cards, tilting
   toward the cursor; tape strips and handwritten captions. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const CARDS = [
  { src: "/images/spiti.jpg", note: "Spiti, 4:30 AM", rot: -16 },
  { src: "/images/kerala.jpg", note: "brunch afloat", rot: -8 },
  { src: "/images/ladakh.jpg", note: "khardung la!", rot: 0 },
  { src: "/images/andaman.jpg", note: "salt & sun", rot: 8 },
  { src: "/images/stars.jpg", note: "no network ✦", rot: 16 },
];

export default function Hero02PostcardFan() {
  const ref = useRef<HTMLElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-pc-card]",
        { y: 220, rotate: 0, autoAlpha: 0 },
        {
          y: 0,
          rotate: (i) => CARDS[i].rot,
          autoAlpha: 1,
          duration: 1,
          ease: "back.out(1.3)",
          stagger: 0.09,
          scrollTrigger: { trigger: ref.current, start: "top 60%" },
        }
      );
      gsap.fromTo(
        "[data-pc-copy]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ref.current, start: "top 65%" } }
      );
    }, ref);

    // cursor tilt on the whole fan
    const el = fanRef.current;
    if (!el) return () => ctx.revert();
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      gsap.to(el, { rotateY: nx * 9, rotateX: -ny * 6, duration: 0.6, ease: "power2.out" });
    };
    const onLeave = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden bg-blush py-24">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p data-pc-copy className="font-script text-3xl text-brand">from our travellers&apos; pockets ✦</p>
          <h1 data-pc-copy className="mt-3 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Collect
            <br />
            <em className="font-script font-bold not-italic text-brand" style={{ fontSize: "1.15em" }}>mornings,</em>
            <br />
            not things.
          </h1>
          <p data-pc-copy className="mt-6 max-w-md text-base leading-relaxed text-ink/65 sm:text-lg">
            Every Tripwaley batch comes home with a camera roll like this. Group
            departures across India — curated stays, trip captains, and the kind
            of sunrises you&apos;ll bore your grandkids with.
          </p>
          <div data-pc-copy className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 py-3.5 font-bold text-cream transition-colors hover:bg-brand">
              Start collecting →
            </a>
            <span className="font-script text-xl text-ink/55">₹5,000 se shuru</span>
          </div>
        </div>

        {/* the fan */}
        <div className="flex items-center justify-center" style={{ perspective: "1200px" }}>
          <div ref={fanRef} className="relative h-[24rem] w-full max-w-md [transform-style:preserve-3d] sm:h-[28rem]">
            {CARDS.map((c, i) => (
              <div
                key={c.src}
                data-pc-card
                className="group absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 transition-transform duration-300 hover:z-20 hover:!rotate-0 hover:scale-110 sm:w-52"
                style={{
                  transform: `translate(-50%,-50%) rotate(${c.rot}deg)`,
                  transformOrigin: "50% 130%",
                  zIndex: i === 2 ? 10 : 5 - Math.abs(i - 2),
                }}
              >
                <div className="rounded-lg bg-white p-2.5 pb-9 shadow-card-lg">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                    <Image src={c.src} alt="" fill sizes="220px" className="object-cover" />
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-center font-script text-lg text-ink/75">
                    {c.note}
                  </p>
                  {/* tape strip */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] rounded-sm bg-gold/60 backdrop-blur-[1px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
