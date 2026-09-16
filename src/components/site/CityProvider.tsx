"use client";

/* City intelligence: which city is this visitor departing from?
   Priority: saved choice → geolocation snap (best-effort) → Delhi.
   Every price and hook on the site reads from this context. */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { City } from "@/lib/types";

const KEY = "tw-city";

interface CityCtx {
  city: City;
  cities: City[];
  setCity: (slug: string) => void;
  detected: boolean;
}

const Ctx = createContext<CityCtx | null>(null);
export const useCity = () => useContext(Ctx)!;

export default function CityProvider({
  cities,
  defaultCity,
  children,
}: {
  cities: City[];
  defaultCity: string;
  children: React.ReactNode;
}) {
  const priced = cities.filter((c) => c.priced);
  // Never crash the entire site if an admin unprices (or deletes) every city —
  // fall back to the full list, then to a synthetic placeholder city.
  const pool: City[] = priced.length ? priced : cities;
  const fallback: City =
    pool.find((c) => c.slug === defaultCity) ??
    pool[0] ?? { slug: "delhi", name: "Delhi", state: "Delhi", lat: 28.6, lng: 77.2, priced: true };
  const [slug, setSlug] = useState(fallback.slug);
  /* Always false now that the geolocation snap is gone (see the effect below).
     Kept on the context because DepartureBoard reads it to choose between
     "spotted you near" and "boarding point" — it simply always takes the
     second branch, which is what production already did. */
  const detected = false;

  /* THE GEO SNAP IS GONE, and it was already gone in practice.
   *
   * This used to call navigator.geolocation.getCurrentPosition to guess the
   * nearest priced city. Our own `Permissions-Policy: geolocation=()` header
   * blocks that API site-wide, so on production the call never resolved — it
   * only logged "Permissions policy violation: Geolocation access has been
   * blocked" to the console on every single page load. That console error was
   * the ONLY thing costing the site its Best Practices score.
   *
   * Removing the call changes no production behaviour: `detected` was already
   * permanently false there. It stays on the context (DepartureBoard reads it
   * for its "spotted you near" label) rather than rippling a removal through
   * that component for a value that was always false anyway.
   *
   * Asking for coordinates on page load is also the wrong pattern regardless:
   * it fires a permission prompt before the visitor has asked for anything.
   */
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved && pool.some((c) => c.slug === saved)) setTimeout(() => setSlug(saved), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCity = useCallback((s: string) => {
    setSlug(s);
    localStorage.setItem(KEY, s);
  }, []);

  const city = pool.find((c) => c.slug === slug) ?? fallback;
  return <Ctx.Provider value={{ city, cities: pool, setCity, detected }}>{children}</Ctx.Provider>;
}

/* The navbar / band chip that names the visitor's city and opens the switcher */
export function CitySwitcher({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { city, cities, setCity } = useCity();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
          tone === "dark"
            ? "border-white/25 text-white hover:border-gold hover:text-gold"
            : "border-ink/25 text-ink hover:border-brand hover:text-brand"
        }`}
      >
        <span aria-hidden="true">📍</span>
        Departing from {city.name}
        <span className={`text-[0.6rem] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div data-lenis-prevent className={`absolute right-0 top-[110%] z-50 max-h-72 w-56 overflow-auto rounded-2xl border p-2 shadow-card-lg backdrop-blur-xl ${
          tone === "dark" ? "border-white/15 bg-ink/95" : "border-line bg-card"
        }`}>
          {cities.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => { setCity(c.slug); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                tone === "dark" ? "text-white/80 hover:bg-white/10" : "text-ink/80 hover:bg-blush"
              } ${c.slug === city.slug ? "text-gold" : ""}`}
            >
              {c.name}
              <span className={`text-[0.58rem] uppercase tracking-wider ${tone === "dark" ? "text-white/35" : "text-ink/35"}`}>{c.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
