"use client";

/* The "from ₹" chip on a trip page, for the city the visitor has picked —
   the same number the /honeymoon and category lists show for that city. It
   used to show the cheapest fare from ANY city with no city named, so a
   Delhi visitor saw Kochi's Kerala fare on the trip page and Delhi's on the
   list, ₹10,000 apart. When the picked city has no fare, the cheapest one is
   shown with its city named, never passed off as theirs. */

import { useCity } from "./CityProvider";
import { inr } from "@/lib/types";
import { fareFor } from "@/lib/fares";

export default function FareChip({
  prices,
  cityNames,
  unit,
}: {
  /** city slug → the fare this trip is sold at from there */
  prices: Record<string, number>;
  cityNames: Record<string, string>;
  /** "per person" or "per couple" */
  unit: string;
}) {
  const { city } = useCity();
  const mine = fareFor(prices, city.slug);
  const cheapest = Object.entries(prices)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a[1] - b[1])[0];
  if (mine == null && !cheapest) return null;
  const [amount, from] = mine != null ? [mine, city.name] : [cheapest![1], cityNames[cheapest![0]] ?? cheapest![0]];
  return (
    <span className="rounded-full bg-gold px-4 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-ink">
      from {inr(amount)} <span className="font-bold opacity-75">{unit} · ex-{from}</span>
    </span>
  );
}
