"use client";

/* THE TICKET RACK — "departing from your city" (their lab1 ticket-rack pick).
   One perforated boarding stub per DESTINATION — next batch of each package,
   never the same trip twice — repriced live when the visitor switches city.
   Horizontal snap-rail on every screen size. */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCity, CitySwitcher } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";

export interface BoardRow {
  date: string;
  packageSlug: string;
  packageName: string;
  nightsLabel: string;
  scarcity: string;
  citySlugs: string[];
  fromPrices: Record<string, number>;
  image: string;
}

export default function DepartureBoard({
  rows,
  whatsappLink,
  hook = "Every destination's next batch — tear one off.",
  footnote = "every fare is your city's real seat price — not a headline teaser",
}: {
  rows: BoardRow[];
  whatsappLink: string;
  hook?: string;
  footnote?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { city, detected } = useCity();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-db-in]", { autoAlpha: 0, y: 26 }, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06,
        scrollTrigger: { trigger: ref.current, start: "top 70%" },
      });
      gsap.fromTo("[data-db-stub]", { autoAlpha: 0, y: 44, rotate: 2 }, {
        autoAlpha: 1, y: 0, rotate: 0, duration: 0.8, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: "[data-db-rail]", start: "top 78%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  /* one stub per package — my city's batches first, then the rest, by date */
  const unique: BoardRow[] = [];
  const seen = new Set<string>();
  for (const pass of [0, 1]) {
    for (const r of rows) {
      if (seen.has(r.packageSlug)) continue;
      const mine = r.citySlugs.includes(city.slug);
      if ((pass === 0 && mine) || (pass === 1 && !mine)) {
        seen.add(r.packageSlug);
        unique.push(r);
      }
    }
  }
  const stubs = unique.slice(0, 8);

  return (
    <section ref={ref} className="overflow-x-clip border-y border-line bg-blush py-[10vh]">
      <div className="relative z-30 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p data-db-in className="font-script text-2xl text-brand sm:text-3xl">
              {detected ? "spotted you near" : "boarding point"}
            </p>
            <h2 data-db-in className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              The rack, ex-<span className="text-brand">{city.name}.</span>
            </h2>
            <p data-db-in className="mt-2 text-sm text-ink/55">
              {hook}
            </p>
          </div>
          <div data-db-in>
            <CitySwitcher tone="light" />
          </div>
        </div>
      </div>

      {/* the rail */}
      <div data-db-rail className="relative z-10 mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-9 pt-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {stubs.map((r) => {
          const mine = r.citySlugs.includes(city.slug);
          const price = r.fromPrices[city.slug] ?? Object.values(r.fromPrices)[0];
          return (
            <Link
              key={r.packageSlug}
              href={`/trips/${r.packageSlug}`}
              data-db-stub
              className="group flex min-h-[13rem] w-[20.5rem] shrink-0 snap-center overflow-hidden rounded-2xl bg-[#f7f2e4] opacity-0 shadow-card-lg transition-transform duration-500 hover:-translate-y-1.5 sm:min-h-[14.5rem] sm:w-[25rem] sm:snap-start"
            >
              {/* photo edge */}
              <span className="relative w-[34%] shrink-0">
                <Image src={r.image} alt="" fill sizes="160px" className="object-cover" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent to-[#f7f2e4]" aria-hidden="true" />
                <span className="absolute left-2.5 top-2.5 rounded bg-ink/60 px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  {r.nightsLabel}
                </span>
              </span>
              {/* perforation */}
              <span className="flex shrink-0 flex-col items-center justify-around py-2.5" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, j) => (
                  <span key={j} className="h-2 w-2 rounded-full bg-blush" />
                ))}
              </span>
              {/* stub body */}
              <span className="flex min-w-0 flex-1 flex-col justify-between p-4">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-display text-2xl font-extrabold leading-none text-brand">{shortDate(r.date)}</span>
                    <span className="text-[0.56rem] font-bold uppercase tracking-widest text-ink/45">{weekday(r.date)} · guaranteed</span>
                  </span>
                  {r.scarcity ? (
                    <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[0.52rem] font-bold uppercase tracking-wider text-white">{r.scarcity.slice(0, 18)}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[0.52rem] font-bold uppercase tracking-wider text-success">boarding</span>
                  )}
                </span>
                <span className="mt-2 block truncate font-display text-base font-extrabold leading-tight text-ink transition-colors group-hover:text-brand sm:text-lg">
                  {r.packageName}
                </span>
                <span className="mt-1 block truncate text-[0.6rem] font-semibold uppercase tracking-wider text-ink/40">
                  {mine ? `boards in ${city.name}` : `nearest: ${r.citySlugs.slice(0, 2).join(" · ")}`}
                </span>
                <span className="mt-2.5 flex items-end justify-between border-t border-dashed border-ink/15 pt-2.5">
                  <span>
                    <span className="block text-[0.52rem] font-bold uppercase tracking-widest text-ink/40">ex-{city.name} · from</span>
                    <span className="font-display text-xl font-extrabold text-ink">{price ? inr(price) : "—"}</span>
                  </span>
                  <span className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-bold text-cream transition-colors group-hover:bg-brand">
                    Hold →
                  </span>
                </span>
              </span>
            </Link>
          );
        })}

        {/* end card */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          data-db-stub
          className="flex w-[17rem] shrink-0 snap-center flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/35 px-6 text-center opacity-0 sm:snap-start"
        >
          <p className="font-script text-2xl text-brand">your city missing?</p>
          <p className="mt-2 font-display text-lg font-extrabold text-ink">We add boarding points on demand.</p>
          <span className="mt-4 inline-flex min-h-11 items-center rounded-full bg-success px-6 py-2.5 text-sm font-bold text-white">WhatsApp us →</span>
        </a>
      </div>

      <p className="px-5 text-center text-[0.6rem] font-bold uppercase tracking-[0.35em] text-ink/35 sm:px-8">
        {footnote}
      </p>
    </section>
  );
}
