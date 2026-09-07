import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { WeatherStrip, SeasonsBand, CtaBand } from "@/components/site/PageExtras";
import VideoReel from "@/components/site/VideoReel";
import ZodiacRing from "@/components/site/ZodiacRing";
import DayNightSeam from "@/components/site/DayNightSeam";
import AlbumWall from "@/components/site/AlbumWall";
import { getCities, getSettings, getLivePackages, getVideoTestimonial, sectionOn, slotOne, text, fromPrice, inr, nightsLabel, slot } from "@/lib/catalog";
import { canonical } from "@/lib/seo";
import { DESTINATIONS, destinationsFor } from "@/lib/destinations";

export const metadata: Metadata = {
  ...canonical("/destinations"),
  title: "Destinations — where the batches go | Tripwaley",
  description: "Himachal, Uttarakhand, Kashmir, Rajasthan, Goa — every region Tripwaley runs group departures to, with live packages and prices.",
};

/* The regions below are the visual grouping for this page. Which PACKAGES sit
   in each one now comes from lib/destinations.ts, because the old inline regex
   list silently dropped anything it didn't name — Kerala, Andaman and both
   Meghalaya trips appeared nowhere on this page at all. */
const REGIONS: { slug: string; name: string; tag: string; test: RegExp; image: string }[] = [
  { slug: "himachal", name: "Himachal", tag: "passes, parvati & pine", test: /manali|kasol|himachal|shimla|jibhi|tirthan|mcleod|triund|bir|spiti|parvati/i, image: "/images/himalaya-sunrise.jpg" },
  { slug: "uttarakhand", name: "Uttarakhand", tag: "treks, temples & tungnath", test: /kedarkantha|chopta|rishikesh|uttrakhand|kedarnath|flower|haridwar|dehradun/i, image: "/images/snowtrek.jpg" },
  { slug: "kashmir", name: "Kashmir", tag: "shikaras & snowlines", test: /kashmir|srinagar|gulmarg/i, image: "/images/kashmir.jpg" },
  { slug: "rajasthan", name: "Rajasthan", tag: "forts, folk & thalis", test: /udaipur|rajasthan|jodhpur|mount abu/i, image: "/images/rajasthan.jpg" },
  { slug: "goa", name: "Goa", tag: "the classic, done right", test: /goa/i, image: "/images/andaman.jpg" },
];

export default function DestinationsPage() {
  const settings = getSettings();
  const cities = getCities();
  const live = getLivePackages();

  const vt = getVideoTestimonial();
  const regionImgs = slot("destinations.regions");
  /* every destination that actually has a live trip — an empty landing page is
     worse than no link */
  const liveDestSlugs = new Set(
    DESTINATIONS.filter((d) => live.some((p) => destinationsFor(p).some((x) => x.slug === d.slug))).map((d) => d.slug)
  );
  const allDestPages = DESTINATIONS.filter((d) => liveDestSlugs.has(d.slug));

  const groups = REGIONS.map((r, i) => ({
    ...r,
    image: regionImgs[i] ?? r.image,
    packages: live.filter((p) => r.test.test(`${p.name} ${p.destination} ${p.route}`)),
    // destination landing pages that belong to this region, so the hub links
    // through to a real page rather than an on-page anchor
    pages: DESTINATIONS.filter(
      (d) => d.state.toLowerCase().includes(r.name.toLowerCase()) && liveDestSlugs.has(d.slug)
    ),
  })).filter((g) => g.packages.length > 0);

  const albumCaptions = text("dest.album.captions").split("\n").map((l) => l.trim()).filter(Boolean);
  const albumPhotos = slot("destinations.album").map((src, i) => ({ src, note: albumCaptions[i] ?? "" }));

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">pick a direction, we handle the rest</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Where the batches <span className="text-gold">go.</span>
            </h1>
          </div>
        </section>

        {sectionOn("destinations", "zodiac") && (
          <ZodiacRing
            items={groups.map((g) => ({ img: g.image, label: g.name, href: `#${g.slug}` }))}
            headline={text("dest.zodiac.headline")}
            accent={text("dest.zodiac.accent")}
            sub={text("dest.zodiac.sub")}
            ringText={text("dest.zodiac.ringText")}
          />
        )}

        {sectionOn("destinations", "regions") && groups.map((g, gi) => (
          <section key={g.slug} id={g.slug} className={`scroll-mt-24 py-[9vh] ${gi % 2 ? "bg-blush" : "bg-cream"}`}>
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
                {/* region marquee tile */}
                <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] shadow-card-lg">
                  <SiteMedia src={g.image} alt={g.name} fill sizes="(max-width:1024px) 92vw, 36vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-0 p-7">
                    <p className="font-script text-2xl text-gold">{g.tag}</p>
                    <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{g.name}</h2>
                    <p className="mt-1 text-[0.66rem] font-bold uppercase tracking-[0.3em] text-white/60">
                      {g.packages.length} live package{g.packages.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {/* its packages — swipeable rail on phones, grid from sm: up */}
                <div data-lenis-prevent className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:content-start sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
                  {g.packages.slice(0, 4).map((p) => {
                    const price = fromPrice(p.slug);
                    return (
                      <Link
                        key={p.slug}
                        href={`/trips/${p.slug}`}
                        className="group relative w-[74vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-card-lg sm:w-auto sm:shrink"
                      >
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/40">{nightsLabel(p)}</p>
                        <h3 className="mt-1.5 font-display text-xl font-extrabold leading-tight text-ink group-hover:text-brand">{p.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-ink/50">{p.destination || p.route}</p>
                        <p className="mt-3 font-display text-lg font-extrabold text-brand">{price ? `from ${inr(price)}` : "on request"}</p>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}

        {sectionOn("destinations", "daynight") && (
          <DayNightSeam
            day={slotOne("daynight.day")}
            night={slotOne("daynight.night")}
            dayLabel={text("dest.daynight.dayLabel")}
            nightLabel={text("dest.daynight.nightLabel")}
            headline={text("dest.daynight.headline")}
            accent={text("dest.daynight.accent")}
            sub={text("dest.daynight.sub")}
          />
        )}
        {sectionOn("destinations", "reel") && vt.enabled && <VideoReel vt={vt} />}
        {sectionOn("destinations", "album") && albumPhotos.length >= 3 && (
          <AlbumWall
            photos={albumPhotos}
            eyebrow={text("dest.album.eyebrow")}
            headline={text("dest.album.headline")}
            accent={text("dest.album.accent")}
            sub={text("dest.album.sub")}
          />
        )}
        {sectionOn("destinations", "weather") && <WeatherStrip />}
        {sectionOn("destinations", "seasons") && <SeasonsBand />}
        {sectionOn("destinations", "cta") && <CtaBand
          whatsappLink={settings.whatsappLink}
          script="fourteen states, one decision"
          title="Pick a direction. We pack the rest."
        />}

        {/* EVERY destination we run, each linking to its own landing page. The
            page previously offered only #anchors, so there was nothing for a
            crawler to follow and nothing built to rank for "<place> tour
            packages" — the head term in this market. */}
        {allDestPages.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.4em] text-brand">every destination</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {allDestPages.length} places we run batches to.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">
              Each one has its own page: what the trip is, when to go, how to get there, what it costs
              from your city, and which batches are currently on the board.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allDestPages.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/destinations/${d.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-card-lg"
                  >
                    <span className="font-display text-lg font-extrabold text-ink group-hover:text-brand">
                      {d.name} tour packages
                    </span>
                    <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink/40">{d.state}</span>
                    <span className="mt-2.5 text-[0.84rem] leading-relaxed text-ink/55">{d.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}
