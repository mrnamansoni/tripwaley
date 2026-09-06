import { citiesPricedFor, upcomingDepartures, getPackage, getSettings, holdRates } from "./catalog";
import { phonepeConfigured } from "./phonepe";

/**
 * Everything <BookingBar> needs for one package, resolved server-side.
 *
 * Built because the creator trip pages sold seats through a plain WhatsApp
 * link while /trips/[slug] had the full booking flow — same trips, two
 * different checkouts, and only one of them could take a payment. Rather than
 * copy thirty lines into the creator page and let the two drift, both pages
 * now ask for the props here.
 */

export interface BookingBarProps {
  packageSlug: string;
  packageName: string;
  departures: { date: string; citySlugs: string[] }[];
  prices: Record<string, { triple?: number; double?: number }>;
  /** slug → display name, for the departure-city dropdown */
  cityNames: Record<string, string>;
  whatsapp: string;
  rates: { holdPercent: number; gstPercent: number; advancePercent: number };
  payEnabled: boolean;
}

export function bookingBarProps(slug: string, name: string, departureLimit = 12): BookingBarProps {
  const pkg = getPackage(slug);
  const priced = citiesPricedFor(slug);
  const deps = upcomingDepartures({ packageSlug: slug, limit: departureLimit });
  const settings = getSettings();

  return {
    packageSlug: slug,
    packageName: name,
    departures: deps.map((d) => ({ date: d.date, citySlugs: d.cities.map((c) => c.slug) })),
    prices: Object.fromEntries(priced.map(({ city, rule }) => [city.slug, { triple: rule.triple, double: rule.double }])),
    whatsapp: settings.whatsapp.replace(/\D/g, ""),
    rates: holdRates(),
    /* Pay is offered only when the gateway is configured AND the owner has left
       booking open for this trip. Either being false means the seat-hold flow
       only — never a Pay button that the server would refuse. */
    payEnabled: phonepeConfigured() && pkg?.bookingEnabled !== false,
    /* the city dropdown lists these and nothing else, so an unpriced city can
       no longer be chosen at all */
    cityNames: Object.fromEntries(priced.map(({ city }) => [city.slug, city.name])),
  };
}
