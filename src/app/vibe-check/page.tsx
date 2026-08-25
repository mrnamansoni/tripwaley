import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import VibeCheck from "@/components/sections/VibeCheck";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { CaptainsBand, CtaBand } from "@/components/site/PageExtras";
import { getCities, getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Vibe check — find your kind of trip | Tripwaley",
  description: "Answer honestly, travel accordingly — match your mood to a Tripwaley group departure.",
};

const TRIBES = [
  { t: "The Summit Chaser", d: "Wakes at 4 AM voluntarily. Owns gaiters. Talks about 'the push'.", goes: "Kedarkantha · Chopta · Kheerganga" },
  { t: "The Soft-Life Traveller", d: "Mountains yes, suffering no. Café research done before packing.", goes: "Manali · Jibhi · Kashmir" },
  { t: "The Aux-Cable Diplomat", d: "Here for the bus, the batch and the bonfire. The view is a bonus.", goes: "Rishikesh · Goa · Rajasthan" },
  { t: "The Disappearing Act", d: "Phone on airplane mode by the first dhaba. Returns 'different'.", goes: "Spiti · Tirthan · Star-gazing batches" },
];

export default function VibeCheckPage() {
  const settings = getSettings();
  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main className="bg-cream">
        {/* editorial opener */}
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">answer honestly, travel accordingly</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              The vibe <span className="text-gold">check.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              Every batch has a personality. So do you. The quiz below matches
              the two — and the tribes underneath tell you what you&apos;re signing up with.
            </p>
          </div>
        </section>

        <VibeCheck />

        {/* the four tribes */}
        <section className="bg-blush py-[9vh]">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Know your <span className="text-brand">tribe.</span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {TRIBES.map((t, i) => (
                <div key={t.t} className="group relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg sm:p-7">
                  <p aria-hidden="true" className="absolute -right-2 -top-6 font-display text-[5rem] font-extrabold text-ink/[0.05] transition-colors group-hover:text-gold/20">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="font-display text-2xl font-extrabold text-brand">{t.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{t.d}</p>
                  <p className="mt-3 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-gold">natural habitat: {t.goes}</p>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <CaptainsBand />
        <CtaBand
          whatsappLink={settings.whatsappLink}
          script="every tribe fits in one tempo traveller"
          title="Found your vibe? Board with it."
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
