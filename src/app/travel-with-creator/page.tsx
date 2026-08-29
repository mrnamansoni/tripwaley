import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import SiteMedia from "@/components/site/SiteMedia";
import { CtaBand } from "@/components/site/PageExtras";
import CreatorCalendar, { type CalendarDate } from "@/components/creator/CreatorCalendar";
import { CreatorRoster, HowItWorks, CreatorStrip } from "@/components/creator/CreatorSections";
import { getCities, getSettings, getCreators, creatorDates } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Travel with a creator — real trips, real seats | Tripwaley",
  description:
    "Book the same bus as the creators you follow. See who's travelling where and when, pick a date, and take a seat on the actual batch.",
};

/* THE HUB — a tour-dates poster, not a brochure.
   Creator collabs behave exactly like a music tour: an announced line-up,
   fixed dates, a finite number of seats per night. Leaning into that gives
   the page real urgency and a shape people already understand. */
export default function TravelWithCreatorPage() {
  const settings = getSettings();
  const creators = getCreators();
  const dates = creatorDates();

  const calendarDates: CalendarDate[] = dates.map(({ creator, date, view }) => ({
    creatorSlug: creator.slug,
    creatorName: creator.name,
    creatorFirst: creator.firstName,
    creatorHandle: creator.handle,
    avatar: creator.portrait,
    focal: creator.focal,
    accent: creator.accent,
    packageSlug: view.package.slug,
    packageName: view.headline,
    destination: view.package.destination || view.package.route,
    // every date links to the creator's page for THAT package
    href: `/travel-with/${creator.slug}/${view.package.slug}`,
    date: date.date,
    seats: date.seats,
    seatsLeft: date.seatsLeft,
    hook: date.hook,
    price: view.price,
  }));

  const dateCounts: Record<string, number> = {};
  for (const d of dates) dateCounts[d.creator.slug] = (dateCounts[d.creator.slug] ?? 0) + 1;

  const seatsLeft = dates.reduce((n, d) => n + d.date.seatsLeft, 0);
  const nextUp = dates[0];

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        {/* ---------------- hero: the line-up poster ---------------- */}
        <section className="relative overflow-hidden bg-ink pb-[8vh] pt-32 sm:pt-40">
          <div className="noise absolute inset-0" aria-hidden="true" />
          {/* a wash of the road behind the type */}
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.62]">
            <SiteMedia src="/images/tw-bus-roof.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(26,22,20,0.55) 0%, rgba(26,22,20,0.38) 38%, rgba(26,22,20,0.82) 76%, #1a1614 100%)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(26,22,20,0.78) 0%, rgba(26,22,20,0.45) 46%, rgba(26,22,20,0.12) 72%, rgba(26,22,20,0) 100%)" }}
          />

          <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.45em] text-gold">
              tripwaley presents · season 01
            </p>

            <h1 className="mt-5 font-display text-[3rem] font-extrabold leading-[0.9] tracking-tight text-white sm:text-[6rem] lg:text-[7.5rem]">
              Travel with
              <span className="block text-gold">your favourite</span>
              creator.
            </h1>

            <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-white/65 sm:text-base">
              Not a meet-and-greet. Not a giveaway. They book a seat on a real batch — and so do you.
              Same bus, same stays, same 2 AM dhaba stop.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="#dates"
                className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3 text-sm font-extrabold text-ink transition-all hover:brightness-110 active:scale-[0.98]"
              >
                See the tour dates →
              </Link>
              <Link
                href="#creators"
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
              >
                Meet the line-up
              </Link>
            </div>

            <div className="mt-12 border-t border-white/12 pt-7">
              <CreatorStrip creators={creators} />
            </div>

            {/* live counters — specific numbers, not marketing rounding */}
            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
              {[
                { v: String(dates.length), l: "dates on sale" },
                { v: String(seatsLeft), l: "seats still open" },
                {
                  v: nextUp
                    ? new Date(`${nextUp.date.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                    : "—",
                  l: "next departure",
                },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-extrabold tabular-nums text-white sm:text-4xl">{s.v}</span>
                    <span className="mt-0.5 block font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/45">{s.l}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------------- the calendar ---------------- */}
        <section id="dates" className="relative overflow-hidden bg-[#0d0b09] py-[10vh]">
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <CreatorCalendar dates={calendarDates} />
          </div>
        </section>

        <HowItWorks />

        <CreatorRoster creators={creators} dateCounts={dateCounts} />

        {/* ---------------- for creators ---------------- */}
        <section className="relative overflow-hidden bg-brand py-[11vh]">
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="font-script text-2xl text-white/80 sm:text-3xl">are you the creator?</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Bring your audience.<br />We&apos;ll drive the bus.
              </h2>
              <p className="mt-5 max-w-lg text-[0.95rem] leading-relaxed text-white/75">
                You pick the route and the dates. We handle permits, stays, transport, seat sales and the
                fifteen people asking whether they need trekking shoes. You get your own page like the
                ones above — yours to post, with your dates and your face on it.
              </p>
              <a
                href={settings.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-7 py-3 text-sm font-extrabold text-brand transition-transform hover:scale-[1.02]"
              >
                Pitch us a trip →
              </a>
            </div>
            <ul className="space-y-3">
              {[
                "You travel free on your own batch",
                "Revenue share per seat sold, paid after departure",
                "A page at tripwaley.com/travel-with/you",
                "We handle refunds, permits and the awkward questions",
              ].map((t) => (
                <li key={t} className="flex gap-3 rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                  <span aria-hidden="true" className="text-white/70">✦</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CtaBand
          whatsappLink={settings.whatsappLink}
          title="Somebody's batch leaves next week."
          script="go be in the video"
        />
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
