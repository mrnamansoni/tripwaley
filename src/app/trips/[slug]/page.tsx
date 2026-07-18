import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import { CitySwitcher } from "@/components/site/CityProvider";
import ItineraryRibbon from "@/components/site/ItineraryRibbon";
import FilmStrip from "@/components/site/FilmStrip";
import CaptainFeed from "@/components/site/CaptainFeed";
import WeatherNow from "@/components/site/WeatherNow";
import BookingBar, { type BarDeparture, type BarPrices } from "@/components/site/BookingBar";
import MoreTrips from "@/components/site/MoreTrips";
import {
  getCities,
  getSettings,
  getLivePackages,
  getPackage,
  citiesPricedFor,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
  inr,
  shortDate,
  weekday,
} from "@/lib/catalog";

/* destination coordinates for the live forecast card */
const DEST_GEO: [RegExp, { lat: number; lng: number; place: string }][] = [
  [/kedarkantha/i, { lat: 31.02, lng: 78.18, place: "Kedarkantha base" }],
  [/chopta|tungnath|kedarnath/i, { lat: 30.47, lng: 79.04, place: "Chopta" }],
  [/kasol|kheerganga|parvati|tosh/i, { lat: 32.01, lng: 77.31, place: "Kasol" }],
  [/jibhi|tirthan|raghupur/i, { lat: 31.59, lng: 77.34, place: "Jibhi" }],
  [/spiti|jispa|baralacha|kaza/i, { lat: 32.22, lng: 78.07, place: "Kaza, Spiti" }],
  [/kashmir|srinagar|gulmarg/i, { lat: 34.08, lng: 74.8, place: "Srinagar" }],
  [/goa/i, { lat: 15.3, lng: 74.08, place: "Goa" }],
  [/udaipur|rajasthan|jodhpur/i, { lat: 24.58, lng: 73.71, place: "Udaipur" }],
  [/rishikesh/i, { lat: 30.09, lng: 78.27, place: "Rishikesh" }],
  [/mcleod|triund|bir/i, { lat: 32.24, lng: 76.32, place: "McLeodganj" }],
  [/valley of flowers|flower/i, { lat: 30.73, lng: 79.61, place: "Valley of Flowers" }],
  [/shimla|kufri|mashobra/i, { lat: 31.1, lng: 77.17, place: "Shimla" }],
  [/manali/i, { lat: 32.24, lng: 77.19, place: "Manali" }],
];

export function generateStaticParams() {
  return getLivePackages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg) return {};
  return {
    title: `${pkg.name} — ${nightsLabel(pkg)} group departure | Tripwaley`,
    description: `${pkg.name}: ${pkg.destination || pkg.route}. Fixed group departures from ${citiesPricedFor(slug).length} cities with captains, stays & transport included.`,
  };
}

