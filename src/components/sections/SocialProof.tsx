"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { stats, testimonials, wallPhotos, type Testimonial } from "@/lib/data";

function Stars() {
  return (
    <span className="text-sm tracking-widest text-gold" aria-label="5 star rating">
      ★★★★★
    </span>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex w-[19rem] shrink-0 flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card sm:w-[21rem]">
      <div>
        <Stars />
        <blockquote className="mt-3 text-[0.92rem] leading-relaxed text-ink/80">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
      </div>
      <figcaption className="mt-4 flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, hsl(${t.hue} 65% 52%), hsl(${t.hue + 40} 70% 42%))` }}
          aria-hidden="true"
        >
          {t.name.split(" ").map((n) => n[0]).join("")}
        </span>
        <span>
          <span className="block text-sm font-bold">{t.name}</span>
          <span className="block text-xs text-ink/55">{t.meta} · {t.trip}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function PhotoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[15rem] shrink-0 overflow-hidden rounded-2xl shadow-card">
      <Image src={src} alt={alt} fill sizes="15rem" className="object-cover" />
      <span className="absolute bottom-3 left-3 rounded-full bg-ink/55 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        📍 with tripwaley
      </span>
    </div>
  );
}

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Count-up stats when scrolled into view */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>("[data-stat-value]");
      els.forEach((el) => {
        const target = parseFloat(el.dataset.statValue ?? "0");
        const decimals = parseInt(el.dataset.statDecimals ?? "0", 10);
        const counter = { v: 0 };
        gsap.to(counter, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.textContent =
              decimals > 0
                ? counter.v.toFixed(decimals)
                : Math.round(counter.v).toLocaleString("en-IN");
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const row1 = [testimonials[0], testimonials[1], testimonials[2], testimonials[3]];
  const row2 = [testimonials[4], testimonials[5], testimonials[6], testimonials[7]];

  return (
    <section ref={sectionRef} id="reviews" className="relative overflow-hidden bg-cream py-20 sm:py-28">
      {/* wave in from blush */}
      <svg className="absolute inset-x-0 top-0 block w-full text-blush" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h1440v14c-180 24-380 34-620 28C520 36 260 18 120 16 80 15 36 16 0 22V0Z" fill="currentColor" />
      </svg>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <p className="font-script text-2xl text-brand sm:text-3xl">wall of love</p>
          <h2 className="mx-auto mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            12,000 strangers.
            <br />
            One <span className="text-brand">big family.</span>
          </h2>
        </div>

        {/* stats strip */}
        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dd className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
                <span data-stat-value={s.value} data-stat-decimals={s.decimals ?? 0}>0</span>
                <span className="text-brand">{s.suffix}</span>
              </dd>
              <dt className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-ink/50">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* full-bleed double marquee */}
      <div className="marquee-paused mt-14 space-y-5" aria-label="Traveller reviews">
        <div className="marquee-track items-stretch gap-5 pr-5" style={{ "--marquee-duration": "58s" } as React.CSSProperties}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-stretch gap-5" aria-hidden={copy === 1}>
              <TestimonialCard t={row1[0]} />
              <PhotoCard {...wallPhotos[0]} />
              <TestimonialCard t={row1[1]} />
              <TestimonialCard t={row1[2]} />
              <PhotoCard {...wallPhotos[1]} />
              <TestimonialCard t={row1[3]} />
              <PhotoCard {...wallPhotos[2]} />
            </div>
          ))}
        </div>
        <div className="marquee-track marquee-reverse items-stretch gap-5 pr-5" style={{ "--marquee-duration": "63s" } as React.CSSProperties}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-stretch gap-5" aria-hidden={copy === 1}>
              <PhotoCard {...wallPhotos[3]} />
              <TestimonialCard t={row2[0]} />
              <TestimonialCard t={row2[1]} />
              <PhotoCard {...wallPhotos[4]} />
              <TestimonialCard t={row2[2]} />
              <PhotoCard {...wallPhotos[5]} />
              <TestimonialCard t={row2[3]} />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-sm font-semibold text-ink/55">
        <span className="text-gold" aria-hidden="true">★</span> 4.9 on Google ·{" "}
        <span className="text-brand">@tripwaley</span> on Instagram — 180k wanderers strong
      </p>
    </section>
  );
}
