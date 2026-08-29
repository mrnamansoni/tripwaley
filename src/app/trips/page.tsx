import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import TripsExplorer, { type ExplorerPackage, type ExplorerDeparture } from "@/components/site/TripsExplorer";
import FinalBoarding from "@/components/site/FinalBoarding";
import BookingWire from "@/components/site/BookingWire";
import AtlasTable from "@/components/site/AtlasTable";
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
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
