import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import SiteMedia from "@/components/site/SiteMedia";
import {
  getCities,
  getSettings,
  upcomingDepartures,
  fromPrice,
  packageImages,
  shortDate,
  weekday,
  inr,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Page not found | Tripwaley",
  robots: { index: false, follow: true },
};

/* 404 — a recovery page, not a dead end.
 *
 * Trip links circulate in WhatsApp groups long after a batch retires, and a
 * few live slugs are misspelled, so this page gets real traffic from people
 * who wanted something specific. It offers the three soonest departures and a
 * way to reach a human rather than the stock Next.js message. */
export default function NotFound() {
  const settings = getSettings();
  const soon = upcomingDepartures({ limit: 3 });

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-16 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-4xl">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-gold">error 404 · wrong turn</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              This road doesn&apos;t<br /><span className="text-gold">go anywhere.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              The page you wanted has moved, been retired, or never existed. The batches below are still
              boarding — or ask us and we&apos;ll find what you were after.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/trips"
                className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright"
              >
                All departures →
              </Link>
              <a
                href={settings.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
              >
                Ask us on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {soon.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
            <p className="font-script text-2xl text-brand sm:text-3xl">since you&apos;re here</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-4xl">
              The next three batches out.
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-3">
              {soon.map((d) => {
                const price = fromPrice(d.package.slug);
                return (
                  <li key={`${d.package.slug}-${d.date}`}>
                    <Link
                      href={`/trips/${d.package.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-brand hover:shadow-card"
                    >
                      <div className="relative h-40 overflow-hidden bg-ink">
                        <SiteMedia
                          src={d.package.heroMedia || packageImages(d.package)[0]}
                          alt={`${d.package.name} — ${d.package.destination || d.package.route}`}
                          fill
                          sizes="(max-width:640px) 92vw, 30vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5">
                        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ink/45">
                          {weekday(d.date)} · {shortDate(d.date)}
                        </p>
                        <h3 className="mt-1.5 font-display text-lg font-extrabold leading-snug text-ink transition-colors group-hover:text-brand">
                          {d.package.name}
                        </h3>
                        {price != null && (
                          <p className="mt-2 font-display text-base font-extrabold text-brand">
                            {inr(price)}
                            <span className="ml-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink/40">/seat</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