export default async function PackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg || pkg.status !== "live") notFound();

  const settings = getSettings();
  const cities = getCities();
  const images = packageImages(pkg);
  const priced = citiesPricedFor(slug);
  const deps = upcomingDepartures({ packageSlug: slug, limit: 12 });
  const geo = DEST_GEO.find(([re]) => re.test(`${pkg.name} ${pkg.destination} ${pkg.route}`))?.[1];
  const minPrice = priced.length
    ? Math.min(...priced.flatMap(({ rule }) => [rule.triple, rule.double].filter(Boolean) as number[]))
    : undefined;

  const barDeps: BarDeparture[] = deps.map((d) => ({ date: d.date, citySlugs: d.cities.map((c) => c.slug) }));
  const barPrices: BarPrices = Object.fromEntries(priced.map(({ city, rule }) => [city.slug, { triple: rule.triple, double: rule.double }]));

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main className="bg-cream pb-28">
        {/* ---- header ---- */}
        <section className="relative min-h-[78vh] overflow-hidden">
          <Image src={images[0]} alt={pkg.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/35" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col justify-end px-5 pb-12 pt-32 sm:px-8">
            <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.35em] text-gold">
              {pkg.code} · {pkg.type}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white sm:text-7xl">
              {pkg.name}
            </h1>
            {pkg.destination && <p className="mt-3 max-w-xl text-sm font-semibold text-white/70">{pkg.destination}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {[nightsLabel(pkg), pkg.transport || "AC Volvo / Traveller", `${priced.length} boarding cities`].map((chip) => (
                <span key={chip} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[0.66rem] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {chip}
                </span>
              ))}
              {minPrice && (
                <span className="rounded-full bg-gold px-4 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-ink">
                  from {inr(minPrice)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ---- meta + weather ---- */}
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-line bg-card p-7 shadow-sm sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">The brief</h2>
              <CitySwitcher tone="light" />
            </div>
            <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink/70">
              {(pkg.summaryFromDelhi || pkg.socialProof || pkg.route || `${pkg.name} — fixed group departure with stays, transport and a trip captain handled end to end.`).slice(0, 500)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">
              {pkg.bestTime && (
                <div>
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.25em] text-ink/40">best time</p>
                  <p className="mt-1 text-sm font-bold text-ink">{pkg.bestTime.split("\n")[0]}</p>
                </div>
              )}
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.25em] text-ink/40">departure hubs</p>
                <p className="mt-1 text-sm font-bold text-ink">{pkg.departureHubs || "Delhi + 9 cities"}</p>
              </div>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.25em] text-ink/40">advance to hold</p>
                <p className="mt-1 text-sm font-bold text-brand">{settings.advancePercent}% · rest later</p>
              </div>
            </div>
          </div>
          {geo ? <WeatherNow lat={geo.lat} lng={geo.lng} place={geo.place} /> : <div />}
        </section>

        {/* ---- contact sheet ---- */}
        <FilmStrip images={images} code={pkg.code.replace(/\s/g, "")} />

        {/* ---- itinerary ribbon ---- */}
        {pkg.itinerary.length > 0 && <ItineraryRibbon days={pkg.itinerary} images={images} />}

        {/* ---- the captain narrates it ---- */}
        {pkg.itinerary.length > 1 && <CaptainFeed days={pkg.itinerary} packageName={pkg.name} />}

        {/* ---- inclusions / exclusions / add-ons ---- */}
        {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
          <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {pkg.inclusions.length > 0 && (
                <div className="rounded-3xl border border-line bg-card p-7 shadow-sm">
                  <h3 className="font-display text-xl font-extrabold text-ink">On the house</h3>
                  <ul className="mt-4 space-y-2.5">
                    {pkg.inclusions.slice(0, 10).map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink/70">
                        <span className="mt-0.5 shrink-0 font-bold text-success" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-6">
                {pkg.exclusions.length > 0 && (
                  <div className="rounded-3xl border border-line bg-card p-7 shadow-sm">
                    <h3 className="font-display text-xl font-extrabold text-ink">On you</h3>
                    <ul className="mt-4 space-y-2.5">
                      {pkg.exclusions.slice(0, 6).map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink/70">
                          <span className="mt-0.5 shrink-0 font-bold text-brand" aria-hidden="true">✕</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.addons.length > 0 && (
                  <div className="rounded-3xl border border-line bg-card p-7 shadow-sm">
                    <h3 className="font-display text-xl font-extrabold text-ink">Add-ons</h3>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {pkg.addons.slice(0, 8).map((a) => (
                        <span key={a.name} className="rounded-full bg-blush px-4 py-2 text-xs font-bold text-ink">
                          {a.name}
                          {a.price && <span className="ml-1.5 text-brand">{inr(a.price)}{a.priceMax ? `–${inr(a.priceMax)}` : ""}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---- upcoming batches ---- */}
        {deps.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Upcoming <span className="text-brand">batches.</span>
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deps.slice(0, 6).map((d, i) => (
                <div
                  key={d.date}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-card-lg"
                >
                  <span aria-hidden="true" className="absolute -right-3 -top-6 font-display text-[4.6rem] font-extrabold leading-none text-ink/[0.05] transition-colors group-hover:text-gold/20">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display text-3xl font-extrabold text-brand">{shortDate(d.date)}</p>
                  <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-widest text-ink/45">{weekday(d.date)} departure · guaranteed</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {d.cities.map((c) => (
                      <span key={c.slug} className="rounded-full bg-blush px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink/70 transition-colors group-hover:bg-gold/20">
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---- price matrix ---- */}
        {priced.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Priced from <span className="text-brand">your city.</span>
            </h2>
            <div className="mt-7 overflow-hidden rounded-3xl bg-[#141215] shadow-card-lg">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-gold">fare board · all boarding points</p>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/35">per seat · all-inclusive</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left">
                  <thead>
                    <tr className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/40">
                      <th className="px-6 py-3.5">Boarding city</th>
                      <th className="px-6 py-3.5">Triple sharing</th>
                      <th className="px-6 py-3.5">Double sharing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priced.map(({ city, rule }, i) => (
                      <tr key={city.slug} className={`border-t border-white/[0.06] transition-colors hover:bg-white/[0.04] ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                        <td className="px-6 py-3.5 font-bold text-white">
                          {city.name}
                          <span className="ml-2 text-[0.58rem] font-semibold uppercase text-white/30">{city.state}</span>
                        </td>
                        <td className="px-6 py-3.5 font-display text-lg font-extrabold text-gold">{rule.triple ? inr(rule.triple) : "—"}</td>
                        <td className="px-6 py-3.5 font-display text-lg font-extrabold text-white/75">{rule.double ? inr(rule.double) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink/45">
              Hold any seat with a {settings.advancePercent}% advance. {settings.refundPolicy}
            </p>
          </section>
        )}

        {/* ---- field notes ---- */}
        {(pkg.trekOptions.length > 0 || pkg.travelTips.length > 0 || pkg.thingsToCarry.length > 0) && (
          <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {([
                ["Optional treks", pkg.trekOptions],
                ["Captain's tips", pkg.travelTips],
                ["Pack this", pkg.thingsToCarry],
              ] as const).map(([title, items]) =>
                items.length ? (
                  <details key={title} className="group rounded-3xl border border-line bg-card p-6 shadow-sm open:pb-7" open={title === "Optional treks"}>
                    <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-extrabold text-ink">
                      {title}
                      <span className="text-brand transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <ul className="mt-4 space-y-2">
                      {items.slice(0, 8).map((t) => (
                        <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-ink/65">
                          <span className="text-gold" aria-hidden="true">—</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* ---- proof, lowkey scarcity, back link ---- */}
        <section className="mx-auto w-full max-w-4xl px-5 py-12 text-center sm:px-8">
          {pkg.socialProof && (
            <blockquote className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
              &ldquo;{pkg.socialProof.split("\n")[0]}&rdquo;
            </blockquote>
          )}
          {pkg.scarcityNote && (
            <p className="mt-4 text-xs text-ink/45">{pkg.scarcityNote.split("\n")[0]}</p>
          )}
          <Link href="/trips" className="mt-8 inline-flex min-h-11 items-center rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-cream">
            ← All departures
          </Link>
        </section>

        {/* other live trips on a 3D ring (lab orbit-gallery pattern) */}
        <MoreTrips
          trips={getLivePackages()
            .filter((p) => p.slug !== pkg.slug)
            .slice(0, 10)
            .map((p) => ({
              slug: p.slug,
              name: p.name,
              nightsLabel: nightsLabel(p),
              image: packageImages(p)[0],
              price: fromPrice(p.slug),
            }))}
        />
      </main>

      <BookingBar
        packageSlug={pkg.slug}
        packageName={pkg.name}
        departures={barDeps}
        prices={barPrices}
        whatsapp={settings.whatsapp.replace(/\D/g, "")}
      />
    </CityProvider>
  );
}
