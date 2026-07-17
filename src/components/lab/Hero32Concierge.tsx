"use client";

/* HERO 32 — "The Concierge"
   Belmond-grade booking split: a slow slideshow suite on the left, an
   ivory reception desk on the right — hairline-underline fields, one gold
   reserve action, quiet confidence throughout. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const SUITES = [
  { src: "/images/kashmir.jpg", label: "The Kashmir residency" },
  { src: "/images/houseboat.jpg", label: "The backwater suite" },
  { src: "/images/tent-view.jpg", label: "The canvas penthouse" },
];

const FIELDS = [
  { id: "c-journey", label: "Journey", type: "select", options: ["Leh–Ladakh · 7 nights", "Kashmir · 6 nights", "Kerala · 6 nights", "Spiti · 8 nights"] },
  { id: "c-month", label: "Month", type: "select", options: ["July 2026", "August 2026", "September 2026"] },
  { id: "c-guests", label: "Travellers", type: "select", options: ["1 guest", "2 guests", "3 guests", "4+ guests"] },
];

export default function Hero32Concierge() {
  const ref = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setIdx((v) => (v + 1) % SUITES.length), 5000);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-con-in]",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.11, scrollTrigger: { trigger: ref.current, start: "top 60%" } }
      );
    }, ref);
    return () => {
      clearInterval(iv);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen bg-[#f4efe6]">
      <div className="grid min-h-screen lg:grid-cols-[1.35fr_1fr]">
        {/* left — the suites */}
        <div className="relative min-h-[46vh] overflow-hidden lg:min-h-0">
          {SUITES.map((s, i) => (
            <div
              key={s.src}
              aria-hidden={i !== idx}
              className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
              style={{ opacity: i === idx ? 1 : 0 }}
            >
              <Image src={s.src} alt="" fill priority={i === 0} sizes="(max-width:1024px) 100vw, 60vw" className={`object-cover ${i === idx ? "animate-[maisonDrift_8s_ease-out_forwards]" : ""}`} />
            </div>
          ))}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
          <div className="absolute bottom-8 left-8">
            <p key={idx} className="text-xl italic text-white drop-shadow" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              {SUITES[idx].label}
            </p>
            <div className="mt-3 flex gap-2" aria-hidden="true">
              {SUITES.map((_, i) => (
                <span key={i} className={`h-px transition-all duration-700 ${i === idx ? "w-9 bg-gold" : "w-4 bg-white/40"}`} />
              ))}
            </div>
          </div>
          <p className="absolute left-8 top-8 text-[0.6rem] font-semibold uppercase tracking-[0.5em] text-white/85">
            Tripwaley · group departures
          </p>
        </div>

        {/* right — the desk */}
        <div className="flex flex-col justify-center px-7 py-16 sm:px-12 lg:px-14">
          <p data-con-in className="text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-brand">
            The concierge desk
          </p>
          <h1
            data-con-in
            className="mt-5 text-4xl font-light leading-[1.08] text-ink sm:text-6xl"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Arrange my
            <br />
            <em className="italic">disappearance</em>
          </h1>
          <p data-con-in className="mt-5 max-w-sm text-sm leading-relaxed text-ink/55">
            Tell us three things. We&apos;ll return with an itinerary, a captain
            and fourteen excellent strangers.
          </p>

          <form data-con-in className="mt-10 space-y-8" onSubmit={(e) => e.preventDefault()}>
            {FIELDS.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-ink/45">
                  {f.label}
                </label>
                <select
                  id={f.id}
                  className="mt-2 w-full appearance-none border-b border-ink/25 bg-transparent pb-3 text-lg text-ink outline-none transition-colors focus:border-brand"
                  style={{ fontFamily: "var(--font-fraunces), serif" }}
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <button
                type="submit"
                className="min-h-12 bg-ink px-10 py-4 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-cream transition-colors duration-500 hover:bg-brand"
              >
                Reserve passage
              </button>
              <p className="text-xs text-ink/45">
                no payment now · seats held 24h
              </p>
            </div>
          </form>

          <div data-con-in className="mt-12 flex items-center gap-7 border-t border-ink/15 pt-6 text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-ink/45">
            <span>★ 4.9 · 2,400 reviews</span>
            <span>Women-safe certified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
