"use client";

/* THE RACK + THE GRID — /trips catalog.
   Top: a rack of perforated boarding-pass stubs (their lab pick) holding
   the next real departures. Below: the full catalog, filtered live by
   the visitor's city and month. */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCity, CitySwitcher } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";

export interface ExplorerPackage {
  slug: string;
  name: string;
  destination: string;
  nightsLabel: string;
  image: string;
  fromPrices: Record<string, number>;
  citySlugs: string[]; // priced cities
}
export interface ExplorerDeparture {
  date: string;
  packageSlug: string;
  packageName: string;
  image: string;
  citySlugs: string[];
  fromPrices: Record<string, number>;
}

export default function TripsExplorer({ packages, departures }: { packages: ExplorerPackage[]; departures: ExplorerDeparture[] }) {
  const { city } = useCity();
  const [month, setMonth] = useState<string>("all");

  const months = useMemo(() => {
    const s = new Set(departures.map((d) => d.date.slice(0, 7)));
    return [...s].sort();
  }, [departures]);

  const stubs = useMemo(() => {
    const mine = departures.filter((d) => d.citySlugs.includes(city.slug));
    return (mine.length ? mine : departures).slice(0, 8);
  }, [departures, city.slug]);

  const grid = useMemo(() => {
    return packages.filter((p) => {
      const cityOk = p.citySlugs.includes(city.slug) || p.citySlugs.length === 0;
      const monthOk = month === "all" || departures.some((d) => d.packageSlug === p.slug && d.date.startsWith(month) && (d.citySlugs.includes(city.slug) || !cityOk));
      return cityOk && (month === "all" || monthOk);
    });
  }, [packages, departures, city.slug, month]);

  const monthLabel = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      {/* the rack */}
      <section className="bg-[#0d0b09] py-[9vh]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">departures rack · ex-{city.name}</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                Tear off your <span className="text-gold">next one.</span>
              </h1>
            </div>
            <CitySwitcher tone="dark" />
          </div>
        </div>
        <div data-lenis-prevent className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8">
          {stubs.map((s) => {
            const price = s.fromPrices[city.slug] ?? Object.values(s.fromPrices)[0];
            return (
              <Link
                key={s.packageSlug + s.date}
                href={`/trips/${s.packageSlug}`}
                className="flex w-[19rem] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#f4efe4] shadow-card-lg transition-transform hover:-translate-y-1"
              >
                <div className="relative w-24 shrink-0">
                  <Image src={s.image} alt="" fill sizes="100px" className="object-cover" />
                </div>
                <div className="relative flex flex-col items-center justify-around border-l-2 border-dashed border-ink/20 py-2" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="mx-[-5px] h-2.5 w-2.5 rounded-full bg-[#0d0b09]" />
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <p className="font-mono text-[0.56rem] uppercase tracking-widest text-ink/45">{weekday(s.date)} · {shortDate(s.date)}</p>
                  <p className="mt-1 line-clamp-2 font-display text-base font-extrabold leading-tight text-ink">{s.packageName}</p>
                  <p className="mt-1.5 font-display text-lg font-extrabold text-brand">{price ? inr(price) : "—"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* the grid */}
      <section className="bg-cream py-[9vh]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Every trip <span className="text-brand">from {city.name}.</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMonth("all")}
                className={`min-h-10 rounded-full px-4 py-2 text-xs font-bold transition-colors ${month === "all" ? "bg-ink text-cream" : "border border-line bg-card text-ink/70 hover:border-brand"}`}
              >
                Any month
              </button>
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonth(m)}
                  className={`min-h-10 rounded-full px-4 py-2 text-xs font-bold transition-colors ${month === m ? "bg-ink text-cream" : "border border-line bg-card text-ink/70 hover:border-brand"}`}
                >
                  {monthLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {/* 2-up on phones (was one huge card per screen), 3-up on desktop */}
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {grid.map((p) => {
              const price = p.fromPrices[city.slug] ?? Object.values(p.fromPrices)[0];
              const next = departures.find((d) => d.packageSlug === p.slug && (d.citySlugs.includes(city.slug) || true));
              return (
                <Link key={p.slug} href={`/trips/${p.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-lg sm:rounded-3xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={p.image} alt={p.name} fill sizes="(max-width:640px) 46vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                    {next && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/60 px-2.5 py-1 text-[0.54rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[0.6rem]">
                        next · {shortDate(next.date)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-5">
                    <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-ink/45 sm:text-[0.6rem] sm:tracking-[0.25em]">{p.nightsLabel}</p>
                    <h3 className="mt-1 line-clamp-2 font-display text-sm font-extrabold leading-snug text-ink group-hover:text-brand sm:text-xl">{p.name}</h3>
                    <div className="mt-2 flex items-center justify-between sm:mt-3">
                      <span className="line-clamp-1 hidden text-xs text-ink/50 sm:block">{p.destination}</span>
                      <span className="shrink-0 font-display text-base font-extrabold text-brand sm:text-lg">{price ? inr(price) : "ask"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {grid.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink/50">
              Nothing matches that filter from {city.name} yet — switch city or month, or WhatsApp us and we&apos;ll make it exist.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
