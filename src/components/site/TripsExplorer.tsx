"use client";

/* THE RACK + THE GRID — /trips catalog.
   Top: a rack of perforated boarding-pass stubs (their lab pick) holding
   the next real departures. Below: the full catalog, filtered live by
   the visitor's city and month. */

import { useMemo, useState, type ReactNode } from "react";
import SiteMedia from "./SiteMedia";
import Link from "next/link";
import { useCity, CitySwitcher } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";
import { fareFor } from "@/lib/fares";

export interface ExplorerPackage {
  slug: string;
  name: string;
  destination: string;
  nightsLabel: string;
  /** nights on the road, for the length filter; null when unknown */
  nights: number | null;
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

type LengthKey = "any" | "short" | "mid" | "long";
/* Buckets sized to how people plan leave: a long weekend, a week off, more. */
const LENGTHS: Record<LengthKey, { label: string; test: (n: number | null) => boolean }> = {
  any: { label: "Any length", test: () => true },
  short: { label: "Weekend · up to 3 nights", test: (n) => n != null && n <= 3 },
  mid: { label: "4 to 5 nights", test: (n) => n != null && n >= 4 && n <= 5 },
  long: { label: "6 nights or more", test: (n) => n != null && n >= 6 },
};

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-card pl-4 pr-3 text-sm font-bold text-ink transition-colors focus-within:border-brand hover:border-brand">
      <span className="text-ink/65">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 cursor-pointer appearance-none bg-transparent pr-5 font-bold text-ink outline-none">
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3.5 text-xs text-ink/65">▾</span>
    </label>
  );
}

