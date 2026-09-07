import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import SiteMedia from "@/components/site/SiteMedia";
import ReadMore from "@/components/site/ReadMore";
import { canonical } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/schema";
import { DESTINATIONS, getDestination, destinationsFor } from "@/lib/destinations";
import {
  getCities,
  getSettings,
  getLivePackages,
  getPricedCities,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
  inr,
  shortDate,
  weekday,
} from "@/lib/catalog";

/* DESTINATION LANDING PAGES — /destinations/spiti, /destinations/kashmir, …
 *
 * The gap these fill: the site sold trips but had nothing built to answer the
 * query people actually type. "Spiti valley tour package" and "Kashmir tour
 * package" are the head terms in Indian travel, and we only owned product-level
 * pages for individual departures, which are long-tail by definition.
 *
 * The trips, prices and dates all come from the live catalog, so this page can
 * never advertise a batch that isn't running or a price that isn't real. The
 * editorial half — season, access, the thing people get wrong — lives in
 * lib/destinations.ts, because it is the part a listing cannot generate and the
 * only reason a page like this deserves to be indexed.
 */

/** every destination that has at least one live trip — never an empty page */
function livePackagesFor(slug: string) {
  const dest = getDestination(slug);
  if (!dest) return [];
  return getLivePackages().filter((p) => destinationsFor(p).some((d) => d.slug === slug));
}

