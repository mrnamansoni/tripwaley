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
  const fallback = priced.find((c) => c.slug === defaultCity) ?? priced[0];
  const [slug, setSlug] = useState(fallback.slug);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved && priced.some((c) => c.slug === saved)) {
      setTimeout(() => setSlug(saved), 0);
      return;
    }
    // best-effort geo snap: browser coords → nearest priced city
    if (!("geolocation" in navigator)) return;
    const t = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let best = fallback;
          let bd = Infinity;
          for (const c of priced) {
            const d = (c.lat - latitude) ** 2 + (c.lng - longitude) ** 2;
            if (d < bd) { bd = d; best = c; }
          }
          setSlug(best.slug);
          setDetected(true);
          localStorage.setItem(KEY, best.slug);
        },
        () => {},
        { timeout: 4000, maximumAge: 3600_000 }
      );
    }, 1200); // don't interrupt the hero
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCity = useCallback((s: string) => {
    setSlug(s);
    localStorage.setItem(KEY, s);
  }, []);

  const city = priced.find((c) => c.slug === slug) ?? fallback;
  return <Ctx.Provider value={{ city, cities: priced, setCity, detected }}>{children}</Ctx.Provider>;
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
        <div className={`absolute right-0 top-[110%] z-50 max-h-72 w-56 overflow-auto rounded-2xl border p-2 shadow-card-lg backdrop-blur-xl ${
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
