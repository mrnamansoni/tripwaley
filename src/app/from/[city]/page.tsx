import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
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

  return (
    <CityProvider cities={cities} defaultCity={slug}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        {/* header */}
        <section className="relative overflow-hidden bg-ink px-5 pb-16 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">no detour to Delhi needed</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Trips that board
              <br />
              in <span className="text-gold">{city.name}.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/60">
              {priced.length} packages priced ex-{city.name}, {deps.length} dated batches on the board. Your city is the boarding point — that&apos;s the whole idea.
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
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
