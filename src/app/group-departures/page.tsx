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
  parsePromises,
} from "@/components/site/TripTypeSections";
import { getCities, getSettings, slot, slotOne, text } from "@/lib/catalog";
import { buildTypeCards, categoryStats } from "@/lib/tripType";

export const metadata: Metadata = {
  title: "Group departures — fixed-date trips across India | Tripwaley",
  description:
    "Guaranteed group departures with a certified trip captain, boarding from 10+ Indian cities. Stays, transport and permits handled — you just show up.",
};

/* THE GROUP PAGE — the loud one. Ink and gold, big type, batch energy. */
export default function GroupDeparturesPage() {
  const settings = getSettings();
  const cards = buildTypeCards("group");
  const stats = categoryStats("group");

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        <TripTypeHero
          media={slotOne("group.hero")}
          eyebrow={text("group.eyebrow")}
          headline={text("group.headline")}
          accent={text("group.accent")}
          sub={text("group.sub")}
          primaryLabel="See every batch →"
          secondaryHref={settings.whatsappLink}
          secondaryLabel="Ask on WhatsApp"
          stats={[
            { value: `${stats.trips}`, label: "live trips" },
            { value: `${stats.departures}`, label: "upcoming batches" },
            { value: `${stats.cities}`, label: "boarding cities" },
          ]}
          theme={{
            scrim: heroScrim("linear-gradient(to top, rgba(26,22,20,0.35), rgba(26,22,20,0.05))"),
            eyebrow: "text-gold",
            accent: "text-gold",
            sub: "text-white/70",
            rule: "bg-gold",
            primaryBtn: "bg-brand text-white shadow-red hover:bg-brand-bright",
            ghostBtn: "border-white/25 text-white hover:border-gold hover:text-gold",
          }}
        />

        <PromiseCards
          items={parsePromises(text("group.promises"))}
          theme={{
            section: "bg-ink",
            card: "border border-white/10 bg-white/[0.04]",
            num: "text-gold/30",
            title: "text-white",
            detail: "text-white/55",
          }}
        />

        <TripTypeGrid
          cards={cards}
          heading="Every batch,"
          accentWord="from your city."
          rateLabel="per seat"
          emptyNote="No group batches match that search — try another destination, or WhatsApp us and we'll make one exist."
          theme={{
            bg: "bg-cream",
            accent: "text-brand",
            titleHover: "text-ink group-hover:text-brand",
            card: "border border-line bg-card text-ink",
            chip: "bg-ink/60 text-white",
            switcher: "light",
            headingCls: "text-ink",
          }}
        />

        <MediaBand
          media={slot("group.strip")}
          eyebrow={text("group.stripEyebrow")}
          headline="Strangers at the"
          accent="boarding point."
          theme={{
            section: "bg-blush",
            eyebrow: "text-brand",
            heading: "text-ink",
            accent: "text-brand",
          }}
        />

        <CtaBand
          whatsappLink={settings.whatsappLink}
          title="Pick a date. We'll handle the rest."
          script="see you at the boarding point"
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