export function generateStaticParams() {
  return DESTINATIONS.filter((d) => livePackagesFor(d.slug).length > 0).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = getDestination(slug);
  if (!dest) return {};
  const trips = livePackagesFor(slug);
  const title = `${dest.name} Tour Packages — Group Trips | Tripwaley`;
  const description =
    `${trips.length} fixed-date group ${trips.length === 1 ? "departure" : "departures"} to ${dest.name}, ` +
    `${dest.state}. Stays, transport and a trip captain included, priced from your city. ${dest.tagline}.`;
  return {
    ...canonical(`/destinations/${dest.slug}`),
    title: title.length > 60 ? `${dest.name} Tour Packages | Tripwaley` : title,
    description: description.slice(0, 158),
    openGraph: {
      title,
      description,
      url: `/destinations/${dest.slug}`,
      type: "website",
      images: [{ url: dest.image, alt: `${dest.name}, ${dest.state}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [dest.image] },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = getDestination(slug);
  if (!dest) notFound();

  const trips = livePackagesFor(slug);
  // a destination with nothing running is a thin page and a dead end for a
  // visitor — it stays out of the index rather than being published empty
  if (!trips.length) notFound();

  const settings = getSettings();
  const cities = getCities();
  const priced = getPricedCities();
  const tripSlugs = new Set(trips.map((p) => p.slug));

  const deps = upcomingDepartures({ limit: 40 }).filter((d) => tripSlugs.has(d.package.slug)).slice(0, 12);

  /* what it costs from each city — the answer to "is this priced from where I
     live", which is the question the fare board on a trip page exists for and
     which nothing at destination level answered */
  const cityRates = priced
    .map((city) => {
      const rates = trips.map((p) => fromPrice(p.slug, city.slug)).filter((v): v is number => typeof v === "number");
      return rates.length ? { city, from: Math.min(...rates), trips: rates.length } : null;
    })
    .filter((x): x is { city: (typeof priced)[number]; from: number; trips: number } => x !== null)
    .sort((a, b) => a.from - b.from);

  const cheapest = cityRates.length ? cityRates[0].from : null;
  const nights = trips.map((p) => p.nights).filter((n): n is number => typeof n === "number" && n > 0);

  const faqs = [
    {
      q: `What is the best time to visit ${dest.name}?`,
      a: dest.bestTime,
    },
    {
      q: `How do I reach ${dest.name}?`,
      a: dest.gettingThere,
    },
    {
      q: `How much does a ${dest.name} trip cost?`,
      a: cheapest
        ? `Our ${dest.name} group departures start at ${inr(cheapest)} per seat${cityRates.length > 1 ? `, depending on which of our ${cityRates.length} boarding cities you travel from` : ""}. That covers stays, transport from the boarding city, and a trip captain for the whole batch. Flights and lunches are not included.`
        : `${dest.name} trips are priced individually from each boarding city — send us a message and we will come back with a quote for your city and dates.`,
    },
    {
      q: `Can I book a ${dest.name} trip as a solo traveller?`,
      a: `Yes. Every batch is a fixed-date group departure, so you book one seat rather than a private tour. Solo travellers are matched into a twin-share room with someone of the same age group and gender — there is no single supplement.`,
    },
    {
      q: `What should I know before booking ${dest.name}?`,
      a: dest.know,
    },
  ];

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: "Destinations", path: "/destinations" },
                { name: dest.name, path: `/destinations/${dest.slug}` },
              ]),
              ...(itemListJsonLd(`${dest.name} group departures`, trips.map((p) => ({ name: p.name, path: `/trips/${p.slug}` })))
                ? [itemListJsonLd(`${dest.name} group departures`, trips.map((p) => ({ name: p.name, path: `/trips/${p.slug}` })))!]
                : []),
              ...(faqJsonLd(faqs) ? [faqJsonLd(faqs)!] : []),
            ]),
          }}
        />

        {/* ---------------- hero ---------------- */}
        <section className="relative overflow-hidden bg-ink px-5 pb-16 pt-36 sm:px-8">
          <div className="absolute inset-0 opacity-25">
            <SiteMedia src={dest.image} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-6xl">
            <nav aria-label="Breadcrumb" className="font-mono text-[0.58rem] uppercase tracking-[0.25em] text-white/40">
              <Link href="/destinations" className="transition-colors hover:text-gold">Destinations</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-white/70">{dest.state}</span>
            </nav>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              {dest.name}
              <br />
              <span className="text-gold">group trips.</span>
            </h1>
            <p className="mt-4 font-script text-2xl text-gold/90 sm:text-3xl">{dest.tagline}</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70">{dest.intro}</p>

            <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
              <div>
                <dt className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">trips running</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-white">{trips.length}</dd>
              </div>
              {deps.length > 0 && (
                <div>
                  <dt className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">dated batches</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-white">{deps.length}</dd>
                </div>
              )}
              {cheapest != null && (
                <div>
                  <dt className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">from</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-gold">{inr(cheapest)}</dd>
                </div>
              )}
              {nights.length > 0 && (
                <div>
                  <dt className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">length</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-white">
                    {Math.min(...nights)}{Math.max(...nights) !== Math.min(...nights) ? `–${Math.max(...nights)}` : ""}N
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* ---------------- the trips ---------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {trips.length === 1 ? "The trip" : `${trips.length} trips`} to <span className="text-brand">{dest.name}.</span>
          </h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((pkg) => {
              const rates = priced.map((c) => fromPrice(pkg.slug, c.slug)).filter((v): v is number => typeof v === "number");
              const low = rates.length ? Math.min(...rates) : null;
              return (
                <Link
                  key={pkg.slug}
                  href={`/trips/${pkg.slug}`}
                  className="group overflow-hidden rounded-3xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SiteMedia
                      src={pkg.heroMedia || packageImages(pkg)[0]}
                      alt={`${pkg.name} — group departure to ${dest.name}`}
                      fill
                      sizes="(max-width:640px) 100vw, 30vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.25em] text-ink/45">{nightsLabel(pkg)}</p>
                    <h3 className="mt-1.5 font-display text-lg font-extrabold leading-tight text-ink group-hover:text-brand">
                      {pkg.name}
                    </h3>
                    {pkg.destination && <p className="mt-1 text-[0.8rem] text-ink/55">{pkg.destination}</p>}
                    <p className="mt-3 font-display text-lg font-extrabold text-brand">
                      {low != null ? <>from {inr(low)}<span className="ml-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink/40">/seat</span></> : "on request"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------------- dated batches ---------------- */}
        {deps.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              On the board <span className="text-brand">right now.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink/55">
              Real dated departures with seats still open. Every batch has a captain and a capped group size.
            </p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
              {deps.map((d, i) => (
                <Link
                  key={`${d.package.slug}-${d.date}-${i}`}
                  href={`/trips/${d.package.slug}`}
                  className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-0 hover:bg-blush sm:px-7"
                >
                  <span>
                    <span className="block font-display text-xl font-extrabold text-brand">{shortDate(d.date)}</span>
                    <span className="font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">{weekday(d.date)}</span>
                  </span>
                  <span className="min-w-0 truncate font-display text-base font-extrabold text-ink group-hover:text-brand sm:text-lg">
                    {d.package.name}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink/45">view →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- planning: season, access, the catch ---------------- */}
        <section className="bg-ink px-5 py-16 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-gold">before you book</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Planning a {dest.name} trip.
            </h2>
            <div className="mt-9 grid gap-8 md:grid-cols-3">
              {[
                { label: "Best time to go", body: dest.bestTime },
                { label: "Getting there", body: dest.gettingThere },
                { label: "What people get wrong", body: dest.know },
              ].map((block) => (
                <div key={block.label} className="border-t border-white/15 pt-5">
                  <h3 className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-gold">{block.label}</h3>
                  <div className="mt-3">
                    <ReadMore lines={5} tone="dark" moreLabel="Read more">
                      <p className="text-[0.92rem] leading-relaxed text-white/65">{block.body}</p>
                    </ReadMore>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- priced from your city ---------------- */}
        {cityRates.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {dest.name}, priced from <span className="text-brand">your city.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink/55">
              You board where you live. No routing through Delhi first to start a holiday.
            </p>
            <div data-lenis-prevent className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card shadow-sm">
              <table className="w-full min-w-[26rem] text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink/45">
                    <th className="px-6 py-3.5">Boarding city</th>
                    <th className="px-6 py-3.5">Trips from here</th>
                    <th className="px-6 py-3.5">From</th>
                  </tr>
                </thead>
                <tbody>
                  {cityRates.map(({ city, from, trips: n }) => (
                    <tr key={city.slug} className="border-b border-line last:border-0 transition-colors hover:bg-blush">
                      <td className="px-6 py-3.5 font-bold text-ink">
                        <Link href={`/from/${city.slug}`} className="transition-colors hover:text-brand">
                          {city.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-ink/60">{n}</td>
                      <td className="px-6 py-3.5 font-display text-lg font-extrabold text-brand">{inr(from)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------- FAQ ---------------- */}
        <section className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {dest.name} <span className="text-brand">questions.</span>
          </h2>
          <dl className="mt-7 divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-display text-lg font-extrabold text-ink">{f.q}</dt>
                <dd className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- other destinations ---------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink/45">where else we go</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {DESTINATIONS.filter((d) => d.slug !== dest.slug && livePackagesFor(d.slug).length > 0).map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/destinations/${d.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  {d.name}
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
