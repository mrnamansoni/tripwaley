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
  MediaBand,
  FeatureBlock,
  TrailMarkers,
  parsePromises,
  parseLines,
} from "@/components/site/TripTypeSections";
import { getCities, getSettings, slot, slotOne, text } from "@/lib/catalog";
import { buildTypeCards, categoryStats } from "@/lib/tripType";

export const metadata: Metadata = {
  title: "Solo trips — book one seat, land in a crew | Tripwaley",
  description:
    "Solo-friendly group trips across India with no single supplement. Roommates matched by age and gender, women-only rooms on request, and a captain on every batch.",
};

/* THE SOLO PAGE — the brave one.
   Runs dark end to end (the only page whose trip grid is on ink), so it reads
   like a night bus rather than a brochure. Gold is the single accent. */
export default function SoloPage() {
  const settings = getSettings();
  const cards = buildTypeCards("solo");
  const stats = categoryStats("solo");

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main>
        <TripTypeHero
          media={slotOne("solo.hero")}
          eyebrow={text("solo.eyebrow")}
          headline={text("solo.headline")}
          accent={text("solo.accent")}
          sub={text("solo.sub")}
          primaryLabel="Find my batch →"
          secondaryHref={settings.whatsappLink}
          secondaryLabel="Ask anything first"
          stats={[
            { value: `${stats.trips}`, label: "solo-friendly trips" },
            { value: "₹0", label: "single supplement" },
            { value: `${stats.cities}`, label: "boarding cities" },
          ]}
          theme={{
            scrim: heroScrim("linear-gradient(to top, rgba(26,22,20,0.42), rgba(26,22,20,0.10))"),
            eyebrow: "text-gold",
            accent: "text-gold",
            sub: "text-white/70",
            rule: "bg-gold",
            primaryBtn: "bg-gold text-ink hover:brightness-110",
            ghostBtn: "border-white/25 text-white hover:border-gold hover:text-gold",
          }}
        />

        <PromiseCards
          items={parsePromises(text("solo.promises"))}
          theme={{
            section: "bg-coal",
            card: "border border-white/10 bg-white/[0.04]",
            num: "text-gold/30",
            title: "text-white",
            detail: "text-white/55",
          }}
        />

        <TrailMarkers
          items={parseLines(text("solo.markers")).map((l) => {
            const [label = "", value = "", note = ""] = l.split("|").map((x) => x.trim());
            return { label, value, note };
          })}
        />

        <TripTypeGrid
          cards={cards}
          heading="Batches with"
          accentWord="a seat spare."
          rateLabel="per seat"
          emptyNote="Nothing matches that search right now — message us and we'll tell you which batch still has room."
          theme={{
            bg: "bg-ink",
            accent: "text-gold",
            titleHover: "text-white group-hover:text-gold",
            card: "border border-white/10 bg-white/[0.04] text-white",
            chip: "bg-black/55 text-white",
            switcher: "dark",
            headingCls: "text-white",
          }}
        />

        <FeatureBlock
          media={slotOne("solo.safety")}
          title={text("solo.safetyTitle")}
          items={parseLines(text("solo.safetyList"))}
          flip
          theme={{
            section: "bg-coal",
            heading: "text-white",
            item: "text-white/65",
            tick: "text-gold",
            card: "bg-white/5",
          }}
        />

        <MediaBand
          media={slot("solo.gallery")}
          eyebrow={text("solo.galleryEyebrow")}
          headline={text("solo.galleryHeadline")}
          accent={text("solo.galleryAccent")}
          theme={{
            section: "bg-ink",
            eyebrow: "text-gold",
            heading: "text-white",
            accent: "text-gold",
          }}
        />

        <CtaBand
          whatsappLink={settings.whatsappLink}
          title="One seat is all it takes."
          script="you'll know everyone by day two"
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
