import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { CaptainsBand, SafetyBand, CtaBand } from "@/components/site/PageExtras";
import { getCities, getSettings, getLivePackages, getPricedCities, getFaqs, slotOne } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About Tripwaley — the crew behind the batches",
  description: "Multi-city group departures with trip captains, guaranteed batches and a community of 12,000+ wanderers. This is who runs it.",
};

export default function AboutPage() {
  const settings = getSettings();
  const FAQS = getFaqs();
  const stats = [
    { n: `${getLivePackages().length}+`, l: "live packages" },
    { n: `${getPricedCities().length}`, l: "boarding cities" },
    { n: "12,000+", l: "wanderers carried" },
    { n: "4.9★", l: "across google & instagram" },
  ];

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        {/* story */}
        <section className="bg-ink px-5 pb-16 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">the origin story, short version</p>
            <h1 className="mt-2 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              We got tired of trips
              <br />
              that <span className="text-gold">stayed in the chat.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
              Tripwaley exists because every friend group has one legendary trip
              that never leaves the group chat. We turned that into a machine:
              fixed dates, guaranteed batches, trip captains, and buses that
              board in your own city — not just Delhi.
            </p>
          </div>
        </section>

        {/* stats band */}
        <section className="bg-brand py-12">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-5 sm:grid-cols-4 sm:px-8">
            {stats.map((s) => (
              <div key={s.l} className="text-center sm:text-left">
                <p className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{s.n}</p>
                <p className="mt-1 text-[0.64rem] font-bold uppercase tracking-[0.25em] text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            How a batch <span className="text-brand">works.</span>
          </h2>
          <div className="mt-9 grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", t: "Pick & hold", d: "Choose a trip and date, hold your seat with a 40% advance — on the site or over WhatsApp. Takes about 90 seconds." },
              { n: "02", t: "Join the thread", d: "You're added to the batch's WhatsApp group with your captain. Packing lists, pickup points, playlists — all handled there." },
              { n: "03", t: "Just show up", d: "Board in your own city. Stays, transport, permits, chai stops — the captain runs it, you live it." },
            ].map((s) => (
              <div key={s.n} className="group relative overflow-hidden rounded-3xl border border-line bg-card p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg">
                <p aria-hidden="true" className="absolute -right-2 -top-6 font-display text-[5.5rem] font-extrabold text-ink/[0.05] transition-colors group-hover:text-gold/20">{s.n}</p>
                <p className="font-display text-2xl font-extrabold text-brand">{s.t}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <CaptainsBand />
        <SafetyBand />

        {/* the crew image band */}
        <section className="relative h-[52vh] overflow-hidden">
          <SiteMedia src={slotOne("about.crew")} alt="A Tripwaley batch in the mountains" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-ink/35" aria-hidden="true" />
          <p className="absolute inset-x-0 bottom-10 text-center font-script text-3xl text-white drop-shadow-lg sm:text-4xl">
            strangers on day one. this, by day six.
          </p>
        </section>

        {/* FAQs — refund policy lives here, lowkey */}
        <section id="faqs" className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
          <h2 className="text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            The 2 AM <span className="text-brand">questions.</span>
          </h2>
          <div className="mt-9 divide-y divide-line rounded-3xl border border-line bg-card shadow-sm">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group px-6 py-5 sm:px-8" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 font-display text-lg font-extrabold text-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/25 text-lg text-ink/50 transition-all duration-500 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-white" aria-hidden="true">+</span>
                  {f.q}
                </summary>
                <p className="mt-3 pl-12 text-[0.95rem] leading-relaxed text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <CtaBand
          whatsappLink={settings.whatsappLink}
          script="you've read enough"
          title="Come see who we are on a Tuesday at 4,000m."
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
