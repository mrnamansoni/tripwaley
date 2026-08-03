"use client";

/* The package grid for a trip-type landing page (group / honeymoon / solo).
   The one client island on those pages — it needs the visitor's city to show
   the right fare. Everything else on the page is server-rendered. */

import Link from "next/link";
import { useMemo, useState } from "react";
import SiteMedia from "./SiteMedia";
import { useCity, CitySwitcher } from "./CityProvider";
import { inr, shortDate } from "@/lib/types";

export interface TypeCard {
  slug: string;
  name: string;
  destination: string;
  nightsLabel: string;
  media: string;
  /** citySlug → seat (or couple) fare */
  prices: Record<string, number>;
  nextDate?: string;
}

export interface GridTheme {
  /** page background for the section */
  bg: string;
  /** accent colour class used on the price */
  accent: string;
  /** hover colour for the card title — a STATIC class, since Tailwind can't
   *  see class names built by string concatenation at runtime */
  titleHover: string;
  card: string;
  chip: string;
  switcher: "dark" | "light";
  headingCls: string;
}

export default function TripTypeGrid({
  cards,
  theme,
  heading,
  accentWord,
  rateLabel,
  emptyNote,
}: {
  cards: TypeCard[];
  theme: GridTheme;
  heading: string;
  accentWord: string;
  rateLabel: string;
  emptyNote: string;
}) {
  const { city } = useCity();
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((c) => `${c.name} ${c.destination}`.toLowerCase().includes(needle));
  }, [cards, q]);

  return (
    <section className={`py-[9vh] ${theme.bg}`} id="trips">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className={`font-display text-3xl font-extrabold tracking-tight sm:text-5xl ${theme.headingCls}`}>
            {heading} <span className={theme.accent}>{accentWord}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative">
              <span className="sr-only">Search these trips</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search trips…"
                className={`min-h-10 w-44 rounded-full border px-4 py-2 text-xs font-semibold outline-none transition-colors sm:w-52 ${
                  theme.switcher === "dark"
                    ? "border-white/20 bg-white/5 text-white placeholder:text-white/35 focus:border-gold"
                    : "border-line bg-card text-ink placeholder:text-ink/35 focus:border-brand"
                }`}
              />
            </label>
            <CitySwitcher tone={theme.switcher} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {shown.map((c) => {
            const price = c.prices[city.slug] ?? Object.values(c.prices)[0];
            return (
              <Link
                key={c.slug}
                href={`/trips/${c.slug}`}
                className={`group overflow-hidden rounded-2xl shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-lg sm:rounded-3xl ${theme.card}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SiteMedia
                    src={c.media}
                    alt={c.name}
                    fill
                    sizes="(max-width:640px) 46vw, 30vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  {c.nextDate && (
                    <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.54rem] font-bold uppercase tracking-wider backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[0.6rem] ${theme.chip}`}>
                      next · {shortDate(c.nextDate)}
                    </span>
                  )}
                </div>
                {/* column + mt-auto on the price row keeps fares aligned across
                    the row no matter how many lines a trip name wraps to */}
                <div className="flex min-h-[7.5rem] flex-col p-3 sm:min-h-[9.5rem] sm:p-5">
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] opacity-45 sm:text-[0.6rem] sm:tracking-[0.25em]">
                    {c.nightsLabel}
                  </p>
                  <h3 className={`mt-1 line-clamp-2 font-display text-sm font-extrabold leading-snug transition-colors sm:text-xl ${theme.titleHover}`}>
                    {c.name}
                  </h3>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2 sm:pt-3">
                    <span className="line-clamp-1 hidden text-xs opacity-55 sm:block">{c.destination}</span>
                    <span className="shrink-0 text-right">
                      <span className={`block font-display text-base font-extrabold leading-none sm:text-lg ${theme.accent}`}>
                        {price ? inr(price) : "on ask"}
                      </span>
                      {price ? (
                        <span className="text-[0.5rem] font-bold uppercase tracking-wider opacity-45 sm:text-[0.55rem]">{rateLabel}</span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {shown.length === 0 && <p className="mt-10 text-center text-sm opacity-60">{emptyNote}</p>}
      </div>
    </section>
  );
}
