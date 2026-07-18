"use client";

/* L26 — "The Takeover" (CTA)
   A modest little pill in the middle of the page — until you scroll,
   and it swells to swallow the entire viewport, becoming the booking
   moment itself. The most committed CTA physically possible. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function L26Takeover() {
  const ref = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.45 };
      gsap.fromTo(pillRef.current, { scale: 1 }, { scale: 34, ease: "power2.in", scrollTrigger: { ...st, end: "62% bottom" } });
      gsap.to(labelRef.current, { autoAlpha: 0, ease: "none", scrollTrigger: { ...st, start: "8% bottom", end: "22% bottom" } });
      gsap.fromTo(innerRef.current, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "60% bottom", end: "80% bottom" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative h-[260vh] bg-cream">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <p className="mb-8 text-[0.62rem] font-bold uppercase tracking-[0.5em] text-ink/45">
          exhibit: a button with ambition · scroll
        </p>

        {/* the pill that eats the screen */}
        <div ref={pillRef} className="relative flex h-16 w-64 items-center justify-center rounded-full bg-brand shadow-red will-change-transform">
          <span ref={labelRef} className="text-base font-extrabold text-white">Book the trip</span>
        </div>

        {/* what's inside once it swallows you */}
        <div ref={innerRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="font-script text-3xl text-gold sm:text-4xl">see? painless</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl">
            You&apos;re already
            <br />
            inside the button.
          </h2>
          <p className="mt-5 max-w-md text-base text-white/75">
            Booking takes 90 seconds on WhatsApp. Backing out takes one message.
            The mountains take nothing personally.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href="#" className="inline-flex min-h-12 items-center rounded-full bg-white px-9 py-4 font-extrabold text-brand transition-transform hover:scale-[1.04]">
              Fine — hold my seat
            </a>
            <a href="#" className="min-h-12 py-3 font-bold text-white/85 underline decoration-gold decoration-2 underline-offset-8">
              browse more first
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
