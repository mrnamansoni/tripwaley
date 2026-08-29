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
  TrailMarkers,
  FeatureBlock,
  parsePromises,
  parseLines,
} from "@/components/site/TripTypeSections";
import { CollegeWall, CollegeSteps } from "@/components/site/CollegeSections";
import CollegeQuoteForm from "@/components/site/CollegeQuoteForm";
import { getCities, getSettings, getCollegeTrips, collegeStats, slot, slotOne, text } from "@/lib/catalog";
import { buildTypeCards, categoryStats } from "@/lib/tripType";

export const metadata: Metadata = {
  title: "College trips — batch tours priced per student | Tripwaley",
  description:
    "Farewell trips, industrial visits, adventure weeks and fest getaways for whole college batches. Per-student pricing, captains for every 20 students, and paperwork the college office actually accepts.",
};

/* THE COLLEGE PAGE — the loud one.
   Group departures sell a seat to a person; this sells a whole batch to a
   coordinator, so the page argues with numbers (students carried, captain
   ratio, repeat colleges) and proves itself with the wall of batches already
   run, before it ever shows a price. */
export default function CollegeTripsPage() {
  const settings = getSettings();
  const cards = buildTypeCards("college");
  const stats = categoryStats("college");
  const runs = getCollegeTrips();
  const cstats = collegeStats();

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        <TripTypeHero
          media={slotOne("college.hero")}
          eyebrow={text("college.eyebrow")}
          headline={text("college.headline")}
          accent={text("college.accent")}
          sub={text("college.sub")}
          primaryHref="#quote"
          primaryLabel="Get a quote →"
          secondaryHref={settings.whatsappLink}
          secondaryLabel="Talk to the college desk"
          stats={[
            { value: cstats.students ? `${cstats.students.toLocaleString("en-IN")}+` : `${stats.trips}`, label: "students carried" },
            { value: cstats.colleges ? `${cstats.colleges}` : `${stats.cities}`, label: "campuses" },
            { value: "1:20", label: "captain to student" },
          ]}
          theme={{
            scrim: heroScrim("linear-gradient(to top, rgba(26,22,20,0.46), rgba(26,22,20,0.12))"),
            eyebrow: "text-gold",
            accent: "text-gold",
            sub: "text-white/70",
            rule: "bg-gold",
            primaryBtn: "bg-brand text-white hover:bg-brand-bright",
            ghostBtn: "border-white/25 text-white hover:border-gold hover:text-gold",
          }}
        />

        <PromiseCards
          items={parsePromises(text("college.promises"))}
          theme={{
            section: "bg-coal",
            card: "border border-white/10 bg-white/[0.04]",
            num: "text-gold/30",
            title: "text-white",
            detail: "text-white/55",
          }}
        />

        <TrailMarkers
          items={parseLines(text("college.markers")).map((l) => {
            const [label = "", value = "", note = ""] = l.split("|").map((x) => x.trim());
            return { label, value, note };
          })}
        />

        <CollegeWall
          runs={runs}
          eyebrow="the batches already back"
          headline="Colleges that handed us"
          accent="their whole year."
        />

        <CollegeSteps title={text("college.stepsTitle")} steps={parsePromises(text("college.steps"))} />

        <TripTypeGrid
          cards={cards}
          rateLabel="per student"
          heading="Batch trips, costed"
          accentWord="per head."
          emptyNote="Fresh college routes are being costed — send us your batch size and we'll build one."
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
          media={slotOne("college.safety")}
          title={text("college.safetyTitle")}
          items={parseLines(text("college.safetyList"))}
          theme={{
            section: "bg-coal",
            heading: "text-white",
            item: "text-white/65",
            tick: "text-gold",
            card: "border border-white/10 bg-white/[0.04]",
          }}
        />

        <ArchGallery
          media={slot("college.gallery")}
          eyebrow={text("college.galleryEyebrow")}
          headline={text("college.galleryHeadline")}
          accent={text("college.galleryAccent")}
        />

        <CollegeQuoteForm
          title={text("college.formTitle")}
          sub={text("college.formSub")}
          whatsappLink={settings.whatsappLink}
        />

        <CtaBand
          whatsappLink={settings.whatsappLink}
          script="one bus, one batch"
          title="Send us your numbers. We'll send back three routes."
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
