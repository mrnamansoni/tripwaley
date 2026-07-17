import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import TripsExplorer, { type ExplorerPackage, type ExplorerDeparture } from "@/components/site/TripsExplorer";
import {
  getCities,
  getSettings,
  getLivePackages,
  getPricedCities,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
} from "@/lib/catalog";

export const metadata: Metadata = {
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

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar />
      <main className="pt-16">
        <TripsExplorer packages={packages} departures={departures} />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} announcement={settings.announcement} />
    </CityProvider>
  );
}
