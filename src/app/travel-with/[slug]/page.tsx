import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import AskCreator from "@/components/creator/AskCreator";
import SiteMedia from "@/components/site/SiteMedia";
import CreatorFigure from "@/components/creator/CreatorFigure";
import { PerksBand, InTheirWords, CreatorGallery, CreatorTripCards } from "@/components/creator/CreatorSections";
import { getCities, getSettings, getCreators, getCreator, creatorTrips, inr, minRate, shortDate, resolveFigure, normalizeMediaUrl } from "@/lib/catalog";
import { canonical } from "@/lib/seo";
import { personJsonLd, faqJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/schema";

export function generateStaticParams() {
  return getCreators().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCreator(slug);
  if (!c) return {};
  const title = `Travel with ${c.firstName} — ${c.name} × Tripwaley`;
  const description = `${c.tagline} Book a seat on ${c.firstName}'s actual batch: real dates, real trips, ${c.niche.toLowerCase()}.`;
  return {
    ...canonical(`/travel-with/${c.slug}`),
    title,
    description,
    openGraph: { title, description, images: [{ url: normalizeMediaUrl(c.cover) }], type: "profile" },
    twitter: { card: "summary_large_image", title, description, images: [normalizeMediaUrl(c.cover)] },
  };
}

/* THE CREATOR HUB — who they are, and every trip they run.
   Each trip gets its own page (see ./[trip]) because a trip is what a creator
   actually promotes: "come to Spiti with me", not "here is my profile". This
   page sells the person and routes to those. */
export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creator = getCreator(slug);
  if (!creator) notFound();

  const settings = getSettings();
  const trips = creatorTrips({ creatorSlug: slug });

  const startingFrom = minRate(...trips.map((t) => t.price));
  const seatsOpen = trips.reduce((n, t) => n + t.seatsLeft, 0);
  const dateCount = trips.reduce((n, t) => n + t.dates.length, 0);

  const accentText = creator.accent === "brand" ? "text-brand" : "text-gold";
  const accentBg = creator.accent === "brand" ? "bg-brand" : "bg-gold";
  const accentOnBg = creator.accent === "brand" ? "text-white" : "text-ink";

  const waLink = `${settings.whatsappLink}${settings.whatsappLink.includes("?") ? "&" : "?"}text=${encodeURIComponent(
    `Hi Tripwaley! I want to travel with ${creator.name} (${creator.handle}).`
  )}`;

  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main">
        {/* Person + FAQ, both built from what this page already renders: the
            creator's bio, portrait and socials, and the Q&A block below. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([
            personJsonLd({
              name: creator.name,
              slug: creator.slug,
              bio: creator.bio,
              portrait: creator.portrait,
              niche: creator.niche,
              socials: creator.socials,
            }),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Creators", path: "/travel-with-creator" },
              { name: creator.name, path: `/travel-with/${creator.slug}` },
            ]),
            ...(faqJsonLd(creator.qa ?? []) ? [faqJsonLd(creator.qa ?? [])!] : []),
          ]) }}
        />
        {/* ---------------- the poster ---------------- */}
        <section className="relative overflow-hidden bg-ink pt-28 sm:pt-32">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.62]">
            <SiteMedia src={creator.cover} alt="" fill priority sizes="100vw" className="object-cover" />
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
          <div className="noise absolute inset-0" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-7xl items-end gap-6 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="pb-10 lg:pb-20">
              <Link
                href="/travel-with-creator"
                className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-gold"
              >
                ← all creators
              </Link>

              <p className={`mt-7 font-script text-2xl sm:text-3xl ${accentText}`}>travel with</p>
              {creator.epithet && (
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.4em] text-white/45">{creator.epithet}</p>
              )}
              <h1 className="font-display text-[3.4rem] font-extrabold leading-[0.85] tracking-tight text-white sm:text-[7rem] lg:text-[8.5rem]">
                {creator.firstName}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-display text-lg font-extrabold text-white/85">{creator.name}</span>
                <span className={`font-mono text-xs tracking-wide ${accentText}`}>{creator.handle}</span>
                <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white/55">
                  {creator.city}
                </span>
              </div>

              <p className="mt-6 max-w-lg font-display text-xl font-extrabold leading-snug text-white/80 sm:text-2xl">
                {creator.tagline}
              </p>

              {startingFrom != null && (
                <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div>
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-white/45">trips from</p>
                    <p className="mt-1 font-display text-4xl font-extrabold text-white sm:text-5xl">
                      {inr(startingFrom)}
                      <span className="ml-2 align-middle font-mono text-[0.6rem] font-bold uppercase tracking-widest text-white/45">
                        per seat
                      </span>
                    </p>
                  </div>
                  {seatsOpen > 0 && (
                    <p className="pb-1.5 font-script text-xl text-gold">only {seatsOpen} seats across all trips</p>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-x-9 gap-y-4">
                {creator.socials.map((s) => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="group">
                    <span className="block font-display text-2xl font-extrabold tabular-nums text-white transition-colors group-hover:text-gold sm:text-3xl">
                      {s.followers}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/45">
                      {s.platform}
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#trips"
                  className={`inline-flex min-h-12 items-center rounded-full px-7 py-3 text-sm font-extrabold transition-all hover:brightness-110 active:scale-[0.98] ${accentBg} ${accentOnBg}`}
                >
                  {trips.length > 0
                    ? `See ${trips.length} trip${trips.length > 1 ? "s" : ""} · ${dateCount} dates →`
                    : "Talk to us →"}
                </Link>
              </div>
            </div>

            <div className="relative mx-auto h-[28rem] w-full max-w-[19rem] sm:h-[38rem] sm:max-w-[22rem] lg:h-[44rem] lg:max-w-none">
              <CreatorFigure
                cutout={resolveFigure(creator, "hero")}
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

        {/* ---------------- every trip they run ---------------- */}
        <CreatorTripCards
          creator={creator}
          trips={trips.map((t) => ({
            packageSlug: t.package.slug,
            headline: t.headline,
            pitch: t.trip.pitch,
            heroMedia: t.heroMedia,
            price: t.price,
            seatsLeft: t.seatsLeft,
            dateCount: t.dates.length,
            dateLabels: t.dates.slice(0, 5).map((d) => shortDate(d.date)),
          }))}
        />

        <PerksBand creator={creator} figure={resolveFigure(creator, "perks")} />

        <CreatorGallery creator={creator} />

        <InTheirWords creator={creator} />

        {/* ---------------- who they are ---------------- */}
        <section className="bg-cream py-[10vh]">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="font-script text-2xl text-brand sm:text-3xl">the short version</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
                Who you&apos;re actually<br />sharing a bus with.
              </h2>
              <p className="mt-5 font-mono text-[0.56rem] uppercase tracking-[0.3em] text-ink/40">
                {creator.niche} · based in {creator.city}
              </p>
            </div>
            <div className="whitespace-pre-line text-[0.98rem] leading-relaxed text-ink/70">{creator.bio}</div>
          </div>
        </section>

        <section className={`relative overflow-hidden py-[11vh] ${accentBg}`}>
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className={`font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl ${accentOnBg}`}>
              {seatsOpen > 0 ? `${seatsOpen} seats left with ${creator.firstName}.` : `Travel with ${creator.firstName}.`}
            </h2>
            <p className={`mt-4 font-script text-2xl sm:text-3xl ${creator.accent === "brand" ? "text-white/80" : "text-ink/65"}`}>
              they fill faster than you think
            </p>
            <Link
              href="#trips"
              className={`mt-8 inline-flex min-h-12 items-center rounded-full px-8 py-3.5 text-sm font-extrabold transition-transform hover:scale-[1.02] ${
                creator.accent === "brand" ? "bg-white text-brand" : "bg-ink text-cream"
              }`}
            >
              Pick a trip →
            </Link>
          </div>
        </section>
        {/* "Ask <creator>" — its own moment at the foot of the page, rather than
            an outline button competing with the hero CTA. */}
        <AskCreator
          firstName={creator.firstName}
          name={creator.name}
          handle={creator.handle}
          portrait={creator.portrait}
          waLink={waLink}
          accent={creator.accent}
        />

      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
