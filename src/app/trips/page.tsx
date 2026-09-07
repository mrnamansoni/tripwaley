import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import TripsExplorer, { type ExplorerPackage, type ExplorerDeparture } from "@/components/site/TripsExplorer";
import FinalBoarding from "@/components/site/FinalBoarding";
import BookingWire from "@/components/site/BookingWire";
import AtlasTable from "@/components/site/AtlasTable";
import Link from "next/link";
import {
  getCities,
  getSettings,
  getLivePackages,
  getPricedCities,
  getWire,
  sectionOn,
  slot,
  text,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
} from "@/lib/catalog";

export const metadata: Metadata = {
  ...canonical("/trips"),
  title: "All group departures — trips from 10+ cities | Tripwaley",
  description: "Every upcoming Tripwaley group departure: Himachal, Uttarakhand, Kashmir, Rajasthan & more — priced from your nearest city.",
};

export default function TripsPage() {
  const settings = getSettings();
  const cities = getCities();
  const priced = getPricedCities();
  const live = getLivePackages();

  const packages: ExplorerPackage[] = live.map((p) => {
    const fromPrices: Record<string, number> = {};
    for (const c of priced) {
      const v = fromPrice(p.slug, c.slug);
      if (v) fromPrices[c.slug] = v;
    }
    return {
      slug: p.slug,
      name: p.name,
      destination: p.destination || p.route,
      nightsLabel: nightsLabel(p),
      image: packageImages(p)[0],
      fromPrices,
      citySlugs: Object.keys(fromPrices),
    };
  });

  const pkgBySlug = Object.fromEntries(packages.map((p) => [p.slug, p]));
  const departures: ExplorerDeparture[] = upcomingDepartures({ limit: 120 }).map((d) => ({
    date: d.date,
    packageSlug: d.package.slug,
    packageName: d.package.name,
    image: pkgBySlug[d.package.slug]?.image ?? packageImages(d.package)[0],
    citySlugs: d.cities.map((c) => c.slug),
    fromPrices: pkgBySlug[d.package.slug]?.fromPrices ?? {},
  }));

  /* the lab bands (each admin-toggleable in the Pages tab) */
  const boardingRows = departures.map((d) => ({
    date: d.date,
    slug: d.packageSlug,
    name: d.packageName,
    citySlugs: d.citySlugs,
    fromPrices: d.fromPrices,
  }));
  const atlasLabels = text("trips.atlas.labels").split("\n").map((l) => l.trim()).filter(Boolean);
  const atlasTiles = slot("atlas.tiles").map((img, i) => ({ img, label: atlasLabels[i] ?? `frame ${String(i + 1).padStart(2, "0")}` }));

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar />
      <main id="main" className="pt-16">
        <TripsExplorer
          packages={packages}
          departures={departures}
          showRack={sectionOn("trips", "rack")}
          showGrid={sectionOn("trips", "grid")}
        />
        {sectionOn("trips", "countdown") && boardingRows.length > 0 && (
          <FinalBoarding
            rows={boardingRows}
            headline={text("trips.countdown.headline")}
            accent={text("trips.countdown.accent")}
            sub={text("trips.countdown.sub")}
          />
        )}
        {sectionOn("trips", "wire") && (
          <BookingWire
            entries={getWire()}
            headline={text("trips.wire.headline")}
            accent={text("trips.wire.accent")}
            sub={text("trips.wire.sub")}
          />
        )}
        {sectionOn("trips", "atlas") && atlasTiles.length >= 6 && (
          <AtlasTable
            tiles={atlasTiles}
            headline={text("trips.atlas.headline")}
            accent={text("trips.atlas.accent")}
            sub={text("trips.atlas.sub")}
          />
        )}

        {/* BOARD FROM YOUR CITY — the /from/[city] pages existed but nothing on
            the site linked to them, so a crawler could only reach them through
            the sitemap and they never ranked for "group trips from <city>",
            which is the highest-intent query we have. Contextual links with the
            city's real name, rather than a footer strip of boilerplate. */}
        {priced.length > 0 && (
          <section className="border-t border-ink/10 bg-cream px-5 py-16 sm:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-brand">board where you live</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Departures from {priced.length} cities.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">
                Every trip below is priced from your nearest boarding point — no detour to Delhi
                to start a holiday.
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {priced.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/from/${c.slug}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                    >
                      Group trips from {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
