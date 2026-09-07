import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { DESTINATIONS, destinationsFor } from "@/lib/destinations";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/schema";
import SiteMedia from "@/components/site/SiteMedia";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import {
  getCities,
  getSettings,
  getCity,
  getPricedCities,
  getLivePackages,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
  inr,
  shortDate,
  weekday,
} from "@/lib/catalog";

/* SEO city pages — the multi-city moat: /from/jaipur, /from/ranchi, … */

export function generateStaticParams() {
  return getPricedCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return {
    ...canonical(`/from/${city.slug}`),
    title: `Group trips from ${city.name} — fixed departures | Tripwaley`,
    description: `Board in ${city.name}: group departures to Himachal, Uttarakhand, Kashmir & more with stays, transport and trip captains included. No detour to Delhi needed.`,
  };
}

export default async function FromCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city || !city.priced) notFound();

  const settings = getSettings();
  const cities = getCities();
  const live = getLivePackages();

  const priced = live
    .map((p) => ({ pkg: p, price: fromPrice(p.slug, slug) }))
    .filter((x): x is { pkg: (typeof live)[number]; price: number } => Boolean(x.price));
  const deps = upcomingDepartures({ citySlug: slug, limit: 10 });

  /* DEPTH FROM DATA, NOT FILLER.
     These pages ran 221-291 words on an identical template, which reads to a
     search engine as ten near-duplicate doorway pages. Everything below is
     derived from this city's own price rules and departures, so each page says
     something true and different — and none of it can go stale, because there
     is no hand-written copy to fall out of date. */

  // which destinations this city is actually priced to, cheapest first
  const destRates = DESTINATIONS.map((d) => {
    const matching = priced.filter(({ pkg }) => destinationsFor(pkg).some((x) => x.slug === d.slug));
    if (!matching.length) return null;
    return { dest: d, from: Math.min(...matching.map((m) => m.price)), trips: matching.length };
  })
    .filter((x): x is { dest: (typeof DESTINATIONS)[number]; from: number; trips: number } => x !== null)
    .sort((a, b) => a.from - b.from);

  const prices = priced.map((p) => p.price);
  const low = prices.length ? Math.min(...prices) : null;
  const high = prices.length ? Math.max(...prices) : null;

  // when batches actually leave this city — the answer to "when should I go"
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthCounts = new Map<string, number>();
  for (const d of upcomingDepartures({ citySlug: slug, limit: 200 })) {
    const key = `${MONTHS[Number(d.date.slice(5, 7)) - 1]} ${d.date.slice(2, 4)}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const season = [...monthCounts.entries()].slice(0, 8);
  const busiest = season.length ? season.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;

  const short = priced.filter(({ pkg }) => (pkg.nights ?? 0) > 0 && (pkg.nights ?? 0) <= 3).length;
  const long = priced.filter(({ pkg }) => (pkg.nights ?? 0) >= 5).length;

  const cityFaqs = [
    {
      q: `Where do Tripwaley trips board in ${city.name}?`,
      a: `Every ${city.name} departure has a fixed boarding point in the city, confirmed to you by WhatsApp a day or two before you travel along with the exact reporting time. You do not travel to another city first — the price you see on this page is the price from ${city.name}.`,
    },
    {
      q: `How much does a group trip from ${city.name} cost?`,
      a: low != null && high != null
        ? `Seats on our ${city.name} departures run from ${inr(low)} to ${inr(high)}, depending on the trip and how long it is. That covers stays, transport from ${city.name} and back, and a trip captain for the whole batch.`
        : `${city.name} trips are quoted individually — send us your dates and we will come back with a price.`,
    },
    {
      q: `Where can I travel to from ${city.name}?`,
      a: destRates.length
        ? `We currently run batches from ${city.name} to ${destRates.length} ${destRates.length === 1 ? "destination" : "destinations"}: ${destRates.map((d) => d.dest.name).join(", ")}.`
        : `We are adding ${city.name} routes — message us and we will tell you what is opening next.`,
    },
    {
      q: `Can I book one seat from ${city.name}?`,
      a: `Yes. Every batch is a fixed-date group departure, so a single seat is the normal booking, not an exception. Solo travellers are matched into a twin-share room with someone of the same age group and gender, at no single supplement.`,
    },
  ];

  return (
    <CityProvider cities={cities} defaultCity={slug}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Trips", path: "/trips" },
              { name: `From ${city.name}`, path: `/from/${city.slug}` },
            ]),
            ...(itemListJsonLd(`Group trips from ${city.name}`, priced.map(({ pkg }) => ({ name: pkg.name, path: `/trips/${pkg.slug}` })))
              ? [itemListJsonLd(`Group trips from ${city.name}`, priced.map(({ pkg }) => ({ name: pkg.name, path: `/trips/${pkg.slug}` })))!]
              : []),
            ...(faqJsonLd(cityFaqs) ? [faqJsonLd(cityFaqs)!] : []),
          ]) }}
        />
        {/* header */}
        <section className="relative overflow-hidden bg-ink px-5 pb-16 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">no detour to Delhi needed</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Trips that board
              <br />
              in <span className="text-gold">{city.name}.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60">
              {priced.length} trips priced ex-{city.name} to {destRates.length}{" "}
              {destRates.length === 1 ? "destination" : "destinations"}, {deps.length} dated{" "}
              {deps.length === 1 ? "batch" : "batches"} currently on the board
              {low != null ? <>, from {inr(low)} a seat</> : null}. You board in {city.name} and come
              back to {city.name} — the fare covers the road at both ends, so there is no separate
              trip to Delhi to begin a holiday.
            </p>
          </div>
        </section>

        {/* dated departures */}
        {deps.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              On the board <span className="text-brand">right now.</span>
            </h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
              {deps.map((d, i) => {
                const price = fromPrice(d.package.slug, slug);
                return (
                  <Link
                    key={d.package.slug + d.date + i}
                    href={`/trips/${d.package.slug}`}
                    className="group grid grid-cols-[6rem_1fr_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-0 hover:bg-blush sm:px-7"
                  >
                    <span>
                      <span className="block font-display text-xl font-extrabold text-brand">{shortDate(d.date)}</span>
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-ink/45">{weekday(d.date)}</span>
                    </span>
                    <span className="min-w-0 truncate font-display text-lg font-extrabold text-ink group-hover:text-brand">{d.package.name}</span>
                    <span className="font-display text-lg font-extrabold text-ink">{price ? inr(price) : "→"}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* WHERE YOU CAN GO — the strongest section on the page for both a
            reader and a crawler: real destinations, real prices from THIS city,
            each linking to that destination's landing page. */}
        {destRates.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Where you can go <span className="text-brand">from {city.name}.</span>
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destRates.map(({ dest, from, trips }) => (
                <Link
                  key={dest.slug}
                  href={`/destinations/${dest.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-card-lg"
                >
                  <span className="font-display text-lg font-extrabold text-ink group-hover:text-brand">
                    {city.name} to {dest.name}
                  </span>
                  <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink/40">
                    {dest.state} · {trips} {trips === 1 ? "trip" : "trips"}
                  </span>
                  <span className="mt-2.5 flex-1 text-[0.84rem] leading-relaxed text-ink/55">{dest.tagline}</span>
                  <span className="mt-3 font-display text-lg font-extrabold text-brand">
                    from {inr(from)}
                    <span className="ml-1 text-[0.66rem] font-bold uppercase tracking-wider text-ink/40">/seat</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* WHEN BATCHES LEAVE — derived from this city's real departures */}
        {season.length > 0 && (
          <section className="bg-ink px-5 py-14 sm:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-gold">the season, ex-{city.name}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                When batches leave.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                Counted from the live board, not a brochure.
                {busiest ? <> {busiest[0]} is the busiest month out of {city.name} right now.</> : null}
                {short > 0 && long > 0 ? (
                  <>
                    {" "}
                    {short === 1 ? "One is a short break" : `${short} are short breaks`} of three nights
                    or fewer; {long === 1 ? "one runs" : `${long} run`} five nights or more.
                  </>
                ) : null}
              </p>
              <ul className="mt-8 flex flex-wrap gap-2.5">
                {season.map(([label, n]) => (
                  <li
                    key={label}
                    className="flex items-baseline gap-2 rounded-full border border-white/15 px-4 py-2"
                  >
                    <span className="font-display text-sm font-extrabold text-white">{label}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-gold">
                      {n} {n === 1 ? "batch" : "batches"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* all priced packages */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything priced <span className="text-brand">ex-{city.name}.</span>
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {priced.map(({ pkg, price }) => (
              <Link key={pkg.slug} href={`/trips/${pkg.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SiteMedia src={packageImages(pkg)[0]} alt={pkg.name} fill sizes="30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <div className="p-5">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/45">{nightsLabel(pkg)}</p>
                  <h3 className="mt-1 font-display text-lg font-extrabold text-ink group-hover:text-brand">{pkg.name}</h3>
                  <p className="mt-2 font-display text-lg font-extrabold text-brand">{inr(price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        {/* FAQ — indexable answers to the questions a city page is asked */}
        <section className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Booking from <span className="text-brand">{city.name}.</span>
          </h2>
          <dl className="mt-7 divide-y divide-line border-y border-line">
            {cityFaqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-display text-lg font-extrabold text-ink">{f.q}</dt>
                <dd className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* other boarding cities — these pages had no inbound links at all */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink/45">other boarding cities</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {cities.filter((c) => c.priced && c.slug !== city.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/from/${c.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  Trips from {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
