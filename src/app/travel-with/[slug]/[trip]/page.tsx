import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import SiteMedia from "@/components/site/SiteMedia";
import CreatorFigure, { CreatorAvatar } from "@/components/creator/CreatorFigure";
import { ItineraryBeside, InOutFlank, PerksBand, InTheirWords } from "@/components/creator/CreatorSections";
import {
  getCities,
  getSettings,
  getCreators,
  getCreator,
  creatorTrip,
  creatorTrips,
  inr,
  shortDate,
  weekday,
  nightsLabel,
  normalizeMediaUrl,
} from "@/lib/catalog";

export function generateStaticParams() {
  return getCreators().flatMap((c) =>
    c.trips.filter((t) => t.published).map((t) => ({ slug: c.slug, trip: t.packageSlug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; trip: string }>;
}): Promise<Metadata> {
  const { slug, trip } = await params;
  const view = creatorTrip(slug, trip);
  if (!view) return {};
  const title = `${view.headline} with ${view.creator.firstName} | Tripwaley`;
  const description =
    view.trip.pitch?.trim() ||
    `${view.creator.name} (${view.creator.handle}) is on this batch. ${view.package.destination || view.package.route}. Real dates, real seats.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: normalizeMediaUrl(view.heroMedia) }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [normalizeMediaUrl(view.heroMedia)] },
  };
}

/* CREATOR × TRIP — the page a creator actually posts.
   One creator, one package: their framing of it, their dates, and the full
   itinerary and inclusions for THIS trip (which may differ from the public
   batch — a creator-led departure often adds their own sessions). */
export default async function CreatorTripPage({
  params,
}: {
  params: Promise<{ slug: string; trip: string }>;
}) {
  const { slug, trip } = await params;
  const view = creatorTrip(slug, trip);
  const creator = getCreator(slug);
  if (!view || !creator || !view.trip.published) notFound();

  const settings = getSettings();
  const otherTrips = creatorTrips({ creatorSlug: slug }).filter((t) => t.package.slug !== trip);

  const accentText = creator.accent === "brand" ? "text-brand" : "text-gold";
  const accentBg = creator.accent === "brand" ? "bg-brand" : "bg-gold";
  const accentOnBg = creator.accent === "brand" ? "text-white" : "text-ink";
  const soldOut = view.seatsLeft <= 0;

  const waLink = `${settings.whatsappLink}${settings.whatsappLink.includes("?") ? "&" : "?"}text=${encodeURIComponent(
    `Hi Tripwaley! I want a seat on ${view.headline} with ${creator.name} (${creator.handle}).`
  )}`;

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main>
        {/* ---------------- hero: the trip, fronted by the creator ------- */}
        <section className="relative overflow-hidden bg-ink pt-28 sm:pt-32">
          <div aria-hidden="true" className="absolute inset-0 opacity-30">
            <SiteMedia src={view.heroMedia} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(26,22,20,0.82), rgba(26,22,20,0.9) 55%, #1a1614 100%)" }}
          />
          <div className="noise absolute inset-0" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-7xl items-end gap-6 px-5 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="pb-10 lg:pb-16">
              <Link
                href={`/travel-with/${creator.slug}`}
                className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-gold"
              >
                ← all of {creator.firstName}&apos;s trips
              </Link>

              {/* who's leading it — the reason this page exists */}
              <div className="mt-6 flex items-center gap-3">
                <CreatorAvatar
                  src={creator.portrait}
                  focal={creator.focal}
                  alt={creator.name}
                  size={44}
                  ring={creator.accent === "brand" ? "ring-brand/70" : "ring-gold/70"}
                />
                <div>
                  <p className={`font-script text-xl ${accentText}`}>travel with {creator.firstName}</p>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-white/45">
                    {creator.handle} · {creator.socials[0]?.followers} followers
                  </p>
                </div>
              </div>

              <h1 className="mt-6 max-w-3xl font-display text-[2.6rem] font-extrabold leading-[0.92] tracking-tight text-white sm:text-[4.5rem]">
                {view.headline}
              </h1>

              {view.trip.pitch && (
                <p className="mt-4 max-w-xl font-script text-2xl leading-snug text-gold sm:text-3xl">
                  &ldquo;{view.trip.pitch}&rdquo;
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {[nightsLabel(view.package), view.package.destination || view.package.route, view.package.transport]
                  .filter(Boolean)
                  .map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-white/80"
                    >
                      {chip}
                    </span>
                  ))}
              </div>

              <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-3">
                {view.price != null && (
                  <div>
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-white/45">per seat</p>
                    <p className="mt-1 font-display text-4xl font-extrabold text-white sm:text-5xl">{inr(view.price)}</p>
                  </div>
                )}
                <div className="pb-1.5">
                  <p className={`font-display text-xl font-extrabold ${soldOut ? "text-white/45" : "text-gold"}`}>
                    {soldOut ? "Sold out" : `${view.seatsLeft} seats left`}
                  </p>
                  <p className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">
                    across {view.dates.length} {view.dates.length === 1 ? "date" : "dates"}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#dates"
                  className={`inline-flex min-h-12 items-center rounded-full px-7 py-3 text-sm font-extrabold transition-all hover:brightness-110 active:scale-[0.98] ${accentBg} ${accentOnBg}`}
                >
                  {soldOut ? "Join the waitlist →" : "Request a seat →"}
                </Link>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
                >
                  Ask {creator.firstName}
                </a>
              </div>
            </div>

            <div className="relative mx-auto h-[26rem] w-full max-w-[18rem] sm:h-[34rem] sm:max-w-[21rem] lg:h-[40rem] lg:max-w-none">
              <CreatorFigure
                cutout={view.figure("tripHero")}
                portrait={creator.portrait}
                focal={creator.focal}
                alt={creator.name}
                variant="hero"
                priority
                className="h-full w-full"
              />
            </div>
          </div>
        </section>

        {/* ---------------- the dates for THIS trip ---------------- */}
        <section id="dates" className="relative overflow-hidden bg-[#0d0b09] py-[10vh]">
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-gold">pick your batch</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {view.dates.length === 1 ? "One date." : `${view.dates.length} dates.`}{" "}
              <span className={accentText}>Same bus, same {creator.firstName}.</span>
            </h2>

            {view.dates.length === 0 ? (
              <p className="mt-8 max-w-md text-white/55">
                Every batch of this trip has left. Message us and we&apos;ll tell you when the next one opens.
              </p>
            ) : (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {view.dates.map((d) => {
                  const out = d.seatsLeft <= 0;
                  const filled = d.seats > 0 ? (d.seats - d.seatsLeft) / d.seats : 0;
                  const scarce = !out && d.seatsLeft <= Math.max(2, Math.round(d.seats * 0.25));
                  return (
                    <article
                      key={d.date}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#f4efe4] shadow-card-lg transition-transform duration-500 hover:-translate-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-dashed border-ink/25 p-5">
                        <div>
                          <p className="font-display text-3xl font-extrabold leading-none text-brand">{shortDate(d.date)}</p>
                          <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-ink/50">
                            {weekday(d.date)} · {nightsLabel(view.package)}
                          </p>
                        </div>
                        {out ? (
                          <span className="-rotate-6 rounded border-2 border-ink/45 px-2 py-0.5 font-display text-[0.6rem] font-extrabold uppercase tracking-widest text-ink/45">
                            sold out
                          </span>
                        ) : scarce ? (
                          <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-widest text-white">
                            {d.seatsLeft} left
                          </span>
                        ) : null}
                      </div>
                      <div className="relative h-0" aria-hidden="true">
                        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#0d0b09]" />
                        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#0d0b09]" />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        {d.hook && <p className="font-script text-lg leading-snug text-brand">&ldquo;{d.hook}&rdquo;</p>}
                        <div className="mt-4">
                          <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-widest text-ink/45">
                            <span>{out ? "waitlist only" : `${d.seatsLeft} of ${d.seats} left`}</span>
                            <span>{Math.round(filled * 100)}% gone</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/12">
                            <span
                              className={`block h-full rounded-full ${out ? "bg-ink/30" : scarce ? "bg-brand" : "bg-gold"}`}
                              style={{ width: `${Math.round(filled * 100)}%` }}
                            />
                          </div>
                        </div>
                        <a
                          href={`${waLink}%20(${encodeURIComponent(shortDate(d.date))})`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto block rounded-full bg-ink px-5 py-2.5 text-center text-xs font-extrabold text-cream transition-colors hover:bg-brand"
                        >
                          {out ? "Join waitlist" : "Request this seat →"}
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---------------- THIS trip's itinerary + inclusions ---------- */}
        {view.itinerary.length > 0 && (
          <ItineraryBeside
            creator={creator}
            figure={view.figure("itinerary")}
            packageName={view.headline}
            days={view.itinerary.map((d) => ({
              day: d.day,
              title: d.title,
              body: d.body,
              meals: d.meals,
              stay: d.stay,
            }))}
          />
        )}

        <InOutFlank creator={creator} figure={view.figure("inout")} inclusions={view.inclusions} exclusions={view.exclusions} />

        <PerksBand creator={creator} figure={view.figure("perks")} />

        <InTheirWords creator={creator} />

        {/* ---------------- their other trips ---------------- */}
        {otherTrips.length > 0 && (
          <section className="bg-cream py-[10vh]">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {creator.firstName}&apos;s other trips
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otherTrips.map((t) => (
                  <Link
                    key={t.package.slug}
                    href={`/travel-with/${creator.slug}/${t.package.slug}`}
                    className="group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SiteMedia
                        src={t.heroMedia}
                        alt={t.headline}
                        fill
                        sizes="(max-width:640px) 92vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-base font-extrabold leading-snug text-ink group-hover:text-brand">
                        {t.headline}
                      </h3>
                      <p className="mt-1 text-xs text-ink/50">
                        {t.dates.length} {t.dates.length === 1 ? "date" : "dates"}
                        {t.price != null ? ` · from ${inr(t.price)}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className={`relative overflow-hidden py-[11vh] ${accentBg}`}>
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className={`font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl ${accentOnBg}`}>
              {soldOut ? `This one's full.` : `${view.seatsLeft} seats. Then it's gone.`}
            </h2>
            <p className={`mt-4 font-script text-2xl sm:text-3xl ${creator.accent === "brand" ? "text-white/80" : "text-ink/65"}`}>
              {soldOut ? "get on the waitlist — people drop" : `${view.headline.toLowerCase()}, with ${creator.firstName}`}
            </p>
            <Link
              href="#dates"
              className={`mt-8 inline-flex min-h-12 items-center rounded-full px-8 py-3.5 text-sm font-extrabold transition-transform hover:scale-[1.02] ${
                creator.accent === "brand" ? "bg-white text-brand" : "bg-ink text-cream"
              }`}
            >
              {soldOut ? "Join the waitlist →" : "Pick a date →"}
            </Link>
          </div>
        </section>
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} announcement={settings.announcement} />
    </CityProvider>
  );
}