export default function TripsExplorer({ packages, departures, showRack = true, showGrid = true, initialMonth }: { packages: ExplorerPackage[]; departures: ExplorerDeparture[]; showRack?: boolean; showGrid?: boolean; initialMonth?: string }) {
  const { city, cities } = useCity();
  const [month, setMonth] = useState<string>(() =>
    initialMonth && departures.some((d) => d.date.startsWith(initialMonth)) ? initialMonth : "all"
  );
  const [length, setLength] = useState<LengthKey>("any");
  const [sort, setSort] = useState<"soon" | "price">("soon");

  const months = useMemo(() => {
    const s = new Set(departures.map((d) => d.date.slice(0, 7)));
    return [...s].sort();
  }, [departures]);

  const boardsHere = useMemo(() => departures.some((d) => d.citySlugs.includes(city.slug)), [departures, city.slug]);
  const stubs = useMemo(() => {
    const mine = departures.filter((d) => d.citySlugs.includes(city.slug));
    return (mine.length ? mine : departures).slice(0, 8);
  }, [departures, city.slug]);

  /* Each card carries the departure it is showing, so the date on the card is
     always one that matches the filter — picking January used to leave cards
     reading "next · 29 Oct". */
  const grid = useMemo(() => {
    const rows = packages
      .filter((p) => p.citySlugs.includes(city.slug) || p.citySlugs.length === 0)
      .filter((p) => LENGTHS[length].test(p.nights))
      .map((p) => {
        const own = departures.filter((d) => d.packageSlug === p.slug && (d.citySlugs.includes(city.slug) || p.citySlugs.length === 0));
        const inMonth = month === "all" ? own : own.filter((d) => d.date.startsWith(month));
        return { p, dep: inMonth[0] as ExplorerDeparture | undefined, price: fareFor(p.fromPrices, city.slug) };
      })
      .filter((r) => month === "all" || r.dep);
    const byDate = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      (a.dep?.date ?? "9999").localeCompare(b.dep?.date ?? "9999");
    return rows.sort(sort === "price" ? (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) || byDate(a, b) : byDate);
  }, [packages, departures, city.slug, month, length, sort]);

  const monthLabel = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      {/* the rack */}
      {showRack && (
      <section className="bg-[#0d0b09] py-[9vh]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">{boardsHere ? `departures rack · ex-${city.name}` : `no batches from ${city.name} yet · nearest departures`}</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                Tear off your <span className="text-gold">next one.</span>
              </h1>
            </div>
            <CitySwitcher tone="dark" />
          </div>
        </div>
        <div data-lenis-prevent className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8">
          {stubs.map((s) => {
            // fare and label name the same city: the visitor's, or the city this batch boards from
            const fareCity = s.citySlugs.includes(city.slug) ? city : cities.find((c) => s.citySlugs.includes(c.slug));
            const price = fareCity ? fareFor(s.fromPrices, fareCity.slug) : undefined;
            return (
              <Link
                key={s.packageSlug + s.date}
                href={`/trips/${s.packageSlug}`}
                className="flex w-[19rem] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#f4efe4] shadow-card-lg transition-transform hover:-translate-y-1"
              >
                <div className="relative w-24 shrink-0">
                  <SiteMedia src={s.image} alt={s.packageName} fill sizes="100px" className="object-cover" />
                </div>
                <div className="relative flex flex-col items-center justify-around border-l-2 border-dashed border-ink/20 py-2" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="mx-[-5px] h-2.5 w-2.5 rounded-full bg-[#0d0b09]" />
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <p className="font-mono text-[0.56rem] uppercase tracking-widest text-ink/65">{weekday(s.date)} · {shortDate(s.date)}</p>
                  <p className="mt-1 line-clamp-2 font-display text-base font-extrabold leading-tight text-ink">{s.packageName}</p>
                  <p className="mt-1.5 font-display text-lg font-extrabold text-brand">
                    {price ? inr(price) : "on request"}
                    {fareCity && fareCity.slug !== city.slug && <span className="ml-1.5 font-body text-[0.62rem] font-bold uppercase tracking-wider text-ink/65">ex-{fareCity.name}</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      )}

      {/* the grid */}
      {showGrid && (
      <section className="bg-cream py-[9vh]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Every trip <span className="text-brand">from {city.name}.</span>
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter and sort trips">
              <FilterSelect label="When" value={month} onChange={setMonth}>
                <option value="all">Any month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Length" value={length} onChange={(v) => setLength(v as LengthKey)}>
                {(Object.keys(LENGTHS) as LengthKey[]).map((k) => (
                  <option key={k} value={k}>{LENGTHS[k].label}</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as "soon" | "price")}>
                <option value="soon">Soonest first</option>
                <option value="price">Lowest price</option>
              </FilterSelect>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink/70" aria-live="polite">
            {grid.length} {grid.length === 1 ? "trip" : "trips"} from {city.name}
            {month !== "all" && ` in ${monthLabel(month)}`}
            {length !== "any" && ` · ${LENGTHS[length].label.toLowerCase()}`}
          </p>

          {/* 2-up on phones (was one huge card per screen), 3-up on desktop, 4-up wide */}
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {grid.map(({ p, dep: next, price }) => {
              return (
                <Link key={p.slug} href={`/trips/${p.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-lg sm:rounded-3xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SiteMedia src={p.image} alt={p.name} fill sizes="(max-width:640px) 46vw, (max-width:1280px) 30vw, 22vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                    {next && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/60 px-2.5 py-1 text-[0.54rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[0.6rem]">
                        {month === "all" ? "next · " : ""}{shortDate(next.date)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-ink/65 sm:text-[0.6rem] sm:tracking-[0.25em]">{p.nightsLabel}</p>
                    <h3 className="mt-1 line-clamp-2 font-display text-sm font-extrabold leading-snug text-ink group-hover:text-brand sm:text-lg">{p.name}</h3>
                    <div className="mt-2 flex items-center justify-between sm:mt-3">
                      <span className="line-clamp-1 hidden text-xs text-ink/65 sm:block">{p.destination}</span>
                      <span className="shrink-0 font-display text-base font-extrabold text-brand sm:text-lg">{price ? inr(price) : "on request"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {grid.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink/65">
              Nothing matches that filter from {city.name} yet — try another month or length, switch city, or WhatsApp us and we&apos;ll make it exist.
            </p>
          )}
        </div>
      </section>
      )}
    </>
  );
}
