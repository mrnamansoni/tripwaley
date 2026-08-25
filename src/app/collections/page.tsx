import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import Collections from "@/components/sections/Collections";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { MonthsBand, SeasonsBand, CtaBand } from "@/components/site/PageExtras";
import { getCities, getSettings, getCollections } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collections — trips by mood | Tripwaley",
  description: "Snow, treks, parties, spiritual resets — Tripwaley group departures curated by the mood you're chasing.",
};

export default function CollectionsPage() {
  const settings = getSettings();
  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main className="bg-cream">
        {/* editorial opener */}
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">don&apos;t browse trips. browse moods.</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              The <span className="text-gold">collections.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              Snow chasers, trek addicts, party migrations, spiritual resets —
              every collection is a shelf of departures curated around one
              feeling. Pull the one that matches yours.
            </p>
          </div>
        </section>

        <Collections items={getCollections()} />
        <MonthsBand />
        <SeasonsBand />
        <CtaBand
          whatsappLink={settings.whatsappLink}
          script="still can't decide?"
          title="Tell us the mood. We'll name the mountain."
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
