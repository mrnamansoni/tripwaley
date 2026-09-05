import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { CtaBand } from "@/components/site/PageExtras";
import TripTypeGrid from "@/components/site/TripTypeGrid";
import {
  TripTypeHero,
  heroScrim,
  PromiseCards,
  ArchGallery,
  LoveNote,
  FeatureBlock,
  parsePromises,
  parseLines,
} from "@/components/site/TripTypeSections";
import { getCities, getSettings, holdRates, slot, slotOne, text } from "@/lib/catalog";
import { buildTypeCards, categoryStats } from "@/lib/tripType";

export const metadata: Metadata = {
  title: "Honeymoon packages — private, unhurried trips for two | Tripwaley",
  description:
    "Handpicked honeymoon trips across India. Private cabs, rooms chosen for the view, candlelit dinners and an itinerary with room to do nothing at all.",
};

/* THE HONEYMOON PAGE — the quiet one.
   Deliberately the inverse of the group page: light, airy, generous white
   space, script type and a rose wash over the hero instead of gold. Same
   locked brand palette, completely different temperature. */
export default function HoneymoonPage() {
  const settings = getSettings();
  const cards = buildTypeCards("honeymoon");
  const stats = categoryStats("honeymoon");

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        <TripTypeHero
          media={slotOne("honeymoon.hero")}
          eyebrow={text("honeymoon.eyebrow")}
          headline={text("honeymoon.headline")}
          accent={text("honeymoon.accent")}
          sub={text("honeymoon.sub")}
          primaryLabel="See the trips →"
          secondaryHref={settings.whatsappLink}
          secondaryLabel="Plan ours together"
          stats={[
            { value: `${stats.trips}`, label: "curated trips" },
            { value: "2", label: "seats. always." },
            { value: `${holdRates().holdPercent}%`, label: "to hold a seat" },
          ]}
          theme={{
            // a rose wash rather than gold — same brand red, different mood
            scrim: heroScrim("linear-gradient(to top, rgba(201,27,32,0.34), rgba(201,27,32,0.08))"),
            eyebrow: "text-blush",
            accent: "text-blush",
            sub: "text-white/75",
            rule: "bg-blush/70",
            primaryBtn: "bg-cream text-ink hover:bg-white",
            ghostBtn: "border-white/35 text-white hover:border-blush hover:text-blush",
          }}
        />

        <PromiseCards
          items={parsePromises(text("honeymoon.promises"))}
          theme={{
            section: "bg-blush",
            card: "border border-brand/12 bg-card shadow-card",
            num: "text-brand/20",
            title: "text-ink",
            detail: "text-ink/60",
          }}
        />

        <TripTypeGrid
          cards={cards}
          heading="Just the two"
          accentWord="of you."
          rateLabel="per couple"
          emptyNote="Nothing matches that search yet — tell us where you'd like to go and we'll build it around the two of you."
          theme={{
            bg: "bg-cream",
            accent: "text-brand",
            titleHover: "text-ink group-hover:text-brand",
            card: "border border-line bg-card text-ink",
            chip: "bg-brand/85 text-white",
            switcher: "light",
            headingCls: "text-ink",
          }}
        />

        <FeatureBlock
          media={slotOne("honeymoon.suite")}
          title={text("honeymoon.suiteTitle")}
          items={parseLines(text("honeymoon.suiteList"))}
          theme={{
            section: "bg-blush",
            heading: "text-ink",
            item: "text-ink/70",
            tick: "text-brand",
            card: "bg-card",
          }}
        />

        <ArchGallery
          media={slot("honeymoon.gallery")}
          eyebrow={text("honeymoon.galleryEyebrow")}
          headline={text("honeymoon.galleryHeadline")}
          accent={text("honeymoon.galleryAccent")}
          captions={parseLines(text("honeymoon.galleryCaptions"))}
        />

        <LoveNote quote={text("honeymoon.quote")} attribution={text("honeymoon.quoteBy")} />

        <CtaBand
          whatsappLink={settings.whatsappLink}
          title="Tell us the two of you. We'll plan the rest."
          script="congratulations, by the way"
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
