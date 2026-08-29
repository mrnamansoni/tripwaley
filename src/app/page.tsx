import Navbar from "@/components/sections/Navbar";
import TripMoments from "@/components/sections/TripMoments";
import MemoryArc from "@/components/sections/MemoryArc";
import CityProvider from "@/components/site/CityProvider";
import OpeningShot from "@/components/site/OpeningShot";
import DepartureBoard, { type BoardRow } from "@/components/site/DepartureBoard";
import DeckDestinations, { type DeckCard } from "@/components/site/DeckDestinations";
import PileUp, { type PileCard } from "@/components/site/PileUp";
import MomentumBreak from "@/components/site/MomentumBreak";
import DrumReviews from "@/components/site/DrumReviews";
import MagnetChant from "@/components/site/MagnetChant";
import CurtainFooter from "@/components/site/CurtainFooter";
import {
  getCities,
  getSettings,
  getLivePackages,
  getRichPackages,
  getPricedCities,
  getReviews,
  getGalleryPhotos,
  getMoments,
  text,
  upcomingDepartures,
  fromPrice,
  packageImages,
  nightsLabel,
  shortDate,
  slot,
  slotOne,
} from "@/lib/catalog";

/* pull a short scarcity chip out of the ops note, only if it actually reads scarce */
function scarcityChip(note: string): string {
  const first = note.split(/[\n.]/)[0]?.trim() ?? "";
  return /seat|limit|fill|few|last|book fast/i.test(first) ? first.slice(0, 34) : "";
}

export default function Home() {
  const settings = getSettings();
  const cities = getCities();
  const pricedCities = getPricedCities();
  const live = getLivePackages();
  const rich = getRichPackages();

  /* package → city → lowest seat price */
  const pricesByPkg: Record<string, Record<string, number>> = {};
  for (const p of live) {
    pricesByPkg[p.slug] = {};
    for (const c of pricedCities) {
      const v = fromPrice(p.slug, c.slug);
      if (v) pricesByPkg[p.slug][c.slug] = v;
    }
  }
  /* city → package → price (for the hero) */
  const pricesByCity: Record<string, Record<string, number>> = {};
  for (const c of pricedCities) {
    pricesByCity[c.slug] = {};
    for (const p of live) {
      const v = pricesByPkg[p.slug][c.slug];
      if (v) pricesByCity[c.slug][p.slug] = v;
    }
  }
  /* city → next departures (for the hero's live panel) */
  const depsByCity: Record<string, { date: string; name: string; slug: string }[]> = {};
  for (const c of cities) {
    depsByCity[c.slug] = upcomingDepartures({ citySlug: c.slug, limit: 3 }).map((d) => ({
      date: d.date,
      name: d.package.name,
      slug: d.package.slug,
    }));
  }

  /* the departure board */
  const boardRows: BoardRow[] = upcomingDepartures({ limit: 120 }).map((d) => ({
    date: d.date,
    packageSlug: d.package.slug,
    packageName: d.package.name,
    nightsLabel: nightsLabel(d.package),
    scarcity: scarcityChip(d.package.scarcityNote),
    citySlugs: d.cities.map((c) => c.slug),
    fromPrices: pricesByPkg[d.package.slug] ?? {},
    image: packageImages(d.package)[0],
  }));

  /* the deck — every sellable package */
  const deckCards: DeckCard[] = live
    .filter((p) => Object.keys(pricesByPkg[p.slug]).length > 0)
    .slice(0, 9)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      destination: p.destination,
      nightsLabel: nightsLabel(p),
      image: packageImages(p)[0],
      fromPrices: pricesByPkg[p.slug],
    }));

  /* the pile-up — four richest flagships */
  const pileCards: PileCard[] = rich.slice(0, 4).map((p) => {
    const next = upcomingDepartures({ packageSlug: p.slug, limit: 1 })[0];
    const line = (p.socialProof.split(/[\n!.]/)[0] || p.route || p.destination).trim().slice(0, 52);
    return {
      slug: p.slug,
      name: p.name,
      line: line.toLowerCase(),
      nightsLabel: nightsLabel(p),
      image: packageImages(p)[0],
      fromPrices: pricesByPkg[p.slug],
      nextDate: next ? shortDate(next.date) : undefined,
    };
  });

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        <OpeningShot
          departures={depsByCity}
          fromPrices={pricesByCity}
          heroBg={slotOne("hero.bg")}
          heroFilm={slot("hero.film")}
          heroBlinds={slotOne("hero.blinds")}
          whatsappLink={settings.whatsappLink}
          eyebrow={text("hero.eyebrow")}
          headline={text("hero.headline")}
          headlineAccent={text("hero.headlineAccent")}
          scrollCue={text("hero.scrollCue")}
          markWord={text("hero.markWord")}
          markSub={text("hero.markSub")}
        />
        <DepartureBoard
          rows={boardRows}
          whatsappLink={settings.whatsappLink}
          hook={text("rack.hook")}
          footnote={text("rack.footnote")}
        />
        <DeckDestinations cards={deckCards} eyebrow={text("deck.eyebrow")} />
        <PileUp cards={pileCards} />
        <MomentumBreak />
        <TripMoments moments={getMoments()} />
        <MemoryArc
          photos={getGalleryPhotos()}
          eyebrow={text("gallery.eyebrow")}
          headline={text("gallery.headline")}
          sub={text("gallery.sub")}
        />
        <section id="reviews">
          <DrumReviews
            reviews={getReviews()}
            eyebrow={text("drum.eyebrow")}
            headline={text("drum.headline")}
            headlineAccent={text("drum.headlineAccent")}
          />
        </section>
        <MagnetChant whatsappLink={settings.whatsappLink} />
      </main>
      <CurtainFooter
        whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp}
        announcement={settings.announcement}
        eyebrow={text("footer.eyebrow")}
        headline={text("footer.headline")}
        sub={text("footer.sub")}
        cue={text("footer.cue")}
      />
    </CityProvider>
  );
}
