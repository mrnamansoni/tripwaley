import { citiesPricedFor, upcomingDepartures, getSettings, holdRates } from "./catalog";
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
  whatsapp: string;
  rates: { holdPercent: number; gstPercent: number; advancePercent: number };
  payEnabled: boolean;
}

export function bookingBarProps(slug: string, name: string, departureLimit = 12): BookingBarProps {
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
    // no gateway configured → no Pay button anywhere, rather than one that 500s
    payEnabled: phonepeConfigured(),
  };
}
